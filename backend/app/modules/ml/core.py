"""
Core ML Functions with Explainability
All functions return predictions with confidence scores and explanations
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any
from scipy import stats
from sklearn.linear_model import LinearRegression


async def forecast_metrics(city: str, days: int = 7) -> Dict[str, Any]:
    """
    Forecast environmental and traffic metrics using moving average + linear regression
    
    Args:
        city: City name
        days: Number of days to forecast (default: 7)
    
    Returns:
        {
            'predictions': [{'date': str, 'temperature': float, 'aqi': float, 'confidence': float}],
            'confidence_score': float (0-1),
            'explanation': str,
            'method': str
        }
    """
    from app.models.models import EnvironmentData, TrafficData
    
    # Fetch historical data (last 15 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=15)
    
    env_data = await EnvironmentData.filter(
        city=city.lower(),
        timestamp__gte=start_date,
        timestamp__lte=end_date
    ).order_by('timestamp')
    
    if len(env_data) < 7:
        return {
            'predictions': [],
            'confidence_score': 0.0,
            'explanation': f'Insufficient data for {city}. Need at least 7 days of historical data.',
            'method': 'moving_average_regression'
        }
    
    # Extract time series data
    timestamps = [(d.timestamp - start_date).total_seconds() / 3600 for d in env_data]  # Hours since start
    temperatures = [d.temperature for d in env_data]
    aqis = [d.aqi for d in env_data]
    
    # Calculate moving averages (3-day window)
    window = min(72, len(timestamps) // 3)  # 72 hours = 3 days
    temp_ma = np.convolve(temperatures, np.ones(window)/window, mode='valid')
    aqi_ma = np.convolve(aqis, np.ones(window)/window, mode='valid')
    
    # Fit linear regression for trend
    X = np.array(timestamps).reshape(-1, 1)
    
    temp_model = LinearRegression()
    temp_model.fit(X, temperatures)
    temp_r2 = temp_model.score(X, temperatures)
    
    aqi_model = LinearRegression()
    aqi_model.fit(X, aqis)
    aqi_r2 = aqi_model.score(X, aqis)
    
    # Generate forecasts
    predictions = []
    last_timestamp = timestamps[-1]
    
    for day in range(1, days + 1):
        future_hour = last_timestamp + (day * 24)
        future_X = np.array([[future_hour]])
        
        # Predict with linear regression
        temp_pred = temp_model.predict(future_X)[0]
        aqi_pred = aqi_model.predict(future_X)[0]
        
        # Apply moving average smoothing
        temp_pred = (temp_pred + temp_ma[-1]) / 2 if len(temp_ma) > 0 else temp_pred
        aqi_pred = (aqi_pred + aqi_ma[-1]) / 2 if len(aqi_ma) > 0 else aqi_pred
        
        # Ensure realistic bounds
        temp_pred = max(10, min(45, temp_pred))  # Gujarat temperature range
        aqi_pred = max(0, min(500, aqi_pred))
        
        # Calculate day-specific confidence (degrades over time)
        day_confidence = max(0.5, 1.0 - (day * 0.05))  # Reduces 5% per day
        
        forecast_date = end_date + timedelta(days=day)
        predictions.append({
            'date': forecast_date.strftime('%Y-%m-%d'),
            'temperature': round(temp_pred, 1),
            'aqi': round(aqi_pred, 1),
            'confidence': round(day_confidence, 2)
        })
    
    # Overall confidence based on R² scores
    overall_confidence = (temp_r2 + aqi_r2) / 2
    overall_confidence = max(0.5, min(0.95, overall_confidence))  # Clamp between 0.5-0.95
    
    # Generate explanation
    temp_trend = "increasing" if temp_model.coef_[0] > 0 else "decreasing"
    aqi_trend = "increasing" if aqi_model.coef_[0] > 0 else "decreasing"
    
    explanation = (
        f"Forecast based on {len(env_data)} hours of historical data for {city}. "
        f"Temperature trend: {temp_trend} (R²={temp_r2:.2f}). "
        f"AQI trend: {aqi_trend} (R²={aqi_r2:.2f}). "
        f"Using moving average + linear regression. "
        f"Confidence degrades by 5% per day into future."
    )
    
    return {
        'predictions': predictions,
        'confidence_score': round(overall_confidence, 2),
        'explanation': explanation,
        'method': 'moving_average_regression',
        'data_points': len(env_data)
    }


async def calculate_risk_score(city: str) -> Dict[str, Any]:
    """
    Calculate comprehensive risk score (0-1) based on current conditions
    
    Args:
        city: City name
    
    Returns:
        {
            'risk_score': float (0-1),
            'confidence_score': float (0-1),
            'explanation': str,
            'breakdown': {
                'environment': float,
                'traffic': float,
                'services': float
            }
        }
    """
    from app.models.models import EnvironmentData, TrafficData, ServiceData
    
    # Fetch latest data (within last 2 hours)
    cutoff_time = datetime.utcnow() - timedelta(hours=2)
    
    env = await EnvironmentData.filter(
        city=city.lower(),
        timestamp__gte=cutoff_time
    ).order_by('-timestamp').first()
    
    traffic = await TrafficData.filter(
        city=city.lower(),
        timestamp__gte=cutoff_time
    ).order_by('-timestamp').limit(10)
    
    services = await ServiceData.filter(
        city=city.lower(),
        timestamp__gte=cutoff_time
    ).order_by('-timestamp').limit(10)
    
    # Calculate sub-scores
    env_score = 0.0
    env_confidence = 0.0
    env_explanation = ""
    
    if env:
        # Environment risk based on AQI, temperature extremes
        aqi_risk = min(1.0, env.aqi / 300)  # 300+ AQI = max risk
        temp_risk = 0.0
        if env.temperature > 40:  # Heat wave
            temp_risk = min(1.0, (env.temperature - 40) / 10)
        elif env.temperature < 15:  # Cold
            temp_risk = min(1.0, (15 - env.temperature) / 10)
        
        env_score = (aqi_risk * 0.7 + temp_risk * 0.3)  # AQI weighted more
        env_confidence = 0.9  # High confidence for sensor data
        env_explanation = f"AQI: {env.aqi} (risk={aqi_risk:.2f}), Temp: {env.temperature}°C (risk={temp_risk:.2f})"
    else:
        env_explanation = "No recent environment data"
    
    traffic_score = 0.0
    traffic_confidence = 0.0
    traffic_explanation = ""
    
    if traffic:
        # Traffic risk based on congestion levels
        congestion_levels = [t.congestion_level for t in traffic]
        avg_congestion = np.mean(congestion_levels)
        traffic_score = avg_congestion / 100  # Already 0-100 percentage
        traffic_confidence = 0.85
        traffic_explanation = f"Avg congestion: {avg_congestion:.1f}% across {len(traffic)} zones"
    else:
        traffic_explanation = "No recent traffic data"
    
    service_score = 0.0
    service_confidence = 0.0
    service_explanation = ""
    
    if services:
        # Service risk based on failure rates
        failure_rates = [s.failure_rate for s in services]
        avg_failure = np.mean(failure_rates)
        service_score = avg_failure / 100  # Already 0-100 percentage
        service_confidence = 0.8
        service_explanation = f"Avg failure rate: {avg_failure:.1f}% across {len(services)} services"
    else:
        service_explanation = "No recent service data"
    
    # Weighted overall risk score
    # Environment: 40%, Traffic: 35%, Services: 25%
    overall_risk = (
        env_score * 0.40 +
        traffic_score * 0.35 +
        service_score * 0.25
    )
    
    # Overall confidence based on available data
    confidences = [c for c in [env_confidence, traffic_confidence, service_confidence] if c > 0]
    overall_confidence = np.mean(confidences) if confidences else 0.0
    
    explanation = (
        f"Risk calculated from current conditions in {city}: "
        f"Environment (40%): {env_explanation}. "
        f"Traffic (35%): {traffic_explanation}. "
        f"Services (25%): {service_explanation}. "
        f"Overall risk: {overall_risk:.2f}/1.0"
    )
    
    return {
        'risk_score': round(overall_risk, 3),
        'confidence_score': round(overall_confidence, 2),
        'explanation': explanation,
        'breakdown': {
            'environment': round(env_score, 3),
            'traffic': round(traffic_score, 3),
            'services': round(service_score, 3)
        },
        'data_freshness': {
            'environment': env.timestamp.isoformat() if env else None,
            'traffic': traffic[0].timestamp.isoformat() if traffic else None,
            'services': services[0].timestamp.isoformat() if services else None
        }
    }


async def detect_anomalies(city: str, hours: int = 24) -> Dict[str, Any]:
    """
    Detect anomalies using z-score and IQR methods
    
    Args:
        city: City name
        hours: Hours of history to analyze (default: 24)
    
    Returns:
        {
            'anomalies': [{'timestamp': str, 'metric': str, 'value': float, 'z_score': float}],
            'confidence_score': float (0-1),
            'explanation': str,
            'method': str
        }
    """
    from app.models.models import EnvironmentData, TrafficData
    
    # Fetch historical data
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    env_data = await EnvironmentData.filter(
        city=city.lower(),
        timestamp__gte=cutoff_time
    ).order_by('timestamp')
    
    traffic_data = await TrafficData.filter(
        city=city.lower(),
        timestamp__gte=cutoff_time
    ).order_by('timestamp')
    
    if len(env_data) < 10:
        return {
            'anomalies': [],
            'confidence_score': 0.0,
            'explanation': f'Insufficient data for anomaly detection. Need at least 10 data points.',
            'method': 'z_score_iqr'
        }
    
    anomalies = []
    
    # Analyze environment metrics
    temperatures = [d.temperature for d in env_data]
    aqis = [d.aqi for d in env_data]
    
    temp_mean = np.mean(temperatures)
    temp_std = np.std(temperatures)
    aqi_mean = np.mean(aqis)
    aqi_std = np.std(aqis)
    
    # Z-score threshold: 2.5 (99% confidence)
    z_threshold = 2.5
    
    for data in env_data:
        temp_z = abs((data.temperature - temp_mean) / temp_std) if temp_std > 0 else 0
        aqi_z = abs((data.aqi - aqi_mean) / aqi_std) if aqi_std > 0 else 0
        
        if temp_z > z_threshold:
            anomalies.append({
                'timestamp': data.timestamp.isoformat(),
                'metric': 'temperature',
                'value': data.temperature,
                'z_score': round(temp_z, 2),
                'severity': 'high' if temp_z > 3.0 else 'medium'
            })
        
        if aqi_z > z_threshold:
            anomalies.append({
                'timestamp': data.timestamp.isoformat(),
                'metric': 'aqi',
                'value': data.aqi,
                'z_score': round(aqi_z, 2),
                'severity': 'high' if aqi_z > 3.0 else 'medium'
            })
    
    # Analyze traffic metrics using IQR method
    if len(traffic_data) >= 10:
        congestions = [t.congestion_level for t in traffic_data]
        q1 = np.percentile(congestions, 25)
        q3 = np.percentile(congestions, 75)
        iqr = q3 - q1
        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)
        
        for data in traffic_data:
            if data.congestion_level < lower_bound or data.congestion_level > upper_bound:
                anomalies.append({
                    'timestamp': data.timestamp.isoformat(),
                    'metric': 'traffic_congestion',
                    'value': data.congestion_level,
                    'iqr_bounds': [round(lower_bound, 1), round(upper_bound, 1)],
                    'severity': 'medium'
                })
    
    # Calculate confidence based on data size and distribution
    confidence = min(0.95, 0.5 + (len(env_data) / 100))  # More data = higher confidence
    
    explanation = (
        f"Analyzed {len(env_data)} environment and {len(traffic_data)} traffic data points "
        f"over {hours} hours for {city}. "
        f"Used z-score (threshold={z_threshold}) for temp/AQI, IQR method for traffic. "
        f"Found {len(anomalies)} anomalies. "
        f"Temperature baseline: {temp_mean:.1f}°C (±{temp_std:.1f}), "
        f"AQI baseline: {aqi_mean:.1f} (±{aqi_std:.1f})"
    )
    
    return {
        'anomalies': anomalies,
        'confidence_score': round(confidence, 2),
        'explanation': explanation,
        'method': 'z_score_iqr',
        'thresholds': {
            'z_score': z_threshold,
            'iqr_multiplier': 1.5
        },
        'baselines': {
            'temperature': {'mean': round(temp_mean, 1), 'std': round(temp_std, 1)},
            'aqi': {'mean': round(aqi_mean, 1), 'std': round(aqi_std, 1)}
        }
    }
