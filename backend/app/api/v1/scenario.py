"""
Scenario Simulation API Router
🌟 CENTERPIECE FEATURE
"""

from fastapi import APIRouter, HTTPException
from app.schemas.scenario import ScenarioInput, ScenarioResult, ScenarioSaveRequest
from app.modules.scenario.engine import ScenarioEngine
from app.modules.scenario.explainer import ScenarioExplainer

router = APIRouter()


@router.post("/simulate")
async def simulate_scenario(scenario: ScenarioInput):
    """
    Simulate a policy scenario and predict impacts
    
    This is the CENTERPIECE feature - what-if analysis for policy decisions
    """
    try:
        # Run simulation (now async)
        result = await ScenarioEngine.simulate(scenario.dict())
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/simulate/{city}")
async def simulate_scenario_with_city(city: str, scenario: ScenarioInput):
    """
    Simulate a policy scenario with city in path.
    If the request body omits city, inject it from the path.
    """
    try:
        payload = scenario.dict()
        if not payload.get("city"):
            payload["city"] = city
        result = await ScenarioEngine.simulate(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/explain")
async def explain_model():
    """Get explanation of the scenario model and its assumptions"""
    return ScenarioEngine.explain_model()


@router.post("/save")
async def save_scenario(request: ScenarioSaveRequest):
    """Save a scenario simulation for future reference"""
    # TODO: Implement with Prisma
    return {"success": True, "message": "Scenario saved"}


@router.get("/history/{city}")
async def get_scenario_history(city: str, limit: int = 10):
    """Get history of scenarios simulated for a city"""
    from app.models import City, Scenario
    
    city_obj = await City.filter(name__iexact=city).first()
    if not city_obj:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    
    scenarios = await Scenario.filter(city=city_obj).order_by('-created_at').limit(limit)
    
    return {
        "city": city,
        "count": len(scenarios),
        "scenarios": [
            {
                "id": str(s.id),
                "name": s.name,
                "inputs": s.inputs,
                "outputs": s.outputs,
                "confidence": s.confidence,
                "explanation": s.explanation,
                "created_at": s.created_at.isoformat()
            }
            for s in scenarios
        ]
    }
