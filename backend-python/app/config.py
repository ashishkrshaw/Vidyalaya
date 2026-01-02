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
    
    # Twilio Configuration (for WhatsApp)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_whatsapp_from: str = "whatsapp:+14155238886"  # Sandbox number
    twilio_sms_from: Optional[str] = None  # Your Twilio phone number
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()


