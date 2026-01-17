"""
Database Connection using Tortoise ORM
"""

from tortoise import Tortoise
from app.config import get_settings

settings = get_settings()


async def init_db():
    """Initialize database connection"""
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["app.models"]}
    )
    await Tortoise.generate_schemas()


async def close_db():
    """Close database connections"""
    await Tortoise.close_connections()
