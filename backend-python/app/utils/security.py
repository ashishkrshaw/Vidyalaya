import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from ..config import get_settings

settings = get_settings()
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

async def get_current_school(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get full school document from database using JWT token.
    Also validates school is active - blocks deactivated/pending/rejected schools.
    """
    # Import inside function to avoid circular import
    from ..database import schools_collection
    from ..models.school import SchoolStatus
    
    token = credentials.credentials
    payload = decode_token(token)
    
    school_id = payload.get("sub")
    if not school_id:
        raise HTTPException(status_code=401, detail="Invalid token: no school ID")
    
    try:
        obj_id = ObjectId(school_id)
    except:
        raise HTTPException(status_code=401, detail="Invalid school ID format")
    
    school = await schools_collection.find_one({"_id": obj_id})
    if not school:
        raise HTTPException(status_code=401, detail="School not found")
    
    # CHECK SCHOOL STATUS - Block if not active
    school_status = school.get("status", "pending")
    
    if school_status == SchoolStatus.pending.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_PENDING: Your account is pending verification."
        )
    
    if school_status == SchoolStatus.rejected.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_REJECTED: Your account has been rejected."
        )
    
    if school_status == SchoolStatus.deactivated.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCOUNT_DEACTIVATED: Your account has been deactivated by administrator."
        )
    
    # Add school_id as string for convenience
    school["school_id"] = str(school["_id"])
    return school

def verify_developer_secret(secret: str) -> bool:
    return secret == settings.developer_secret

