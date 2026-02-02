"""
Citizen AI: Natural Language Query System
Handles intent detection, domain validation, data fetching, and GROQ-powered explanations
"""

import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from groq import Groq
from app.config import get_settings
from app.models import City, EnvironmentData, TrafficData, Alert

settings = get_settings()


# ========================================
# DOMAIN & INTENT DETECTION
# ========================================

# Allowed domains - citizen queries must be about these topics
ALLOWED_DOMAINS = {
    "air_quality": ["air quality", "aqi", "pollution", "pm2.5", "pm10", "air pollution", "smog", "ozone", "air index"],
    "traffic": ["traffic", "congestion", "vehicles", "road", "transport", "commute", "rush hour", "traffic jam"],
    "alerts": ["alert", "warning", "notification", "emergency", "danger", "hazard", "advisory"],
    "risk": ["risk", "safety", "dangerous", "threat", "health risk", "exposure"],
    "weather": ["temperature", "weather", "rainfall", "rain", "climate", "heat", "cold"],
    "general_city": ["city", "data", "status", "condition", "situation", "current"]
}

# Blocked domains - refuse to answer these
BLOCKED_DOMAINS = [
    "politics", "political", "election", "government policy", "minister", "president",
    "coding", "programming", "debug", "code", "software",
    "joke", "funny", "humor", "entertainment",
    "personal", "my life", "relationship", "dating",
    "general knowledge", "history", "geography", "science", "mathematics"
]

# Intent categories for routing
INTENT_KEYWORDS = {
    "RISK": ["risk", "danger", "safe", "safety", "unsafe", "hazard", "health risk", "exposure risk"],
    "AIR": ["air", "aqi", "pollution", "pm2.5", "pm10", "air quality", "smog", "breathe"],
    "TRAFFIC": ["traffic", "congestion", "vehicles", "road", "commute", "rush hour", "jam"],
    "ALERT": ["alert", "warning", "emergency", "notification", "advisory"],
    "GENERAL": ["status", "condition", "how is", "what is", "current", "now", "today"]
}


def is_valid_query(query: str) -> Tuple[bool, Optional[str]]:
    """
    Validate if query is within allowed domains
    Returns: (is_valid, rejection_reason)
    """
    query_lower = query.lower().strip()
    
    # Check blocked domains first
    for blocked_term in BLOCKED_DOMAINS:
        if blocked_term in query_lower:
            return False, f"I can only answer questions about city air quality, traffic, alerts, and safety conditions. I cannot help with {blocked_term}-related questions."
    
    # Check if query contains at least one allowed domain keyword
    has_allowed_keyword = False
    for domain_keywords in ALLOWED_DOMAINS.values():
        for keyword in domain_keywords:
            if keyword in query_lower:
                has_allowed_keyword = True
                break
        if has_allowed_keyword:
            break
    
    # If no allowed keywords found, it's an invalid domain
    if not has_allowed_keyword:
        return False, "I can only answer questions about air quality, pollution, traffic conditions, city alerts, and safety risks. Please ask about these topics."
    
    return True, None


def detect_intent(query: str) -> str:
    """
    Detect query intent using keyword matching
    Returns: RISK, AIR, TRAFFIC, ALERT, GENERAL, or INVALID
    """
    query_lower = query.lower().strip()
    
    # Count keyword matches for each intent
    intent_scores = {}
    for intent_name, keywords in INTENT_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in query_lower)
        if score > 0:
            intent_scores[intent_name] = score
    
    # Return intent with highest score
    if intent_scores:
        return max(intent_scores, key=intent_scores.get)
    else:
        return "INVALID"


def extract_time_context(query: str) -> str:
    """
    Extract temporal context from query (now, today, current, latest)
    Returns: "current" or "historical"
    """
    query_lower = query.lower()
    current_keywords = ["now", "current", "today", "latest", "right now", "at the moment"]
    
    for keyword in current_keywords:
        if keyword in query_lower:
            return "current"
    
    return "current"  # Default to current


# ========================================
# DATA FETCHING
# ========================================

async def get_latest_environment(city: City) -> Optional[Dict]:
    """Fetch latest environment data for city"""
    try:
        env_data = await EnvironmentData.filter(
            city=city
        ).order_by("-timestamp").first()
        
        if not env_data:
            return None
        
        # Return only fields that exist in the model
        return {
            "aqi": env_data.aqi,
            "pm25": env_data.pm25,
            "temperature": env_data.temperature,
            "rainfall": env_data.rainfall,
            "timestamp": env_data.timestamp.isoformat(),
            "is_fresh": env_data.is_fresh
        }
    except Exception as e:
        print(f"Error fetching environment data: {e}")
        import traceback
        traceback.print_exc()
        return None


