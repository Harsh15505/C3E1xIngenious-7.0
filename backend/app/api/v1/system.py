"""
System Health and Trust API Router
"""

from fastapi import APIRouter, HTTPException
from app.modules.trust.health import SystemHealth
from app.modules.trust.audit import AuditTrail
from app.models import City, DataSource, Forecast

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


@router.get("/audit/{city}")
async def get_city_audit(city: str, days: int = 7):
    """Get audit trail for a city"""
    # TODO: Implement - get city_id from city name
    return await AuditTrail.get_city_audit("city_id", days)


@router.get("/lineage/{metric}/{city}")
async def get_data_lineage(metric: str, city: str):
    """Get data lineage for a specific metric"""
    # TODO: Implement - get city_id from city name
    return await AuditTrail.get_data_lineage(metric, "city_id")
