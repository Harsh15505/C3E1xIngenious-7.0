"""
Citizen Participation API Router
Endpoints for dataset requests and data correction submissions
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime
from app.schemas.citizen import (
    DatasetRequestInput,
    DatasetRequestResponse,
    DatasetRequestUpdate,
    DataCorrectionRequestInput,
    DataCorrectionRequestResponse,
    DataCorrectionRequestUpdate,
    SubmissionResponse
)
from app.models import DatasetRequest, DataCorrectionRequest, City, User
from app.api.v1.auth import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


# ========================================
# DATASET REQUEST ENDPOINTS (PUBLIC)
# ========================================

@router.post("/dataset-requests", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_dataset_request(request: DatasetRequestInput):
    """
    Submit a request for dataset access (PUBLIC - no auth required)
    
    Citizens can request access to:
    - Environment data
    - Traffic data
    - Services data
    - All datasets
    
    Reasons: research, academic, civic_project, journalism, other
    """
    try:
        dataset_request = await DatasetRequest.create(
            citizen_name=request.citizenName,
            citizen_email=request.citizenEmail,
            dataset_type=request.datasetType,
            reason=request.reason,
            description=request.description,
            status='pending'
        )
        
        logger.info(f"Dataset request submitted: {dataset_request.id} by {request.citizenEmail}")
        
        return SubmissionResponse(
            success=True,
            message="Your dataset request has been submitted successfully. Our team will review it and contact you via email.",
            requestId=str(dataset_request.id)
        )
        
    except Exception as e:
        logger.error(f"Failed to submit dataset request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit request: {str(e)}"
        )


@router.get("/dataset-requests", response_model=List[DatasetRequestResponse])
async def list_dataset_requests(
    status_filter: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    List all dataset requests (ADMIN ONLY)
    
    Query params:
    - status: pending, approved, rejected
    - limit: max results (default 50)
    """
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = DatasetRequest.all().order_by('-created_at')
    
    if status_filter:
        query = query.filter(status=status_filter)
    
    requests = await query.limit(limit)
    
    return [
        DatasetRequestResponse(
            id=str(r.id),
            citizenName=r.citizen_name,
            citizenEmail=r.citizen_email,
            datasetType=r.dataset_type,
            reason=r.reason,
            description=r.description,
            status=r.status,
            adminNotes=r.admin_notes,
            reviewedAt=r.reviewed_at,
            createdAt=r.created_at,
            updatedAt=r.updated_at
        )
        for r in requests
    ]


