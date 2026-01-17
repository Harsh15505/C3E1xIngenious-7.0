"""
Database Seeding Script
Seeds the database with initial cities and data sources
"""

import asyncio
from prisma import Prisma
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db = Prisma()


async def seed_cities():
    """Seed initial cities"""
    cities = [
        {
            "name": "Ahmedabad",
            "state": "Gujarat",
            "population": 8450000,
            "latitude": 23.0225,
            "longitude": 72.5714
        },
        {
            "name": "Gandhinagar",
            "state": "Gujarat",
            "population": 292000,
            "latitude": 23.2156,
            "longitude": 72.6369
        }
    ]
    
    logger.info("Seeding cities...")
    for city_data in cities:
        city = await db.city.upsert(
            where={"name": city_data["name"]},
            data={
                "create": city_data,
                "update": city_data
            }
        )
        logger.info(f"✅ City: {city.name}")


async def seed_data_sources():
    """Seed data sources for tracking"""
    sources = [
        {"name": "sensor-env-ahmedabad", "type": "environment", "expectedFrequency": 15},
        {"name": "sensor-env-gandhinagar", "type": "environment", "expectedFrequency": 15},
        {"name": "sensor-traffic-ahmedabad-A", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-ahmedabad-B", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-ahmedabad-C", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-gandhinagar-A", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-gandhinagar-B", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-gandhinagar-C", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-services-ahmedabad", "type": "services", "expectedFrequency": 30},
        {"name": "sensor-services-gandhinagar", "type": "services", "expectedFrequency": 30},
    ]
    
    logger.info("Seeding data sources...")
    for source_data in sources:
        source = await db.datasource.upsert(
            where={"name": source_data["name"]},
            data={
                "create": source_data,
                "update": source_data
            }
        )
        logger.info(f"✅ Source: {source.name}")


async def main():
    """Main seeding function"""
    try:
        await db.connect()
        logger.info("🗄️  Connected to database")
        
        await seed_cities()
        await seed_data_sources()
        
        logger.info("\n✅ Database seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
