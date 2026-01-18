"""
AI API Endpoints for Citizen Queries and Admin Decision Intelligence
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from app.models import AIQueryLog, City, User
from app.modules.ai.citizen_ai import handle_citizen_query
from app.modules.ai.admin_ai import handle_admin_scenario
from app.modules.auth.middleware import get_optional_user, get_current_admin


router = APIRouter()


# ========================================
# REQUEST/RESPONSE MODELS
# ========================================

class CitizenQueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=500)
    city_id: UUID = Field(..., description="City UUID to query about")


class CitizenQueryResponse(BaseModel):
    success: bool
    response: str
    intent: str
    is_valid_domain: bool
    confidence: float
    data_sources: list[str]
    response_time_ms: int
    city_name: str


# ========================================
# CITIZEN AI ENDPOINTS
# ========================================

@router.post("/query", response_model=CitizenQueryResponse)
async def citizen_ai_query(
    request: Request,
    query_request: CitizenQueryRequest,
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Process citizen query with AI assistance
    - Validates query domain
    - Detects intent
    - Fetches relevant city data
    - Generates natural language explanation
    - Logs query for audit
    """
    try:
        # Fetch city
        city = await City.get_or_none(id=query_request.city_id)
        if not city:
            raise HTTPException(status_code=404, detail="City not found")
        
        # Process query through AI system
        result = await handle_citizen_query(
            query=query_request.query,
            city=city,
            user=current_user
        )
        
        # Log query for audit
        await AIQueryLog.create(
            user=current_user,
            city=city,
            query_text=query_request.query,
            query_type="citizen",
            detected_intent=result["intent"],
            is_valid_domain=result["is_valid_domain"],
            ai_response=result["response"],
            confidence_score=result["confidence"],
            data_sources=result["data_sources"],
            response_time_ms=result["response_time_ms"],
            model_used=f"groq:{result.get('model', 'llama-3.1-70b-versatile')}"
        )
        
        return CitizenQueryResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing AI query: {e}")
        raise HTTPException(status_code=500, detail="Failed to process query")


@router.get("/query-logs")
async def get_query_logs(
    limit: int = 50,
    query_type: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Get AI query logs (for authenticated users - their own queries only)
    Admin users can see all queries
    """
    try:
        query = AIQueryLog.all()
        
        # Filter by query type if specified
        if query_type:
            query = query.filter(query_type=query_type)
        
        # Non-admin users can only see their own queries
        if current_user and not current_user.role == "admin":
            query = query.filter(user=current_user)
        
        logs = await query.order_by("-created_at").limit(limit).values(
            "id", "query_text", "detected_intent", "confidence_score",
            "data_sources", "created_at", "response_time_ms"
        )
        
        return {"logs": logs}
    
    except Exception as e:
        print(f"Error fetching query logs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch logs")


# ========================================
# ADMIN AI ENDPOINTS
# ========================================

class AdminScenarioRequest(BaseModel):
    scenario_type: str = Field(..., description="Type of scenario: traffic, pollution, emergency, or general")
    city_id: UUID = Field(..., description="City UUID to analyze")


class AdminRecommendation(BaseModel):
    severity: str
    action: str
    reason: str
    impact: str


class AdminScenarioResponse(BaseModel):
    success: bool
    city_name: str
    scenario_type: str
    recommendations: list[AdminRecommendation]
    analysis_summary: dict
    response_time_ms: int
    model: str


@router.post("/admin/recommendations", response_model=AdminScenarioResponse)
async def get_admin_recommendations(
    request: AdminScenarioRequest,
    current_user: User = Depends(get_current_admin)
):
    """
    Generate AI-powered scenario recommendations for municipal administrators
    - Requires admin authentication
    - Analyzes city data from past 24 hours
    - Returns 3-5 actionable recommendations
    """
    try:
        # Fetch city
        city = await City.get_or_none(id=request.city_id)
        if not city:
            raise HTTPException(status_code=404, detail="City not found")
        
        # Generate recommendations
        result = await handle_admin_scenario(
            scenario_type=request.scenario_type,
            city=city
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Failed to generate recommendations"))
        
        # Log for audit
        await AIQueryLog.create(
            user=current_user,
            city=city,
            query_text=f"Admin scenario: {request.scenario_type}",
            query_type="admin",
            detected_intent=request.scenario_type.upper(),
            is_valid_domain=True,
            ai_response=f"Generated {len(result['recommendations'])} recommendations",
            confidence_score=0.9,  # High confidence for data-driven recommendations
            data_sources=list(result["analysis_summary"].keys()),
            response_time_ms=result["response_time_ms"],
            model_used=f"groq:{result['model']}"
        )
        
        return AdminScenarioResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating admin recommendations: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")
