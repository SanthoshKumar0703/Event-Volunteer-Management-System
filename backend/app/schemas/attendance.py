"""
EventFlow Attendance Schemas
Pydantic schemas for attendance validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..models.attendance import AttendanceStatus, CheckInMethod


# Request Schemas
class AttendanceCheckIn(BaseModel):
    shiftId: Optional[str] = Field(None, description="Shift ID")
    assignmentId: Optional[str] = Field(None, description="Assignment ID")
    qrToken: Optional[str] = Field(None, description="QR token")
    checkInMethod: CheckInMethod = CheckInMethod.QR_CODE
    checkInBy: Optional[str] = Field(None, description="Who checked in the volunteer")
    healthDeclaration: Optional[dict] = None
    temperature: Optional[float] = None


class AttendanceCheckOut(BaseModel):
    checkOutMethod: CheckInMethod = CheckInMethod.QR_CODE
    checkOutBy: Optional[str] = Field(None, description="Who checked out the volunteer")
    notes: Optional[str] = None


class AttendanceMarkNoShow(BaseModel):
    notes: Optional[str] = None


# Response Schemas
class AttendanceResponse(BaseModel):
    id: str
    attendanceId: str
    eventId: str
    volunteerId: str
    shiftId: Optional[str] = None
    assignmentId: Optional[str] = None
    status: AttendanceStatus
    checkInTime: datetime
    checkOutTime: Optional[datetime] = None
    checkInMethod: CheckInMethod
    checkOutMethod: Optional[CheckInMethod] = None
    qrToken: Optional[str] = None
    checkInBy: Optional[str] = None
    checkOutBy: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    hoursWorked: float = 0.0
    isLate: bool = False
    isEarlyDeparture: bool = False
    temperature: Optional[float] = None
    healthDeclaration: Optional[dict] = None
    signature: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime


class AttendanceSummaryResponse(BaseModel):
    id: str
    attendanceId: str
    eventId: str
    volunteerId: str
    shiftId: Optional[str] = None
    status: AttendanceStatus
    checkInTime: datetime
    checkOutTime: Optional[datetime] = None
    hoursWorked: float
    volunteerName: Optional[str] = None
    eventTitle: Optional[str] = None


class AttendanceStatsResponse(BaseModel):
    total: int
    checkedIn: int
    checkedOut: int
    noShow: int
    late: int
    earlyDeparture: int
    totalHours: float
    averageHours: float


# Query Parameters
class AttendanceQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    event_id: Optional[str] = None
    volunteer_id: Optional[str] = None
    shift_id: Optional[str] = None
    status: Optional[AttendanceStatus] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    search: Optional[str] = None
    sort_by: str = "checkInTime"
    sort_order: int = -1


__all__ = [
    'AttendanceCheckIn',
    'AttendanceCheckOut',
    'AttendanceMarkNoShow',
    'AttendanceResponse',
    'AttendanceSummaryResponse',
    'AttendanceStatsResponse',
    'AttendanceQueryParams',
]
