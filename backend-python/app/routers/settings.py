from fastapi import APIRouter, Depends, HTTPException, status
from ..database import schools_collection
from ..models.school import SchoolResponse, SchoolUpdate, PasswordChange, MessageResponse
from ..utils.security import get_current_school, verify_password, hash_password
from bson import ObjectId

router = APIRouter(
    prefix="/api/settings",
    tags=["Settings"]
)

@router.get("/profile", response_model=SchoolResponse)
async def get_school_profile(current_user: dict = Depends(get_current_school)):
    """Get current school profile with branding info"""
    # current_user is already the school document (dict)
    # Ensure ID is string for response model
    current_user["id"] = str(current_user["_id"])
    return current_user

@router.put("/profile", response_model=SchoolResponse)
async def update_school_profile(
    update_data: SchoolUpdate,
    current_user: dict = Depends(get_current_school)
):
    """Update school branding and contact info"""
    school_id = current_user["_id"]
    
    # Filter out None values
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update"
        )

    result = await schools_collection.update_one(
        {"_id": school_id},
        {"$set": update_dict}
    )

    if result.modified_count == 0 and not result.matched_count:
         raise HTTPException(status_code=404, detail="School not found")

    # Fetch updated document
    updated_school = await schools_collection.find_one({"_id": school_id})
    updated_school["id"] = str(updated_school["_id"])
    return updated_school

@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_school)
):
    """Change school admin password"""
    # Verify old password
    if not verify_password(password_data.old_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # Hash new password
    hashed_new = hash_password(password_data.new_password)
    
    result = await schools_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": hashed_new}}
    )
    
    return {"message": "Password updated successfully", "success": True}
