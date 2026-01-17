"""
Analytics Module - Time-Series Forecasting
7-day ahead predictions using exponential smoothing
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import numpy as np
from app.models import City, EnvironmentData, ServiceData, TrafficData, Forecast
from app.config import get_settings

settings = get_settings()


class TimeSeriesForecaster:
    """Generates 7-day forecasts for key metrics"""
    
    @staticmethod
    async def forecast_environment_metrics(city_name: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Forecast environment metrics (AQI, PM2.5, temperature, rainfall)
        Uses exponential smoothing for time series prediction
        """
        city = await City.filter(name=city_name.lower()).first()
        if not city:
            return []
        
        # Get last 30 days of data for training
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        historical_data = await EnvironmentData.filter(
            city=city,
            timestamp__gte=cutoff_date
        ).order_by('timestamp')
        
        if len(historical_data) < 7:
            return []  # Not enough data to forecast
        
        forecasts = []
        
        # Forecast each metric
        for metric in ['aqi', 'pm25', 'temperature', 'rainfall']:
            values = [getattr(record, metric) for record in historical_data if getattr(record, metric) is not None]
            
            if len(values) < 7:
                continue
            
            # Generate predictions for next 7 days
            predictions = TimeSeriesForecaster._exponential_smoothing(values, days)
            
            for i, predicted_value in enumerate(predictions):
                target_date = datetime.utcnow().date() + timedelta(days=i+1)
                
                # Calculate confidence based on data variance
                variance = np.var(values[-14:]) if len(values) >= 14 else np.var(values)
                confidence = max(0.5, min(0.95, 1.0 - (variance / (np.mean(values) + 1))))
                
                forecasts.append({
                    'city': city_name,
                    'metric_type': f'environment_{metric}',
                    'target_date': target_date,
                    'predicted_value': round(float(predicted_value), 2),
                    'confidence': round(float(confidence), 3),
                    'horizon_days': i+1
                })
        
        return forecasts
    
    @staticmethod
    async def forecast_traffic_congestion(city_name: str, zone: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Forecast traffic density and congestion for a specific zone
        """
        city = await City.filter(name=city_name.lower()).first()
        if not city:
            return []
        
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        historical_data = await TrafficData.filter(
            city=city,
            zone=zone.upper(),
            timestamp__gte=cutoff_date
        ).order_by('timestamp')
        
        if len(historical_data) < 7:
            return []
        
        forecasts = []
        
        # Forecast density_percent
        density_values = [record.density_percent for record in historical_data]
        density_predictions = TimeSeriesForecaster._exponential_smoothing(density_values, days)
        
        for i, predicted_value in enumerate(density_predictions):
            target_date = datetime.utcnow().date() + timedelta(days=i+1)
            
            # Determine predicted congestion level
            if predicted_value < 40:
                congestion_level = 'low'
            elif predicted_value < 70:
                congestion_level = 'medium'
            else:
                congestion_level = 'high'
            
            variance = np.var(density_values[-14:]) if len(density_values) >= 14 else np.var(density_values)
            confidence = max(0.5, min(0.95, 1.0 - (variance / 100)))
            
            forecasts.append({
                'city': city_name,
                'zone': zone,
                'metric_type': 'traffic_density',
                'target_date': target_date,
                'predicted_value': round(float(predicted_value), 2),
                'predicted_congestion_level': congestion_level,
                'confidence': round(float(confidence), 3),
                'horizon_days': i+1
            })
        
        return forecasts
    
    @staticmethod
    async def forecast_service_stress(city_name: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Forecast service stress metrics (water supply, waste collection, power outages)
        """
        city = await City.filter(name=city_name.lower()).first()
        if not city:
            return []
        
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        historical_data = await ServiceData.filter(
            city=city,
            timestamp__gte=cutoff_date
        ).order_by('timestamp')
        
        if len(historical_data) < 7:
            return []
        
        forecasts = []
        
        # Forecast each service metric
        for metric in ['water_supply_stress', 'waste_collection_eff', 'power_outage_count']:
            values = [getattr(record, metric) for record in historical_data if getattr(record, metric) is not None]
            
            if len(values) < 7:
                continue
            
            predictions = TimeSeriesForecaster._exponential_smoothing(values, days)
            
            for i, predicted_value in enumerate(predictions):
                target_date = datetime.utcnow().date() + timedelta(days=i+1)
                
                variance = np.var(values[-14:]) if len(values) >= 14 else np.var(values)
                mean_val = np.mean(values) if np.mean(values) > 0 else 1
                confidence = max(0.5, min(0.95, 1.0 - (variance / mean_val)))
                
                forecasts.append({
                    'city': city_name,
                    'metric_type': f'service_{metric}',
                    'target_date': target_date,
                    'predicted_value': round(float(predicted_value), 2),
                    'confidence': round(float(confidence), 3),
                    'horizon_days': i+1
                })
        
        return forecasts
    
    @staticmethod
    def _exponential_smoothing(values: List[float], horizon: int, alpha: float = 0.3) -> List[float]:
        """
        Simple exponential smoothing for time series forecasting
        
        Args:
            values: Historical time series data
            horizon: Number of periods to forecast
            alpha: Smoothing parameter (0-1), lower = more smoothing
        
        Returns:
            List of forecasted values
        """
        if len(values) == 0:
            return [0] * horizon
        
        # Calculate initial level
        level = values[0]
        
        # Update level with each observation
        for value in values:
            level = alpha * value + (1 - alpha) * level
        
        # Forecast: constant value (simple exponential smoothing)
        # For better results, could use Holt-Winters with trend/seasonality
        forecasts = [level] * horizon
        
        return forecasts
    
    @staticmethod
    async def save_forecasts_to_db(forecasts: List[Dict[str, Any]]) -> int:
        """
        Save forecast records to database
        
        Returns:
            Number of forecasts saved
        """
        saved_count = 0
        
        for forecast_data in forecasts:
            city = await City.filter(name=forecast_data['city'].lower()).first()
            if not city:
                continue
            
            # Create or update forecast
            await Forecast.create(
                city=city,
                metric_type=forecast_data['metric_type'],
                target_date=forecast_data['target_date'],
                predicted_value=forecast_data['predicted_value'],
                confidence=forecast_data['confidence']
            )
            saved_count += 1
        
        return saved_count
    
    @staticmethod
    async def get_forecasts(city_name: str, metric_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieve forecasts from database for a city
        """
        city = await City.filter(name=city_name.lower()).first()
        if not city:
            return []
        
        query = Forecast.filter(city=city, target_date__gte=datetime.utcnow().date())
        
        if metric_type:
            query = query.filter(metric_type=metric_type)
        
        forecasts = await query.order_by('target_date')
        
        return [
            {
                'id': str(f.id),
                'city': city_name,
                'metric_type': f.metric_type,
                'target_date': f.target_date.isoformat(),
                'predicted_value': f.predicted_value,
                'confidence': f.confidence,
                'created_at': f.created_at.isoformat()
            }
            for f in forecasts
        ]
