"""
Configuration Management
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/urban_intelligence"
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Urban Intelligence Platform"
    
    # Data freshness thresholds (minutes)
    FRESHNESS_THRESHOLD_CRITICAL: int = 60
    FRESHNESS_THRESHOLD_WARNING: int = 30
    
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
