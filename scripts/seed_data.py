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
            "name": "Mumbai",
            "state": "Maharashtra",
            "population": 12442373,
            "latitude": 19.0760,
            "longitude": 72.8777
        },
        {
            "name": "Delhi",
            "state": "Delhi",
            "population": 11007835,
            "latitude": 28.7041,
            "longitude": 77.1025
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
        {"name": "sensor-env-mumbai", "type": "environment", "expectedFrequency": 15},
        {"name": "sensor-env-delhi", "type": "environment", "expectedFrequency": 15},
        {"name": "sensor-traffic-mumbai-A", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-mumbai-B", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-mumbai-C", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-delhi-A", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-delhi-B", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-traffic-delhi-C", "type": "traffic", "expectedFrequency": 30},
        {"name": "sensor-services-mumbai", "type": "services", "expectedFrequency": 30},
        {"name": "sensor-services-delhi", "type": "services", "expectedFrequency": 30},
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
