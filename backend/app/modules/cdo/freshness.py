"""
Central Data Office (CDO) - Freshness Tracker
Tracks data freshness and identifies stale/offline sources
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.models import DataSource
from app.config import get_settings

settings = get_settings()


class FreshnessTracker:
    """Tracks data freshness and source health"""
    
    @staticmethod
    def check_freshness(timestamp: datetime, threshold_minutes: int = 30) -> tuple[bool, int]:
        """
        Check if data is fresh
        
        Returns:
            (is_fresh, minutes_old)
        """
        now = datetime.utcnow()
        age = now - timestamp
        minutes_old = int(age.total_seconds() / 60)
        
        return minutes_old <= threshold_minutes, minutes_old
    
    @staticmethod
    async def update_source_status(source_id: str, success: bool = True):
        """Update data source last seen and status"""
        source = await DataSource.filter(name=source_id).first()
        
        if not source:
            # Create new data source if it doesn't exist
            source = await DataSource.create(
                name=source_id,
                type="sensor",
                expected_frequency=15,  # Default 15 minutes
                is_online=success,
                failure_count=0 if success else 1,
                total_ingestions=1 if success else 0,
                last_seen_at=datetime.utcnow()
            )
        else:
            # Update existing source
            source.last_seen_at = datetime.utcnow()
            
            if success:
                source.is_online = True
                source.failure_count = 0
                source.total_ingestions += 1
            else:
                source.failure_count += 1
                # Mark offline if 3+ consecutive failures
                if source.failure_count >= 3:
                    source.is_online = False
            
            await source.save()
    
    @staticmethod
    async def get_stale_sources() -> list[Dict[str, Any]]:
        """Get list of stale/offline data sources"""
        sources = await DataSource.all()
        stale_sources = []
        
        now = datetime.utcnow()
        
        for source in sources:
            if not source.last_seen_at:
                stale_sources.append({
                    "source": source.name,
                    "name": source.name,
                    "status": "never_reported",
                    "expected_frequency": source.expected_frequency
                })
            else:
                time_since_last = (now - source.last_seen_at).total_seconds() / 60
                expected = source.expected_frequency
                
                # Consider stale if > 2x expected frequency
                if time_since_last > (expected * 2):
                    stale_sources.append({
                        "source": source.name,
                        "name": source.name,
                        "status": "stale",
                        "minutes_since_last": round(time_since_last, 2),
                        "expected_frequency": expected,
                        "is_online": source.is_online
                    })
        
        return stale_sources
    
    @staticmethod
    async def check_data_freshness(source_id: str) -> Dict[str, Any]:
        """Check if data from source is fresh"""
        source = await DataSource.filter(name=source_id).first()
        
        if not source or not source.last_seen_at:
            return {
                "is_fresh": False,
                "status": "unknown",
                "message": f"Data source {source_id} not found or never reported"
            }
        
        now = datetime.utcnow()
        time_since_last = (now - source.last_seen_at).total_seconds() / 60  # minutes
        
        # Check against thresholds
        if time_since_last <= settings.FRESHNESS_THRESHOLD_WARNING:
            status = "fresh"
            is_fresh = True
        elif time_since_last <= settings.FRESHNESS_THRESHOLD_CRITICAL:
            status = "stale"
            is_fresh = False
        else:
            status = "critical"
            is_fresh = False
        
        return {
            "is_fresh": is_fresh,
            "status": status,
            "last_seen_minutes_ago": round(time_since_last, 2),
            "is_online": source.is_online,
            "failure_count": source.failure_count
        }
