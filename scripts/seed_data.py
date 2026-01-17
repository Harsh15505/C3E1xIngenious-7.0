"""
Database Seeding Script
Seeds the database with initial cities and data sources
"""

import asyncio
from tortoise import Tortoise
import logging
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.models import City, DataSource
from backend.app.config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


async def seed_cities():
    """Seed initial cities"""
    cities_data = [
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
    for city_data in cities_data:
        # Remove 'name' from city_data for defaults since it's used as filter
        name = city_data.pop("name")
        city, created = await City.get_or_create(
            name=name,
            defaults=city_data
        )
        if created:
            logger.info(f"✅ City created: {city.name}")
        else:
            logger.info(f"ℹ️  City exists: {city.name}")


async def seed_data_sources():
    """Seed data sources for tracking"""
    sources_data = [
        {"name": "sensor-env-ahmedabad", "type": "environment", "expected_frequency": 15},
        {"name": "sensor-env-gandhinagar", "type": "environment", "expected_frequency": 15},
        {"name": "sensor-traffic-ahmedabad-A", "type": "traffic", "expected_frequency": 30},
        {"name": "sensor-traffic-ahmedabad-B", "type": "traffic", "expected_frequency": 30},
        {"name": "sensor-traffic-ahmedabad-C", "type": "traffic", "expected_frequency": 30},
        {"name": "sensor-traffic-gandhinagar-A", "type": "traffic", "expected_frequency": 30},
        {"name": "sensor-traffic-gandhinagar-B", "type": "traffic", "expected_frequency": 30},
        {"name": "sensor-traffic-gandhinagar-C", "type": "traffic", "expected_frequency": 30},
        {"name": "sensor-services-ahmedabad", "type": "services", "expected_frequency": 30},
        {"name": "sensor-services-gandhinagar", "type": "services", "expected_frequency": 30},
    ]
    
    logger.info("Seeding data sources...")
    for source_data in sources_data:
        # Remove 'name' from source_data for defaults since it's used as filter
        name = source_data.pop("name")
        source, created = await DataSource.get_or_create(
            name=name,
            defaults=source_data
        )
        if created:
            logger.info(f"✅ Source created: {source.name}")
        else:
            logger.info(f"ℹ️  Source exists: {source.name}")


async def main():
    """Main seeding function"""
    try:
        import ssl
        from pathlib import Path
        
        # Load CA certificate for Aiven PostgreSQL
        ca_cert_path = Path(__file__).parent.parent / 'backend' / 'ca-certificate.crt'
        ssl_context = ssl.create_default_context(cafile=str(ca_cert_path))
        
        await Tortoise.init(
            config={
                'connections': {
                    'default': {
                        'engine': 'tortoise.backends.asyncpg',
                        'credentials': {
                            'host': settings.DB_HOST,
                            'port': settings.DB_PORT,
                            'user': settings.DB_USER,
                            'password': settings.DB_PASSWORD,
                            'database': settings.DB_NAME,
                            'ssl': ssl_context
                        }
                    }
                },
                'apps': {
                    'models': {
                        'models': ['backend.app.models'],
                        'default_connection': 'default',
                    }
                }
            }
        )
        await Tortoise.generate_schemas()
        logger.info("🗄️  Connected to database")
        
        await seed_cities()
        await seed_data_sources()
        
        logger.info("\n✅ Database seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
