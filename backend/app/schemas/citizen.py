"""
Citizen Participation API schemas
"""

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any


# ========================================
# DATASET REQUEST SCHEMAS
# ========================================

class DatasetRequestInput(BaseModel):
    citizenName: str = Field(..., min_length=2, max_length=200)
    citizenEmail: EmailStr
    datasetType: str = Field(..., pattern="^(environment|traffic|services|all)$")
    reason: str = Field(..., pattern="^(research|academic|civic_project|journalism|other)$")
    description: str = Field(..., min_length=10, max_length=2000)


class DatasetRequestResponse(BaseModel):
    id: str
    citizenName: str
    citizenEmail: str
    datasetType: str
    reason: str
    description: str
    status: str
    adminNotes: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime


class DatasetRequestUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|approved|rejected)$")
    adminNotes: Optional[str] = None


# ========================================
# DATA CORRECTION REQUEST SCHEMAS
# ========================================

class DataCorrectionRequestInput(BaseModel):
    citizenName: str = Field(..., min_length=2, max_length=200)
    citizenEmail: EmailStr
    dataType: str = Field(..., pattern="^(environment|traffic|services)$")
    city: str = Field(..., min_length=2)
    issueDescription: str = Field(..., min_length=10, max_length=2000)
    suggestedCorrection: Optional[Dict[str, Any]] = None
    supportingEvidence: Optional[str] = None


class DataCorrectionRequestResponse(BaseModel):
    id: str
    citizenName: str
    citizenEmail: str
    dataType: str
    city: str
    issueDescription: str
    suggestedCorrection: Optional[Dict[str, Any]]
    supportingEvidence: Optional[str]
    status: str
    adminResponse: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime


class DataCorrectionRequestUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|investigating|resolved|rejected)$")
    adminResponse: Optional[str] = None


# ========================================
# COMMON RESPONSES
# ========================================

class SubmissionResponse(BaseModel):
    success: bool
    message: str
    requestId: str
