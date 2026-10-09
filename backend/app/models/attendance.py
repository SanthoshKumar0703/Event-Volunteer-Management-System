"""
EventFlow Attendance Model
MongoDB attendance document model for volunteer check-in/check-out
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class AttendanceStatus(str, Enum):
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    NO_SHOW = "NO_SHOW"
    LATE = "LATE"
    EARLY_DEPARTURE = "EARLY_DEPARTURE"


class CheckInMethod(str, Enum):
    QR_CODE = "QR_CODE"
    MANUAL = "MANUAL"
    SELF_SERVICE = "SELF_SERVICE"
    MOBILE_APP = "MOBILE_APP"


# Main Attendance Model
class AttendanceModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    attendanceId: str
    eventId: Union[ObjectId, str]
    volunteerId: Union[ObjectId, str]
    shiftId: Optional[Union[ObjectId, str]] = None
    assignmentId: Optional[Union[ObjectId, str]] = None
    status: AttendanceStatus = AttendanceStatus.CHECKED_IN
    checkInTime: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    checkOutTime: Optional[datetime] = None
    checkInMethod: CheckInMethod = CheckInMethod.QR_CODE
    checkOutMethod: Optional[CheckInMethod] = None
    qrToken: Optional[str] = None  # QR token used for check-in
    checkInBy: Optional[Union[ObjectId, str]] = None  # Who checked in the volunteer
    checkOutBy: Optional[Union[ObjectId, str]] = None  # Who checked out the volunteer
    notes: List[str] = Field(default_factory=list)
    hoursWorked: float = 0.0
    isLate: bool = False
    isEarlyDeparture: bool = False
    temperature: Optional[float] = None  # For health screening
    healthDeclaration: Optional[Dict[str, Any]] = None
    signature: Optional[str] = None  # Digital signature
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        data["volunteerId"] = str(data["volunteerId"]) if data["volunteerId"] else None
        data["shiftId"] = str(data["shiftId"]) if data["shiftId"] else None
        data["assignmentId"] = str(data["assignmentId"]) if data["assignmentId"] else None
        data["checkInBy"] = str(data["checkInBy"]) if data["checkInBy"] else None
        data["checkOutBy"] = str(data["checkOutBy"]) if data["checkOutBy"] else None
        return data


class AttendanceSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified attendance model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    attendanceId: str
    eventId: Union[ObjectId, str]
    volunteerId: Union[ObjectId, str]
    shiftId: Optional[Union[ObjectId, str]] = None
    status: AttendanceStatus
    checkInTime: datetime
    checkOutTime: Optional[datetime] = None
    hoursWorked: float
    volunteerName: Optional[str] = None
    eventTitle: Optional[str] = None
    
    @classmethod
    def from_attendance(
        cls,
        attendance: AttendanceModel,
        volunteer_name: Optional[str] = None,
        event_title: Optional[str] = None
    ) -> "AttendanceSummaryModel":
        """Create a summary from a full attendance model"""
        return cls(
            _id=str(attendance._id) if attendance._id else None,
            attendanceId=attendance.attendanceId,
            eventId=str(attendance.eventId) if attendance.eventId else None,
            volunteerId=str(attendance.volunteerId) if attendance.volunteerId else None,
            shiftId=str(attendance.shiftId) if attendance.shiftId else None,
            status=attendance.status,
            checkInTime=attendance.checkInTime,
            checkOutTime=attendance.checkOutTime,
            hoursWorked=attendance.hoursWorked,
            volunteerName=volunteer_name,
            eventTitle=event_title
        )


# Database Operations
class AttendanceDB:
    """Attendance database operations"""
    
    @staticmethod
    async def create(attendance_data: Dict[str, Any]) -> AttendanceModel:
        """Create a new attendance record"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        # Generate attendance ID
        from .counter import CounterDB
        attendance_id = await CounterDB.get_next_sequence("attendance_id")
        attendance_data["attendanceId"] = f"ATT-{attendance_id:06d}"
        
        # Insert attendance
        result = await collection.insert_one(attendance_data)
        attendance_data["_id"] = result.inserted_id
        
        return AttendanceModel(**attendance_data)
    
    @staticmethod
    async def get_by_id(attendance_id: Union[ObjectId, str]) -> Optional[AttendanceModel]:
        """Get attendance by ID"""
        collection = db.get_collection(Collections.ATTENDANCE)
        attendance_data = await collection.find_one({"_id": ObjectId(attendance_id)})
        if attendance_data:
            return AttendanceModel(**attendance_data)
        return None
    
    @staticmethod
    async def get_by_attendance_id(attendance_id: str) -> Optional[AttendanceModel]:
        """Get attendance by attendance ID"""
        collection = db.get_collection(Collections.ATTENDANCE)
        attendance_data = await collection.find_one({"attendanceId": attendance_id})
        if attendance_data:
            return AttendanceModel(**attendance_data)
        return None
    
    @staticmethod
    async def get_by_volunteer_and_event(
        volunteer_id: Union[ObjectId, str],
        event_id: Union[ObjectId, str]
    ) -> Optional[AttendanceModel]:
        """Get attendance by volunteer and event"""
        collection = db.get_collection(Collections.ATTENDANCE)
        attendance_data = await collection.find_one({
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        })
        if attendance_data:
            return AttendanceModel(**attendance_data)
        return None
    
    @staticmethod
    async def update(
        attendance_id: Union[ObjectId, str],
        update_data: Dict[str, Any]
    ) -> Optional[AttendanceModel]:
        """Update an attendance record"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(attendance_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            attendance_data = await collection.find_one({"_id": ObjectId(attendance_id)})
            return AttendanceModel(**attendance_data) if attendance_data else None
        return None
    
    @staticmethod
    async def delete(attendance_id: Union[ObjectId, str]) -> bool:
        """Delete an attendance record"""
        collection = db.get_collection(Collections.ATTENDANCE)
        result = await collection.delete_one({"_id": ObjectId(attendance_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        shift_id: Optional[str] = None,
        status: Optional[AttendanceStatus] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "checkInTime",
        sort_order: int = -1,
    ) -> List[AttendanceModel]:
        """List all attendance records with optional filters"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        query = {}
        
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if volunteer_id:
            query["volunteerId"] = ObjectId(volunteer_id)
        if shift_id:
            query["shiftId"] = ObjectId(shift_id)
        if status:
            query["status"] = status
        
        if date_from:
            query["checkInTime"] = {"$gte": datetime.fromisoformat(date_from)}
        if date_to:
            if "checkInTime" in query:
                query["checkInTime"]["$lte"] = datetime.fromisoformat(date_to)
            else:
                query["checkInTime"] = {"$lte": datetime.fromisoformat(date_to)}
        
        if search:
            query["$or"] = [
                {"attendanceId": {"$regex": search, "$options": "i"}},
            ]
        
        sort_field = sort_by
        if sort_by not in ["checkInTime", "checkOutTime", "status", "hoursWorked", "createdAt", "updatedAt"]:
            sort_field = "checkInTime"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        attendances = []
        async for attendance_data in cursor:
            attendances.append(AttendanceModel(**attendance_data))
        
        return attendances
    
    @staticmethod
    async def count(
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        status: Optional[AttendanceStatus] = None,
    ) -> int:
        """Count attendance records with optional filters"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if volunteer_id:
            query["volunteerId"] = ObjectId(volunteer_id)
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats(event_id: Optional[str] = None) -> Dict[str, Any]:
        """Get attendance statistics"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        
        # Get all attendance records for calculation
        cursor = collection.find(query)
        records = []
        async for record in cursor:
            records.append(record)
        
        total = len(records)
        checked_in = sum(1 for r in records if r["status"] in [AttendanceStatus.CHECKED_IN, AttendanceStatus.CHECKED_OUT, AttendanceStatus.LATE, AttendanceStatus.EARLY_DEPARTURE])
        checked_out = sum(1 for r in records if r["status"] == AttendanceStatus.CHECKED_OUT)
        no_show = sum(1 for r in records if r["status"] == AttendanceStatus.NO_SHOW)
        late = sum(1 for r in records if r["status"] == AttendanceStatus.LATE)
        early_departure = sum(1 for r in records if r["status"] == AttendanceStatus.EARLY_DEPARTURE)
        
        total_hours = sum(r.get("hoursWorked", 0) for r in records)
        avg_hours = total_hours / total if total > 0 else 0
        
        return {
            "total": total,
            "checkedIn": checked_in,
            "checkedOut": checked_out,
            "noShow": no_show,
            "late": late,
            "earlyDeparture": early_departure,
            "totalHours": round(total_hours, 2),
            "averageHours": round(avg_hours, 2)
        }
    
    @staticmethod
    async def check_in(
        event_id: Union[ObjectId, str],
        volunteer_id: Union[ObjectId, str],
        shift_id: Optional[Union[ObjectId, str]] = None,
        assignment_id: Optional[Union[ObjectId, str]] = None,
        qr_token: Optional[str] = None,
        check_in_method: CheckInMethod = CheckInMethod.QR_CODE,
        check_in_by: Optional[Union[ObjectId, str]] = None,
        health_declaration: Optional[Dict[str, Any]] = None,
        temperature: Optional[float] = None
    ) -> AttendanceModel:
        """Record a check-in for a volunteer"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        # Check if already checked in
        existing = await AttendanceDB.get_by_volunteer_and_event(volunteer_id, event_id)
        if existing and existing.checkOutTime is None:
            # Already checked in, return existing
            return existing
        
        attendance_data = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id,
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "shiftId": ObjectId(shift_id) if isinstance(shift_id, ObjectId) else shift_id,
            "assignmentId": ObjectId(assignment_id) if isinstance(assignment_id, ObjectId) else assignment_id,
            "status": AttendanceStatus.CHECKED_IN,
            "checkInTime": datetime.now(timezone.utc),
            "checkInMethod": check_in_method,
            "qrToken": qr_token,
            "checkInBy": ObjectId(check_in_by) if isinstance(check_in_by, ObjectId) else check_in_by,
            "healthDeclaration": health_declaration,
            "temperature": temperature,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        # Create attendance record
        attendance = await AttendanceDB.create(attendance_data)
        
        # Update shift if provided
        if shift_id:
            from .shift import ShiftDB
            shift = await ShiftDB.get_by_id(shift_id)
            if shift:
                # Find the assignment and mark as checked in
                for assignment in shift.assignments:
                    if str(assignment.volunteerId) == str(volunteer_id):
                        await ShiftDB.check_in_volunteer(
                            shift_id,
                            volunteer_id,
                            assignment.slotIndex
                        )
                        break
        
        return attendance
    
    @staticmethod
    async def check_out(
        attendance_id: Union[ObjectId, str],
        check_out_method: CheckInMethod = CheckInMethod.QR_CODE,
        check_out_by: Optional[Union[ObjectId, str]] = None,
        notes: Optional[str] = None
    ) -> Optional[AttendanceModel]:
        """Record a check-out for a volunteer"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        attendance = await AttendanceDB.get_by_id(attendance_id)
        if not attendance:
            return None
        
        check_out_time = datetime.now(timezone.utc)
        
        # Calculate hours worked
        hours_worked = (check_out_time - attendance.checkInTime).total_seconds() / 3600
        
        # Determine status
        status = AttendanceStatus.CHECKED_OUT
        
        # Check if early departure (more than 1 hour before shift end)
        # This would require shift information, simplified for now
        
        update_data = {
            "checkOutTime": check_out_time,
            "checkOutMethod": check_out_method,
            "checkOutBy": ObjectId(check_out_by) if isinstance(check_out_by, ObjectId) else check_out_by,
            "hoursWorked": round(hours_worked, 2),
            "status": status,
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if notes:
            update_data["notes"] = [notes]
        
        result = await collection.update_one(
            {"_id": ObjectId(attendance_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            updated_attendance = await AttendanceDB.get_by_id(attendance_id)
            
            # Update shift if provided
            if updated_attendance and updated_attendance.shiftId:
                from .shift import ShiftDB
                shift = await ShiftDB.get_by_id(updated_attendance.shiftId)
                if shift:
                    for assignment in shift.assignments:
                        if str(assignment.volunteerId) == str(updated_attendance.volunteerId):
                            await ShiftDB.check_out_volunteer(
                                updated_attendance.shiftId,
                                updated_attendance.volunteerId,
                                assignment.slotIndex
                            )
                            break
            
            return updated_attendance
        return None
    
    @staticmethod
    async def mark_no_show(
        attendance_id: Union[ObjectId, str],
        notes: Optional[str] = None
    ) -> Optional[AttendanceModel]:
        """Mark a volunteer as no-show"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        update_data = {
            "status": AttendanceStatus.NO_SHOW,
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if notes:
            update_data["notes"] = [notes]
        
        result = await collection.update_one(
            {"_id": ObjectId(attendance_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await AttendanceDB.get_by_id(attendance_id)
        return None
    
    @staticmethod
    async def get_event_attendance(event_id: Union[ObjectId, str]) -> List[AttendanceModel]:
        """Get all attendance records for an event"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        query = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        }
        
        attendances = []
        async for attendance_data in collection.find(query):
            attendances.append(AttendanceModel(**attendance_data))
        
        return attendances
    
    @staticmethod
    async def get_volunteer_attendance(volunteer_id: Union[ObjectId, str]) -> List[AttendanceModel]:
        """Get all attendance records for a volunteer"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        query = {
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id
        }
        
        attendances = []
        async for attendance_data in collection.find(query):
            attendances.append(AttendanceModel(**attendance_data))
        
        return attendances
    
    @staticmethod
    async def get_volunteer_total_hours(volunteer_id: Union[ObjectId, str]) -> float:
        """Get total volunteer hours for a volunteer"""
        collection = db.get_collection(Collections.ATTENDANCE)
        
        query = {
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "status": {"$in": [AttendanceStatus.CHECKED_OUT, AttendanceStatus.LATE, AttendanceStatus.EARLY_DEPARTURE]}
        }
        
        cursor = collection.find(query)
        total_hours = 0.0
        async for record in cursor:
            total_hours += record.get("hoursWorked", 0)
        
        return round(total_hours, 2)
