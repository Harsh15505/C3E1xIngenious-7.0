import asyncio
from app.models import TrafficData, City, DataSource
from app.database import init_db
from tortoise import Tortoise

async def check_traffic():
    print("Initializing database...")
    await init_db()
    
    count = await TrafficData.all().count()
    print(f"\n📊 Total traffic records in TrafficData table: {count}")
    
    if count > 0:
        recent = await TrafficData.all().order_by('-timestamp').limit(10).prefetch_related('city')
        print("\n🔍 Recent 10 records:")
        for r in recent:
            city = await r.city
            print(f"  • Source: {r.source:<40} | City: {city.name:<15} | Zone: {r.zone} | Timestamp: {r.timestamp}")
    
    # Check DataSource tracking
    print("\n📈 DataSource tracking:")
    traffic_sources = await DataSource.filter(name__startswith="sensor-traffic")
    for ds in traffic_sources:
        print(f"  • {ds.name:<40} | Total Ingestions: {ds.total_ingestions}")
    
    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(check_traffic())
