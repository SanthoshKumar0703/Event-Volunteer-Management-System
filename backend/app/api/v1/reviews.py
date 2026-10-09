"""
EventFlow Reviews API
Review management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId

from ...core.config import get_settings
from ...core.security import (
    get_current_user,
    check_admin,
    check_organizer,
    check_volunteer,
)
from ...core.database import db, Collections
from ...models.review import ReviewModel, ReviewDB, ReviewType, ReviewStatus
from ...models.event import EventModel, EventDB
from ...models.user import UserModel, UserDB, UserRole
from ...models.assignment import AssignmentDB
from ...services.notification_service import create_notification

router = APIRouter(prefix="/reviews", tags=["Reviews"])

settings = get_settings()


# Create review
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_review(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a new review"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("revieweeId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reviewee ID is required"
            )
        if not data.get("reviewType"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review type is required"
            )
        
        # Check review type permissions
        review_type = ReviewType(data["reviewType"])
        
        if review_type == ReviewType.VOLUNTEER:
            # Only organizers can review volunteers
            if current_user["role"] not in [UserRole.ORGANIZER, UserRole.ADMIN]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only organizers can review volunteers"
                )
        elif review_type == ReviewType.ORGANIZER:
            # Only volunteers can review organizers
            if current_user["role"] != UserRole.VOLUNTEER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only volunteers can review organizers"
                )
        elif review_type == ReviewType.EVENT:
            # Only volunteers can review events
            if current_user["role"] != UserRole.VOLUNTEER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only volunteers can review events"
                )
        
        # If eventId is provided, check if it's valid
        if data.get("eventId"):
            event = await EventDB.get_by_id(data["eventId"])
            
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            # For volunteer reviews, check if this is organizer's event
            if review_type == ReviewType.VOLUNTEER and current_user["role"] == UserRole.ORGANIZER:
                if str(current_user["_id"]) != str(event.organizer):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to review volunteers for this event"
                    )
            
            # For event reviews, check if volunteer was assigned to this event
            if review_type == ReviewType.EVENT and current_user["role"] == UserRole.VOLUNTEER:
                assignment = await AssignmentDB.get_by_volunteer_and_event(
                    current_user["_id"],
                    data["eventId"]
                )
                if not assignment:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to review this event"
                    )
        
        # Prepare review data
        review_data = {
            "reviewerId": current_user["_id"],
            "revieweeId": ObjectId(data["revieweeId"]),
            "eventId": data.get("eventId"),
            "assignmentId": data.get("assignmentId"),
            "reviewType": review_type,
            "status": ReviewStatus.DRAFT,
            "title": data.get("title"),
            "overallRating": data.get("overallRating"),
            "dimensions": data.get("dimensions", []),
            "strengths": data.get("strengths", []),
            "areasForImprovement": data.get("areasForImprovement", []),
            "comments": data.get("comments", []),
            "feedback": data.get("feedback"),
            "isAnonymous": data.get("isAnonymous", False),
            "isPublic": data.get("isPublic", False),
            "tags": data.get("tags", []),
        }
        
        # Create review
        review = await ReviewDB.create(review_data)
        
        return {
            "success": True,
            "message": "Review created successfully",
            "data": review.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all reviews
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_reviews(
    skip: int = 0,
    limit: int = 100,
    reviewer_id: Optional[str] = None,
    reviewee_id: Optional[str] = None,
    event_id: Optional[str] = None,
    review_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "submittedAt",
    sort_order: int = -1,
    current_user: dict = Depends(get_current_user)
):
    """Get all reviews with optional filters"""
    try:
        # Convert review_type and status to enums if provided
        review_type_enum = None
        if review_type:
            try:
                review_type_enum = ReviewType(review_type)
            except ValueError:
                pass
        
        status_enum = None
        if status:
            try:
                status_enum = ReviewStatus(status)
            except ValueError:
                pass
        
        # For organizers, filter by their events or reviews they've written
        if current_user["role"] == UserRole.ORGANIZER:
            reviews = await ReviewDB.list_all(
                skip=skip,
                limit=limit,
                reviewer_id=reviewer_id or str(current_user["_id"]),
                reviewee_id=reviewee_id,
                event_id=event_id,
                review_type=review_type_enum,
                status=status_enum,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
        else:
            reviews = await ReviewDB.list_all(
                skip=skip,
                limit=limit,
                reviewer_id=reviewer_id,
                reviewee_id=reviewee_id or str(current_user["_id"]),
                event_id=event_id,
                review_type=review_type_enum,
                status=status_enum,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
        
        total = await ReviewDB.count(
            reviewer_id=reviewer_id,
            reviewee_id=reviewee_id,
            event_id=event_id,
            review_type=review_type_enum,
            status=status_enum
        )
        
        # Enrich reviews
        enriched_reviews = []
        for review in reviews:
            review_dict = review.to_dict()
            
            # Get reviewer info
            reviewer = await UserDB.get_by_id(review.reviewerId)
            if reviewer:
                review_dict["reviewerInfo"] = {
                    "id": str(reviewer._id),
                    "name": reviewer.fullName,
                    "profileImage": reviewer.profile.get("profileImage")
                }
            
            # Get reviewee info
            reviewee = await UserDB.get_by_id(review.revieweeId)
            if reviewee:
                review_dict["revieweeInfo"] = {
                    "id": str(reviewee._id),
                    "name": reviewee.fullName,
                    "profileImage": reviewee.profile.get("profileImage")
                }
            
            # Get event info
            if review.eventId:
                event = await EventDB.get_by_id(review.eventId)
                if event:
                    review_dict["eventInfo"] = {
                        "id": str(event._id),
                        "title": event.title,
                        "date": event.date
                    }
            
            enriched_reviews.append(review_dict)
        
        return {
            "success": True,
            "data": enriched_reviews,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting reviews: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get review by ID
@router.get("/{review_id}", status_code=status.HTTP_200_OK)
async def get_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get review by ID"""
    try:
        review = await ReviewDB.get_by_id(review_id)
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user can access this review
        if current_user["role"] == UserRole.VOLUNTEER:
            # Check if this is a review of the volunteer or written by the volunteer
            if str(current_user["_id"]) != str(review.reviewerId) and str(current_user["_id"]) != str(review.revieweeId):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this review"
                )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is a review written by the organizer or for their event
            if str(current_user["_id"]) != str(review.reviewerId):
                if review.eventId:
                    event = await EventDB.get_by_id(review.eventId)
                    if not event or str(event.organizer) != str(current_user["_id"]):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="You do not have permission to access this review"
                        )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this review"
                    )
        
        # Get reviewer info
        reviewer = await UserDB.get_by_id(review.reviewerId)
        
        # Get reviewee info
        reviewee = await UserDB.get_by_id(review.revieweeId)
        
        # Get event info
        event_info = None
        if review.eventId:
            event = await EventDB.get_by_id(review.eventId)
            if event:
                event_info = {
                    "id": str(event._id),
                    "title": event.title,
                    "date": event.date,
                    "organizer": str(event.organizer)
                }
        
        # Get assignment info
        assignment_info = None
        if review.assignmentId:
            assignment = await AssignmentDB.get_by_id(review.assignmentId)
            if assignment:
                assignment_info = {
                    "id": str(assignment._id),
                    "status": assignment.status
                }
        
        review_dict = review.to_dict()
        review_dict["reviewerInfo"] = {
            "id": str(reviewer._id),
            "name": reviewer.fullName,
            "email": reviewer.email,
            "profileImage": reviewer.profile.get("profileImage"),
            "role": reviewer.role
        } if reviewer else None
        review_dict["revieweeInfo"] = {
            "id": str(reviewee._id),
            "name": reviewee.fullName,
            "email": reviewee.email,
            "profileImage": reviewee.profile.get("profileImage"),
            "role": reviewee.role
        } if reviewee else None
        review_dict["eventInfo"] = event_info
        review_dict["assignmentInfo"] = assignment_info
        
        return {
            "success": True,
            "data": review_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update review
@router.put("/{review_id}", status_code=status.HTTP_200_OK)
async def update_review(
    review_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update a review"""
    try:
        data = await request.json()
        
        review = await ReviewDB.get_by_id(review_id)
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user can update this review
        if str(current_user["_id"]) != str(review.reviewerId):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this review"
            )
        
        # Check if review is still in draft
        if review.status != ReviewStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review is not in DRAFT status"
            )
        
        # Prepare update data
        update_data = {}
        
        if "title" in data:
            update_data["title"] = data["title"]
        if "overallRating" in data:
            update_data["overallRating"] = data["overallRating"]
        if "dimensions" in data:
            update_data["dimensions"] = data["dimensions"]
        if "strengths" in data:
            update_data["strengths"] = data["strengths"]
        if "areasForImprovement" in data:
            update_data["areasForImprovement"] = data["areasForImprovement"]
        if "comments" in data:
            update_data["comments"] = data["comments"]
        if "feedback" in data:
            update_data["feedback"] = data["feedback"]
        if "isAnonymous" in data:
            update_data["isAnonymous"] = data["isAnonymous"]
        if "isPublic" in data:
            update_data["isPublic"] = data["isPublic"]
        if "tags" in data:
            update_data["tags"] = data["tags"]
        
        updated_review = await ReviewDB.update(review_id, update_data)
        
        if not updated_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return {
            "success": True,
            "message": "Review updated successfully",
            "data": updated_review.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete review
@router.delete("/{review_id}", status_code=status.HTTP_200_OK)
async def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a review"""
    try:
        review = await ReviewDB.get_by_id(review_id)
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user can delete this review
        if str(current_user["_id"]) != str(review.reviewerId) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this review"
            )
        
        success = await ReviewDB.delete(review_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return {
            "success": True,
            "message": "Review deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Submit review
@router.post("/{review_id}/submit", status_code=status.HTTP_200_OK)
async def submit_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Submit a review"""
    try:
        review = await ReviewDB.get_by_id(review_id)
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user can submit this review
        if str(current_user["_id"]) != str(review.reviewerId):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to submit this review"
            )
        
        if review.status != ReviewStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review is not in DRAFT status"
            )
        
        submitted_review = await ReviewDB.submit(review_id)
        
        if not submitted_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Get reviewee info
        reviewee = await UserDB.get_by_id(review.revieweeId)
        
        # Send notification to reviewee
        if reviewee:
            await create_notification({
                "userId": str(reviewee._id),
                "type": "REVIEW",
                "priority": "MEDIUM",
                "title": f"New Review Received",
                "message": f"{current_user['fullName']} has submitted a review about you.",
                "data": {
                    "reviewId": str(review._id),
                    "reviewerId": str(current_user["_id"]),
                    "reviewerName": current_user["fullName"],
                    "overallRating": review.overallRating,
                    "reviewType": review.reviewType
                },
                "relatedEntityId": review._id,
                "relatedEntityType": "REVIEW"
            })
        
        return {
            "success": True,
            "message": "Review submitted successfully",
            "data": submitted_review.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Publish review
@router.post("/{review_id}/publish", status_code=status.HTTP_200_OK)
async def publish_review(
    review_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Publish a review (make it visible)"""
    try:
        review = await ReviewDB.get_by_id(review_id)
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if this is for organizer's event
        if review.eventId:
            event = await EventDB.get_by_id(review.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to publish this review"
                )
        
        if review.status != ReviewStatus.SUBMITTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review must be in SUBMITTED status to be published"
            )
        
        published_review = await ReviewDB.publish(review_id)
        
        if not published_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Get reviewee info
        reviewee = await UserDB.get_by_id(review.revieweeId)
        
        # Send notification to reviewee
        if reviewee:
            await create_notification({
                "userId": str(reviewee._id),
                "type": "REVIEW",
                "priority": "MEDIUM",
                "title": f"Review Published",
                "message": f"A review about you has been published and is now visible to others.",
                "data": {
                    "reviewId": str(review._id),
                    "reviewerId": str(review.reviewerId),
                    "overallRating": review.overallRating,
                    "reviewType": review.reviewType,
                    "isPublic": True
                },
                "relatedEntityId": review._id,
                "relatedEntityType": "REVIEW"
            })
        
        return {
            "success": True,
            "message": "Review published successfully",
            "data": published_review.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error publishing review: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Add comment to review
@router.post("/{review_id}/comments", status_code=status.HTTP_200_OK)
async def add_review_comment(
    review_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a review"""
    try:
        data = await request.json()
        
        if not data.get("comment"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Comment is required"
            )
        
        review = await ReviewDB.get_by_id(review_id)
        
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user can comment on this review
        # Only reviewer, reviewee, and admins can comment
        if str(current_user["_id"]) not in [str(review.reviewerId), str(review.revieweeId)] and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to comment on this review"
            )
        
        is_public = data.get("isPublic", True)
        
        commented_review = await ReviewDB.add_comment(
            review_id,
            data["comment"],
            current_user["_id"],
            is_public
        )
        
        if not commented_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        return {
            "success": True,
            "message": "Comment added successfully",
            "data": commented_review.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding review comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get review statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_review_stats(
    reviewee_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get review statistics"""
    try:
        if not reviewee_id:
            reviewee_id = str(current_user["_id"])
        else:
            # Check if user can access this reviewee's stats
            if current_user["role"] not in [UserRole.ADMIN, UserRole.ORGANIZER]:
                if str(current_user["_id"]) != reviewee_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this reviewee's stats"
                    )
        
        stats = await ReviewDB.get_stats(reviewee_id)
        
        return {
            "success": True,
            "data": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting review stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
