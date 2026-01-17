"""
Analytics API Router
Endpoints for anomaly detection and risk scoring
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.modules.analytics.anomaly import AnomalyDetector
from app.modules.analytics.risk import RiskScorer
from app.modules.ml.core import forecast_metrics, calculate_risk_score, detect_anomalies
from app.modules.ml.explainer import explain_prediction, generate_city_summary
from app.models import City

router = APIRouter()


@router.get("/anomalies/{city}")
async def get_anomalies(
    city: str,
    severity: Optional[str] = Query(None, regex="^(low|medium|high)$"),
    limit: int = Query(50, le=500)
):
    """
    Detect and return anomalies for a city
    
    Real-time detection using Z-score analysis on last 30 days of data
    """
    try:
        result = await AnomalyDetector.detect_all_anomalies(city)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        # Filter by severity if requested
        if severity:
            result["environment_anomalies"] = [
                a for a in result["environment_anomalies"] if a["severity"] == severity
            ]
            result["traffic_anomalies"] = [
                a for a in result["traffic_anomalies"] if a["severity"] == severity
            ]
            result["service_anomalies"] = [
                a for a in result["service_anomalies"] if a["severity"] == severity
            ]
            result["total_count"] = (
                len(result["environment_anomalies"]) +
                len(result["traffic_anomalies"]) +
                len(result["service_anomalies"])
            )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


@router.get("/anomalies/{city}/history")
async def get_anomaly_history(
    city: str,
    limit: int = Query(100, le=1000)
):
    """
    Get historical anomalies stored in database
    """
    from app.models import Anomaly
    
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    
    anomalies = await Anomaly.filter(city=city_obj).order_by('-detected_at').limit(limit)
    
    return {
        "city": city,
        "count": len(anomalies),
        "anomalies": [
            {
                "id": str(a.id),
                "type": a.type,
                "severity": a.severity,
                "metric": a.metric,
                "expected_value": a.expected_value,
                "actual_value": a.actual_value,
                "deviation": a.deviation,
                "explanation": a.explanation,
                "metadata": a.metadata,
                "detected_at": a.detected_at.isoformat(),
                "resolved": a.resolved
            }
            for a in anomalies
        ]
    }


@router.get("/risk/{city}")
async def get_city_risk(city: str):
    """
    Calculate comprehensive risk score for a city
    
    Combines environment, traffic, services, and anomaly data
    """
    try:
        result = await RiskScorer.calculate_city_risk(city)
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk calculation failed: {str(e)}")


@router.get("/risk/{city}/history")
async def get_risk_history(
    city: str,
    limit: int = Query(30, le=365)
):
    """
    Get historical risk scores for a city
    """
    from app.models import RiskScore
    
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    
    risk_scores = await RiskScore.filter(city=city_obj).order_by('-calculated_at').limit(limit)
    
    return {
        "city": city,
        "count": len(risk_scores),
        "history": [
            {
                "score": r.score,
                "level": r.level,
                "category": r.category,
                "contributing_factors": r.contributing_factors,
                "calculated_at": r.calculated_at.isoformat()
            }
            for r in risk_scores
        ]
    }


@router.get("/cities/{city}/environment-data")
async def get_environment_history(
    city: str,
    limit: int = Query(24, le=168, description="Number of hours (max 168 = 7 days)")
):
    """
    Get historical environment data for charts
    Returns last N hours of temperature, humidity, AQI data
    """
    from app.models import EnvironmentData
    
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    
    data = await EnvironmentData.filter(city=city_obj).order_by('-timestamp').limit(limit)
    
    return {
        "city": city,
        "data": [
            {
                "timestamp": d.timestamp.isoformat(),
                "temperature": d.temperature,
                "humidity": d.humidity,
                "aqi": d.aqi,
                "pm25": d.pm25,
                "pm10": d.pm10
            }
            for d in reversed(data)  # Oldest first for chart display
        ]
    }


@router.get("/cities/{city}/traffic-data")
async def get_traffic_data(
    city: str
):
    """
    Get current traffic data by zones for charts
    Returns latest traffic congestion for all zones
    """
    from app.models import TrafficData
    from datetime import datetime, timedelta
    
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    
    # Get latest traffic data (within last 2 hours)
    cutoff = datetime.now() - timedelta(hours=2)
    data = await TrafficData.filter(
        city=city_obj,
        timestamp__gte=cutoff
    ).order_by('-timestamp')
    
    # Group by zone, get latest for each
    zones_data = {}
    for d in data:
        if d.zone not in zones_data:
            zones_data[d.zone] = {
                "zone": d.zone,
                "congestion": round(d.congestion_level * 100, 1),  # Convert to percentage
                "timestamp": d.timestamp.isoformat()
            }
    
    return {
        "city": city,
        "zones": list(zones_data.values())
    }


@router.get("/forecast/{city}")
async def get_forecast(
    city: str,
    days: int = Query(7, ge=1, le=14, description="Number of days to forecast (1-14)")
):
    """
    Get ML-based forecast for environmental metrics
    Returns predictions with confidence scores and explanations
    """
    try:
        city_obj = await City.filter(name__iexact=city).first()
        if not city_obj:
            raise HTTPException(status_code=404, detail=f"City {city} not found")
        
        # Get forecast predictions
        forecast_result = await forecast_metrics(city, days)
        
        # Generate explanation
        explanation = await explain_prediction(forecast_result, 'forecast')
        
        return {
            "city": city,
            "forecast": forecast_result,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@router.get("/ml-risk/{city}")
async def get_ml_risk_score(city: str):
    """
    Get ML-based risk score with explainability
    Returns comprehensive risk assessment with confidence and breakdown
    """
    try:
        city_obj = await City.filter(name__iexact=city).first()
        if not city_obj:
            raise HTTPException(status_code=404, detail=f"City {city} not found")
        
        # Calculate risk score
        risk_result = await calculate_risk_score(city)
        
        # Generate explanation
        explanation = await explain_prediction(risk_result, 'risk')
        
        return {
            "city": city,
            "risk_assessment": risk_result,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk calculation failed: {str(e)}")


@router.get("/ml-anomalies/{city}")
async def get_ml_anomalies(
    city: str,
    hours: int = Query(24, ge=1, le=168, description="Hours of history to analyze (1-168)")
):
    """
    Detect anomalies using ML with explanations
    Returns anomalies with z-scores and confidence
    """
    try:
        city_obj = await City.filter(name__iexact=city).first()
        if not city_obj:
            raise HTTPException(status_code=404, detail=f"City {city} not found")
        
        # Detect anomalies
        anomaly_result = await detect_anomalies(city, hours)
        
        # Generate explanation
        explanation = await explain_prediction(anomaly_result, 'anomaly')
        
        return {
            "city": city,
            "anomaly_detection": anomaly_result,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection failed: {str(e)}")


@router.get("/city-summary/{city}")
async def get_city_summary(city: str):
    """
    Get comprehensive city insights with explainability
    Returns high-level summary with trends and alerts
    """
    try:
        city_obj = await City.filter(name__iexact=city).first()
        if not city_obj:
            raise HTTPException(status_code=404, detail=f"City {city} not found")
        
        # Generate city summary
        summary = await generate_city_summary(city)
        
        return {
            "city": city,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")
