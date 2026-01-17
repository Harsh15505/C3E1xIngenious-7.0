"""
Scenario Simulation API Router
🌟 CENTERPIECE FEATURE
"""

from fastapi import APIRouter, HTTPException
from app.schemas.scenario import ScenarioInput, ScenarioResult, ScenarioSaveRequest
from app.modules.scenario.engine import ScenarioEngine
from app.modules.scenario.explainer import ScenarioExplainer

router = APIRouter()


@router.post("/simulate", response_model=ScenarioResult)
async def simulate_scenario(scenario: ScenarioInput):
    """
    Simulate a policy scenario and predict impacts
    
    This is the CENTERPIECE feature - what-if analysis for policy decisions
    """
    try:
        # Run simulation
        result = ScenarioEngine.simulate(scenario.dict())
        
        # TODO: Save to database for audit trail
        
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
    # TODO: Implement with Prisma
    return {"scenarios": []}
