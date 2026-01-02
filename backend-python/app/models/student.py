from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from datetime import date, datetime
from bson import ObjectId

class StudentBase(BaseModel):
    # Personal
    name: str = Field(..., min_length=2)
    gender: str
    dob: date  # Pydantic parses YYYY-MM-DD
    aadhar: Optional[str] = Field(None, min_length=12, max_length=12)
    apaar: Optional[str] = None
    
    # Academic
    class_name: str = Field(..., alias="class")
    section: str
    roll_no: int
    
    # Parents
    father_name: str
    mother_name: Optional[str] = None
    father_mobile: str = Field(..., min_length=10)
    mother_mobile: Optional[str] = None
    email: Optional[EmailStr] = None
    
    # Contact
    address: Optional[str] = None
    
    # Fees
    admission_fee: Optional[float] = 0
    monthly_fee: Optional[float] = None  # Override

    class Config:
        populate_by_name = True

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    roll_no: Optional[int] = None
    # Add fields as needed

class StudentResponse(StudentBase):
    id: str
    student_id: str  # Generated S25-01-XXXX
    school_id: str
    admission_date: date
    status: str = "active"
    
    @validator('id', pre=True)
    def convert_id(cls, v):
        return str(v)
