"""
System Health and Trust API Router
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.modules.trust.health import SystemHealth
from app.modules.trust.audit import AuditTrail
from app.models import City, DataSource, Forecast, SystemAuditLog
from app.modules.auth.middleware import get_current_admin

router = APIRouter()


@router.get("/metadata")
async def get_system_metadata():
    """Get system metadata - cities, data sources, etc."""
    cities = await City.all()
    data_sources = await DataSource.all()
    
    return {
        "cities": [
            {
                "name": c.name,
                "state": c.state,
                "population": c.population
            }
            for c in cities
        ],
        "data_sources": [
            {
                "name": ds.name,
                "type": ds.type,
                "is_online": ds.is_online,
                "expected_frequency": ds.expected_frequency,
                "last_seen_at": ds.last_seen_at.isoformat() if ds.last_seen_at else None,
                "total_ingestions": ds.total_ingestions
            }
            for ds in data_sources
        ],
        "total_cities": len(cities),
        "total_sources": len(data_sources),
        "online_sources": sum(1 for ds in data_sources if ds.is_online)
    }


@router.get("/forecasts/{city}")
async def get_city_forecasts(city: str, limit: int = 50):
    """Get forecasts for a city"""
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    
    forecasts = await Forecast.filter(city=city_obj).order_by('-target_date').limit(limit)
    
    return {
        "city": city,
        "total_forecasts": len(forecasts),
        "forecasts": [
            {
                "metric_type": f.metric_type,
                "target_date": f.target_date.isoformat(),
                "predicted_value": f.predicted_value,
                "confidence": f.confidence,
                "created_at": f.created_at.isoformat()
            }
            for f in forecasts
        ]
    }


@router.get("/health")
async def get_system_health():
    """Get overall system health status"""
    return await SystemHealth.get_health_status()


@router.get("/freshness")
async def get_data_freshness():
    """Get data freshness report across all sources"""
    return await SystemHealth.get_data_freshness()


@router.get("/audit")
async def get_audit_logs(
    user_email: Optional[str] = None,
    role: Optional[str] = None,
    status_code: Optional[int] = None,
    method: Optional[str] = None,
    path_prefix: Optional[str] = None,
    city: Optional[str] = None,
    since_hours: int = 168,  # default 7 days
    limit: int = 100,
    offset: int = 0,
    admin=Depends(get_current_admin),
):
    """Admin-only: query audit logs with filters."""

    # Clamp limits to avoid heavy responses
    limit = min(max(limit, 1), 200)
    offset = max(offset, 0)

    query = SystemAuditLog.all()

    if since_hours:
        from datetime import datetime, timedelta

        since_ts = datetime.utcnow() - timedelta(hours=since_hours)
        query = query.filter(timestamp__gte=since_ts)

    if user_email:
        query = query.filter(user_email__icontains=user_email)
    if role:
        query = query.filter(user_role__iexact=role)
    if status_code:
        query = query.filter(status_code=status_code)
    if method:
        query = query.filter(method__iexact=method)
    if path_prefix:
        query = query.filter(path__startswith=path_prefix)
    if city:
        query = query.filter(city_id__iexact=city)

    total = await query.count()
    rows = await query.order_by("-timestamp").offset(offset).limit(limit)

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": str(r.id),
                "timestamp": r.timestamp.isoformat(),
                "method": r.method,
                "path": r.path,
                "status_code": r.status_code,
                "latency_ms": r.latency_ms,
                "client_ip": r.client_ip,
                "user_email": r.user_email,
                "user_role": r.user_role,
                "category": r.category,
                "action": r.action,
                "city": r.city_id,
                "success": r.success,
                "error_message": r.error_message,
            }
            for r in rows
        ],
    }


@router.get("/lineage/{metric}/{city}")
async def get_data_lineage(metric: str, city: str):
    """Get data lineage for a specific metric"""
    # TODO: Implement - get city_id from city name
    return await AuditTrail.get_data_lineage(metric, "city_id")
