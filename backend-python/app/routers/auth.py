from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from bson import ObjectId

from ..database import schools_collection
from ..models.school import (
    SchoolSignup, SchoolLogin, SchoolResponse, 
    TokenResponse, MessageResponse, SchoolStatus
)
from ..utils.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/signup", response_model=MessageResponse)
async def signup(data: SchoolSignup):
    """Register a new school - account will be pending until developer verification"""
    
    # Check if email already exists
    existing = await schools_collection.find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new school with pending status
    school_data = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "phone": data.phone,
        "address": data.address,
        "status": SchoolStatus.pending.value,
        "created_at": datetime.utcnow(),
        "verified_at": None,
        "verified_by": None
    }
    
    result = await schools_collection.insert_one(school_data)
    
    return MessageResponse(
        message="Registration successful! Your account is pending verification. You will be notified once approved.",
        success=True
    )

@router.post("/login", response_model=TokenResponse)
async def login(data: SchoolLogin):
    """Login - only works if account is verified/active"""
    
    school = await schools_collection.find_one({"email": data.email})
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(data.password, school["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check account status
    if school["status"] == SchoolStatus.pending.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending verification. Please wait for approval."
        )
    
    if school["status"] == SchoolStatus.rejected.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been rejected. Please contact support."
        )
    
    if school["status"] == SchoolStatus.deactivated.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )
    
    # Create token
    token_data = {
        "school_id": str(school["_id"]),
        "email": school["email"],
        "name": school["name"]
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(
        access_token=access_token,
        school=SchoolResponse(
            id=str(school["_id"]),
            name=school["name"],
            email=school["email"],
            phone=school["phone"],
            address=school.get("address"),
            status=school["status"],
            created_at=school["created_at"],
            verified_at=school.get("verified_at")
        )
    )
