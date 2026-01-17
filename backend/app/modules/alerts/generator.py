"""
Alerts - Alert Generator Module
Generates alerts based on forecasts, anomalies, risk scores, and system health
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from app.models import City, Alert, Anomaly, RiskScore, Forecast, DataSource
import logging

logger = logging.getLogger(__name__)


class AlertGenerator:
    """Generates alerts for different audiences based on rules"""
    
    # Alert thresholds
    RISK_THRESHOLDS = {
        "high": 0.7,     # Score >= 0.7
        "medium": 0.5,   # Score >= 0.5
        "low": 0.3       # Score >= 0.3
    }
    
    FORECAST_THRESHOLDS = {
        "aqi": {"warning": 100, "critical": 200},
        "pm25": {"warning": 35, "critical": 75},
        "waterStress": {"warning": 0.7, "critical": 0.9}
    }

    ML_ANOMALY_CONFIDENCE_MIN = 0.6
    ML_ANOMALY_CONFIDENCE_DOWNGRADE = 0.75
    
    @staticmethod
    async def generate_all_alerts(city_name: str) -> Dict[str, Any]:
        """Generate all types of alerts for a city"""
        try:
            city = await City.filter(name__iexact=city_name).first()
            if not city:
                return {"error": f"City {city_name} not found"}
            
            results = {
                "city": city_name,
                "generated_at": datetime.utcnow().isoformat(),
                "alerts_created": 0,
                "breakdown": {}
            }
            
            # Generate from different sources
            risk_alerts = await AlertGenerator.generate_risk_alerts(city)
            anomaly_alerts = await AlertGenerator.generate_anomaly_alerts(city)
            ml_anomaly_alerts = await AlertGenerator.generate_ml_anomaly_alerts(city)
            forecast_alerts = await AlertGenerator.generate_forecast_alerts(city)
            system_alerts = await AlertGenerator.generate_system_alerts(city)
            
            results["breakdown"] = {
                "risk": len(risk_alerts),
                "anomaly": len(anomaly_alerts),
                "ml_anomaly": len(ml_anomaly_alerts),
                "forecast": len(forecast_alerts),
                "system": len(system_alerts)
            }
            results["alerts_created"] = sum(results["breakdown"].values())
            
            return results
            
        except Exception as e:
            logger.error(f"Error generating alerts for {city_name}: {str(e)}")
            return {"error": str(e)}
    
    @staticmethod
    async def generate_risk_alerts(city: City) -> List[str]:
        """Generate alerts from high risk scores"""
        alerts_created = []
        
        try:
            # Get recent risk scores (last 6 hours)
            recent_cutoff = datetime.utcnow() - timedelta(hours=6)
            risk_scores = await RiskScore.filter(
                city=city,
                calculated_at__gte=recent_cutoff
            ).order_by("-calculated_at").limit(10)
            
            for risk in risk_scores:
                # Check if alert already exists for this risk level
                existing = await Alert.filter(
                    city=city,
                    type="risk",
                    is_active=True,
                    metadata__contains={"category": risk.category}
                ).first()
                
                if existing:
                    continue
                
                # Generate alert based on risk level
                if risk.score >= AlertGenerator.RISK_THRESHOLDS["high"]:
                    severity = "critical"
                    title = f"High Risk Alert: {risk.category.title()}"
                    message = f"{risk.category.title()} risk level is HIGH ({risk.score:.2f}). Immediate attention recommended."
                    audience = "both"
                elif risk.score >= AlertGenerator.RISK_THRESHOLDS["medium"]:
                    severity = "warning"
                    title = f"Elevated Risk: {risk.category.title()}"
                    message = f"{risk.category.title()} risk level is MEDIUM ({risk.score:.2f}). Monitor situation closely."
                    audience = "internal"
                else:
                    # Don't create alerts for low risk
                    continue
                
                alert = await Alert.create(
                    city=city,
                    type="risk",
                    severity=severity,
                    audience=audience,
                    title=title,
                    message=message,
                    metadata={
                        "category": risk.category,
                        "score": risk.score,
                        "level": risk.level,
                        "risk_id": str(risk.id)
                    }
                )
                alerts_created.append(str(alert.id))
                
        except Exception as e:
            logger.error(f"Error generating risk alerts: {str(e)}")
        
        return alerts_created

    @staticmethod
    async def generate_ml_anomaly_alerts(city: City) -> List[str]:
        """Generate alerts from ML anomaly detection results"""
        alerts_created: List[str] = []

        try:
            from app.modules.ml.core import detect_anomalies

            result = await detect_anomalies(city.name, hours=24)
            anomalies = result.get("anomalies", [])
            confidence = result.get("confidence_score", 0.0)

            if confidence < AlertGenerator.ML_ANOMALY_CONFIDENCE_MIN:
                logger.info(
                    f"Skipping ML anomaly alerts for {city.name}: low confidence {confidence:.2f}"
                )
                return alerts_created

            for anomaly in anomalies:
                metric = anomaly.get("metric")
                timestamp = anomaly.get("timestamp")
                signature = f"ml:{metric}:{timestamp}"

                existing = await Alert.filter(
                    city=city,
                    type="anomaly",
                    is_active=True,
                    metadata__contains={"signature": signature}
                ).first()

                if existing:
                    continue

                severity = anomaly.get("severity", "low")
                if severity == "high":
                    alert_severity = "critical"
                    audience = "both"
                elif severity == "medium":
                    alert_severity = "warning"
                    audience = "internal"
                else:
                    alert_severity = "info"
                    audience = "internal"

                if confidence < AlertGenerator.ML_ANOMALY_CONFIDENCE_DOWNGRADE:
                    if alert_severity == "critical":
                        alert_severity = "warning"
                        audience = "internal"

                title = f"ML Anomaly Detected: {metric}"
                message = (
                    f"ML detected abnormal {metric} value {anomaly.get('value')}. "
                    f"Z-score: {anomaly.get('z_score')}. "
                    f"Confidence: {confidence:.2f}."
                )

                alert = await Alert.create(
                    city=city,
                    type="anomaly",
                    severity=alert_severity,
                    audience=audience,
                    title=title,
                    message=message,
                    metadata={
                        "signature": signature,
                        "source": "ml",
                        "metric": metric,
                        "timestamp": timestamp,
                        "value": anomaly.get("value"),
                        "z_score": anomaly.get("z_score"),
                        "severity": severity,
                        "confidence_score": confidence
                    }
                )
                alerts_created.append(str(alert.id))

        except Exception as e:
            logger.error(f"Error generating ML anomaly alerts: {str(e)}")

        return alerts_created
    
    @staticmethod
    async def generate_anomaly_alerts(city: City) -> List[str]:
        """Generate alerts from detected anomalies"""
        alerts_created = []
        
        try:
            # Get recent unresolved anomalies (last 2 hours)
            recent_cutoff = datetime.utcnow() - timedelta(hours=2)
            anomalies = await Anomaly.filter(
                city=city,
                detected_at__gte=recent_cutoff,
                resolved=False
            ).order_by("-detected_at")
            
            for anomaly in anomalies:
                # Check if alert already exists
                existing = await Alert.filter(
                    city=city,
                    type="anomaly",
                    is_active=True,
                    metadata__contains={"anomaly_id": str(anomaly.id)}
                ).first()
                
                if existing:
                    continue
                
                # Map anomaly severity to alert severity
                if anomaly.severity == "high":
                    alert_severity = "critical"
                    audience = "both"
                elif anomaly.severity == "medium":
                    alert_severity = "warning"
                    audience = "internal"
                else:
                    alert_severity = "info"
                    audience = "internal"
                
                title = f"Anomaly Detected: {anomaly.metric_type}"
                message = f"Unusual {anomaly.metric_type} reading detected. Value: {anomaly.value:.2f}, Expected: {anomaly.expected_value:.2f} ({anomaly.deviation:.1f}σ deviation)."
                
                alert = await Alert.create(
                    city=city,
                    type="anomaly",
                    severity=alert_severity,
                    audience=audience,
                    title=title,
                    message=message,
                    metadata={
                        "anomaly_id": str(anomaly.id),
                        "metric_type": anomaly.metric_type,
                        "value": anomaly.value,
                        "deviation": anomaly.deviation
                    }
                )
                alerts_created.append(str(alert.id))
                
        except Exception as e:
            logger.error(f"Error generating anomaly alerts: {str(e)}")
        
        return alerts_created
    
    @staticmethod
    async def generate_forecast_alerts(city: City) -> List[str]:
        """Generate alerts from forecast predictions exceeding thresholds"""
        alerts_created = []
        
        try:
            # Get forecasts for next 24 hours
            now = datetime.utcnow()
            forecast_cutoff = now + timedelta(hours=24)
            
            forecasts = await Forecast.filter(
                city=city,
                target_date__gte=now,
                target_date__lte=forecast_cutoff
            ).order_by("target_date")
            
            for forecast in forecasts:
                metric = forecast.metric_type
                value = forecast.predicted_value
                
                # Check thresholds
                thresholds = AlertGenerator.FORECAST_THRESHOLDS.get(metric)
                if not thresholds:
                    continue
                
                severity = None
                if value >= thresholds.get("critical", float('inf')):
                    severity = "critical"
                    audience = "both"
                elif value >= thresholds.get("warning", float('inf')):
                    severity = "warning"
                    audience = "both"
                else:
                    continue
                
                # Check if alert already exists
                existing = await Alert.filter(
                    city=city,
                    type="forecast",
                    is_active=True,
                    metadata__contains={"forecast_id": str(forecast.id)}
                ).first()
                
                if existing:
                    continue
                
                title = f"Forecast Alert: {metric.upper()} Expected to Rise"
                message = f"Predicted {metric} level of {value:.1f} expected at {forecast.target_date.strftime('%H:%M')}. Confidence: {forecast.confidence*100:.0f}%."
                
                alert = await Alert.create(
                    city=city,
                    type="forecast",
                    severity=severity,
                    audience=audience,
                    title=title,
                    message=message,
                    metadata={
                        "forecast_id": str(forecast.id),
                        "metric_type": metric,
                        "predicted_value": value,
                        "target_date": forecast.target_date.isoformat()
                    }
                )
                alerts_created.append(str(alert.id))
                
        except Exception as e:
            logger.error(f"Error generating forecast alerts: {str(e)}")
        
        return alerts_created
    
    @staticmethod
    async def generate_system_alerts(city: Optional[City] = None) -> List[str]:
        """Generate system health alerts (stale data, offline sources)"""
        alerts_created = []
        
        try:
            # Check data sources for offline/stale status
            now = datetime.utcnow()
            stale_threshold = timedelta(hours=2)
            
            sources = await DataSource.filter(is_online=False).all()
            
            for source in sources:
                # Check if alert already exists
                existing = await Alert.filter(
                    type="system",
                    is_active=True,
                    metadata__contains={"source_id": str(source.id)}
                ).first()
                
                if existing:
                    continue
                
                # Calculate how long it's been offline
                time_offline = "unknown"
                if source.last_seen_at:
                    delta = now - source.last_seen_at
                    hours = int(delta.total_seconds() / 3600)
                    time_offline = f"{hours} hours"
                
                title = f"Data Source Offline: {source.name}"
                message = f"Data source '{source.name}' ({source.type}) is offline. Last seen: {time_offline} ago."
                
                alert = await Alert.create(
                    city=city,
                    type="system",
                    severity="warning",
                    audience="internal",
                    title=title,
                    message=message,
                    metadata={
                        "source_id": str(source.id),
                        "source_name": source.name,
                        "source_type": source.type,
                        "failure_count": source.failure_count
                    }
                )
                alerts_created.append(str(alert.id))
                
        except Exception as e:
            logger.error(f"Error generating system alerts: {str(e)}")
        
        return alerts_created
