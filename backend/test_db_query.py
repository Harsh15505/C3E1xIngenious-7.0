"""Test database query"""
import asyncio
from tortoise import Tortoise
from app.config import get_settings

settings = get_settings()

async def test_query():
    # Initialize Tortoise
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["app.models"]}
    )
    
    from app.models import City, EnvironmentData
    
    # Find Ahmedabad
    city = await City.get(id="e61c1dc6-3e80-4eef-ab0f-f625207ca41f")
    print(f"Found city: {city.name}")
    
    # Get latest environment data
    env_data = await EnvironmentData.filter(
        city=city
    ).order_by("-timestamp").first()
    
    if env_data:
        print(f"✓ Found environment data:")
        print(f"  AQI: {env_data.aqi}")
        print(f"  PM2.5: {env_data.pm25}")
        print(f"  Temperature: {env_data.temperature}")
        print(f"  Timestamp: {env_data.timestamp}")
    else:
        print("✗ No environment data found")
    
    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(test_query())
