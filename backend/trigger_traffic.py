import asyncio
from app.scheduler import fetch_traffic_data
from tortoise import Tortoise
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    await Tortoise.init(
        db_url=os.getenv("DATABASE_URL"),
        modules={"models": ["app.models"]}
    )
    
    print("Triggering traffic data generation...")
    await fetch_traffic_data()
    print("Done!")
    
    await Tortoise.close_connections()

asyncio.run(run())
