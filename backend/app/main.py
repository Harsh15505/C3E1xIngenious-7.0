"""
FastAPI Application Entry Point
Urban Intelligence Platform
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import asyncio
from datetime import datetime, timezone
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from tortoise import Tortoise

# Import scheduler
from app.scheduler import start_scheduler, stop_scheduler, get_job_status
from app.database import init_db, close_db
from app.modules.trust.middleware import AuditLoggingMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting Urban Intelligence Platform...")
    
    # Initialize database
    await init_db()
    logger.info("✅ Database connected")
    
    # Start scheduler
    start_scheduler()
    logger.info("✅ Scheduler started")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down...")
    stop_scheduler()
    await close_db()
    logger.info("✅ Shutdown complete")


app = FastAPI(
    title="Urban Intelligence Platform",
    description="Early risk prediction and decision support for urban systems",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",  # Frontend often runs on 3001 when 3000 is busy
        "https://c3-e1x-ingenious-7-0-y7f6.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request audit logging
app.add_middleware(AuditLoggingMiddleware)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTPException",
            "message": exc.detail,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "ValidationError",
            "message": exc.errors(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

@app.get("/")
async def root():
    return {
        "message": "Urban Intelligence Platform API",
        "tagline": "This system predicts problems early.",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    db_status = "healthy"
    try:
        connection = Tortoise.get_connection("default")
        await connection.execute_query("SELECT 1")
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "service": "api",
        "scheduler": "running",
        "database": db_status
    }

@app.get("/scheduler/status")
async def scheduler_status():
    """Get status of all scheduled jobs"""
    return {
        "scheduler": "running",
        "jobs": get_job_status()
    }


@app.websocket("/ws/city/{city}")
async def city_websocket(websocket: WebSocket, city: str):
    await websocket.accept()

    try:
        while True:
            from app.models import City, Alert
            from app.modules.ml.core import calculate_risk_score, detect_anomalies

            city_obj = await City.filter(name__iexact=city).first()
            if not city_obj:
                await websocket.send_json({
                    "type": "error",
                    "message": f"City '{city}' not found"
                })
                await asyncio.sleep(10)
                continue

            # Alerts payload (active only)
            alerts = await Alert.filter(city=city_obj, is_active=True).order_by("-created_at").limit(10)
            total_alerts = await Alert.filter(city=city_obj).count()
            active_alerts = await Alert.filter(city=city_obj, is_active=True).count()

            alert_payload = {
                "city": city,
                "total_alerts": total_alerts,
                "active_alerts": active_alerts,
                "alerts": [
                    {
                        "id": str(a.id),
                        "type": a.type,
                        "severity": a.severity,
                        "audience": a.audience,
                        "title": a.title,
                        "message": a.message,
                        "is_active": a.is_active,
                        "metadata": a.metadata,
                        "created_at": a.created_at.isoformat()
                    }
                    for a in alerts
                ]
            }

            risk = await calculate_risk_score(city)
            anomalies = await detect_anomalies(city, hours=24)

            await websocket.send_json({
                "type": "update",
                "city": city,
                "alerts": alert_payload,
                "risk": risk,
                "anomalies": anomalies
            })

            await asyncio.sleep(10)
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for city: {city}")
    except Exception as e:
        logger.error(f"WebSocket error for city {city}: {e}")

# Import and include routers
from app.api.v1 import ingest, scenario, system, analytics, alerts, auth, citizen, ai
app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingestion"])
app.include_router(scenario.router, prefix="/api/v1/scenario", tags=["scenario"])
app.include_router(system.router, prefix="/api/v1/system", tags=["system"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(alerts.router, prefix="/api/v1", tags=["alerts"])
app.include_router(citizen.router, prefix="/api/v1/citizen", tags=["citizen-participation"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai-intelligence"])
