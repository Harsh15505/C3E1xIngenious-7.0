import asyncio
from tortoise import Tortoise
from app.models import EnvironmentData, TrafficData, ServiceData

async def check_sources():
    await Tortoise.init(
        db_url='sqlite://db.sqlite3',
        modules={'models': ['app.models']}
    )
    
    env_sources = await EnvironmentData.all().values('source')
    traffic_sources = await TrafficData.all().values('source')
    
    print("Environment data sources:")
    sources = {}
    for e in env_sources:
        s = e['source']
        sources[s] = sources.get(s, 0) + 1
    for s, count in sources.items():
        print(f"  {s}: {count}")
    
    print("\nTraffic data sources:")
    sources = {}
    for t in traffic_sources:
        s = t['source']
        sources[s] = sources.get(s, 0) + 1
    for s, count in sources.items():
        print(f"  {s}: {count}")
    
    await Tortoise.close_connections()

asyncio.run(check_sources())
