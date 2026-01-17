"""
Alerts API Endpoints
Manages alert generation, retrieval, and acknowledgment
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timedelta
import logging

from app.models import City, Alert
from app.schemas.alerts import (
    AlertResponse, 
    AlertListResponse, 
    AlertGenerationResponse,
    AlertAcknowledge
)
from app.modules.alerts.generator import AlertGenerator

router = APIRouter(prefix="/alerts", tags=["alerts"])
logger = logging.getLogger(__name__)


@router.get("/{city}", response_model=AlertListResponse)
async def get_alerts(
    city: str,
    audience: Optional[str] = Query(None, description="Filter by audience: public, internal, both"),
    severity: Optional[str] = Query(None, description="Filter by severity: info, warning, critical"),
    active_only: bool = Query(True, description="Show only active alerts"),
    limit: int = Query(50, le=200, description="Maximum alerts to return")
):
    """
    Get all alerts for a city with optional filters.
    
    - **city**: City name
    - **audience**: Filter by audience (public/internal/both)
    - **severity**: Filter by severity level (info/warning/critical)
    - **active_only**: Show only unresolved alerts
    - **limit**: Maximum number of alerts to return
    """
    try:
        # Get city
        city_obj = await City.filter(name__iexact=city).first()
        if not city_obj:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found")
        
        # Build query
        query = {"city": city_obj}
        
        if active_only:
            query["is_active"] = True
        
        if audience:
            query["audience"] = audience
        
        if severity:
            query["severity"] = severity
        
        # Get alerts
        alerts = await Alert.filter(**query).order_by("-created_at").limit(limit)
        
        # Count totals
        total_alerts = await Alert.filter(city=city_obj).count()
        active_alerts = await Alert.filter(city=city_obj, is_active=True).count()
        
        # Convert to response format
        alert_responses = []
        for alert in alerts:
            alert_responses.append(AlertResponse(
                id=str(alert.id),
                city_id=str(alert.city_id),
                type=alert.type,
                severity=alert.severity,
                audience=alert.audience,
                title=alert.title,
                message=alert.message,
                is_active=alert.is_active,
                resolved_at=alert.resolved_at,
                metadata=alert.metadata,
                created_at=alert.created_at
            ))
        
        return AlertListResponse(
            city=city,
            total_alerts=total_alerts,
            active_alerts=active_alerts,
            filters_applied={
                "audience": audience,
                "severity": severity,
                "active_only": active_only,
                "limit": limit
            },
            alerts=alert_responses
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving alerts for {city}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve alerts: {str(e)}")


@router.post("/{city}/generate", response_model=AlertGenerationResponse)
async def generate_alerts(city: str):
    """
    Generate new alerts for a city based on current conditions.
    
    Analyzes:
    - Recent anomalies (unresolved)
    - High risk scores
    - Forecast threshold breaches
    - System health issues
    
    Returns summary of alerts created.
    """
    try:
        result = await AlertGenerator.generate_all_alerts(city)
        
        if "error" in result:
            raise HTTPException(status_code=404 if "not found" in result["error"].lower() else 500, 
                              detail=result["error"])
        
        return AlertGenerationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating alerts for {city}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate alerts: {str(e)}")


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    acknowledge: Optional[AlertAcknowledge] = None
):
    """
    Resolve an active alert by marking it as inactive.
    
    - **alert_id**: UUID of the alert to resolve
    - **acknowledge**: Optional acknowledgment information
    """
    try:
        alert = await Alert.filter(id=alert_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
        
        if not alert.is_active:
            return {
                "message": "Alert already resolved",
                "alert_id": alert_id,
                "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None
            }
        
        # Update alert
        alert.is_active = False
        alert.resolved_at = datetime.utcnow()
        
        # Add acknowledgment info to metadata
        if acknowledge and acknowledge.acknowledged_by:
            if not alert.metadata:
                alert.metadata = {}
            alert.metadata["acknowledged_by"] = acknowledge.acknowledged_by
            alert.metadata["acknowledged_at"] = datetime.utcnow().isoformat()
        
        await alert.save()
        
        return {
            "message": "Alert resolved successfully",
            "alert_id": alert_id,
            "resolved_at": alert.resolved_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving alert {alert_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to resolve alert: {str(e)}")


@router.get("/{city}/summary")
async def get_alert_summary(city: str):
    """
    Get summary statistics of alerts for a city.
    
    Returns counts by type, severity, and recent activity.
    """
    try:
        city_obj = await City.filter(name__iexact=city).first()
        if not city_obj:
            raise HTTPException(status_code=404, detail=f"City '{city}' not found")
        
        # Get counts
        total = await Alert.filter(city=city_obj).count()
        active = await Alert.filter(city=city_obj, is_active=True).count()
        
        # By severity
        critical = await Alert.filter(city=city_obj, is_active=True, severity="critical").count()
        warning = await Alert.filter(city=city_obj, is_active=True, severity="warning").count()
        info = await Alert.filter(city=city_obj, is_active=True, severity="info").count()
        
        # By type
        risk = await Alert.filter(city=city_obj, is_active=True, type="risk").count()
        anomaly = await Alert.filter(city=city_obj, is_active=True, type="anomaly").count()
        forecast = await Alert.filter(city=city_obj, is_active=True, type="forecast").count()
        system = await Alert.filter(city=city_obj, is_active=True, type="system").count()
        
        # Recent activity (last 24 hours)
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        recent = await Alert.filter(city=city_obj, created_at__gte=recent_cutoff).count()
        
        return {
            "city": city,
            "total_alerts": total,
            "active_alerts": active,
            "by_severity": {
                "critical": critical,
                "warning": warning,
                "info": info
            },
            "by_type": {
                "risk": risk,
                "anomaly": anomaly,
                "forecast": forecast,
                "system": system
            },
            "recent_24h": recent
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting alert summary for {city}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get alert summary: {str(e)}")
