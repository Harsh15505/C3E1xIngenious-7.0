"""
Core ML Functions with Explainability
All functions return predictions with confidence scores and explanations
"""

import numpy as np
from datetime import datetime, timedelta, timezone
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
    from app.models import EnvironmentData, TrafficData, City
    
    # Get city object
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        return {
            'predictions': [],
            'confidence_score': 0.0,
            'explanation': f'City {city} not found in database.',
            'method': 'moving_average_regression'
        }
    
    # Fetch historical data (last 15 days)
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=15)
    
    env_data = await EnvironmentData.filter(
        city=city_obj,
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
    
    # Extract time series data (filter out None values)
    data_points = []
    for d in env_data:
        if d.aqi is not None and d.temperature is not None:
            data_points.append({
                'timestamp': d.timestamp,
                'temperature': d.temperature,
                'aqi': d.aqi
            })
    
    if len(data_points) < 7:
        return {
            'predictions': [],
            'confidence_score': 0.0,
            'explanation': f'Insufficient valid data for {city}. Need at least 7 data points with complete metrics.',
            'method': 'moving_average_regression'
        }
    
    timestamps = [(d['timestamp'] - start_date).total_seconds() / 3600 for d in data_points]  # Hours since start
    temperatures = [d['temperature'] for d in data_points]
    aqis = [d['aqi'] for d in data_points]
    
    # Calculate moving averages (3-day window)
    window = min(72, len(timestamps) // 3)  # 72 hours = 3 days
    if window < 3:
        window = 3
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
        f"Forecast based on {len(data_points)} hours of valid data for {city}. "
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
        'data_points': len(data_points)
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
    from app.models import EnvironmentData, TrafficData, ServiceData, City
    
    # Get city object
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        return {
            'risk_score': 0.0,
            'confidence_score': 0.0,
            'explanation': f'City {city} not found in database.',
            'breakdown': {'environment': 0.0, 'traffic': 0.0, 'services': 0.0},
            'data_freshness': {}
        }
    
    # Fetch latest data (within last 24 hours)
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=24)
    
    env = await EnvironmentData.filter(
        city=city_obj,
        timestamp__gte=cutoff_time
    ).order_by('-timestamp').first()
    
    traffic = await TrafficData.filter(
        city=city_obj,
        timestamp__gte=cutoff_time
    ).order_by('-timestamp').limit(10)
    
    services = await ServiceData.filter(
        city=city_obj,
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
        # Convert congestion_level string to numeric
        congestion_map = {'low': 30, 'medium': 60, 'high': 90}
        congestion_levels = [congestion_map.get(t.congestion_level, 50) for t in traffic]
        avg_congestion = np.mean(congestion_levels)
        traffic_score = avg_congestion / 100  # Convert to 0-1 scale
        traffic_confidence = 0.85
        traffic_explanation = f"Avg congestion: {avg_congestion:.1f}% across {len(traffic)} zones"
    else:
        traffic_explanation = "No recent traffic data"
    
    service_score = 0.0
    service_confidence = 0.0
    service_explanation = ""
    
    if services:
        # Service risk based on water supply stress and power outages
        # ServiceData fields: water_supply_stress (0-1), waste_collection_eff (0-1), power_outage_count
        water_stress = [s.water_supply_stress for s in services if s.water_supply_stress is not None]
        waste_eff = [s.waste_collection_eff for s in services if s.waste_collection_eff is not None]
        power_outages = [s.power_outage_count for s in services if s.power_outage_count is not None]
        
        risk_components = []
        if water_stress:
            risk_components.append(np.mean(water_stress))  # Already 0-1
        if waste_eff:
            risk_components.append(1.0 - np.mean(waste_eff))  # Invert: low efficiency = high risk
        if power_outages:
            risk_components.append(min(1.0, np.mean(power_outages) / 10))  # 10+ outages = max risk
        
        if risk_components:
            service_score = np.mean(risk_components)
            service_confidence = 0.8
            service_explanation = f"Service risk: {service_score:.2f} from {len(services)} service readings"
        else:
            service_explanation = "No valid service metrics"
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
        f"Risk calculated from recent conditions in {city} (last 24h): "
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
    from app.models import EnvironmentData, TrafficData, City
    
    # Get city object
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        return {
            'anomalies': [],
            'confidence_score': 0.0,
            'explanation': f'City {city} not found in database.',
            'method': 'z_score_iqr'
        }
    
    # Fetch historical data
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    env_data = await EnvironmentData.filter(
        city=city_obj,
        timestamp__gte=cutoff_time
    ).order_by('timestamp')
    
    traffic_data = await TrafficData.filter(
        city=city_obj,
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
    
    # Analyze environment metrics (filter out None values)
    temperatures = [d.temperature for d in env_data if d.temperature is not None]
    aqis = [d.aqi for d in env_data if d.aqi is not None]
    
    if len(temperatures) < 10 or len(aqis) < 10:
        return {
            'anomalies': [],
            'confidence_score': 0.0,
            'explanation': f'Insufficient valid data for anomaly detection. Need at least 10 complete data points.',
            'method': 'z_score_iqr',
            'baselines': {},
            'thresholds': {}
        }
    
    temp_mean = np.mean(temperatures)
    temp_std = np.std(temperatures)
    aqi_mean = np.mean(aqis)
    aqi_std = np.std(aqis)
    
    # Z-score threshold: 2.5 (99% confidence)
    z_threshold = 2.5
    
    for data in env_data:
        if data.temperature is not None:
            temp_z = abs((data.temperature - temp_mean) / temp_std) if temp_std > 0 else 0
            if temp_z > z_threshold:
                anomalies.append({
                    'timestamp': data.timestamp.isoformat(),
                    'metric': 'temperature',
                    'value': data.temperature,
                    'z_score': round(temp_z, 2),
                    'severity': 'high' if temp_z > 3.0 else 'medium'
                })
        
        if data.aqi is not None:
            aqi_z = abs((data.aqi - aqi_mean) / aqi_std) if aqi_std > 0 else 0
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
        congestion_map = {'low': 30, 'medium': 60, 'high': 90}
        congestions = [congestion_map.get(t.congestion_level, 50) for t in traffic_data]
        q1 = np.percentile(congestions, 25)
        q3 = np.percentile(congestions, 75)
        iqr = q3 - q1
        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)
        
        for data in traffic_data:
            congestion_value = congestion_map.get(data.congestion_level, 50)
            if congestion_value < lower_bound or congestion_value > upper_bound:
                anomalies.append({
                    'timestamp': data.timestamp.isoformat(),
                    'metric': 'traffic_congestion',
                    'value': congestion_value,
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
