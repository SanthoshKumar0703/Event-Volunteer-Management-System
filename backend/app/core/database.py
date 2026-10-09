"""
EventFlow Database Configuration
MongoDB connection and session management
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from typing import Optional, Any
from contextlib import asynccontextmanager
from fastapi import Depends
from bson import ObjectId
import json
from datetime import datetime

from .config import get_settings


class MongoDB:
    """MongoDB connection manager"""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self) -> None:
        """Establish MongoDB connection"""
        try:
            self.client = AsyncIOMotorClient(
                self.settings.MONGODB_URL,
                maxPoolSize=self.settings.MAX_CONNECTIONS,
                minPoolSize=self.settings.MIN_CONNECTIONS,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000,
                serverSelectionTimeoutMS=30000,
                retryWrites=True,
                retryReads=True,
            )
            
            # Test connection
            await self.client.admin.command('ping')
            self.db = self.client[self.settings.DATABASE_NAME]
            
            print(f"✅ Connected to MongoDB: {self.settings.MONGODB_URL}")
            print(f"📁 Database: {self.settings.DATABASE_NAME}")
            
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise
    
    def close(self) -> None:
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("🔌 MongoDB connection closed")
    
    def get_collection(self, name: str) -> AsyncIOMotorCollection:
        """Get a MongoDB collection"""
        if self.db is None:
            raise RuntimeError("MongoDB database is not initialized. Call connect() first.")
        return self.db[name]

    def get_database(self) -> AsyncIOMotorDatabase:
        """Get the database instance"""
        if self.db is None:
            raise RuntimeError("MongoDB database is not initialized. Call connect() first.")
        return self.db


# Create MongoDB instance
db = MongoDB()


# Lifespan manager for FastAPI
@asynccontextmanager
async def lifespan(app):
    """Application lifespan manager"""
    # Startup
    await db.connect()
    yield
    # Shutdown
    db.close()


# Dependency for FastAPI
async def get_db():
    """Get database dependency"""
    return db


# Helper functions
def get_collection(collection_name: str):
    """Get a collection directly"""
    return db.get_collection(collection_name)


def object_id_to_str(obj: Any) -> Any:
    """Convert ObjectId to string recursively"""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, dict):
        return {k: object_id_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [object_id_to_str(item) for item in obj]
    return obj


def json_serializer(obj: Any) -> str:
    """Custom JSON serializer for MongoDB objects"""
    def default(o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return str(o)
    return json.dumps(obj, default=default)


# Collection names (centralized for consistency)
class Collections:
    USERS = "users"
    EVENT_REQUESTS = "event_requests"
    EVENTS = "events"
    EVENT_ROLES = "event_roles"
    SHIFTS = "shifts"
    APPLICATIONS = "applications"
    ASSIGNMENTS = "assignments"
    TASKS = "tasks"
    ATTENDANCE = "attendance"
    NOTIFICATIONS = "notifications"
    ANNOUNCEMENTS = "announcements"
    REVIEWS = "reviews"
    BADGES = "badges"
    VOLUNTEER_BADGES = "volunteer_badges"
    OTP_VERIFICATIONS = "otp_verifications"
    PASSWORD_RESET_TOKENS = "password_reset_tokens"
    COUNTERS = "counters"
    ACTIVITY_LOGS = "activity_logs"


# Index definitions
INDEXES = {
    Collections.USERS: [
        ([("email", 1)], {"unique": True}),
        ([("role", 1)], {}),
        ([("status", 1)], {}),
        ([("googleId", 1)], {"unique": True, "sparse": True}),
        ([("firstName", "text"), ("lastName", "text"), ("email", "text")], {}),
    ],
    Collections.EVENT_REQUESTS: [
        ([("status", 1)], {}),
        ([("category", 1)], {}),
        ([("eventDate", 1)], {}),
        ([("contactEmail", 1)], {}),
        ([("createdAt", -1)], {}),
        ([("eventName", "text"), ("organizationName", "text"), ("description", "text")], {}),
    ],
    Collections.EVENTS: [
        ([("organizer", 1)], {}),
        ([("status", 1)], {}),
        ([("category", 1)], {}),
        ([("date", 1)], {}),
        ([("qrToken", 1)], {"unique": True}),
        ([("eventId", 1)], {"unique": True}),
        ([("title", "text"), ("description", "text"), ("venue", "text")], {}),
    ],
    Collections.EVENT_ROLES: [
        ([("eventId", 1)], {}),
        ([("name", 1)], {}),
        ([("order", 1)], {}),
    ],
    Collections.SHIFTS: [
        ([("eventId", 1)], {}),
        ([("date", 1)], {}),
        ([("startTime", 1)], {}),
        ([("status", 1)], {}),
    ],
    Collections.APPLICATIONS: [
        ([("eventId", 1)], {}),
        ([("volunteerId", 1)], {}),
        ([("roleId", 1)], {}),
        ([("status", 1)], {}),
        ([("eventId", 1), ("volunteerId", 1)], {"unique": True}),
        ([("applicationDate", -1)], {}),
        ([("matchScore", -1)], {}),
    ],
    Collections.ASSIGNMENTS: [
        ([("eventId", 1)], {}),
        ([("volunteerId", 1)], {}),
        ([("roleId", 1)], {}),
        ([("shiftId", 1)], {}),
        ([("status", 1)], {}),
        ([("assignmentId", 1)], {"unique": True}),
        ([("eventId", 1), ("volunteerId", 1)], {"unique": True}),
    ],
    Collections.TASKS: [
        ([("eventId", 1)], {}),
        ([("volunteerId", 1)], {}),
        ([("assignmentId", 1)], {}),
        ([("status", 1)], {}),
        ([("priority", 1)], {}),
        ([("dueDate", 1)], {}),
        ([("taskId", 1)], {"unique": True}),
    ],
    Collections.ATTENDANCE: [
        ([("eventId", 1)], {}),
        ([("volunteerId", 1)], {}),
        ([("shiftId", 1)], {}),
        ([("status", 1)], {}),
        ([("checkInTime", 1)], {}),
        ([("checkOutTime", 1)], {}),
        ([("eventId", 1), ("volunteerId", 1), ("shiftId", 1)], {"unique": True}),
    ],
    Collections.NOTIFICATIONS: [
        ([("userId", 1)], {}),
        ([("isRead", 1)], {}),
        ([("type", 1)], {}),
        ([("priority", 1)], {}),
        ([("userId", 1), ("createdAt", -1)], {}),
        ([("expiresAt", 1)], {"expireAfterSeconds": 0}),
    ],
    Collections.ANNOUNCEMENTS: [
        ([("eventId", 1)], {}),
        ([("createdBy", 1)], {}),
        ([("priority", 1)], {}),
        ([("status", 1)], {}),
        ([("isPinned", 1)], {}),
        ([("publishedAt", -1)], {}),
    ],
    Collections.REVIEWS: [
        ([("reviewerId", 1)], {}),
        ([("revieweeId", 1)], {}),
        ([("eventId", 1)], {}),
        ([("type", 1)], {}),
        ([("rating", 1)], {}),
    ],
    Collections.BADGES: [
        ([("badgeId", 1)], {"unique": True}),
        ([("category", 1)], {}),
        ([("rarity", 1)], {}),
        ([("order", 1)], {}),
    ],
    Collections.VOLUNTEER_BADGES: [
        ([("volunteerId", 1)], {}),
        ([("badgeId", 1)], {}),
        ([("volunteerId", 1), ("badgeId", 1)], {"unique": True}),
    ],
    Collections.OTP_VERIFICATIONS: [
        ([("email", 1)], {"unique": True}),
        ([("otp", 1)], {}),
        ([("expiresAt", 1)], {"expireAfterSeconds": 0}),
    ],
    Collections.PASSWORD_RESET_TOKENS: [
        ([("email", 1)], {"unique": True}),
        ([("token", 1)], {"unique": True}),
        ([("expiresAt", 1)], {"expireAfterSeconds": 0}),
    ],
    Collections.COUNTERS: [
        ([("name", 1)], {"unique": True}),
    ],
    Collections.ACTIVITY_LOGS: [
        ([("userId", 1)], {}),
        ([("action", 1)], {}),
        ([("entityType", 1)], {}),
        ([("createdAt", -1)], {}),
    ],
}


async def create_indexes():
    """Create all necessary indexes"""
    for collection_name, indexes in INDEXES.items():
        collection = db.get_collection(collection_name)
        for index_spec in indexes:
            keys, options = index_spec
            try:
                await collection.create_index(keys, **options)
                print(f"📊 Created index on {collection_name}: {keys}")
            except Exception as e:
                print(f"⚠️  Skipped index on {collection_name}: {keys} - {e}")


# Initialize indexes on startup
async def init_database():
    """Initialize database with indexes"""
    try:
        await create_indexes()
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️  Error creating indexes: {e}")
