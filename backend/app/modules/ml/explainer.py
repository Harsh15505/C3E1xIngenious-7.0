"""
Explainable AI Layer
Provides human-readable explanations for all ML predictions
NO BLACK-BOX AI - Every prediction must be explained
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
import numpy as np


async def explain_prediction(prediction_data: Dict[str, Any], prediction_type: str) -> Dict[str, Any]:
    """
    Generate detailed explanation for a specific prediction
    
    Args:
        prediction_data: The prediction result from ML functions
        prediction_type: Type of prediction ('forecast', 'risk', 'anomaly')
    
    Returns:
        {
            'summary': str,
            'factors': [{'factor': str, 'impact': str, 'weight': float}],
            'reasoning': str,
            'confidence_breakdown': dict
        }
    """
    
    if prediction_type == 'forecast':
        return _explain_forecast(prediction_data)
    elif prediction_type == 'risk':
        return _explain_risk(prediction_data)
    elif prediction_type == 'anomaly':
        return _explain_anomaly(prediction_data)
    else:
        return {
            'summary': 'Unknown prediction type',
            'factors': [],
            'reasoning': 'Cannot explain unknown prediction type',
            'confidence_breakdown': {}
        }


def _explain_forecast(data: Dict[str, Any]) -> Dict[str, Any]:
    """Explain forecast predictions"""
    
    method = data.get('method', 'unknown')
    confidence = data.get('confidence_score', 0)
    data_points = data.get('data_points', 0)
    
    # Determine confidence level
    if confidence >= 0.8:
        confidence_level = "high"
        confidence_reason = "Strong historical pattern detected"
    elif confidence >= 0.6:
        confidence_level = "medium"
        confidence_reason = "Moderate historical pattern with some variance"
    else:
        confidence_level = "low"
        confidence_reason = "Insufficient data or high variance in historical patterns"
    
    factors = [
        {
            'factor': 'Historical Data',
            'impact': f'{data_points} hours of data used for analysis',
            'weight': 0.5
        },
        {
            'factor': 'Trend Analysis',
            'impact': 'Linear regression applied to identify trends',
            'weight': 0.3
        },
        {
            'factor': 'Moving Average',
            'impact': '3-day smoothing to reduce noise',
            'weight': 0.2
        }
    ]
    
    reasoning = (
        f"This {method} forecast uses {data_points} hours of historical data to predict future values. "
        f"The model combines trend analysis (linear regression) with moving average smoothing to balance "
        f"recent patterns with long-term trends. Confidence is {confidence_level} ({confidence:.2f}) because "
        f"{confidence_reason.lower()}. Predictions further in the future have reduced confidence (5% per day) "
        f"due to increasing uncertainty."
    )
    
    return {
        'summary': f'{confidence_level.capitalize()} confidence forecast based on {data_points} hours of data',
        'factors': factors,
        'reasoning': reasoning,
        'confidence_breakdown': {
            'level': confidence_level,
            'score': confidence,
            'reason': confidence_reason
        }
    }


def _explain_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Explain risk score calculations"""
    
    risk_score = data.get('risk_score', 0)
    breakdown = data.get('breakdown', {})
    confidence = data.get('confidence_score', 0)
    
    # Determine risk level
    if risk_score >= 0.7:
        risk_level = "critical"
        risk_description = "Immediate action recommended"
    elif risk_score >= 0.5:
        risk_level = "high"
        risk_description = "Close monitoring required"
    elif risk_score >= 0.3:
        risk_level = "medium"
        risk_description = "Normal vigilance needed"
    else:
        risk_level = "low"
        risk_description = "Conditions are stable"
    
    # Build factors from breakdown
    factors = []
    weights = {'environment': 0.40, 'traffic': 0.35, 'services': 0.25}
    
    for component, value in breakdown.items():
        impact_desc = "contributing significantly" if value >= 0.5 else "contributing moderately" if value >= 0.3 else "minimal impact"
        factors.append({
            'factor': component.capitalize(),
            'impact': f'{impact_desc} ({value:.2f}/1.0)',
            'weight': weights.get(component, 0)
        })
    
    reasoning = (
        f"Risk score of {risk_score:.2f} indicates {risk_level} risk level. "
        f"Calculation uses weighted average: Environment (40%), Traffic (35%), Services (25%). "
        f"Environment risk: {breakdown.get('environment', 0):.2f} - based on AQI and temperature extremes. "
        f"Traffic risk: {breakdown.get('traffic', 0):.2f} - based on congestion levels. "
        f"Services risk: {breakdown.get('services', 0):.2f} - based on service failure rates. "
        f"{risk_description}."
    )
    
    return {
        'summary': f'{risk_level.capitalize()} risk ({risk_score:.2f}/1.0) - {risk_description}',
        'factors': factors,
        'reasoning': reasoning,
        'confidence_breakdown': {
            'level': 'high' if confidence >= 0.8 else 'medium' if confidence >= 0.6 else 'low',
            'score': confidence,
            'reason': f'Based on real-time sensor and system data'
        }
    }


