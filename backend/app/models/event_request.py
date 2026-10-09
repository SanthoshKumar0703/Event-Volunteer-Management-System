"""
EventFlow Event Request Model
MongoDB event request document model
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class EventRequestStatus(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ORGANIZER_ASSIGNED = "ORGANIZER_ASSIGNED"
    PLANNING = "PLANNING"
    ACTIVE = "ACTIVE"
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
class InternalNote(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    note: str
    createdBy: Union[ObjectId, str]
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Main Event Request Model
class EventRequestModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    eventName: str
    organizationName: str
    contactPerson: str
    contactEmail: str
    contactPhone: str
    category: EventCategory
    description: str
    venue: str
    venueAddress: Optional[str] = None
    venueCity: Optional[str] = None
    venueState: Optional[str] = None
    venuePostalCode: Optional[str] = None
    venueCountry: Optional[str] = None
    eventDate: Union[datetime, str]
    startTime: str  # HH:mm format
    endTime: str  # HH:mm format
    expectedAttendees: int
    requiredVolunteers: int
    requiredSkills: List[str] = Field(default_factory=list)
    additionalRequirements: str
    budget: Optional[float] = None
    website: Optional[str] = None
    socialMediaLinks: List[str] = Field(default_factory=list)
    status: EventRequestStatus = EventRequestStatus.PENDING_REVIEW
    requestId: str
    notes: List[str] = Field(default_factory=list)
    internalNotes: List[InternalNote] = Field(default_factory=list)
    createdBy: Optional[Union[ObjectId, str]] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewedBy: Optional[Union[ObjectId, str]] = None
    reviewedAt: Optional[datetime] = None
    assignedOrganizer: Optional[Union[ObjectId, str]] = None
    assignedAt: Optional[datetime] = None
    eventId: Optional[Union[ObjectId, str]] = None  # Reference to created event
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["assignedOrganizer"] = str(data["assignedOrganizer"]) if data["assignedOrganizer"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        return data


# Database Operations
class EventRequestDB:
    """Event Request database operations"""
    
    @staticmethod
    async def create(request_data: Dict[str, Any]) -> EventRequestModel:
        """Create a new event request"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        
        # Generate request ID
        from .counter import CounterDB
        request_id = await CounterDB.get_next_sequence("event_request_id")
        request_data["requestId"] = f"REQ-{request_id:06d}"
        
        # Insert request
        result = await collection.insert_one(request_data)
        request_data["_id"] = result.inserted_id
        
        return EventRequestModel(**request_data)
    
    @staticmethod
    async def get_by_id(request_id: Union[ObjectId, str]) -> Optional[EventRequestModel]:
        """Get event request by ID"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        request_data = await collection.find_one({"_id": ObjectId(request_id)})
        if request_data:
            return EventRequestModel(**request_data)
        return None
    
    @staticmethod
    async def get_by_request_id(request_id: str) -> Optional[EventRequestModel]:
        """Get event request by request ID"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        request_data = await collection.find_one({"requestId": request_id})
        if request_data:
            return EventRequestModel(**request_data)
        return None
    
    @staticmethod
    async def update(
        request_id: Union[ObjectId, str], 
        update_data: Dict[str, Any]
    ) -> Optional[EventRequestModel]:
        """Update an event request"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            request_data = await collection.find_one({"_id": ObjectId(request_id)})
            return EventRequestModel(**request_data) if request_data else None
        return None
    
    @staticmethod
    async def delete(request_id: Union[ObjectId, str]) -> bool:
        """Delete an event request"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        result = await collection.delete_one({"_id": ObjectId(request_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        status: Optional[EventRequestStatus] = None,
        category: Optional[EventCategory] = None,
        search: Optional[str] = None,
    ) -> List[EventRequestModel]:
        """List all event requests with optional filters"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        
        query = {}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if search:
            query["$or"] = [
                {"eventName": {"$regex": search, "$options": "i"}},
                {"organizationName": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]
        
        cursor = collection.find(query).skip(skip).limit(limit).sort("createdAt", -1)
        requests = []
        async for request_data in cursor:
            requests.append(EventRequestModel(**request_data))
        
        return requests
    
    @staticmethod
    async def count(
        status: Optional[EventRequestStatus] = None,
    ) -> int:
        """Count event requests with optional filters"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        
        query = {}
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats() -> Dict[str, int]:
        """Get event request statistics"""
        collection = db.get_collection(Collections.EVENT_REQUESTS)
        
        return {
            "total": await collection.count_documents({}),
            "pending": await collection.count_documents({"status": EventRequestStatus.PENDING_REVIEW}),
            "approved": await collection.count_documents({"status": EventRequestStatus.APPROVED}),
            "rejected": await collection.count_documents({"status": EventRequestStatus.REJECTED}),
            "assigned": await collection.count_documents({"status": EventRequestStatus.ORGANIZER_ASSIGNED}),
            "completed": await collection.count_documents({"status": EventRequestStatus.COMPLETED}),
        }
