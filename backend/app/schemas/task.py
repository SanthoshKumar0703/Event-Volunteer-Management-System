"""
EventFlow Task Schemas
Pydantic schemas for task validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..models.task import TaskStatus, TaskPriority, TaskType


# Request Schemas
class TaskRequirementCreate(BaseModel):
    skill: Optional[str] = None
    experienceLevel: Optional[str] = None
    certification: Optional[str] = None
    equipment: Optional[str] = None


class TaskAttachmentCreate(BaseModel):
    filename: str = Field(..., description="Attachment filename")
    url: str = Field(..., description="Attachment URL")


class TaskCommentCreate(BaseModel):
    comment: str = Field(..., description="Comment text")
    isPublic: bool = True


class TaskChecklistItemCreate(BaseModel):
    title: str = Field(..., description="Checklist item title")
    completed: bool = False


class TaskCreate(BaseModel):
    eventId: str = Field(..., description="Event ID")
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: str = Field(..., min_length=1, max_length=5000, description="Task description")
    taskType: TaskType = TaskType.OTHER
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    assignmentId: Optional[str] = Field(None, description="Assignment ID")
    volunteerId: Optional[str] = Field(None, description="Volunteer ID")
    dueDate: Optional[datetime] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    estimatedHours: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=200)
    requirements: List[TaskRequirementCreate] = Field(default_factory=list)
    attachments: List[TaskAttachmentCreate] = Field(default_factory=list)
    checklists: List[TaskChecklistItemCreate] = Field(default_factory=list)
    isRecurring: bool = False
    recurrencePattern: Optional[str] = None
    recurrenceEndDate: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=5000)
    taskType: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    assignmentId: Optional[str] = None
    volunteerId: Optional[str] = None
    dueDate: Optional[datetime] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    estimatedHours: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=200)
    requirements: Optional[List[TaskRequirementCreate]] = None
    attachments: Optional[List[TaskAttachmentCreate]] = None
    checklists: Optional[List[TaskChecklistItemCreate]] = None
    isRecurring: Optional[bool] = None
    recurrencePattern: Optional[str] = None
    recurrenceEndDate: Optional[datetime] = None
    notes: Optional[List[str]] = None
    cancellationReason: Optional[str] = None


class TaskAssign(BaseModel):
    volunteerId: str = Field(..., description="Volunteer ID")
    notes: Optional[str] = None


class TaskStart(BaseModel):
    pass


class TaskComplete(BaseModel):
    actualHours: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class TaskCancel(BaseModel):
    reason: Optional[str] = None


class TaskAddComment(BaseModel):
    comment: str = Field(..., description="Comment text")
    isPublic: bool = True


# Response Schemas
class TaskRequirementResponse(BaseModel):
    skill: Optional[str] = None
    experienceLevel: Optional[str] = None
    certification: Optional[str] = None
    equipment: Optional[str] = None


class TaskAttachmentResponse(BaseModel):
    filename: str
    url: str
    uploadedBy: str
    uploadedAt: datetime


class TaskCommentResponse(BaseModel):
    comment: str
    postedBy: str
    postedAt: datetime
    isPublic: bool = True


class TaskChecklistItemResponse(BaseModel):
    title: str
    completed: bool


class TaskResponse(BaseModel):
    id: str
    taskId: str
    eventId: str
    title: str
    description: str
    taskType: TaskType
    priority: TaskPriority
    status: TaskStatus
    assignmentId: Optional[str] = None
    volunteerId: Optional[str] = None
    dueDate: Optional[datetime] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    location: Optional[str] = None
    requirements: List[TaskRequirementResponse] = Field(default_factory=list)
    attachments: List[TaskAttachmentResponse] = Field(default_factory=list)
    comments: List[TaskCommentResponse] = Field(default_factory=list)
    checklists: List[TaskChecklistItemResponse] = Field(default_factory=list)
    isRecurring: bool = False
    recurrencePattern: Optional[str] = None
    recurrenceEndDate: Optional[datetime] = None
    assignedBy: Optional[str] = None
    assignedAt: Optional[datetime] = None
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime


class TaskSummaryResponse(BaseModel):
    id: str
    taskId: str
    eventId: str
    title: str
    description: str
    taskType: TaskType
    priority: TaskPriority
    status: TaskStatus
    dueDate: Optional[datetime] = None
    volunteerId: Optional[str] = None
    volunteerName: Optional[str] = None
    eventTitle: Optional[str] = None


class TaskStatsResponse(BaseModel):
    total: int
    pending: int
    assigned: int
    in_progress: int
    completed: int
    cancelled: int
    overdue: int


# Query Parameters
class TaskQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    event_id: Optional[str] = None
    volunteer_id: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    search: Optional[str] = None
    due_before: Optional[str] = None
    due_after: Optional[str] = None
    sort_by: str = "dueDate"
    sort_order: int = 1


__all__ = [
    'TaskCreate',
    'TaskUpdate',
    'TaskAssign',
    'TaskStart',
    'TaskComplete',
    'TaskCancel',
    'TaskAddComment',
    'TaskResponse',
    'TaskSummaryResponse',
    'TaskStatsResponse',
    'TaskRequirementCreate',
    'TaskRequirementResponse',
    'TaskAttachmentCreate',
    'TaskAttachmentResponse',
    'TaskCommentCreate',
    'TaskCommentResponse',
    'TaskChecklistItemCreate',
    'TaskChecklistItemResponse',
    'TaskQueryParams',
]
