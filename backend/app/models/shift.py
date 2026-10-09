"""
EventFlow Shift Model
MongoDB shift document model for event shifts
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class ShiftStatus(str, Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    FULL = "FULL"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


# Sub-models
class ShiftSlot(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    startTime: str  # HH:mm format
    endTime: str  # HH:mm format
    maxVolunteers: int
    currentVolunteers: int = 0
    isActive: bool = True


class ShiftRequirement(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    roleId: Optional[Union[ObjectId, str]] = None
    roleName: Optional[str] = None
    minVolunteers: int = 0
    maxVolunteers: Optional[int] = None
    requiredSkills: List[str] = Field(default_factory=list)


class ShiftAssignment(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    volunteerId: Union[ObjectId, str]
    assignmentId: Optional[Union[ObjectId, str]] = None
    slotIndex: int
    status: str  # ASSIGNED, CONFIRMED, etc.
    checkedIn: bool = False
    checkedOut: bool = False
    checkInTime: Optional[datetime] = None
    checkOutTime: Optional[datetime] = None


# Main Shift Model
class ShiftModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    shiftId: str
    eventId: Union[ObjectId, str]
    title: str
    description: Optional[str] = None
    date: Union[datetime, str]
    slots: List[ShiftSlot] = Field(default_factory=list)
    requirements: List[ShiftRequirement] = Field(default_factory=list)
    assignments: List[ShiftAssignment] = Field(default_factory=list)
    status: ShiftStatus = ShiftStatus.DRAFT
    location: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    createdBy: Union[ObjectId, str]
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    publishedAt: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        data["createdBy"] = str(data["createdBy"]) if data["createdBy"] else None
        
        # Convert nested ObjectIds
        if data.get("requirements"):
            for req in data["requirements"]:
                if isinstance(req.get("roleId"), ObjectId):
                    req["roleId"] = str(req["roleId"])
        if data.get("assignments"):
            for assignment in data["assignments"]:
                if isinstance(assignment.get("volunteerId"), ObjectId):
                    assignment["volunteerId"] = str(assignment["volunteerId"])
                if isinstance(assignment.get("assignmentId"), ObjectId):
                    assignment["assignmentId"] = str(assignment["assignmentId"])
        
        return data


class ShiftSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified shift model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    shiftId: str
    eventId: Union[ObjectId, str]
    title: str
    date: Union[datetime, str]
    status: ShiftStatus
    totalSlots: int
    totalAssigned: int
    totalRequired: int
    eventTitle: Optional[str] = None
    
    @classmethod
    def from_shift(
        cls,
        shift: ShiftModel,
        event_title: Optional[str] = None
    ) -> "ShiftSummaryModel":
        """Create a summary from a full shift model"""
        total_slots = len(shift.slots)
        total_assigned = sum(slot.currentVolunteers for slot in shift.slots)
        total_required = sum(req.minVolunteers for req in shift.requirements) if shift.requirements else 0
        
        return cls(
            _id=str(shift._id) if shift._id else None,
            shiftId=shift.shiftId,
            eventId=str(shift.eventId) if shift.eventId else None,
            title=shift.title,
            date=shift.date,
            status=shift.status,
            totalSlots=total_slots,
            totalAssigned=total_assigned,
            totalRequired=total_required,
            eventTitle=event_title
        )


# Database Operations
class ShiftDB:
    """Shift database operations"""
    
    @staticmethod
    async def create(shift_data: Dict[str, Any]) -> ShiftModel:
        """Create a new shift"""
        collection = db.get_collection(Collections.SHIFTS)
        
        # Generate shift ID
        from .counter import CounterDB
        shift_id = await CounterDB.get_next_sequence("shift_id")
        shift_data["shiftId"] = f"SHF-{shift_id:06d}"
        
        # Insert shift
        result = await collection.insert_one(shift_data)
        shift_data["_id"] = result.inserted_id
        
        return ShiftModel(**shift_data)
    
    @staticmethod
    async def get_by_id(shift_id: Union[ObjectId, str]) -> Optional[ShiftModel]:
        """Get shift by ID"""
        collection = db.get_collection(Collections.SHIFTS)
        shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
        if shift_data:
            return ShiftModel(**shift_data)
        return None
    
    @staticmethod
    async def get_by_shift_id(shift_id: str) -> Optional[ShiftModel]:
        """Get shift by shift ID"""
        collection = db.get_collection(Collections.SHIFTS)
        shift_data = await collection.find_one({"shiftId": shift_id})
        if shift_data:
            return ShiftModel(**shift_data)
        return None
    
    @staticmethod
    async def update(shift_id: Union[ObjectId, str], update_data: Dict[str, Any]) -> Optional[ShiftModel]:
        """Update a shift"""
        collection = db.get_collection(Collections.SHIFTS)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(shift_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
            return ShiftModel(**shift_data) if shift_data else None
        return None
    
    @staticmethod
    async def delete(shift_id: Union[ObjectId, str]) -> bool:
        """Delete a shift"""
        collection = db.get_collection(Collections.SHIFTS)
        result = await collection.delete_one({"_id": ObjectId(shift_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        event_id: Optional[str] = None,
        status: Optional[ShiftStatus] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "date",
        sort_order: int = 1,
    ) -> List[ShiftModel]:
        """List all shifts with optional filters"""
        collection = db.get_collection(Collections.SHIFTS)
        
        query = {}
        
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if status:
            query["status"] = status
        
        if date_from:
            query["date"] = {"$gte": datetime.fromisoformat(date_from)}
        if date_to:
            if "date" in query:
                query["date"]["$lte"] = datetime.fromisoformat(date_to)
            else:
                query["date"] = {"$lte": datetime.fromisoformat(date_to)}
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"shiftId": {"$regex": search, "$options": "i"}},
            ]
        
        sort_field = sort_by
        if sort_by not in ["title", "date", "status", "createdAt", "updatedAt"]:
            sort_field = "date"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        shifts = []
        async for shift_data in cursor:
            shifts.append(ShiftModel(**shift_data))
        
        return shifts
    
    @staticmethod
    async def count(
        event_id: Optional[str] = None,
        status: Optional[ShiftStatus] = None,
    ) -> int:
        """Count shifts with optional filters"""
        collection = db.get_collection(Collections.SHIFTS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats(event_id: Optional[str] = None) -> Dict[str, int]:
        """Get shift statistics"""
        collection = db.get_collection(Collections.SHIFTS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        
        return {
            "total": await collection.count_documents(query),
            "draft": await collection.count_documents({**query, "status": ShiftStatus.DRAFT}),
            "open": await collection.count_documents({**query, "status": ShiftStatus.OPEN}),
            "full": await collection.count_documents({**query, "status": ShiftStatus.FULL}),
            "closed": await collection.count_documents({**query, "status": ShiftStatus.CLOSED}),
            "cancelled": await collection.count_documents({**query, "status": ShiftStatus.CANCELLED}),
        }
    
    @staticmethod
    async def publish(shift_id: Union[ObjectId, str]) -> Optional[ShiftModel]:
        """Publish a shift (change status to OPEN)"""
        collection = db.get_collection(Collections.SHIFTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(shift_id)},
            {
                "$set": {
                    "status": ShiftStatus.OPEN,
                    "publishedAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
            return ShiftModel(**shift_data) if shift_data else None
        return None
    
    @staticmethod
    async def close(shift_id: Union[ObjectId, str]) -> Optional[ShiftModel]:
        """Close a shift (change status to CLOSED)"""
        collection = db.get_collection(Collections.SHIFTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(shift_id)},
            {
                "$set": {
                    "status": ShiftStatus.CLOSED,
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
            return ShiftModel(**shift_data) if shift_data else None
        return None
    
    @staticmethod
    async def assign_volunteer(
        shift_id: Union[ObjectId, str],
        volunteer_id: Union[ObjectId, str],
        slot_index: int,
        assignment_id: Optional[Union[ObjectId, str]] = None
    ) -> Optional[ShiftModel]:
        """Assign a volunteer to a shift slot"""
        collection = db.get_collection(Collections.SHIFTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(shift_id)},
            {
                "$push": {
                    "assignments": {
                        "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
                        "assignmentId": ObjectId(assignment_id) if isinstance(assignment_id, ObjectId) else assignment_id,
                        "slotIndex": slot_index,
                        "status": "ASSIGNED",
                        "checkedIn": False,
                        "checkedOut": False
                    }
                },
                "$inc": {
                    f"slots.{slot_index}.currentVolunteers": 1
                },
                "$set": {"updatedAt": datetime.now(timezone.utc)}
            }
        )
        
        if result.modified_count > 0:
            shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
            return ShiftModel(**shift_data) if shift_data else None
        return None
    
    @staticmethod
    async def remove_volunteer(
        shift_id: Union[ObjectId, str],
        volunteer_id: Union[ObjectId, str],
        slot_index: int
    ) -> Optional[ShiftModel]:
        """Remove a volunteer from a shift slot"""
        collection = db.get_collection(Collections.SHIFTS)
        
        result = await collection.update_one(
            {"_id": ObjectId(shift_id)},
            {
                "$pull": {
                    "assignments": {
                        "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
                        "slotIndex": slot_index
                    }
                },
                "$inc": {
                    f"slots.{slot_index}.currentVolunteers": -1
                },
                "$set": {"updatedAt": datetime.now(timezone.utc)}
            }
        )
        
        if result.modified_count > 0:
            shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
            return ShiftModel(**shift_data) if shift_data else None
        return None
    
    @staticmethod
    async def check_in_volunteer(
        shift_id: Union[ObjectId, str],
        volunteer_id: Union[ObjectId, str],
        slot_index: int,
        check_in_time: Optional[datetime] = None
    ) -> Optional[ShiftModel]:
        """Check in a volunteer for a shift"""
        collection = db.get_collection(Collections.SHIFTS)
        
        result = await collection.update_one(
            {
                "_id": ObjectId(shift_id),
                "assignments.volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
                "assignments.slotIndex": slot_index
            },
            {
                "$set": {
                    "assignments.$.checkedIn": True,
                    "assignments.$.checkInTime": check_in_time or datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
            return ShiftModel(**shift_data) if shift_data else None
        return None
    
    @staticmethod
    async def check_out_volunteer(
        shift_id: Union[ObjectId, str],
        volunteer_id: Union[ObjectId, str],
        slot_index: int,
        check_out_time: Optional[datetime] = None
    ) -> Optional[ShiftModel]:
        """Check out a volunteer from a shift"""
        collection = db.get_collection(Collections.SHIFTS)
        
        result = await collection.update_one(
            {
                "_id": ObjectId(shift_id),
                "assignments.volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
                "assignments.slotIndex": slot_index
            },
            {
                "$set": {
                    "assignments.$.checkedOut": True,
                    "assignments.$.checkOutTime": check_out_time or datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            shift_data = await collection.find_one({"_id": ObjectId(shift_id)})
            return ShiftModel(**shift_data) if shift_data else None
        return None
    
    @staticmethod
    async def get_event_shifts(event_id: Union[ObjectId, str]) -> List[ShiftModel]:
        """Get all shifts for an event"""
        collection = db.get_collection(Collections.SHIFTS)
        
        query = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        }
        
        shifts = []
        async for shift_data in collection.find(query):
            shifts.append(ShiftModel(**shift_data))
        
        return shifts
    
    @staticmethod
    async def get_volunteer_shifts(volunteer_id: Union[ObjectId, str]) -> List[ShiftModel]:
        """Get all shifts a volunteer is assigned to"""
        collection = db.get_collection(Collections.SHIFTS)
        
        query = {
            "assignments.volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id
        }
        
        shifts = []
        async for shift_data in collection.find(query):
            shifts.append(ShiftModel(**shift_data))
        
        return shifts
