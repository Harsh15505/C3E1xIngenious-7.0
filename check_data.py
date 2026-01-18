import asyncio
import sys
import os

# Add backend to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from tortoise import Tortoise
from app.config import get_settings
from app.models import City, EnvironmentData, TrafficData, ServiceData, Alert, DatasetRequest, DataCorrectionRequest

settings = get_settings()

async def check():
    db_url = f"postgres://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    await Tortoise.init(
        db_url=db_url,
        modules={'models': ['app.models']}
    )
    
    cities = await City.all().count()
    env = await EnvironmentData.all().count()
    traffic = await TrafficData.all().count()
    service = await ServiceData.all().count()
    alerts = await Alert.all().count()
    dataset_req = await DatasetRequest.all().count()
    correction_req = await DataCorrectionRequest.all().count()
    
    print(f"""
DATABASE CONTENTS:
==================
Cities: {cities}
Environment Data Records: {env}
Traffic Data Records: {traffic}
Service Data Records: {service}
Alerts: {alerts}
Dataset Requests: {dataset_req}
Data Correction Requests: {correction_req}

TOTAL DATA POINTS: {env + traffic + service}
    """)
    
    # Get date range if data exists
    if env > 0:
        oldest_env = await EnvironmentData.all().order_by('timestamp').first()
        newest_env = await EnvironmentData.all().order_by('-timestamp').first()
        print(f"Environment Data Range: {oldest_env.timestamp} to {newest_env.timestamp}")
    
    if traffic > 0:
        oldest_traffic = await TrafficData.all().order_by('timestamp').first()
        newest_traffic = await TrafficData.all().order_by('-timestamp').first()
        print(f"Traffic Data Range: {oldest_traffic.timestamp} to {newest_traffic.timestamp}")
    
    await Tortoise.close_connections()

asyncio.run(check())
