from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload # For eager loading related book/student
from fastapi import HTTPException, status
from datetime import datetime, timedelta, date, timezone
from typing import List # For type hinting
from sqlalchemy import func

from backend.app.models.book_issue import BookIssue
from backend.app.models.book import Book # For updating num_copies_available
from backend.app.models.student import Student # For checking student existence
from backend.app.schemas.issue import BookIssueCreate
from backend.app.crud import crud_book, crud_student # To get book/student by id

DEFAULT_ISSUE_DAYS = 14 # Same as in schemas

async def create_book_issue(db: AsyncSession, issue_in: BookIssueCreate) -> BookIssue:
    """Issue a book to a student."""
    # 1. Check if student exists
    student = await crud_student.get_student(db, student_id=issue_in.student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student with ID {issue_in.student_id} not found.")

    # 2. Check if book exists
    book = await crud_book.get_book(db, book_id=issue_in.book_id)
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book with ID {issue_in.book_id} not found.")

    # 3. Check if num_copies_available > 0
    if book.num_copies_available <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Book '{book.title}' (ID: {book.id}) has no available copies.")

    # 4. Check if student already has this specific book issued and not returned
    existing_issue = await db.execute(
        select(BookIssue).filter_by(
            book_id=issue_in.book_id,
            student_id=issue_in.student_id,
            is_returned=False
        )
    )
    if existing_issue.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student (ID: {issue_in.student_id}) already has an active issue for Book '{book.title}' (ID: {book.id})."
        )
    
    # 5. Decrement num_copies_available in books table
    book.num_copies_available -= 1
    db.add(book) # Add to session for commit

    # 6. Create a new record in book_issues
    issue_date = datetime.now(timezone.utc)
    
    # Convert date to datetime with UTC timezone and zero time components
    if isinstance(issue_in.expected_return_date, date):
        # Create a date-only datetime with UTC timezone
        expected_return_date = datetime.combine(
            issue_in.expected_return_date, 
            datetime.min.time(),
            tzinfo=timezone.utc
        )
    else:
        # If no expected date provided, use default
        expected_return_date = (issue_date + timedelta(days=DEFAULT_ISSUE_DAYS))
        # Remove time components
        expected_return_date = datetime.combine(
            expected_return_date.date(),
            datetime.min.time(),
            tzinfo=timezone.utc
        )

    db_book_issue = BookIssue(
        book_id=issue_in.book_id,
        student_id=issue_in.student_id,
        issue_date=issue_date,
        expected_return_date=expected_return_date,
        is_returned=False
    )
    db.add(db_book_issue)
    
    try:
        await db.commit()
        await db.refresh(db_book_issue)
        # Eagerly load book and student for the response after commit
        # This ensures the relationships are populated for the BookIssueResponse schema
        result = await db.execute(
            select(BookIssue)
            .options(selectinload(BookIssue.book), selectinload(BookIssue.student))
            .filter(BookIssue.id == db_book_issue.id)
        )
        refreshed_issue_with_relations = result.scalar_one_or_none()
        if refreshed_issue_with_relations is None: # Should not happen if refresh worked
            raise HTTPException(status_code=500, detail="Failed to reload book issue with relations after creation.")
        return refreshed_issue_with_relations
    except Exception as e:
        await db.rollback() # Rollback changes to both book and book_issue table
        # Log the exception e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while issuing the book: {str(e)}"
        )

# Placeholder for other book_issue CRUD operations
async def get_book_issue_by_id(db: AsyncSession, issue_id: int) -> BookIssue | None:
    result = await db.execute(
        select(BookIssue)
        .options(selectinload(BookIssue.book), selectinload(BookIssue.student))
        .filter(BookIssue.id == issue_id)
    )
    return result.scalars().first()

