"""
Database Connection using Tortoise ORM
"""

from tortoise import Tortoise
from app.config import get_settings
import ssl
from pathlib import Path
import os

settings = get_settings()

# Tortoise ORM configuration for Aerich migrations
ca_cert_path = Path(__file__).parent.parent / 'ca-certificate.crt'

# SSL configuration - handle both local and Railway deployment
if ca_cert_path.exists():
    ssl_context = ssl.create_default_context(cafile=str(ca_cert_path))
else:
    # For Railway: use default SSL context (works with Aiven)
    ssl_context = ssl.create_default_context()

TORTOISE_ORM = {
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
            'models': ['app.models', 'aerich.models'],
            'default_connection': 'default',
        }
    }
}


async def init_db():
    """Initialize database connection"""
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()


async def close_db():
    """Close database connections"""
    await Tortoise.close_connections()
