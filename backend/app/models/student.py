from sqlalchemy import String, Integer, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, TYPE_CHECKING

from backend.app.db.base_class import Base
from .common import TableModelMixin

if TYPE_CHECKING:
    from .book_issue import BookIssue

class Student(Base, TableModelMixin):
    __tablename__ = "students"

    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    roll_number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    department: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    phone: Mapped[str] = mapped_column(String(15), nullable=False, unique=True, index=True)
    email: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)

    issues: Mapped[List["BookIssue"]] = relationship("BookIssue", back_populates="student")

    __table_args__ = (
        UniqueConstraint('roll_number', name='uq_student_roll_number'),
        UniqueConstraint('phone', name='uq_student_phone'),
        UniqueConstraint('email', name='uq_student_email'),
    )

    def __repr__(self):
        return f"<Student(id={self.id}, name='{self.name}', roll_number='{self.roll_number}')>" 