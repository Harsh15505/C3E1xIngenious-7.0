"""Quick script to check data counts"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tortoise import Tortoise
from dotenv import load_dotenv
from app.models import EnvironmentData, TrafficData, Alert, ServiceData

async def main():
    load_dotenv()
    
    db_url = f"postgres://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    
    await Tortoise.init(
        db_url=db_url,
        modules={'models': ['app.models']}
    )
    
    try:
        env_count = await EnvironmentData.all().count()
        traffic_count = await TrafficData.all().count()
        service_count = await ServiceData.all().count()
        alert_count = await Alert.all().count()
        
        print(f"📊 Data Count:")
        print(f"  Environment records: {env_count}")
        print(f"  Traffic records: {traffic_count}")
        print(f"  Service records: {service_count}")
        print(f"  Alert records: {alert_count}")
        
        if env_count == 0:
            print("\n⚠️ NO ENVIRONMENT DATA - Database is empty!")
            print("   Run data ingestion to populate the database.")
        
    finally:
        await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(main())
