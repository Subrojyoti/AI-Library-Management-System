from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func
from fastapi import HTTPException, status

from app.models.book import Book
from app.schemas.book import BookCreate, BookUpdate

async def get_book_by_isbn(db: AsyncSession, isbn: str) -> Book | None:
    result = await db.execute(select(Book).filter(Book.isbn == isbn))
    return result.scalars().first()

async def create_book(db: AsyncSession, book_in: BookCreate) -> Book:
    """Create a new book in the database."""
    # Check for ISBN uniqueness before attempting to create
    existing_book = await get_book_by_isbn(db, isbn=book_in.isbn)
    if existing_book:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Book with ISBN {book_in.isbn} already exists."
        )

    # If num_copies_available is not provided, set it to num_copies_total
    num_available = book_in.num_copies_available if book_in.num_copies_available is not None else book_in.num_copies_total
    
    db_book = Book(
        title=book_in.title,
        author=book_in.author,
        isbn=book_in.isbn,
        num_copies_total=book_in.num_copies_total,
        num_copies_available=num_available, # Use the determined value
        category=book_in.category
    )
    db.add(db_book)
    try:
        await db.commit()
        await db.refresh(db_book)
    except IntegrityError as e:
        await db.rollback()
        # This is a fallback, primary check is get_book_by_isbn
        if "uq_book_isbn" in str(e.orig) or "books_isbn_key" in str(e.orig):
             raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Book with ISBN {book_in.isbn} already exists (database constraint)."
            )
        # Handle other potential integrity errors if necessary
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected database error occurred: {str(e.orig)}"
        )
    return db_book

# Placeholder for other CRUD functions (get, get_multi, update, delete)
async def get_book(db: AsyncSession, book_id: int) -> Book | None:
    result = await db.execute(select(Book).filter(Book.id == book_id))
    return result.scalars().first()

async def get_books(
    db: AsyncSession, skip: int = 0, limit: int = 100, 
    book_id: int | None = None,
    title: str | None = None, author: str | None = None, category: str | None = None,
    isbn: str | None = None
) -> tuple[list[Book], int]:
    query = select(Book)
    count_query = select(func.count()).select_from(Book)

    if book_id:
        query = query.filter(Book.id == book_id)
        count_query = count_query.filter(Book.id == book_id)
    if title:
        query = query.filter(Book.title.ilike(f"%{title}%"))
        count_query = count_query.filter(Book.title.ilike(f"%{title}%"))
    if author:
        query = query.filter(Book.author.ilike(f"%{author}%"))
        count_query = count_query.filter(Book.author.ilike(f"%{author}%"))
    if category:
        query = query.filter(Book.category.ilike(f"%{category}%"))
        count_query = count_query.filter(Book.category.ilike(f"%{category}%"))
    if isbn:
        # Use exact matching for ISBN (after removing hyphens) since ISBN is a unique identifier
        query = query.filter(Book.isbn == isbn)
        count_query = count_query.filter(Book.isbn == isbn)

    total_books_result = await db.execute(count_query)
    total_books = total_books_result.scalar_one_or_none() or 0

    query = query.offset(skip).limit(limit).order_by(Book.id)
    books_result = await db.execute(query)
    books = books_result.scalars().all()
    return list(books), total_books

async def update_book(db: AsyncSession, db_book: Book, book_in: BookUpdate) -> Book:
    update_data = book_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_book, field, value)
    
    # Special handling if num_copies_total is updated, ensure num_copies_available is valid
    if 'num_copies_total' in update_data and 'num_copies_available' not in update_data:
        # If total changes and available is not being set, adjust available if it exceeds new total
        if db_book.num_copies_available > db_book.num_copies_total:
            db_book.num_copies_available = db_book.num_copies_total
    elif 'num_copies_total' in update_data and 'num_copies_available' in update_data:
        # If both are set, ensure available is not more than total
        if db_book.num_copies_available > db_book.num_copies_total:
             db_book.num_copies_available = db_book.num_copies_total # Or raise error

    db.add(db_book)
    await db.commit()
    await db.refresh(db_book)
    return db_book

async def delete_book(db: AsyncSession, book_id: int) -> Book | None:
    db_book = await get_book(db, book_id=book_id)
    if not db_book:
        return None
    await db.delete(db_book)
    await db.commit()
    return db_book 