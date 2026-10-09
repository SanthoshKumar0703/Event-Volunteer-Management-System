"""
EventFlow Badges API
Badge management endpoints
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
from ...models.badge import BadgeModel, BadgeDB, VolunteerBadgeModel, VolunteerBadgeDB, BadgeCategory, BadgeRarity
from ...models.user import UserModel, UserDB, UserRole
from ...services.notification_service import create_notification

router = APIRouter(prefix="/badges", tags=["Badges"])

settings = get_settings()


# Create badge
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_badge(
    request: Request,
    current_user: dict = Depends(check_admin)
):
    """Create a new badge"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("name"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name is required"
            )
        if not data.get("description"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description is required"
            )
        if not data.get("category"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category is required"
            )
        if not data.get("rarity"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rarity is required"
            )
        
        # Prepare badge data
        badge_data = {
            "name": data["name"],
            "description": data["description"],
            "category": data["category"],
            "rarity": data["rarity"],
            "image": data.get("image"),
            "icon": data.get("icon"),
            "color": data.get("color", "#FF7A33"),
            "criteria": data.get("criteria", []),
            "tiers": data.get("tiers", []),
            "points": data.get("points", 0),
            "isActive": data.get("isActive", True),
            "order": data.get("order", 0),
            "tags": data.get("tags", []),
        }
        
        # Create badge
        badge = await BadgeDB.create(badge_data)
        
        return {
            "success": True,
            "message": "Badge created successfully",
            "data": badge.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all badges
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_badges(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    rarity: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "order",
    sort_order: int = 1,
    current_user: dict = Depends(get_current_user)
):
    """Get all badges with optional filters"""
    try:
        # Convert category and rarity to enums if provided
        category_enum = None
        if category:
            try:
                category_enum = BadgeCategory(category)
            except ValueError:
                pass
        
        rarity_enum = None
        if rarity:
            try:
                rarity_enum = BadgeRarity(rarity)
            except ValueError:
                pass
        
        badges = await BadgeDB.list_all(
            skip=skip,
            limit=limit,
            category=category_enum,
            rarity=rarity_enum,
            is_active=is_active,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        total = await BadgeDB.count(
            category=category_enum,
            rarity=rarity_enum,
            is_active=is_active
        )
        
        # For volunteers, check which badges they've earned
        if current_user["role"] == UserRole.VOLUNTEER:
            volunteer_badges = await VolunteerBadgeDB.get_volunteer_badges(current_user["_id"])
            earned_badge_ids = [str(vb.badgeId) for vb in volunteer_badges]
            
            for badge in badges:
                badge_dict = badge.to_dict()
                badge_dict["isEarned"] = str(badge._id) in earned_badge_ids
                
                # Find the volunteer badge for this badge
                for vb in volunteer_badges:
                    if str(vb.badgeId) == str(badge._id):
                        badge_dict["earnedAt"] = vb.earnedAt
                        badge_dict["tier"] = vb.tier
                        break
        else:
            # For admins and organizers, just return badge info
            badges = [badge.to_dict() for badge in badges]
        
        return {
            "success": True,
            "data": [badge.to_dict() if isinstance(badge, BadgeModel) else badge for badge in badges],
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting badges: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get badge by ID
@router.get("/{badge_id}", status_code=status.HTTP_200_OK)
async def get_badge(
    badge_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get badge by ID"""
    try:
        badge = await BadgeDB.get_by_id(badge_id)
        
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        badge_dict = badge.to_dict()
        
        # Check if current user has earned this badge
        if current_user["role"] == UserRole.VOLUNTEER:
            volunteer_badge = await VolunteerBadgeDB.get_volunteer_badge(
                current_user["_id"],
                badge_id
            )
            badge_dict["isEarned"] = volunteer_badge is not None
            badge_dict["earnedAt"] = volunteer_badge.earnedAt if volunteer_badge else None
            badge_dict["tier"] = volunteer_badge.tier if volunteer_badge else None
        
        return {
            "success": True,
            "data": badge_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update badge
@router.put("/{badge_id}", status_code=status.HTTP_200_OK)
async def update_badge(
    badge_id: str,
    request: Request,
    current_user: dict = Depends(check_admin)
):
    """Update a badge"""
    try:
        data = await request.json()
        
        badge = await BadgeDB.get_by_id(badge_id)
        
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        # Prepare update data
        update_data = {}
        
        if "name" in data:
            update_data["name"] = data["name"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "category" in data:
            update_data["category"] = data["category"]
        if "rarity" in data:
            update_data["rarity"] = data["rarity"]
        if "image" in data:
            update_data["image"] = data["image"]
        if "icon" in data:
            update_data["icon"] = data["icon"]
        if "color" in data:
            update_data["color"] = data["color"]
        if "criteria" in data:
            update_data["criteria"] = data["criteria"]
        if "tiers" in data:
            update_data["tiers"] = data["tiers"]
        if "points" in data:
            update_data["points"] = data["points"]
        if "isActive" in data:
            update_data["isActive"] = data["isActive"]
        if "order" in data:
            update_data["order"] = data["order"]
        if "tags" in data:
            update_data["tags"] = data["tags"]
        
        updated_badge = await BadgeDB.update(badge_id, update_data)
        
        if not updated_badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        return {
            "success": True,
            "message": "Badge updated successfully",
            "data": updated_badge.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete badge
@router.delete("/{badge_id}", status_code=status.HTTP_200_OK)
async def delete_badge(
    badge_id: str,
    current_user: dict = Depends(check_admin)
):
    """Delete a badge"""
    try:
        badge = await BadgeDB.get_by_id(badge_id)
        
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        success = await BadgeDB.delete(badge_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        return {
            "success": True,
            "message": "Badge deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Award badge to volunteer
@router.post("/award", status_code=status.HTTP_200_OK)
async def award_badge(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Award a badge to a volunteer"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        if not data.get("badgeId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Badge ID is required"
            )
        
        # Get badge
        badge = await BadgeDB.get_by_id(data["badgeId"])
        
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        # Get volunteer
        volunteer = await UserDB.get_by_id(data["volunteerId"])
        
        if not volunteer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Volunteer not found"
            )
        
        # Award badge
        volunteer_badge = await VolunteerBadgeDB.award_badge(
            data["volunteerId"],
            data["badgeId"],
            data.get("tier"),
            current_user["_id"],
            data.get("notes")
        )
        
        # Send notification to volunteer
        await create_notification({
            "userId": str(volunteer._id),
            "type": "BADGE",
            "priority": "HIGH",
            "title": f"Badge Earned: {badge.name}",
            "message": f"You have earned the '{badge.name}' badge! {badge.description}",
            "data": {
                "badgeId": str(badge._id),
                "badgeName": badge.name,
                "badgeCategory": badge.category,
                "badgeRarity": badge.rarity,
                "badgeImage": badge.image,
                "points": badge.points
            },
            "relatedEntityId": badge._id,
            "relatedEntityType": "BADGE"
        })
        
        return {
            "success": True,
            "message": "Badge awarded successfully",
            "data": {
                "volunteerBadge": volunteer_badge.to_dict(),
                "badge": badge.to_dict()
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error awarding badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Revoke badge from volunteer
@router.post("/revoke", status_code=status.HTTP_200_OK)
async def revoke_badge(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Revoke a badge from a volunteer"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        if not data.get("badgeId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Badge ID is required"
            )
        
        # Get badge
        badge = await BadgeDB.get_by_id(data["badgeId"])
        
        if not badge:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Badge not found"
            )
        
        # Get volunteer
        volunteer = await UserDB.get_by_id(data["volunteerId"])
        
        if not volunteer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Volunteer not found"
            )
        
        success = await VolunteerBadgeDB.revoke_badge(
            data["volunteerId"],
            data["badgeId"]
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Volunteer badge not found"
            )
        
        return {
            "success": True,
            "message": "Badge revoked successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error revoking badge: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get volunteer's badges
@router.get("/volunteer/{volunteer_id}", status_code=status.HTTP_200_OK)
async def get_volunteer_badges(
    volunteer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all badges for a volunteer"""
    try:
        # Check if user can access this volunteer's badges
        if current_user["role"] not in [UserRole.ADMIN, UserRole.ORGANIZER]:
            if str(current_user["_id"]) != volunteer_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this volunteer's badges"
                )
        
        # Get volunteer
        volunteer = await UserDB.get_by_id(volunteer_id)
        
        if not volunteer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Volunteer not found"
            )
        
        # Get volunteer badges
        volunteer_badges = await VolunteerBadgeDB.get_volunteer_badges(volunteer_id)
        
        # Enrich with badge info
        enriched_badges = []
        for vb in volunteer_badges:
            badge = await BadgeDB.get_by_id(vb.badgeId)
            if badge:
                enriched_badges.append({
                    **vb.to_dict(),
                    "badgeInfo": badge.to_dict()
                })
        
        # Calculate total points
        total_points = sum(vb["badgeInfo"]["points"] for vb in enriched_badges)
        
        return {
            "success": True,
            "data": {
                "volunteerId": volunteer_id,
                "volunteerName": volunteer.fullName,
                "badges": enriched_badges,
                "totalBadges": len(enriched_badges),
                "totalPoints": total_points
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting volunteer badges: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Check badge eligibility
@router.post("/check-eligibility", status_code=status.HTTP_200_OK)
async def check_badge_eligibility(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Check if a volunteer is eligible for a badge"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        if not data.get("badgeId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Badge ID is required"
            )
        
        result = await VolunteerBadgeDB.check_badge_criteria(
            data["volunteerId"],
            data["badgeId"]
        )
        
        return {
            "success": True,
            "data": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking badge eligibility: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Check all badges for a volunteer
@router.post("/check-all/{volunteer_id}", status_code=status.HTTP_200_OK)
async def check_all_badges(
    volunteer_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Check all badges for eligibility and award those that are met"""
    try:
        # Check if user can access this volunteer's badges
        if current_user["role"] not in [UserRole.ADMIN, UserRole.ORGANIZER]:
            if str(current_user["_id"]) != volunteer_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to check badges for this volunteer"
                )
        
        result = await VolunteerBadgeDB.check_all_badges(volunteer_id)
        
        return {
            "success": True,
            "data": result
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking all badges: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get badge statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_badge_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get badge statistics"""
    try:
        stats = await BadgeDB.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        print(f"Error getting badge stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
