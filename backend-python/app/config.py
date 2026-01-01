from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    mongodb_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours
    developer_secret: str
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
