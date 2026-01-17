# Scenario Engine Guide

## Overview

The **What-If Scenario Engine** is the centerpiece feature of the Urban Intelligence Platform. It allows municipal planners to test policy decisions before implementation.

## Philosophy

This is **NOT**:
- A physics simulator
- A traffic micro-model
- A GIS engine

This **IS**:
- A correlation-based impact estimator
- An explainable decision support tool
- A policy testing framework

## How It Works

### 1. Historical Data Foundation
The engine uses 12 months of historical data to learn correlations between:
- Traffic density ↔ Air quality (AQI)
- Heavy vehicle presence ↔ PM2.5 levels
- Congestion ↔ Service delivery times

### 2. Coefficient-Based Predictions
Simple, transparent coefficients drive predictions:
```python
TRAFFIC_AQI_COEFFICIENT = 0.65
# Meaning: 10% traffic reduction → ~6.5% AQI improvement
```

### 3. Multi-Impact Analysis
Every scenario predicts multiple impacts:
- Environmental (AQI, PM2.5)
- Health (Respiratory risk)
- Economic (Logistics delays)
- Service (Delivery efficiency)

## Example Scenarios

### Scenario 1: Heavy Vehicle Restriction
**Input:**
```json
{
  "city": "City A",
  "zone": "B",
  "timeWindow": "08:00-11:00",
  "trafficDensityChange": -15,
  "heavyVehicleRestriction": true,
  "baselineAQI": 110
}
```

**Output:**
- ↓ Traffic congestion: 15%
- ↓ PM2.5: 8%
- ↓ Respiratory risk: 10%
- ↑ Logistics delay: 7%

### Scenario 2: Zone-Based Traffic Reduction
**Input:**
```json
{
  "city": "City A",
  "zone": "A",
  "timeWindow": "06:00-09:00",
  "trafficDensityChange": -25,
  "heavyVehicleRestriction": false,
  "baselineAQI": 95
}
```

**Output:**
- ↓ Congestion: 25%
- ↓ AQI: 16%
- ↓ Commute time variability: 12%

## Confidence Levels

Each prediction includes a confidence score (0-1):
- **0.8-1.0**: High confidence (strong historical correlation)
- **0.6-0.8**: Medium confidence (moderate correlation)
- **0.4-0.6**: Low confidence (weak or limited data)

## Explainability

Every prediction includes:
1. **Metric being predicted**
2. **Direction of change** (increase/decrease)
3. **Magnitude** (percentage)
4. **Confidence level**
5. **Plain English explanation**

Example:
> "Based on historical congestion-AQI correlation (r=0.65) observed over 12 months. Heavy vehicles contribute approximately 30% of urban PM2.5 emissions in this zone."

## Limitations

The engine explicitly communicates:
- Does not model weather impacts
- Assumes typical traffic patterns
- Zone boundaries are simplified
- Based on historical patterns (may not predict unprecedented events)

## Use Cases

### For Municipal Planners
- Compare multiple policy options
- Estimate tradeoffs before implementation
- Justify decisions with data
- Communicate impacts to stakeholders

### For Citizens (via simplified interface)
- Understand proposed policy impacts
- See expected air quality improvements
- Learn about tradeoffs

## Future Enhancements

Potential improvements (post-hackathon):
- Weather integration
- Real-time traffic API integration
- More granular zone modeling
- Multi-city scenario comparison
- Long-term impact projection (30+ days)

---

**Remember:** The goal is not perfect prediction, but **informed decision-making**.
