"""
EventFlow Notifications API
Notification management endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId

from ...core.config import get_settings
from ...core.security import get_current_user
from ...core.database import db, Collections
from ...services.notification_service import (
    create_notification,
    send_notification,
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read,
    archive_notification,
    delete_notification
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

settings = get_settings()


# Get user notifications
@router.get("/", status_code=status.HTTP_200_OK)
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    is_read: Optional[bool] = None,
    notification_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get notifications for the current user"""
    try:
        result = await get_user_notifications(
            str(current_user["_id"]),
            skip=skip,
            limit=limit,
            is_read=is_read,
            notification_type=notification_type
        )
        
        return {
            "success": True,
            "data": result["data"],
            "meta": result["meta"]
        }
    
    except Exception as e:
        print(f"Error getting notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get notification by ID
@router.get("/{notification_id}", status_code=status.HTTP_200_OK)
async def get_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific notification"""
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        notification = await collection.find_one({"_id": ObjectId(notification_id)})
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Check if this notification belongs to the current user
        if str(notification["userId"]) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this notification"
            )
        
        notification["_id"] = str(notification["_id"])
        notification["userId"] = str(notification["userId"])
        
        return {
            "success": True,
            "data": notification
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Mark notification as read
@router.post("/{notification_id}/read", status_code=status.HTTP_200_OK)
async def mark_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        success = await mark_notification_as_read(
            notification_id,
            str(current_user["_id"])
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found or already read"
            )
        
        return {
            "success": True,
            "message": "Notification marked as read"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Mark all notifications as read
@router.post("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read"""
    try:
        count = await mark_all_notifications_as_read(str(current_user["_id"]))
        
        return {
            "success": True,
            "message": f"{count} notifications marked as read"
        }
    
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Archive notification
@router.post("/{notification_id}/archive", status_code=status.HTTP_200_OK)
async def archive(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Archive a notification"""
    try:
        success = await archive_notification(
            notification_id,
            str(current_user["_id"]),
            is_archived=True
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {
            "success": True,
            "message": "Notification archived"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error archiving notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Unarchive notification
@router.post("/{notification_id}/unarchive", status_code=status.HTTP_200_OK)
async def unarchive(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Unarchive a notification"""
    try:
        success = await archive_notification(
            notification_id,
            str(current_user["_id"]),
            is_archived=False
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {
            "success": True,
            "message": "Notification unarchived"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unarchiving notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete notification
@router.delete("/{notification_id}", status_code=status.HTTP_200_OK)
async def delete(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        success = await delete_notification(
            notification_id,
            str(current_user["_id"])
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {
            "success": True,
            "message": "Notification deleted"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get unread notification count
@router.get("/unread-count", status_code=status.HTTP_200_OK)
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get the count of unread notifications"""
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        count = await collection.count_documents({
            "userId": ObjectId(current_user["_id"]),
            "isRead": False
        })
        
        return {
            "success": True,
            "data": {"count": count}
        }
    
    except Exception as e:
        print(f"Error getting unread count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Send test notification (for development)
@router.post("/test", status_code=status.HTTP_200_OK)
async def send_test_notification(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Send a test notification (development only)"""
    try:
        if not settings.DEBUG:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Test notifications are only available in development"
            )
        
        data = await request.json()
        
        notification = await create_notification({
            "userId": str(current_user["_id"]),
            "type": data.get("type", "SYSTEM"),
            "priority": data.get("priority", "MEDIUM"),
            "title": data.get("title", "Test Notification"),
            "message": data.get("message", "This is a test notification"),
            "data": data.get("data", {}),
            "relatedEntityId": None,
            "relatedEntityType": None
        })
        
        return {
            "success": True,
            "message": "Test notification sent",
            "data": notification
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending test notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
