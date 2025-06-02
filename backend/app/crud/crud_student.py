from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func, or_
from fastapi import HTTPException, status

from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate # StudentUpdate will be used later

async def get_student_by_unique_fields(db: AsyncSession, roll_number: str | None = None, email: str | None = None, phone: str | None = None) -> Student | None:
    conditions = []
    if roll_number:
        conditions.append(Student.roll_number == roll_number)
    if email:
        conditions.append(Student.email == email)
    if phone:
        conditions.append(Student.phone == phone)
    
    if not conditions:
        return None # Or raise an error, as this function expects at least one field

    result = await db.execute(select(Student).filter(or_(*conditions)))
    return result.scalars().first()

async def create_student(db: AsyncSession, student_in: StudentCreate) -> Student:
    """Create a new student in the database."""
    # Check for uniqueness of roll_number, email, and phone
    existing_student = await get_student_by_unique_fields(
        db,
        roll_number=student_in.roll_number,
        email=student_in.email,
        phone=student_in.phone
    )
    if existing_student:
        detail_msg = "Student with conflicting unique field(s) already exists:"
        if existing_student.roll_number == student_in.roll_number:
            detail_msg += f" Roll Number ({student_in.roll_number})"
        if existing_student.email == student_in.email:
            detail_msg += f" Email ({student_in.email})"
        if existing_student.phone == student_in.phone:
            detail_msg += f" Phone ({student_in.phone})"
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail_msg.strip()
        )

    db_student = Student(
        name=student_in.name,
        roll_number=student_in.roll_number,
        department=student_in.department,
        semester=student_in.semester,
        phone=student_in.phone,
        email=student_in.email
    )
    db.add(db_student)
    try:
        await db.commit()
        await db.refresh(db_student)
    except IntegrityError as e:
        await db.rollback()
        # Fallback for direct DB constraint violations (e.g., race conditions)
        err_str = str(e.orig).lower()
        conflict_field = "unknown unique field"
        if "uq_student_roll_number" in err_str or "students_roll_number_key" in err_str:
            conflict_field = f"Roll Number ({student_in.roll_number})"
        elif "uq_student_email" in err_str or "students_email_key" in err_str:
            conflict_field = f"Email ({student_in.email})"
        elif "uq_student_phone" in err_str or "students_phone_key" in err_str:
            conflict_field = f"Phone ({student_in.phone})"
        
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with {conflict_field} already exists (database constraint)."
        )
    return db_student

async def get_student(db: AsyncSession, student_id: int) -> Student | None:
    result = await db.execute(select(Student).filter(Student.id == student_id))
    return result.scalars().first()

async def get_students(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    department: str | None = None,
    semester: int | None = None,
    name: str | None = None, # For partial match search
    roll_number: str | None = None, # For partial match search
    phone: str | None = None # For partial match search
) -> tuple[list[Student], int]:
    query = select(Student)
    count_query = select(func.count()).select_from(Student)

    if department:
        query = query.filter(Student.department.ilike(f"%{department}%"))
        count_query = count_query.filter(Student.department.ilike(f"%{department}%"))
    if semester is not None:
        query = query.filter(Student.semester == semester)
        count_query = count_query.filter(Student.semester == semester)
    if name:
        query = query.filter(Student.name.ilike(f"%{name}%"))
        count_query = count_query.filter(Student.name.ilike(f"%{name}%"))
    if roll_number:
        query = query.filter(Student.roll_number.ilike(f"%{roll_number}%"))
        count_query = count_query.filter(Student.roll_number.ilike(f"%{roll_number}%"))
    if phone:
        query = query.filter(Student.phone.ilike(f"%{phone}%"))
        count_query = count_query.filter(Student.phone.ilike(f"%{phone}%"))

    total_students_result = await db.execute(count_query)
    total_students = total_students_result.scalar_one_or_none() or 0

    query = query.order_by(Student.id).offset(skip).limit(limit)
    students_result = await db.execute(query)
    students = students_result.scalars().all()
    return list(students), total_students

async def update_student(db: AsyncSession, db_student: Student, student_in: StudentUpdate) -> Student:
    update_data = student_in.model_dump(exclude_unset=True)
    
    # Check for potential conflicts if unique fields are being updated
    if any(field in update_data for field in ["email", "phone"]):
        # We don't update roll_number here, but if it were allowed, it would be included.
        check_email = update_data.get("email")
        check_phone = update_data.get("phone")
        
        # Ensure we are not checking the current student's own values against itself
        # if they are not being changed.
        if check_email == db_student.email: check_email = None 
        if check_phone == db_student.phone: check_phone = None

        if check_email or check_phone: # Only query if there's a new value to check
            existing_student = await get_student_by_unique_fields(db, email=check_email, phone=check_phone)
            if existing_student and existing_student.id != db_student.id:
                detail_msg = "Update conflicts with existing student:"
                if check_email and existing_student.email == check_email:
                    detail_msg += f" Email ({check_email})"
                if check_phone and existing_student.phone == check_phone:
                    detail_msg += f" Phone ({check_phone})"
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail_msg)

    for field, value in update_data.items():
        setattr(db_student, field, value)
    
    db.add(db_student)
    try:
        await db.commit()
        await db.refresh(db_student)
    except IntegrityError as e: # Catch conflicts not caught by the above pre-check (e.g. race condition)
        await db.rollback()
        err_str = str(e.orig).lower()
        conflict_field = "unknown unique field"
        if student_in.email and ("uq_student_email" in err_str or "students_email_key" in err_str):
            conflict_field = f"Email ({student_in.email})"
        elif student_in.phone and ("uq_student_phone" in err_str or "students_phone_key" in err_str):
            conflict_field = f"Phone ({student_in.phone})"
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Student with {conflict_field} already exists (DB constraint).")

    return db_student 