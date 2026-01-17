"""
Historical Data Population Script
Generates 2 months of realistic synthesized data for analytics and charts
"""

import asyncio
from datetime import datetime, timedelta
import random
import math
from tortoise import Tortoise
from app.models import EnvironmentData, TrafficData, ServiceData, City
from app.config import get_settings
import ssl

settings = get_settings()

# Gujarat cities for state-specific prototype
CITIES = {
    'Ahmedabad': {'lat': 23.0225, 'lon': 72.5714, 'timezone': 'Asia/Kolkata', 'state': 'Gujarat', 'country': 'India', 'population': 8450000},
    'Gandhinagar': {'lat': 23.2156, 'lon': 72.6369, 'timezone': 'Asia/Kolkata', 'state': 'Gujarat', 'country': 'India', 'population': 292000},
    'Vadodara': {'lat': 22.3072, 'lon': 73.1812, 'timezone': 'Asia/Kolkata', 'state': 'Gujarat', 'country': 'India', 'population': 2065000},
}

# Realistic ranges for Gujarat cities
TEMP_RANGES = {
    'Ahmedabad': {'min': 15, 'max': 45, 'summer': 40, 'winter': 22},
    'Gandhinagar': {'min': 14, 'max': 44, 'summer': 39, 'winter': 21},
    'Vadodara': {'min': 16, 'max': 43, 'summer': 38, 'winter': 23},
}

AQI_RANGES = {
    'normal': (30, 80),
    'elevated': (80, 150),
    'poor': (150, 250),
    'hazardous': (250, 400),
}


def generate_realistic_temperature(city_name: str, timestamp: datetime, hour: int) -> float:
    """Generate realistic temperature with daily and seasonal patterns"""
    base_temp = TEMP_RANGES[city_name]['summer'] if timestamp.month in [4, 5, 6, 7, 8] else TEMP_RANGES[city_name]['winter']
    
    # Daily cycle: cooler at night, hotter in afternoon
    daily_variation = 8 * math.sin((hour - 6) * math.pi / 12)
    
    # Add some randomness
    noise = random.uniform(-2, 2)
    
    temp = base_temp + daily_variation + noise
    return round(temp, 1)


def generate_realistic_aqi(city_name: str, timestamp: datetime, hour: int) -> int:
    """Generate realistic AQI with patterns"""
    # Base AQI for Gujarat cities (generally moderate to high pollution)
    base_aqi = {
        'Ahmedabad': 140,  # Industrial city, higher pollution
        'Gandhinagar': 95,  # Capital city, better air quality
        'Vadodara': 125,    # Industrial hub
    }[city_name]
    
    # Rush hour increases (7-10am, 6-9pm)
    rush_hour_factor = 1.0
    if hour in [7, 8, 9, 18, 19, 20]:
        rush_hour_factor = 1.4
    elif hour in [6, 10, 17, 21]:
        rush_hour_factor = 1.2
    
    # Weekend reduction
    weekend_factor = 0.8 if timestamp.weekday() in [5, 6] else 1.0
    
    # Seasonal variation (worse in winter)
    seasonal_factor = 1.3 if timestamp.month in [11, 12, 1, 2] else 1.0
    
    # Calculate AQI
    aqi = base_aqi * rush_hour_factor * weekend_factor * seasonal_factor
    
    # Add noise
    aqi += random.uniform(-15, 15)
    
    # Occasional spikes (5% chance)
    if random.random() < 0.05:
        aqi *= random.uniform(1.3, 1.8)
    
    return int(max(20, min(450, aqi)))


def generate_traffic_congestion(city_name: str, timestamp: datetime, hour: int, zone: str) -> float:
    """Generate realistic traffic congestion levels"""
    # Base congestion varies by zone
    zone_base = {
        'central': 0.6,
        'north': 0.5,
        'south': 0.5,
        'east': 0.4,
        'west': 0.45,
    }.get(zone, 0.4)
    
    # Rush hour patterns
    if hour in [8, 9, 10]:  # Morning rush
        rush_factor = 2.0
    elif hour in [17, 18, 19, 20]:  # Evening rush
        rush_factor = 2.2
    elif hour in [7, 11, 16, 21]:
        rush_factor = 1.4
    elif hour in [0, 1, 2, 3, 4, 5]:  # Late night
        rush_factor = 0.2
    else:
        rush_factor = 1.0
    
    # Weekend reduction
    weekend_factor = 0.6 if timestamp.weekday() in [5, 6] else 1.0
    
    congestion = zone_base * rush_factor * weekend_factor
    
    # Add noise
    congestion += random.uniform(-0.1, 0.1)
    
    return round(max(0.0, min(1.0, congestion)), 2)


