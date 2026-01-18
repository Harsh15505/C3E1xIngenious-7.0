# Urban Intelligence Platform - Project Handoff Document

**Last Updated:** January 18, 2026  
**Backend:** Running on port 8001  
**Frontend:** Running on port 3001  
**Status:** Citizen AI 90% complete, Admin AI pending

---

## 🎯 Problem Statement

### Core Challenge
Indian cities lack real-time, integrated environmental monitoring and AI-powered decision support for both citizens and municipal administrators. Current systems are fragmented, non-predictive, and lack natural language interfaces.

### Target Users
1. **Citizens:** Need simple, conversational access to air quality, traffic, and safety data
2. **Municipal Admins:** Need AI-driven scenario recommendations for urban planning decisions

### Critical Requirements
- **Safety-First AI:** No hallucinations, strictly domain-restricted (air quality, traffic, alerts only)
- **Deterministic:** Keyword-based intent detection, no probabilistic routing
- **Explainable:** Every AI response must cite data sources and show confidence scores
- **Real-time:** Data freshness tracking, automated ingestion from sensors
- **Multi-tenant:** Separate dashboards for citizens vs admins with RBAC

---

## 🏗️ Architecture Overview

### Tech Stack
- **Backend:** FastAPI (Python 3.12), Tortoise ORM, PostgreSQL (Aiven), APScheduler, GROQ API
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, WebSocket
- **AI Model:** llama-3.3-70b-versatile (via GROQ, temperature=0.3)
- **Auth:** JWT tokens (24-hour expiry), bcrypt password hashing

### Key Components
```
backend/
├── app/
│   ├── models.py              # Tortoise ORM models (City, EnvironmentData, etc.)
│   ├── modules/ai/
│   │   └── citizen_ai.py      # Natural language query system (410 lines)
│   ├── api/v1/
│   │   ├── ai.py              # AI endpoints (POST /query, GET /query-logs)
│   │   ├── auth.py            # Login, register, token management
│   │   ├── analytics.py       # City-specific analytics
│   │   └── system.py          # Metadata, health checks
│   └── config.py              # Settings (GROQ_API_KEY, DB credentials)

frontend/
├── components/
│   ├── AIChatPanel.tsx        # Collapsible AI chat interface (280 lines)
│   └── ProtectedRoute.tsx     # Auth guard for private pages
├── app/
│   ├── citizen/dashboard/     # Citizen analytics dashboard
│   └── municipal/             # Admin scenario planning UI
└── lib/api.ts                 # API client with auth headers
```

---

## ✅ Implemented Features

### 1. Citizen AI Query System (90% Complete)
**Location:** `backend/app/modules/ai/citizen_ai.py`

#### Intent Detection (Keyword-Based)
```python
INTENT_KEYWORDS = {
    "RISK": ["risk", "danger", "safe", "threat", "hazard"],
    "AIR": ["air", "aqi", "pollution", "pm2.5", "smog"],
    "TRAFFIC": ["traffic", "congestion", "vehicles", "road"],
    "ALERT": ["alert", "warning", "emergency"],
    "GENERAL": ["city", "status", "data", "current"]
}
```

#### Domain Validation
- **Allowed:** Air quality, traffic, alerts, risk, weather, city conditions
- **Blocked:** Politics, coding, jokes, personal questions, general knowledge
- Returns rejection message if query is out-of-domain

#### Data Fetching Functions
- `get_latest_environment(city)`: Fetches AQI, PM2.5, temperature, rainfall
- `get_latest_traffic(city)`: Fetches zone-wise congestion levels
- `get_active_alerts(city)`: Fetches active city warnings

#### GROQ Integration
- System prompt enforces strict domain boundaries
- User prompt includes city context + detected intent
- Temperature: 0.3 (factual responses)
- Max tokens: 200 (concise answers)
- Confidence scoring based on data availability

### 2. Frontend Integration
**Location:** `frontend/components/AIChatPanel.tsx`

- Collapsible chat panel with city selector
- Message history with intent badges (🌫️ AIR, 🚗 TRAFFIC, ⚠️ ALERT)
- Confidence indicators (High/Medium/Low)
- Dark mode support
- Integrated into citizen dashboard at line 537

