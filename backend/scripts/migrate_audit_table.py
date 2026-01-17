"""
Migrate SystemAuditLog table to new schema
Drops and recreates the table with new audit logging fields
"""
import asyncio
from dotenv import load_dotenv
import os
import sys

# Load environment
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tortoise import Tortoise
from app.config import get_settings

settings = get_settings()


async def migrate():
    """Drop and recreate SystemAuditLog table"""
    
    # Initialize Tortoise WITHOUT generating schemas
    import ssl
    from pathlib import Path
    
    ca_cert_path = Path(__file__).parent.parent / 'ca-certificate.crt'
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
                    'models': ['app.models'],
                    'default_connection': 'default',
                }
            }
        }
    )
    
    conn = Tortoise.get_connection("default")
    
    print("🔄 Dropping old system_audit_logs table...")
    await conn.execute_script("DROP TABLE IF EXISTS system_audit_logs CASCADE;")
    print("✅ Dropped old table")
    
    print("🔄 Creating new system_audit_logs table...")
    await Tortoise.generate_schemas()
    print("✅ Created new table with updated schema")
    
    await Tortoise.close_connections()
    print("✅ Migration complete!")


if __name__ == "__main__":
    asyncio.run(migrate())
