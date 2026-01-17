"""
Pydantic schemas for Alerts
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class AlertBase(BaseModel):
    type: str
    severity: str
    audience: str
    title: str
    message: str


class AlertCreate(AlertBase):
    city_id: str
    metadata: Optional[Dict[str, Any]] = None


class AlertResponse(AlertBase):
    id: str
    city_id: str
    is_active: bool
    resolved_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AlertAcknowledge(BaseModel):
    acknowledged_by: Optional[str] = Field(None, description="User who acknowledged the alert")


class AlertListResponse(BaseModel):
    city: str
    total_alerts: int
    active_alerts: int
    filters_applied: Dict[str, Any]
    alerts: list[AlertResponse]


class AlertGenerationResponse(BaseModel):
    city: str
    generated_at: str
    alerts_created: int
    breakdown: Dict[str, int]
    error: Optional[str] = None
