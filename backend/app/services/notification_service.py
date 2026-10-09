"""
EventFlow Notification Service
Centralized notification creation and dispatching
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from bson import ObjectId

from ..core.database import db, Collections
from ..core.websocket import websocket_manager
from .email_service import email_service


async def create_notification(
    notification_data: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Create a notification and dispatch it to the user
    
    Args:
        notification_data: Dictionary containing notification details
            - userId: The user ID to send the notification to
            - type: Notification type (EVENT, APPLICATION, ASSIGNMENT, TASK, etc.)
            - priority: Notification priority (LOW, MEDIUM, HIGH, URGENT)
            - title: Notification title
            - message: Notification message
            - data: Additional data payload
            - relatedEntityId: ID of the related entity
            - relatedEntityType: Type of the related entity
            - actionUrl: URL to navigate to when notification is clicked
            - icon: Icon to display
            - color: Color for the notification
    
    Returns:
        The created notification document or None if failed
    """
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        # Generate notification ID
        from ..models.counter import CounterDB
        notification_id = await CounterDB.get_next_sequence("notification_id")
        
        # Prepare notification document
        notification = {
            "notificationId": f"NOT-{notification_id:08d}",
            "userId": ObjectId(notification_data["userId"]) if isinstance(notification_data["userId"], str) else notification_data["userId"],
            "type": notification_data.get("type", "SYSTEM"),
            "priority": notification_data.get("priority", "MEDIUM"),
            "title": notification_data["title"],
            "message": notification_data["message"],
            "data": notification_data.get("data", {}),
            "isRead": False,
            "isArchived": False,
            "relatedEntityId": ObjectId(notification_data["relatedEntityId"]) if notification_data.get("relatedEntityId") and isinstance(notification_data["relatedEntityId"], str) else notification_data.get("relatedEntityId"),
            "relatedEntityType": notification_data.get("relatedEntityType", "SYSTEM"),
            "actionUrl": notification_data.get("actionUrl"),
            "icon": notification_data.get("icon"),
            "color": notification_data.get("color"),
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        
        # Insert notification
        result = await collection.insert_one(notification)
        notification["_id"] = result.inserted_id
        
        # Send WebSocket notification if user is connected
        try:
            await websocket_manager.send_to_user(
                str(notification["userId"]),
                {
                    "type": "NEW_NOTIFICATION",
                    "data": notification
                }
            )
        except Exception as e:
            print(f"WebSocket notification failed: {e}")
        
        # Send email notification for high priority notifications
        if notification["priority"] in ["HIGH", "URGENT"]:
            try:
                user_collection = db.get_collection(Collections.USERS)
                user = await user_collection.find_one({"_id": notification["userId"]})
                
                if user and user.get("email"):
                    # Send email based on notification type
                    notification_type = notification["type"]
                    
                    if notification_type == "ASSIGNMENT":
                        event_data = notification["data"].get("event", {})
                        await email_service.send_event_assigned_email(
                            to=user["email"],
                            name=user.get("fullName", user.get("firstName", "User")),
                            event_title=event_data.get("eventTitle", "Event"),
                            event_date=event_data.get("eventDate", ""),
                            event_venue=event_data.get("venue", ""),
                            role=event_data.get("role", "Volunteer"),
                            organizer_name=event_data.get("organizerName", "Organizer")
                        )
                    elif notification_type == "TASK":
                        task_data = notification["data"]
                        await email_service.send_task_assigned_email(
                            to=user["email"],
                            name=user.get("fullName", user.get("firstName", "User")),
                            task_title=task_data.get("taskTitle", "Task"),
                            event_title=task_data.get("eventTitle", "Event"),
                            due_date=task_data.get("dueDate", ""),
                            priority=task_data.get("priority", "MEDIUM"),
                            organizer_name=task_data.get("organizerName", "Organizer")
                        )
                    elif notification_type == "ANNOUNCEMENT":
                        announcement_data = notification["data"]
                        await email_service.send_announcement_email(
                            to=user["email"],
                            name=user.get("fullName", user.get("firstName", "User")),
                            announcement_title=announcement_data.get("announcementTitle", "Announcement"),
                            announcement_message=announcement_data.get("message", ""),
                            event_title=announcement_data.get("eventTitle", "Event"),
                            organizer_name=announcement_data.get("organizerName", "Organizer")
                        )
            except Exception as e:
                print(f"Email notification failed: {e}")
        
        return notification
    
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None


async def send_notification(
    user_ids: List[str],
    notification_data: Dict[str, Any]
) -> int:
    """
    Send a notification to multiple users
    
    Args:
        user_ids: List of user IDs to send the notification to
        notification_data: Dictionary containing notification details
    
    Returns:
        Number of notifications successfully created
    """
    try:
        count = 0
        
        for user_id in user_ids:
            notification_data_copy = notification_data.copy()
            notification_data_copy["userId"] = user_id
            
            notification = await create_notification(notification_data_copy)
            if notification:
                count += 1
        
        return count
    
    except Exception as e:
        print(f"Error sending notifications: {e}")
        return 0


async def get_user_notifications(
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    is_read: Optional[bool] = None,
    notification_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get notifications for a user
    
    Args:
        user_id: The user ID
        skip: Number of notifications to skip
        limit: Maximum number of notifications to return
        is_read: Filter by read status
        notification_type: Filter by notification type
    
    Returns:
        Dictionary with notifications and metadata
    """
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        query = {"userId": ObjectId(user_id) if isinstance(user_id, str) else user_id}
        
        if is_read is not None:
            query["isRead"] = is_read
        
        if notification_type:
            query["type"] = notification_type
        
        # Get notifications
        cursor = collection.find(query).skip(skip).limit(limit).sort("createdAt", -1)
        notifications = []
        async for notification in cursor:
            notification["_id"] = str(notification["_id"])
            notification["userId"] = str(notification["userId"])
            if notification.get("relatedEntityId"):
                notification["relatedEntityId"] = str(notification["relatedEntityId"])
            notifications.append(notification)
        
        # Get unread count
        unread_count = await collection.count_documents({
            "userId": ObjectId(user_id) if isinstance(user_id, str) else user_id,
            "isRead": False
        })
        
        # Get total count
        total_count = await collection.count_documents({
            "userId": ObjectId(user_id) if isinstance(user_id, str) else user_id
        })
        
        return {
            "success": True,
            "data": notifications,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total_count,
                "unread": unread_count,
                "hasMore": skip + limit < total_count
            }
        }
    
    except Exception as e:
        print(f"Error getting user notifications: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": [],
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": 0,
                "unread": 0,
                "hasMore": False
            }
        }


async def mark_notification_as_read(
    notification_id: str,
    user_id: str
) -> bool:
    """
    Mark a notification as read
    
    Args:
        notification_id: The notification ID
        user_id: The user ID (for verification)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        result = await collection.update_one(
            {
                "_id": ObjectId(notification_id) if isinstance(notification_id, str) else notification_id,
                "userId": ObjectId(user_id) if isinstance(user_id, str) else user_id
            },
            {"$set": {"isRead": True, "readAt": datetime.now(timezone.utc)}}
        )
        
        return result.modified_count > 0
    
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        return False


async def mark_all_notifications_as_read(
    user_id: str
) -> int:
    """
    Mark all notifications for a user as read
    
    Args:
        user_id: The user ID
    
    Returns:
        Number of notifications marked as read
    """
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        result = await collection.update_many(
            {
                "userId": ObjectId(user_id) if isinstance(user_id, str) else user_id,
                "isRead": False
            },
            {"$set": {"isRead": True, "readAt": datetime.now(timezone.utc)}}
        )
        
        return result.modified_count
    
    except Exception as e:
        print(f"Error marking all notifications as read: {e}")
        return 0


async def archive_notification(
    notification_id: str,
    user_id: str,
    is_archived: bool = True
) -> bool:
    """
    Archive or unarchive a notification
    
    Args:
        notification_id: The notification ID
        user_id: The user ID (for verification)
        is_archived: Whether to archive or unarchive
    
    Returns:
        True if successful, False otherwise
    """
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        result = await collection.update_one(
            {
                "_id": ObjectId(notification_id) if isinstance(notification_id, str) else notification_id,
                "userId": ObjectId(user_id) if isinstance(user_id, str) else user_id
            },
            {"$set": {"isArchived": is_archived}}
        )
        
        return result.modified_count > 0
    
    except Exception as e:
        print(f"Error archiving notification: {e}")
        return False


async def delete_notification(
    notification_id: str,
    user_id: str
) -> bool:
    """
    Delete a notification
    
    Args:
        notification_id: The notification ID
        user_id: The user ID (for verification)
    
    Returns:
        True if successful, False otherwise
    """
    try:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        
        result = await collection.delete_one({
            "_id": ObjectId(notification_id) if isinstance(notification_id, str) else notification_id,
            "userId": ObjectId(user_id) if isinstance(user_id, str) else user_id
        })
        
        return result.deleted_count > 0
    
    except Exception as e:
        print(f"Error deleting notification: {e}")
        return False


# Export functions
__all__ = [
    'create_notification',
    'send_notification',
    'get_user_notifications',
    'mark_notification_as_read',
    'mark_all_notifications_as_read',
    'archive_notification',
    'delete_notification'
]
