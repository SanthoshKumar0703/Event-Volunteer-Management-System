"""
EventFlow Badge Model
MongoDB badge document model for volunteer badges and achievements
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class BadgeCategory(str, Enum):
    PARTICIPATION = "PARTICIPATION"
    PERFORMANCE = "PERFORMANCE"
    SKILLS = "SKILLS"
    TIME = "TIME"
    ACHIEVEMENT = "ACHIEVEMENT"
    SPECIAL = "SPECIAL"


class BadgeRarity(str, Enum):
    COMMON = "COMMON"
    UNCOMMON = "UNCOMMON"
    RARE = "RARE"
    EPIC = "EPIC"
    LEGENDARY = "LEGENDARY"


# Sub-models
class BadgeCriteria(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    type: str  # events_completed, hours_volunteered, skills_mastered, etc.
    target: Union[int, float, str]  # Target value to achieve
    comparison: str = "gte"  # gte, lte, eq, gt, lt
    description: str


class BadgeTier(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    name: str
    level: int
    criteria: List[BadgeCriteria]
    image: Optional[str] = None
    description: Optional[str] = None


class VolunteerBadgeModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Model for tracking which badges a volunteer has earned"""
    
    _id: Optional[ObjectId] = None
    volunteerId: Union[ObjectId, str]
    badgeId: Union[ObjectId, str]
    earnedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tier: Optional[str] = None  # Which tier was achieved
    progress: Optional[Dict[str, Any]] = None  # Progress towards next tier
    awardedBy: Optional[Union[ObjectId, str]] = None
    notes: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["volunteerId"] = str(data["volunteerId"]) if data["volunteerId"] else None
        data["badgeId"] = str(data["badgeId"]) if data["badgeId"] else None
        data["awardedBy"] = str(data["awardedBy"]) if data["awardedBy"] else None
        return data


# Main Badge Model
class BadgeModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    badgeId: str
    name: str
    description: str
    category: BadgeCategory
    rarity: BadgeRarity
    image: Optional[str] = None
    icon: Optional[str] = None
    color: str = "#FF7A33"  # Default to primary color
    criteria: List[BadgeCriteria] = Field(default_factory=list)
    tiers: List[BadgeTier] = Field(default_factory=list)
    points: int = 0  # Points value for gamification
    isActive: bool = True
    order: int = 0  # Display order
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        return data


class BadgeSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified badge model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
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
    
    @classmethod
    def from_badge(
        cls,
        badge: BadgeModel,
        is_earned: bool = False,
        earned_at: Optional[datetime] = None,
        current_tier: Optional[str] = None
    ) -> "BadgeSummaryModel":
        """Create a summary from a full badge model"""
        return cls(
            _id=str(badge._id) if badge._id else None,
            badgeId=badge.badgeId,
            name=badge.name,
            description=badge.description,
            category=badge.category,
            rarity=badge.rarity,
            image=badge.image,
            color=badge.color,
            points=badge.points,
            isEarned=is_earned,
            earnedAt=earned_at,
            currentTier=current_tier
        )