### 3. Authentication System
- JWT-based auth with bcrypt password hashing
- Role-based access: `citizen`, `municipal`, `admin`
- Protected routes for citizen/municipal dashboards
- Test accounts:
  - Citizen: `citizen@test.com` / `test123`
  - Admin: `admin@test.com` / `admin123`

### 4. Data Ingestion & Storage
- PostgreSQL database on Aiven (SSL enabled)
- Tortoise ORM with auto-schema generation
- APScheduler for periodic data fetching
- Models: City, EnvironmentData, TrafficData, Alert, AIQueryLog

### 5. Dark Mode
- Class-based dark mode with Tailwind
- Persists in localStorage
- Applied across all components

---

## 🐛 Known Errors (CRITICAL)

### ERROR #1: AI Query Returns "Data not available" ⚠️
**Symptom:** AI chat panel shows "Data not available for Ahmedabad" despite database having 24 environment records.

**Root Cause Identified:**
1. ~~Model `llama-3.1-70b-versatile` was decommissioned~~ ✅ FIXED (switched to `llama-3.3-70b-versatile`)
2. **CURRENT ISSUE:** `get_latest_environment()` tries to return fields that don't exist in EnvironmentData model

**Evidence:**
```python
# citizen_ai.py tries to return these fields:
return {
    "pm10": env_data.pm10,        # ❌ Field doesn't exist
    "humidity": env_data.humidity, # ❌ Field doesn't exist
    "wind_speed": env_data.wind_speed # ❌ Field doesn't exist
}

# But EnvironmentData model only has:
class EnvironmentData(Model):
    aqi = fields.FloatField(null=True)
    pm25 = fields.FloatField(null=True)
    temperature = fields.FloatField(null=True)
    rainfall = fields.FloatField(null=True)
    # Missing: pm10, humidity, wind_speed
```

**Fix Applied (needs testing):**
- Updated `get_latest_environment()` to only return existing fields (line 110-125)
- Removed `is_validated=True` filter that was excluding sample data (line 114)
- Backend needs restart with `uvicorn app.main:app --reload --port 8001`

**Test Command:**
```powershell
$body = @{query='What is the air quality in Ahmedabad?';city_id='e61c1dc6-3e80-4eef-ab0f-f625207ca41f'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:8001/api/v1/ai/query' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

**Expected Response:**
```json
{
  "success": true,
  "response": "The air quality in Ahmedabad is moderate with AQI of 150 and PM2.5 at 38.52 µg/m³...",
  "intent": "AIR",
  "confidence": 0.85,
  "data_sources": ["environment"],
  "city_name": "Ahmedabad"
}
```

---

## 📋 TODO List

### Priority 1: Fix Citizen AI (BLOCKING)
- [ ] **Restart backend** to apply field mismatch fix
- [ ] **Test AI query** with test command above
- [ ] **Verify data retrieval** - `data_sources` array should not be empty
- [ ] **Check confidence scores** - should be 0.7-1.0 when data exists
- [ ] **Test edge cases:** Invalid city, no data available, out-of-domain queries

### Priority 2: Admin AI System (NOT STARTED)
**Requirement:** AI-powered scenario recommendations for municipal decision-makers

**Planned Implementation:**
```python
# backend/app/modules/ai/admin_ai.py
async def generate_scenario_recommendations(
    city: City, 
    scenario_type: str  # "traffic", "pollution", "emergency"
) -> Dict:
    """
    Analyze city data and generate 3-5 actionable recommendations
    Example: "Deploy 2 additional traffic units to Zone A"
    """
    # 1. Fetch relevant data (past 24 hours)
    # 2. Calculate severity metrics
    # 3. Use GROQ to generate recommendations with constraints:
    #    - Max 5 recommendations
    #    - Each must cite data source
    #    - Must be actionable (not generic advice)
    # 4. Return with confidence scores
```

**Frontend Integration:**
- Location: `frontend/app/municipal/scenario/page.tsx`
- Add "AI Recommendations" card
- Show recommendations with severity badges
- Allow admins to mark as "implemented" or "dismissed"

### Priority 3: Testing & Validation
- [ ] End-to-end citizen query flow (5 test queries per city)
- [ ] Admin AI recommendations accuracy
- [ ] Load testing (100 concurrent AI queries)
- [ ] Security audit (SQL injection, XSS, auth bypass)

### Priority 4: Production Readiness
- [ ] Add rate limiting (10 queries/minute per user)
- [ ] Implement query caching (Redis)
- [ ] Setup logging (structured JSON logs)
- [ ] Add monitoring (Prometheus + Grafana)
- [ ] Database backups (daily snapshots)

---

## 📚 API Documentation

### Base URL
```
http://localhost:8001/api/v1
```

### Authentication
All endpoints except `/auth/login` and `/auth/register` require JWT token:
```bash
Authorization: Bearer <jwt_token>
```

---

### AI Endpoints

#### 1. Send AI Query
```http
POST /ai/query
Content-Type: application/json

