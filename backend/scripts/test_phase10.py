"""
Test Phase 10 ML Endpoints
Tests all new ML functions with explainability
"""

import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tortoise import Tortoise
from dotenv import load_dotenv
from app.modules.ml.core import forecast_metrics, calculate_risk_score, detect_anomalies
from app.modules.ml.explainer import explain_prediction, generate_city_summary


async def test_forecast():
    """Test forecast endpoint"""
    print("\n" + "=" * 60)
    print("TEST 1: Forecast Metrics (7 days for Ahmedabad)")
    print("=" * 60)
    
    result = await forecast_metrics('Ahmedabad', days=7)
    
    print(f"\n[OK] Confidence Score: {result['confidence_score']}")
    print(f"[OK] Method: {result['method']}")
    print(f"[OK] Data Points Used: {result['data_points']}")
    print(f"\n[DATA] Predictions:")
    for pred in result['predictions'][:3]:  # Show first 3 days
        print(f"  {pred['date']}: Temp={pred['temperature']}C, AQI={pred['aqi']}, Confidence={pred['confidence']}")
    
    print(f"\n[INFO] Explanation:")
    print(f"  {result['explanation']}")
    
    # Get detailed explanation
    explanation = await explain_prediction(result, 'forecast')
    print(f"\n[DETAIL] Detailed Explanation:")
    print(f"  Summary: {explanation['summary']}")
    print(f"  Reasoning: {explanation['reasoning']}")
    print(f"  Confidence: {explanation['confidence_breakdown']['level']} - {explanation['confidence_breakdown']['reason']}")
    
    return result['confidence_score'] >= 0.5


async def test_risk_score():
    """Test risk score calculation"""
    print("\n" + "=" * 60)
    print("TEST 2: Risk Score Calculation (Ahmedabad)")
    print("=" * 60)
    
    result = await calculate_risk_score('Ahmedabad')
    
    print(f"\n✓ Risk Score: {result['risk_score']} / 1.0")
    print(f"✓ Confidence: {result['confidence_score']}")
    print(f"\n📊 Breakdown:")
    for component, value in result['breakdown'].items():
        print(f"  {component.capitalize()}: {value}")
    
    print(f"\n⏰ Data Freshness:")
    for source, timestamp in result['data_freshness'].items():
        if timestamp:
            print(f"  {source.capitalize()}: {timestamp}")
    
    print(f"\n📝 Explanation:")
    print(f"  {result['explanation']}")
    
    # Get detailed explanation
    explanation = await explain_prediction(result, 'risk')
    print(f"\n📖 Detailed Explanation:")
    print(f"  Summary: {explanation['summary']}")
    print(f"  Factors:")
    for factor in explanation['factors']:
        print(f"    - {factor['factor']} (weight={factor['weight']}): {factor['impact']}")
    
    return result['confidence_score'] >= 0.5


async def test_anomaly_detection():
    """Test anomaly detection"""
    print("\n" + "=" * 60)
    print("TEST 3: Anomaly Detection (24 hours for Ahmedabad)")
    print("=" * 60)
    
    result = await detect_anomalies('Ahmedabad', hours=24)
    
    print(f"\n✓ Anomalies Found: {len(result['anomalies'])}")
    print(f"✓ Confidence: {result['confidence_score']}")
    print(f"✓ Method: {result['method']}")
    
    print(f"\n📊 Baselines:")
    for metric, values in result['baselines'].items():
        print(f"  {metric.capitalize()}: mean={values['mean']}, std={values['std']}")
    
    if result['anomalies']:
        print(f"\n⚠️ Detected Anomalies:")
        for anomaly in result['anomalies'][:5]:  # Show first 5
            print(f"  {anomaly['timestamp']}: {anomaly['metric']} = {anomaly['value']} (severity: {anomaly['severity']})")
    else:
        print("\n✓ No anomalies detected - all metrics within normal range")
    
    print(f"\n📝 Explanation:")
    print(f"  {result['explanation']}")
    
    # Get detailed explanation
    explanation = await explain_prediction(result, 'anomaly')
    print(f"\n📖 Detailed Explanation:")
    print(f"  Summary: {explanation['summary']}")
    print(f"  Reasoning: {explanation['reasoning']}")
    
    return result['confidence_score'] >= 0.5


async def test_city_summary():
    """Test city summary generation"""
    print("\n" + "=" * 60)
    print("TEST 4: City Summary (Ahmedabad)")
    print("=" * 60)
    
    result = await generate_city_summary('Ahmedabad')
    
    print(f"\n✓ Summary: {result['summary']}")
    print(f"✓ Confidence: {result['confidence']}")
    
    print(f"\n💡 Key Insights:")
    for insight in result['key_insights']:
        print(f"  {insight}")
    
    print(f"\n📈 Trends:")
    for category, data in result['trends'].items():
        print(f"  {category.upper()}: {data}")
    
    if result['alerts']:
        print(f"\n⚠️ Active Alerts:")
        for alert in result['alerts']:
            print(f"  {alert}")
    
    print(f"\n📝 Explanation:")
    print(f"  {result['explanation']}")
    
    return result['confidence'] >= 0.5


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("PHASE 10 ML & EXPLAINABLE AI - TESTING")
    print("=" * 60)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Load environment
    load_dotenv()
    
    # Connect to database
    db_host = os.getenv('DB_HOST')
    db_port = os.getenv('DB_PORT')
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_name = os.getenv('DB_NAME')
    
    database_url = f"postgres://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    print(f"Connecting to: {db_host}")
    
    await Tortoise.init(
        db_url=database_url,
        modules={'models': ['app.models']}
    )
    
    try:
        # Run tests
        results = {}
        
        results['forecast'] = await test_forecast()
        results['risk_score'] = await test_risk_score()
        results['anomaly'] = await test_anomaly_detection()
        results['city_summary'] = await test_city_summary()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(results.values())
        total = len(results)
        
        for test_name, passed_test in results.items():
            status = "✅ PASS" if passed_test else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\nResults: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All Phase 10 ML functions working correctly!")
            print("✓ All functions return confidence scores")
            print("✓ All predictions include explanations")
            print("✓ NO BLACK-BOX AI - Full transparency")
        else:
            print(f"\n⚠️ {total - passed} test(s) failed - review above")
        
        print("\n" + "=" * 60)
        
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
