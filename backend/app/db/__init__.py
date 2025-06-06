# This file makes 'db' a Python package 

# Import Base from base_class.py so it's accessible via backend.app.db.Base
from .base_class import Base

# Import all models here to ensure they are registered with Base.metadata
# as soon as the 'backend.app.db' package is imported.
# This helps in centralizing model registration.
from app.models.book import Book # noqa
from app.models.student import Student # noqa
from app.models.book_issue import BookIssue # noqa

# You can also make engine and SessionLocal available through backend.app.db
# from .database import engine, AsyncSessionLocal, create_db_and_tables # Optional convenience
# from .session import get_db # Optional convenience

__all__ = [
    "Base",
    "Book",
    "Student",
    "BookIssue",
    # "engine", # Uncomment if you want to re-export
    # "AsyncSessionLocal", # Uncomment if you want to re-export
    # "create_db_and_tables", # Uncomment if you want to re-export
    # "get_db", # Uncomment if you want to re-export
] 