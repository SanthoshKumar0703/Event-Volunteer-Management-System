"""
EventFlow Application Model
MongoDB application document model for volunteer applications
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class ApplicationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


# Sub-models
class ApplicationAnswer(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    questionId: Union[ObjectId, str]
    question: str
    answer: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ApplicationSkillMatch(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    skill: str
    matchScore: float  # 0-100
    required: bool = False


# Main Application Model
class ApplicationModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    applicationId: str
    eventId: Union[ObjectId, str]
    volunteerId: Union[ObjectId, str]
    roleId: Optional[Union[ObjectId, str]] = None  # Reference to event role
    status: ApplicationStatus = ApplicationStatus.PENDING
    applicationDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    coverLetter: Optional[str] = None
    answers: List[ApplicationAnswer] = Field(default_factory=list)
    skillMatches: List[ApplicationSkillMatch] = Field(default_factory=list)
    matchScore: float = 0.0  # Overall match score (0-100)
    notes: List[str] = Field(default_factory=list)
    reviewedBy: Optional[Union[ObjectId, str]] = None
    reviewedAt: Optional[datetime] = None
    approvedAt: Optional[datetime] = None
    rejectedAt: Optional[datetime] = None
    rejectionReason: Optional[str] = None
    withdrawnAt: Optional[datetime] = None
    withdrawalReason: Optional[str] = None
    priority: Optional[int] = None  # Application priority (higher = more priority)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        data["volunteerId"] = str(data["volunteerId"]) if data["volunteerId"] else None
        data["roleId"] = str(data["roleId"]) if data["roleId"] else None
        data["reviewedBy"] = str(data["reviewedBy"]) if data["reviewedBy"] else None
        return data


class ApplicationSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified application model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    applicationId: str
    eventId: Union[ObjectId, str]
    volunteerId: Union[ObjectId, str]
    roleId: Optional[Union[ObjectId, str]] = None
    status: ApplicationStatus
    matchScore: float
    applicationDate: datetime
    coverLetter: Optional[str] = None
    eventTitle: Optional[str] = None
    volunteerName: Optional[str] = None
    roleName: Optional[str] = None
    
    @classmethod
    def from_application(
        cls,
        application: ApplicationModel,
        event_title: Optional[str] = None,
        volunteer_name: Optional[str] = None,
        role_name: Optional[str] = None
    ) -> "ApplicationSummaryModel":
        """Create a summary from a full application model"""
        return cls(
            _id=str(application._id) if application._id else None,
            applicationId=application.applicationId,
            eventId=str(application.eventId) if application.eventId else None,
            volunteerId=str(application.volunteerId) if application.volunteerId else None,
            roleId=str(application.roleId) if application.roleId else None,
            status=application.status,
            matchScore=application.matchScore,
            applicationDate=application.applicationDate,
            coverLetter=application.coverLetter,
            eventTitle=event_title,
            volunteerName=volunteer_name,
            roleName=role_name
        )


# Database Operations
class ApplicationDB:
    """Application database operations"""
    
    @staticmethod
    async def create(application_data: Dict[str, Any]) -> ApplicationModel:
        """Create a new application"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        # Generate application ID
        from .counter import CounterDB
        application_id = await CounterDB.get_next_sequence("application_id")
        application_data["applicationId"] = f"APP-{application_id:06d}"
        
        # Calculate match score if skills are provided
        if "skillMatches" in application_data and application_data["skillMatches"]:
            total_score = 0
            total_weight = 0
            for match in application_data["skillMatches"]:
                weight = 1.0
                if match.get("required"):
                    weight = 1.5
                total_score += match.get("matchScore", 0) * weight
                total_weight += weight
            
            if total_weight > 0:
                application_data["matchScore"] = round(total_score / total_weight, 2)
        
        # Insert application
        result = await collection.insert_one(application_data)
        application_data["_id"] = result.inserted_id
        
        return ApplicationModel(**application_data)
    
    @staticmethod
    async def get_by_id(application_id: Union[ObjectId, str]) -> Optional[ApplicationModel]:
        """Get application by ID"""
        collection = db.get_collection(Collections.APPLICATIONS)
        application_data = await collection.find_one({"_id": ObjectId(application_id)})
        if application_data:
            return ApplicationModel(**application_data)
        return None
    
    @staticmethod
    async def get_by_application_id(application_id: str) -> Optional[ApplicationModel]:
        """Get application by application ID"""
        collection = db.get_collection(Collections.APPLICATIONS)
        application_data = await collection.find_one({"applicationId": application_id})
        if application_data:
            return ApplicationModel(**application_data)
        return None
    
    @staticmethod
    async def get_by_volunteer_and_event(
        volunteer_id: Union[ObjectId, str],
        event_id: Union[ObjectId, str]
    ) -> Optional[ApplicationModel]:
        """Get application by volunteer and event"""
        collection = db.get_collection(Collections.APPLICATIONS)
        application_data = await collection.find_one({
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        })
        if application_data:
            return ApplicationModel(**application_data)
        return None
    
    @staticmethod
    async def update(
        application_id: Union[ObjectId, str],
        update_data: Dict[str, Any]
    ) -> Optional[ApplicationModel]:
        """Update an application"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            application_data = await collection.find_one({"_id": ObjectId(application_id)})
            return ApplicationModel(**application_data) if application_data else None
        return None
    
    @staticmethod
    async def delete(application_id: Union[ObjectId, str]) -> bool:
        """Delete an application"""
        collection = db.get_collection(Collections.APPLICATIONS)
        result = await collection.delete_one({"_id": ObjectId(application_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        status: Optional[ApplicationStatus] = None,
        search: Optional[str] = None,
        sort_by: str = "applicationDate",
        sort_order: int = -1,
    ) -> List[ApplicationModel]:
        """List all applications with optional filters"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        query = {}
        
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if volunteer_id:
            query["volunteerId"] = ObjectId(volunteer_id)
        if status:
            query["status"] = status
        
        # For search, we need to join with event or volunteer collections
        # This is a simplified version - in production, use aggregation
        if search:
            query["$or"] = [
                {"coverLetter": {"$regex": search, "$options": "i"}},
                {"applicationId": {"$regex": search, "$options": "i"}},
            ]
        
        sort_field = sort_by
        if sort_by not in ["applicationDate", "matchScore", "status", "createdAt", "updatedAt"]:
            sort_field = "applicationDate"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        applications = []
        async for application_data in cursor:
            applications.append(ApplicationModel(**application_data))
        
        return applications
    
    @staticmethod
    async def count(
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        status: Optional[ApplicationStatus] = None,
    ) -> int:
        """Count applications with optional filters"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if volunteer_id:
            query["volunteerId"] = ObjectId(volunteer_id)
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats(event_id: Optional[str] = None) -> Dict[str, int]:
        """Get application statistics"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        
        return {
            "total": await collection.count_documents(query),
            "pending": await collection.count_documents({**query, "status": ApplicationStatus.PENDING}),
            "approved": await collection.count_documents({**query, "status": ApplicationStatus.APPROVED}),
            "rejected": await collection.count_documents({**query, "status": ApplicationStatus.REJECTED}),
            "withdrawn": await collection.count_documents({**query, "status": ApplicationStatus.WITHDRAWN}),
        }
    
    @staticmethod
    async def approve(
        application_id: Union[ObjectId, str],
        reviewer_id: Union[ObjectId, str],
        notes: Optional[str] = None
    ) -> Optional[ApplicationModel]:
        """Approve an application"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        update_data = {
            "status": ApplicationStatus.APPROVED,
            "reviewedBy": ObjectId(reviewer_id) if isinstance(reviewer_id, str) else reviewer_id,
            "reviewedAt": datetime.now(timezone.utc),
            "approvedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if notes:
            update_data["notes"] = [notes]
        
        result = await collection.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            application_data = await collection.find_one({"_id": ObjectId(application_id)})
            return ApplicationModel(**application_data) if application_data else None
        return None
    
    @staticmethod
    async def reject(
        application_id: Union[ObjectId, str],
        reviewer_id: Union[ObjectId, str],
        reason: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Optional[ApplicationModel]:
        """Reject an application"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        update_data = {
            "status": ApplicationStatus.REJECTED,
            "reviewedBy": ObjectId(reviewer_id) if isinstance(reviewer_id, str) else reviewer_id,
            "reviewedAt": datetime.now(timezone.utc),
            "rejectedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if reason:
            update_data["rejectionReason"] = reason
        if notes:
            update_data["notes"] = [notes]
        
        result = await collection.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            application_data = await collection.find_one({"_id": ObjectId(application_id)})
            return ApplicationModel(**application_data) if application_data else None
        return None
    
    @staticmethod
    async def withdraw(
        application_id: Union[ObjectId, str],
        reason: Optional[str] = None
    ) -> Optional[ApplicationModel]:
        """Withdraw an application"""
        collection = db.get_collection(Collections.APPLICATIONS)
        
        update_data = {
            "status": ApplicationStatus.WITHDRAWN,
            "withdrawnAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if reason:
            update_data["withdrawalReason"] = reason
        
        result = await collection.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            application_data = await collection.find_one({"_id": ObjectId(application_id)})
            return ApplicationModel(**application_data) if application_data else None
        return None
    
    @staticmethod
    async def calculate_match_score(
        volunteer_skills: List[Dict[str, Any]],
        required_skills: List[str],
        preferred_skills: List[str] = None
    ) -> float:
        """
        Calculate match score between volunteer skills and event requirements
        
        Algorithm:
        - Skills match: 40%
        - Availability: 20%
        - Experience: 20%
        - Performance: 20%
        """
        if not volunteer_skills and not required_skills:
            return 0.0
        
        score = 0.0
        total_weight = 0.0
        
        # Skills matching (40%)
        volunteer_skill_names = [skill.get("name", "").lower() for skill in volunteer_skills]
        
        for required_skill in required_skills:
            if required_skill.lower() in volunteer_skill_names:
                score += 40.0
                total_weight += 100.0
        
        if preferred_skills:
            for preferred_skill in preferred_skills:
                if preferred_skill.lower() in volunteer_skill_names:
                    score += 20.0
                    total_weight += 100.0
        
        # Normalize
        if total_weight > 0:
            return round(score, 2)
        return 0.0
