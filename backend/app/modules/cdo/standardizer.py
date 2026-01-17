"""
Central Data Office (CDO) - Standardizer Module
Standardizes data formats and units across different sources
"""

from typing import Dict, Any
from datetime import datetime


class DataStandardizer:
    """Standardizes data format and units"""
    
    @staticmethod
    def standardize_environment_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Standardize environment data to common format"""
        source_value = data.get("source") or data.get("source_id") or data.get("sourceId") or "unknown-source"
        standardized = {
            "city": data.get("city", "").strip().lower(),
            "source": str(source_value).strip(),
            "timestamp": DataStandardizer._parse_timestamp(data.get("timestamp")),
            "aqi": float(data["aqi"]) if data.get("aqi") is not None else None,
            "pm25": float(data["pm25"]) if data.get("pm25") is not None else None,
            "temperature": float(data["temperature"]) if data.get("temperature") is not None else None,
            "rainfall": float(data["rainfall"]) if data.get("rainfall") is not None else None,
        }
        return standardized
    
    @staticmethod
    def standardize_service_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Standardize service data to common format"""
        source_value = data.get("source") or data.get("source_id") or data.get("sourceId") or "unknown-source"
        standardized = {
            "city": data.get("city", "").strip().lower(),
            "source": str(source_value).strip(),
            "timestamp": DataStandardizer._parse_timestamp(data.get("timestamp")),
            "water_supply_stress": float(data["waterSupplyStress"]) if data.get("waterSupplyStress") is not None else None,
            "waste_collection_eff": float(data["wasteCollectionEff"]) if data.get("wasteCollectionEff") is not None else None,
            "power_outage_count": int(data["powerOutageCount"]) if data.get("powerOutageCount") is not None else None,
        }
        return standardized
    
    @staticmethod
    def standardize_traffic_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Standardize traffic data to common format"""
        source_value = data.get("source") or data.get("source_id") or data.get("sourceId") or "unknown-source"
        standardized = {
            "city": data.get("city", "").strip().lower(),
            "zone": data.get("zone", "").strip().upper(),
            "source": str(source_value).strip(),
            "timestamp": DataStandardizer._parse_timestamp(data.get("timestamp")),
            "density_percent": float(data["densityPercent"]),
            "congestion_level": data.get("congestionLevel", "").strip().lower(),
            "heavy_vehicle_count": int(data["heavyVehicleCount"]) if data.get("heavyVehicleCount") is not None else None,
        }
        return standardized
    
    @staticmethod
    def _parse_timestamp(timestamp: Any) -> datetime:
        """Parse timestamp to datetime object"""
        if isinstance(timestamp, datetime):
            return timestamp
        elif isinstance(timestamp, str):
            # Handle ISO 8601 format with Z timezone
            return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        else:
            return datetime.utcnow()
