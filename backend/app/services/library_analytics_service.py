from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select, text
from datetime import datetime, timedelta, date as py_date
import logging

from app.models.book import Book
from app.models.student import Student
from app.models.book_issue import BookIssue

logger = logging.getLogger(__name__)

class LibraryAnalyticsService:
    async def get_overdue_books_count(self, db: AsyncSession) -> int:
        """Gets the total number of books that are currently overdue."""
        today = py_date.today()
        stmt = select(func.count(BookIssue.id)).filter(
            BookIssue.is_returned == False,
            BookIssue.expected_return_date < today
        )
        result = await db.execute(stmt)
        count = result.scalar_one_or_none()
        return count if count is not None else 0

    async def get_department_with_most_borrows_last_month(self, db: AsyncSession) -> dict:
        """Identifies the department that borrowed the most books in the last calendar month."""
        today = py_date.today()
        first_day_current_month = today.replace(day=1)
        last_day_last_month = first_day_current_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)

        logger.info(f"Calculating most borrows for period: {first_day_last_month} to {last_day_last_month}")

        stmt = (
            select(Student.department, func.count(BookIssue.id).label("borrow_count"))
            .join(Student, BookIssue.student_id == Student.id)
            .filter(BookIssue.issue_date >= first_day_last_month)
            .filter(BookIssue.issue_date <= last_day_last_month)
            .group_by(Student.department)
            .order_by(func.count(BookIssue.id).desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        record = result.first()
        
        if record and record.department:
            return {"department": record.department, "borrow_count": record.borrow_count}
        elif record and not record.department:
            return {"department": "Unknown/Not Specified", "borrow_count": record.borrow_count}
        return {"department": "No borrows", "borrow_count": 0}

    async def get_new_books_added_this_week_count(self, db: AsyncSession) -> int:
        """Gets the total number of new books added to the library in the current week (Monday to Sunday)."""
        today = py_date.today()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        end_of_week = start_of_week + timedelta(days=6)  # Sunday
        
        logger.info(f"Calculating new books for week: {start_of_week} to {end_of_week}")

        stmt = select(func.count(Book.id)).filter(
            func.date(Book.created_at) >= start_of_week,
            func.date(Book.created_at) <= end_of_week
        )
        result = await db.execute(stmt)
        count = result.scalar_one_or_none()
        return count if count is not None else 0

library_analytics_service = LibraryAnalyticsService() 