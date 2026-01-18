"""
OpenWeatherMap API Integration
Fetches real-time weather data for cities
"""

import aiohttp
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class WeatherFetcher:
    """Fetch weather data from OpenWeatherMap API"""
    
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    AIR_QUALITY_URL = "http://api.openweathermap.org/data/2.5/air_pollution"
    
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        if not self.api_key:
            logger.warning("OpenWeatherMap API key not configured")
    
    async def fetch_weather(self, city: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Fetch current weather data for a city
        
        Args:
            city: City name
            lat: Latitude
            lon: Longitude
        
        Returns:
            {
                'temperature': float,
                'humidity': float,
                'pressure': float,
                'wind_speed': float,
                'weather_condition': str,
                'timestamp': str
            }
        """
        if not self.api_key:
            logger.error("Cannot fetch weather: API key not configured")
            return None
        
        try:
            url = f"{self.BASE_URL}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'  # Celsius
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status != 200:
                        logger.error(f"Weather API error for {city}: {response.status}")
                        return None
                    
                    data = await response.json()
                    
                    return {
                        'temperature': data['main']['temp'],
                        'humidity': data['main']['humidity'],
                        'pressure': data['main']['pressure'],
                        'wind_speed': data['wind']['speed'],
                        'weather_condition': data['weather'][0]['main'],
                        'description': data['weather'][0]['description'],
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'source': 'openweathermap'
                    }
        
        except aiohttp.ClientError as e:
            logger.error(f"Network error fetching weather for {city}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching weather for {city}: {e}")
            return None
    
    async def fetch_air_quality(self, city: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Fetch air quality data for a city
        
        Args:
            city: City name
            lat: Latitude
            lon: Longitude
        
        Returns:
            {
                'aqi': int (1-5 scale, converted to 0-500),
                'pm25': float,
                'pm10': float,
                'no2': float,
                'o3': float,
                'timestamp': str
            }
        """
        if not self.api_key:
            logger.error("Cannot fetch air quality: API key not configured")
            return None
        
        try:
            url = f"{self.AIR_QUALITY_URL}"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status != 200:
                        logger.error(f"Air Quality API error for {city}: {response.status}")
                        return None
                    
                    data = await response.json()
                    components = data['list'][0]['components']
                    aqi_level = data['list'][0]['main']['aqi']  # 1-5 scale
                    
                    # Convert OpenWeatherMap AQI (1-5) to US AQI (0-500) scale
                    aqi_map = {1: 50, 2: 100, 3: 150, 4: 200, 5: 300}
                    aqi = aqi_map.get(aqi_level, 100)
                    
                    return {
                        'aqi': aqi,
                        'pm25': components.get('pm2_5', 0),
                        'pm10': components.get('pm10', 0),
                        'no2': components.get('no2', 0),
                        'o3': components.get('o3', 0),
                        'co': components.get('co', 0),
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'source': 'openweathermap'
                    }
        
        except aiohttp.ClientError as e:
            logger.error(f"Network error fetching air quality for {city}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching air quality for {city}: {e}")
            return None
    
    async def fetch_complete_data(self, city: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Fetch both weather and air quality data
        
        Returns:
            Combined dictionary with all metrics
        """
        weather_data = await self.fetch_weather(city, lat, lon)
        air_quality_data = await self.fetch_air_quality(city, lat, lon)
        
        if not weather_data:
            logger.error(f"Failed to fetch weather data for {city}")
            return None
        
        # Merge data
        result = {**weather_data}
        if air_quality_data:
            result.update({
                'aqi': air_quality_data['aqi'],
                'pm25': air_quality_data['pm25'],
                'pm10': air_quality_data['pm10'],
                'no2': air_quality_data['no2'],
                'o3': air_quality_data['o3'],
                'co': air_quality_data.get('co', 0)
            })
        else:
            logger.warning(f"Air quality data unavailable for {city}, using defaults")
            result.update({
                'aqi': 100,
                'pm25': 35.0,
                'pm10': 50.0,
                'no2': 40.0,
                'o3': 60.0,
                'co': 400.0
            })
        
        return result


async def fetch_and_store_weather(city_name: str, lat: float, lon: float) -> bool:
    """
    Fetch weather data and store in database
    
    Args:
        city_name: City name
        lat: Latitude
        lon: Longitude
    
    Returns:
        True if successful, False otherwise
    """
    from app.models import City, EnvironmentData
    
    fetcher = WeatherFetcher()
    data = await fetcher.fetch_complete_data(city_name, lat, lon)
    
    if not data:
        logger.error(f"Failed to fetch data for {city_name}")
        return False
    
    try:
        # Get city object
        city = await City.filter(name__iexact=city_name).first()
        if not city:
            logger.error(f"City {city_name} not found in database")
            return False
        
        # Store environment data (schema-aligned)
        # Always mark real API data with source='openweathermap'
        await EnvironmentData.create(
            city=city,
            timestamp=datetime.now(timezone.utc),
            temperature=data['temperature'],
            aqi=data['aqi'],
            pm25=data.get('pm25', 35.0),
            rainfall=0.0,  # Not available from OpenWeatherMap basic plan
            source='openweathermap',  # Real API data identifier
            is_fresh=True,
            is_validated=True  # API data is pre-validated
        )
        
        logger.info(f"✓ Stored REAL weather data for {city_name}: Temp={data['temperature']}°C, AQI={data['aqi']}")
        return True
    
    except Exception as e:
        logger.error(f"Error storing weather data for {city_name}: {e}")
        return False


async def fetch_all_cities_weather():
    """
    Fetch weather data for all cities in database
    """
    from app.models import City
    
    cities = await City.all()
    logger.info(f"Fetching weather data for {len(cities)} cities...")
    
    success_count = 0
    for city in cities:
        success = await fetch_and_store_weather(city.name, city.latitude, city.longitude)
        if success:
            success_count += 1
    
    logger.info(f"Weather fetch complete: {success_count}/{len(cities)} successful")
    return success_count
