"""
Analytics API Router
Endpoints for anomaly detection and risk scoring
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone
from app.modules.analytics.anomaly import AnomalyDetector
from app.modules.analytics.risk import RiskScorer
from app.modules.ml.core import forecast_metrics, calculate_risk_score, detect_anomalies
from app.modules.ml.explainer import explain_prediction, generate_city_summary
from app.models import City, SystemAuditLog

router = APIRouter()


async def log_explainability(action: str, city: str, path: str, details: Dict[str, Any]) -> None:
    """Persist explainability log entries for ML outputs."""
    try:
        await SystemAuditLog.create(
            method="GET",
            path=path,
            status_code=200,
            latency_ms=0.0,
            client_ip=None,
            user_id=None,
            user_email=None,
            user_role=None,
            category="explainability",
            action=action,
            city_id=city,
            details=details,
            success=True,
            error_message=None
        )
    except Exception:
        # Avoid failing API response due to logging issues
        pass


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
                "aqi": d.aqi,
                "pm25": d.pm25
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
    from datetime import datetime, timedelta, timezone
    
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    
    # Get latest traffic data (within last 2 hours, UTC-aware)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    data = await TrafficData.filter(
        city=city_obj,
        timestamp__gte=cutoff
    ).order_by('-timestamp')
    
    # Group by zone, get latest for each
    zones_data = {}
    for d in data:
        if d.zone not in zones_data:
            congestion_map = {
                "low": 30,
                "medium": 60,
                "high": 90
            }
            congestion_value = (
                congestion_map.get(d.congestion_level.lower())
                if isinstance(d.congestion_level, str)
                else d.congestion_level
            )
            zones_data[d.zone] = {
                "zone": d.zone,
                "congestion": round(float(congestion_value), 1),
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
        
        response = {
            "city": city,
            "forecast": forecast_result,
            "explanation": explanation
        }
        await log_explainability(
            action="forecast",
            city=city,
            path=f"/api/v1/analytics/forecast/{city}",
            details={
                "method": forecast_result.get("method"),
                "confidence_score": forecast_result.get("confidence_score"),
                "data_points": forecast_result.get("data_points"),
            }
        )
        return response
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
        
        response = {
            "city": city,
            "risk_assessment": risk_result,
            "explanation": explanation
        }
        await log_explainability(
            action="ml_risk",
            city=city,
            path=f"/api/v1/analytics/ml-risk/{city}",
            details={
                "risk_score": risk_result.get("risk_score"),
                "confidence_score": risk_result.get("confidence_score"),
                "breakdown": risk_result.get("breakdown")
            }
        )
        return response
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
        
        response = {
            "city": city,
            "anomaly_detection": anomaly_result,
            "explanation": explanation
        }
        await log_explainability(
            action="ml_anomalies",
            city=city,
            path=f"/api/v1/analytics/ml-anomalies/{city}",
            details={
                "confidence_score": anomaly_result.get("confidence_score"),
                "anomaly_count": len(anomaly_result.get("anomalies", [])),
                "method": anomaly_result.get("method")
            }
        )
        return response
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
        
        response = {
            "city": city,
            "summary": summary
        }
        await log_explainability(
            action="city_summary",
            city=city,
            path=f"/api/v1/analytics/city-summary/{city}",
            details={
                "confidence_score": summary.get("confidence_score"),
                "insights": summary.get("key_insights", [])
            }
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")


@router.get("/trends/{city}")
async def get_trends(
    city: str,
    hours: int = Query(168, ge=6, le=720, description="Window size in hours (6-720)")
):
    """
    Get trend analysis for key metrics by comparing current vs previous window.
    """
    from app.models import EnvironmentData, TrafficData, ServiceData

    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=hours)
    prev_start = window_start - timedelta(hours=hours)

    env_current = await EnvironmentData.filter(city=city_obj, timestamp__gte=window_start).all()
    env_prev = await EnvironmentData.filter(city=city_obj, timestamp__gte=prev_start, timestamp__lt=window_start).all()

    traffic_current = await TrafficData.filter(city=city_obj, timestamp__gte=window_start).all()
    traffic_prev = await TrafficData.filter(city=city_obj, timestamp__gte=prev_start, timestamp__lt=window_start).all()

    services_current = await ServiceData.filter(city=city_obj, timestamp__gte=window_start).all()
    services_prev = await ServiceData.filter(city=city_obj, timestamp__gte=prev_start, timestamp__lt=window_start).all()

    def avg(values: List[float]) -> Optional[float]:
        vals = [v for v in values if v is not None]
        return round(sum(vals) / len(vals), 3) if vals else None

    def delta(current: Optional[float], previous: Optional[float]) -> Optional[float]:
        if current is None or previous is None:
            return None
        if previous == 0:
            return None
        return round(((current - previous) / previous) * 100, 2)

    def metric_summary(curr_vals: List[float], prev_vals: List[float]) -> Dict[str, Any]:
        current_avg = avg(curr_vals)
        previous_avg = avg(prev_vals)
        return {
            "current_avg": current_avg,
            "previous_avg": previous_avg,
            "delta_pct": delta(current_avg, previous_avg)
        }

    congestion_map = {"low": 30, "medium": 60, "high": 90}
    def traffic_values(records: List[Any]) -> List[float]:
        values = []
        for r in records:
            if r.density_percent is not None:
                values.append(float(r.density_percent))
            elif isinstance(r.congestion_level, str):
                values.append(float(congestion_map.get(r.congestion_level.lower(), 0)))
        return values

    response = {
        "city": city,
        "window_hours": hours,
        "generated_at": now.isoformat(),
        "environment": {
            "temperature": metric_summary([d.temperature for d in env_current], [d.temperature for d in env_prev]),
            "aqi": metric_summary([d.aqi for d in env_current], [d.aqi for d in env_prev]),
            "pm25": metric_summary([d.pm25 for d in env_current], [d.pm25 for d in env_prev])
        },
        "traffic": {
            "congestion": metric_summary(traffic_values(traffic_current), traffic_values(traffic_prev))
        },
        "services": {
            "water_supply_stress": metric_summary(
                [d.water_supply_stress for d in services_current],
                [d.water_supply_stress for d in services_prev]
            ),
            "waste_collection_eff": metric_summary(
                [d.waste_collection_eff for d in services_current],
                [d.waste_collection_eff for d in services_prev]
            ),
            "power_outage_count": metric_summary(
                [float(d.power_outage_count) if d.power_outage_count is not None else None for d in services_current],
                [float(d.power_outage_count) if d.power_outage_count is not None else None for d in services_prev]
            )
        }
    }

    await log_explainability(
        action="trends",
        city=city,
        path=f"/api/v1/analytics/trends/{city}",
        details={"window_hours": hours}
    )

    return response


@router.get("/compare")
async def compare_cities(
    cities: str = Query(..., description="Comma-separated city names"),
    metric: str = Query("aqi", description="Metric to compare"),
    hours: int = Query(24, ge=1, le=168)
):
    """
    Compare a metric across multiple cities.
    Supported metrics: aqi, temperature, pm25, traffic_density, water_supply_stress,
    waste_collection_eff, power_outage_count
    """
    from app.models import EnvironmentData, TrafficData, ServiceData

    metric = metric.lower()
    supported = {
        "aqi": "lower",
        "temperature": "neutral",
        "pm25": "lower",
        "traffic_density": "lower",
        "water_supply_stress": "lower",
        "waste_collection_eff": "higher",
        "power_outage_count": "lower"
    }
    if metric not in supported:
        raise HTTPException(status_code=400, detail=f"Unsupported metric '{metric}'")

    city_list = [c.strip() for c in cities.split(",") if c.strip()]
    if len(city_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two cities")

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=hours)

    results = []
    for city in city_list:
        city_obj = await City.filter(name__iexact=city).first()
        if not city_obj:
            continue

        value = None
        if metric in {"aqi", "temperature", "pm25"}:
            data = await EnvironmentData.filter(city=city_obj, timestamp__gte=cutoff).all()
            values = [getattr(d, metric) for d in data if getattr(d, metric) is not None]
            value = round(sum(values) / len(values), 3) if values else None
        elif metric == "traffic_density":
            data = await TrafficData.filter(city=city_obj, timestamp__gte=cutoff).all()
            values = [d.density_percent for d in data if d.density_percent is not None]
            value = round(sum(values) / len(values), 3) if values else None
        elif metric in {"water_supply_stress", "waste_collection_eff", "power_outage_count"}:
            data = await ServiceData.filter(city=city_obj, timestamp__gte=cutoff).all()
            values = [getattr(d, metric) for d in data if getattr(d, metric) is not None]
            value = round(sum(values) / len(values), 3) if values else None

        results.append({"city": city_obj.name, "value": value})

    ranked = [r for r in results if r["value"] is not None]
    best = None
    if ranked:
        if supported[metric] == "higher":
            best = max(ranked, key=lambda x: x["value"])
        elif supported[metric] == "lower":
            best = min(ranked, key=lambda x: x["value"])

    await log_explainability(
        action="compare",
        city=",".join([r["city"] for r in results]),
        path="/api/v1/analytics/compare",
        details={"metric": metric, "hours": hours}
    )

    return {
        "metric": metric,
        "preference": supported[metric],
        "hours": hours,
        "results": results,
        "best": best
    }


@router.get("/explainability/logs")
async def get_explainability_logs(
    city: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200)
):
    """Return explainability audit logs for ML predictions."""
    query = SystemAuditLog.filter(category="explainability").order_by("-timestamp")
    if city:
        query = query.filter(city_id__iexact=city)

    rows = await query.limit(limit)

    return {
        "count": len(rows),
        "items": [
            {
                "id": str(r.id),
                "timestamp": r.timestamp.isoformat(),
                "action": r.action,
                "city": r.city_id,
                "details": r.details
            }
            for r in rows
        ]
    }
