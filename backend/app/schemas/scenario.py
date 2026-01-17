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
    baselineAQI: float = Field(..., ge=0, le=500)
    baselineWaterStress: Optional[float] = Field(None, ge=0, le=1)


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
