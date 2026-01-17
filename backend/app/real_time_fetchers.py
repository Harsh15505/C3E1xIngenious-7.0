"""
Real-time Data Fetchers
Fetches current data from external APIs (OpenWeatherMap, AQICN)
"""

import aiohttp
import asyncio
from datetime import datetime
from typing import Dict, Optional
import logging
from app.config import get_settings
from app.models import City, EnvironmentData
from tortoise import Tortoise

settings = get_settings()
logger = logging.getLogger(__name__)


class RealTimeDataFetcher:
    """Fetches real-time data from external APIs"""
    
    OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
    AQICN_BASE_URL = "https://api.waqi.info/feed"
    
    def __init__(self):
        self.openweather_key = settings.OPENWEATHER_API_KEY
        self.aqicn_key = settings.AQICN_API_KEY if settings.AQICN_API_KEY else None
    
    async def fetch_openweather_data(self, city_name: str, lat: float, lon: float) -> Optional[Dict]:
        """Fetch current weather data from OpenWeatherMap"""
        if not self.openweather_key:
            logger.warning("OpenWeatherMap API key not configured")
            return None
        
        url = f"{self.OPENWEATHER_BASE_URL}?lat={lat}&lon={lon}&appid={self.openweather_key}&units=metric"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {
                            'temperature': data['main']['temp'],
                            'humidity': data['main']['humidity'],
                            'wind_speed': data['wind']['speed'],
                            'pressure': data['main']['pressure'],
                            'description': data['weather'][0]['description'],
                            'source': 'openweathermap',
                            'timestamp': datetime.utcnow()
                        }
                    else:
                        logger.error(f"OpenWeatherMap API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Failed to fetch OpenWeatherMap data: {e}")
            return None
    
    async def fetch_aqicn_data(self, city_name: str, lat: float, lon: float) -> Optional[Dict]:
        """Fetch AQI data from AQICN
        
        Note: AQICN has free geo-location endpoint that doesn't require API key
        """
        # Try geo-location endpoint (free, no key needed)
        url = f"https://api.waqi.info/feed/geo:{lat};{lon}/"
        
        # If we have a key, add it
        if self.aqicn_key:
            url += f"?token={self.aqicn_key}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        if data.get('status') == 'ok':
                            aqi_data = data['data']
                            return {
                                'aqi': aqi_data.get('aqi', 0),
                                'pm25': aqi_data.get('iaqi', {}).get('pm25', {}).get('v', 0),
                                'pm10': aqi_data.get('iaqi', {}).get('pm10', {}).get('v', 0),
                                'source': 'aqicn',
                                'timestamp': datetime.utcnow()
                            }
                    else:
                        logger.warning(f"AQICN API returned status {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Failed to fetch AQICN data: {e}")
            return None
    
    async def fetch_and_store_current_data(self, city: City) -> bool:
        """Fetch current data from all sources and store in database"""
        try:
            # Fetch weather data
            weather_data = await self.fetch_openweather_data(
                city.name,
                city.latitude,
                city.longitude
            )
            
            # Fetch AQI data
            aqi_data = await self.fetch_aqicn_data(
                city.name,
                city.latitude,
                city.longitude
            )
            
            if not weather_data and not aqi_data:
                logger.warning(f"No data fetched for {city.name}")
                return False
            
            # Combine data and store
            env_record = {
                'city': city,
                'timestamp': datetime.utcnow(),
                'temperature': weather_data.get('temperature') if weather_data else None,
                'humidity': weather_data.get('humidity') if weather_data else None,
                'wind_speed': weather_data.get('wind_speed') if weather_data else None,
                'aqi': aqi_data.get('aqi') if aqi_data else None,
                'precipitation': 0.0,  # Not available from free APIs
                'source': 'realtime_api',
                'metadata': {
                    'weather_source': 'openweathermap' if weather_data else None,
                    'aqi_source': 'aqicn' if aqi_data else None,
                    'description': weather_data.get('description') if weather_data else None,
                    'pm25': aqi_data.get('pm25') if aqi_data else None,
                    'pm10': aqi_data.get('pm10') if aqi_data else None,
                }
            }
            
            await EnvironmentData.create(**env_record)
            logger.info(f"✅ Stored real-time data for {city.name}: Temp={env_record['temperature']}°C, AQI={env_record['aqi']}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to fetch and store data for {city.name}: {e}")
            return False
    
    async def fetch_all_cities(self):
        """Fetch current data for all cities"""
        cities = await City.all()
        
        results = []
        for city in cities:
            success = await self.fetch_and_store_current_data(city)
            results.append((city.name, success))
        
        successful = sum(1 for _, success in results if success)
        logger.info(f"Real-time data fetch complete: {successful}/{len(cities)} cities updated")
        
        return results


# Standalone function for scheduler
async def fetch_realtime_data():
    """Scheduled task to fetch real-time data"""
    logger.info(f"[CRON] Fetching real-time data at {datetime.utcnow()}")
    
    fetcher = RealTimeDataFetcher()
    await fetcher.fetch_all_cities()


# Test script
async def test_realtime_fetch():
    """Test the real-time data fetching"""
    import ssl
    from app.config import get_settings
    
    settings = get_settings()
    
    # Initialize Tortoise
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={'models': ['app.models']},
        use_tz=True,
        timezone='UTC',
    )
    
    print("🌐 Testing real-time data fetch...")
    print("=" * 60)
    
    fetcher = RealTimeDataFetcher()
    results = await fetcher.fetch_all_cities()
    
    print("\n📊 Results:")
    for city_name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {city_name}")
    
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(test_realtime_fetch())
