"""
EventFlow Announcements API
Announcement management endpoints
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
from ...models.announcement import AnnouncementModel, AnnouncementDB, AnnouncementStatus, AnnouncementPriority, AnnouncementTarget
from ...models.event import EventModel, EventDB
from ...models.user import UserModel, UserDB, UserRole
from ...services.email_service import email_service
from ...services.notification_service import create_notification

router = APIRouter(prefix="/announcements", tags=["Announcements"])

settings = get_settings()


# Create announcement
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Create a new announcement"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("title"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title is required"
            )
        if not data.get("message"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message is required"
            )
        
        # If eventId is provided, check if it's organizer's event
        if data.get("eventId"):
            event = await EventDB.get_by_id(data["eventId"])
            
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            # Check if this is organizer's event
            if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to create announcements for this event"
                )
        
        # Prepare announcement data
        announcement_data = {
            "eventId": data.get("eventId"),
            "title": data["title"],
            "message": data["message"],
            "status": data.get("status", AnnouncementStatus.DRAFT),
            "priority": data.get("priority", AnnouncementPriority.MEDIUM),
            "target": data.get("target", AnnouncementTarget.ALL),
            "targetUserIds": data.get("targetUserIds", []),
            "targetRoleIds": data.get("targetRoleIds", []),
            "isPinned": data.get("isPinned", False),
            "attachments": data.get("attachments", []),
            "tags": data.get("tags", []),
            "createdBy": current_user["_id"],
            "expiresAt": datetime.fromisoformat(data["expiresAt"]) if data.get("expiresAt") else None,
        }
        
        # Create announcement
        announcement = await AnnouncementDB.create(announcement_data)
        
        # If published, send notifications
        if announcement.status == AnnouncementStatus.PUBLISHED:
            # Get event info if applicable
            event = None
            if announcement.eventId:
                event = await EventDB.get_by_id(announcement.eventId)
            
            # Send notifications to targeted users
            if announcement.target == AnnouncementTarget.ALL:
                # Send to all users (in production, use proper filtering)
                users = await UserDB.list_all()
                for user in users:
                    await create_notification({
                        "userId": str(user._id),
                        "type": "ANNOUNCEMENT",
                        "priority": announcement.priority,
                        "title": announcement.title,
                        "message": announcement.message[:200] + "..." if len(announcement.message) > 200 else announcement.message,
                        "data": {
                            "announcementId": str(announcement._id),
                            "eventId": str(announcement.eventId) if announcement.eventId else None,
                            "eventTitle": event.title if event else None,
                            "announcementTitle": announcement.title
                        },
                        "relatedEntityId": announcement._id,
                        "relatedEntityType": "ANNOUNCEMENT"
                    })
            
            # Send email notifications for high priority
            if announcement.priority in [AnnouncementPriority.HIGH, AnnouncementPriority.URGENT]:
                if announcement.target == AnnouncementTarget.ALL:
                    users = await UserDB.list_all()
                    for user in users:
                        if user.email:
                            await email_service.send_announcement_email(
                                to=user.email,
                                name=user.fullName or user.firstName,
                                announcement_title=announcement.title,
                                announcement_message=announcement.message,
                                event_title=event.title if event else "General",
                                organizer_name=current_user.get("fullName", current_user.get("firstName", "Organizer"))
                            )
        
        return {
            "success": True,
            "message": "Announcement created successfully",
            "data": announcement.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all announcements
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_announcements(
    skip: int = 0,
    limit: int = 100,
    event_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "publishedAt",
    sort_order: int = -1,
    current_user: dict = Depends(get_current_user)
):
    """Get all announcements with optional filters"""
    try:
        # Convert status and priority to enums if provided
        status_enum = None
        if status:
            try:
                status_enum = AnnouncementStatus(status)
            except ValueError:
                pass
        
        priority_enum = None
        if priority:
            try:
                priority_enum = AnnouncementPriority(priority)
            except ValueError:
                pass
        
        # For organizers, filter by their events or global announcements
        if current_user["role"] == UserRole.ORGANIZER:
            if not event_id:
                events = await EventDB.list_all(organizer=str(current_user["_id"]))
                event_ids = [str(e._id) for e in events]
                
                # Get announcements for organizer's events + global announcements
                all_announcements = await AnnouncementDB.list_all(
                    skip=skip,
                    limit=limit,
                    event_id=None,  # Get all
                    status=status_enum,
                    priority=priority_enum,
                    is_pinned=is_pinned,
                    search=search,
                    sort_by=sort_by,
                    sort_order=sort_order
                )
                
                announcements = []
                for ann in all_announcements:
                    if ann.eventId is None or str(ann.eventId) in event_ids:
                        announcements.append(ann)
            else:
                announcements = await AnnouncementDB.list_all(
                    skip=skip,
                    limit=limit,
                    event_id=event_id,
                    status=status_enum,
                    priority=priority_enum,
                    is_pinned=is_pinned,
                    search=search,
                    sort_by=sort_by,
                    sort_order=sort_order
                )
        else:
            # For volunteers, get announcements they can see
            announcements = await AnnouncementDB.get_user_announcements(
                current_user["_id"],
                current_user["role"]
            )
            
            # Apply filters
            filtered_announcements = []
            for ann in announcements:
                if status_enum and ann.status != status_enum:
                    continue
                if priority_enum and ann.priority != priority_enum:
                    continue
                if is_pinned is not None and ann.isPinned != is_pinned:
                    continue
                if event_id and str(ann.eventId) != event_id:
                    continue
                if search:
                    if search.lower() not in ann.title.lower() and search.lower() not in ann.message.lower():
                        continue
                filtered_announcements.append(ann)
            
            announcements = filtered_announcements[skip:skip+limit]
        
        total = await AnnouncementDB.count(
            event_id=event_id,
            status=status_enum
        )
        
        # Enrich announcements
        enriched_announcements = []
        for announcement in announcements:
            announcement_dict = announcement.to_dict()
            
            # Get event info
            if announcement.eventId:
                event = await EventDB.get_by_id(announcement.eventId)
                if event:
                    announcement_dict["eventInfo"] = {
                        "id": str(event._id),
                        "title": event.title,
                        "date": event.date
                    }
            
            # Get creator info
            creator = await UserDB.get_by_id(announcement.createdBy)
            if creator:
                announcement_dict["creatorInfo"] = {
                    "id": str(creator._id),
                    "name": creator.fullName,
                    "profileImage": creator.profile.get("profileImage")
                }
            
            # Check if current user has read this announcement
            announcement_dict["isRead"] = False
            for receipt in announcement.readReceipts:
                if str(receipt.userId) == str(current_user["_id"]):
                    announcement_dict["isRead"] = True
                    break
            
            enriched_announcements.append(announcement_dict)
        
        return {
            "success": True,
            "data": enriched_announcements,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting announcements: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get announcement by ID
@router.get("/{announcement_id}", status_code=status.HTTP_200_OK)
async def get_announcement(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get announcement by ID"""
    try:
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Check if user can access this announcement
        if current_user["role"] == UserRole.VOLUNTEER:
            # Check if announcement is for this volunteer or is global/public
            if announcement.eventId:
                # Check if volunteer has assignment for this event
                assignments = await AssignmentDB.get_volunteer_assignments(current_user["_id"])
                event_ids = [str(a.eventId) for a in assignments]
                if str(announcement.eventId) not in event_ids:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this announcement"
                    )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event or global
            if announcement.eventId:
                event = await EventDB.get_by_id(announcement.eventId)
                if not event or str(event.organizer) != str(current_user["_id"]):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this announcement"
                    )
        
        # Mark as read for current user
        await AnnouncementDB.mark_as_read(announcement_id, current_user["_id"])
        
        # Get event info
        event_info = None
        if announcement.eventId:
            event = await EventDB.get_by_id(announcement.eventId)
            if event:
                event_info = {
                    "id": str(event._id),
                    "title": event.title,
                    "date": event.date,
                    "organizer": str(event.organizer)
                }
        
        # Get creator info
        creator = await UserDB.get_by_id(announcement.createdBy)
        
        announcement_dict = announcement.to_dict()
        announcement_dict["eventInfo"] = event_info
        announcement_dict["creatorInfo"] = {
            "id": str(creator._id),
            "name": creator.fullName,
            "email": creator.email,
            "profileImage": creator.profile.get("profileImage")
        } if creator else None
        
        # Check if current user has read this announcement
        announcement_dict["isRead"] = False
        for receipt in announcement.readReceipts:
            if str(receipt.userId) == str(current_user["_id"]):
                announcement_dict["isRead"] = True
                break
        
        return {
            "success": True,
            "data": announcement_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update announcement
@router.put("/{announcement_id}", status_code=status.HTTP_200_OK)
async def update_announcement(
    announcement_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update an announcement"""
    try:
        data = await request.json()
        
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Check if user can update this announcement
        if current_user["role"] == UserRole.VOLUNTEER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Volunteers cannot update announcements"
            )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event or global
            if announcement.eventId:
                event = await EventDB.get_by_id(announcement.eventId)
                if not event or str(event.organizer) != str(current_user["_id"]):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to update this announcement"
                    )
        
        # Prepare update data
        update_data = {}
        
        if "title" in data:
            update_data["title"] = data["title"]
        if "message" in data:
            update_data["message"] = data["message"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "priority" in data:
            update_data["priority"] = data["priority"]
        if "target" in data:
            update_data["target"] = data["target"]
        if "targetUserIds" in data:
            update_data["targetUserIds"] = data["targetUserIds"]
        if "targetRoleIds" in data:
            update_data["targetRoleIds"] = data["targetRoleIds"]
        if "isPinned" in data:
            update_data["isPinned"] = data["isPinned"]
        if "attachments" in data:
            update_data["attachments"] = data["attachments"]
        if "tags" in data:
            update_data["tags"] = data["tags"]
        if "expiresAt" in data:
            update_data["expiresAt"] = datetime.fromisoformat(data["expiresAt"]) if isinstance(data["expiresAt"], str) else data["expiresAt"]
        
        updated_announcement = await AnnouncementDB.update(announcement_id, update_data)
        
        if not updated_announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        return {
            "success": True,
            "message": "Announcement updated successfully",
            "data": updated_announcement.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete announcement
@router.delete("/{announcement_id}", status_code=status.HTTP_200_OK)
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Delete an announcement"""
    try:
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Check if this is for organizer's event or global
        if announcement.eventId:
            event = await EventDB.get_by_id(announcement.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this announcement"
                )
        
        success = await AnnouncementDB.delete(announcement_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        return {
            "success": True,
            "message": "Announcement deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Publish announcement
@router.post("/{announcement_id}/publish", status_code=status.HTTP_200_OK)
async def publish_announcement(
    announcement_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Publish an announcement"""
    try:
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Check if this is for organizer's event or global
        if announcement.eventId:
            event = await EventDB.get_by_id(announcement.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to publish this announcement"
                )
        
        if announcement.status != AnnouncementStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Announcement must be in DRAFT status to be published"
            )
        
        published_announcement = await AnnouncementDB.publish(announcement_id)
        
        if not published_announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Get event info if applicable
        event = None
        if published_announcement.eventId:
            event = await EventDB.get_by_id(published_announcement.eventId)
        
        # Send notifications to targeted users
        if published_announcement.target == AnnouncementTarget.ALL:
            users = await UserDB.list_all()
            for user in users:
                await create_notification({
                    "userId": str(user._id),
                    "type": "ANNOUNCEMENT",
                    "priority": published_announcement.priority,
                    "title": published_announcement.title,
                    "message": published_announcement.message[:200] + "..." if len(published_announcement.message) > 200 else published_announcement.message,
                    "data": {
                        "announcementId": str(published_announcement._id),
                        "eventId": str(published_announcement.eventId) if published_announcement.eventId else None,
                        "eventTitle": event.title if event else None,
                        "announcementTitle": published_announcement.title
                    },
                    "relatedEntityId": published_announcement._id,
                    "relatedEntityType": "ANNOUNCEMENT"
                })
        
        # Send email notifications for high priority
        if published_announcement.priority in [AnnouncementPriority.HIGH, AnnouncementPriority.URGENT]:
            if published_announcement.target == AnnouncementTarget.ALL:
                users = await UserDB.list_all()
                for user in users:
                    if user.email:
                        await email_service.send_announcement_email(
                            to=user.email,
                            name=user.fullName or user.firstName,
                            announcement_title=published_announcement.title,
                            announcement_message=published_announcement.message,
                            event_title=event.title if event else "General",
                            organizer_name=current_user.get("fullName", current_user.get("firstName", "Organizer"))
                        )
        
        return {
            "success": True,
            "message": "Announcement published successfully",
            "data": published_announcement.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error publishing announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Archive announcement
@router.post("/{announcement_id}/archive", status_code=status.HTTP_200_OK)
async def archive_announcement(
    announcement_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Archive an announcement"""
    try:
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Check if this is for organizer's event or global
        if announcement.eventId:
            event = await EventDB.get_by_id(announcement.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to archive this announcement"
                )
        
        if announcement.status != AnnouncementStatus.PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Announcement must be in PUBLISHED status to be archived"
            )
        
        archived_announcement = await AnnouncementDB.archive(announcement_id)
        
        if not archived_announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        return {
            "success": True,
            "message": "Announcement archived successfully",
            "data": archived_announcement.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error archiving announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Pin announcement
@router.post("/{announcement_id}/pin", status_code=status.HTTP_200_OK)
async def pin_announcement(
    announcement_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Pin or unpin an announcement"""
    try:
        data = await request.json()
        is_pinned = data.get("isPinned", True)
        
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Check if this is for organizer's event or global
        if announcement.eventId:
            event = await EventDB.get_by_id(announcement.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to pin this announcement"
                )
        
        pinned_announcement = await AnnouncementDB.pin(announcement_id, is_pinned)
        
        if not pinned_announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        return {
            "success": True,
            "message": f"Announcement {'pinned' if is_pinned else 'unpinned'} successfully",
            "data": pinned_announcement.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error pinning announcement: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Mark announcement as read
@router.post("/{announcement_id}/read", status_code=status.HTTP_200_OK)
async def mark_announcement_as_read(
    announcement_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark an announcement as read"""
    try:
        announcement = await AnnouncementDB.get_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found"
            )
        
        # Check if user can access this announcement
        if current_user["role"] == UserRole.VOLUNTEER:
            if announcement.eventId:
                # Check if volunteer has assignment for this event
                assignments = await AssignmentDB.get_volunteer_assignments(current_user["_id"])
                event_ids = [str(a.eventId) for a in assignments]
                if str(announcement.eventId) not in event_ids:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this announcement"
                    )
        elif current_user["role"] == UserRole.ORGANIZER:
            if announcement.eventId:
                event = await EventDB.get_by_id(announcement.eventId)
                if not event or str(event.organizer) != str(current_user["_id"]):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this announcement"
                    )
        
        success = await AnnouncementDB.mark_as_read(announcement_id, current_user["_id"])
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to mark announcement as read"
            )
        
        return {
            "success": True,
            "message": "Announcement marked as read successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking announcement as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get announcement statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_announcement_stats(
    event_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get announcement statistics"""
    try:
        if event_id:
            # Check if user can access this event's stats
            event = await EventDB.get_by_id(event_id)
            if not event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            if current_user["role"] == UserRole.ORGANIZER:
                if str(current_user["_id"]) != str(event.organizer):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this event's stats"
                    )
            
            stats = await AnnouncementDB.get_stats(event_id)
        else:
            if current_user["role"] == UserRole.ADMIN:
                stats = await AnnouncementDB.get_stats()
            elif current_user["role"] == UserRole.ORGANIZER:
                events = await EventDB.list_all(organizer=str(current_user["_id"]))
                event_ids = [str(e._id) for e in events]
                stats = await AnnouncementDB.get_stats(event_ids[0]) if event_ids else {}
            else:
                # For volunteers, get stats for announcements they can see
                announcements = await AnnouncementDB.get_user_announcements(
                    current_user["_id"],
                    current_user["role"]
                )
                stats = {
                    "total": len(announcements),
                    "published": len([a for a in announcements if a.status == AnnouncementStatus.PUBLISHED]),
                    "pinned": len([a for a in announcements if a.isPinned])
                }
        
        return {
            "success": True,
            "data": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting announcement stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
