"""
Trust - System Health Module
Monitors overall system health and data pipeline status
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone
from tortoise import Tortoise
from app.config import get_settings


class SystemHealth:
    """Monitors system health and service status"""

    @staticmethod
    def _age_minutes(ts: Optional[datetime]) -> Optional[int]:
        if not ts:
            return None
        now = datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        delta = now - ts
        return max(0, int(delta.total_seconds() // 60))

    @staticmethod
    def _status_from_age(age_minutes: Optional[int], warn_threshold: int, critical_threshold: int) -> str:
        if age_minutes is None:
            return "stale"
        if age_minutes <= warn_threshold:
            return "fresh"
        if age_minutes <= critical_threshold:
            return "warning"
        return "stale"
    
    @staticmethod
    async def get_health_status() -> Dict[str, Any]:
        """
        Get overall system health status
        
        Returns:
            {
                "status": "healthy" | "degraded" | "unhealthy",
                "services": {...},
                "dataPipeline": {...},
                "timestamp": "..."
            }
        """
        
        settings = get_settings()

        db_status = "healthy"
        try:
            connection = Tortoise.get_connection("default")
            await connection.execute_query("SELECT 1")
        except Exception:
            db_status = "unhealthy"

        freshness = await SystemHealth.get_data_freshness()
        pipeline = freshness.get("by_type", {})

        overall_status = "healthy"
        if db_status != "healthy":
            overall_status = "degraded"
        elif freshness.get("overall") == "stale":
            overall_status = "degraded"

        return {
            "status": overall_status,
            "services": {
                "api": "healthy",
                "database": db_status,
                "analytics": "healthy"
            },
            "dataPipeline": {
                "environment": pipeline.get("environment", {}).get("status", "unknown"),
                "services": pipeline.get("services", {}).get("status", "unknown"),
                "traffic": pipeline.get("traffic", {}).get("status", "unknown")
            },
            "freshness_thresholds": {
                "warning_minutes": settings.FRESHNESS_THRESHOLD_WARNING,
                "critical_minutes": settings.FRESHNESS_THRESHOLD_CRITICAL
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    async def get_data_freshness() -> Dict[str, Any]:
        """
        Get data freshness report across all sources
        
        Returns freshness status for each data type and city
        """
        
        from app.models import City, EnvironmentData, TrafficData, ServiceData

        settings = get_settings()
        warn_threshold = settings.FRESHNESS_THRESHOLD_WARNING
        critical_threshold = settings.FRESHNESS_THRESHOLD_CRITICAL

        cities = await City.all()
        city_reports = []

        def latest_status(latest_ts: Optional[datetime]) -> Dict[str, Any]:
            age = SystemHealth._age_minutes(latest_ts)
            status = SystemHealth._status_from_age(age, warn_threshold, critical_threshold)
            return {
                "last_updated": latest_ts.isoformat() if latest_ts else None,
                "age_minutes": age,
                "status": status
            }

        for city in cities:
            env_latest = await EnvironmentData.filter(city=city).order_by("-timestamp").first()
            traffic_latest = await TrafficData.filter(city=city).order_by("-timestamp").first()
            services_latest = await ServiceData.filter(city=city).order_by("-timestamp").first()

            city_reports.append({
                "city": city.name,
                "environment": latest_status(env_latest.timestamp if env_latest else None),
                "traffic": latest_status(traffic_latest.timestamp if traffic_latest else None),
                "services": latest_status(services_latest.timestamp if services_latest else None)
            })

        # Aggregate by type
        def aggregate_latest(key: str) -> Dict[str, Any]:
            latest_ts = None
            for report in city_reports:
                ts = report[key]["last_updated"]
                if ts:
                    ts_dt = datetime.fromisoformat(ts)
                    if ts_dt.tzinfo is None:
                        ts_dt = ts_dt.replace(tzinfo=timezone.utc)
                    if not latest_ts or ts_dt > latest_ts:
                        latest_ts = ts_dt
            age = SystemHealth._age_minutes(latest_ts)
            status = SystemHealth._status_from_age(age, warn_threshold, critical_threshold)
            return {
                "latest_at": latest_ts.isoformat() if latest_ts else None,
                "age_minutes": age,
                "status": status
            }

        by_type = {
            "environment": aggregate_latest("environment"),
            "traffic": aggregate_latest("traffic"),
            "services": aggregate_latest("services")
        }

        statuses = [by_type[t]["status"] for t in ["environment", "traffic", "services"]]
        overall = "fresh"
        if "stale" in statuses:
            overall = "stale"
        elif "warning" in statuses:
            overall = "warning"

        summary = {
            "fresh": statuses.count("fresh"),
            "warning": statuses.count("warning"),
            "stale": statuses.count("stale"),
            "total": len(statuses)
        }

        return {
            "overall": overall,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": summary,
            "by_type": by_type,
            "cities": city_reports
        }
    
    @staticmethod
    async def log_system_event(category: str, action: str, success: bool, details: Dict = None):
        """Log system event to audit trail"""
        
        # TODO: Implement with Prisma
        # - Insert into SystemAuditLog
        
        pass
