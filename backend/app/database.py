"""
Database Connection
"""

from prisma import Prisma

# Global database client
db = Prisma()

async def connect_db():
    """Connect to database"""
    await db.connect()

async def disconnect_db():
    """Disconnect from database"""
    await db.disconnect()
