from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

settings = get_settings()

client = AsyncIOMotorClient(settings.mongodb_url)
db = client.vidyalaya

# Collections
schools_collection = db.schools
