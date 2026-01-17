# 🏙️ Urban Intelligence Platform

> **"This system predicts problems early."**

A state-level Urban Intelligence Platform for **early risk prediction and decision support** in urban systems, built for trustworthy and scalable digital operations.

## 🎯 Project Overview

This platform enables municipal data officers to:
- **Predict** environmental and service risks up to 7 days in advance
- **Test** policy decisions through what-if scenario analysis
- **Monitor** system health and data freshness
- **Alert** citizens and officials proactively

### Core Domains
- **Environment**: AQI, PM2.5, temperature, rainfall
- **Public Services**: Water supply stress, waste collection, outages
- **Traffic**: Congestion, density, heavy vehicle movement (as causal layer)

---

## 🏗️ Architecture

### Style
**Modular Monolith** - Service-oriented modules without microservice overhead

### Tech Stack

#### Backend
- **FastAPI** (Python)
- **PostgreSQL** + **Prisma ORM**
- Pandas, NumPy, scikit-learn for analytics

#### Frontend
- **Next.js**
- Chart.js / Recharts
- Simple city-level visualization

---

## 📁 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry
│   │   ├── config.py               # Configuration management
│   │   ├── database.py             # Database connection
│   │   │
│   │   ├── models/                 # Prisma models (generated)
│   │   │
│   │   ├── modules/
│   │   │   ├── cdo/                # Central Data Office layer
│   │   │   │   ├── validator.py
│   │   │   │   ├── standardizer.py
│   │   │   │   └── freshness.py
│   │   │   │
│   │   │   ├── ingestion/          # Data ingestion
│   │   │   │   ├── environment.py
│   │   │   │   ├── services.py
│   │   │   │   └── traffic.py
│   │   │   │
│   │   │   ├── analytics/          # ML & forecasting
│   │   │   │   ├── forecaster.py
│   │   │   │   ├── anomaly.py
│   │   │   │   └── risk.py
│   │   │   │
│   │   │   ├── scenario/           # What-if engine (CENTERPIECE)
│   │   │   │   ├── engine.py
│   │   │   │   └── explainer.py
│   │   │   │
│   │   │   ├── alerts/             # Alert management
│   │   │   │   ├── generator.py
│   │   │   │   └── router.py
│   │   │   │
│   │   │   └── trust/              # System health & trust
│   │   │       ├── health.py
│   │   │       └── audit.py
│   │   │
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── ingest.py       # Ingestion endpoints
│   │   │       ├── metrics.py      # Metrics endpoints
│   │   │       ├── analytics.py    # Forecast/anomaly/risk
│   │   │       ├── scenario.py     # Scenario simulation
│   │   │       ├── alerts.py       # Alert endpoints
│   │   │       ├── citizen.py      # Citizen interaction
│   │   │       └── system.py       # System health/trust
│   │   │
│   │   └── schemas/                # Pydantic schemas
│   │       ├── ingestion.py
│   │       ├── analytics.py
│   │       ├── scenario.py
│   │       └── common.py
│   │
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   │
│   ├── tests/
│   │   ├── test_ingestion.py
│   │   ├── test_analytics.py
│   │   └── test_scenario.py
│   │
│   ├── requirements.txt
│   └── pyproject.toml
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Landing
│   │   ├── municipal/              # Municipal dashboard
│   │   │   └── page.tsx
│   │   └── citizen/                # Citizen portal
│   │       └── page.tsx
│   │
│   ├── components/
│   │   ├── charts/
│   │   │   ├── ForecastChart.tsx
│   │   │   └── RiskIndicator.tsx
│   │   ├── alerts/
│   │   │   └── AlertCard.tsx
│   │   └── trust/
│   │       ├── FreshnessIndicator.tsx
│   │       └── SystemHealth.tsx
│   │
│   ├── lib/
│   │   └── api.ts                  # API client
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── docs/
│   ├── API.md                      # API documentation
│   ├── SCENARIOS.md                # Scenario engine guide
│   └── DEPLOYMENT.md               # Deployment guide
│
├── scripts/
│   ├── seed_data.py                # Sample data generator
│   └── simulate_sensors.py         # Sensor simulation
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 14+**

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Harsh15505/C3E1xIngenious-7.0.git
cd C3E1xIngenious-7.0
```

### 2️⃣ Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE urban_intelligence;
\q
```

### 3️⃣ Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
copy .env.example .env
# Edit .env and set your DATABASE_URL

# Generate Prisma client
prisma generate

# Run database migrations
prisma migrate dev --name init

# Seed initial data (Ahmedabad and Gandhinagar + data sources)
python ../scripts/seed_data.py

# Start FastAPI server (includes scheduler)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend runs at:** `http://localhost:8000`  
**API docs at:** `http://localhost:8000/docs`  
**Health check:** `http://localhost:8000/health`  
**Scheduler status:** `http://localhost:8000/scheduler/status`

### 4️⃣ Optional: Run Sensor Simulator

Open a **new terminal** to simulate push-style data ingestion:

