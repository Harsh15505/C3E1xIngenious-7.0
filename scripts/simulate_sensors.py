"""
Sensor Data Simulator
Simulates push-style data ingestion from IoT sensors

Run this script to push simulated data to the API endpoints.
This demonstrates the "push" side of mixed ingestion model.
"""

import asyncio
import httpx
import random
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_BASE_URL = "http://localhost:8000/api/v1"

# Sample cities
CITIES = ["Ahmedabad", "Gandhinagar"]
ZONES = ["A", "B", "C"]


async def push_environment_data(client: httpx.AsyncClient, city: str):
    """Simulate environment sensor pushing data"""
    data = {
        "city": city,
        "timestamp": datetime.utcnow().isoformat(),
        "source": f"sensor-env-{city.lower()}",
        "aqi": random.uniform(50, 300),
        "pm25": random.uniform(20, 150),
        "temperature": random.uniform(15, 40),
        "rainfall": random.uniform(0, 50) if random.random() > 0.7 else 0
    }
    
    try:
        response = await client.post(f"{API_BASE_URL}/ingest/environment", json=data)
        logger.info(f"✅ Environment data pushed for {city}: AQI={data['aqi']:.1f}")
    except Exception as e:
        logger.error(f"❌ Failed to push environment data: {e}")


async def push_traffic_data(client: httpx.AsyncClient, city: str):
    """Simulate traffic sensor pushing data"""
    for zone in random.sample(ZONES, 2):  # Push 2 zones per iteration
        data = {
            "city": city,
            "zone": zone,
            "timestamp": datetime.utcnow().isoformat(),
            "source": f"sensor-traffic-{city.lower()}-{zone}",
            "densityPercent": random.uniform(30, 95),
            "congestionLevel": random.choice(["low", "medium", "high"]),
            "heavyVehicleCount": random.randint(50, 500)
        }
        
        try:
            response = await client.post(f"{API_BASE_URL}/ingest/traffic", json=data)
            logger.info(f"✅ Traffic data pushed for {city} Zone {zone}: {data['congestionLevel']}")
        except Exception as e:
            logger.error(f"❌ Failed to push traffic data: {e}")


async def push_service_data(client: httpx.AsyncClient, city: str):
    """Simulate service monitoring sensor pushing data"""
    data = {
        "city": city,
        "timestamp": datetime.utcnow().isoformat(),
        "source": f"sensor-services-{city.lower()}",
        "waterSupplyStress": random.uniform(0, 1),
        "wasteCollectionEff": random.uniform(0.6, 1.0),
        "powerOutageCount": random.randint(0, 10)
    }
    
    try:
        response = await client.post(f"{API_BASE_URL}/ingest/services", json=data)
        logger.info(f"✅ Service data pushed for {city}")
    except Exception as e:
        logger.error(f"❌ Failed to push service data: {e}")


async def simulate_sensor_push_loop():
    """
    Main simulation loop - runs continuously
    Simulates sensors pushing data at different intervals
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        iteration = 0
        while True:
            iteration += 1
            logger.info(f"\n{'='*60}")
            logger.info(f"Sensor Push Iteration #{iteration} - {datetime.utcnow()}")
            logger.info(f"{'='*60}")
            
            # Push data for each city
            for city in CITIES:
                await push_environment_data(client, city)
                await push_traffic_data(client, city)
                
                # Service data less frequently (every 3rd iteration)
                if iteration % 3 == 0:
                    await push_service_data(client, city)
            
            # Wait 30 seconds before next push
            logger.info(f"\n⏳ Waiting 30 seconds before next push...")
            await asyncio.sleep(30)


async def push_single_batch():
    """Push a single batch of data (useful for testing)"""
    logger.info("Pushing single batch of sensor data...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        for city in CITIES:
            await push_environment_data(client, city)
            await push_traffic_data(client, city)
            await push_service_data(client, city)
    logger.info("✅ Single batch completed")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "once":
        # Push once and exit
        asyncio.run(push_single_batch())
    else:
        # Continuous simulation
        logger.info("🌡️  Starting sensor data simulator (push-style ingestion)")
        logger.info("Press Ctrl+C to stop")
        try:
            asyncio.run(simulate_sensor_push_loop())
        except KeyboardInterrupt:
            logger.info("\n🛑 Simulator stopped")
