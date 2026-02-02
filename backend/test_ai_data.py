import asyncio
from app.database import init_db
from app.models import City
from app.modules.ai.citizen_ai import handle_citizen_query
from tortoise import Tortoise

async def test_ai_data():
    await init_db()
    
    # Get Ahmedabad city
    city = await City.filter(name="Ahmedabad").first()
    print(f"City: {city.name}, ID: {city.id}")
    
    # Test full AI query flow
    query = "What is the traffic situation in Ahmedabad?"
    print(f"\nQuery: {query}")
    print("="*60)
    
    result = await handle_citizen_query(query=query, city=city, user=None)
    
    print("\n" + "="*60)
    print("RESULT:")
    print(f"  Success: {result['success']}")
    print(f"  Intent: {result['intent']}")
    print(f"  Confidence: {result['confidence']}")
    print(f"  Data Sources: {result['data_sources']}")
    print(f"  Response: {result['response']}")
    
    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(test_ai_data())
    asyncio.run(test_ai_data())
