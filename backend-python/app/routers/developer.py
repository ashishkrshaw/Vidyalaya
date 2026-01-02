from fastapi import APIRouter, HTTPException, status, Header
from datetime import datetime
from bson import ObjectId
from typing import List

from ..database import schools_collection
from ..models.school import SchoolResponse, MessageResponse, SchoolStatus
from ..utils.security import verify_developer_secret

router = APIRouter(prefix="/api/developer", tags=["Developer"])

def check_developer_auth(x_developer_secret: str = Header(...)):
    """Verify developer secret key in header"""
    if not verify_developer_secret(x_developer_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid developer secret"
        )
    return True

@router.get("/pending", response_model=List[SchoolResponse])
async def get_pending_schools(x_developer_secret: str = Header(...)):
    """Get all schools pending verification"""
    check_developer_auth(x_developer_secret)
    
    cursor = schools_collection.find({"status": SchoolStatus.pending.value})
    schools = []
    
    async for school in cursor:
        schools.append(SchoolResponse(
            id=str(school["_id"]),
            name=school["name"],
            email=school["email"],
            phone=school["phone"],
            address=school.get("address"),
            status=school["status"],
            created_at=school["created_at"],
            verified_at=school.get("verified_at")
        ))
    
    return schools

@router.get("/all", response_model=List[SchoolResponse])
async def get_all_schools(x_developer_secret: str = Header(...)):
    """Get all registered schools"""
    check_developer_auth(x_developer_secret)
    
    cursor = schools_collection.find()
    schools = []
    
    async for school in cursor:
        schools.append(SchoolResponse(
            id=str(school["_id"]),
            name=school["name"],
            email=school["email"],
            phone=school["phone"],
            address=school.get("address"),
            status=school["status"],
            created_at=school["created_at"],
            verified_at=school.get("verified_at")
        ))
    
    return schools

@router.post("/verify/{school_id}", response_model=MessageResponse)
async def verify_school(school_id: str, x_developer_secret: str = Header(...)):
    """Verify/Approve a pending school"""
    check_developer_auth(x_developer_secret)
    
    try:
        obj_id = ObjectId(school_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid school ID"
        )
    
    school = await schools_collection.find_one({"_id": obj_id})
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    if school["status"] == SchoolStatus.active.value:
        return MessageResponse(message="School is already verified", success=True)
    
    await schools_collection.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": SchoolStatus.active.value,
                "verified_at": datetime.utcnow(),
                "verified_by": "developer"
            }
        }
    )
    
    return MessageResponse(
        message=f"School '{school['name']}' has been verified successfully!",
        success=True
    )

@router.post("/reject/{school_id}", response_model=MessageResponse)
async def reject_school(school_id: str, x_developer_secret: str = Header(...)):
    """Reject a pending school"""
    check_developer_auth(x_developer_secret)
    
    try:
        obj_id = ObjectId(school_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid school ID"
        )
    
    school = await schools_collection.find_one({"_id": obj_id})
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    await schools_collection.update_one(
        {"_id": obj_id},
        {"$set": {"status": SchoolStatus.rejected.value}}
    )
    
    return MessageResponse(
        message=f"School '{school['name']}' has been rejected.",
        success=True
    )

@router.post("/deactivate/{school_id}", response_model=MessageResponse)
async def deactivate_school(school_id: str, x_developer_secret: str = Header(...)):
    """Deactivate an active school"""
    check_developer_auth(x_developer_secret)
    
    try:
        obj_id = ObjectId(school_id)
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid school ID")
    
    school = await schools_collection.find_one({"_id": obj_id})
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
        
    await schools_collection.update_one(
        {"_id": obj_id},
        {"$set": {"status": SchoolStatus.deactivated.value}}
    )
    
    return {"message": f"School '{school['name']}' has been deactivated.", "success": True}

@router.post("/activate/{school_id}", response_model=MessageResponse)
async def activate_school(school_id: str, x_developer_secret: str = Header(...)):
    """Re-activate a deactivated school"""
    check_developer_auth(x_developer_secret)
    
    try:
        obj_id = ObjectId(school_id)
    except:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid school ID")
    
    school = await schools_collection.find_one({"_id": obj_id})
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")

    await schools_collection.update_one(
        {"_id": obj_id},
        {"$set": {"status": SchoolStatus.active.value}}
    )
    
    return {"message": f"School '{school['name']}' has been activated.", "success": True}

@router.post("/deactivate-all", response_model=MessageResponse)
async def deactivate_all_schools(x_developer_secret: str = Header(...)):
    """EMERGENCY: Deactivate ALL active schools"""
    check_developer_auth(x_developer_secret)
    
    result = await schools_collection.update_many(
        {"status": SchoolStatus.active.value},
        {"$set": {"status": SchoolStatus.deactivated.value}}
    )
    
    return {
        "message": f"EMERGENCY: Deactivated {result.modified_count} schools.",
        "success": True
    }
