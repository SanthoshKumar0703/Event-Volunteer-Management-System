"""
EventFlow Badge Schemas
Pydantic schemas for badge validation
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime

from ..models.badge import BadgeCategory, BadgeRarity


# Request Schemas
class BadgeCriteriaCreate(BaseModel):
    type: str = Field(..., description="Criteria type")
    target: Union[int, float, str] = Field(..., description="Target value")
    comparison: str = Field("gte", description="Comparison operator")
    description: str = Field(..., description="Criteria description")


class BadgeTierCreate(BaseModel):
    name: str = Field(..., description="Tier name")
    level: int = Field(..., ge=0, description="Tier level")
    criteria: List[BadgeCriteriaCreate] = Field(default_factory=list)
    image: Optional[str] = Field(None, description="Tier image URL")
    description: Optional[str] = Field(None, description="Tier description")


class BadgeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Badge name")
    description: str = Field(..., min_length=1, max_length=500, description="Badge description")
    category: BadgeCategory
    rarity: BadgeRarity
    image: Optional[str] = Field(None, max_length=500, description="Badge image URL")
    icon: Optional[str] = Field(None, max_length=500, description="Badge icon URL")
    color: str = Field("#FF7A33", description="Badge color")
    criteria: List[BadgeCriteriaCreate] = Field(default_factory=list)
    tiers: List[BadgeTierCreate] = Field(default_factory=list)
    points: int = Field(0, ge=0, description="Points value")
    isActive: bool = True
    order: int = Field(0, ge=0, description="Display order")
    tags: List[str] = Field(default_factory=list)


class BadgeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[BadgeCategory] = None
    rarity: Optional[BadgeRarity] = None
    image: Optional[str] = Field(None, max_length=500)
    icon: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = None
    criteria: Optional[List[BadgeCriteriaCreate]] = None
    tiers: Optional[List[BadgeTierCreate]] = None
    points: Optional[int] = Field(None, ge=0)
    isActive: Optional[bool] = None
    order: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None


class VolunteerBadgeAward(BaseModel):
    badgeId: str = Field(..., description="Badge ID")
    tier: Optional[str] = Field(None, description="Tier achieved")
    notes: Optional[str] = Field(None, description="Award notes")


# Response Schemas
class BadgeCriteriaResponse(BaseModel):
    type: str
    target: Union[int, float, str]
    comparison: str
    description: str


class BadgeTierResponse(BaseModel):
    name: str
    level: int
    criteria: List[BadgeCriteriaResponse] = Field(default_factory=list)
    image: Optional[str] = None
    description: Optional[str] = None


class BadgeResponse(BaseModel):
    id: str
    badgeId: str
    name: str
    description: str
    category: BadgeCategory
    rarity: BadgeRarity
    image: Optional[str] = None
    icon: Optional[str] = None
    color: str
    criteria: List[BadgeCriteriaResponse] = Field(default_factory=list)
    tiers: List[BadgeTierResponse] = Field(default_factory=list)
    points: int
    isActive: bool
    order: int
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime


class BadgeSummaryResponse(BaseModel):
    id: str
    badgeId: str
    name: str
    description: str
    category: BadgeCategory
    rarity: BadgeRarity
    image: Optional[str] = None
    color: str
    points: int
    isEarned: bool = False
    earnedAt: Optional[datetime] = None
    currentTier: Optional[str] = None


class BadgeStatsResponse(BaseModel):
    total: int
    participation: int
    performance: int
    skills: int
    time: int
    achievement: int
    special: int
    common: int
    uncommon: int
    rare: int
    epic: int
    legendary: int


class VolunteerBadgeResponse(BaseModel):
    id: str
    volunteerId: str
    badgeId: str
    earnedAt: datetime
    tier: Optional[str] = None
    awardedBy: Optional[str] = None
    notes: Optional[str] = None


# Query Parameters
class BadgeQueryParams(BaseModel):
    skip: int = 0
    limit: int = 100
    category: Optional[BadgeCategory] = None
    rarity: Optional[BadgeRarity] = None
    is_active: Optional[bool] = None
    search: Optional[str] = None
    sort_by: str = "order"
    sort_order: int = 1


__all__ = [
    'BadgeCreate',
    'BadgeUpdate',
    'VolunteerBadgeAward',
    'BadgeResponse',
    'BadgeSummaryResponse',
    'BadgeStatsResponse',
    'VolunteerBadgeResponse',
    'BadgeCriteriaCreate',
    'BadgeCriteriaResponse',
    'BadgeTierCreate',
    'BadgeTierResponse',
    'BadgeQueryParams',
]
