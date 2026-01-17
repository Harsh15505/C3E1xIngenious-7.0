"""
Central Data Office (CDO) - Validator Module
Validates incoming data against schemas and business rules
"""

from typing import Dict, Any, List, Tuple
from datetime import datetime


class DataValidator:
    """Validates data quality and schema compliance"""
    
    @staticmethod
    def validate_environment_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate environment data payload"""
        errors = []
        
        # Required fields
        if not data.get("city"):
            errors.append("Missing required field: city")
        if not data.get("timestamp"):
            errors.append("Missing required field: timestamp")
        if not data.get("source"):
            errors.append("Missing required field: source")
        
        # Validate AQI range (0-500)
        if data.get("aqi") is not None:
            if data["aqi"] < 0 or data["aqi"] > 500:
                errors.append("AQI must be between 0 and 500")
        
        # Validate PM2.5 (>= 0)
        if data.get("pm25") is not None:
            if data["pm25"] < 0:
                errors.append("PM2.5 must be >= 0")
        
        # Validate temperature (-50 to 60 Celsius)
        if data.get("temperature") is not None:
            if data["temperature"] < -50 or data["temperature"] > 60:
                errors.append("Temperature must be between -50 and 60°C")
        
        # Validate rainfall (>= 0)
        if data.get("rainfall") is not None:
            if data["rainfall"] < 0:
                errors.append("Rainfall must be >= 0")
        
        # Validate timestamp format
        if data.get("timestamp"):
            try:
                if isinstance(data["timestamp"], str):
                    datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                errors.append("Invalid timestamp format. Use ISO 8601")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_service_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate service data payload"""
        errors = []
        
        # Required fields
        if not data.get("city"):
            errors.append("Missing required field: city")
        if not data.get("timestamp"):
            errors.append("Missing required field: timestamp")
        if not data.get("source"):
            errors.append("Missing required field: source")
        
        # Validate water_supply_stress (0-1)
        if data.get("waterSupplyStress") is not None:
            if data["waterSupplyStress"] < 0 or data["waterSupplyStress"] > 1:
                errors.append("Water supply stress must be between 0 and 1")
        
        # Validate waste_collection_eff (0-1)
        if data.get("wasteCollectionEff") is not None:
            if data["wasteCollectionEff"] < 0 or data["wasteCollectionEff"] > 1:
                errors.append("Waste collection efficiency must be between 0 and 1")
        
        # Validate power_outage_count (>= 0)
        if data.get("powerOutageCount") is not None:
            if data["powerOutageCount"] < 0:
                errors.append("Power outage count must be >= 0")
        
        # At least one metric must be provided
        metrics = ["waterSupplyStress", "wasteCollectionEff", "powerOutageCount"]
        if not any(data.get(m) is not None for m in metrics):
            errors.append("At least one service metric must be provided")
        
        return len(errors) == 0, errors
    
    @staticmethod
    def validate_traffic_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """Validate traffic data payload"""
        errors = []
        
        # Required fields
        if not data.get("city"):
            errors.append("Missing required field: city")
        if not data.get("zone"):
            errors.append("Missing required field: zone")
        if not data.get("timestamp"):
            errors.append("Missing required field: timestamp")
        if not data.get("source"):
            errors.append("Missing required field: source")
        if data.get("densityPercent") is None:
            errors.append("Missing required field: densityPercent")
        if not data.get("congestionLevel"):
            errors.append("Missing required field: congestionLevel")
        
        # Validate zone (A, B, or C)
        if data.get("zone") and data["zone"] not in ["A", "B", "C"]:
            errors.append("Zone must be A, B, or C")
        
        # Validate density_percent (0-100)
        if data.get("densityPercent") is not None:
            if data["densityPercent"] < 0 or data["densityPercent"] > 100:
                errors.append("Density percent must be between 0 and 100")
        
        # Validate congestion_level
        if data.get("congestionLevel"):
            if data["congestionLevel"] not in ["low", "medium", "high"]:
                errors.append("Congestion level must be low, medium, or high")
        
        # Validate heavy_vehicle_count (>= 0)
        if data.get("heavyVehicleCount") is not None:
            if data["heavyVehicleCount"] < 0:
                errors.append("Heavy vehicle count must be >= 0")
        
        return len(errors) == 0, errors