async def get_latest_traffic(city: City) -> Optional[List[Dict]]:
    """Fetch latest traffic data for all zones in city"""
    try:
        # Get traffic data from last 30 minutes
        recent_time = datetime.utcnow() - timedelta(minutes=30)
        traffic_data = await TrafficData.filter(
            city=city,
            timestamp__gte=recent_time
        ).order_by("-timestamp").limit(10)
        
        if not traffic_data:
            return None
        
        return [{
            "zone": td.zone,
            "density_percent": td.density_percent,
            "congestion_level": td.congestion_level,
            "heavy_vehicle_count": td.heavy_vehicle_count,
            "timestamp": td.timestamp.isoformat()
        } for td in traffic_data]
    except Exception as e:
        print(f"Error fetching traffic data: {e}")
        return None


async def get_active_alerts(city: City) -> Optional[List[Dict]]:
    """Fetch active alerts for city"""
    try:
        alerts = await Alert.filter(
            city=city,
            is_active=True
        ).order_by("-created_at").limit(5)
        
        if not alerts:
            return None
        
        return [{
            "type": alert.type,
            "severity": alert.severity,
            "message": alert.message,
            "created_at": alert.created_at.isoformat()
        } for alert in alerts]
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        return None


async def get_city_context(city: City, intent: str) -> Dict:
    """
    Gather relevant city data based on detected intent
    Returns comprehensive context for AI explanation
    """
    context = {
        "city_name": city.name,
        "intent": intent,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    print(f"DEBUG get_city_context: Fetching data for city={city.name}, intent={intent}")
    
    # Fetch data based on intent
    if intent in ["AIR", "RISK", "GENERAL"]:
        env_data = await get_latest_environment(city)
        print(f"DEBUG: Environment data = {env_data is not None}")
        if env_data:
            context["environment"] = env_data
    
    if intent in ["TRAFFIC", "GENERAL"]:
        traffic_data = await get_latest_traffic(city)
        print(f"DEBUG: Traffic data = {traffic_data is not None}")
        if traffic_data:
            context["traffic"] = traffic_data
    
    if intent in ["ALERT", "RISK", "GENERAL"]:
        alerts = await get_active_alerts(city)
        print(f"DEBUG: Alerts = {alerts is not None}")
        if alerts:
            context["alerts"] = alerts
    
    print(f"DEBUG: Final context keys = {list(context.keys())}")
    return context


# ========================================
# GROQ EXPLANATION ENGINE
# ========================================

def build_system_prompt() -> str:
    """Build strict system prompt for GROQ"""
    return """You are a city data assistant for urban environmental monitoring.

**Strict Rules:**
1. ONLY answer questions about:
   - Air quality (AQI, PM2.5, pollution levels)
   - Traffic conditions (congestion, vehicle density)
   - City alerts and warnings
   - Environmental safety and health risks
   - Current city conditions

2. If asked about ANYTHING else (politics, coding, jokes, personal questions, general knowledge), respond:
   "I can only answer questions about city air quality, traffic, alerts, and safety conditions."

3. Base answers ONLY on the provided city data
4. Keep responses concise (2-4 sentences)
5. Use simple, clear language
6. If data is missing, say "Data not available for [city]"
7. Include specific numbers when available (AQI: 156, PM2.5: 85)
8. End with actionable advice if relevant (e.g., "Consider wearing a mask outdoors")

**Response Format:**
- Start with direct answer to the question
- Cite specific data points
- End with recommendation if health/safety related"""


def build_user_prompt(query: str, context: Dict) -> str:
    """Build user prompt with query and city context"""
    city_name = context.get("city_name", "Unknown City")
    
    prompt = f"**User Query:** {query}\n\n**City:** {city_name}\n\n**Available Data:**\n"
    
    # Add environment data
    if "environment" in context:
        env = context["environment"]
        prompt += f"\n**Air Quality:**\n"
        prompt += f"- AQI: {env.get('aqi', 'N/A')}\n"
        prompt += f"- PM2.5: {env.get('pm25', 'N/A')} µg/m³\n"
        prompt += f"- PM10: {env.get('pm10', 'N/A')} µg/m³\n"
        prompt += f"- Temperature: {env.get('temperature', 'N/A')}°C\n"
        prompt += f"- Last updated: {env.get('timestamp', 'N/A')}\n"
    
    # Add traffic data
    if "traffic" in context and context["traffic"]:
        prompt += f"\n**Traffic Conditions:**\n"
        for zone_data in context["traffic"][:3]:  # Show top 3 zones
            prompt += f"- {zone_data['zone']}: {zone_data['congestion_level']} congestion ({zone_data['density_percent']}% density)\n"
    
    # Add alerts
    if "alerts" in context and context["alerts"]:
        prompt += f"\n**Active Alerts:**\n"
        for alert in context["alerts"]:
            prompt += f"- {alert['severity'].upper()}: {alert['message']}\n"
    
    prompt += f"\n**Instructions:** Answer the user's question using ONLY the data above. Keep it concise (2-4 sentences)."
    
    return prompt


async def generate_explanation(query: str, context: Dict) -> Tuple[str, float, int]:
    """
    Generate natural language explanation using GROQ
    Returns: (explanation_text, confidence_score, response_time_ms)
    """
    try:
        # Initialize GROQ client
        if not settings.GROQ_API_KEY or settings.GROQ_API_KEY == "":
            print("ERROR: GROQ_API_KEY is not set")
            return "AI service is not configured. Please contact support.", 0.0, 0
        
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        # Build prompts
        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(query, context)
        
        print(f"DEBUG: Calling GROQ API with model {settings.GROQ_MODEL}")
        print(f"DEBUG: User prompt length: {len(user_prompt)} chars")
        
        # Call GROQ API
        start_time = datetime.utcnow()
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # Low temperature for factual responses
            max_tokens=200,   # Keep responses concise
            top_p=0.9
        )
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        # Extract response
        explanation = response.choices[0].message.content.strip()
        
        print(f"DEBUG: GROQ response received: {explanation[:100]}...")
        
        # Calculate confidence based on data availability
        confidence = calculate_confidence(context)
        
        return explanation, confidence, int(response_time)
        
    except Exception as e:
        print(f"Error generating GROQ explanation: {e}")
        import traceback
        traceback.print_exc()
        return "I'm unable to process your query at the moment. Please try again.", 0.0, 0


