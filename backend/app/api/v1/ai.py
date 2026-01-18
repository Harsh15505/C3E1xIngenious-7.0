"""
AI API Endpoints for Citizen Queries and Admin Decision Intelligence
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from app.models import AIQueryLog, City, User
from app.modules.ai.citizen_ai import handle_citizen_query
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