# Database Operations
class BadgeDB:
    """Badge database operations"""
    
    @staticmethod
    async def create(badge_data: Dict[str, Any]) -> BadgeModel:
        """Create a new badge"""
        collection = db.get_collection(Collections.BADGES)
        
        # Generate badge ID
        from .counter import CounterDB
        badge_id = await CounterDB.get_next_sequence("badge_id")
        badge_data["badgeId"] = f"BDG-{badge_id:04d}"
        
        # Insert badge
        result = await collection.insert_one(badge_data)
        badge_data["_id"] = result.inserted_id
        
        return BadgeModel(**badge_data)
    
    @staticmethod
    async def get_by_id(badge_id: Union[ObjectId, str]) -> Optional[BadgeModel]:
        """Get badge by ID"""
        collection = db.get_collection(Collections.BADGES)
        badge_data = await collection.find_one({"_id": ObjectId(badge_id)})
        if badge_data:
            return BadgeModel(**badge_data)
        return None
    
    @staticmethod
    async def get_by_badge_id(badge_id: str) -> Optional[BadgeModel]:
        """Get badge by badge ID"""
        collection = db.get_collection(Collections.BADGES)
        badge_data = await collection.find_one({"badgeId": badge_id})
        if badge_data:
            return BadgeModel(**badge_data)
        return None
    
    @staticmethod
    async def update(badge_id: Union[ObjectId, str], update_data: Dict[str, Any]) -> Optional[BadgeModel]:
        """Update a badge"""
        collection = db.get_collection(Collections.BADGES)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(badge_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            badge_data = await collection.find_one({"_id": ObjectId(badge_id)})
            return BadgeModel(**badge_data) if badge_data else None
        return None
    
    @staticmethod
    async def delete(badge_id: Union[ObjectId, str]) -> bool:
        """Delete a badge"""
        collection = db.get_collection(Collections.BADGES)
        result = await collection.delete_one({"_id": ObjectId(badge_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        category: Optional[BadgeCategory] = None,
        rarity: Optional[BadgeRarity] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        sort_by: str = "order",
        sort_order: int = 1,
    ) -> List[BadgeModel]:
        """List all badges with optional filters"""
        collection = db.get_collection(Collections.BADGES)
        
        query = {}
        
        if category:
            query["category"] = category
        if rarity:
            query["rarity"] = rarity
        if is_active is not None:
            query["isActive"] = is_active
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"badgeId": {"$regex": search, "$options": "i"}},
            ]
        
        sort_field = sort_by
        if sort_by not in ["name", "category", "rarity", "points", "order", "isActive", "createdAt", "updatedAt"]:
            sort_field = "order"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        badges = []
        async for badge_data in cursor:
            badges.append(BadgeModel(**badge_data))
        
        return badges
    
    @staticmethod
    async def count(
        category: Optional[BadgeCategory] = None,
        rarity: Optional[BadgeRarity] = None,
        is_active: Optional[bool] = None,
    ) -> int:
        """Count badges with optional filters"""
        collection = db.get_collection(Collections.BADGES)
        
        query = {}
        if category:
            query["category"] = category
        if rarity:
            query["rarity"] = rarity
        if is_active is not None:
            query["isActive"] = is_active
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats() -> Dict[str, int]:
        """Get badge statistics"""
        collection = db.get_collection(Collections.BADGES)
        
        return {
            "total": await collection.count_documents({}),
            "participation": await collection.count_documents({"category": BadgeCategory.PARTICIPATION}),
            "performance": await collection.count_documents({"category": BadgeCategory.PERFORMANCE}),
            "skills": await collection.count_documents({"category": BadgeCategory.SKILLS}),
            "time": await collection.count_documents({"category": BadgeCategory.TIME}),
            "achievement": await collection.count_documents({"category": BadgeCategory.ACHIEVEMENT}),
            "special": await collection.count_documents({"category": BadgeCategory.SPECIAL}),
            "common": await collection.count_documents({"rarity": BadgeRarity.COMMON}),
            "uncommon": await collection.count_documents({"rarity": BadgeRarity.UNCOMMON}),
            "rare": await collection.count_documents({"rarity": BadgeRarity.RARE}),
            "epic": await collection.count_documents({"rarity": BadgeRarity.EPIC}),
            "legendary": await collection.count_documents({"rarity": BadgeRarity.LEGENDARY}),
        }


# Volunteer Badge Operations
class VolunteerBadgeDB:
    """Volunteer badge database operations"""
    
    @staticmethod
    async def award_badge(
        volunteer_id: Union[ObjectId, str],
        badge_id: Union[ObjectId, str],
        tier: Optional[str] = None,
        awarded_by: Optional[Union[ObjectId, str]] = None,
        notes: Optional[str] = None
    ) -> VolunteerBadgeModel:
        """Award a badge to a volunteer"""
        collection = db.get_collection(Collections.VOLUNTEER_BADGES)
        
        # Check if already awarded
        existing = await collection.find_one({
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "badgeId": ObjectId(badge_id) if isinstance(badge_id, str) else badge_id
        })
        
        if existing:
            # Update existing
            update_data = {"updatedAt": datetime.now(timezone.utc)}
            if tier:
                update_data["tier"] = tier
            if awarded_by:
                update_data["awardedBy"] = ObjectId(awarded_by) if isinstance(awarded_by, str) else awarded_by
            if notes:
                update_data["notes"] = notes
            
            await collection.update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )
            return VolunteerBadgeModel(**existing)
        
        # Create new
        volunteer_badge_data = {
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "badgeId": ObjectId(badge_id) if isinstance(badge_id, str) else badge_id,
            "earnedAt": datetime.now(timezone.utc),
            "tier": tier,
            "awardedBy": ObjectId(awarded_by) if isinstance(awarded_by, str) else awarded_by,
            "notes": notes
        }
        
        result = await collection.insert_one(volunteer_badge_data)
        volunteer_badge_data["_id"] = result.inserted_id
        
        return VolunteerBadgeModel(**volunteer_badge_data)
    
    @staticmethod
    async def revoke_badge(
        volunteer_id: Union[ObjectId, str],
        badge_id: Union[ObjectId, str]
    ) -> bool:
        """Revoke a badge from a volunteer"""
        collection = db.get_collection(Collections.VOLUNTEER_BADGES)
        
        result = await collection.delete_one({
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "badgeId": ObjectId(badge_id) if isinstance(badge_id, str) else badge_id
        })
        
        return result.deleted_count > 0
    
    @staticmethod
    async def get_volunteer_badges(volunteer_id: Union[ObjectId, str]) -> List[VolunteerBadgeModel]:
        """Get all badges for a volunteer"""
        collection = db.get_collection(Collections.VOLUNTEER_BADGES)
        
        query = {
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id
        }
        
        volunteer_badges = []
        async for vb_data in collection.find(query):
            volunteer_badges.append(VolunteerBadgeModel(**vb_data))
        
        return volunteer_badges
    
    @staticmethod
    async def get_volunteer_badge(
        volunteer_id: Union[ObjectId, str],
        badge_id: Union[ObjectId, str]
    ) -> Optional[VolunteerBadgeModel]:
        """Get a specific badge for a volunteer"""
        collection = db.get_collection(Collections.VOLUNTEER_BADGES)
        
        vb_data = await collection.find_one({
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "badgeId": ObjectId(badge_id) if isinstance(badge_id, str) else badge_id
        })
        
        if vb_data:
            return VolunteerBadgeModel(**vb_data)
        return None
    
    @staticmethod
    async def check_badge_criteria(
        volunteer_id: Union[ObjectId, str],
        badge_id: Union[ObjectId, str]
    ) -> Dict[str, Any]:
        """Check if a volunteer meets the criteria for a badge"""
        from .user import UserDB
        from .assignment import AssignmentDB
        from .attendance import AttendanceDB
        
        # Get badge
        badge = await BadgeDB.get_by_id(badge_id)
        if not badge:
            return {"eligible": False, "message": "Badge not found"}
        
        # Get volunteer
        volunteer = await UserDB.get_by_id(volunteer_id)
        if not volunteer:
            return {"eligible": False, "message": "Volunteer not found"}
        
        # Check each criterion
        criteria_results = []
        all_met = True
        
        for criterion in badge.criteria:
            met = False
            
            if criterion.type == "events_completed":
                # Count completed assignments
                assignments = await AssignmentDB.get_volunteer_assignments(volunteer_id)
                completed = sum(1 for a in assignments if a.status == "COMPLETED")
                met = completed >= int(criterion.target) if criterion.comparison == "gte" else False
                
            elif criterion.type == "hours_volunteered":
                # Get total hours
                total_hours = await AttendanceDB.get_volunteer_total_hours(volunteer_id)
                met = total_hours >= float(criterion.target) if criterion.comparison == "gte" else False
                
            elif criterion.type == "skills_mastered":
                # Count skills
                skill_count = len(volunteer.skills) if volunteer.skills else 0
                met = skill_count >= int(criterion.target) if criterion.comparison == "gte" else False
                
            criteria_results.append({
                "type": criterion.type,
                "target": criterion.target,
                "comparison": criterion.comparison,
                "met": met
            })
            
            if not met:
                all_met = False
        
        return {
            "eligible": all_met,
            "badge": badge.to_dict(),
            "criteria": criteria_results
        }
    
    @staticmethod
    async def check_all_badges(
        volunteer_id: Union[ObjectId, str]
    ) -> List[Dict[str, Any]]:
        """Check all badges for eligibility and award those that are met"""
        from .user import UserDB
        
        # Get all badges
        badges = await BadgeDB.list_all()
        
        results = []
        awarded_count = 0
        
        for badge in badges:
            result = await VolunteerBadgeDB.check_badge_criteria(volunteer_id, badge._id)
            
            if result["eligible"]:
                # Check if already awarded
                existing = await VolunteerBadgeDB.get_volunteer_badge(volunteer_id, badge._id)
                if not existing:
                    # Award the badge
                    await VolunteerBadgeDB.award_badge(volunteer_id, badge._id)
                    awarded_count += 1
                    result["awarded"] = True
                else:
                    result["alreadyAwarded"] = True
            
            results.append(result)
        
        return {
            "totalChecked": len(badges),
            "awarded": awarded_count,
            "results": results
        }
