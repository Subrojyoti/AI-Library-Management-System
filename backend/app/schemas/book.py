from pydantic import BaseModel, constr, Field
from datetime import datetime
from typing import Optional

from app.models.common import CoreModel, TimestampModel # MODIFIED

# 2.2.1. BookBase: Common fields
class BookBase(CoreModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=100)
    isbn: constr(min_length=10, max_length=20) # ISBN-10 or ISBN-13
    num_copies_total: int = Field(..., gt=0) # Must be greater than 0
    num_copies_available: int | None = None # Optional, can be derived or set same as total on creation
    category: Optional[str] = Field(None, max_length=50)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "The Hitchhiker's Guide to the Galaxy",
                    "author": "Douglas Adams",
                    "isbn": "9780345391803",
                    "num_copies_total": 5,
                    "num_copies_available": 5,
                    "category": "Science Fiction"
                }
            ]
        }
    }

# 2.2.2. BookCreate (inherits BookBase): For request body when adding a book
class BookCreate(BookBase):
    # num_copies_available can be set to num_copies_total by default if not provided
    # No extra fields needed for creation beyond BookBase currently
    pass

# 2.2.3. BookUpdate (inherits BookBase, all fields optional): For request body when updating
class BookUpdate(CoreModel): # Not inheriting BookBase to make all fields truly optional
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=100)
    # ISBN is unique and typically not updated. If it needs to be, careful consideration is needed.
    # isbn: Optional[constr(min_length=10, max_length=20)] = None 
    num_copies_total: Optional[int] = Field(None, gt=0)
    num_copies_available: Optional[int] = Field(None, ge=0) # Can be 0
    category: Optional[str] = Field(None, max_length=50)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "title": "The Restaurant at the End of the Universe",
                    "num_copies_available": 3
                }
            ]
        }
    }

# 2.2.4. BookResponse (inherits BookBase, includes id): For API responses
class BookResponse(BookBase, TimestampModel): # TimestampModel adds created_at, updated_at
    id: int

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "title": "The Hitchhiker's Guide to the Galaxy",
                    "author": "Douglas Adams",
                    "isbn": "9780345391803",
                    "num_copies_total": 5,
                    "num_copies_available": 5,
                    "category": "Science Fiction",
                    "created_at": "2023-01-01T10:00:00Z",
                    "updated_at": "2023-01-01T10:00:00Z"
                }
            ]
        }
    }

class BookListResponse(BaseModel):
    books: list[BookResponse]
    total: int
    page: int
    limit: int 