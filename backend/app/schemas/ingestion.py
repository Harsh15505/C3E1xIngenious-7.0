"""
Ingestion API schemas
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from .common import DataIngestionBase


class EnvironmentDataInput(DataIngestionBase):
    aqi: Optional[float] = Field(None, ge=0, le=500)
    pm25: Optional[float] = Field(None, ge=0)
    temperature: Optional[float] = None
    rainfall: Optional[float] = Field(None, ge=0)


class ServiceDataInput(DataIngestionBase):
    waterSupplyStress: Optional[float] = Field(None, ge=0, le=1)
    wasteCollectionEff: Optional[float] = Field(None, ge=0, le=1)
    powerOutageCount: Optional[int] = Field(None, ge=0)


class TrafficDataInput(DataIngestionBase):
    zone: str = Field(..., pattern="^[ABC]$")
    densityPercent: float = Field(..., ge=0, le=100)
    congestionLevel: str = Field(..., pattern="^(low|medium|high)$")
    heavyVehicleCount: Optional[int] = Field(None, ge=0)


class IngestionResponse(BaseModel):
    success: bool
    recordId: str
    message: str
