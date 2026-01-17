"""
ML Model Training Script
Trains Random Forest models for environment, traffic, and service predictions
"""

import asyncio
import numpy as np
import pandas as pd
import pickle
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from tortoise import Tortoise
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import EnvironmentData, TrafficData, ServiceData


async def train_environment_model():
    """Train Random Forest model for AQI prediction"""
    print("Training Environment Model (AQI Prediction)...")
    
    # Fetch all historical data
    env_data = await EnvironmentData.all().order_by('timestamp')
    
    if len(env_data) < 100:
        print(f"⚠️ Insufficient data: {len(env_data)} records. Need at least 100.")
        return None
    
    # Prepare features
    data = []
    for record in env_data:
        # Skip records with missing AQI (target)
        if record.aqi is None:
            continue
            
        hour = record.timestamp.hour
        day_of_week = record.timestamp.weekday()
        
        data.append({
            'hour': hour,
            'day_of_week': day_of_week,
            'temperature': record.temperature if record.temperature else 25.0,
            'pm25': record.pm25 if record.pm25 else 50.0,
            'rainfall': record.rainfall if record.rainfall else 0.0,
            'aqi': record.aqi  # Target
        })
    
    df = pd.DataFrame(data)
    
    if len(df) < 100:
        print(f"⚠️ Insufficient valid data: {len(df)} records after filtering.")
        return None
    
    # Features and target
    X = df[['hour', 'day_of_week', 'temperature', 'pm25', 'rainfall']]
    y = df['aqi']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    print(f"✓ Environment Model Trained")
    print(f"  - Training samples: {len(X_train)}")
    print(f"  - Test samples: {len(X_test)}")
    print(f"  - Train R²: {train_score:.4f}")
    print(f"  - Test R²: {test_score:.4f}")
    print(f"  - RMSE: {rmse:.2f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"  - Feature Importance:")
    for _, row in feature_importance.iterrows():
        print(f"    {row['feature']}: {row['importance']:.4f}")
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'environment_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': model,
            'feature_names': list(X.columns),
            'feature_importance': feature_importance.to_dict('records'),
            'train_r2': train_score,
            'test_r2': test_score,
            'rmse': rmse,
            'trained_at': datetime.utcnow().isoformat()
        }, f)
    
    print(f"✓ Model saved to {model_path}")
    return model


async def train_traffic_model():
    """Train Random Forest model for traffic congestion prediction"""
    print("\nTraining Traffic Model (Congestion Prediction)...")
    
    # Fetch all historical data
    traffic_data = await TrafficData.all().order_by('timestamp')
    
    if len(traffic_data) < 100:
        print(f"⚠️ Insufficient data: {len(traffic_data)} records. Need at least 100.")
        return None
    
    # Prepare features
    data = []
    for record in traffic_data:
        hour = record.timestamp.hour
        day_of_week = record.timestamp.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Convert congestion_level to numeric
        congestion_map = {'low': 0.3, 'medium': 0.6, 'high': 0.9}
        congestion_numeric = congestion_map.get(record.congestion_level, 0.5)
        
        heavy_vehicles = record.heavy_vehicle_count if record.heavy_vehicle_count else 0
        
        data.append({
            'hour': hour,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'density_percent': record.density_percent,
            'heavy_vehicles': heavy_vehicles,
            'congestion': congestion_numeric  # Target
        })
    
    df = pd.DataFrame(data)
    
    # Features and target
    X = df[['hour', 'day_of_week', 'is_weekend', 'density_percent', 'heavy_vehicles']]
    y = df['congestion']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    print(f"✓ Traffic Model Trained")
    print(f"  - Training samples: {len(X_train)}")
    print(f"  - Test samples: {len(X_test)}")
    print(f"  - Train R²: {train_score:.4f}")
    print(f"  - Test R²: {test_score:.4f}")
    print(f"  - RMSE: {rmse:.4f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"  - Feature Importance:")
    for _, row in feature_importance.iterrows():
        print(f"    {row['feature']}: {row['importance']:.4f}")
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'traffic_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': model,
            'feature_names': list(X.columns),
            'feature_importance': feature_importance.to_dict('records'),
            'train_r2': train_score,
            'test_r2': test_score,
            'rmse': rmse,
            'trained_at': datetime.utcnow().isoformat()
        }, f)
    
    print(f"✓ Model saved to {model_path}")
    return model