{
  "query": "What is the air quality in Ahmedabad today?",
  "city_id": "e61c1dc6-3e80-4eef-ab0f-f625207ca41f"
}
```

**Response (Success):**
```json
{
  "success": true,
  "response": "The air quality in Ahmedabad is moderate with AQI of 150...",
  "intent": "AIR",
  "is_valid_domain": true,
  "confidence": 0.85,
  "data_sources": ["environment"],
  "response_time_ms": 750,
  "city_name": "Ahmedabad"
}
```

**Response (Invalid Domain):**
```json
{
  "success": false,
  "response": "I can only answer questions about city air quality, traffic, alerts, and safety.",
  "intent": "INVALID",
  "is_valid_domain": false,
  "rejection_reason": "Query about 'politics' is not allowed"
}
```

#### 2. Get Query Logs
```http
GET /ai/query-logs?limit=50&query_type=citizen
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "user_email": "citizen@test.com",
      "city_name": "Ahmedabad",
      "query_text": "What is the air quality?",
      "query_type": "citizen",
      "detected_intent": "AIR",
      "is_valid_domain": true,
      "ai_response": "The air quality is moderate...",
      "confidence_score": 0.85,
      "data_sources": ["environment"],
      "response_time_ms": 750,
      "model_used": "llama-3.3-70b-versatile",
      "created_at": "2026-01-18T05:30:00Z"
    }
  ],
  "total": 42
}
```

---

### Auth Endpoints

#### 1. Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe",
  "role": "citizen"
}
```

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "citizen@test.com",
  "password": "test123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "citizen@test.com",
    "full_name": "Test Citizen",
    "role": "citizen"
  }
}
```

---

### Analytics Endpoints

#### 1. Get City Analytics
```http
GET /analytics/{city_id}?days=7
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "city_name": "Ahmedabad",
  "date_range": {
    "start": "2026-01-11T00:00:00Z",
    "end": "2026-01-18T00:00:00Z"
  },
  "environment": {
    "avg_aqi": 145.2,
    "max_aqi": 180,
    "aqi_trend": "increasing",
    "data_points": 168
  },
  "traffic": {
    "avg_congestion": 65.3,
    "peak_hours": ["08:00-10:00", "18:00-20:00"],
    "high_density_zones": ["A", "C"]
  },
  "alerts": {
    "total_active": 3,
    "critical": 1,
    "warning": 2
  }
}
```

---

### System Endpoints

#### 1. Get Metadata
```http
GET /system/metadata
```

**Response:**
```json
{
  "cities": [
    {
      "id": "e61c1dc6-3e80-4eef-ab0f-f625207ca41f",
      "name": "Ahmedabad",
      "state": "Gujarat",
      "population": 8450000
    }
  ],
  "data_sources": [
    {
      "name": "OpenWeather",
      "type": "weather",
      "update_frequency": "hourly"
    }
  ]
}
```

#### 2. Health Check
```http
GET /system/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "api",
  "scheduler": "running",
  "database": "healthy",
  "uptime_seconds": 3600
}
```

---

## 🗄️ Database Schema

### Core Models

#### City
```python
class City(Model):
    id = UUIDField(pk=True)
    name = CharField(max_length=100)
    state = CharField(max_length=100)
    country = CharField(max_length=100, default="India")
    population = IntField()
    area_sqkm = FloatField(null=True)
    latitude = FloatField(null=True)
    longitude = FloatField(null=True)
    created_at = DatetimeField(auto_now_add=True)
```

#### EnvironmentData
```python
class EnvironmentData(Model):
    id = UUIDField(pk=True)
    city = ForeignKeyField("models.City", related_name="environment_data")
    aqi = FloatField(null=True)
    pm25 = FloatField(null=True)
    temperature = FloatField(null=True)
    rainfall = FloatField(null=True)
    timestamp = DatetimeField()
    source = CharField(max_length=200)
    is_validated = BooleanField(default=False)
    is_fresh = BooleanField(default=True)
    created_at = DatetimeField(auto_now_add=True)
