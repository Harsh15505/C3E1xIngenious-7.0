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


class CreateManualAlertRequest(BaseModel):
    """Schema for creating manual public announcements"""
    city: str = Field(..., description="City name or 'all' for all cities")
    title: str = Field(..., min_length=5, max_length=200, description="Alert title")
    message: str = Field(..., min_length=10, max_length=1000, description="Alert message")
    severity: str = Field(..., pattern="^(info|warning|critical)$", description="Alert severity")
    audience: str = Field(default="public", pattern="^(public|internal|both)$", description="Target audience")
    start_date: Optional[datetime] = Field(None, description="When alert becomes active (defaults to now)")
    end_date: Optional[datetime] = Field(None, description="When alert expires (optional)")


class CreateManualAlertResponse(BaseModel):
    """Response after creating manual alert"""
    success: bool
    message: str
    alert_ids: list[str]
    cities_targeted: list[str]
