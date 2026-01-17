"""
FastAPI Application Entry Point
Urban Intelligence Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
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
        "https://c3-e1x-ingenious-7-0-y7f6.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request audit logging
app.add_middleware(AuditLoggingMiddleware)

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

# Import and include routers
from app.api.v1 import ingest, scenario, system, analytics, alerts, auth
app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingestion"])
app.include_router(scenario.router, prefix="/api/v1/scenario", tags=["scenario"])
app.include_router(system.router, prefix="/api/v1/system", tags=["system"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(alerts.router, prefix="/api/v1", tags=["alerts"])
# Will add more routers in upcoming phases:
# from app.api.v1 import metrics, citizen
# app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
# app.include_router(citizen.router, prefix="/api/v1/citizen", tags=["citizen"])
