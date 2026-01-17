"""
Analytics - Anomaly Detection Module
Pattern-based anomaly detection for urban metrics
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.models import City, EnvironmentData, TrafficData, ServiceData, Anomaly
import statistics


class AnomalyDetector:
    """Detects anomalies in urban metric patterns using statistical methods"""
    
    # Z-score thresholds
    HIGH_SEVERITY_THRESHOLD = 3.0
    MEDIUM_SEVERITY_THRESHOLD = 2.0
    LOW_SEVERITY_THRESHOLD = 1.5
    
    # Minimum data points needed for reliable detection
    MIN_DATA_POINTS = 10
    
    @staticmethod
    async def detect_all_anomalies(city_name: str) -> Dict[str, Any]:
        """
        Detect anomalies across all metrics for a city
        
        Returns:
            {
                "city": str,
                "detected_at": str,
                "environment_anomalies": [],
                "traffic_anomalies": [],
                "service_anomalies": [],
                "total_count": int
            }
        """
        city = await City.filter(name__iexact=city_name).first()
        if not city:
            return {
                "city": city_name,
                "error": "City not found",
                "total_count": 0
            }
        
        env_anomalies = await AnomalyDetector.detect_environment_anomalies(city)
        traffic_anomalies = await AnomalyDetector.detect_traffic_anomalies(city)
        service_anomalies = await AnomalyDetector.detect_service_anomalies(city)
        
        total_count = len(env_anomalies) + len(traffic_anomalies) + len(service_anomalies)
        
        return {
            "city": city_name,
            "detected_at": datetime.utcnow().isoformat(),
            "environment_anomalies": env_anomalies,
            "traffic_anomalies": traffic_anomalies,
            "service_anomalies": service_anomalies,
            "total_count": total_count
        }
    
    @staticmethod
    async def detect_environment_anomalies(city: City) -> List[Dict[str, Any]]:
        """
        Detect anomalies in environmental metrics using Z-score method
        
        Checks: AQI, PM2.5, temperature, humidity
        """
        anomalies = []
        
        # Fetch last 30 days of data for baseline
        lookback_date = datetime.utcnow() - timedelta(days=30)
        historical_data = await EnvironmentData.filter(
            city=city,
            timestamp__gte=lookback_date
        ).order_by('-timestamp').limit(1000)
        
        if len(historical_data) < AnomalyDetector.MIN_DATA_POINTS:
            return []
        
        # Get latest data point
        latest = historical_data[0] if historical_data else None
        if not latest:
            return []
        
        # Check AQI
        aqi_values = [d.aqi for d in historical_data if d.aqi is not None]
        if len(aqi_values) >= AnomalyDetector.MIN_DATA_POINTS and latest.aqi is not None:
            anomaly = AnomalyDetector._check_metric_anomaly(
                metric_name="AQI",
                current_value=latest.aqi,
                historical_values=aqi_values,
                city=city,
                data_type="environment",
                timestamp=latest.timestamp
            )
            if anomaly:
                anomalies.append(anomaly)
        
        # Check PM2.5
        pm25_values = [d.pm25 for d in historical_data if d.pm25 is not None]
        if len(pm25_values) >= AnomalyDetector.MIN_DATA_POINTS and latest.pm25 is not None:
            anomaly = AnomalyDetector._check_metric_anomaly(
                metric_name="PM2.5",
                current_value=latest.pm25,
                historical_values=pm25_values,
                city=city,
                data_type="environment",
                timestamp=latest.timestamp
            )
            if anomaly:
                anomalies.append(anomaly)
        
        # Check Temperature
        temp_values = [d.temperature for d in historical_data if d.temperature is not None]
        if len(temp_values) >= AnomalyDetector.MIN_DATA_POINTS and latest.temperature is not None:
            anomaly = AnomalyDetector._check_metric_anomaly(
                metric_name="Temperature",
                current_value=latest.temperature,
                historical_values=temp_values,
                city=city,
                data_type="environment",
                timestamp=latest.timestamp
            )
            if anomaly:
                anomalies.append(anomaly)
        
        return anomalies
    
    @staticmethod
    async def detect_traffic_anomalies(city: City) -> List[Dict[str, Any]]:
        """Detect anomalies in traffic metrics"""
        anomalies = []
        
        lookback_date = datetime.utcnow() - timedelta(days=30)
        historical_data = await TrafficData.filter(
            city=city,
            timestamp__gte=lookback_date
        ).order_by('-timestamp').limit(1000)
        
        if len(historical_data) < AnomalyDetector.MIN_DATA_POINTS:
            return []
        
        latest = historical_data[0] if historical_data else None
        if not latest:
            return []
        
        # Check Traffic Density
        density_values = [d.density_percent for d in historical_data if d.density_percent is not None]
        if len(density_values) >= AnomalyDetector.MIN_DATA_POINTS and latest.density_percent is not None:
            anomaly = AnomalyDetector._check_metric_anomaly(
                metric_name="Traffic Density",
                current_value=latest.density_percent,
                historical_values=density_values,
                city=city,
                data_type="traffic",
                timestamp=latest.timestamp,
                zone=latest.zone
            )
            if anomaly:
                anomalies.append(anomaly)
        
        # Check Average Speed
        speed_values = [d.avg_speed for d in historical_data if d.avg_speed is not None]
        if len(speed_values) >= AnomalyDetector.MIN_DATA_POINTS and latest.avg_speed is not None:
            anomaly = AnomalyDetector._check_metric_anomaly(
                metric_name="Average Speed",
                current_value=latest.avg_speed,
                historical_values=speed_values,
                city=city,
                data_type="traffic",
                timestamp=latest.timestamp,
                zone=latest.zone
            )
            if anomaly:
                anomalies.append(anomaly)
        
        return anomalies
    
    @staticmethod
    async def detect_service_anomalies(city: City) -> List[Dict[str, Any]]:
        """Detect anomalies in public service metrics"""
        anomalies = []
        
        lookback_date = datetime.utcnow() - timedelta(days=30)
        historical_data = await ServiceData.filter(
            city=city,
            timestamp__gte=lookback_date
        ).order_by('-timestamp').limit(1000)
        
        if len(historical_data) < AnomalyDetector.MIN_DATA_POINTS:
            return []
        
        latest = historical_data[0] if historical_data else None
        if not latest:
            return []
        
        # Check Water Stress
        water_values = [d.water_stress for d in historical_data if d.water_stress is not None]
        if len(water_values) >= AnomalyDetector.MIN_DATA_POINTS and latest.water_stress is not None:
            anomaly = AnomalyDetector._check_metric_anomaly(
                metric_name="Water Stress",
                current_value=latest.water_stress,
                historical_values=water_values,
                city=city,
                data_type="service",
                timestamp=latest.timestamp
            )
            if anomaly:
                anomalies.append(anomaly)
        
        # Check Power Load
        power_values = [d.power_load_percent for d in historical_data if d.power_load_percent is not None]
        if len(power_values) >= AnomalyDetector.MIN_DATA_POINTS and latest.power_load_percent is not None:
            anomaly = AnomalyDetector._check_metric_anomaly(
                metric_name="Power Load",
                current_value=latest.power_load_percent,
                historical_values=power_values,
                city=city,
                data_type="service",
                timestamp=latest.timestamp
            )
            if anomaly:
                anomalies.append(anomaly)
        
        return anomalies
    
    @staticmethod
    def _check_metric_anomaly(
        metric_name: str,
        current_value: float,
        historical_values: List[float],
        city: City,
        data_type: str,
        timestamp: datetime,
        zone: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Check if a metric value is anomalous using Z-score
        
        Returns anomaly dict if detected, None otherwise
        """
        if len(historical_values) < AnomalyDetector.MIN_DATA_POINTS:
            return None
        
        # Calculate statistics
        mean = statistics.mean(historical_values)
        stdev = statistics.stdev(historical_values)
        
        if stdev == 0:
            return None
        
        # Calculate Z-score
        z_score = (current_value - mean) / stdev
        
        # Check if anomalous
        if abs(z_score) < AnomalyDetector.LOW_SEVERITY_THRESHOLD:
            return None
        
        # Determine severity
        severity = AnomalyDetector.calculate_severity(z_score)
        
        # Generate explanation
        direction = "higher" if z_score > 0 else "lower"
        deviation_percent = abs((current_value - mean) / mean * 100)
        
        explanation = (
            f"{metric_name} is {deviation_percent:.1f}% {direction} than 30-day average. "
            f"Current: {current_value:.1f}, Average: {mean:.1f}, Std Dev: {stdev:.1f}"
        )
        
        anomaly_data = {
            "metric": metric_name,
            "type": data_type,
            "severity": severity,
            "current_value": round(current_value, 2),
            "expected_value": round(mean, 2),
            "deviation": round(z_score, 2),
            "deviation_percent": round(deviation_percent, 1),
            "direction": direction,
            "explanation": explanation,
            "detected_at": timestamp.isoformat()
        }
        
        if zone:
            anomaly_data["zone"] = zone
        
        return anomaly_data
    
    @staticmethod
    def calculate_severity(z_score: float) -> str:
        """Calculate severity based on Z-score"""
        abs_z = abs(z_score)
        
        if abs_z >= AnomalyDetector.HIGH_SEVERITY_THRESHOLD:
            return "high"
        elif abs_z >= AnomalyDetector.MEDIUM_SEVERITY_THRESHOLD:
            return "medium"
        else:
            return "low"
    
    @staticmethod
    async def store_anomaly(anomaly_data: Dict[str, Any], city: City) -> Anomaly:
        """Store detected anomaly in database"""
        anomaly = await Anomaly.create(
            city=city,
            type=anomaly_data["type"],
            severity=anomaly_data["severity"],
            metric=anomaly_data["metric"],
            expected_value=anomaly_data["expected_value"],
            actual_value=anomaly_data["current_value"],
            deviation=anomaly_data["deviation"],
            explanation=anomaly_data["explanation"],
            metadata={
                "zone": anomaly_data.get("zone"),
                "deviation_percent": anomaly_data["deviation_percent"],
                "direction": anomaly_data["direction"]
            }
        )
        return anomaly

