"""
EventFlow Events API
Event management endpoints
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
from ...models.event import EventModel, EventDB, EventStatus, EventCategory
from ...models.user import UserModel, UserDB, UserRole
from ...models.assignment import AssignmentDB
from ...models.counter import CounterDB
from ...schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventSummaryResponse,
    EventStatsResponse,
)
from ...services.email_service import email_service
from ...services.notification_service import create_notification

router = APIRouter(prefix="/events", tags=["Events"])

settings = get_settings()


# Create event
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_event(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Create a new event"""
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["title", "description", "category", "date", "startTime", "endTime", "registrationDeadline", "requiredVolunteers", "location", "contactEmail"]
        for field in required_fields:
            if field not in data or not data[field]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field} is required"
                )
        
        # Prepare event data
        event_data = {
            "title": data["title"],
            "description": data["description"],
            "category": data["category"],
            "date": datetime.fromisoformat(data["date"]) if isinstance(data["date"], str) else data["date"],
            "startTime": data["startTime"],
            "endTime": data["endTime"],
            "registrationDeadline": datetime.fromisoformat(data["registrationDeadline"]) if isinstance(data["registrationDeadline"], str) else data["registrationDeadline"],
            "requiredVolunteers": data["requiredVolunteers"],
            "maximumVolunteers": data.get("maximumVolunteers"),
            "location": data["location"],
            "contactEmail": data["contactEmail"],
            "contactPhone": data.get("contactPhone"),
            "requiredSkills": data.get("requiredSkills", []),
            "preferredSkills": data.get("preferredSkills", []),
            "tags": data.get("tags", []),
            "organizer": current_user["_id"],
            "status": EventStatus.DRAFT,
            "socialLinks": data.get("socialLinks", {}),
            "settings": data.get("settings", {}),
            "image": data.get("image"),
            "bannerImage": data.get("bannerImage"),
        }
        
        # Create event
        event = await EventDB.create(event_data)
        
        return {
            "success": True,
            "message": "Event created successfully",
            "data": event.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all events
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_events(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    category: Optional[str] = None,
    organizer: Optional[str] = None,
    search: Optional[str] = None,
    upcoming: bool = False,
    my_events: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all events with optional filters"""
    try:
        # Convert status to enum if provided
        status_enum = None
        if status:
            try:
                status_enum = EventStatus(status)
            except ValueError:
                pass
        
        # Convert category to enum if provided
        category_enum = None
        if category:
            try:
                category_enum = EventCategory(category)
            except ValueError:
                pass
        
        events = await EventDB.list_all(
            skip=skip,
            limit=limit,
            status=status_enum,
            category=category_enum,
            organizer=organizer,
            search=search,
            upcoming=upcoming,
            my_events=my_events or (current_user["role"] == UserRole.ORGANIZER and str(current_user["_id"]))
        )
        
        total = await EventDB.count(
            status=status_enum,
            category=category_enum,
            organizer=organizer
        )
        
        # Enrich events with organizer info
        enriched_events = []
        for event in events:
            event_dict = event.to_dict()
            
            # Get organizer info
            organizer_info = await UserDB.get_by_id(event.organizer)
            if organizer_info:
                event_dict["organizerInfo"] = {
                    "id": str(organizer_info._id),
                    "name": organizer_info.fullName,
                    "email": organizer_info.email,
                    "profileImage": organizer_info.profile.get("profileImage")
                }
            
            # Get current volunteers count
            assignments = await AssignmentDB.get_event_assignments(event._id)
            event_dict["currentVolunteers"] = len([a for a in assignments if a.status in ["ASSIGNED", "CONFIRMED", "COMPLETED"]])
            
            enriched_events.append(event_dict)
        
        return {
            "success": True,
            "data": enriched_events,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get event by ID
@router.get("/{event_id}", status_code=status.HTTP_200_OK)
async def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get event by ID"""
    try:
        event = await EventDB.get_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user can access this event
        if current_user["role"] not in [UserRole.ADMIN, UserRole.ORGANIZER]:
            # For volunteers, check if they have an assignment
            assignments = await AssignmentDB.get_volunteer_assignments(current_user["_id"])
            event_ids = [str(a.eventId) for a in assignments]
            if str(event._id) not in event_ids:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this event"
                )
        
        # Get organizer info
        organizer_info = await UserDB.get_by_id(event.organizer)
        
        # Get assignments
        assignments = await AssignmentDB.get_event_assignments(event._id)
        
        # Get current volunteers count
        current_volunteers = len([a for a in assignments if a.status in ["ASSIGNED", "CONFIRMED", "COMPLETED"]])
        
        event_dict = event.to_dict()
        event_dict["organizerInfo"] = {
            "id": str(organizer_info._id),
            "name": organizer_info.fullName,
            "email": organizer_info.email,
            "phone": organizer_info.profile.get("phone"),
            "profileImage": organizer_info.profile.get("profileImage")
        } if organizer_info else None
        event_dict["currentVolunteers"] = current_volunteers
        event_dict["assignments"] = [a.to_dict() for a in assignments]
        
        return {
            "success": True,
            "data": event_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update event
@router.put("/{event_id}", status_code=status.HTTP_200_OK)
async def update_event(
    event_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update an event"""
    try:
        data = await request.json()
        
        event = await EventDB.get_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user can update this event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this event"
            )
        
        # Prepare update data
        update_data = {}
        
        if "title" in data:
            update_data["title"] = data["title"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "category" in data:
            update_data["category"] = data["category"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "date" in data:
            update_data["date"] = datetime.fromisoformat(data["date"]) if isinstance(data["date"], str) else data["date"]
        if "startTime" in data:
            update_data["startTime"] = data["startTime"]
        if "endTime" in data:
            update_data["endTime"] = data["endTime"]
        if "registrationDeadline" in data:
            update_data["registrationDeadline"] = datetime.fromisoformat(data["registrationDeadline"]) if isinstance(data["registrationDeadline"], str) else data["registrationDeadline"]
        if "requiredVolunteers" in data:
            update_data["requiredVolunteers"] = data["requiredVolunteers"]
        if "maximumVolunteers" in data:
            update_data["maximumVolunteers"] = data["maximumVolunteers"]
        if "location" in data:
            update_data["location"] = data["location"]
        if "contactEmail" in data:
            update_data["contactEmail"] = data["contactEmail"]
        if "contactPhone" in data:
            update_data["contactPhone"] = data["contactPhone"]
        if "requiredSkills" in data:
            update_data["requiredSkills"] = data["requiredSkills"]
        if "preferredSkills" in data:
            update_data["preferredSkills"] = data["preferredSkills"]
        if "tags" in data:
            update_data["tags"] = data["tags"]
        if "socialLinks" in data:
            update_data["socialLinks"] = data["socialLinks"]
        if "settings" in data:
            update_data["settings"] = data["settings"]
        if "image" in data:
            update_data["image"] = data["image"]
        if "bannerImage" in data:
            update_data["bannerImage"] = data["bannerImage"]
        
        updated_event = await EventDB.update(event_id, update_data)
        
        if not updated_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        return {
            "success": True,
            "message": "Event updated successfully",
            "data": updated_event.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete event
@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event(
    event_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Delete an event"""
    try:
        event = await EventDB.get_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user can delete this event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this event"
            )
        
        success = await EventDB.delete(event_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        return {
            "success": True,
            "message": "Event deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Publish event
@router.post("/{event_id}/publish", status_code=status.HTTP_200_OK)
async def publish_event(
    event_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Publish an event (open for registration)"""
    try:
        event = await EventDB.get_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user can publish this event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to publish this event"
            )
        
        if event.status != EventStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event must be in DRAFT status to be published"
            )
        
        published_event = await EventDB.publish(event_id)
        
        if not published_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Send notification to admin
        await create_notification({
            "userId": str(current_user["_id"]),
            "type": "EVENT",
            "priority": "MEDIUM",
            "title": f"Event Published: {published_event.title}",
            "message": f"Your event '{published_event.title}' has been published and is now open for registration.",
            "data": {
                "eventId": str(published_event._id),
                "eventTitle": published_event.title,
                "eventDate": str(published_event.date)
            },
            "relatedEntityId": published_event._id,
            "relatedEntityType": "EVENT"
        })
        
        return {
            "success": True,
            "message": "Event published successfully",
            "data": published_event.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error publishing event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Cancel event
@router.post("/{event_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_event(
    event_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Cancel an event"""
    try:
        data = await request.json()
        reason = data.get("reason", "")
        
        event = await EventDB.get_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user can cancel this event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this event"
            )
        
        if event.status in [EventStatus.CANCELLED, EventStatus.COMPLETED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event cannot be cancelled"
            )
        
        cancelled_event = await EventDB.cancel(event_id, reason)
        
        if not cancelled_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Get all volunteers for this event
        assignments = await AssignmentDB.get_event_assignments(event_id)
        
        # Send notifications to all assigned volunteers
        for assignment in assignments:
            await create_notification({
                "userId": str(assignment.volunteerId),
                "type": "EVENT",
                "priority": "HIGH",
                "title": f"Event Cancelled: {cancelled_event.title}",
                "message": f"The event '{cancelled_event.title}' has been cancelled. Reason: {reason or 'Not specified'}",
                "data": {
                    "eventId": str(cancelled_event._id),
                    "eventTitle": cancelled_event.title,
                    "reason": reason or "Not specified"
                },
                "relatedEntityId": cancelled_event._id,
                "relatedEntityType": "EVENT"
            })
        
        return {
            "success": True,
            "message": "Event cancelled successfully",
            "data": cancelled_event.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Complete event
@router.post("/{event_id}/complete", status_code=status.HTTP_200_OK)
async def complete_event(
    event_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Mark an event as completed"""
    try:
        event = await EventDB.get_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user can complete this event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to complete this event"
            )
        
        if event.status in [EventStatus.CANCELLED, EventStatus.COMPLETED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event cannot be completed"
            )
        
        completed_event = await EventDB.complete(event_id)
        
        if not completed_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        return {
            "success": True,
            "message": "Event completed successfully",
            "data": completed_event.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error completing event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get event statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_event_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get event statistics"""
    try:
        if current_user["role"] == UserRole.ADMIN:
            stats = await EventDB.get_stats()
        else:
            stats = await EventDB.get_stats(str(current_user["_id"]))
        
        return {
            "success": True,
            "data": stats
        }
    
    except Exception as e:
        print(f"Error getting event stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get event by QR token
@router.get("/qr/{qr_token}", status_code=status.HTTP_200_OK)
async def get_event_by_qr_token(
    qr_token: str
):
    """Get event by QR token"""
    try:
        event = await EventDB.get_by_qr_token(qr_token)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        return {
            "success": True,
            "data": event.to_dict()
        }
    
    except Exception as e:
        print(f"Error getting event by QR token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Generate QR code for event
@router.post("/{event_id}/generate-qr", status_code=status.HTTP_200_OK)
async def generate_qr_code(
    event_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Generate QR code for an event"""
    try:
        event = await EventDB.get_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user can generate QR for this event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to generate QR code for this event"
            )
        
        # In production, this would generate an actual QR code image
        # For now, return the QR token
        qr_url = f"{settings.FRONTEND_URL}/check-in?token={event.qrToken}"
        
        return {
            "success": True,
            "message": "QR code generated successfully",
            "data": {
                "qrToken": event.qrToken,
                "qrUrl": qr_url,
                "eventId": str(event._id),
                "eventTitle": event.title
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating QR code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
