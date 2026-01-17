"""
Analytics API Router
Endpoints for anomaly detection and risk scoring
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.modules.analytics.anomaly import AnomalyDetector
from app.modules.analytics.risk import RiskScorer
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

