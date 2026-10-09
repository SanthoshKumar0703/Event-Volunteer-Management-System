"""
EventFlow Assignment Schemas
Pydantic schemas for assignment validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..models.assignment import AssignmentStatus


# Request Schemas
class AssignmentCreate(BaseModel):
    eventId: str = Field(..., description="Event ID")
    volunteerId: str = Field(..., description="Volunteer ID")
    roleId: Optional[str] = Field(None, description="Role ID")
    shiftId: Optional[str] = Field(None, description="Shift ID")
    status: AssignmentStatus = AssignmentStatus.PENDING
    notes: List[str] = Field(default_factory=list)


class AssignmentUpdate(BaseModel):
    roleId: Optional[str] = None
    shiftId: Optional[str] = None
    status: Optional[AssignmentStatus] = None
    notes: Optional[List[str]] = None
    cancellationReason: Optional[str] = None


class AssignmentConfirm(BaseModel):
    notes: Optional[str] = None


class AssignmentComplete(BaseModel):
    hoursWorked: Optional[float] = Field(None, ge=0)
    performanceRating: Optional[float] = Field(None, ge=1, le=5)
    feedback: Optional[str] = None


class AssignmentCancel(BaseModel):
    reason: Optional[str] = None


class AssignmentCheckIn(BaseModel):
    checkInTime: Optional[datetime] = None


class AssignmentCheckOut(BaseModel):
    checkOutTime: Optional[datetime] = None
    notes: Optional[str] = None


# Response Schemas
class AssignmentResponse(BaseModel):
    id: str
    assignmentId: str
    eventId: str
    volunteerId: str
    roleId: Optional[str] = None
    shiftId: Optional[str] = None
    status: AssignmentStatus
    assignedAt: datetime
    confirmedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    checkInTime: Optional[datetime] = None
    checkOutTime: Optional[datetime] = None
    hoursWorked: float = 0.0
    performanceRating: Optional[float] = None
    feedback: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime


class AssignmentSummaryResponse(BaseModel):
    id: str
    assignmentId: str
    eventId: str
    volunteerId: str
    roleId: Optional[str] = None
    shiftId: Optional[str] = None
    status: AssignmentStatus
    assignedAt: datetime
    hoursWorked: float
    eventTitle: Optional[str] = None
    volunteerName: Optional[str] = None
    roleName: Optional[str] = None
    shiftTime: Optional[str] = None


class AssignmentStatsResponse(BaseModel):
    total: int
    pending: int
    assigned: int
    confirmed: int
    completed: int
    cancelled: int


# Query Parameters
class AssignmentQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    event_id: Optional[str] = None
    volunteer_id: Optional[str] = None
    status: Optional[AssignmentStatus] = None
    search: Optional[str] = None
    sort_by: str = "assignedAt"
    sort_order: int = -1


__all__ = [
    'AssignmentCreate',
    'AssignmentUpdate',
    'AssignmentConfirm',
    'AssignmentComplete',
    'AssignmentCancel',
    'AssignmentCheckIn',
    'AssignmentCheckOut',
    'AssignmentResponse',
    'AssignmentSummaryResponse',
    'AssignmentStatsResponse',
    'AssignmentQueryParams',
]
