"""
EventFlow Application Schemas
Pydantic schemas for application validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..models.application import ApplicationStatus


# Request Schemas
class ApplicationAnswerCreate(BaseModel):
    questionId: str = Field(..., description="ID of the question")
    question: str = Field(..., description="Question text")
    answer: str = Field(..., description="Answer text")


class ApplicationSkillMatchCreate(BaseModel):
    skill: str = Field(..., description="Skill name")
    matchScore: float = Field(..., ge=0, le=100, description="Match score percentage")
    required: bool = Field(False, description="Whether this skill is required")


class ApplicationCreate(BaseModel):
    eventId: str = Field(..., description="Event ID")
    roleId: Optional[str] = Field(None, description="Role ID (optional)")
    coverLetter: Optional[str] = Field(None, max_length=2000, description="Cover letter")
    answers: List[ApplicationAnswerCreate] = Field(default_factory=list, description="Answers to application questions")
    skillMatches: List[ApplicationSkillMatchCreate] = Field(default_factory=list, description="Skill matches")
    matchScore: Optional[float] = Field(None, ge=0, le=100, description="Overall match score")
    priority: Optional[int] = Field(None, description="Application priority")


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    coverLetter: Optional[str] = Field(None, max_length=2000)
    answers: Optional[List[ApplicationAnswerCreate]] = None
    skillMatches: Optional[List[ApplicationSkillMatchCreate]] = None
    matchScore: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[List[str]] = None
    rejectionReason: Optional[str] = None
    withdrawalReason: Optional[str] = None
    priority: Optional[int] = None


class ApplicationApprove(BaseModel):
    status: ApplicationStatus = ApplicationStatus.APPROVED
    notes: Optional[str] = None


class ApplicationReject(BaseModel):
    status: ApplicationStatus = ApplicationStatus.REJECTED
    rejectionReason: Optional[str] = None
    notes: Optional[str] = None


class ApplicationWithdraw(BaseModel):
    withdrawalReason: Optional[str] = None


# Response Schemas
class ApplicationAnswerResponse(BaseModel):
    questionId: str
    question: str
    answer: str
    createdAt: datetime


class ApplicationSkillMatchResponse(BaseModel):
    skill: str
    matchScore: float
    required: bool


class ApplicationResponse(BaseModel):
    id: str
    applicationId: str
    eventId: str
    volunteerId: str
    roleId: Optional[str] = None
    status: ApplicationStatus
    applicationDate: datetime
    coverLetter: Optional[str] = None
    answers: List[ApplicationAnswerResponse] = Field(default_factory=list)
    skillMatches: List[ApplicationSkillMatchResponse] = Field(default_factory=list)
    matchScore: float = 0.0
    notes: List[str] = Field(default_factory=list)
    reviewedBy: Optional[str] = None
    reviewedAt: Optional[datetime] = None
    approvedAt: Optional[datetime] = None
    rejectedAt: Optional[datetime] = None
    rejectionReason: Optional[str] = None
    withdrawnAt: Optional[datetime] = None
    withdrawalReason: Optional[str] = None
    priority: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime


class ApplicationSummaryResponse(BaseModel):
    id: str
    applicationId: str
    eventId: str
    volunteerId: str
    roleId: Optional[str] = None
    status: ApplicationStatus
    matchScore: float
    applicationDate: datetime
    coverLetter: Optional[str] = None
    eventTitle: Optional[str] = None
    volunteerName: Optional[str] = None
    roleName: Optional[str] = None


class ApplicationStatsResponse(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    withdrawn: int


# Query Parameters
class ApplicationQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    event_id: Optional[str] = None
    volunteer_id: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    search: Optional[str] = None
    sort_by: str = "applicationDate"
    sort_order: int = -1


__all__ = [
    'ApplicationCreate',
    'ApplicationUpdate',
    'ApplicationApprove',
    'ApplicationReject',
    'ApplicationWithdraw',
    'ApplicationResponse',
    'ApplicationSummaryResponse',
    'ApplicationStatsResponse',
    'ApplicationAnswerCreate',
    'ApplicationAnswerResponse',
    'ApplicationSkillMatchCreate',
    'ApplicationSkillMatchResponse',
    'ApplicationQueryParams',
]
