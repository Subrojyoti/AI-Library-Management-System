# This file makes 'models' a Python package 

# Import models to ensure they're registered with SQLAlchemy
from app.models.book import Book
from app.models.student import Student
from app.models.book_issue import BookIssue  # This is our primary BookIssue model

# Note: There are two files defining the BookIssue model:
# - book_issue.py (this is the primary one we use)
# - issue.py (this is a duplicate and should be removed or refactored)

__all__ = [
    "Book",
    "Student",
    "BookIssue"
] 