import asyncio
import sys
sys.path.insert(0, '.')

from app.modules.fetchers.weather import fetch_all_cities_weather
from tortoise import Tortoise
import os
from dotenv import load_dotenv

load_dotenv()

async def run():
    await Tortoise.init(
        db_url=os.getenv("DATABASE_URL"),
        modules={"models": ["app.models"]}
    )
    
    print("Fetching weather and AQI data from OpenWeatherMap...")
    success_count = await fetch_all_cities_weather()
    print(f"Completed: {success_count} cities updated")
    
    await Tortoise.close_connections()

asyncio.run(run())
