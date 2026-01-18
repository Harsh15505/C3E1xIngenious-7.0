"""
Clear Synthetic Data Script
Removes all synthetic/generated environment data, keeping only real API-fetched data
"""

import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load .env from backend directory
backend_dir = Path(__file__).parent.parent
load_dotenv(backend_dir / '.env')

from tortoise import Tortoise
from app.models import EnvironmentData, TrafficData, ServiceData
from app.config import get_settings
import ssl

settings = get_settings()


async def clear_synthetic_environment_data():
    """Clear all environment data that doesn't have source='openweathermap'"""
    print("🧹 Clearing synthetic environment data...")
    
    # Count records before
    total_count = await EnvironmentData.all().count()
    synthetic_count = await EnvironmentData.filter(source__not='openweathermap').count()
    
    print(f"📊 Total environment records: {total_count}")
    print(f"📊 Synthetic records to delete: {synthetic_count}")
    print(f"📊 Real API records to keep: {total_count - synthetic_count}")
    
    if synthetic_count > 0:
        # Delete synthetic data
        deleted = await EnvironmentData.filter(source__not='openweathermap').delete()
        print(f"✅ Deleted {deleted} synthetic environment records")
    else:
        print("✅ No synthetic data found")
    
    return synthetic_count


async def clear_all_synthetic_data():
    """Clear all synthetic traffic and service data (keep environment from API)"""
    print("\n🧹 Clearing synthetic traffic data...")
    traffic_count = await TrafficData.all().count()
    if traffic_count > 0:
        deleted = await TrafficData.all().delete()
        print(f"✅ Deleted {deleted} traffic records")
    
    print("\n🧹 Clearing synthetic service data...")
    service_count = await ServiceData.all().count()
    if service_count > 0:
        deleted = await ServiceData.all().delete()
        print(f"✅ Deleted {deleted} service records")


async def main():
    """Main execution"""
    # Initialize Tortoise ORM
    try:
        # Build DATABASE_URL from environment variables
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        db_user = os.getenv('DB_USER', 'postgres')
        db_password = os.getenv('DB_PASSWORD', 'postgres')
        db_name = os.getenv('DB_NAME', 'urban_intelligence')
        
        database_url = f"postgres://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        await Tortoise.init(
            db_url=database_url,
            modules={'models': ['app.models']},
            _create_db=False
        )
        
        print("=" * 60)
        print("SYNTHETIC DATA CLEANUP")
        print("=" * 60)
        
        # Clear synthetic environment data (keep API data)
        await clear_synthetic_environment_data()
        
        # Ask user if they want to clear traffic/service data too
        print("\n⚠️  Traffic and Service data are currently synthetic.")
        print("Do you want to clear them too? (y/n): ", end='')
        
        # For automated scripts, default to 'y'
        clear_all = input().lower().strip() == 'y'
        
        if clear_all:
            await clear_all_synthetic_data()
        
        print("\n" + "=" * 60)
        print("✅ CLEANUP COMPLETE")
        print("=" * 60)
        
        # Show remaining data
        env_remaining = await EnvironmentData.all().count()
        traffic_remaining = await TrafficData.all().count()
        service_remaining = await ServiceData.all().count()
        
        print(f"\n📊 Remaining records:")
        print(f"   Environment: {env_remaining} (real API data)")
        print(f"   Traffic: {traffic_remaining}")
        print(f"   Service: {service_remaining}")
        
        print("\n💡 TIP: The scheduler will now populate only real API data every 15 minutes")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