```bash
# Continuous simulation (pushes data every 30 seconds)
python scripts/simulate_sensors.py

# OR push single batch for testing
python scripts/simulate_sensors.py once
```

This simulates IoT sensors pushing data to the API (push-style ingestion).

### 5️⃣ Frontend Setup

Open a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Run development server
npm run dev
```

**Frontend runs at:** `http://localhost:3000`

### 6️⃣ Verify Installation

```bash
# Test API health
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","service":"api","scheduler":"running"}

# Check scheduler jobs
curl http://localhost:8000/scheduler/status
```

---

## 🔧 Environment Variables

### Backend (.env)

```bash
# Database Connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/urban_intelligence"

# API Configuration (optional)
API_V1_PREFIX="/api/v1"
PROJECT_NAME="Urban Intelligence Platform"

# Data Freshness Thresholds (minutes)
FRESHNESS_THRESHOLD_CRITICAL=60
FRESHNESS_THRESHOLD_WARNING=30

# Forecasting
FORECAST_DAYS=7

# Risk Thresholds
RISK_THRESHOLD_HIGH=0.7
RISK_THRESHOLD_MEDIUM=0.4
```

### Frontend (.env.local)

```bash
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## �️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **PostgreSQL** - Robust relational database
- **Prisma ORM** - Type-safe database client with migrations
- **APScheduler** - Advanced Python scheduler for cron jobs
- **Pydantic** - Data validation and settings management
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **scikit-learn** - Machine learning library (lightweight models only)

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Chart.js / Recharts** - Data visualization
- **React** - UI component library

### Infrastructure
- **Python 3.11+** - Modern Python runtime
- **Node.js 18+** - JavaScript runtime
- **Uvicorn** - ASGI server for FastAPI
- **PostgreSQL 14+** - Database server

### Development Tools
- **Prisma CLI** - Database migrations and schema management
- **pytest** - Testing framework
- **ESLint** - Code linting for frontend

---

## 🧪 Error Handling & Resilience

### Data Validation
```python
# All incoming data is validated before storage
- Schema validation using Pydantic models
- Range checks (e.g., AQI 0-500, PM2.5 >= 0)
- Timestamp validation
- Source verification
```

### Graceful Degradation
```python
# System continues operating despite failures
- Last-known-good values used when data is stale
- Explicit staleness indicators shown to users
- Partial data scenarios handled gracefully
- Database connection retry logic
```

### Error Responses
```json
// API returns structured error responses
{
  "error": "ValidationError",
  "details": "AQI value must be between 0 and 500",
  "timestamp": "2026-01-17T10:30:00Z"
}
```

### Logging & Monitoring
```python
# Comprehensive audit trail
- All ingestion events logged
- Analytics runs tracked
- Scenario simulations recorded
- System health events captured
- Failed operations logged with context
```

### Fault Tolerance Features
- ✅ **Data source offline detection** - Automatic marking of failed sources
- ✅ **Stale data warnings** - Visual indicators when data is old
- ✅ **Partial result handling** - System works with available data
- ✅ **Database connection pooling** - Efficient connection management
- ✅ **API timeout handling** - Prevents hanging requests
- ✅ **Validation error recovery** - Bad data rejected, good data processed

---

## 🔐 Security & Credentials

**⚠️ NO SECRETS IN REPOSITORY**

- ✅ All sensitive data is stored in `.env` files (gitignored)
- ✅ `.env.example` files contain only placeholder values
- ✅ Database credentials must be configured locally
- ✅ No API keys, passwords, or tokens are committed

**Test/Demo Credentials:**
- This is a hackathon demo - no authentication implemented
- For production deployment, integrate proper auth (OAuth2/JWT)
- Municipal dashboard: Open access for demo
- Citizen portal: Open access for demo

---

---

## 🎯 Core Features

### ✅ Data Ingestion (Mixed Model)

**Push-Style (Real-time):**
- IoT sensors push data directly to API endpoints
- Immediate validation and processing
- Real-time data availability for dashboards

**Pull-Style (Scheduled via CronJobs):**
- **Every 15 min:** Environment data (AQI, weather) from external APIs
- **Every 30 min:** Traffic & service data from city systems
- **Every 1 hour:** Run forecasting models
- **Every 2 hours:** Anomaly detection
- **Every 6 hours:** Risk score calculation
- **Every 5 min:** System health checks

Built with **APScheduler** for reliable background task execution.

### ✅ Data Governance
- **Central Data Office (CDO) validation layer** - Validates all incoming data
- **Schema validation** - Ensures data quality and consistency
- **Data freshness tracking** - Monitors data staleness in real-time
- **Last-known-good fallback** - Graceful degradation when data is unavailable
- **Error handling** - Comprehensive error tracking and logging
- **Fault tolerance** - System continues operating despite source failures

### ✅ Analytics & ML
- **7-day forecasting** for AQI, water stress, and service metrics
- **Pattern anomaly detection** using statistical methods (z-score, IQR)
- **Risk scoring per city** with weighted components
- **Lightweight, explainable models** - No black-box predictions
- **Confidence intervals** for all predictions
- **Trend analysis** for early warning

### ✅ What-If Scenario Engine (CENTERPIECE) 🌟
Test policy decisions before implementation:
- **Traffic restriction scenarios** - See impact before implementing
- **Heavy vehicle zone policies** - Evaluate air quality improvements
- **Time-window restrictions** - Optimize intervention timing
- **Immediate impact estimates** with confidence levels
- **Multi-metric predictions** - Traffic, AQI, logistics, health
- **Explainable results** - Every prediction includes reasoning
- **Historical correlation-based** - Uses real city data patterns

**Example Scenario:**
```
Input: "Restrict heavy vehicles in Zone A, 8-11 AM"
Output:
  ↓ Traffic congestion: 18%
  ↓ PM2.5/AQI: 12%
  ↓ Respiratory risk: 15%
  ↑ Logistics delay: 8%
  Confidence: 72%
