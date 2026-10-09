"""
EventFlow Assignment Model
MongoDB assignment document model for volunteer assignments to events
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class AssignmentStatus(str, Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# Main Assignment Model
class AssignmentModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    assignmentId: str
    eventId: Union[ObjectId, str]
    volunteerId: Union[ObjectId, str]
    roleId: Optional[Union[ObjectId, str]] = None  # Reference to event role
    shiftId: Optional[Union[ObjectId, str]] = None  # Reference to shift
    status: AssignmentStatus = AssignmentStatus.PENDING
    assignedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    checkInTime: Optional[datetime] = None
    checkOutTime: Optional[datetime] = None
    hoursWorked: float = 0.0
    performanceRating: Optional[float] = None  # 1-5
    feedback: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        data["volunteerId"] = str(data["volunteerId"]) if data["volunteerId"] else None
        data["roleId"] = str(data["roleId"]) if data["roleId"] else None
        data["shiftId"] = str(data["shiftId"]) if data["shiftId"] else None
        return data


class AssignmentSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified assignment model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    assignmentId: str
    eventId: Union[ObjectId, str]
    volunteerId: Union[ObjectId, str]
    roleId: Optional[Union[ObjectId, str]] = None
    shiftId: Optional[Union[ObjectId, str]] = None
    status: AssignmentStatus
    assignedAt: datetime
    hoursWorked: float
    eventTitle: Optional[str] = None
    volunteerName: Optional[str] = None
    roleName: Optional[str] = None
    shiftTime: Optional[str] = None
    
    @classmethod
    def from_assignment(
        cls,
        assignment: AssignmentModel,
        event_title: Optional[str] = None,
        volunteer_name: Optional[str] = None,
        role_name: Optional[str] = None,
        shift_time: Optional[str] = None
    ) -> "AssignmentSummaryModel":
        """Create a summary from a full assignment model"""
        return cls(
            _id=str(assignment._id) if assignment._id else None,
            assignmentId=assignment.assignmentId,
            eventId=str(assignment.eventId) if assignment.eventId else None,
            volunteerId=str(assignment.volunteerId) if assignment.volunteerId else None,
            roleId=str(assignment.roleId) if assignment.roleId else None,
            shiftId=str(assignment.shiftId) if assignment.shiftId else None,
            status=assignment.status,
            assignedAt=assignment.assignedAt,
            hoursWorked=assignment.hoursWorked,
            eventTitle=event_title,
            volunteerName=volunteer_name,
            roleName=role_name,
            shiftTime=shift_time
        )


# Database Operations
class AssignmentDB:
    """Assignment database operations"""
    
    @staticmethod
    async def create(assignment_data: Dict[str, Any]) -> AssignmentModel:
        """Create a new assignment"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        # Generate assignment ID
        from .counter import CounterDB
        assignment_id = await CounterDB.get_next_sequence("assignment_id")
        assignment_data["assignmentId"] = f"ASN-{assignment_id:06d}"
        
        # Insert assignment
        result = await collection.insert_one(assignment_data)
        assignment_data["_id"] = result.inserted_id
        
        return AssignmentModel(**assignment_data)
    
    @staticmethod
    async def get_by_id(assignment_id: Union[ObjectId, str]) -> Optional[AssignmentModel]:
        """Get assignment by ID"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        assignment_data = await collection.find_one({"_id": ObjectId(assignment_id)})
        if assignment_data:
            return AssignmentModel(**assignment_data)
        return None
    
    @staticmethod
    async def get_by_assignment_id(assignment_id: str) -> Optional[AssignmentModel]:
        """Get assignment by assignment ID"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        assignment_data = await collection.find_one({"assignmentId": assignment_id})
        if assignment_data:
            return AssignmentModel(**assignment_data)
        return None
    
    @staticmethod
    async def get_by_volunteer_and_event(
        volunteer_id: Union[ObjectId, str],
        event_id: Union[ObjectId, str]
    ) -> Optional[AssignmentModel]:
        """Get assignment by volunteer and event"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        assignment_data = await collection.find_one({
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        })
        if assignment_data:
            return AssignmentModel(**assignment_data)
        return None
    
    @staticmethod
    async def update(
        assignment_id: Union[ObjectId, str],
        update_data: Dict[str, Any]
    ) -> Optional[AssignmentModel]:
        """Update an assignment"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            assignment_data = await collection.find_one({"_id": ObjectId(assignment_id)})
            return AssignmentModel(**assignment_data) if assignment_data else None
        return None
    
    @staticmethod
    async def delete(assignment_id: Union[ObjectId, str]) -> bool:
        """Delete an assignment"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        result = await collection.delete_one({"_id": ObjectId(assignment_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        status: Optional[AssignmentStatus] = None,
        search: Optional[str] = None,
        sort_by: str = "assignedAt",
        sort_order: int = -1,
    ) -> List[AssignmentModel]:
        """List all assignments with optional filters"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        query = {}
        
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if volunteer_id:
            query["volunteerId"] = ObjectId(volunteer_id)
        if status:
            query["status"] = status
        
        if search:
            query["$or"] = [
                {"assignmentId": {"$regex": search, "$options": "i"}},
            ]
        
        sort_field = sort_by
        if sort_by not in ["assignedAt", "confirmedAt", "completedAt", "status", "createdAt", "updatedAt"]:
            sort_field = "assignedAt"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        assignments = []
        async for assignment_data in cursor:
            assignments.append(AssignmentModel(**assignment_data))
        
        return assignments
    
    @staticmethod
    async def count(
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        status: Optional[AssignmentStatus] = None,
    ) -> int:
        """Count assignments with optional filters"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
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
        """Get assignment statistics"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        
        return {
            "total": await collection.count_documents(query),
            "pending": await collection.count_documents({**query, "status": AssignmentStatus.PENDING}),
            "assigned": await collection.count_documents({**query, "status": AssignmentStatus.ASSIGNED}),
            "confirmed": await collection.count_documents({**query, "status": AssignmentStatus.CONFIRMED}),
            "completed": await collection.count_documents({**query, "status": AssignmentStatus.COMPLETED}),
            "cancelled": await collection.count_documents({**query, "status": AssignmentStatus.CANCELLED}),
        }
    
    @staticmethod
    async def confirm(
        assignment_id: Union[ObjectId, str],
        notes: Optional[str] = None
    ) -> Optional[AssignmentModel]:
        """Confirm an assignment"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        update_data = {
            "status": AssignmentStatus.CONFIRMED,
            "confirmedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if notes:
            update_data["notes"] = [notes]
        
        result = await collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            assignment_data = await collection.find_one({"_id": ObjectId(assignment_id)})
            return AssignmentModel(**assignment_data) if assignment_data else None
        return None
    
    @staticmethod
    async def complete(
        assignment_id: Union[ObjectId, str],
        hours_worked: Optional[float] = None,
        performance_rating: Optional[float] = None,
        feedback: Optional[str] = None
    ) -> Optional[AssignmentModel]:
        """Mark an assignment as completed"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        update_data = {
            "status": AssignmentStatus.COMPLETED,
            "completedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if hours_worked is not None:
            update_data["hoursWorked"] = hours_worked
        if performance_rating is not None:
            update_data["performanceRating"] = performance_rating
        if feedback:
            update_data["feedback"] = feedback
        
        result = await collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            assignment_data = await collection.find_one({"_id": ObjectId(assignment_id)})
            return AssignmentModel(**assignment_data) if assignment_data else None
        return None
    
    @staticmethod
    async def cancel(
        assignment_id: Union[ObjectId, str],
        reason: Optional[str] = None
    ) -> Optional[AssignmentModel]:
        """Cancel an assignment"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        update_data = {
            "status": AssignmentStatus.CANCELLED,
            "cancelledAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if reason:
            update_data["cancellationReason"] = reason
        
        result = await collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            assignment_data = await collection.find_one({"_id": ObjectId(assignment_id)})
            return AssignmentModel(**assignment_data) if assignment_data else None
        return None
    
    @staticmethod
    async def check_in(
        assignment_id: Union[ObjectId, str],
        check_in_time: Optional[datetime] = None
    ) -> Optional[AssignmentModel]:
        """Record check-in for an assignment"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        update_data = {
            "checkInTime": check_in_time or datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        result = await collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            assignment_data = await collection.find_one({"_id": ObjectId(assignment_id)})
            return AssignmentModel(**assignment_data) if assignment_data else None
        return None
    
    @staticmethod
    async def check_out(
        assignment_id: Union[ObjectId, str],
        check_out_time: Optional[datetime] = None
    ) -> Optional[AssignmentModel]:
        """Record check-out for an assignment and calculate hours worked"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        assignment = await AssignmentDB.get_by_id(assignment_id)
        if not assignment:
            return None
        
        check_in_time = assignment.checkInTime or datetime.now(timezone.utc)
        check_out_time = check_out_time or datetime.now(timezone.utc)
        
        # Calculate hours worked
        hours_worked = (check_out_time - check_in_time).total_seconds() / 3600
        
        update_data = {
            "checkOutTime": check_out_time,
            "hoursWorked": round(hours_worked, 2),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        result = await collection.update_one(
            {"_id": ObjectId(assignment_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            assignment_data = await collection.find_one({"_id": ObjectId(assignment_id)})
            return AssignmentModel(**assignment_data) if assignment_data else None
        return None
    
    @staticmethod
    async def get_volunteer_assignments(volunteer_id: Union[ObjectId, str]) -> List[AssignmentModel]:
        """Get all assignments for a volunteer"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        query = {
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id
        }
        
        assignments = []
        async for assignment_data in collection.find(query):
            assignments.append(AssignmentModel(**assignment_data))
        
        return assignments
    
    @staticmethod
    async def get_event_assignments(event_id: Union[ObjectId, str]) -> List[AssignmentModel]:
        """Get all assignments for an event"""
        collection = db.get_collection(Collections.ASSIGNMENTS)
        
        query = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        }
        
        assignments = []
        async for assignment_data in collection.find(query):
            assignments.append(AssignmentModel(**assignment_data))
        
        return assignments
