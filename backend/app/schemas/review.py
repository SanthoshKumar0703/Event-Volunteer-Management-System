"""
EventFlow Review Schemas
Pydantic schemas for review validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from ..models.review import ReviewType, ReviewStatus


# Request Schemas
class ReviewDimensionCreate(BaseModel):
    name: str = Field(..., description="Dimension name")
    description: str = Field(..., description="Dimension description")
    score: Optional[float] = Field(None, ge=0, le=10, description="Score (0-10)")
    maxScore: float = Field(5.0, description="Maximum score")
    weight: float = Field(1.0, description="Weight for calculation")


class ReviewCommentCreate(BaseModel):
    comment: str = Field(..., description="Comment text")
    isPublic: bool = True


class ReviewCreate(BaseModel):
    revieweeId: str = Field(..., description="User being reviewed")
    eventId: Optional[str] = Field(None, description="Event context")
    assignmentId: Optional[str] = Field(None, description="Assignment context")
    reviewType: ReviewType = ReviewType.VOLUNTEER
    title: Optional[str] = Field(None, max_length=200)
    overallRating: Optional[float] = Field(None, ge=1, le=5, description="Overall rating (1-5)")
    dimensions: List[ReviewDimensionCreate] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    areasForImprovement: List[str] = Field(default_factory=list)
    comments: List[str] = Field(default_factory=list)
    feedback: Optional[str] = Field(None, max_length=2000)
    isAnonymous: bool = False
    isPublic: bool = False
    tags: List[str] = Field(default_factory=list)


class ReviewUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    overallRating: Optional[float] = Field(None, ge=1, le=5)
    dimensions: Optional[List[ReviewDimensionCreate]] = None
    strengths: Optional[List[str]] = None
    areasForImprovement: Optional[List[str]] = None
    comments: Optional[List[str]] = None
    feedback: Optional[str] = Field(None, max_length=2000)
    isAnonymous: Optional[bool] = None
    isPublic: Optional[bool] = None
    tags: Optional[List[str]] = None


class ReviewSubmit(BaseModel):
    pass


class ReviewPublish(BaseModel):
    pass


class ReviewAddComment(BaseModel):
    comment: str = Field(..., description="Comment text")
    isPublic: bool = True


# Response Schemas
class ReviewDimensionResponse(BaseModel):
    name: str
    description: str
    score: Optional[float] = None
    maxScore: float = 5.0
    weight: float = 1.0


class ReviewCommentResponse(BaseModel):
    comment: str
    postedBy: str
    postedAt: datetime
    isPublic: bool = True


class ReviewResponse(BaseModel):
    id: str
    reviewId: str
    reviewerId: str
    revieweeId: str
    eventId: Optional[str] = None
    assignmentId: Optional[str] = None
    reviewType: ReviewType
    status: ReviewStatus
    title: Optional[str] = None
    overallRating: Optional[float] = None
    overallScore: Optional[float] = None
    dimensions: List[ReviewDimensionResponse] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    areasForImprovement: List[str] = Field(default_factory=list)
    comments: List[ReviewCommentResponse] = Field(default_factory=list)
    feedback: Optional[str] = None
    isAnonymous: bool = False
    isPublic: bool = False
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime
    submittedAt: Optional[datetime] = None
    publishedAt: Optional[datetime] = None


class ReviewSummaryResponse(BaseModel):
    id: str
    reviewId: str
    reviewerId: str
    revieweeId: str
    eventId: Optional[str] = None
    reviewType: ReviewType
    status: ReviewStatus
    overallRating: Optional[float] = None
    overallScore: Optional[float] = None
    submittedAt: Optional[datetime] = None
    reviewerName: Optional[str] = None
    revieweeName: Optional[str] = None
    eventTitle: Optional[str] = None


class ReviewStatsResponse(BaseModel):
    total: int
    averageRating: float
    ratingDistribution: dict
    pending: int
    submitted: int
    published: int


# Query Parameters
class ReviewQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    reviewer_id: Optional[str] = None
    reviewee_id: Optional[str] = None
    event_id: Optional[str] = None
    review_type: Optional[ReviewType] = None
    status: Optional[ReviewStatus] = None
    search: Optional[str] = None
    sort_by: str = "submittedAt"
    sort_order: int = -1


__all__ = [
    'ReviewCreate',
    'ReviewUpdate',
    'ReviewSubmit',
    'ReviewPublish',
    'ReviewAddComment',
    'ReviewResponse',
    'ReviewSummaryResponse',
    'ReviewStatsResponse',
    'ReviewDimensionCreate',
    'ReviewDimensionResponse',
    'ReviewCommentCreate',
    'ReviewCommentResponse',
    'ReviewQueryParams',
]
