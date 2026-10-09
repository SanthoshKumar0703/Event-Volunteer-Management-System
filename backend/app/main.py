"""
EventFlow Main Application
FastAPI backend for Event Volunteer Management System
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import logging
from datetime import datetime, timezone

from .core.config import get_settings
from .core.database import db, lifespan
from .core.security import security

# Import routers
from .api.v1 import (
    auth as auth_router,
    users as users_router,
    event_requests as event_requests_router,
    events as events_router,
    applications as applications_router,
    assignments as assignments_router,
    tasks as tasks_router,
    shifts as shifts_router,
    attendance as attendance_router,
    announcements as announcements_router,
    notifications as notifications_router,
    reviews as reviews_router,
    badges as badges_router,
    analytics as analytics_router,
)
from .api import websocket as ws_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# Create FastAPI app
@asynccontextmanager
async def app_lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting EventFlow backend...")
    await db.connect()
    
    # Initialize database
    from .core.database import init_database
    await init_database()
    
    # Create admin user if not exists (for development)
    from .models.user import create_admin_user_if_not_exists
    await create_admin_user_if_not_exists()
    
    logger.info("✅ EventFlow backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down EventFlow backend...")
    db.close()
    logger.info("✅ EventFlow backend shutdown complete")


app = FastAPI(
    title="EventFlow API",
    description="Complete Event Volunteer Management System API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=app_lifespan,
)


# Settings
settings = get_settings()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error": {
                "code": str(exc.status_code),
                "message": exc.detail,
            },
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"❌ Error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc) if settings.DEBUG else "Internal server error",
            },
        },
    )


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    logger.info(f"📥 {request.method} {request.url}")
    
    start_time = datetime.now(timezone.utc)
    response = await call_next(request)
    end_time = datetime.now(timezone.utc)
    
    duration = (end_time - start_time).total_seconds() * 1000
    logger.info(f"📤 {request.method} {request.url} - {response.status_code} - {duration:.2f}ms")
    
    return response


# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "success": True,
        "message": "EventFlow API is running",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "success": True,
        "message": "Welcome to EventFlow API",
        "docs": "/api/docs",
        "health": "/api/health",
    }


# Include API routers
app.include_router(auth_router.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router.router, prefix="/api/users", tags=["Users"])
app.include_router(
    event_requests_router.router,
    prefix="/api/event-requests",
    tags=["Event Requests"],
)
app.include_router(events_router.router, prefix="/api/events", tags=["Events"])
app.include_router(
    applications_router.router,
    prefix="/api/applications",
    tags=["Applications"],
)
app.include_router(
    assignments_router.router,
    prefix="/api/assignments",
    tags=["Assignments"],
)
app.include_router(tasks_router.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(shifts_router.router, prefix="/api/shifts", tags=["Shifts"])
app.include_router(
    attendance_router.router,
    prefix="/api/attendance",
    tags=["Attendance"],
)
app.include_router(
    announcements_router.router,
    prefix="/api/announcements",
    tags=["Announcements"],
)
app.include_router(
    notifications_router.router,
    prefix="/api/notifications",
    tags=["Notifications"],
)
app.include_router(reviews_router.router, prefix="/api/reviews", tags=["Reviews"])
app.include_router(badges_router.router, prefix="/api/badges", tags=["Badges"])
app.include_router(
    analytics_router.router,
    prefix="/api/analytics",
    tags=["Analytics"],
)

# WebSocket router
app.include_router(ws_router.router)


# Seed data endpoint (for development only)
@app.post("/api/seed")
async def seed_data():
    """Seed the database with test data (development only)"""
    if not settings.DEBUG:
        raise HTTPException(status_code=403, detail="Seeding is only available in development")
    
    from .seed_data import seed_database
    result = await seed_database()
    
    return {
        "success": True,
        "message": "Database seeded successfully",
        "data": result,
    }


# Clear database endpoint (for development only)
@app.delete("/api/clear")
async def clear_database():
    """Clear the database (development only)"""
    if not settings.DEBUG:
        raise HTTPException(status_code=403, detail="Clearing is only available in development")
    
    from .seed_data import clear_database
    await clear_database()
    
    return {
        "success": True,
        "message": "Database cleared successfully",
    }


# Run with uvicorn
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
