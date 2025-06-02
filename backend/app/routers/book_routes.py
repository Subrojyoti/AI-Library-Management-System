from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.book import BookCreate, BookResponse, BookUpdate, BookListResponse
from app.crud import crud_book

router = APIRouter()

@router.post(
    "/", 
    response_model=BookResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Add a new book",
    description="Add a new book to the library. ISBN must be unique.",
    tags=["Books"]
)
async def add_new_book(
    *, 
    db: AsyncSession = Depends(get_db),
    book_in: BookCreate
) -> BookResponse:
    created_book = await crud_book.create_book(db=db, book_in=book_in)
    return created_book

@router.put(
    "/{book_id}", 
    response_model=BookResponse, 
    summary="Update an existing book",
    description="Update details of an existing book by its ID. Fields not provided will remain unchanged.",
    tags=["Books"]
)
async def update_existing_book(
    *, 
    db: AsyncSession = Depends(get_db),
    book_id: int,
    book_in: BookUpdate
) -> BookResponse:
    db_book = await crud_book.get_book(db=db, book_id=book_id)
    if not db_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if book_in.model_dump(exclude_unset=True, exclude_none=True) == {}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No fields provided for update."
        )
    updated_book = await crud_book.update_book(db=db, db_book=db_book, book_in=book_in)
    return updated_book

@router.delete(
    "/{book_id}", 
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a book by ID",
    description="Permanently delete a book from the system by its ID. This action is irreversible.",
    tags=["Books"]
)
async def remove_book(
    *, 
    db: AsyncSession = Depends(get_db),
    book_id: int
):
    deleted_book = await crud_book.delete_book(db=db, book_id=book_id)
    if not deleted_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return

@router.get(
    "/{book_id}", 
    response_model=BookResponse, 
    summary="Get a specific book by ID",
    description="Retrieve detailed information for a specific book using its ID.",
    tags=["Books"]
)
async def get_specific_book(
    *, 
    db: AsyncSession = Depends(get_db),
    book_id: int
) -> BookResponse:
    db_book = await crud_book.get_book(db=db, book_id=book_id)
    if not db_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return db_book

@router.get(
    "/", 
    response_model=BookListResponse, 
    summary="List all books with filtering and pagination",
    description="Retrieve a list of books. Supports filtering by title, author, category, book ID, and pagination.",
    tags=["Books"]
)
async def list_all_books(
    db: AsyncSession = Depends(get_db),
    book_id: Optional[int] = Query(None, description="Filter by book ID (exact match)"),
    title: Optional[str] = Query(None, description="Filter by book title (case-insensitive, partial match)"),
    author: Optional[str] = Query(None, description="Filter by author name (case-insensitive, partial match)"),
    category: Optional[str] = Query(None, description="Filter by category (case-insensitive, partial match)"),
    isbn: Optional[str] = Query(None, description="Filter by ISBN (case-insensitive, partial match)"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page")
) -> BookListResponse:
    """
    List books with optional filters and pagination.

    - **book_id**: Filter by exact book ID (optional).
    - **title**: Filter by title (optional).
    - **author**: Filter by author (optional).
    - **category**: Filter by category (optional).
    - **isbn**: Filter by ISBN (optional).
    - **page**: Page number (default 1).
    - **limit**: Items per page (default 10, max 100).
    """
    # Add logging to debug search parameters
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Search parameters: book_id={book_id}, title={title}, author={author}, category={category}, isbn={isbn}")
    
    skip = (page - 1) * limit
    books, total_books = await crud_book.get_books(
        db=db, skip=skip, limit=limit, book_id=book_id, title=title, author=author, category=category, isbn=isbn
    )
    
    # Log the number of books found
    logger.info(f"Found {total_books} books matching the search criteria")
    return BookListResponse(books=books, total=total_books, page=page, limit=limit)
