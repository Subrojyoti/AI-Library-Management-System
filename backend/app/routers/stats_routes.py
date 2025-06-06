from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, text

from app.db.session import get_db
from app.models.book import Book
from app.models.student import Student
from app.models.book_issue import BookIssue

router = APIRouter()

@router.get("/collection")
async def get_collection_statistics(db: AsyncSession = Depends(get_db)):
    """
    Get statistics about the library collection:
    - Total number of books
    - Total number of registered students
    - Number of currently issued books
    """
    try:
        # Use direct SQL queries for more reliable results
        # Get total books count (sum of all copies)
        books_query = text("SELECT COALESCE(SUM(num_copies_total), 0) FROM books")
        books_result = await db.execute(books_query)
        total_books = books_result.scalar_one_or_none() or 0
        print(f"DEBUG: Total books count: {total_books}")
        
        # If total_books is 0, try counting the number of book records
        if total_books == 0:
            book_count_query = text("SELECT COUNT(*) FROM books")
            book_count_result = await db.execute(book_count_query)
            book_count = book_count_result.scalar_one_or_none() or 0
            print(f"DEBUG: Book count: {book_count}")
            
            # If there are books but sum is 0, use the count instead
            if book_count > 0:
                total_books = book_count
        
        # Get total students count
        students_query = text("SELECT COUNT(*) FROM students")
        students_result = await db.execute(students_query)
        total_students = students_result.scalar_one_or_none() or 0
        print(f"DEBUG: Total students count: {total_students}")
        
        # Get currently issued books count
        issued_query = text("SELECT COUNT(*) FROM book_issues WHERE is_returned = FALSE")
        issued_result = await db.execute(issued_query)
        currently_issued = issued_result.scalar_one_or_none() or 0
        print(f"DEBUG: Currently issued books count: {currently_issued}")
    except Exception as e:
        print(f"ERROR in statistics endpoint: {str(e)}")
        # Return default values in case of error
        return {
            "total_books": 0,
            "total_students": 0,
            "currently_issued": 0,
            "error": str(e)
        }
    
    return {
        "total_books": total_books,
        "total_students": total_students,
        "currently_issued": currently_issued
    }
