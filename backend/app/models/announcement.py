"""
EventFlow Announcement Model
MongoDB announcement document model for event announcements
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class AnnouncementStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class AnnouncementPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class AnnouncementTarget(str, Enum):
    ALL = "ALL"
    VOLUNTEERS = "VOLUNTEERS"
    ORGANIZERS = "ORGANIZERS"
    SPECIFIC_VOLUNTEERS = "SPECIFIC_VOLUNTEERS"
    SPECIFIC_ROLES = "SPECIFIC_ROLES"


# Sub-models
class AnnouncementAttachment(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    filename: str
    url: str
    uploadedBy: Union[ObjectId, str]
    uploadedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AnnouncementReadReceipt(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    userId: Union[ObjectId, str]
    readAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Main Announcement Model
class AnnouncementModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    announcementId: str
    eventId: Optional[Union[ObjectId, str]] = None  # None for global announcements
    title: str
    message: str
    status: AnnouncementStatus = AnnouncementStatus.DRAFT
    priority: AnnouncementPriority = AnnouncementPriority.MEDIUM
    target: AnnouncementTarget = AnnouncementTarget.ALL
    targetUserIds: List[Union[ObjectId, str]] = Field(default_factory=list)  # For SPECIFIC_VOLUNTEERS
    targetRoleIds: List[Union[ObjectId, str]] = Field(default_factory=list)  # For SPECIFIC_ROLES
    isPinned: bool = False
    attachments: List[AnnouncementAttachment] = Field(default_factory=list)
    readReceipts: List[AnnouncementReadReceipt] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    createdBy: Union[ObjectId, str]
    publishedAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expiresAt: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        data["createdBy"] = str(data["createdBy"]) if data["createdBy"] else None
        
        # Convert nested ObjectIds
        if data.get("targetUserIds"):
            data["targetUserIds"] = [str(uid) if isinstance(uid, ObjectId) else uid for uid in data["targetUserIds"]]
        if data.get("targetRoleIds"):
            data["targetRoleIds"] = [str(rid) if isinstance(rid, ObjectId) else rid for rid in data["targetRoleIds"]]
        if data.get("readReceipts"):
            for receipt in data["readReceipts"]:
                if isinstance(receipt.get("userId"), ObjectId):
                    receipt["userId"] = str(receipt["userId"])
        
        return data


class AnnouncementSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified announcement model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    announcementId: str
    eventId: Optional[Union[ObjectId, str]] = None
    title: str
    message: str
    priority: AnnouncementPriority
    status: AnnouncementStatus
    isPinned: bool
    createdBy: Union[ObjectId, str]
    publishedAt: Optional[datetime] = None
    readCount: int = 0
    eventTitle: Optional[str] = None
    creatorName: Optional[str] = None
    
    @classmethod
    def from_announcement(
        cls,
        announcement: AnnouncementModel,
        event_title: Optional[str] = None,
        creator_name: Optional[str] = None
    ) -> "AnnouncementSummaryModel":
        """Create a summary from a full announcement model"""
        return cls(
            _id=str(announcement._id) if announcement._id else None,
            announcementId=announcement.announcementId,
            eventId=str(announcement.eventId) if announcement.eventId else None,
            title=announcement.title,
            message=announcement.message[:200] + "..." if len(announcement.message) > 200 else announcement.message,
            priority=announcement.priority,
            status=announcement.status,
            isPinned=announcement.isPinned,
            createdBy=str(announcement.createdBy) if announcement.createdBy else None,
            publishedAt=announcement.publishedAt,
            readCount=len(announcement.readReceipts),
            eventTitle=event_title,
            creatorName=creator_name
        )


# Database Operations
class AnnouncementDB:
    """Announcement database operations"""
    
    @staticmethod
    async def create(announcement_data: Dict[str, Any]) -> AnnouncementModel:
        """Create a new announcement"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        # Generate announcement ID
        from .counter import CounterDB
        announcement_id = await CounterDB.get_next_sequence("announcement_id")
        announcement_data["announcementId"] = f"ANN-{announcement_id:06d}"
        
        # If published, set publishedAt
        if announcement_data.get("status") == AnnouncementStatus.PUBLISHED:
            announcement_data["publishedAt"] = datetime.now(timezone.utc)
        
        # Insert announcement
        result = await collection.insert_one(announcement_data)
        announcement_data["_id"] = result.inserted_id
        
        return AnnouncementModel(**announcement_data)
    
    @staticmethod
    async def get_by_id(announcement_id: Union[ObjectId, str]) -> Optional[AnnouncementModel]:
        """Get announcement by ID"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        announcement_data = await collection.find_one({"_id": ObjectId(announcement_id)})
        if announcement_data:
            return AnnouncementModel(**announcement_data)
        return None
    
    @staticmethod
    async def get_by_announcement_id(announcement_id: str) -> Optional[AnnouncementModel]:
        """Get announcement by announcement ID"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        announcement_data = await collection.find_one({"announcementId": announcement_id})
        if announcement_data:
            return AnnouncementModel(**announcement_data)
        return None
    
    @staticmethod
    async def update(
        announcement_id: Union[ObjectId, str],
        update_data: Dict[str, Any]
    ) -> Optional[AnnouncementModel]:
        """Update an announcement"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        # If publishing, set publishedAt
        if update_data.get("status") == AnnouncementStatus.PUBLISHED and "publishedAt" not in update_data:
            update_data["publishedAt"] = datetime.now(timezone.utc)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(announcement_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            announcement_data = await collection.find_one({"_id": ObjectId(announcement_id)})
            return AnnouncementModel(**announcement_data) if announcement_data else None
        return None
    
    @staticmethod
    async def delete(announcement_id: Union[ObjectId, str]) -> bool:
        """Delete an announcement"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        result = await collection.delete_one({"_id": ObjectId(announcement_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        event_id: Optional[str] = None,
        status: Optional[AnnouncementStatus] = None,
        priority: Optional[AnnouncementPriority] = None,
        is_pinned: Optional[bool] = None,
        search: Optional[str] = None,
        sort_by: str = "publishedAt",
        sort_order: int = -1,
    ) -> List[AnnouncementModel]:
        """List all announcements with optional filters"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        query = {}
        
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if status:
            query["status"] = status
        if priority:
            query["priority"] = priority
        if is_pinned is not None:
            query["isPinned"] = is_pinned
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"message": {"$regex": search, "$options": "i"}},
            ]
        
        sort_field = sort_by
        if sort_by not in ["title", "priority", "status", "isPinned", "publishedAt", "createdAt", "updatedAt"]:
            sort_field = "publishedAt"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        announcements = []
        async for announcement_data in cursor:
            announcements.append(AnnouncementModel(**announcement_data))
        
        return announcements
    
    @staticmethod
    async def count(
        event_id: Optional[str] = None,
        status: Optional[AnnouncementStatus] = None,
    ) -> int:
        """Count announcements with optional filters"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats(event_id: Optional[str] = None) -> Dict[str, int]:
        """Get announcement statistics"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        
        return {
            "total": await collection.count_documents(query),
            "draft": await collection.count_documents({**query, "status": AnnouncementStatus.DRAFT}),
            "published": await collection.count_documents({**query, "status": AnnouncementStatus.PUBLISHED}),
            "archived": await collection.count_documents({**query, "status": AnnouncementStatus.ARCHIVED}),
            "pinned": await collection.count_documents({**query, "isPinned": True, "status": AnnouncementStatus.PUBLISHED}),
        }
    
    @staticmethod
    async def publish(announcement_id: Union[ObjectId, str]) -> Optional[AnnouncementModel]:
        """Publish an announcement"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(announcement_id)},
            {
                "$set": {
                    "status": AnnouncementStatus.PUBLISHED,
                    "publishedAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            announcement_data = await collection.find_one({"_id": ObjectId(announcement_id)})
            return AnnouncementModel(**announcement_data) if announcement_data else None
        return None
    
    @staticmethod
    async def archive(announcement_id: Union[ObjectId, str]) -> Optional[AnnouncementModel]:
        """Archive an announcement"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(announcement_id)},
            {
                "$set": {
                    "status": AnnouncementStatus.ARCHIVED,
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            announcement_data = await collection.find_one({"_id": ObjectId(announcement_id)})
            return AnnouncementModel(**announcement_data) if announcement_data else None
        return None
    
    @staticmethod
    async def pin(announcement_id: Union[ObjectId, str], is_pinned: bool = True) -> Optional[AnnouncementModel]:
        """Pin or unpin an announcement"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(announcement_id)},
            {
                "$set": {
                    "isPinned": is_pinned,
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            announcement_data = await collection.find_one({"_id": ObjectId(announcement_id)})
            return AnnouncementModel(**announcement_data) if announcement_data else None
        return None
    
    @staticmethod
    async def mark_as_read(
        announcement_id: Union[ObjectId, str],
        user_id: Union[ObjectId, str]
    ) -> bool:
        """Mark an announcement as read by a user"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        # Check if already read
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        if not announcement:
            return False
        
        # Check if user already marked as read
        for receipt in announcement.readReceipts:
            if str(receipt.userId) == str(user_id):
                return True
        
        result = await collection.update_one(
            {"_id": ObjectId(announcement_id)},
            {
                "$push": {
                    "readReceipts": {
                        "userId": ObjectId(user_id) if isinstance(user_id, str) else user_id,
                        "readAt": datetime.now(timezone.utc)
                    }
                },
                "$set": {"updatedAt": datetime.now(timezone.utc)}
            }
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def get_event_announcements(event_id: Union[ObjectId, str]) -> List[AnnouncementModel]:
        """Get all announcements for an event"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        query = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        }
        
        announcements = []
        async for announcement_data in collection.find(query):
            announcements.append(AnnouncementModel(**announcement_data))
        
        return announcements
    
    @staticmethod
    async def get_global_announcements() -> List[AnnouncementModel]:
        """Get all global announcements (not tied to a specific event)"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        query = {
            "eventId": None
        }
        
        announcements = []
        async for announcement_data in collection.find(query):
            announcements.append(AnnouncementModel(**announcement_data))
        
        return announcements
    
    @staticmethod
    async def get_user_announcements(
        user_id: Union[ObjectId, str],
        role: Optional[str] = None
    ) -> List[AnnouncementModel]:
        """Get announcements visible to a user based on their role"""
        collection = db.get_collection(Collections.ANNOUNCEMENTS)
        
        # For now, return all published announcements
        # In production, implement proper filtering based on target
        query = {
            "status": AnnouncementStatus.PUBLISHED
        }
        
        announcements = []
        async for announcement_data in collection.find(query):
            announcements.append(AnnouncementModel(**announcement_data))
        
        return announcements