async def train_service_model():
    """Train Random Forest model for service stress prediction"""
    print("\nTraining Service Model (Service Stress Prediction)...")
    
    # Fetch all historical data
    service_data = await ServiceData.all().order_by('timestamp')
    
    if len(service_data) < 100:
        print(f"⚠️ Insufficient data: {len(service_data)} records. Need at least 100.")
        return None
    
    # Prepare features
    data = []
    for record in service_data:
        # Calculate overall stress from available metrics
        if record.water_supply_stress is None and record.waste_collection_eff is None:
            continue
            
        hour = record.timestamp.hour
        day_of_week = record.timestamp.weekday()
        
        water_stress = record.water_supply_stress if record.water_supply_stress else 0.5
        waste_eff = record.waste_collection_eff if record.waste_collection_eff else 0.5
        power_outages = record.power_outage_count if record.power_outage_count else 0
        
        # Calculate overall stress (target)
        overall_stress = (water_stress + (1 - waste_eff) + (power_outages / 10)) / 3
        
        data.append({
            'hour': hour,
            'day_of_week': day_of_week,
            'water_stress': water_stress,
            'waste_eff': waste_eff,
            'power_outages': power_outages,
            'overall_stress': overall_stress  # Target
        })
    
    df = pd.DataFrame(data)
    
    if len(df) < 100:
        print(f"⚠️ Insufficient valid data: {len(df)} records after filtering.")
        return None
    
    # Features and target
    X = df[['hour', 'day_of_week', 'water_stress', 'waste_eff', 'power_outages']]
    y = df['overall_stress']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Random Forest
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    print(f"✓ Service Model Trained")
    print(f"  - Training samples: {len(X_train)}")
    print(f"  - Test samples: {len(X_test)}")
    print(f"  - Train R²: {train_score:.4f}")
    print(f"  - Test R²: {test_score:.4f}")
    print(f"  - RMSE: {rmse:.4f}")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"  - Feature Importance:")
    for _, row in feature_importance.iterrows():
        print(f"    {row['feature']}: {row['importance']:.4f}")
    
    # Save model
    model_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'service_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump({
            'model': model,
            'feature_names': list(X.columns),
            'feature_importance': feature_importance.to_dict('records'),
            'train_r2': train_score,
            'test_r2': test_score,
            'rmse': rmse,
            'trained_at': datetime.utcnow().isoformat()
        }, f)
    
    print(f"✓ Model saved to {model_path}")
    return model


async def main():
    """Main training function"""
    print("=" * 60)
    print("ML Model Training - Random Forest Models")
    print("=" * 60)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Build database URL
    db_host = os.getenv('DB_HOST')
    db_port = os.getenv('DB_PORT')
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_name = os.getenv('DB_NAME')
    
    database_url = f"postgres://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    print(f"Connecting to database: {db_host}")
    
    # Initialize Tortoise
    await Tortoise.init(
        db_url=database_url,
        modules={'models': ['app.models']}
    )
    
    try:
        # Train all models
        env_model = await train_environment_model()
        traffic_model = await train_traffic_model()
        service_model = await train_service_model()
        
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
        
        if env_model:
            print("✓ Environment Model: environment_model.pkl")
        if traffic_model:
            print("✓ Traffic Model: traffic_model.pkl")
        if service_model:
            print("✓ Service Model: service_model.pkl")
        
        print("\nModels ready for production use.")
        
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
