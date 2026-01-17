"""
Data Ingestion API Router
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.ingestion import (
    EnvironmentDataInput,
    ServiceDataInput,
    TrafficDataInput,
    IngestionResponse
)
from app.models import City, EnvironmentData, ServiceData, TrafficData
from app.modules.cdo.validator import DataValidator
from app.modules.cdo.standardizer import DataStandardizer
from app.modules.cdo.freshness import FreshnessTracker
from typing import Dict, Any

router = APIRouter()


@router.post("/environment", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
async def ingest_environment_data(data: EnvironmentDataInput):
    """Ingest environmental data (AQI, PM2.5, temperature, rainfall)"""
    # Convert to dict for validation
    data_dict = data.model_dump()
    
    # Validate data
    is_valid, errors = DataValidator.validate_environment_data(data_dict)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": errors}
        )
    
    # Standardize data
    standardized = DataStandardizer.standardize_environment_data(data_dict)
    
    # Find city
    city = await City.filter(name=standardized["city"]).first()
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{standardized['city']}' not found"
        )
    
    try:
        # Create environment data record
        env_data = await EnvironmentData.create(
            city=city,
            aqi=standardized.get("aqi"),
            pm25=standardized.get("pm25"),
            temperature=standardized.get("temperature"),
            rainfall=standardized.get("rainfall"),
            timestamp=standardized["timestamp"]
        )
        
        # Update source status
        await FreshnessTracker.update_source_status(
            source_id=standardized["source"],
            success=True
        )
        
        return IngestionResponse(
            success=True,
            recordId=str(env_data.id),
            message=f"Environment data ingested for {city.name}"
        )
    
    except Exception as e:
        await FreshnessTracker.update_source_status(
            source_id=standardized["source"],
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest data: {str(e)}"
        )


@router.post("/services", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
async def ingest_service_data(data: ServiceDataInput):
    """Ingest public service data (water, waste, power)"""
    data_dict = data.model_dump()
    
    # Validate data
    is_valid, errors = DataValidator.validate_service_data(data_dict)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": errors}
        )
    
    # Standardize data
    standardized = DataStandardizer.standardize_service_data(data_dict)
    
    # Find city
    city = await City.filter(name=standardized["city"]).first()
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{standardized['city']}' not found"
        )
    
    try:
        # Create service data record
        service_data = await ServiceData.create(
            city=city,
            water_supply_stress=standardized.get("water_supply_stress"),
            waste_collection_eff=standardized.get("waste_collection_eff"),
            power_outage_count=standardized.get("power_outage_count"),
            timestamp=standardized["timestamp"]
        )
        
        # Update source status
        await FreshnessTracker.update_source_status(
            source_id=standardized["source"],
            success=True
        )
        
        return IngestionResponse(
            success=True,
            recordId=str(service_data.id),
            message=f"Service data ingested for {city.name}"
        )
    
    except Exception as e:
        await FreshnessTracker.update_source_status(
            source_id=standardized["source"],
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest data: {str(e)}"
        )


@router.post("/traffic", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED)
async def ingest_traffic_data(data: TrafficDataInput):
    """Ingest traffic data (density, congestion, heavy vehicles)"""
    data_dict = data.model_dump()
    
    # Validate data
    is_valid, errors = DataValidator.validate_traffic_data(data_dict)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"errors": errors}
        )
    
    # Standardize data
    standardized = DataStandardizer.standardize_traffic_data(data_dict)
    
    # Find city
    city = await City.filter(name=standardized["city"]).first()
    if not city:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City '{standardized['city']}' not found"
        )
    
    try:
        # Create traffic data record
        traffic_data = await TrafficData.create(
            city=city,
            zone=standardized["zone"],
            density_percent=standardized["density_percent"],
            congestion_level=standardized["congestion_level"],
            heavy_vehicle_count=standardized.get("heavy_vehicle_count"),
            timestamp=standardized["timestamp"]
        )
        
        # Update source status
        await FreshnessTracker.update_source_status(
            source_id=standardized["source"],
            success=True
        )
        
        return IngestionResponse(
            success=True,
            recordId=str(traffic_data.id),
            message=f"Traffic data ingested for {city.name} zone {traffic_data.zone}"
        )
    
    except Exception as e:
        await FreshnessTracker.update_source_status(
            source_id=standardized["source"],
            success=False
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest data: {str(e)}"
        )