```

#### TrafficData
```python
class TrafficData(Model):
    id = UUIDField(pk=True)
    city = ForeignKeyField("models.City", related_name="traffic_data")
    zone = CharField(max_length=10)  # A, B, C
    density_percent = FloatField()  # 0-100
    congestion_level = CharField(max_length=20)  # low, medium, high
    heavy_vehicle_count = IntField(null=True)
    avg_speed = FloatField(null=True)  # km/h
    timestamp = DatetimeField()
    source = CharField(max_length=200)
    created_at = DatetimeField(auto_now_add=True)
```

#### Alert
```python
class Alert(Model):
    id = UUIDField(pk=True)
    city = ForeignKeyField("models.City", related_name="alerts")
    title = CharField(max_length=200)
    message = TextField()
    severity = CharField(max_length=20)  # critical, high, medium, low
    category = CharField(max_length=50)  # traffic, pollution, weather
    is_active = BooleanField(default=True)
    source = CharField(max_length=200)
    created_at = DatetimeField(auto_now_add=True)
```

#### AIQueryLog
```python
class AIQueryLog(Model):
    id = UUIDField(pk=True)
    user = ForeignKeyField("models.User", related_name="ai_queries", null=True)
    city = ForeignKeyField("models.City", related_name="ai_queries")
    query_text = TextField()
    query_type = CharField(max_length=20)  # citizen, admin
    detected_intent = CharField(max_length=20)  # AIR, TRAFFIC, ALERT, RISK, GENERAL, INVALID
    is_valid_domain = BooleanField()
    ai_response = TextField()
    confidence_score = FloatField()  # 0.0-1.0
    data_sources = JSONField()  # ["environment", "traffic", "alerts"]
    response_time_ms = IntField()
    model_used = CharField(max_length=100)
    created_at = DatetimeField(auto_now_add=True)
```

---

## 🔑 Environment Variables

### Backend (.env)
```bash
# Database (Aiven PostgreSQL)
DATABASE_URL=postgres://avnadmin:<password>@urban-intelligence-db.aivencloud.com:12345/defaultdb?sslmode=require

# GROQ API
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.3-70b-versatile

# JWT Secret
SECRET_KEY=your-secret-key-change-in-production
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8001
```

---

## 🚀 Running the Project

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Test Credentials
- **Citizen:** citizen@test.com / test123
- **Admin:** admin@test.com / admin123

### Test Cities
- **Ahmedabad:** `e61c1dc6-3e80-4eef-ab0f-f625207ca41f`
- **Gandhinagar:** `c22d5fdd-9a1a-4487-84f8-8211a33f9544`
- **Vadodara:** `c3ce5f32-e34a-44ff-a416-7fc9551591f2`

---

## 🔍 Debugging Tips

### Check Backend Health
```bash
curl http://localhost:8001/api/v1/system/health
```

### Check Database Connection
```bash
curl http://localhost:8001/api/v1/system/metadata
```

### Test AI Query (PowerShell)
```powershell
$body = @{query='What is the air quality?';city_id='e61c1dc6-3e80-4eef-ab0f-f625207ca41f'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:8001/api/v1/ai/query' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

### Check Environment Data
```bash
curl "http://localhost:8001/api/v1/analytics/e61c1dc6-3e80-4eef-ab0f-f625207ca41f?days=1"
```

---

## 📝 Notes for Next Agent

1. **PRIORITY:** Fix the AI query bug first - the field mismatch in `get_latest_environment()` is causing all queries to fail
2. **Backend auto-reloads** with `--reload` flag, but sometimes needs manual restart for model changes
3. **GROQ API key is valid** - tested with llama-3.3-70b-versatile model
4. **Sample data exists** - 24 environment records for Ahmedabad with AQI=150
5. **Admin AI is completely unimplemented** - start from scratch using citizen_ai.py as template
6. **Frontend is production-ready** - only needs working backend API
7. **Security audit pending** - no rate limiting or input validation on AI queries
8. **User feedback:** "don't mess what's already working" - be cautious with existing auth/analytics code

---

**End of Handoff Document**
