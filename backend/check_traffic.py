import asyncio
from app.models import TrafficData, City
from tortoise import Tortoise
import os
from dotenv import load_dotenv

load_dotenv()

async def check_traffic():
    await Tortoise.init(
        db_url=os.getenv("DATABASE_URL"),
        modules={"models": ["app.models"]}
    )
    
    count = await TrafficData.all().count()
    print(f"Total traffic records: {count}")
    
    if count > 0:
        latest = await TrafficData.all().order_by('-timestamp').first()
        print(f"Latest timestamp: {latest.timestamp}")
        print(f"Zone: {latest.zone}, Congestion: {latest.congestion_level}")
    
    await Tortoise.close_connections()

asyncio.run(check_traffic())
