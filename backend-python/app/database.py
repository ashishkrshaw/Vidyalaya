from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

settings = get_settings()

client = AsyncIOMotorClient(settings.mongodb_url)
db = client.vidyalaya

# Collections
schools_collection = db.schools
students_collection = db.students
sections_collection = db.sections

# Payment Collections
payments_collection = db.payments
receipts_collection = db.receipts
receipt_counters_collection = db.receipt_counters
