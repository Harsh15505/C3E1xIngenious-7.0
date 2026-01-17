"""
Database Connection using Tortoise ORM
"""

from tortoise import Tortoise
from app.config import get_settings
import ssl
from pathlib import Path

settings = get_settings()


async def init_db():
    """Initialize database connection"""
    # Load CA certificate for Aiven PostgreSQL
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
    await Tortoise.generate_schemas()


async def close_db():
    """Close database connections"""
    await Tortoise.close_connections()
