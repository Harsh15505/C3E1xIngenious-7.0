"""
Configuration Management
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database (Aiven PostgreSQL)
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_NAME: str = "urban_intelligence"
    DATABASE_URL: str = ""  # Constructed from components above
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Urban Intelligence Platform"
    
    # Data freshness thresholds (minutes)
    FRESHNESS_THRESHOLD_CRITICAL: int = 60
    FRESHNESS_THRESHOLD_WARNING: int = 30
    
    # External APIs
    OPENWEATHER_API_KEY: str = ""
    AQICN_API_KEY: str = ""  # Optional, some endpoints are free
    
    # Forecasting
    FORECAST_DAYS: int = 7
    
    # Risk thresholds
    RISK_THRESHOLD_HIGH: float = 0.7
    RISK_THRESHOLD_MEDIUM: float = 0.4
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()
