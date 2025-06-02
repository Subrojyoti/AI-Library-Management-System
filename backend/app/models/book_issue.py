from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import datetime

from app.db.base_class import Base

class BookIssue(Base):
    __tablename__ = "book_issues"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    
    issue_date = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    expected_return_date = Column(DateTime(timezone=True), nullable=False)
    actual_return_date = Column(DateTime(timezone=True), nullable=True)
    is_returned = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships (optional, but useful for ORM queries)
    book = relationship("Book") # Assuming Book model is in global scope or imported correctly
    student = relationship("Student") # Assuming Student model is in global scope or imported

    @property
    def is_overdue(self) -> bool:
        # Ensure expected_return_date is timezone-aware if comparing with timezone-aware today,
        # or make sure comparison is consistent (e.g., both naive or both UTC)
        # For simplicity here, assuming expected_return_date is stored as UTC and comparing with today's date UTC.
        # If expected_return_date is naive, datetime.date.today() is also naive.
        # Let's assume datetime.utcnow().date() for consistent comparison with UTC stored dates.
        if self.is_returned:
            return False
        # Compare date parts only
        return self.expected_return_date.date() < datetime.date.today()

    __table_args__ = (
        Index('ix_book_issues_book_student_is_returned', "book_id", "student_id", "is_returned"),
    )

    def __repr__(self):
        return f"<BookIssue(id={self.id}, book_id={self.book_id}, student_id={self.student_id}, is_returned={self.is_returned})>" 