```

### ✅ Alert System
- **Forecast-based alerts** - Proactive warnings before issues occur
- **Anomaly-based alerts** - Real-time detection of unusual patterns
- **System health alerts** - Data source failures and staleness
- **Dual audience** - Internal (officials) + Public (citizens)
- **Severity levels** - Info, Warning, Critical
- **Auto-resolution tracking** - Alert lifecycle management

### ✅ Trust & Transparency
- **Data freshness indicators** - Always visible, never hidden
- **System health monitoring** - Real-time service status
- **Explainability** - Every prediction shows reasoning
- **Citizen data request workflow** - Public can request data access
- **Audit trail** - Complete history of all operations
- **Data lineage** - Track data from source to prediction
- **No silent failures** - All errors are logged and visible

---

## 📡 API Overview

### Ingestion Endpoints
```
POST /api/v1/ingest/environment
POST /api/v1/ingest/services
POST /api/v1/ingest/traffic
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ingest/environment \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Bangalore",
    "aqi": 95.5,
    "pm25": 45.2,
    "temperature": 28.5,
    "timestamp": "2026-01-17T10:30:00Z",
    "source": "sensor-network-01"
  }'
```

### Metrics
```
GET /api/v1/metrics/latest/{city}
GET /api/v1/metrics/history/{city}
```

### Analytics
```
GET /api/v1/forecast/{city}
GET /api/v1/anomalies/{city}
GET /api/v1/risk/{city}
```

### Scenario Engine 🌟
```
POST /api/v1/scenario/simulate
GET  /api/v1/scenario/explain
POST /api/v1/scenario/save
GET  /api/v1/scenario/history/{city}
```

**Example Scenario Request:**
```bash
curl -X POST http://localhost:8000/api/v1/scenario/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Bangalore",
    "zone": "A",
    "timeWindow": "08:00-11:00",
    "trafficDensityChange": -15,
    "heavyVehicleRestriction": true,
    "baselineAQI": 120
  }'
```

### Alerts
```
GET /api/v1/alerts/public
GET /api/v1/alerts/internal
GET /api/v1/alerts/history/{city}
```

### Citizen Interaction
```
POST /api/v1/citizen/data-request
POST /api/v1/citizen/update-request
GET  /api/v1/citizen/request-status/{id}
```

### System Trust
```
GET /api/v1/system/health
GET /api/v1/system/freshness
GET /api/v1/system/audit/{city}
```

**Interactive API Documentation:** `http://localhost:8000/docs`

Full API documentation: [docs/API.md](docs/API.md)

---

## 🎪 Demo Scenarios

### Scenario 1: Heavy Vehicle Restriction
**Input**: Restrict heavy vehicles in Zone A, 8–11 AM  
**Output**:
- ↓ Traffic congestion: 18%
- ↓ PM2.5/AQI: 12%
- ↓ Respiratory risk: 15%
- ↑ Logistics delay: 8%

### Scenario 2: Early Morning Street Cleaning
**Input**: Increase waste collection frequency  
**Output**:
- ↓ Public health complaints: 25%
- ↑ Water usage: 10%
- ↑ Operational cost: 15%

---

## 🎯 Design Principles

1. **Predict Early**: Focus on forecasting, not just reporting
2. **Explainable**: Every prediction includes reasoning
3. **Trustworthy**: Data freshness and system health always visible
4. **Decision-Focused**: What-if scenarios drive action
5. **Citizen-Centered**: Public transparency and participation

---

## 🔒 Trust Pillars

- **Data Freshness**: Explicit staleness tracking
- **Fault Tolerance**: Graceful degradation
- **Explainability**: No black-box predictions
- **No Silent Failures**: System alerts for data delays

---

## 📊 Non-Goals

❌ Complex ML training pipelines  
❌ Vehicle-level traffic simulation  
❌ Heavy GIS/road-network modeling  
❌ Mobile applications  
❌ Production-grade authentication (for hackathon scope)

---

## 👥 Team

**Team C3E1**

### Members:
- **Ayaan Goel**
- **Harsh Bhavsar**
- **Nishu Shukla**
- **Nihar Prajapati**

---

**Remember**: *"This system predicts problems early."*