async def return_book_issue(db: AsyncSession, issue_id: int) -> BookIssue:
    """Marks a book issue as returned and updates book copy count."""
    # 1. Fetch the book_issue record, including related book for updating num_copies
    db_issue = await db.execute(
        select(BookIssue)
        .options(selectinload(BookIssue.book), selectinload(BookIssue.student)) # Eager load student too for response
        .filter(BookIssue.id == issue_id)
    )
    issue_to_return = db_issue.scalars().first()

    if not issue_to_return:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Book issue with ID {issue_id} not found.")

    # 2. Handle "already returned"
    if issue_to_return.is_returned:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Book issue ID {issue_id} has already been returned.")

    # 3. Mark is_returned = true, set actual_return_date with UTC timezone
    issue_to_return.is_returned = True
    issue_to_return.actual_return_date = datetime.now(timezone.utc)

    # 4. Increment num_copies_available in the corresponding books table
    # Ensure the book relationship was loaded
    if not issue_to_return.book:
        # This should not happen if eager loading worked and FK is valid
        # As a fallback, fetch the book manually, though it's less efficient
        book_to_update = await crud_book.get_book(db, book_id=issue_to_return.book_id)
        if not book_to_update:
            # This indicates a data integrity issue if the book_id in issue is invalid
            # and wasn't caught by FK constraints (if they are deferred or not enforced)
            await db.rollback() # Rollback the change to is_returned
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                                detail=f"Book with ID {issue_to_return.book_id} related to issue ID {issue_id} not found. Cannot update copy count.")
    else:
        book_to_update = issue_to_return.book
    
    book_to_update.num_copies_available += 1
    # We should also check if num_copies_available exceeds num_copies_total, which would be an anomaly.
    if book_to_update.num_copies_available > book_to_update.num_copies_total:
        # This indicates a potential logic error or data inconsistency.
        # Decide on handling: cap it, log it, or raise an error.
        # For now, let's cap it and perhaps log a warning (logging not implemented here).
        print(f"Warning: num_copies_available ({book_to_update.num_copies_available}) for book ID {book_to_update.id} exceeded total ({book_to_update.num_copies_total}). Capping.")
        book_to_update.num_copies_available = book_to_update.num_copies_total

    db.add(issue_to_return) # Add updated issue to session
    db.add(book_to_update) # Add updated book to session

    try:
        await db.commit()
        await db.refresh(issue_to_return) # Refresh to get DB state
        # Re-fetch with relations for the response, as refresh might not populate them if not already loaded by this point for issue_to_return
        # or if the session state is complex after multiple adds.
        # The previous selectinload on the initial fetch of issue_to_return should ideally cover this.
        # If student/book are not populated, the BookIssueResponse model will show them as None.
        # To be absolutely sure for the response, explicitly load again:
        result = await db.execute(
            select(BookIssue)
            .options(selectinload(BookIssue.book), selectinload(BookIssue.student))
            .filter(BookIssue.id == issue_to_return.id)
        )
        final_issue_state = result.scalar_one_or_none()
        if final_issue_state is None:
             raise HTTPException(status_code=500, detail="Failed to reload book issue with relations after return.")
        return final_issue_state

    except Exception as e:
        await db.rollback()
        # Log the exception e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while returning the book: {str(e)}"
        )

async def get_active_issues_by_student_identifier(db: AsyncSession, identifier: str) -> List[BookIssue]:
    """Get all active (not returned) book issues for a student, identified by ID, roll number, email, or phone."""
    student: Student | None = None
    
    # 1. Identify student
    # Try to convert identifier to int for ID search first
    try:
        student_id_int = int(identifier)
        student = await crud_student.get_student(db, student_id=student_id_int)
    except ValueError:
        # Identifier is not an integer, try other fields
        pass # student remains None, will be handled below

    if not student:
        # If not found by ID or identifier was not an int, search by unique string fields
        student = await crud_student.get_student_by_unique_fields(db, roll_number=identifier, email=identifier, phone=identifier)

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with identifier '{identifier}' not found."
        )

    # 2. Query book_issues for active issues for that student, joining with books table
    stmt = (
        select(BookIssue)
        .join(BookIssue.book) # Ensure book details are loaded (can also use selectinload for separate query)
        .filter(BookIssue.student_id == student.id)
        .filter(BookIssue.is_returned == False) # Active issues only
        .options(selectinload(BookIssue.book), selectinload(BookIssue.student)) # Eager load for response
        .order_by(BookIssue.issue_date.desc()) # Optional: order by issue date
    )
    result = await db.execute(stmt)
    active_issues = result.scalars().all()
    return list(active_issues)

async def get_overdue_book_issues(db: AsyncSession) -> List[BookIssue]:
    """Get all active book issues that are overdue."""
    today = datetime.utcnow().date() # Use .date() for comparison with expected_return_date
    
    stmt = (
        select(BookIssue)
        .options(selectinload(BookIssue.book), selectinload(BookIssue.student))
        .filter(BookIssue.is_returned == False)
        # Only include books where the expected return date (converted to date) is earlier than today
        .filter(func.date(BookIssue.expected_return_date) < today) 
        .order_by(BookIssue.expected_return_date.asc())
    )
    result = await db.execute(stmt)
    overdue_issues = result.scalars().all()
    return list(overdue_issues)

async def get_due_soon_book_issues(db: AsyncSession, days_window: int = 5) -> List[BookIssue]:
    """Get all active book issues that are due from today up to `days_window` days from now."""
    today_utc = datetime.utcnow()
    # Ensure we are comparing date parts if needed, or full datetime if appropriate
    # Start of today (00:00:00 UTC)
    start_of_today = today_utc.replace(hour=0, minute=0, second=0, microsecond=0)
    # End of the Nth day from now (effectively start of N+1th day)
    end_date_utc = start_of_today + timedelta(days=days_window + 1)

    stmt = (
        select(BookIssue)
        .options(selectinload(BookIssue.book), selectinload(BookIssue.student))
        .filter(BookIssue.is_returned == False)
        .filter(BookIssue.expected_return_date >= start_of_today)
        .filter(BookIssue.expected_return_date < end_date_utc) 
        .order_by(BookIssue.expected_return_date.asc())
    )
    result = await db.execute(stmt)
    due_soon_issues = result.scalars().all()
    return list(due_soon_issues) 