async def populate_historical_data():
    """Populate 2 months of realistic historical data"""
    
    print("🚀 Starting historical data population...")
    print("=" * 60)
    
    # Initialize Tortoise using same config as main app
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
    
    # Get or create cities
    cities_map = {}
    for city_name, coords in CITIES.items():
        city, _ = await City.get_or_create(
            name=city_name,
            defaults={
                'state': coords['state'],
                'country': coords['country'],
                'latitude': coords['lat'],
                'population': coords['population'],
                'latitude': coords['lat'],
                'longitude': coords['lon'],
                'timezone': coords['timezone'],
                'metadata': {
                    'population': coords['population'],
                    'region': 'Gujarat',
                    'prototype_city': True
                }
            }
        )
        cities_map[city_name] = city
        print(f"✅ City: {city_name} ({coords['state']})")
    
    # Generate data for last 60 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=60)
    
    print(f"\n📅 Generating data from {start_date.date()} to {end_date.date()}")
    print("=" * 60)
    
    total_records = 0
    
    # Generate hourly data
    current_date = start_date
    while current_date <= end_date:
        hour = current_date.hour
        
        for city_name, city in cities_map.items():
            # Environment Data
            temp = generate_realistic_temperature(city_name, current_date, hour)
            aqi = generate_realistic_aqi(city_name, current_date, hour)
            humidity = random.randint(40, 85)
            wind_speed = round(random.uniform(5, 25), 1)
            
            await EnvironmentData.create(
                city=city,
                timestamp=current_date,
                temperature=temp,
                aqi=aqi,
                humidity=humidity,
                wind_speed=wind_speed,
                precipitation=round(random.uniform(0, 5), 1) if random.random() < 0.1 else 0.0,
                source='historical_synthetic',
                metadata={
                    'synthetic': True,
                    'patterns': 'realistic_daily_seasonal'
                }
            )
            
            # Traffic Data (for major zones)
            for zone in ['central', 'north', 'south', 'east', 'west']:
                congestion = generate_traffic_congestion(city_name, current_date, hour, zone)
                
                await TrafficData.create(
                    city=city,
                    timestamp=current_date,
                    zone=zone,
                    density_percent=round(congestion * 100, 1),  # Convert to percentage
                    congestion_level=congestion,
                    avg_speed=round(random.uniform(15, 50) * (1 - congestion), 1),
                    incident_count=random.choices([0, 1, 2, 3], weights=[0.7, 0.2, 0.08, 0.02])[0],
                    source='historical_synthetic'
                )
            
            # Public Service Data (daily, not hourly)
            if hour == 12:  # Once per day at noon
                await ServiceData.create(
                    city=city,
                    timestamp=current_date,
                    service_type='water',
                    status='operational' if random.random() > 0.05 else 'degraded',
                    availability=round(random.uniform(0.85, 0.99), 2),
                    complaints=random.randint(0, 15),
                    source='historical_synthetic'
                )
                
                await ServiceData.create(
                    city=city,
                    timestamp=current_date,
                    service_type='power',
                    status='operational' if random.random() > 0.03 else 'degraded',
                    availability=round(random.uniform(0.92, 0.99), 2),
                    complaints=random.randint(0, 10),
                    source='historical_synthetic'
                )
                
                await ServiceData.create(
                    city=city,
                    timestamp=current_date,
                    service_type='waste',
                    status='operational' if random.random() > 0.08 else 'delayed',
                    availability=round(random.uniform(0.80, 0.95), 2),
                    complaints=random.randint(0, 25),
                    source='historical_synthetic'
                )
            
            total_records += 7  # 1 env + 5 traffic + (3 services if noon)
        
        current_date += timedelta(hours=1)
        
        # Progress indicator
        if current_date.hour == 0:
            days_done = (current_date - start_date).days
            print(f"📊 Progress: Day {days_done}/60")
    
    print("\n" + "=" * 60)
    print(f"✅ Historical data population complete!")
    print(f"📈 Total records created: ~{total_records:,}")
    print(f"🏙️  Gujarat Cities: {len(cities_map)}")
    print(f"   - Ahmedabad (8.45M population)")
    print(f"   - Gandhinagar (292K population, State Capital)")
    print(f"   - Vadodara (2.07M population)")
    print(f"📅 Date range: {start_date.date()} to {end_date.date()}")
    print(f"🌡️  Data types: Environment, Traffic, Services")
    print("=" * 60)
    print("=" * 60)
    
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(populate_historical_data())
