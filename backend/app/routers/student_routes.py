from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.db.session import get_db
from app.schemas.student import StudentCreate, StudentResponse, StudentUpdate, StudentListResponse
from app.crud import crud_student
from app.schemas.issue import BookIssueResponse
from app.crud import crud_book_issue

router = APIRouter()

@router.post(
    "/", 
    response_model=StudentResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Add a new student",
    description="Add a new student to the system. Roll number, email, and phone must be unique.",
    tags=["Students"]
)
async def add_new_student(
    *, 
    db: AsyncSession = Depends(get_db),
    student_in: StudentCreate
) -> StudentResponse:
    """
    Add a new student.
    - **name**: Student's full name (required).
    - **roll_number**: Unique roll number (required).
    - **department**: Department (required).
    - **semester**: Current semester (required).
    - **phone**: Unique phone number (required).
    - **email**: Unique email address (required).
    """
    created_student = await crud_student.create_student(db=db, student_in=student_in)
    return created_student

@router.get(
    "/",
    response_model=StudentListResponse,
    summary="List and search students",
    description="Retrieve a list of students with filtering by department, semester, and partial match search on name, roll number, and phone.",
    tags=["Students"]
)
async def list_all_students(
    db: AsyncSession = Depends(get_db),
    department: Optional[str] = Query(None, description="Filter by department (case-insensitive, partial match)"),
    semester: Optional[int] = Query(None, description="Filter by semester"),
    name: Optional[str] = Query(None, description="Search by student name (case-insensitive, partial match)"),
    roll_number: Optional[str] = Query(None, description="Search by roll number (case-insensitive, partial match)"),
    phone: Optional[str] = Query(None, description="Search by phone number (case-insensitive, partial match)"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(10, ge=1, le=100, description="Number of items per page")
) -> StudentListResponse:
    """
    List and search for students with filters and pagination.

    - **department**: Filter by department (e.g., "Computer Science").
    - **semester**: Filter by semester (e.g., 3).
    - **name**: Search by student name.
    - **roll_number**: Search by roll number.
    - **phone**: Search by phone number.
    - **page**: Page number (default 1).
    - **limit**: Items per page (default 10, max 100).
    """
    skip = (page - 1) * limit
    students, total_students = await crud_student.get_students(
        db=db, skip=skip, limit=limit, 
        department=department, semester=semester, 
        name=name, roll_number=roll_number, phone=phone
    )
    return StudentListResponse(students=students, total=total_students, page=page, limit=limit)

@router.get(
    "/{student_identifier}/issued-books",
    response_model=List[BookIssueResponse],
    summary="List books currently issued to a student",
    description="Retrieve a list of active book issues for a specific student, identified by ID, roll number, email, or phone.",
    tags=["Students"]
)
async def list_student_issued_books(
    student_identifier: str,
    db: AsyncSession = Depends(get_db)
) -> List[BookIssueResponse]:
    """
    List all books currently issued to a specific student.

    - **student_identifier**: The ID, roll number, email, or phone number of the student.
    """
    issued_books = await crud_book_issue.get_active_issues_by_student_identifier(
        db=db, 
        identifier=student_identifier
    )
    if not issued_books:
        pass
    return issued_books

@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Get a student by ID",
    description="Retrieve a single student by their ID.",
    tags=["Students"]
)
async def get_student_by_id(
    student_id: int,
    db: AsyncSession = Depends(get_db)
) -> StudentResponse:
    """
    Get detailed information about a student by their ID.
    
    - **student_id**: The numeric ID of the student.
    """
    student = await crud_student.get_student(db=db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )
    return student

@router.put(
    "/{student_id}/",
    response_model=StudentResponse,
    summary="Update a student by ID",
    description="Update a student's information by their ID.",
    tags=["Students"]
)
async def update_student_by_id(
    student_id: int,
    student_in: StudentUpdate,
    db: AsyncSession = Depends(get_db)
) -> StudentResponse:
    """
    Update a student's information.
    
    - **student_id**: The numeric ID of the student.
    - **student_in**: The updated student information.
    """
    student = await crud_student.get_student(db=db, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )
    
    updated_student = await crud_student.update_student(db=db, db_student=student, student_in=student_in)
    return updated_student

# Placeholder for other student routes 