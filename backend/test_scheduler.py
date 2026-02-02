import asyncio
from tortoise import Tortoise
from app.database import init_db
from app.scheduler import fetch_traffic_data, fetch_environment_data

async def test():
    print("Initializing database...")
    await init_db()
    
    print("\n🚦 Testing traffic data generation...")
    await fetch_traffic_data()
    
    print("\n🌍 Testing environment data generation...")
    await fetch_environment_data()
    
    print("\n✅ Test complete")
    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(test())
