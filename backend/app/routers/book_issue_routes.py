from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.schemas.issue import BookIssueCreate, BookIssueResponse
from backend.app import crud

router = APIRouter()

@router.post(
    "/",
    response_model=BookIssueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue a book",
    description="Create a new book issue record and decrement the available copies of the book.",
    tags=["Book Issues"]
)
async def issue_book(
    issue_in: BookIssueCreate,
    db: AsyncSession = Depends(get_db)
) -> BookIssueResponse:
    """
    Issue a book to a user.

    - **issue_in**: Book issue data.
    """
    created_issue = await crud.book_issue.create_book_issue(db=db, issue_in=issue_in)
    return created_issue

# Placeholder for other book issue routes 

@router.put(
    "/{issue_id}/return",
    response_model=BookIssueResponse,
    status_code=status.HTTP_200_OK,
    summary="Return a book",
    description="Mark a book issue as returned and increment the available copies of the book.",
    tags=["Book Issues"]
)
async def return_issued_book(
    issue_id: int,
    db: AsyncSession = Depends(get_db)
) -> BookIssueResponse:
    """
    Return a previously issued book.

    - **issue_id**: ID of the book issue record to mark as returned.
    """
    # The crud_book_issue.return_book_issue function handles:
    # - Fetching the issue
    # - Checking if it exists and is not already returned (raises HTTPException if so)
    # - Updating is_returned, actual_return_date
    # - Incrementing book.num_copies_available
    # - Committing changes
    # - Returning the updated BookIssue object with eager loaded relations
    returned_issue = await crud.book_issue.return_book_issue(db=db, issue_id=issue_id)
    return returned_issue
