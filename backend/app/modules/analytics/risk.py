"""
Analytics - Risk Scoring Module
Calculate composite risk scores for cities
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
from app.models import City, EnvironmentData, TrafficData, ServiceData, RiskScore, Anomaly, Forecast


class RiskScorer:
    """Calculates urban risk scores based on multiple factors"""
    
    # Risk component weights
    WEIGHTS = {
        "environment": 0.35,    # Air quality, pollution
        "traffic": 0.25,        # Congestion, mobility
        "services": 0.25,       # Water, power infrastructure
        "anomalies": 0.15       # Recent anomalies
    }
    
    # Risk level thresholds
    HIGH_RISK_THRESHOLD = 0.7
    MEDIUM_RISK_THRESHOLD = 0.4
    
    # Metric normalization ranges
    METRIC_RANGES = {
        "aqi": {"min": 0, "max": 500, "direction": "higher_worse"},
        "pm25": {"min": 0, "max": 500, "direction": "higher_worse"},
        "water_stress": {"min": 0, "max": 1, "direction": "higher_worse"},
        "power_load": {"min": 0, "max": 100, "direction": "higher_worse"},
        "traffic_density": {"min": 0, "max": 100, "direction": "higher_worse"},
        "avg_speed": {"min": 0, "max": 100, "direction": "lower_worse"}
    }
    
    @staticmethod
    async def calculate_city_risk(city_name: str) -> Dict[str, Any]:
        """
        Calculate overall risk score for a city
        
        Combines:
        - Current environmental metrics
        - Traffic conditions
        - Service infrastructure stress
        - Recent anomalies
        - Forecast trends
        
        Returns:
            {
                "city": str,
                "overall_score": float (0-1),
                "risk_level": str,
                "components": {
                    "environment": {"score": float, "factors": []},
                    "traffic": {"score": float, "factors": []},
                    "services": {"score": float, "factors": []},
                    "anomalies": {"score": float, "count": int}
                },
                "explanation": str,
                "recommendations": [],
                "calculated_at": str
            }
        """
        city = await City.filter(name__iexact=city_name).first()
        if not city:
            return {
                "city": city_name,
                "error": "City not found"
            }
        
        # Calculate component scores
        env_risk = await RiskScorer._calculate_environment_risk(city)
        traffic_risk = await RiskScorer._calculate_traffic_risk(city)
        services_risk = await RiskScorer._calculate_services_risk(city)
        anomaly_risk = await RiskScorer._calculate_anomaly_risk(city)
        
        # Calculate weighted overall score
        overall_score = (
            env_risk["score"] * RiskScorer.WEIGHTS["environment"] +
            traffic_risk["score"] * RiskScorer.WEIGHTS["traffic"] +
            services_risk["score"] * RiskScorer.WEIGHTS["services"] +
            anomaly_risk["score"] * RiskScorer.WEIGHTS["anomalies"]
        )
        
        # Determine risk level
        risk_level = RiskScorer.determine_level(overall_score)
        
        # Generate explanation
        explanation = RiskScorer._generate_explanation(
            overall_score, risk_level, env_risk, traffic_risk, services_risk, anomaly_risk
        )
        
        # Generate recommendations
        recommendations = RiskScorer._generate_recommendations(
            env_risk, traffic_risk, services_risk, anomaly_risk
        )
        
        # Store in database
        await RiskScore.create(
            city=city,
            category="overall",
            score=overall_score,
            level=risk_level,
            contributing_factors=[
                {"component": "environment", "score": env_risk["score"], "weight": RiskScorer.WEIGHTS["environment"]},
                {"component": "traffic", "score": traffic_risk["score"], "weight": RiskScorer.WEIGHTS["traffic"]},
                {"component": "services", "score": services_risk["score"], "weight": RiskScorer.WEIGHTS["services"]},
                {"component": "anomalies", "score": anomaly_risk["score"], "weight": RiskScorer.WEIGHTS["anomalies"]}
            ]
        )
        
        return {
            "city": city_name,
            "overall_score": round(overall_score, 3),
            "risk_level": risk_level,
            "components": {
                "environment": env_risk,
                "traffic": traffic_risk,
                "services": services_risk,
                "anomalies": anomaly_risk
            },
            "explanation": explanation,
            "recommendations": recommendations,
            "calculated_at": datetime.utcnow().isoformat()
        }
    
    @staticmethod
    async def _calculate_environment_risk(city: City) -> Dict[str, Any]:
        """Calculate environmental risk score"""
        # Get latest environment data
        latest = await EnvironmentData.filter(city=city).order_by('-timestamp').first()
        
        if not latest:
            return {"score": 0.5, "factors": [], "explanation": "No recent data available"}
        
        factors = []
        scores = []
        
        # AQI risk
        if latest.aqi is not None:
            aqi_score = RiskScorer._normalize_metric("aqi", latest.aqi)
            scores.append(aqi_score)
            factors.append({
                "metric": "AQI",
                "value": latest.aqi,
                "risk_contribution": round(aqi_score, 2),
                "status": "unhealthy" if latest.aqi > 150 else "moderate" if latest.aqi > 100 else "good"
            })
        
        # PM2.5 risk
        if latest.pm25 is not None:
            pm25_score = RiskScorer._normalize_metric("pm25", latest.pm25)
            scores.append(pm25_score)
            factors.append({
                "metric": "PM2.5",
                "value": latest.pm25,
                "risk_contribution": round(pm25_score, 2),
                "status": "high" if latest.pm25 > 60 else "moderate" if latest.pm25 > 35 else "low"
            })
        
        avg_score = sum(scores) / len(scores) if scores else 0.5
        
        explanation = f"Based on {len(factors)} environmental metrics from {latest.timestamp.strftime('%Y-%m-%d %H:%M')}"
        
        return {
            "score": round(avg_score, 3),
            "factors": factors,
            "explanation": explanation
        }
    
    @staticmethod
    async def _calculate_traffic_risk(city: City) -> Dict[str, Any]:
        """Calculate traffic risk score"""
        # Get latest traffic data across all zones
        latest_traffic = await TrafficData.filter(city=city).order_by('-timestamp').limit(10)
        
        if not latest_traffic:
            return {"score": 0.5, "factors": [], "explanation": "No recent data available"}
        
        factors = []
        scores = []
        
        for traffic in latest_traffic[:3]:  # Top 3 zones
            if traffic.density_percent is not None:
                density_score = RiskScorer._normalize_metric("traffic_density", traffic.density_percent)
                scores.append(density_score)
                factors.append({
                    "metric": f"Traffic Density Zone {traffic.zone}",
                    "value": traffic.density_percent,
                    "risk_contribution": round(density_score, 2),
                    "status": "congested" if traffic.density_percent > 70 else "moderate" if traffic.density_percent > 50 else "smooth"
                })
        
        avg_score = sum(scores) / len(scores) if scores else 0.5
        
        explanation = f"Based on traffic in {len(factors)} zones, latest data from {latest_traffic[0].timestamp.strftime('%Y-%m-%d %H:%M')}"
        
        return {
            "score": round(avg_score, 3),
            "factors": factors,
            "explanation": explanation
        }
    
    @staticmethod
    async def _calculate_services_risk(city: City) -> Dict[str, Any]:
        """Calculate public services risk score"""
        # Get latest service data
        latest = await ServiceData.filter(city=city).order_by('-timestamp').first()
        
        if not latest:
            return {"score": 0.5, "factors": [], "explanation": "No recent data available"}
        
        factors = []
        scores = []
        
        # Water stress risk
        if latest.water_supply_stress is not None:
            water_score = RiskScorer._normalize_metric("water_stress", latest.water_supply_stress)
            scores.append(water_score)
            factors.append({
                "metric": "Water Stress",
                "value": latest.water_supply_stress,
                "risk_contribution": round(water_score, 2),
                "status": "critical" if latest.water_supply_stress > 0.7 else "stressed" if latest.water_supply_stress > 0.4 else "adequate"
            })
        
        # Power load risk
        if latest.power_outage_count is not None:
            power_score = RiskScorer._normalize_metric("power_load", latest.power_outage_count)
            scores.append(power_score)
            factors.append({
                "metric": "Power Outage Count",
                "value": latest.power_outage_count,
                "risk_contribution": round(power_score, 2),
                "status": "overloaded" if latest.power_outage_count > 10 else "stressed" if latest.power_outage_count > 5 else "normal"
            })
        
        avg_score = sum(scores) / len(scores) if scores else 0.5
        
        explanation = f"Based on {len(factors)} service metrics from {latest.timestamp.strftime('%Y-%m-%d %H:%M')}"
        
        return {
            "score": round(avg_score, 3),
            "factors": factors,
            "explanation": explanation
        }
    
    @staticmethod
    async def _calculate_anomaly_risk(city: City) -> Dict[str, Any]:
        """Calculate risk based on recent anomalies"""
        # Get anomalies from last 7 days
        lookback_date = datetime.utcnow() - timedelta(days=7)
        recent_anomalies = await Anomaly.filter(
            city=city,
            detected_at__gte=lookback_date,
            resolved=False
        ).all()
        
        if not recent_anomalies:
            return {
                "score": 0.0,
                "count": 0,
                "by_severity": {"high": 0, "medium": 0, "low": 0},
                "explanation": "No unresolved anomalies in the last 7 days"
            }
        
        # Count by severity
        high_count = sum(1 for a in recent_anomalies if a.severity == "high")
        medium_count = sum(1 for a in recent_anomalies if a.severity == "medium")
        low_count = sum(1 for a in recent_anomalies if a.severity == "low")
        
        # Calculate score based on weighted severity
        anomaly_score = min(1.0, (high_count * 0.3 + medium_count * 0.15 + low_count * 0.05))
        
        explanation = f"{len(recent_anomalies)} unresolved anomalies: {high_count} high, {medium_count} medium, {low_count} low"
        
        return {
            "score": round(anomaly_score, 3),
            "count": len(recent_anomalies),
            "by_severity": {
                "high": high_count,
                "medium": medium_count,
                "low": low_count
            },
            "explanation": explanation
        }
    
    @staticmethod
    def _normalize_metric(metric_name: str, value: float) -> float:
        """Normalize metric to 0-1 risk score"""
        if metric_name not in RiskScorer.METRIC_RANGES:
            return 0.5
        
        config = RiskScorer.METRIC_RANGES[metric_name]
        min_val = config["min"]
        max_val = config["max"]
        direction = config["direction"]
        
        # Clamp value to range
        normalized = (value - min_val) / (max_val - min_val)
        normalized = max(0.0, min(1.0, normalized))
        
        # Invert if lower is worse
        if direction == "lower_worse":
            normalized = 1.0 - normalized
        
        return normalized
    
    @staticmethod
    def determine_level(score: float) -> str:
        """Convert numeric score to risk level"""
        if score >= RiskScorer.HIGH_RISK_THRESHOLD:
            return "high"
        elif score >= RiskScorer.MEDIUM_RISK_THRESHOLD:
            return "medium"
        else:
            return "low"
    
    @staticmethod
    def _generate_explanation(
        overall_score: float,
        risk_level: str,
        env_risk: Dict,
        traffic_risk: Dict,
        services_risk: Dict,
        anomaly_risk: Dict
    ) -> str:
        """Generate human-readable explanation of risk score"""
        
        lines = [f"Overall risk level: {risk_level.upper()} (score: {overall_score:.2f})"]
        
        # Identify primary concerns
        components = [
            ("Environmental conditions", env_risk["score"]),
            ("Traffic conditions", traffic_risk["score"]),
            ("Service infrastructure", services_risk["score"]),
            ("Active anomalies", anomaly_risk["score"])
        ]
        
        # Sort by score descending
        components.sort(key=lambda x: x[1], reverse=True)
        
        lines.append("\nPrimary risk factors:")
        for name, score in components:
            if score > 0.6:
                lines.append(f"  • {name}: HIGH ({score:.2f})")
            elif score > 0.3:
                lines.append(f"  • {name}: MODERATE ({score:.2f})")
        
        return "\n".join(lines)
    
    @staticmethod
    def _generate_recommendations(
        env_risk: Dict,
        traffic_risk: Dict,
        services_risk: Dict,
        anomaly_risk: Dict
    ) -> List[str]:
        """Generate actionable recommendations based on risk scores"""
        recommendations = []
        
        # Environment recommendations
        if env_risk["score"] > 0.7:
            recommendations.append("⚠️ CRITICAL: Air quality extremely poor. Consider issuing public health advisory and traffic restrictions.")
        elif env_risk["score"] > 0.5:
            recommendations.append("⚠️ Air quality declining. Monitor closely and prepare intervention measures.")
        
        # Traffic recommendations
        if traffic_risk["score"] > 0.7:
            recommendations.append("🚦 CRITICAL: Severe congestion detected. Deploy traffic management teams to hotspots.")
        elif traffic_risk["score"] > 0.5:
            recommendations.append("🚦 Heavy traffic detected. Consider dynamic signal timing adjustments.")
        
        # Services recommendations
        if services_risk["score"] > 0.7:
            recommendations.append("⚡ CRITICAL: Infrastructure stress detected. Prepare emergency response protocols.")
        elif services_risk["score"] > 0.5:
            recommendations.append("⚡ Service infrastructure under stress. Monitor closely for potential disruptions.")
        
        # Anomaly recommendations
        if anomaly_risk["count"] > 5:
            recommendations.append("🔍 Multiple anomalies detected. Investigate root causes and verify sensor integrity.")
        
        if not recommendations:
            recommendations.append("✅ No immediate concerns. Continue routine monitoring.")
        
        return recommendations

