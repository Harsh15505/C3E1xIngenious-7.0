"""Clear all users from the database"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_db, close_db
from app.models import User


async def main():
    """Clear all users"""
    await init_db()
    
    count = await User.all().count()
    await User.all().delete()
    
    print(f"✅ Cleared {count} users from database")
    
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
