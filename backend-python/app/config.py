from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    mongodb_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours
    developer_secret: str
    
    # Razorpay Configuration
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    
    # MSG91 Configuration
    msg91_auth_key: Optional[str] = None
    msg91_sender_id: str = "SCHOOL"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()


