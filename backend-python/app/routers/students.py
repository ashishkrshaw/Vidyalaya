from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from datetime import date
import random

from ..database import students_collection, sections_collection
from ..models.student import StudentCreate, StudentResponse
from ..utils.security import get_current_school

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("/next-roll")
async def get_next_roll_no(
    class_name: str, 
    section: str,
    current_school: dict = Depends(get_current_school)
):
    """
    Get the next available roll number for a given class and section.
    Finds the maximum roll number and increments by 1.
    """
    school_id = current_school["school_id"]
    
    # Find the student with the highest roll number in this class/section
    # Sort by roll_no descending, limit 1
    cursor = students_collection.find(
        {"school_id": school_id, "class": class_name, "section": section}
    ).sort("roll_no", -1).limit(1)
    
    highest_student = await cursor.to_list(length=1)
    
    if highest_student:
        return {"next_roll_no": highest_student[0]["roll_no"] + 1}
    else:
        return {"next_roll_no": 1}


@router.get("/")
async def get_students(
    search: str = None,
    class_name: str = None,
    section: str = None,
    current_school: dict = Depends(get_current_school)
):
    """
    Get all students with optional search and filters.
    Search works on name, studentId, fatherName.
    """
    school_id = current_school["school_id"]
    
    # Build query
    query = {"school_id": school_id}
    
    if class_name:
        query["class"] = class_name
    
    if section:
        query["section"] = section
    
    # If search provided, use regex on name/studentId
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"studentId": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}},
            {"fatherName": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = students_collection.find(query).sort("name", 1).limit(50)
    students = await cursor.to_list(length=50)
    
    # Convert ObjectId to string
    for s in students:
        s["id"] = str(s["_id"])
        del s["_id"]
    
    return {"students": students, "count": len(students)}

@router.post("/", response_model=StudentResponse)
async def admit_student(
    student: StudentCreate,
    current_school: dict = Depends(get_current_school)
):
    """
    Admit a new student. 
    enforces unique roll number within class/section.
    Updates section statistics.
    """
    school_id = current_school["school_id"]
    
    # 1. Check Roll Number Uniqueness
    existing = await students_collection.find_one({
        "school_id": school_id,
        "class": student.class_name,
        "section": student.section,
        "roll_no": student.roll_no
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roll number {student.roll_no} already assigned in Class {student.class_name} Section {student.section}"
        )
    
    # 2. Generate Student ID (Example: S24-05-1234)
    # Format: S<Year>-<Month>-<Random>
    cy = str(date.today().year)[-2:]
    cm = str(date.today().month).zfill(2)
    rand = random.randint(1000, 9999)
    student_id = f"S{cy}-{cm}-{rand}"
    
    # Ensure ID uniqueness (simplified logic, ideally check DB)
    
    # 3. Prepare Data
    student_dict = student.dict(by_alias=True)
    student_dict.update({
        "school_id": school_id,
        "student_id": student_id,
        "admission_date": date.today().isoformat(),
        "status": "active"
    })
    
    # Convert date objects to string for Mongo if needed (Pydantic <-> Mongo compat)
    # Pydantic JSON encoders usually handle this, but Motor might need ISO strings
    if isinstance(student_dict.get('dob'), date):
        student_dict['dob'] = student_dict['dob'].isoformat()
    
    # 4. Insert Student
    result = await students_collection.insert_one(student_dict)
    
    # 5. Update Section Statistics (Separate DB Update as requested)
    # Upsert section to ensure it exists and increment count
    await sections_collection.update_one(
        {
            "school_id": school_id,
            "class_name": student.class_name,
            "section": student.section
        },
        {
            "$setOnInsert": {
                "created_at": date.today().isoformat()
            },
            "$inc": {"student_count": 1},
            "$set": {"updated_at": date.today().isoformat()}
        },
        upsert=True
    )
    
    # Return created student
    student_dict["id"] = str(result.inserted_id)
    return student_dict
