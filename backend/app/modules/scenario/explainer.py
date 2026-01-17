"""
Scenario Engine - Explainer Module
Generates human-readable explanations for scenario predictions
"""

from typing import Dict, Any, List


class ScenarioExplainer:
    """Generates explanations for scenario predictions"""
    
    @staticmethod
    def explain_impact(impact: Dict[str, Any]) -> str:
        """Generate detailed explanation for a single impact"""
        
        metric = impact.get("metric")
        direction = impact.get("direction")
        magnitude = impact.get("magnitude")
        
        direction_verb = "decrease" if direction == "decrease" else "increase"
        
        return (
            f"Expected {magnitude:.1f}% {direction_verb} in {metric}. "
            f"{impact.get('explanation', '')}"
        )
    
    @staticmethod
    def generate_summary(scenario_result: Dict[str, Any]) -> str:
        """Generate executive summary of scenario"""
        
        impacts = scenario_result.get("impacts", [])
        confidence = scenario_result.get("overallConfidence", 0)
        
        positive_count = sum(1 for i in impacts if i.get("direction") == "decrease")
        
        summary = f"Scenario analyzed with {confidence*100:.0f}% confidence. "
        summary += f"{positive_count} positive impacts, {len(impacts) - positive_count} tradeoffs identified. "
        
        return summary
    
    @staticmethod
    def format_for_citizen(scenario_result: Dict[str, Any]) -> Dict[str, Any]:
        """Format scenario results for citizen-friendly display"""
        
        impacts = scenario_result.get("impacts", [])
        
        simplified = []
        for impact in impacts:
            if "AQI" in impact.get("metric", "") or "PM2.5" in impact.get("metric", ""):
                simplified.append({
                    "title": "Air Quality",
                    "change": impact.get("direction"),
                    "amount": f"{impact.get('magnitude'):.0f}%",
                    "meaning": "Cleaner air to breathe" if impact.get("direction") == "decrease" else "More pollution"
                })
        
        return {
            "impacts": simplified,
            "confidence": scenario_result.get("overallConfidence", 0),
            "explanation": "Based on past data from your city"
        }
