from pydantic import BaseModel, EmailStr, Field, constr
from typing import Optional

from backend.app.models.common import CoreModel, TimestampModel

# 3.2.1. StudentBase
class StudentBase(CoreModel):
    name: str = Field(..., min_length=1, max_length=100)
    roll_number: constr(min_length=1, max_length=20)
    department: str = Field(..., min_length=1, max_length=50)
    semester: int = Field(..., gt=0, le=12) # Assuming a reasonable semester range
    phone: constr(min_length=7, max_length=15) # Basic phone number validation
    email: EmailStr

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "name": "Jane Doe",
                    "roll_number": "CSE2024001",
                    "department": "Computer Science",
                    "semester": 3,
                    "phone": "+11234567890",
                    "email": "jane.doe@example.com"
                }
            ]
        }
    }

# 3.2.2. StudentCreate
class StudentCreate(StudentBase):
    # No extra fields needed for creation beyond StudentBase currently
    pass

# 3.2.3. StudentUpdate
class StudentUpdate(CoreModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    # roll_number is unique and typically not updated. 
    # department: Optional[str] = Field(None, min_length=1, max_length=50)
    # semester: Optional[int] = Field(None, gt=0, le=12)
    # phone: Optional[constr(min_length=7, max_length=15)] = None 
    # email: Optional[EmailStr] = None
    # Allowing only some fields to be updated for simplicity, can be expanded
    department: Optional[str] = Field(None, min_length=1, max_length=50)
    semester: Optional[int] = Field(None, gt=0, le=12) 
    phone: Optional[constr(min_length=7, max_length=15)] = None
    email: Optional[EmailStr] = None


    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "department": "Electrical Engineering",
                    "semester": 4
                }
            ]
        }
    }

# 3.2.4. StudentResponse
class StudentResponse(StudentBase, TimestampModel):
    id: int

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "name": "Jane Doe",
                    "roll_number": "CSE2024001",
                    "department": "Computer Science",
                    "semester": 3,
                    "phone": "+11234567890",
                    "email": "jane.doe@example.com",
                    "created_at": "2023-01-01T10:00:00Z",
                    "updated_at": "2023-01-01T10:00:00Z"
                }
            ]
        }
    }

class StudentListResponse(BaseModel):
    students: list[StudentResponse]
    total: int
    page: int # For pagination context in response
    limit: int # For pagination context in response 