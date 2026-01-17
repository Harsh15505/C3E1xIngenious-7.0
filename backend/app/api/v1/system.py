"""
System Health and Trust API Router
"""

from fastapi import APIRouter
from app.modules.trust.health import SystemHealth
from app.modules.trust.audit import AuditTrail

router = APIRouter()


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
