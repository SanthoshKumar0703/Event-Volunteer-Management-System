"""
EventFlow Event Schemas
Pydantic schemas for event validation
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

from ..models.event import EventStatus, EventCategory


# Request Schemas
class EventLocationCreate(BaseModel):
    venue: str = Field(..., min_length=1, max_length=200)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postalCode: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EventSocialLinksCreate(BaseModel):
    website: Optional[str] = Field(None, max_length=500)
    facebook: Optional[str] = Field(None, max_length=500)
    twitter: Optional[str] = Field(None, max_length=500)
    instagram: Optional[str] = Field(None, max_length=500)
    linkedin: Optional[str] = Field(None, max_length=500)


class EventSettingsCreate(BaseModel):
    allowOverRegistration: bool = False
    autoApproveApplications: bool = False
    requireSkills: bool = False
    requireAvailability: bool = False
    maxVolunteersPerShift: Optional[int] = None
    minVolunteersPerShift: Optional[int] = None


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    category: EventCategory
    date: datetime = Field(..., description="Event date")
    startTime: str = Field(..., description="HH:mm format")
    endTime: str = Field(..., description="HH:mm format")
    registrationDeadline: datetime = Field(..., description="Registration deadline")
    requiredVolunteers: int = Field(..., ge=0, description="Number of required volunteers")
    maximumVolunteers: Optional[int] = Field(None, ge=0, description="Maximum number of volunteers")
    location: EventLocationCreate
    contactEmail: EmailStr = Field(..., description="Contact email")
    contactPhone: Optional[str] = Field(None, max_length=30)
    requiredSkills: List[str] = Field(default_factory=list, description="List of required skills")
    preferredSkills: List[str] = Field(default_factory=list, description="List of preferred skills")
    tags: List[str] = Field(default_factory=list, description="Event tags")
    socialLinks: Optional[EventSocialLinksCreate] = None
    settings: Optional[EventSettingsCreate] = None
    image: Optional[str] = Field(None, max_length=500, description="Event image URL")
    bannerImage: Optional[str] = Field(None, max_length=500, description="Banner image URL")


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    category: Optional[EventCategory] = None
    status: Optional[EventStatus] = None
    date: Optional[datetime] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    registrationDeadline: Optional[datetime] = None
    requiredVolunteers: Optional[int] = Field(None, ge=0)
    maximumVolunteers: Optional[int] = Field(None, ge=0)
    location: Optional[EventLocationCreate] = None
    contactEmail: Optional[EmailStr] = None
    contactPhone: Optional[str] = Field(None, max_length=30)
    requiredSkills: Optional[List[str]] = None
    preferredSkills: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    socialLinks: Optional[EventSocialLinksCreate] = None
    settings: Optional[EventSettingsCreate] = None
    image: Optional[str] = Field(None, max_length=500)
    bannerImage: Optional[str] = Field(None, max_length=500)


# Response Schemas
class EventLocationResponse(BaseModel):
    venue: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EventSocialLinksResponse(BaseModel):
    website: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    instagram: Optional[str] = None
    linkedin: Optional[str] = None


class EventSettingsResponse(BaseModel):
    allowOverRegistration: bool = False
    autoApproveApplications: bool = False
    requireSkills: bool = False
    requireAvailability: bool = False
    maxVolunteersPerShift: Optional[int] = None
    minVolunteersPerShift: Optional[int] = None


class EventResponse(BaseModel):
    id: str
    eventId: str
    title: str
    description: str
    category: EventCategory
    status: EventStatus
    organizer: str
    location: EventLocationResponse
    date: datetime
    startTime: str
    endTime: str
    registrationDeadline: datetime
    requiredVolunteers: int
    maximumVolunteers: Optional[int] = None
    currentVolunteers: int = 0
    requiredSkills: List[str] = Field(default_factory=list)
    preferredSkills: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    contactEmail: str
    contactPhone: Optional[str] = None
    qrToken: str
    image: Optional[str] = None
    bannerImage: Optional[str] = None
    socialLinks: EventSocialLinksResponse = Field(default_factory=EventSocialLinksResponse)
    settings: EventSettingsResponse = Field(default_factory=EventSettingsResponse)
    requestId: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime
    publishedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None


class EventSummaryResponse(BaseModel):
    id: str
    eventId: str
    title: str
    category: EventCategory
    status: EventStatus
    date: datetime
    startTime: str
    endTime: str
    location: EventLocationResponse
    requiredVolunteers: int
    currentVolunteers: int
    maximumVolunteers: Optional[int] = None
    image: Optional[str] = None
    organizer: Optional[dict] = None


class EventStatsResponse(BaseModel):
    total: int
    draft: int
    pending: int
    open: int
    upcoming: int
    live: int
    completed: int
    cancelled: int


# Query Parameters
class EventQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    status: Optional[EventStatus] = None
    category: Optional[EventCategory] = None
    organizer: Optional[str] = None
    search: Optional[str] = None
    upcoming: bool = False
    my_events: Optional[str] = None


__all__ = [
    'EventCreate',
    'EventUpdate',
    'EventResponse',
    'EventSummaryResponse',
    'EventStatsResponse',
    'EventLocationCreate',
    'EventLocationResponse',
    'EventSocialLinksCreate',
    'EventSocialLinksResponse',
    'EventSettingsCreate',
    'EventSettingsResponse',
    'EventQueryParams',
]
