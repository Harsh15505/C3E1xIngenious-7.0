"""
Analytics API schemas
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class ForecastPoint(BaseModel):
    targetDate: datetime
    predictedValue: float
    confidence: float = Field(..., ge=0, le=1)
    explanation: str


class ForecastResponse(BaseModel):
    city: str
    metricType: str
    forecasts: List[ForecastPoint]
    generatedAt: datetime


class AnomalyRecord(BaseModel):
    id: str
    metricType: str
    detectedAt: datetime
    value: float
    expectedValue: float
    deviation: float
    severity: str
    explanation: str


class RiskScore(BaseModel):
    overall: float = Field(..., ge=0, le=1)
    level: str  # low, medium, high
    components: Dict[str, float]
    explanation: str
