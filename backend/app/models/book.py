from sqlalchemy import String, Integer, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, TYPE_CHECKING

from backend.app.db.base_class import Base
from .common import TableModelMixin

if TYPE_CHECKING:
    from .book_issue import BookIssue

class Book(Base, TableModelMixin):
    __tablename__ = "books"

    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    isbn: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    num_copies_total: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    num_copies_available: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    category: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)

    issues: Mapped[List["BookIssue"]] = relationship("BookIssue", back_populates="book")

    __table_args__ = (UniqueConstraint('isbn', name='uq_book_isbn'),)

    def __repr__(self):
        return f"<Book(id={self.id}, title='{self.title}', isbn='{self.isbn}')>" 