def _explain_anomaly(data: Dict[str, Any]) -> Dict[str, Any]:
    """Explain anomaly detection results"""
    
    anomalies = data.get('anomalies', [])
    method = data.get('method', 'unknown')
    confidence = data.get('confidence_score', 0)
    baselines = data.get('baselines', {})
    
    if len(anomalies) == 0:
        return {
            'summary': 'No anomalies detected - all metrics within normal range',
            'factors': [
                {
                    'factor': 'Statistical Analysis',
                    'impact': f'All values within expected thresholds',
                    'weight': 1.0
                }
            ],
            'reasoning': f'Analyzed data using {method}. All metrics are within normal statistical bounds.',
            'confidence_breakdown': {
                'level': 'high' if confidence >= 0.8 else 'medium',
                'score': confidence,
                'reason': 'Sufficient data for reliable analysis'
            }
        }
    
    # Count anomalies by severity
    high_severity = len([a for a in anomalies if a.get('severity') == 'high'])
    medium_severity = len([a for a in anomalies if a.get('severity') == 'medium'])
    
    factors = [
        {
            'factor': 'Z-Score Analysis',
            'impact': 'Temperature and AQI checked against statistical baseline',
            'weight': 0.5
        },
        {
            'factor': 'IQR Method',
            'impact': 'Traffic congestion checked using interquartile range',
            'weight': 0.5
        }
    ]
    
    temp_baseline = baselines.get('temperature', {})
    aqi_baseline = baselines.get('aqi', {})
    
    reasoning = (
        f"Detected {len(anomalies)} anomalies ({high_severity} high, {medium_severity} medium severity) "
        f"using {method}. Statistical baselines: Temperature {temp_baseline.get('mean', 0):.1f}°C "
        f"(±{temp_baseline.get('std', 0):.1f}), AQI {aqi_baseline.get('mean', 0):.1f} "
        f"(±{aqi_baseline.get('std', 0):.1f}). Anomalies are values that deviate significantly from "
        f"these baselines, indicating unusual conditions requiring attention."
    )
    
    return {
        'summary': f'{len(anomalies)} anomalies detected ({high_severity} high severity)',
        'factors': factors,
        'reasoning': reasoning,
        'confidence_breakdown': {
            'level': 'high' if confidence >= 0.8 else 'medium' if confidence >= 0.6 else 'low',
            'score': confidence,
            'reason': 'Statistical methods with proven accuracy'
        }
    }


