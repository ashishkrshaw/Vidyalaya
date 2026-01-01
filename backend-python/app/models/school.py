from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class SchoolStatus(str, Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"

# Request Models
class SchoolSignup(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str = Field(..., min_length=10, max_length=15)
    address: Optional[str] = None

class SchoolLogin(BaseModel):
    email: EmailStr
    password: str

# Response Models
class SchoolResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    address: Optional[str]
    status: SchoolStatus
    created_at: datetime
    verified_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    school: SchoolResponse

class MessageResponse(BaseModel):
    message: str
    success: bool = True
