# backend/app/schemas/issue.py
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime, date, timedelta

from .book import BookResponse # To nest book details
from .student import StudentResponse # To nest student details

class BookIssueBase(BaseModel):
    book_id: int = Field(..., example=1)
    student_id: int = Field(..., example=1)
    expected_return_date: date = Field(..., example=str(date.today() + timedelta(days=14)))

class BookIssueCreate(BookIssueBase):
    pass

class BookIssueUpdate(BaseModel):
    is_returned: Optional[bool] = None
    actual_return_date: Optional[date] = None

class BookIssueInDBBase(BookIssueBase):
    id: int
    issue_date: datetime
    actual_return_date: Optional[datetime] = None
    is_returned: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BookIssueResponse(BookIssueInDBBase):
    is_overdue: Optional[bool] = Field(default=None, description="True if the book is overdue and not returned") # Changed from None to default=None
    book: Optional[BookResponse] = None
    student: Optional[StudentResponse] = None

    @model_validator(mode='after')
    def calculate_is_overdue_root(self) -> 'BookIssueResponse':
        if not self.is_returned and self.expected_return_date:
            expected_dt = self.expected_return_date # This is a date object from BookIssueBase
            # No conversion needed if expected_return_date is already a date object.
            self.is_overdue = expected_dt < date.today()
        else:
            self.is_overdue = False
        return self

# For paginated list response
class BookIssuePage(BaseModel):
    items: list[BookIssueResponse]
    total: int
    page: int
    limit: int
    pages: int 