async def explain_scenario(scenario_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Explain scenario simulation results
    
    Args:
        scenario_result: Result from scenario simulation
    
    Returns:
        {
            'summary': str,
            'decision_path': [{'step': str, 'reasoning': str}],
            'assumptions': [str],
            'recommendations': [str]
        }
    """
    
    scenario_type = scenario_result.get('type', 'unknown')
    predictions = scenario_result.get('predictions', {})
    
    decision_path = []
    assumptions = []
    recommendations = []
    
    # Extract decision logic
    if 'environment' in predictions:
        env_pred = predictions['environment']
        decision_path.append({
            'step': 'Environmental Impact Analysis',
            'reasoning': f"Predicted AQI change: {env_pred.get('aqi_change', 0):+.1f}. "
                        f"Based on historical patterns and known correlations."
        })
        assumptions.append("Environmental conditions follow historical seasonal patterns")
    
    if 'traffic' in predictions:
        traffic_pred = predictions['traffic']
        decision_path.append({
            'step': 'Traffic Flow Analysis',
            'reasoning': f"Predicted congestion change: {traffic_pred.get('congestion_change', 0):+.1f}%. "
                        f"Accounts for time of day and typical flow patterns."
        })
        assumptions.append("Traffic patterns remain consistent with historical data")
    
    if 'services' in predictions:
        service_pred = predictions['services']
        decision_path.append({
            'step': 'Service Impact Assessment',
            'reasoning': f"Service reliability impact: {service_pred.get('reliability_impact', 0):+.1f}%. "
                        f"Based on system capacity and historical performance."
        })
        assumptions.append("Service infrastructure capacity remains constant")
    
    # Generate recommendations based on predictions
    overall_impact = scenario_result.get('overall_impact', 0)
    if overall_impact > 0.5:
        recommendations.append("High impact scenario - consider mitigation strategies")
        recommendations.append("Increase monitoring frequency for affected systems")
    elif overall_impact > 0.3:
        recommendations.append("Moderate impact - prepare contingency plans")
    else:
        recommendations.append("Low impact - maintain standard monitoring")
    
    return {
        'summary': f'{scenario_type} scenario analyzed with {len(decision_path)} impact areas',
        'decision_path': decision_path,
        'assumptions': assumptions,
        'recommendations': recommendations
    }


async def generate_city_summary(city: str) -> Dict[str, Any]:
    """
    Generate high-level explainable city insights
    
    Args:
        city: City name
    
    Returns:
        {
            'summary': str,
            'key_insights': [str],
            'trends': dict,
            'alerts': [str],
            'confidence': float
        }
    """
    from app.models.models import EnvironmentData, TrafficData, Alert
    
    # Fetch recent data (last 24 hours)
    cutoff = datetime.utcnow() - timedelta(hours=24)
    
    env_data = await EnvironmentData.filter(
        city=city.lower(),
        timestamp__gte=cutoff
    ).order_by('-timestamp')
    
    traffic_data = await TrafficData.filter(
        city=city.lower(),
        timestamp__gte=cutoff
    ).order_by('-timestamp')
    
    alerts = await Alert.filter(
        city=city.lower(),
        created_at__gte=cutoff
    ).order_by('-severity')
    
    key_insights = []
    trends = {}
    alert_summaries = []
    
    # Environmental insights
    if env_data:
        latest_env = env_data[0]
        avg_aqi = np.mean([d.aqi for d in env_data[:24]])  # Last 24 hours
        
        if latest_env.aqi > 150:
            key_insights.append(f"⚠️ Air quality is unhealthy (AQI: {latest_env.aqi})")
        elif latest_env.aqi > 100:
            key_insights.append(f"⚠️ Air quality is moderate (AQI: {latest_env.aqi})")
        else:
            key_insights.append(f"✓ Air quality is good (AQI: {latest_env.aqi})")
        
        trends['aqi'] = {
            'current': round(latest_env.aqi, 1),
            '24h_average': round(avg_aqi, 1),
            'trend': 'increasing' if latest_env.aqi > avg_aqi else 'decreasing'
        }
        
        trends['temperature'] = {
            'current': round(latest_env.temperature, 1),
            'status': 'normal' if 15 <= latest_env.temperature <= 35 else 'extreme'
        }
    
    # Traffic insights
    if traffic_data:
        avg_congestion = np.mean([t.congestion_level for t in traffic_data[:10]])
        
        if avg_congestion > 70:
            key_insights.append(f"⚠️ Heavy traffic congestion ({avg_congestion:.0f}%)")
        elif avg_congestion > 50:
            key_insights.append(f"Traffic is moderate ({avg_congestion:.0f}%)")
        else:
            key_insights.append(f"✓ Traffic is flowing smoothly ({avg_congestion:.0f}%)")
        
        trends['traffic'] = {
            'average_congestion': round(avg_congestion, 1),
            'status': 'heavy' if avg_congestion > 70 else 'moderate' if avg_congestion > 50 else 'light'
        }
    
    # Alert insights
    if alerts:
        high_alerts = len([a for a in alerts if a.severity == 'high'])
        if high_alerts > 0:
            alert_summaries.append(f"⚠️ {high_alerts} high-severity alerts active")
            key_insights.append(f"Urgent: {high_alerts} critical alerts require attention")
    
    summary = (
        f"{city} Status: "
        f"{len(key_insights)} key insights, "
        f"{len(env_data)} environmental readings, "
        f"{len(traffic_data)} traffic updates in last 24h"
    )
    
    confidence = 0.9 if (env_data and traffic_data) else 0.7 if (env_data or traffic_data) else 0.5
    
    return {
        'summary': summary,
        'key_insights': key_insights,
        'trends': trends,
        'alerts': alert_summaries,
        'confidence': round(confidence, 2),
        'explanation': f'Analysis based on {len(env_data)} environmental and {len(traffic_data)} traffic data points from the last 24 hours'
    }
