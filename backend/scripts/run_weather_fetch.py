"""One-time weather fetch for all cities."""
import asyncio
import os
import sys
from dotenv import load_dotenv
from tortoise import Tortoise

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def main():
    load_dotenv()
    db_url = (
        f"postgres://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
        f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )

    await Tortoise.init(
        db_url=db_url,
        modules={'models': ['app.models']}
    )

    try:
        from app.modules.fetchers.weather import fetch_all_cities_weather
        await fetch_all_cities_weather()
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
