# API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
*Not implemented in hackathon scope*

---

## Ingestion APIs

### POST /ingest/environment
Ingest environmental data

**Request Body:**
```json
{
  "city": "City A",
  "timestamp": "2026-01-17T10:00:00Z",
  "source": "sensor-network-01",
  "aqi": 85.5,
  "pm25": 35.2,
  "temperature": 28.5,
  "rainfall": 0.0
}
```

### POST /ingest/services
Ingest public service data

### POST /ingest/traffic
Ingest traffic data

---

## Analytics APIs

### GET /forecast/{city}
Get 7-day forecast for a city

### GET /anomalies/{city}
Get detected anomalies

### GET /risk/{city}
Get risk score

---

## 🌟 Scenario Engine API

### POST /scenario/simulate
**The centerpiece feature - What-if policy simulation**

**Request Body:**
```json
{
  "city": "City A",
  "zone": "A",
  "timeWindow": "08:00-11:00",
  "trafficDensityChange": -20.0,
  "heavyVehicleRestriction": true,
  "baselineAQI": 95.0
}
```

**Response:**
```json
{
  "impacts": [
    {
      "metric": "AQI / PM2.5",
      "direction": "decrease",
      "magnitude": 13.0,
      "confidence": 0.75,
      "explanation": "Based on historical congestion-AQI correlation"
    }
  ],
  "overallConfidence": 0.72,
  "explanation": "Predictions based on 12-month historical correlation analysis",
  "timestamp": "2026-01-17T10:00:00Z"
}
```

### GET /scenario/explain
Get explanation of scenario model assumptions

---

## Alert APIs

### GET /alerts/public
Get public alerts

### GET /alerts/internal
Get internal alerts (for officials)

### GET /alerts/history/{city}
Get alert history

---

## System Trust APIs

### GET /system/health
Get system health status

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "api": "healthy",
    "database": "healthy",
    "analytics": "healthy"
  },
  "dataPipeline": {
    "environment": "healthy",
    "services": "healthy",
    "traffic": "healthy"
  }
}
```

### GET /system/freshness
Get data freshness report

### GET /system/audit/{city}
Get audit trail for a city

---

## Citizen Interaction APIs

### POST /citizen/data-request
Submit data access request

### POST /citizen/update-request
Submit data correction suggestion

### GET /citizen/request-status/{id}
Check request status

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error type",
  "details": "Detailed error message"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
