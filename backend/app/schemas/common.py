"""
Common Pydantic schemas used across API
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CityBase(BaseModel):
    name: str
    state: str
    population: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DataIngestionBase(BaseModel):
    city: str
    timestamp: datetime
    source: str


class HealthResponse(BaseModel):
    status: str
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None
