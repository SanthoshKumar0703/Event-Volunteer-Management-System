"""
EventFlow Announcement Schemas
Pydantic schemas for announcement validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..models.announcement import AnnouncementStatus, AnnouncementPriority, AnnouncementTarget


# Request Schemas
class AnnouncementAttachmentCreate(BaseModel):
    filename: str = Field(..., description="Attachment filename")
    url: str = Field(..., description="Attachment URL")


class AnnouncementCreate(BaseModel):
    eventId: Optional[str] = Field(None, description="Event ID (None for global)")
    title: str = Field(..., min_length=1, max_length=200, description="Announcement title")
    message: str = Field(..., min_length=1, max_length=5000, description="Announcement message")
    status: AnnouncementStatus = AnnouncementStatus.DRAFT
    priority: AnnouncementPriority = AnnouncementPriority.MEDIUM
    target: AnnouncementTarget = AnnouncementTarget.ALL
    targetUserIds: List[str] = Field(default_factory=list, description="Target user IDs")
    targetRoleIds: List[str] = Field(default_factory=list, description="Target role IDs")
    isPinned: bool = False
    attachments: List[AnnouncementAttachmentCreate] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    expiresAt: Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    eventId: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    message: Optional[str] = Field(None, min_length=1, max_length=5000)
    status: Optional[AnnouncementStatus] = None
    priority: Optional[AnnouncementPriority] = None
    target: Optional[AnnouncementTarget] = None
    targetUserIds: Optional[List[str]] = None
    targetRoleIds: Optional[List[str]] = None
    isPinned: Optional[bool] = None
    attachments: Optional[List[AnnouncementAttachmentCreate]] = None
    tags: Optional[List[str]] = None
    expiresAt: Optional[datetime] = None


class AnnouncementPublish(BaseModel):
    pass


class AnnouncementArchive(BaseModel):
    pass


class AnnouncementPin(BaseModel):
    isPinned: bool = True


# Response Schemas
class AnnouncementAttachmentResponse(BaseModel):
    filename: str
    url: str
    uploadedBy: str
    uploadedAt: datetime


class AnnouncementReadReceiptResponse(BaseModel):
    userId: str
    readAt: datetime


class AnnouncementResponse(BaseModel):
    id: str
    announcementId: str
    eventId: Optional[str] = None
    title: str
    message: str
    status: AnnouncementStatus
    priority: AnnouncementPriority
    target: AnnouncementTarget
    targetUserIds: List[str] = Field(default_factory=list)
    targetRoleIds: List[str] = Field(default_factory=list)
    isPinned: bool
    attachments: List[AnnouncementAttachmentResponse] = Field(default_factory=list)
    readReceipts: List[AnnouncementReadReceiptResponse] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    createdBy: str
    publishedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    expiresAt: Optional[datetime] = None


class AnnouncementSummaryResponse(BaseModel):
    id: str
    announcementId: str
    eventId: Optional[str] = None
    title: str
    message: str
    priority: AnnouncementPriority
    status: AnnouncementStatus
    isPinned: bool
    createdBy: str
    publishedAt: Optional[datetime] = None
    readCount: int = 0
    eventTitle: Optional[str] = None
    creatorName: Optional[str] = None


class AnnouncementStatsResponse(BaseModel):
    total: int
    draft: int
    published: int
    archived: int
    pinned: int


# Query Parameters
class AnnouncementQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    event_id: Optional[str] = None
    status: Optional[AnnouncementStatus] = None
    priority: Optional[AnnouncementPriority] = None
    is_pinned: Optional[bool] = None
    search: Optional[str] = None
    sort_by: str = "publishedAt"
    sort_order: int = -1


__all__ = [
    'AnnouncementCreate',
    'AnnouncementUpdate',
    'AnnouncementPublish',
    'AnnouncementArchive',
    'AnnouncementPin',
    'AnnouncementResponse',
    'AnnouncementSummaryResponse',
    'AnnouncementStatsResponse',
    'AnnouncementAttachmentCreate',
    'AnnouncementAttachmentResponse',
    'AnnouncementReadReceiptResponse',
    'AnnouncementQueryParams',
]
