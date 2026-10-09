"""
EventFlow Configuration
Handles all application settings from environment variables
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "EventFlow"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Complete Event Volunteer Management System"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
    ]
    CORS_ORIGIN_REGEX: Optional[str] = None
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]
    
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "eventflow"
    MAX_CONNECTIONS: int = 100
    MIN_CONNECTIONS: int = 10
    
    # JWT Authentication
    JWT_SECRET: str = "your-super-secret-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Google OAuth 2.0
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_CALLBACK_URL: str = "http://localhost:8000/api/auth/google/callback"
    
    # SMTP Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: str = "noreply@eventflow.app"
    SMTP_FROM_NAME: str = "EventFlow"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    
    # Frontend URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    
    # WebSocket
    WEBSOCKET_URL: str = "ws://localhost:8000"
    WEBSOCKET_MAX_CONNECTIONS: int = 1000
    WEBSOCKET_PING_INTERVAL: int = 30
    
    # File Upload
    UPLOAD_DIR: str = "static/uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    
    # OTP Configuration
    OTP_LENGTH: int = 6
    OTP_EXPIRE_MINUTES: int = 10
    OTP_MAX_ATTEMPTS: int = 5
    OTP_LOCKOUT_MINUTES: int = 15
    
    # Password Policy
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_MAX_LENGTH: int = 100
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_NUMBER: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True
    
    # Rate Limiting
    RATE_LIMIT: int = 100  # requests per minute
    RATE_LIMIT_AUTH: int = 1000  # authenticated requests per minute
    
    # Session
    SESSION_EXPIRE_MINUTES: int = 30
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Security
    CSRF_ENABLED: bool = False
    HSTS_ENABLED: bool = False
    
    # Cache
    CACHE_ENABLED: bool = False
    CACHE_TTL: int = 300  # seconds
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Create settings instance
settings = Settings()


@lru_cache()
def get_settings():
    """Get cached settings instance"""
    return Settings()


def reload_settings():
    """Reload settings (clears cache)"""
    get_settings.cache_clear()
    return get_settings()


# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
