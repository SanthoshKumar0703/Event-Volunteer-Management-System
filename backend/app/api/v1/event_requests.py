"""
EventFlow Event Requests API
Event request management endpoints
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
from ...models.event_request import EventRequestModel, EventRequestDB, EventRequestStatus, EventCategory
from ...models.user import UserModel, UserDB, UserRole
from ...models.counter import CounterDB
from ...services.email_service import EmailService
from ...services.notification_service import create_notification

router = APIRouter(prefix="/event-requests", tags=["Event Requests"])

settings = get_settings()


# Create event request
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_event_request(
    request: Request
):
    """Create a new event request"""
    try:
        data = await request.json()
        
        # Validate required fields
        required_fields = ["eventName", "organizationName", "contactPerson", "contactEmail", "category", "description", "venue", "eventDate", "startTime", "endTime", "expectedAttendees", "requiredVolunteers"]
        for field in required_fields:
            if not data.get(field):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"{field.replace('event', 'Event ').replace('contact', 'Contact ').replace('expected', 'Expected ').replace('required', 'Required ')} is required"
                )
        
        # Create request data
        request_data = {
            "eventName": data["eventName"],
            "organizationName": data["organizationName"],
            "contactPerson": data["contactPerson"],
            "contactEmail": data["contactEmail"],
            "contactPhone": data.get("contactPhone", ""),
            "category": data["category"],
            "description": data["description"],
            "venue": data["venue"],
            "venueAddress": data.get("venueAddress", ""),
            "venueCity": data.get("venueCity", ""),
            "venueState": data.get("venueState", ""),
            "venuePostalCode": data.get("venuePostalCode", ""),
            "venueCountry": data.get("venueCountry", ""),
            "eventDate": datetime.fromisoformat(data["eventDate"]) if isinstance(data["eventDate"], str) else data["eventDate"],
            "startTime": data["startTime"],
            "endTime": data["endTime"],
            "expectedAttendees": data["expectedAttendees"],
            "requiredVolunteers": data["requiredVolunteers"],
            "requiredSkills": data.get("requiredSkills", []),
            "additionalRequirements": data.get("additionalRequirements", ""),
            "budget": data.get("budget"),
            "website": data.get("website"),
            "socialMediaLinks": data.get("socialMediaLinks", []),
            "status": EventRequestStatus.PENDING_REVIEW,
        }
        
        # Create request
        event_request = await EventRequestDB.create(request_data)
        
        return {
            "success": True,
            "message": "Event request submitted successfully",
            "data": event_request.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating event request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all event requests (Admin only)
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_event_requests(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(check_admin)
):
    """Get all event requests with optional filters"""
    try:
        requests = await EventRequestDB.list_all(
            skip=skip,
            limit=limit,
            status=status,
            category=category,
            search=search
        )
        
        total = await EventRequestDB.count(status=status)
        
        return {
            "success": True,
            "data": [request.to_dict() for request in requests],
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    except Exception as e:
        print(f"Error getting event requests: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get event request by ID
@router.get("/{request_id}", status_code=status.HTTP_200_OK)
async def get_event_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get event request by ID"""
    try:
        event_request = await EventRequestDB.get_by_id(request_id)
        
        if not event_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        # Check if user can access this request
        if current_user["role"] != UserRole.ADMIN:
            # For non-admin users, check if they created this request
            if str(current_user["_id"]) != str(event_request.createdBy):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this request"
                )
        
        return {
            "success": True,
            "data": event_request.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting event request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update event request
@router.put("/{request_id}", status_code=status.HTTP_200_OK)
async def update_event_request(
    request_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update an event request"""
    try:
        data = await request.json()
        
        event_request = await EventRequestDB.get_by_id(request_id)
        
        if not event_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        # Check if user can update this request
        if current_user["role"] != UserRole.ADMIN:
            if str(current_user["_id"]) != str(event_request.createdBy):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this request"
                )
        
        # Prepare update data
        update_data = {}
        
        if "status" in data:
            update_data["status"] = data["status"]
        if "notes" in data:
            update_data["notes"] = data["notes"]
        if "internalNotes" in data:
            update_data["internalNotes"] = data["internalNotes"]
        if "assignedOrganizer" in data:
            update_data["assignedOrganizer"] = ObjectId(data["assignedOrganizer"])
            update_data["assignedAt"] = datetime.now(timezone.utc)
        
        # Admin-only fields
        if current_user["role"] == UserRole.ADMIN:
            if "reviewedBy" in data:
                update_data["reviewedBy"] = ObjectId(data["reviewedBy"])
            update_data["reviewedAt"] = datetime.now(timezone.utc)
        
        updated_request = await EventRequestDB.update(request_id, update_data)
        
        if not updated_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        return {
            "success": True,
            "message": "Event request updated successfully",
            "data": updated_request.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating event request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Approve event request (Admin only)
@router.post("/{request_id}/approve", status_code=status.HTTP_200_OK)
async def approve_event_request(
    request_id: str,
    request: Request,
    current_user: dict = Depends(check_admin)
):
    """Approve an event request"""
    try:
        data = await request.json()
        assigned_organizer_id = data.get("assignedOrganizer")
        notes = data.get("notes", "")
        
        event_request = await EventRequestDB.get_by_id(request_id)
        
        if not event_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        if event_request.status != EventRequestStatus.PENDING_REVIEW:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event request is not in PENDING_REVIEW status"
            )
        
        # Get assigned organizer
        if assigned_organizer_id:
            organizer = await UserDB.get_by_id(assigned_organizer_id)
            if not organizer:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Organizer not found"
                )
            if organizer.role != UserRole.ORGANIZER:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Selected user is not an organizer"
                )
        
        # Update request
        update_data = {
            "status": EventRequestStatus.APPROVED,
            "assignedOrganizer": ObjectId(assigned_organizer_id) if assigned_organizer_id else None,
            "assignedAt": datetime.now(timezone.utc),
            "reviewedBy": current_user["_id"],
            "reviewedAt": datetime.now(timezone.utc),
        }
        
        if notes:
            update_data["notes"] = [notes]
        
        updated_request = await EventRequestDB.update(request_id, update_data)
        
        if not updated_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        # Create event from request
        if assigned_organizer_id:
            event_id = await CounterDB.get_next_sequence("event_id")
            event_data = {
                "_id": event_id,
                "title": updated_request.eventName,
                "description": updated_request.description,
                "category": updated_request.category,
                "status": "DRAFT",
                "eventId": f"EVT-{event_id:06d}",
                "organizer": ObjectId(assigned_organizer_id),
                "location": {
                    "venue": updated_request.venue,
                    "address": updated_request.venueAddress or "",
                    "city": updated_request.venueCity or "",
                    "state": updated_request.venueState or "",
                    "postalCode": updated_request.venuePostalCode or "",
                    "country": updated_request.venueCountry or "",
                },
                "date": updated_request.eventDate,
                "startTime": updated_request.startTime,
                "endTime": updated_request.endTime,
                "registrationDeadline": updated_request.eventDate,  # Set to event date by default
                "requiredVolunteers": updated_request.requiredVolunteers,
                "maximumVolunteers": updated_request.requiredVolunteers + 10,
                "contactEmail": updated_request.contactEmail,
                "contactPhone": updated_request.contactPhone,
                "qrToken": f"QR-{event_id:08d}",
                "requestId": updated_request._id,
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            
            events_collection = db.get_collection(Collections.EVENTS)
            await events_collection.insert_one(event_data)
            
            # Update request with event ID
            await EventRequestDB.update(request_id, {
                "eventId": event_id,
                "status": EventRequestStatus.ORGANIZER_ASSIGNED
            })
            
            # Send notification to organizer
            await create_notification({
                "userId": assigned_organizer_id,
                "type": "EVENT",
                "priority": "HIGH",
                "title": f"New Event Assigned: {updated_request.eventName}",
                "message": f"You have been assigned as the organizer for '{updated_request.eventName}'. Please review the event details in your dashboard.",
                "data": {
                    "eventId": str(event_id),
                    "eventTitle": updated_request.eventName,
                    "requestId": str(updated_request._id)
                },
                "relatedEntityId": event_id,
                "relatedEntityType": "EVENT"
            })
        
        return {
            "success": True,
            "message": "Event request approved successfully",
            "data": updated_request.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving event request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Reject event request (Admin only)
@router.post("/{request_id}/reject", status_code=status.HTTP_200_OK)
async def reject_event_request(
    request_id: str,
    request: Request,
    current_user: dict = Depends(check_admin)
):
    """Reject an event request"""
    try:
        data = await request.json()
        rejection_reason = data.get("rejectionReason", "")
        notes = data.get("notes", "")
        
        event_request = await EventRequestDB.get_by_id(request_id)
        
        if not event_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        if event_request.status != EventRequestStatus.PENDING_REVIEW:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event request is not in PENDING_REVIEW status"
            )
        
        # Update request
        update_data = {
            "status": EventRequestStatus.REJECTED,
            "reviewedBy": current_user["_id"],
            "reviewedAt": datetime.now(timezone.utc),
        }
        
        if rejection_reason:
            update_data["rejectionReason"] = rejection_reason
        if notes:
            update_data["notes"] = [notes]
        
        updated_request = await EventRequestDB.update(request_id, update_data)
        
        if not updated_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        # Send notification to requester
        if updated_request.createdBy:
            await create_notification({
                "userId": updated_request.createdBy,
                "type": "SYSTEM",
                "priority": "HIGH",
                "title": "Event Request Rejected",
                "message": f"Your event request '{updated_request.eventName}' has been rejected. Reason: {rejection_reason or 'Not specified'}",
                "data": {
                    "requestId": str(updated_request._id),
                    "eventTitle": updated_request.eventName,
                    "reason": rejection_reason or "Not specified"
                },
                "relatedEntityId": updated_request._id,
                "relatedEntityType": "EVENT_REQUEST"
            })
        
        return {
            "success": True,
            "message": "Event request rejected successfully",
            "data": updated_request.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rejecting event request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete event request (Admin only)
@router.delete("/{request_id}", status_code=status.HTTP_200_OK)
async def delete_event_request(
    request_id: str,
    current_user: dict = Depends(check_admin)
):
    """Delete an event request"""
    try:
        event_request = await EventRequestDB.get_by_id(request_id)
        
        if not event_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        success = await EventRequestDB.delete(request_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event request not found"
            )
        
        return {
            "success": True,
            "message": "Event request deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting event request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get event request stats (Admin only)
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_event_request_stats(
    current_user: dict = Depends(check_admin)
):
    """Get event request statistics"""
    try:
        stats = await EventRequestDB.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        print(f"Error getting event request stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
