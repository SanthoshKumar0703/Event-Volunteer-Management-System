"""
EventFlow Event Model
MongoDB event document model for events
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    OPEN_FOR_REGISTRATION = "OPEN_FOR_REGISTRATION"
    UPCOMING = "UPCOMING"
    LIVE = "LIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class EventCategory(str, Enum):
    CONFERENCE = "CONFERENCE"
    CONCERT = "CONCERT"
    FESTIVAL = "FESTIVAL"
    SPORTS = "SPORTS"
    CHARITY = "CHARITY"
    COMMUNITY = "COMMUNITY"
    CORPORATE = "CORPORATE"
    EDUCATION = "EDUCATION"
    HEALTH = "HEALTH"
    ENVIRONMENT = "ENVIRONMENT"
    ARTS = "ARTS"
    TECHNOLOGY = "TECHNOLOGY"
    FOOD = "FOOD"
    OTHER = "OTHER"


# Sub-models
class EventLocation(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    venue: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EventSettings(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    allowOverRegistration: bool = False
    autoApproveApplications: bool = False
    requireSkills: bool = False
    requireAvailability: bool = False
    maxVolunteersPerShift: Optional[int] = None
    minVolunteersPerShift: Optional[int] = None


class EventSocialLinks(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    website: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None


# Main Event Model
class EventModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    title: str
    description: str
    category: EventCategory
    status: EventStatus = EventStatus.DRAFT
    eventId: str
    organizer: Union[ObjectId, str]
    location: EventLocation
    date: Union[datetime, str]
    startTime: str  # HH:mm format
    endTime: str  # HH:mm format
    registrationDeadline: Union[datetime, str]
    requiredVolunteers: int = 0
    maximumVolunteers: Optional[int] = None
    currentVolunteers: int = 0
    requiredSkills: List[str] = Field(default_factory=list)
    preferredSkills: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    contactEmail: str
    contactPhone: Optional[str] = None
    qrToken: str  # Unique token for QR code generation
    image: Optional[str] = None
    bannerImage: Optional[str] = None
    socialLinks: EventSocialLinks = Field(default_factory=EventSocialLinks)
    settings: EventSettings = Field(default_factory=EventSettings)
    requestId: Optional[Union[ObjectId, str]] = None  # Reference to event request
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    publishedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["organizer"] = str(data["organizer"]) if data["organizer"] else None
        data["requestId"] = str(data["requestId"]) if data["requestId"] else None
        return data


class EventSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified event model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    title: str
    eventId: str
    category: EventCategory
    status: EventStatus
    date: Union[datetime, str]
    startTime: str
    endTime: str
    location: Dict[str, Any]
    requiredVolunteers: int
    currentVolunteers: int
    maximumVolunteers: Optional[int] = None
    image: Optional[str] = None
    organizer: Optional[Dict[str, Any]] = None
    
    @classmethod
    def from_event(cls, event: EventModel, organizer_info: Optional[Dict[str, Any]] = None) -> "EventSummaryModel":
        """Create a summary from a full event model"""
        return cls(
            _id=str(event._id) if event._id else None,
            title=event.title,
            eventId=event.eventId,
            category=event.category,
            status=event.status,
            date=event.date,
            startTime=event.startTime,
            endTime=event.endTime,
            location=event.location.model_dump() if hasattr(event.location, 'model_dump') else event.location,
            requiredVolunteers=event.requiredVolunteers,
            currentVolunteers=event.currentVolunteers,
            maximumVolunteers=event.maximumVolunteers,
            image=event.image,
            organizer=organizer_info
        )


# Database Operations
class EventDB:
    """Event database operations"""
    
    @staticmethod
    async def create(event_data: Dict[str, Any]) -> EventModel:
        """Create a new event"""
        collection = db.get_collection(Collections.EVENTS)
        
        # Generate event ID
        from .counter import CounterDB
        event_id = await CounterDB.get_next_sequence("event_id")
        event_data["eventId"] = f"EVT-{event_id:06d}"
        
        # Generate QR token
        qr_token = f"QR-{event_id:08d}"
        event_data["qrToken"] = qr_token
        
        # Insert event
        result = await collection.insert_one(event_data)
        event_data["_id"] = result.inserted_id
        
        return EventModel(**event_data)
    
    @staticmethod
    async def get_by_id(event_id: Union[ObjectId, str]) -> Optional[EventModel]:
        """Get event by ID"""
        collection = db.get_collection(Collections.EVENTS)
        event_data = await collection.find_one({"_id": ObjectId(event_id)})
        if event_data:
            return EventModel(**event_data)
        return None
    
    @staticmethod
    async def get_by_event_id(event_id: str) -> Optional[EventModel]:
        """Get event by event ID"""
        collection = db.get_collection(Collections.EVENTS)
        event_data = await collection.find_one({"eventId": event_id})
        if event_data:
            return EventModel(**event_data)
        return None
    
    @staticmethod
    async def get_by_qr_token(qr_token: str) -> Optional[EventModel]:
        """Get event by QR token"""
        collection = db.get_collection(Collections.EVENTS)
        event_data = await collection.find_one({"qrToken": qr_token})
        if event_data:
            return EventModel(**event_data)
        return None
    
    @staticmethod
    async def update(event_id: Union[ObjectId, str], update_data: Dict[str, Any]) -> Optional[EventModel]:
        """Update an event"""
        collection = db.get_collection(Collections.EVENTS)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            event_data = await collection.find_one({"_id": ObjectId(event_id)})
            return EventModel(**event_data) if event_data else None
        return None
    
    @staticmethod
    async def delete(event_id: Union[ObjectId, str]) -> bool:
        """Delete an event"""
        collection = db.get_collection(Collections.EVENTS)
        result = await collection.delete_one({"_id": ObjectId(event_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        status: Optional[EventStatus] = None,
        category: Optional[EventCategory] = None,
        organizer: Optional[str] = None,
        search: Optional[str] = None,
        upcoming: bool = False,
        my_events: Optional[str] = None,
    ) -> List[EventModel]:
        """List all events with optional filters"""
        collection = db.get_collection(Collections.EVENTS)
        
        query = {}
        
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if organizer:
            query["organizer"] = ObjectId(organizer)
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"eventId": {"$regex": search, "$options": "i"}},
            ]
        
        if upcoming:
            now = datetime.now(timezone.utc)
            query["date"] = {"$gte": now}
            query["status"] = {"$in": [EventStatus.OPEN_FOR_REGISTRATION, EventStatus.UPCOMING, EventStatus.LIVE]}
        
        if my_events:
            query["organizer"] = ObjectId(my_events)
        
        cursor = collection.find(query).skip(skip).limit(limit).sort("date", 1)
        events = []
        async for event_data in cursor:
            events.append(EventModel(**event_data))
        
        return events
    
    @staticmethod
    async def count(
        status: Optional[EventStatus] = None,
        category: Optional[EventCategory] = None,
        organizer: Optional[str] = None,
    ) -> int:
        """Count events with optional filters"""
        collection = db.get_collection(Collections.EVENTS)
        
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if organizer:
            query["organizer"] = ObjectId(organizer)
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats(organizer_id: Optional[str] = None) -> Dict[str, int]:
        """Get event statistics"""
        collection = db.get_collection(Collections.EVENTS)
        
        query = {}
        if organizer_id:
            query["organizer"] = ObjectId(organizer_id)
        
        return {
            "total": await collection.count_documents(query),
            "draft": await collection.count_documents({**query, "status": EventStatus.DRAFT}),
            "pending": await collection.count_documents({**query, "status": EventStatus.PENDING}),
            "open": await collection.count_documents({**query, "status": EventStatus.OPEN_FOR_REGISTRATION}),
            "upcoming": await collection.count_documents({**query, "status": EventStatus.UPCOMING}),
            "live": await collection.count_documents({**query, "status": EventStatus.LIVE}),
            "completed": await collection.count_documents({**query, "status": EventStatus.COMPLETED}),
            "cancelled": await collection.count_documents({**query, "status": EventStatus.CANCELLED}),
        }
    
    @staticmethod
    async def publish(event_id: Union[ObjectId, str]) -> Optional[EventModel]:
        """Publish an event (change status to OPEN_FOR_REGISTRATION)"""
        collection = db.get_collection(Collections.EVENTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(event_id)},
            {
                "$set": {
                    "status": EventStatus.OPEN_FOR_REGISTRATION,
                    "publishedAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            event_data = await collection.find_one({"_id": ObjectId(event_id)})
            return EventModel(**event_data) if event_data else None
        return None
    
    @staticmethod
    async def cancel(event_id: Union[ObjectId, str], reason: Optional[str] = None) -> Optional[EventModel]:
        """Cancel an event"""
        collection = db.get_collection(Collections.EVENTS)
        
        update_data = {
            "status": EventStatus.CANCELLED,
            "cancelledAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if reason:
            update_data["cancellationReason"] = reason
        
        result = await collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            event_data = await collection.find_one({"_id": ObjectId(event_id)})
            return EventModel(**event_data) if event_data else None
        return None
    
    @staticmethod
    async def complete(event_id: Union[ObjectId, str]) -> Optional[EventModel]:
        """Mark an event as completed"""
        collection = db.get_collection(Collections.EVENTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(event_id)},
            {
                "$set": {
                    "status": EventStatus.COMPLETED,
                    "completedAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            event_data = await collection.find_one({"_id": ObjectId(event_id)})
            return EventModel(**event_data) if event_data else None
        return None
    
    @staticmethod
    async def get_volunteers(event_id: Union[ObjectId, str]) -> List[Dict[str, Any]]:
        """Get all volunteers for an event"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        query = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id,
            "status": {"$in": ["ASSIGNED", "CONFIRMED", "COMPLETED"]}
        }
        
        assignments = []
        async for assignment in collection.find(query):
            assignments.append(assignment)
        
        return assignments
