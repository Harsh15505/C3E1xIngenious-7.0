# 🏙️ Urban Intelligence Platform

> **"This system predicts problems early."**

A state-level Urban Intelligence Platform for **early risk prediction, AI-powered decision support, and citizen engagement** in urban systems, built for trustworthy and scalable digital operations.

## 🌐 Live Demo

**Frontend (Vercel):** [https://c3-e1x-ingenious-7-0-y7f6.vercel.app/login](https://c3-e1x-ingenious-7-0-y7f6.vercel.app/login)  
**Backend API (Railway):** [https://ingeniousxteamc3e1-production.up.railway.app/docs](https://ingeniousxteamc3e1-production.up.railway.app/docs)

**Test Credentials:**
- **Admin:** `admin@ingenious.com` / `admin123`
- **Citizen:** `citizen@ingenious.com` / `citizen123`

## 🎯 Project Overview

This platform enables municipal data officers and citizens to:
- **Predict** environmental and service risks up to 7 days in advance
- **Ask AI** natural language questions about city conditions (air quality, traffic, alerts)
- **Test** policy decisions through what-if scenario analysis
- **Monitor** system health and data freshness in real-time
- **Alert** citizens and officials proactively
- **Participate** through data correction requests and dataset access

### Core Domains
- **Environment**: AQI, PM2.5, temperature, rainfall
- **Public Services**: Water supply stress, waste collection, outages
- **Traffic**: Congestion, density, heavy vehicle movement (as causal layer)
- **AI Intelligence**: Natural language query system with domain validation
- **Citizen Engagement**: Data requests, issue reporting, transparency

---

## 🏗️ Architecture

### Style
**Modular Monolith** - Service-oriented modules without microservice overhead

### Tech Stack

#### Backend
- **FastAPI** - Modern, fast Python web framework
- **PostgreSQL** (Aiven Cloud) - Managed cloud database with SSL
- **Tortoise ORM** - Async ORM for Python (Django-like API)
- **GROQ API** (Llama 3.1 70B) - AI explanations
- **APScheduler** - Advanced Python scheduler for cron jobs
- **Pydantic** - Data validation and settings management
- **Pandas, NumPy, scikit-learn** - Analytics and ML

### Frontend
- **Next.js 14** (TypeScript, App Router) - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Dark Mode** - System-wide theme toggle with persistence
- **React Context API** - State management (Theme, Auth, Toast)
- **Chart.js / Recharts** - Data visualization

### Infrastructure
- **Python 3.12+** - Modern Python runtime
- **Node.js 18+** - JavaScript runtime
- **Uvicorn** - ASGI server for FastAPI
- **Aiven PostgreSQL** - Cloud database with SSL

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
│   │   │   ├── ai/                 # 🌟 AI Intelligence
│   │   │   │   ├── citizen_ai.py   # Natural language query system
│   │   │   │   └── admin_ai.py     # Policy recommendation engine
│   │   │   │
│   │   │   ├── alerts/             # Alert management
│   │   │   │   ├── generator.py
│   │   │   │   └── router.py
│   │   │   │
│   │   │   ├── auth/               # 🌟 Authentication
│   │   │   │   ├── utils.py        # JWT token handling
│   │   │   │   └── middleware.py
│   │   │   │
│   │   │   └── trust/              # System health & trust
│   │   │       ├── health.py
│   │   │       └── audit.py
│   │   │
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── ingest.py       # Ingestion endpoints
│   │   │       ├── analytics.py    # Forecast/anomaly/risk
│   │   │       ├── scenario.py     # Scenario simulation
│   │   │       ├── alerts.py       # Alert endpoints
│   │   │       ├── auth.py         # 🌟 Auth endpoints
│   │   │       ├── ai.py           # 🌟 AI query endpoints
│   │   │       ├── citizen.py      # 🌟 Citizen participation
│   │   │       └── system.py       # System health/trust
│   │   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── ingestion.py
│   │   ├── analytics.py
│   │   ├── auth.py
│   │   ├── citizen.py
│   │   ├── scenario.py
│   │   └── common.py
│   │
│   ├── tests/
│   │   ├── test_ingestion.py
│   │   ├── test_analytics.py
│   │   └── test_scenario.py
│   │
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   │
│   │   ├── login/                  # 🌟 Authentication
│   │   │   └── page.tsx
│   │   ├── signup/                 # 🌟 Registration
│   │   │   └── page.tsx
│   │   │
│   │   ├── municipal/              # 🌟 Admin Panel
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── scenario/
│   │   │   │   └── page.tsx
│   │   │   ├── system-health/
│   │   │   │   └── page.tsx
│   │   │   ├── alerts/
│   │   │   │   └── page.tsx
│   │   │   └── requests/           # 🌟 Citizen requests management
│   │   │       └── page.tsx
│   │   │
│   │   └── citizen/                # Citizen portal
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── alerts/
│   │       │   └── page.tsx
│   │       ├── simulator/
│   │       │   └── page.tsx
│   │       ├── report-issue/       # 🌟 Data correction
│   │       │   └── page.tsx
│   │       └── dataset-request/    # 🌟 Data access request
│   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── Header.tsx              # Navigation with auth & theme
│   │   ├── ProtectedRoute.tsx      # 🌟 Auth guard
│   │   ├── AIChatPanel.tsx         # 🌟 AI query interface
│   │   └── charts/
│   │       ├── EnvironmentChart.tsx
│   │       ├── TrafficChart.tsx
│   │       └── RiskTrendChart.tsx
│   │
│   ├── contexts/
│   │   ├── ThemeContext.tsx        # 🌟 Dark mode
│   │   ├── ToastContext.tsx        # 🌟 Notifications
│   │   └── AuthContext.tsx         # 🌟 Auth state
│   │
│   ├── lib/
│   │   ├── api.ts                  # API client
│   │   └── auth.ts                 # 🌟 Auth utilities
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
- **Python 3.12+**
- **Node.js 18+**
- **PostgreSQL 14+** (or use Aiven Cloud)

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

# Initialize database (creates tables automatically on first run)
# Tables are auto-created when server starts

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

# External API Keys
OPENWEATHER_API_KEY=your_openweather_api_key
AQICN_API_KEY=your_aqicn_api_key

# AI/LLM API Keys
GROQ_API_KEY=your_groq_api_key

# JWT Secret (generate a secure random string)
SECRET_KEY=your_secure_secret_key_here
### Frontend (.env.local)

```bash
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast Python web framework
- **PostgreSQL** (Aiven Cloud) - Managed cloud database with SSL
- **Tortoise ORM** - Async ORM for Python (Django-like API)
- **GROQ API** (Llama 3.1 70B) - AI explanations
- **APScheduler** - Advanced Python scheduler for cron jobs
- **Pydantic** - Data validation and settings management
- **Pandas, NumPy, scikit-learn** - Analytics and ML

### Frontend
- **Next.js 14** (TypeScript, App Router) - React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Dark Mode** - System-wide theme toggle with persistence
- **React Context API** - State management (Theme, Auth, Toast)
- **Chart.js / Recharts** - Data visualization

### Infrastructure
- **Python 3.12+** - Modern Python runtime
- **Node.js 18+** - JavaScript runtime
- **Uvicorn** - ASGI server for FastAPI
- **Aiven PostgreSQL** - Cloud database with SSL

---

## 🌟 Key Features

### ✅ AI Intelligence System

**Citizen AI - Natural Language Query System:**
- Ask questions in plain English: "What's the air quality today?", "Is traffic heavy?"
- **Domain Validation**: Only answers questions about air quality, traffic, alerts, safety
- **Safety Guardrails**: Blocks politics, coding, jokes, personal questions, general knowledge
- **Intent Detection**: Automatically classifies queries (RISK, AIR, TRAFFIC, ALERT, GENERAL)
- **Data-Grounded**: Fetches real-time environment, traffic, and alert data
- **GROQ-Powered Explanations**: Uses Llama 3.1 70B for natural language responses
- **Confidence Scoring**: Shows confidence level (High/Medium/Low) based on data availability
- **Audit Logging**: All queries logged for transparency and accountability
- **Collapsible Chat Panel**: Integrated into citizen dashboard with dark mode support

**Example Queries:**
- ✅ "What's the current air quality in Ahmedabad?"
- ✅ "Are there any active alerts for my city?"
- ✅ "Is traffic congestion high right now?"
- ✅ "What are the health risks today?"
- ❌ "Who is the mayor?" (Blocked - politics)
- ❌ "Write me Python code" (Blocked - coding)

### ✅ User Authentication & Authorization

**Role-Based Access Control:**
- **Admin Users**: Full access to municipal dashboard, scenario testing, system health, citizen request management
- **Citizen Users**: Access to public dashboard, AI queries, alerts, simulator, data requests
- **JWT Tokens**: Secure authentication with 24-hour expiry
- **Password Security**: Bcrypt hashing with salt rounds
- **Protected Routes**: Frontend route guards based on user role
- **Session Management**: Persistent login with localStorage

**Authentication Endpoints:**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login (returns JWT)
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/change-password` - Change password

### ✅ Citizen Participation & Transparency

**Data Correction Requests:**
- Citizens can report incorrect data (environment, traffic, services)
- Admin review workflow with status tracking (pending → investigating → resolved/rejected)
- Supporting evidence upload
- Admin response notes
- Email notifications

**Dataset Access Requests:**
- Citizens can request access to specific datasets
- Justified reasons required
- Admin approval workflow
- Status tracking (pending → approved/rejected)
- Admin notes and feedback

**Admin Request Management:**
- Unified dashboard at `/municipal/requests`
- Two tabs: Dataset Requests & Data Corrections
- Filter by status, type, city
- Click-to-expand modal with full details
- Update status and add admin notes
- Reviewer tracking and timestamps

### ✅ Dark Mode Theme System

**Features:**
- System-wide dark mode toggle (top-right header)
- Persistent theme preference (localStorage)
- Smooth color transitions (200ms duration)
- Tailwind CSS dark: variants throughout
- Optimized color palettes:
  - Light: gray-50/100/200 backgrounds, gray-900/700 text
  - Dark: gray-900/800/700 backgrounds, gray-100/300 text
- Consistent across all pages (citizen + admin portals)
- Accessible color contrast ratios

---

## 🎯 Core Analytics Features

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

### 🌟 NEW: AI Intelligence
```
POST /api/v1/ai/query
GET  /api/v1/ai/query-logs
```

**Example AI Query:**
```bash
curl -X POST http://localhost:8001/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "What is the air quality in Ahmedabad today?",
    "city_id": "uuid-of-ahmedabad"
  }'
```

**Response:**
```json
{
  "success": true,
  "response": "The air quality in Ahmedabad is currently Unhealthy for Sensitive Groups with an AQI of 150 and PM2.5 at 85 µg/m³. Sensitive groups should consider reducing prolonged outdoor activities.",
  "intent": "AIR",
  "is_valid_domain": true,
  "confidence": 0.9,
  "data_sources": ["Environment"],
  "response_time_ms": 1250,
  "city_name": "Ahmedabad"
}
```

### 🌟 NEW: Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
```

### 🌟 NEW: Citizen Participation
```
POST /api/v1/citizen/dataset-requests
GET  /api/v1/citizen/dataset-requests (admin only)
PUT  /api/v1/citizen/dataset-requests/{id} (admin only)
POST /api/v1/citizen/correction-requests
GET  /api/v1/citizen/correction-requests (admin only)
PUT  /api/v1/citizen/correction-requests/{id} (admin only)
```

### System Trust
```
GET /api/v1/system/health
GET /api/v1/system/freshness
GET /api/v1/system/audit/{city}
```

**Interactive API Documentation:** `http://localhost:8001/docs`

---

## 🎨 User Interfaces

### Citizen Portal (`/citizen/dashboard`)
- **Live City Dashboard** with 4 metric cards (Status, AQI, Temperature, Traffic)
- **AI Chat Panel** - Collapsible natural language query interface with:
  - City selector dropdown
  - Chat history with user queries and AI responses
  - Intent badges (🌫️ AIR, 🚗 TRAFFIC, ⚠️ ALERT, ⚡ RISK)
  - Confidence indicators (High/Medium/Low)
  - Data source attribution
  - Dark mode support
- **Active Alerts Feed** - Real-time alerts with severity indicators
- **Public Advisory Cards** - Air quality, temperature, traffic status
- **Citizen Actions** - Quick links to report issues, request data, view alerts, simulator
- **Data Freshness Indicators** - Live ingest status per data type
- **AI Transparency** - Model confidence: 90%
- **Real-time WebSocket Updates** - Live data refresh every 30 seconds

### Municipal Admin Panel (`/municipal`)
Protected routes requiring admin authentication:
- **Dashboard** (`/municipal/dashboard`) - System overview, metrics, health
- **Scenario Testing** (`/municipal/scenario`) - What-if policy simulator
- **Alerts Management** (`/municipal/alerts`) - Alert monitoring and history
- **System Health** (`/municipal/system-health`) - Data sources, freshness tracking
- **Citizen Requests** (`/municipal/requests`) - Manage data corrections and dataset requests

### UI Features
- **Dark Mode Toggle** - System-wide theme with persistence
- **Responsive Design** - Mobile-friendly across all pages
- **Real-time Updates** - Live data refresh
- **Toast Notifications** - User feedback for actions
- **Protected Routes** - Auto-redirect based on role
- **Loading States** - Smooth UX during data fetching

---

## 🎯 Design Principles

1. **Predict Early**: Focus on forecasting, not just reporting
2. **SAI-Assisted**: Natural language queries for citizen accessibility
3. **Explainable**: Every prediction includes reasoning and confidence scores
4. **Trustworthy**: Data freshness and system health always visible
5. **Decision-Focused**: What-if scenarios drive action
6. **Citizen-Centered**: Public transparency, participation, and data access
7. **Secure by Default**: JWT authentication, role-based access control
8. **Accessible**: Dark mode, responsive design, clear UI/UX

---

## � Getting Started

Check if both services are running:
- **Backend API**: http://localhost:8001/health
- **API Docs**: http://localhost:8001/docs
- **Frontend**: http://localhost:3000
- **Live Demo**: https://c3-e1x-ingenious-7-0-y7f6.vercel.app/login

**Test Accounts:**
```
Admin:
Email: admin@ingenious.com
Password: admin123

Citizen:
Email: citizen@ingenious.com  
Password: citizen123
```

**Try the AI System:**
1. Go to Citizen Dashboard
2. Scroll to "Ask AI About Your City"
3. Click to expand the chat panel
4. Ask: "What's the air quality today?"
5. Get instant AI-powered response with data sources!

---

## 📊 Non-Goals

❌ Complex ML training pipelines  
❌ Vehicle-level traffic simulation  
❌ Heavy GIS/road-network modeling  
❌ Mobile applications (web-responsive instead)  
❌ Real-time video processing  
❌ Blockchain integration  
❌ Multi-language support (English only)

---

## � Project Status

### ✅ Completed
- Core data ingestion (push + pull)
- 7-day forecasting & anomaly detection
- Risk scoring & alert system
- What-if scenario engine
- JWT authentication & role-based access
- Dark mode theme system
- AI natural language query system
- Citizen participation workflows
- Admin request management dashboard
- Real-time WebSocket updates
- Responsive design

### 🚧 Future Enhancements
- Admin AI (policy recommendations)
- Email notifications
- Advanced data visualizations
- Multi-city comparisons
- Historical trend analysis
- API rate limiting

---

## 👥 Team C3E1

**Members:**
- Ayaan Goel
- Harsh Bhavsar
- Nishu Shukla
- Nihar Prajapati

---

**Remember**: *"This system predicts problems early."*
