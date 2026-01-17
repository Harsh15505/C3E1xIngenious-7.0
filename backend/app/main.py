"""
FastAPI Application Entry Point
Urban Intelligence Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Urban Intelligence Platform",
    description="Early risk prediction and decision support for urban systems",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return {
        "status": "healthy",
        "service": "api"
    }

# Import and include routers (will be added in phases)
# from app.api.v1 import ingest, metrics, analytics, scenario, alerts, citizen, system
# app.include_router(ingest.router, prefix="/api/v1/ingest", tags=["ingestion"])
# app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
# app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])
# app.include_router(scenario.router, prefix="/api/v1/scenario", tags=["scenario"])
# app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
# app.include_router(citizen.router, prefix="/api/v1/citizen", tags=["citizen"])
# app.include_router(system.router, prefix="/api/v1/system", tags=["system"])
