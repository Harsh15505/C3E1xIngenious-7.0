# 🧪 Testing Guidelines

Complete testing guide for Urban Intelligence Platform - Phase by Phase

---

## Phase 0: Project Setup & Initial Commit ✅

### Setup Verification

```bash
# 1. Check file structure exists
ls backend/
ls frontend/
ls scripts/

# 2. Verify gitignore works
git status  # Should not show .env, __pycache__, node_modules

# 3. Check README renders properly
# Open README.md and verify formatting
```

**Expected Results:**
- ✅ All directories created
- ✅ No sensitive files in git
- ✅ README displays correctly

---

## Phase 1: Database Schema & Scheduler ✅

### 1. Database Connection Test

```bash
cd backend

# Start PostgreSQL (if not running)
# Windows: Check Services or start manually
# Linux/Mac: sudo service postgresql start

# Test database connection
python -c "from tortoise import Tortoise; import asyncio; asyncio.run(Tortoise.init(db_url='postgresql://postgres:postgres@localhost:5432/urban_intelligence', modules={'models': ['app.models']})); print('✅ Connected'); asyncio.run(Tortoise.close_connections())"
```

**Expected:** `✅ Connected` message

### 2. Database Schema Test

```bash
cd backend

# Install dependencies first
pip install -r requirements.txt

# Schema will be auto-generated when you run seed script or start server
# No separate migration command needed!
```

**Expected Results:**
- ✅ All dependencies installed
- ✅ Tortoise ORM ready

### 3. Database Seeding Test

```bash
# From project root
python scripts/seed_data.py
```

**Expected Output:**
```
🗄️  Connected to database
Seeding cities...
✅ City: Ahmedabad
✅ City: Gandhinagar
Seeding data sources...
✅ Source: sensor-env-ahmedabad
✅ Source: sensor-env-gandhinagar
... (10 sources total)
✅ Database seeding completed successfully!
```

**Verify in Database:**
```sql
-- Connect to database
psql -U postgres -d urban_intelligence

-- Check cities
SELECT name, state, population FROM "City";

-- Check data sources
SELECT name, type, "expectedFrequency", "isOnline" FROM "DataSource";

-- Exit
\q
```

**Expected:**
- 2 cities (Ahmedabad, Gandhinagar)
- 10 data sources (all isOnline = true)

### 4. FastAPI Server Start Test

```bash
cd backend

# Start server
uvicorn app.main:app --reload
```

**Expected Output:**
```
🚀 Starting Urban Intelligence Platform...
✅ Database connected
✅ Scheduler started
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Open in browser:**
- http://localhost:8000 → Should show API welcome message
- http://localhost:8000/docs → FastAPI Swagger UI
- http://localhost:8000/health → `{"status":"healthy","service":"api","scheduler":"running"}`

### 5. Scheduler Status Test

```bash
# In browser or curl
curl http://localhost:8000/scheduler/status
```

**Expected Response:**
```json
{
  "scheduler": "running",
  "jobs": [
    {
      "id": "fetch_environment",
      "name": "Fetch Environment Data",
      "next_run": "2026-01-17T10:15:00+00:00",
      "trigger": "cron[minute='*/15']"
    },
    {
      "id": "fetch_traffic",
      "name": "Fetch Traffic Data",
      "next_run": "2026-01-17T10:30:00+00:00",
      "trigger": "cron[minute='*/30']"
    },
    ... (8 jobs total)
  ]
}
```

**Verify:**
- ✅ 8 scheduled jobs listed
- ✅ Each has a valid next_run timestamp
- ✅ Cron triggers match schedule (*/15, */30, etc.)

### 6. Sensor Simulator Test (Push-Style Ingestion)

**Open a new terminal:**

```bash
# Test single batch
python scripts/simulate_sensors.py once
```

**Expected Output:**
```
Pushing single batch of sensor data...
✅ Environment data pushed for Ahmedabad: AQI=125.3
✅ Traffic data pushed for Ahmedabad Zone A: high
✅ Traffic data pushed for Ahmedabad Zone B: medium
✅ Service data pushed for Ahmedabad
... (similar for Gandhinagar)
✅ Single batch completed
```

**If errors occur:**
- ❌ Connection refused → FastAPI server not running
- ❌ 404 Not Found → API endpoints not implemented (expected in Phase 1)
- ❌ 422 Validation Error → Schema mismatch

### 7. Scheduler Logs Test

**Watch server logs for scheduled job execution:**

```
[CRON] Checking system health at 2026-01-17 10:05:00
[CRON] Fetching environment data at 2026-01-17 10:15:00
[CRON] Fetching traffic data at 2026-01-17 10:30:00
```

**Verify:**
- ✅ Jobs run at correct intervals
- ✅ No exceptions in logs
- ✅ Graceful shutdown on Ctrl+C

---

## Phase 1 Summary Checklist

- [ ] Database connected successfully
- [ ] Tortoise ORM dependencies installed
- [ ] Ahmedabad and Gandhinagar cities seeded
- [ ] 10 data sources seeded
- [ ] FastAPI server starts without errors
- [ ] Scheduler initializes with 8 jobs
- [ ] Health endpoint returns "healthy"
- [ ] Scheduler status shows all jobs
- [ ] Sensor simulator runs without connection errors
- [ ] Scheduler logs show job execution
- [ ] Server shuts down gracefully

---

## Troubleshooting Phase 1

### Issue: Database connection failed

```bash
# Check PostgreSQL is running
pg_isready -U postgres

# Check DATABASE_URL in .env
cat backend/.env

# Test connection manually
psql -U postgres -d urban_intelligence
```

### Issue: Tortoise models not found

```bash
cd backend
pip install -r requirements.txt
```

### Issue: Scheduler not starting

Check logs for error. Common causes:
- Missing `apscheduler` dependency → `pip install -r requirements.txt`
- Async context issue → Ensure FastAPI lifespan is properly configured

### Issue: Port 8000 already in use

```bash
# Windows: Find process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

---

## Next: Phase 2 Testing Guidelines

Will be added after Phase 2 implementation (Data Ingestion APIs)

---

## Quick Test Commands Reference

```bash
# Database
psql -U postgres -d urban_intelligence

# Server
cd backend && uvicorn app.main:app --reload

# Seed data
python scripts/seed_data.py

# Test sensor push
python scripts/simulate_sensors.py once

# Test API
curl http://localhost:8000/health
curl http://localhost:8000/scheduler/status

# Check logs
# Just watch terminal where uvicorn is running
```

---

**Testing Philosophy:**
- Test after each phase before moving forward
- Document any deviations or issues
- Keep test data realistic (Ahmedabad/Gandhinagar focused)
- Verify both happy path and error scenarios
