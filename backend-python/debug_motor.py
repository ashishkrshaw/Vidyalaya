
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# URI from .env
uri = "mongodb://sawashishkumar327:QfVK0ogY0EOQ5Ptf@ac-xte0yl3-shard-00-00.0eme8jm.mongodb.net:27017,ac-xte0yl3-shard-00-01.0eme8jm.mongodb.net:27017,ac-xte0yl3-shard-00-02.0eme8jm.mongodb.net:27017/school?replicaSet=atlas-6pi9xg-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority"

async def test_motor():
    print(f"Testing Motor (Async) connection to: {uri.split('@')[1]}")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        # Force a connection/topology check
        db = client.admin
        pong = await db.command('ping')
        print("Motor Connection Successful!", pong)
    except Exception as e:
        print(f"Motor Connection failed: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_motor())
