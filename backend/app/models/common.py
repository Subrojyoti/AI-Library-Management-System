from pydantic import BaseModel, ConfigDict
from datetime import datetime
from sqlalchemy import Integer, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column

class TimestampModel(BaseModel):
    created_at: datetime | None = None
    updated_at: datetime | None = None

class CoreModel(BaseModel):
    """Any common logic to be shared by all Pydantic models."""
    model_config = ConfigDict(populate_by_name=True)

class TableModelMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False) 