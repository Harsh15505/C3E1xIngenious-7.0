"""
Scenario API schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ScenarioInput(BaseModel):
    city: str
    zone: str = Field(..., pattern="^[ABC]$")
    timeWindow: str = Field(..., description="e.g., '08:00-11:00'")
    trafficDensityChange: float = Field(..., description="Percentage change, can be negative")
    heavyVehicleRestriction: bool = False
    baselineAQI: Optional[float] = Field(None, ge=0, le=500, description="If not provided, fetched from database")
    baselineWaterStress: Optional[float] = Field(None, ge=0, le=1)
    temperatureChange: Optional[float] = Field(0, ge=-20, le=20, description="Delta in °C applied to baseline temperature")
    aqiChange: Optional[float] = Field(0, ge=-300, le=300, description="Manual AQI change in % to combine with traffic effect")
    serviceDegradation: Optional[float] = Field(0, ge=0, le=100, description="Service reliability degradation %")
    trafficMultiplier: Optional[float] = Field(None, ge=0.2, le=3.0, description="Multiplier for traffic density slider")
    baselineTemperature: Optional[float] = Field(None, ge=-20, le=60, description="Current city baseline temperature if known")


class ImpactPrediction(BaseModel):
    metric: str
    direction: str  # increase or decrease
    magnitude: float  # percentage
    confidence: float = Field(..., ge=0, le=1)
    explanation: str


class ScenarioResult(BaseModel):
    impacts: List[ImpactPrediction]
    overallConfidence: float = Field(..., ge=0, le=1)
    explanation: str
    timestamp: str


class ScenarioSaveRequest(BaseModel):
    name: str
    description: Optional[str] = None
    input: ScenarioInput
    result: ScenarioResult
