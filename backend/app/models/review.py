"""
EventFlow Review Model
MongoDB review document model for volunteer reviews
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class ReviewType(str, Enum):
    VOLUNTEER = "VOLUNTEER"  # Review of a volunteer by organizer
    ORGANIZER = "ORGANIZER"  # Review of an organizer by volunteer
    EVENT = "EVENT"  # Review of an event by volunteer
    SELF = "SELF"  # Self-review


class ReviewStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


# Sub-models
class ReviewDimension(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    name: str
    description: str
    score: Optional[float] = None  # 1-5 or 1-10
    maxScore: float = 5.0
    weight: float = 1.0  # Weight for overall score calculation


class ReviewComment(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    comment: str
    postedBy: Union[ObjectId, str]
    postedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    isPublic: bool = True


# Main Review Model
class ReviewModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    reviewId: str
    reviewerId: Union[ObjectId, str]
    revieweeId: Union[ObjectId, str]
    eventId: Optional[Union[ObjectId, str]] = None  # Event context for the review
    assignmentId: Optional[Union[ObjectId, str]] = None  # Assignment context
    reviewType: ReviewType
    status: ReviewStatus = ReviewStatus.DRAFT
    title: Optional[str] = None
    overallRating: Optional[float] = None  # Overall rating (1-5)
    overallScore: Optional[float] = None  # Calculated overall score (0-100)
    dimensions: List[ReviewDimension] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    areasForImprovement: List[str] = Field(default_factory=list)
    comments: List[str] = Field(default_factory=list)
    feedback: Optional[str] = None
    isAnonymous: bool = False
    isPublic: bool = False
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submittedAt: Optional[datetime] = None
    publishedAt: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["reviewerId"] = str(data["reviewerId"]) if data["reviewerId"] else None
        data["revieweeId"] = str(data["revieweeId"]) if data["revieweeId"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        data["assignmentId"] = str(data["assignmentId"]) if data["assignmentId"] else None
        return data


class ReviewSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified review model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    reviewId: str
    reviewerId: Union[ObjectId, str]
    revieweeId: Union[ObjectId, str]
    eventId: Optional[Union[ObjectId, str]] = None
    reviewType: ReviewType
    status: ReviewStatus
    overallRating: Optional[float] = None
    overallScore: Optional[float] = None
    submittedAt: Optional[datetime] = None
    reviewerName: Optional[str] = None
    revieweeName: Optional[str] = None
    eventTitle: Optional[str] = None
    
    @classmethod
    def from_review(
        cls,
        review: ReviewModel,
        reviewer_name: Optional[str] = None,
        reviewee_name: Optional[str] = None,
        event_title: Optional[str] = None
    ) -> "ReviewSummaryModel":
        """Create a summary from a full review model"""
        return cls(
            _id=str(review._id) if review._id else None,
            reviewId=review.reviewId,
            reviewerId=str(review.reviewerId) if review.reviewerId else None,
            revieweeId=str(review.revieweeId) if review.revieweeId else None,
            eventId=str(review.eventId) if review.eventId else None,
            reviewType=review.reviewType,
            status=review.status,
            overallRating=review.overallRating,
            overallScore=review.overallScore,
            submittedAt=review.submittedAt,
            reviewerName=reviewer_name,
            revieweeName=reviewee_name,
            eventTitle=event_title
        )


# Database Operations
class ReviewDB:
    """Review database operations"""
    
    @staticmethod
    async def create(review_data: Dict[str, Any]) -> ReviewModel:
        """Create a new review"""
        collection = db.get_collection(Collections.REVIEWS)
        
        # Generate review ID
        from .counter import CounterDB
        review_id = await CounterDB.get_next_sequence("review_id")
        review_data["reviewId"] = f"REV-{review_id:06d}"
        
        # Insert review
        result = await collection.insert_one(review_data)
        review_data["_id"] = result.inserted_id
        
        return ReviewModel(**review_data)
    
    @staticmethod
    async def get_by_id(review_id: Union[ObjectId, str]) -> Optional[ReviewModel]:
        """Get review by ID"""
        collection = db.get_collection(Collections.REVIEWS)
        review_data = await collection.find_one({"_id": ObjectId(review_id)})
        if review_data:
            return ReviewModel(**review_data)
        return None
    
    @staticmethod
    async def get_by_review_id(review_id: str) -> Optional[ReviewModel]:
        """Get review by review ID"""
        collection = db.get_collection(Collections.REVIEWS)
        review_data = await collection.find_one({"reviewId": review_id})
        if review_data:
            return ReviewModel(**review_data)
        return None
    
    @staticmethod
    async def get_by_reviewer_and_reviewee(
        reviewer_id: Union[ObjectId, str],
        reviewee_id: Union[ObjectId, str]
    ) -> Optional[ReviewModel]:
        """Get review by reviewer and reviewee"""
        collection = db.get_collection(Collections.REVIEWS)
        review_data = await collection.find_one({
            "reviewerId": ObjectId(reviewer_id) if isinstance(reviewer_id, str) else reviewer_id,
            "revieweeId": ObjectId(reviewee_id) if isinstance(reviewee_id, str) else reviewee_id
        })
        if review_data:
            return ReviewModel(**review_data)
        return None
    
    @staticmethod
    async def update(review_id: Union[ObjectId, str], update_data: Dict[str, Any]) -> Optional[ReviewModel]:
        """Update a review"""
        collection = db.get_collection(Collections.REVIEWS)
        
        # If submitting, set submittedAt
        if update_data.get("status") == ReviewStatus.SUBMITTED and "submittedAt" not in update_data:
            update_data["submittedAt"] = datetime.now(timezone.utc)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(review_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            review_data = await collection.find_one({"_id": ObjectId(review_id)})
            return ReviewModel(**review_data) if review_data else None
        return None
    
    @staticmethod
    async def delete(review_id: Union[ObjectId, str]) -> bool:
        """Delete a review"""
        collection = db.get_collection(Collections.REVIEWS)
        result = await collection.delete_one({"_id": ObjectId(review_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        reviewer_id: Optional[str] = None,
        reviewee_id: Optional[str] = None,
        event_id: Optional[str] = None,
        review_type: Optional[ReviewType] = None,
        status: Optional[ReviewStatus] = None,
        search: Optional[str] = None,
        sort_by: str = "submittedAt",
        sort_order: int = -1,
    ) -> List[ReviewModel]:
        """List all reviews with optional filters"""
        collection = db.get_collection(Collections.REVIEWS)
        
        query = {}
        
        if reviewer_id:
            query["reviewerId"] = ObjectId(reviewer_id)
        if reviewee_id:
            query["revieweeId"] = ObjectId(reviewee_id)
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if review_type:
            query["reviewType"] = review_type
        if status:
            query["status"] = status
        
        if search:
            query["$or"] = [
                {"reviewId": {"$regex": search, "$options": "i"}},
                {"title": {"$regex": search, "$options": "i"}},
                {"feedback": {"$regex": search, "$options": "i"}},
            ]
        
        sort_field = sort_by
        if sort_by not in ["reviewType", "status", "overallRating", "overallScore", "submittedAt", "createdAt", "updatedAt"]:
            sort_field = "submittedAt"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        reviews = []
        async for review_data in cursor:
            reviews.append(ReviewModel(**review_data))
        
        return reviews
    
    @staticmethod
    async def count(
        reviewer_id: Optional[str] = None,
        reviewee_id: Optional[str] = None,
        event_id: Optional[str] = None,
        review_type: Optional[ReviewType] = None,
        status: Optional[ReviewStatus] = None,
    ) -> int:
        """Count reviews with optional filters"""
        collection = db.get_collection(Collections.REVIEWS)
        
        query = {}
        if reviewer_id:
            query["reviewerId"] = ObjectId(reviewer_id)
        if reviewee_id:
            query["revieweeId"] = ObjectId(reviewee_id)
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if review_type:
            query["reviewType"] = review_type
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats(reviewee_id: Optional[str] = None) -> Dict[str, Any]:
        """Get review statistics"""
        collection = db.get_collection(Collections.REVIEWS)
        
        query = {}
        if reviewee_id:
            query["revieweeId"] = ObjectId(reviewee_id)
        
        # Get all reviews for calculation
        cursor = collection.find({**query, "status": ReviewStatus.SUBMITTED})
        reviews = []
        async for review in cursor:
            reviews.append(review)
        
        total = len(reviews)
        total_rating = sum(r.get("overallRating", 0) for r in reviews)
        avg_rating = total_rating / total if total > 0 else 0
        
        # Count by rating
        rating_distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for review in reviews:
            rating = int(review.get("overallRating", 0))
            if rating in rating_distribution:
                rating_distribution[rating] += 1
        
        return {
            "total": total,
            "averageRating": round(avg_rating, 2),
            "ratingDistribution": rating_distribution,
            "pending": await collection.count_documents({**query, "status": ReviewStatus.DRAFT}),
            "submitted": await collection.count_documents({**query, "status": ReviewStatus.SUBMITTED}),
            "published": await collection.count_documents({**query, "status": ReviewStatus.PUBLISHED}),
        }
    
    @staticmethod
    async def submit(review_id: Union[ObjectId, str]) -> Optional[ReviewModel]:
        """Submit a review"""
        collection = db.get_collection(Collections.REVIEWS)
        
        # Get review to calculate overall score
        review = await ReviewDB.get_by_id(review_id)
        if not review:
            return None
        
        # Calculate overall score from dimensions
        if review.dimensions:
            total_score = 0
            total_weight = 0
            for dimension in review.dimensions:
                if dimension.score is not None:
                    score = (dimension.score / dimension.maxScore) * 100 * dimension.weight
                    total_score += score
                    total_weight += dimension.weight
            
            if total_weight > 0:
                overall_score = total_score / total_weight
        else:
            overall_score = review.overallRating * 20 if review.overallRating else 0
        
        result = await collection.update_one(
            {"_id": ObjectId(review_id)},
            {
                "$set": {
                    "status": ReviewStatus.SUBMITTED,
                    "submittedAt": datetime.now(timezone.utc),
                    "overallScore": round(overall_score, 2),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            review_data = await collection.find_one({"_id": ObjectId(review_id)})
            return ReviewModel(**review_data) if review_data else None
        return None
    
    @staticmethod
    async def publish(review_id: Union[ObjectId, str]) -> Optional[ReviewModel]:
        """Publish a review (make it visible)"""
        collection = db.get_collection(Collections.REVIEWS)
        
        result = await collection.update_one(
            {"_id": ObjectId(review_id)},
            {
                "$set": {
                    "status": ReviewStatus.PUBLISHED,
                    "publishedAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            review_data = await collection.find_one({"_id": ObjectId(review_id)})
            return ReviewModel(**review_data) if review_data else None
        return None
    
    @staticmethod
    async def get_user_reviews(
        user_id: Union[ObjectId, str],
        review_type: Optional[ReviewType] = None
    ) -> List[ReviewModel]:
        """Get all reviews for a user (as reviewer or reviewee)"""
        collection = db.get_collection(Collections.REVIEWS)
        
        query = {
            "$or": [
                {"reviewerId": ObjectId(user_id) if isinstance(user_id, str) else user_id},
                {"revieweeId": ObjectId(user_id) if isinstance(user_id, str) else user_id}
            ]
        }
        
        if review_type:
            query["reviewType"] = review_type
        
        reviews = []
        async for review_data in collection.find(query):
            reviews.append(ReviewModel(**review_data))
        
        return reviews
    
    @staticmethod
    async def get_event_reviews(event_id: Union[ObjectId, str]) -> List[ReviewModel]:
        """Get all reviews for an event"""
        collection = db.get_collection(Collections.REVIEWS)
        
        query = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        }
        
        reviews = []
        async for review_data in collection.find(query):
            reviews.append(ReviewModel(**review_data))
        
        return reviews
    
    @staticmethod
    async def add_comment(
        review_id: Union[ObjectId, str],
        comment: str,
        posted_by: Union[ObjectId, str],
        is_public: bool = True
    ) -> Optional[ReviewModel]:
        """Add a comment to a review"""
        collection = db.get_collection(Collections.REVIEWS)
        
        result = await collection.update_one(
            {"_id": ObjectId(review_id)},
            {
                "$push": {
                    "comments": {
                        "comment": comment,
                        "postedBy": ObjectId(posted_by) if isinstance(posted_by, str) else posted_by,
                        "postedAt": datetime.now(timezone.utc),
                        "isPublic": is_public
                    }
                },
                "$set": {"updatedAt": datetime.now(timezone.utc)}
            }
        )
        
        if result.modified_count > 0:
            review_data = await collection.find_one({"_id": ObjectId(review_id)})
            return ReviewModel(**review_data) if review_data else None
        return None
