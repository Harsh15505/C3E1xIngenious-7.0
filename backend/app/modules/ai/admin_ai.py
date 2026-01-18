"""
Admin AI: Scenario Recommendation System
Analyzes city data and generates actionable recommendations for municipal decision-makers
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from groq import Groq
from app.config import get_settings
from app.models import City, EnvironmentData, TrafficData, Alert, RiskScore

settings = get_settings()


# ========================================
# SCENARIO TYPES
# ========================================

SCENARIO_TYPES = {
    "traffic": {
        "name": "Traffic Management",
        "keywords": ["congestion", "vehicles", "road", "transport"],
        "metrics": ["traffic_density", "congestion_level", "heavy_vehicles"]
    },
    "pollution": {
        "name": "Air Quality Control",
        "keywords": ["aqi", "pollution", "pm2.5", "air quality"],
        "metrics": ["aqi", "pm25", "temperature"]
    },
    "emergency": {
        "name": "Emergency Response",
        "keywords": ["alert", "critical", "emergency", "hazard"],
        "metrics": ["active_alerts", "risk_score", "severity"]
    },
    "general": {
        "name": "General Operations",
        "keywords": ["overall", "general", "city", "operations"],
        "metrics": ["all"]
    }
}


# ========================================
# DATA AGGREGATION
# ========================================

async def get_traffic_analysis(city: City, hours: int = 24) -> Dict:
    """Analyze traffic patterns over specified time window"""
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        traffic_data = await TrafficData.filter(
            city=city,
            timestamp__gte=cutoff_time
        ).all()
        
        if not traffic_data:
            return None
        
        # Aggregate by zone
        zone_analysis = {}
        for record in traffic_data:
            zone = record.zone
            if zone not in zone_analysis:
                zone_analysis[zone] = {
                    "records": [],
                    "avg_density": 0,
                    "max_density": 0,
                    "congestion_events": 0
                }
            
            zone_analysis[zone]["records"].append(record.density_percent)
            if record.density_percent > 75:
                zone_analysis[zone]["congestion_events"] += 1
        
        # Calculate statistics
        for zone, data in zone_analysis.items():
            records = data["records"]
            data["avg_density"] = sum(records) / len(records) if records else 0
            data["max_density"] = max(records) if records else 0
            data["total_records"] = len(records)
        
        return {
            "zones": zone_analysis,
            "total_records": len(traffic_data),
            "time_window_hours": hours
        }
    except Exception as e:
        print(f"Error analyzing traffic: {e}")
        return None


async def get_environment_analysis(city: City, hours: int = 24) -> Dict:
    """Analyze environmental conditions over specified time window"""
    try:
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        env_data = await EnvironmentData.filter(
            city=city,
            timestamp__gte=cutoff_time
        ).order_by("-timestamp").all()
        
        if not env_data:
            return None
        
        # Calculate statistics
        aqi_values = [d.aqi for d in env_data if d.aqi is not None]
        pm25_values = [d.pm25 for d in env_data if d.pm25 is not None]
        temp_values = [d.temperature for d in env_data if d.temperature is not None]
        
        return {
            "aqi": {
                "avg": sum(aqi_values) / len(aqi_values) if aqi_values else None,
                "max": max(aqi_values) if aqi_values else None,
                "min": min(aqi_values) if aqi_values else None,
                "current": env_data[0].aqi if env_data else None
            },
            "pm25": {
                "avg": sum(pm25_values) / len(pm25_values) if pm25_values else None,
                "max": max(pm25_values) if pm25_values else None,
                "current": env_data[0].pm25 if env_data else None
            },
            "temperature": {
                "avg": sum(temp_values) / len(temp_values) if temp_values else None,
                "max": max(temp_values) if temp_values else None,
                "current": env_data[0].temperature if env_data else None
            },
            "total_records": len(env_data),
            "time_window_hours": hours
        }
    except Exception as e:
        print(f"Error analyzing environment: {e}")
        return None


async def get_alerts_analysis(city: City) -> Dict:
    """Get active alerts and severity distribution"""
    try:
        active_alerts = await Alert.filter(
            city=city,
            is_active=True
        ).all()
        
        severity_count = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }
        
        alert_categories = {}
        
        for alert in active_alerts:
            # Count by severity
            severity = alert.severity.lower()
            if severity in severity_count:
                severity_count[severity] += 1
            
            # Count by category
            category = alert.type
            if category not in alert_categories:
                alert_categories[category] = 0
            alert_categories[category] += 1
        
        return {
            "total_active": len(active_alerts),
            "by_severity": severity_count,
            "by_category": alert_categories,
            "has_critical": severity_count["critical"] > 0
        }
    except Exception as e:
        print(f"Error analyzing alerts: {e}")
        return None


async def get_risk_analysis(city: City) -> Dict:
    """Get latest risk scores"""
    try:
        latest_risk = await RiskScore.filter(
            city=city
        ).order_by("-calculated_at").first()
        
        if not latest_risk:
            return None
        
        return {
            "overall_score": latest_risk.score,
            "level": latest_risk.level,
            "category": latest_risk.category,
            "contributing_factors": latest_risk.contributing_factors
        }
    except Exception as e:
        print(f"Error analyzing risk: {e}")
        return None


# ========================================
# RECOMMENDATION GENERATION
# ========================================

def build_admin_system_prompt() -> str:
    """Build strict system prompt for admin recommendations"""
    return """You are an AI advisor for municipal operations. Generate actionable recommendations for city administrators.

