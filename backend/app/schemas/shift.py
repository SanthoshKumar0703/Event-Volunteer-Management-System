"""
EventFlow Shift Schemas
Pydantic schemas for shift validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..models.shift import ShiftStatus


# Request Schemas
class ShiftSlotCreate(BaseModel):
    startTime: str = Field(..., description="HH:mm format")
    endTime: str = Field(..., description="HH:mm format")
    maxVolunteers: int = Field(..., ge=0, description="Maximum volunteers for this slot")
    currentVolunteers: int = 0
    isActive: bool = True


class ShiftRequirementCreate(BaseModel):
    roleId: Optional[str] = Field(None, description="Role ID")
    roleName: Optional[str] = Field(None, description="Role name")
    minVolunteers: int = Field(0, ge=0, description="Minimum volunteers required")
    maxVolunteers: Optional[int] = Field(None, ge=0, description="Maximum volunteers")
    requiredSkills: List[str] = Field(default_factory=list, description="Required skills")


class ShiftAssignmentCreate(BaseModel):
    volunteerId: str = Field(..., description="Volunteer ID")
    assignmentId: Optional[str] = Field(None, description="Assignment ID")
    slotIndex: int = Field(..., ge=0, description="Slot index")
    status: str = "ASSIGNED"
    checkedIn: bool = False
    checkedOut: bool = False


class ShiftCreate(BaseModel):
    eventId: str = Field(..., description="Event ID")
    title: str = Field(..., min_length=1, max_length=200, description="Shift title")
    description: Optional[str] = Field(None, max_length=500, description="Shift description")
    date: datetime = Field(..., description="Shift date")
    slots: List[ShiftSlotCreate] = Field(default_factory=list, description="Shift slots")
    requirements: List[ShiftRequirementCreate] = Field(default_factory=list, description="Shift requirements")
    assignments: List[ShiftAssignmentCreate] = Field(default_factory=list, description="Shift assignments")
    status: ShiftStatus = ShiftStatus.DRAFT
    location: Optional[str] = Field(None, max_length=200)
    notes: List[str] = Field(default_factory=list)


class ShiftUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    date: Optional[datetime] = None
    slots: Optional[List[ShiftSlotCreate]] = None
    requirements: Optional[List[ShiftRequirementCreate]] = None
    status: Optional[ShiftStatus] = None
    location: Optional[str] = Field(None, max_length=200)
    notes: Optional[List[str]] = None


class ShiftAssignVolunteer(BaseModel):
    volunteerId: str = Field(..., description="Volunteer ID")
    slotIndex: int = Field(..., ge=0, description="Slot index")
    assignmentId: Optional[str] = Field(None, description="Assignment ID")


class ShiftRemoveVolunteer(BaseModel):
    volunteerId: str = Field(..., description="Volunteer ID")
    slotIndex: int = Field(..., ge=0, description="Slot index")


# Response Schemas
class ShiftSlotResponse(BaseModel):
    startTime: str
    endTime: str
    maxVolunteers: int
    currentVolunteers: int = 0
    isActive: bool = True


class ShiftRequirementResponse(BaseModel):
    roleId: Optional[str] = None
    roleName: Optional[str] = None
    minVolunteers: int = 0
    maxVolunteers: Optional[int] = None
    requiredSkills: List[str] = Field(default_factory=list)


class ShiftAssignmentResponse(BaseModel):
    volunteerId: str
    assignmentId: Optional[str] = None
    slotIndex: int
    status: str
    checkedIn: bool = False
    checkedOut: bool = False
    checkInTime: Optional[datetime] = None
    checkOutTime: Optional[datetime] = None


class ShiftResponse(BaseModel):
    id: str
    shiftId: str
    eventId: str
    title: str
    description: Optional[str] = None
    date: datetime
    slots: List[ShiftSlotResponse] = Field(default_factory=list)
    requirements: List[ShiftRequirementResponse] = Field(default_factory=list)
    assignments: List[ShiftAssignmentResponse] = Field(default_factory=list)
    status: ShiftStatus
    location: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    createdBy: str
    createdAt: datetime
    updatedAt: datetime
    publishedAt: Optional[datetime] = None


class ShiftSummaryResponse(BaseModel):
    id: str
    shiftId: str
    eventId: str
    title: str
    date: datetime
    status: ShiftStatus
    totalSlots: int
    totalAssigned: int
    totalRequired: int
    eventTitle: Optional[str] = None


class ShiftStatsResponse(BaseModel):
    total: int
    draft: int
    open: int
    full: int
    closed: int
    cancelled: int


# Query Parameters
class ShiftQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    event_id: Optional[str] = None
    status: Optional[ShiftStatus] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    search: Optional[str] = None
    sort_by: str = "date"
    sort_order: int = 1


__all__ = [
    'ShiftCreate',
    'ShiftUpdate',
    'ShiftAssignVolunteer',
    'ShiftRemoveVolunteer',
    'ShiftResponse',
    'ShiftSummaryResponse',
    'ShiftStatsResponse',
    'ShiftSlotCreate',
    'ShiftSlotResponse',
    'ShiftRequirementCreate',
    'ShiftRequirementResponse',
    'ShiftAssignmentCreate',
    'ShiftAssignmentResponse',
    'ShiftQueryParams',
]