@router.get("/dataset-requests/{request_id}", response_model=DatasetRequestResponse)
async def get_dataset_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific dataset request by ID (ADMIN ONLY)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    request = await DatasetRequest.filter(id=request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return DatasetRequestResponse(
        id=str(request.id),
        citizenName=request.citizen_name,
        citizenEmail=request.citizen_email,
        datasetType=request.dataset_type,
        reason=request.reason,
        description=request.description,
        status=request.status,
        adminNotes=request.admin_notes,
        reviewedAt=request.reviewed_at,
        createdAt=request.created_at,
        updatedAt=request.updated_at
    )


@router.put("/dataset-requests/{request_id}", response_model=DatasetRequestResponse)
async def update_dataset_request(
    request_id: str,
    update: DatasetRequestUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update dataset request status (ADMIN ONLY)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    request = await DatasetRequest.filter(id=request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request.status = update.status
    if update.adminNotes:
        request.admin_notes = update.adminNotes
    request.reviewed_by_id = current_user.id
    request.reviewed_at = datetime.utcnow()
    
    await request.save()
    
    logger.info(f"Dataset request {request_id} updated to {update.status} by {current_user.email}")
    
    return DatasetRequestResponse(
        id=str(request.id),
        citizenName=request.citizen_name,
        citizenEmail=request.citizen_email,
        datasetType=request.dataset_type,
        reason=request.reason,
        description=request.description,
        status=request.status,
        adminNotes=request.admin_notes,
        reviewedAt=request.reviewed_at,
        createdAt=request.created_at,
        updatedAt=request.updated_at
    )


# ========================================
# DATA CORRECTION REQUEST ENDPOINTS (PUBLIC)
# ========================================

@router.post("/correction-requests", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_correction_request(request: DataCorrectionRequestInput):
    """
    Submit a data correction request (PUBLIC - no auth required)
    
    Citizens can flag:
    - Incorrect environmental readings
    - Wrong traffic data
    - Inaccurate service metrics
    """
    try:
        # Validate city exists
        city = await City.filter(name__iexact=request.city).first()
        if not city:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"City '{request.city}' not found"
            )
        
        correction_request = await DataCorrectionRequest.create(
            citizen_name=request.citizenName,
            citizen_email=request.citizenEmail,
            data_type=request.dataType,
            city=city,
            issue_description=request.issueDescription,
            suggested_correction=request.suggestedCorrection,
            supporting_evidence=request.supportingEvidence,
            status='pending'
        )
        
        logger.info(f"Correction request submitted: {correction_request.id} by {request.citizenEmail} for {city.name}")
        
        return SubmissionResponse(
            success=True,
            message="Your correction request has been submitted. Our data quality team will investigate and respond via email.",
            requestId=str(correction_request.id)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit correction request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit request: {str(e)}"
        )


@router.get("/correction-requests", response_model=List[DataCorrectionRequestResponse])
async def list_correction_requests(
    status_filter: Optional[str] = None,
    data_type: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    List all correction requests (ADMIN ONLY)
    
    Query params:
    - status: pending, investigating, resolved, rejected
    - data_type: environment, traffic, services
    - limit: max results (default 50)
    """
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = DataCorrectionRequest.all().prefetch_related('city').order_by('-created_at')
    
    if status_filter:
        query = query.filter(status=status_filter)
    if data_type:
        query = query.filter(data_type=data_type)
    
    requests = await query.limit(limit)
    
    return [
        DataCorrectionRequestResponse(
            id=str(r.id),
            citizenName=r.citizen_name,
            citizenEmail=r.citizen_email,
            dataType=r.data_type,
            city=r.city.name,
            issueDescription=r.issue_description,
            suggestedCorrection=r.suggested_correction,
            supportingEvidence=r.supporting_evidence,
            status=r.status,
            adminResponse=r.admin_response,
            reviewedAt=r.reviewed_at,
            createdAt=r.created_at,
            updatedAt=r.updated_at
        )
        for r in requests
    ]


@router.get("/correction-requests/{request_id}", response_model=DataCorrectionRequestResponse)
async def get_correction_request(request_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific correction request by ID (ADMIN ONLY)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    request = await DataCorrectionRequest.filter(id=request_id).prefetch_related('city').first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return DataCorrectionRequestResponse(
        id=str(request.id),
        citizenName=request.citizen_name,
        citizenEmail=request.citizen_email,
        dataType=request.data_type,
        city=request.city.name,
        issueDescription=request.issue_description,
        suggestedCorrection=request.suggested_correction,
        supportingEvidence=request.supporting_evidence,
        status=request.status,
        adminResponse=request.admin_response,
        reviewedAt=request.reviewed_at,
        createdAt=request.created_at,
        updatedAt=request.updated_at
    )


@router.put("/correction-requests/{request_id}", response_model=DataCorrectionRequestResponse)
async def update_correction_request(
    request_id: str,
    update: DataCorrectionRequestUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update correction request status (ADMIN ONLY)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    request = await DataCorrectionRequest.filter(id=request_id).prefetch_related('city').first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request.status = update.status
    if update.adminResponse:
        request.admin_response = update.adminResponse
    request.reviewed_by_id = current_user.id
    request.reviewed_at = datetime.utcnow()
    
    await request.save()
    
    logger.info(f"Correction request {request_id} updated to {update.status} by {current_user.email}")
    
    return DataCorrectionRequestResponse(
        id=str(request.id),
        citizenName=request.citizen_name,
        citizenEmail=request.citizen_email,
        dataType=request.data_type,
        city=request.city.name,
        issueDescription=request.issue_description,
        suggestedCorrection=request.suggested_correction,
        supportingEvidence=request.supporting_evidence,
        status=request.status,
        adminResponse=request.admin_response,
        reviewedAt=request.reviewed_at,
        createdAt=request.created_at,
        updatedAt=request.updated_at
    )