**Strict Rules:**
1. Generate 3-5 specific, actionable recommendations
2. Each recommendation must:
   - Be specific and measurable (e.g., "Deploy 2 additional traffic units to Zone A")
   - Cite the exact data that supports it
   - Include expected impact
   - Be implementable within 24-48 hours
3. Assign severity: HIGH, MEDIUM, or LOW
4. Base recommendations ONLY on provided data
5. Focus on immediate operational improvements
6. Avoid generic advice like "monitor the situation"
7. Prioritize public safety and service quality

**Format each recommendation as:**
[SEVERITY] Action: [specific action]
Reason: [data-driven justification with numbers]
Impact: [expected outcome]
"""


def build_admin_user_prompt(scenario_type: str, city_name: str, analysis_data: Dict) -> str:
    """Build context-rich prompt for GROQ"""
    prompt = f"**City:** {city_name}\n"
    prompt += f"**Scenario Type:** {SCENARIO_TYPES.get(scenario_type, {}).get('name', scenario_type)}\n"
    prompt += f"**Analysis Time Window:** Last 24 hours\n\n"
    
    # Add traffic data
    if "traffic" in analysis_data and analysis_data["traffic"]:
        traffic = analysis_data["traffic"]
        prompt += "**Traffic Analysis:**\n"
        for zone, stats in traffic["zones"].items():
            prompt += f"- Zone {zone}: Avg {stats['avg_density']:.1f}% density, Max {stats['max_density']:.1f}%, {stats['congestion_events']} congestion events\n"
        prompt += "\n"
    
    # Add environment data
    if "environment" in analysis_data and analysis_data["environment"]:
        env = analysis_data["environment"]
        if env["aqi"]["current"]:
            prompt += "**Air Quality:**\n"
            prompt += f"- Current AQI: {env['aqi']['current']:.0f}, Avg: {env['aqi']['avg']:.0f}, Max: {env['aqi']['max']:.0f}\n"
            prompt += f"- Current PM2.5: {env['pm25']['current']:.1f} µg/m³, Avg: {env['pm25']['avg']:.1f}\n"
            prompt += "\n"
    
    # Add alerts data
    if "alerts" in analysis_data and analysis_data["alerts"]:
        alerts = analysis_data["alerts"]
        prompt += "**Active Alerts:**\n"
        prompt += f"- Total: {alerts['total_active']}, Critical: {alerts['by_severity']['critical']}, High: {alerts['by_severity']['high']}\n"
        if alerts["by_category"]:
            prompt += f"- Categories: {', '.join([f'{k}({v})' for k, v in alerts['by_category'].items()])}\n"
        prompt += "\n"
    
    # Add risk data
    if "risk" in analysis_data and analysis_data["risk"]:
        risk = analysis_data["risk"]
        prompt += "**Risk Assessment:**\n"
        prompt += f"- Overall Risk Score: {risk['overall_score']:.2f} ({risk['level'].upper()})\n"
        prompt += f"- Category: {risk['category']}\n"
        prompt += "\n"
    
    prompt += "**Task:** Generate 3-5 actionable recommendations for municipal decision-makers based on this data."
    
    return prompt


async def generate_recommendations(
    scenario_type: str,
    city: City,
    analysis_data: Dict
) -> Dict:
    """Generate AI-powered recommendations using GROQ"""
    try:
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "":
            return {
                "success": False,
                "recommendations": [],
                "error": "AI service not configured"
            }
        
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        # Build prompts
        system_prompt = build_admin_system_prompt()
        user_prompt = build_admin_user_prompt(scenario_type, city.name, analysis_data)
        
        # Call GROQ API
        start_time = datetime.utcnow()
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.4,  # Slightly higher for creative recommendations
            max_tokens=500,   # More tokens for detailed recommendations
            top_p=0.9
        )
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        # Parse recommendations
        raw_text = response.choices[0].message.content.strip()
        recommendations = parse_recommendations(raw_text)
        
        return {
            "success": True,
            "recommendations": recommendations,
            "response_time_ms": int(response_time),
            "model": settings.GROQ_MODEL
        }
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "recommendations": [],
            "error": str(e)
        }


def parse_recommendations(raw_text: str) -> List[Dict]:
    """Parse GROQ response into structured recommendations"""
    recommendations = []
    lines = raw_text.split("\n")
    current_rec = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check for severity markers
        if line.startswith("[HIGH]") or line.startswith("[MEDIUM]") or line.startswith("[LOW]"):
            if current_rec:
                recommendations.append(current_rec)
            
            severity = line.split("]")[0].replace("[", "").strip()
            action_text = line.split("]", 1)[1].strip() if "]" in line else ""
            
            current_rec = {
                "severity": severity,
                "action": action_text.replace("Action:", "").strip(),
                "reason": "",
                "impact": ""
            }
        elif current_rec:
            if line.startswith("Reason:"):
                current_rec["reason"] = line.replace("Reason:", "").strip()
            elif line.startswith("Impact:"):
                current_rec["impact"] = line.replace("Impact:", "").strip()
            elif "Action:" in line:
                current_rec["action"] = line.replace("Action:", "").strip()
    
    # Add last recommendation
    if current_rec:
        recommendations.append(current_rec)
    
    return recommendations[:5]  # Max 5 recommendations


# ========================================
# MAIN HANDLER
# ========================================

async def handle_admin_scenario(
    scenario_type: str,
    city: City
) -> Dict:
    """
    Main entry point for admin scenario recommendations
    Returns recommendations with metadata
    """
    start_time = datetime.utcnow()
    
    # Validate scenario type
    if scenario_type not in SCENARIO_TYPES and scenario_type != "general":
        return {
            "success": False,
            "error": f"Invalid scenario type. Must be one of: {', '.join(SCENARIO_TYPES.keys())}"
        }
    
    # Gather analysis data
    analysis_data = {}
    
    if scenario_type in ["traffic", "general"]:
        traffic_data = await get_traffic_analysis(city, hours=24)
        if traffic_data:
            analysis_data["traffic"] = traffic_data
    
    if scenario_type in ["pollution", "general"]:
        env_data = await get_environment_analysis(city, hours=24)
        if env_data:
            analysis_data["environment"] = env_data
    
    if scenario_type in ["emergency", "general"]:
        alerts_data = await get_alerts_analysis(city)
        if alerts_data:
            analysis_data["alerts"] = alerts_data
        
        risk_data = await get_risk_analysis(city)
        if risk_data:
            analysis_data["risk"] = risk_data
    
    # Check if we have any data
    if not analysis_data:
        return {
            "success": False,
            "error": "No data available for analysis",
            "city_name": city.name,
            "scenario_type": scenario_type
        }
    
    # Generate recommendations
    rec_result = await generate_recommendations(scenario_type, city, analysis_data)
    
    end_time = datetime.utcnow()
    total_time = int((end_time - start_time).total_seconds() * 1000)
    
    return {
        "success": rec_result["success"],
        "city_name": city.name,
        "scenario_type": scenario_type,
        "recommendations": rec_result.get("recommendations", []),
        "analysis_summary": {
            "traffic_zones_analyzed": len(analysis_data.get("traffic", {}).get("zones", {})),
            "environment_records": analysis_data.get("environment", {}).get("total_records", 0),
            "active_alerts": analysis_data.get("alerts", {}).get("total_active", 0),
            "risk_level": analysis_data.get("risk", {}).get("level", "unknown")
        },
        "response_time_ms": total_time,
        "model": rec_result.get("model", settings.GROQ_MODEL)
    }
