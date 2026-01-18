"""REALISTIC hourly data generation - optimized for speed + realism"""
import asyncio
from datetime import datetime, timedelta, timezone
import random
import math
from tortoise import Tortoise
from app.models import EnvironmentData, TrafficData, ServiceData, City
from app.config import get_settings

def get_season_factor(day_of_year):
    """Returns 0-1 factor for seasonal variation (winter=0, summer=1)"""
    # Peak summer around day 150 (May-June for India)
    return 0.5 + 0.5 * math.sin((day_of_year - 80) * 2 * math.pi / 365)

def get_daily_temp_variation(hour):
    """Temperature variation throughout day"""
    # Coldest at 5am, hottest at 2pm
    return 10 * math.sin((hour - 5) * math.pi / 12)

def is_rush_hour(hour):
    """Check if it's rush hour"""
    return (7 <= hour <= 9) or (17 <= hour <= 19)

def get_traffic_base_congestion(hour):
    """Realistic traffic patterns"""
    if 7 <= hour <= 9:  # Morning rush
        return random.choice(['high', 'high', 'medium'])
    elif 17 <= hour <= 19:  # Evening rush
        return random.choice(['high', 'high', 'high', 'medium'])
    elif 10 <= hour <= 16:  # Daytime
        return random.choice(['medium', 'medium', 'low'])
    else:  # Night
        return random.choice(['low', 'low', 'medium'])

async def fast_populate():
    settings = get_settings()
    if settings.DATABASE_URL:
        db_url = settings.DATABASE_URL
    else:
        db_url = (
            f"postgres://{settings.DB_USER}:{settings.DB_PASSWORD}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
        )

    await Tortoise.init(
        db_url=db_url,
        modules={'models': ['app.models']},
        use_tz=True,
        timezone='UTC',
    )
    await Tortoise.generate_schemas()
    
    print(f"🚀 REALISTIC 60-day HOURLY population starting... (db={db_url})")
    
    cities = await City.all()
    if not cities:
        print("Creating cities...")
        for name in ['Ahmedabad', 'Gandhinagar', 'Vadodara']:
            await City.create(name=name, state='Gujarat', country='India')
        cities = await City.all()
    
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=60)
    
    batch_env = []
    batch_traffic = []
    batch_service = []
    
    # HOURLY data for 60 days = 1440 records per city
    total_hours = 60 * 24
    print(f"Generating {total_hours} hourly data points × 3 cities...")
    print("Using realistic patterns: seasonal temps, rush hour traffic, pollution cycles")
    
    # City-specific base temperatures (Gujarat)
    city_params = {
        'Ahmedabad': {'base_temp': 29, 'aqi_bias': 12, 'traffic_bias': 1.05},
        'Gandhinagar': {'base_temp': 27, 'aqi_bias': -8, 'traffic_bias': 0.9},
        'Vadodara': {'base_temp': 26, 'aqi_bias': 5, 'traffic_bias': 0.97},
    }
    
    for city in cities:
        params = city_params.get(city.name, {'base_temp': 27, 'aqi_bias': 0, 'traffic_bias': 1.0})
        base_temp = params['base_temp']
        aqi_bias = params['aqi_bias']
        traffic_bias = params['traffic_bias']
        
        # Track previous values for smooth transitions
        prev_aqi = 80
        prev_humidity = 50
        
        for hour_idx in range(total_hours):
            time = start + timedelta(hours=hour_idx)
            hour = time.hour
            day_of_year = time.timetuple().tm_yday
            
            # REALISTIC TEMPERATURE
            season = get_season_factor(day_of_year)
            daily_var = get_daily_temp_variation(hour)
            temp = base_temp + season * 15 + daily_var + random.uniform(-2, 2)
            temp = round(max(15, min(45, temp)), 1)
            
            # REALISTIC AQI - correlates with traffic, smooth transitions
            rush_factor = 30 if is_rush_hour(hour) else 0
            seasonal_pollution = season * 20  # Higher in summer
            aqi = prev_aqi * 0.7 + (70 + aqi_bias + rush_factor + seasonal_pollution + random.uniform(-15, 15)) * 0.3
            aqi = int(max(30, min(300, aqi)))
            prev_aqi = aqi
            
            # REALISTIC HUMIDITY - inverse with temp, smooth
            humidity_base = 60 - (temp - 25) * 2
            humidity = prev_humidity * 0.8 + humidity_base * 0.2 + random.uniform(-5, 5)
            humidity = int(max(20, min(90, humidity)))
            prev_humidity = humidity
            
            batch_env.append(EnvironmentData(
                city=city,
                temperature=temp,
                humidity=humidity,
                aqi=aqi,
                pm25=round(aqi * 0.58, 1),
                timestamp=time,
                source='realistic_synthetic',
                is_validated=True
            ))
            
            # REALISTIC TRAFFIC - 5 zones with different patterns
            base_congestion = get_traffic_base_congestion(hour)
            zone_factors = {
                'A': 1.2,  # Commercial zone - more congestion
                'B': 1.0,  # Balanced
                'C': 0.8,  # Residential - less during day
                'D': 1.1,  # Industrial
                'E': 0.9   # Suburban
            }
            
            for zone, factor in zone_factors.items():
                congestion = base_congestion
                
                # Zone-specific adjustments
                if zone == 'C' and 10 <= hour <= 16:  # Residential quiet during work hours
                    congestion = 'low' if congestion != 'high' else 'medium'
                elif zone == 'D' and (hour < 6 or hour > 20):  # Industrial area quiet at night
                    congestion = 'low'
                
                density_map = {'low': 25, 'medium': 60, 'high': 88}
                base_density = density_map[congestion]
                density = base_density * factor * traffic_bias + random.uniform(-8, 8)
                density = max(10, min(100, density))
                
                heavy_vehicles = random.randint(5, 15) if congestion == 'low' else \
                                random.randint(15, 35) if congestion == 'medium' else \
                                random.randint(30, 60)
                
                batch_traffic.append(TrafficData(
                    city=city,
                    zone=zone,
                    density_percent=round(density, 1),
                    congestion_level=congestion,
                    heavy_vehicle_count=heavy_vehicles,
                    timestamp=time,
                    source='realistic_synthetic',
                    is_validated=True
                ))
        
        # REALISTIC SERVICE DATA - varies over time
        for day in range(60):
            time = start + timedelta(days=day, hours=12)
            batch_service.append(ServiceData(
                city=city,
                water_supply_stress=0.2 + random.random() * 0.4 + math.sin(day * 0.1) * 0.1,
                waste_collection_eff=0.75 + random.random() * 0.15,
                power_outage_count=random.choices([0, 1, 2, 3, 4], weights=[50, 30, 15, 4, 1])[0],
                timestamp=time,
                source='realistic_synthetic'
            ))
    
    print(f"Bulk inserting {len(batch_env)} environment records...")
    await EnvironmentData.bulk_create(batch_env, batch_size=500)
    
    print(f"Bulk inserting {len(batch_traffic)} traffic records...")
    await TrafficData.bulk_create(batch_traffic, batch_size=500)
    
    print(f"Bulk inserting {len(batch_service)} service records...")
    await ServiceData.bulk_create(batch_service)
    
    print(f"\n✅ DONE! Created:")
    print(f"   Environment: {len(batch_env)}")
    print(f"   Traffic: {len(batch_traffic)}")
    print(f"   Services: {len(batch_service)}")
    
    await Tortoise.close_connections()

if __name__ == '__main__':
    asyncio.run(fast_populate())