def calculate_confidence(context: Dict) -> float:
    """
    Calculate confidence score based on data availability
    Returns: 0.0 - 1.0
    """
    score = 0.0
    
    # Environment data available
    if "environment" in context:
        env = context["environment"]
        if env.get("aqi") is not None:
            score += 0.4
        if env.get("is_fresh", False):
            score += 0.1
    
    # Traffic data available
    if "traffic" in context and context["traffic"]:
        score += 0.3
    
    # Alerts available
    if "alerts" in context and context["alerts"]:
        score += 0.2
    
    return min(score, 1.0)


# ========================================
# MAIN QUERY HANDLER
# ========================================

async def handle_citizen_query(query: str, city: City, user=None) -> Dict:
    """
    Main entry point for citizen AI queries
    Returns complete response with explanation and metadata
    """
    start_time = datetime.utcnow()
    
    # Step 1: Validate domain
    is_valid, rejection_reason = is_valid_query(query)
    if not is_valid:
        return {
            "success": False,
            "response": rejection_reason,
            "intent": "INVALID",
            "is_valid_domain": False,
            "confidence": 0.0,
            "data_sources": [],
            "response_time_ms": 0
        }
    
    # Step 2: Detect intent
    intent = detect_intent(query)
    
    # Step 3: Gather city context
    context = await get_city_context(city, intent)
    
    # Step 4: Generate explanation using GROQ
    explanation, confidence, groq_time = await generate_explanation(query, context)
    
    # Step 5: Determine data sources used
    data_sources = []
    if "environment" in context:
        data_sources.append("Environment")
    if "traffic" in context:
        data_sources.append("Traffic")
    if "alerts" in context:
        data_sources.append("Alerts")
    
    end_time = datetime.utcnow()
    total_time = int((end_time - start_time).total_seconds() * 1000)
    
    return {
        "success": True,
        "response": explanation,
        "intent": intent,
        "is_valid_domain": True,
        "confidence": confidence,
        "data_sources": data_sources,
        "response_time_ms": total_time,
        "city_name": city.name
    }
