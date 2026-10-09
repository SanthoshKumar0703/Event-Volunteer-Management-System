"""
EventFlow Shifts API
Shift management endpoints
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
from ...models.shift import ShiftModel, ShiftDB, ShiftStatus
from ...models.event import EventModel, EventDB
from ...models.user import UserModel, UserDB, UserRole
from ...models.assignment import AssignmentDB
from ...services.notification_service import create_notification

router = APIRouter(prefix="/shifts", tags=["Shifts"])

settings = get_settings()


# Create shift
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_shift(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Create a new shift"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("eventId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event ID is required"
            )
        if not data.get("title"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title is required"
            )
        if not data.get("date"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date is required"
            )
        if not data.get("slots") or len(data["slots"]) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one slot is required"
            )
        
        # Get event
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
                detail="You do not have permission to create shifts for this event"
            )
        
        # Prepare shift data
        shift_data = {
            "eventId": ObjectId(data["eventId"]),
            "title": data["title"],
            "description": data.get("description", ""),
            "date": datetime.fromisoformat(data["date"]) if isinstance(data["date"], str) else data["date"],
            "slots": data["slots"],
            "requirements": data.get("requirements", []),
            "assignments": data.get("assignments", []),
            "status": data.get("status", ShiftStatus.DRAFT),
            "location": data.get("location"),
            "notes": data.get("notes", []),
            "createdBy": current_user["_id"],
        }
        
        # Create shift
        shift = await ShiftDB.create(shift_data)
        
        return {
            "success": True,
            "message": "Shift created successfully",
            "data": shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all shifts
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_shifts(
    skip: int = 0,
    limit: int = 100,
    event_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "date",
    sort_order: int = 1,
    current_user: dict = Depends(get_current_user)
):
    """Get all shifts with optional filters"""
    try:
        # Convert status to enum if provided
        status_enum = None
        if status:
            try:
                status_enum = ShiftStatus(status)
            except ValueError:
                pass
        
        # For organizers, filter by their events
        if current_user["role"] == UserRole.ORGANIZER:
            events = await EventDB.list_all(organizer=str(current_user["_id"]))
            event_ids = [str(e._id) for e in events]
            
            # Filter shifts by organizer's events
            shifts = []
            all_shifts = await ShiftDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                status=status_enum,
                date_from=date_from,
                date_to=date_to,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            for shift in all_shifts:
                if str(shift.eventId) in event_ids:
                    shifts.append(shift)
        else:
            shifts = await ShiftDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                status=status_enum,
                date_from=date_from,
                date_to=date_to,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
        
        total = await ShiftDB.count(
            event_id=event_id,
            status=status_enum
        )
        
        # Enrich shifts
        enriched_shifts = []
        for shift in shifts:
            shift_dict = shift.to_dict()
            
            # Get event info
            event = await EventDB.get_by_id(shift.eventId)
            if event:
                shift_dict["eventInfo"] = {
                    "id": str(event._id),
                    "title": event.title,
                    "date": event.date
                }
            
            # Get creator info
            creator = await UserDB.get_by_id(shift.createdBy)
            if creator:
                shift_dict["creatorInfo"] = {
                    "id": str(creator._id),
                    "name": creator.fullName
                }
            
            enriched_shifts.append(shift_dict)
        
        return {
            "success": True,
            "data": enriched_shifts,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting shifts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get shift by ID
@router.get("/{shift_id}", status_code=status.HTTP_200_OK)
async def get_shift(
    shift_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get shift by ID"""
    try:
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if user can access this shift
        if current_user["role"] == UserRole.VOLUNTEER:
            # Check if volunteer is assigned to this shift
            is_assigned = False
            for assignment in shift.assignments:
                if str(assignment.volunteerId) == str(current_user["_id"]):
                    is_assigned = True
                    break
            
            if not is_assigned:
                # Check if volunteer has assignment for this event
                assignments = await AssignmentDB.get_volunteer_assignments(current_user["_id"])
                event_ids = [str(a.eventId) for a in assignments]
                if str(shift.eventId) not in event_ids:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this shift"
                    )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(shift.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this shift"
                )
        
        # Get event info
        event = await EventDB.get_by_id(shift.eventId)
        
        # Get creator info
        creator = await UserDB.get_by_id(shift.createdBy)
        
        # Enrich assignments with volunteer info
        enriched_assignments = []
        for assignment in shift.assignments:
            volunteer = await UserDB.get_by_id(assignment.volunteerId)
            enriched_assignments.append({
                **assignment,
                "volunteerInfo": {
                    "id": str(volunteer._id),
                    "name": volunteer.fullName,
                    "email": volunteer.email,
                    "profileImage": volunteer.profile.get("profileImage")
                } if volunteer else None
            })
        
        shift_dict = shift.to_dict()
        shift_dict["eventInfo"] = {
            "id": str(event._id),
            "title": event.title,
            "date": event.date,
            "startTime": event.startTime,
            "endTime": event.endTime,
            "venue": event.location.venue if hasattr(event.location, 'venue') else "",
            "organizer": str(event.organizer)
        } if event else None
        shift_dict["creatorInfo"] = {
            "id": str(creator._id),
            "name": creator.fullName
        } if creator else None
        shift_dict["assignments"] = enriched_assignments
        
        return {
            "success": True,
            "data": shift_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update shift
@router.put("/{shift_id}", status_code=status.HTTP_200_OK)
async def update_shift(
    shift_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update a shift"""
    try:
        data = await request.json()
        
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if user can update this shift
        if current_user["role"] == UserRole.VOLUNTEER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Volunteers cannot update shifts"
            )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(shift.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this shift"
                )
        
        # Prepare update data
        update_data = {}
        
        if "title" in data:
            update_data["title"] = data["title"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "date" in data:
            update_data["date"] = datetime.fromisoformat(data["date"]) if isinstance(data["date"], str) else data["date"]
        if "slots" in data:
            update_data["slots"] = data["slots"]
        if "requirements" in data:
            update_data["requirements"] = data["requirements"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "location" in data:
            update_data["location"] = data["location"]
        if "notes" in data:
            update_data["notes"] = data["notes"]
        
        updated_shift = await ShiftDB.update(shift_id, update_data)
        
        if not updated_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        return {
            "success": True,
            "message": "Shift updated successfully",
            "data": updated_shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete shift
@router.delete("/{shift_id}", status_code=status.HTTP_200_OK)
async def delete_shift(
    shift_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Delete a shift"""
    try:
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(shift.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this shift"
            )
        
        success = await ShiftDB.delete(shift_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        return {
            "success": True,
            "message": "Shift deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Publish shift
@router.post("/{shift_id}/publish", status_code=status.HTTP_200_OK)
async def publish_shift(
    shift_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Publish a shift (open for registration)"""
    try:
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(shift.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to publish this shift"
            )
        
        if shift.status != ShiftStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift must be in DRAFT status to be published"
            )
        
        published_shift = await ShiftDB.publish(shift_id)
        
        if not published_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        return {
            "success": True,
            "message": "Shift published successfully",
            "data": published_shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error publishing shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Close shift
@router.post("/{shift_id}/close", status_code=status.HTTP_200_OK)
async def close_shift(
    shift_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Close a shift (no more registrations)"""
    try:
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(shift.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to close this shift"
            )
        
        if shift.status not in [ShiftStatus.OPEN, ShiftStatus.DRAFT]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shift cannot be closed"
            )
        
        closed_shift = await ShiftDB.close(shift_id)
        
        if not closed_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        return {
            "success": True,
            "message": "Shift closed successfully",
            "data": closed_shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error closing shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Assign volunteer to shift
@router.post("/{shift_id}/assign", status_code=status.HTTP_200_OK)
async def assign_volunteer_to_shift(
    shift_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Assign a volunteer to a shift"""
    try:
        data = await request.json()
        
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        if not data.get("slotIndex") and data.get("slotIndex") != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot index is required"
            )
        
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(shift.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to assign volunteers to this shift"
            )
        
        # Check if slot exists
        slot_index = data["slotIndex"]
        if slot_index >= len(shift.slots):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot index out of range"
            )
        
        # Check if slot is full
        slot = shift.slots[slot_index]
        if slot.currentVolunteers >= slot.maxVolunteers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot is full"
            )
        
        # Check if volunteer is already assigned to this shift
        for assignment in shift.assignments:
            if str(assignment.volunteerId) == str(data["volunteerId"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Volunteer is already assigned to this shift"
                )
        
        updated_shift = await ShiftDB.assign_volunteer(
            shift_id,
            data["volunteerId"],
            slot_index,
            data.get("assignmentId")
        )
        
        if not updated_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(data["volunteerId"])
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ASSIGNMENT",
                "priority": "MEDIUM",
                "title": f"Shift Assignment: {shift.title}",
                "message": f"You have been assigned to the shift '{shift.title}' for event '{event.title}'.",
                "data": {
                    "shiftId": str(shift._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "shiftTitle": shift.title,
                    "shiftDate": str(shift.date),
                    "slotIndex": slot_index,
                    "slotTime": f"{slot.startTime} - {slot.endTime}"
                },
                "relatedEntityId": shift._id,
                "relatedEntityType": "SHIFT"
            })
        
        return {
            "success": True,
            "message": "Volunteer assigned to shift successfully",
            "data": updated_shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning volunteer to shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Remove volunteer from shift
@router.post("/{shift_id}/remove-volunteer", status_code=status.HTTP_200_OK)
async def remove_volunteer_from_shift(
    shift_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Remove a volunteer from a shift"""
    try:
        data = await request.json()
        
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        if not data.get("slotIndex") and data.get("slotIndex") != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot index is required"
            )
        
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(shift.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to remove volunteers from this shift"
            )
        
        # Check if volunteer is assigned to this slot
        found = False
        for assignment in shift.assignments:
            if str(assignment.volunteerId) == str(data["volunteerId"]) and assignment.slotIndex == data["slotIndex"]:
                found = True
                break
        
        if not found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Volunteer not found in this slot"
            )
        
        updated_shift = await ShiftDB.remove_volunteer(
            shift_id,
            data["volunteerId"],
            data["slotIndex"]
        )
        
        if not updated_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(data["volunteerId"])
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ASSIGNMENT",
                "priority": "MEDIUM",
                "title": f"Shift Assignment Removed: {shift.title}",
                "message": f"You have been removed from the shift '{shift.title}' for event '{event.title}'.",
                "data": {
                    "shiftId": str(shift._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "shiftTitle": shift.title,
                    "status": "REMOVED"
                },
                "relatedEntityId": shift._id,
                "relatedEntityType": "SHIFT"
            })
        
        return {
            "success": True,
            "message": "Volunteer removed from shift successfully",
            "data": updated_shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error removing volunteer from shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Check in volunteer for shift
@router.post("/{shift_id}/check-in", status_code=status.HTTP_200_OK)
async def check_in_volunteer_for_shift(
    shift_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Check in a volunteer for a shift"""
    try:
        data = await request.json()
        
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        if not data.get("slotIndex") and data.get("slotIndex") != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot index is required"
            )
        
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(shift.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to check in volunteers for this shift"
            )
        
        check_in_time = data.get("checkInTime")
        
        updated_shift = await ShiftDB.check_in_volunteer(
            shift_id,
            data["volunteerId"],
            data["slotIndex"],
            check_in_time
        )
        
        if not updated_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        return {
            "success": True,
            "message": "Volunteer checked in successfully",
            "data": updated_shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking in volunteer for shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Check out volunteer from shift
@router.post("/{shift_id}/check-out", status_code=status.HTTP_200_OK)
async def check_out_volunteer_from_shift(
    shift_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Check out a volunteer from a shift"""
    try:
        data = await request.json()
        
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        if not data.get("slotIndex") and data.get("slotIndex") != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot index is required"
            )
        
        shift = await ShiftDB.get_by_id(shift_id)
        
        if not shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(shift.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to check out volunteers from this shift"
            )
        
        check_out_time = data.get("checkOutTime")
        
        updated_shift = await ShiftDB.check_out_volunteer(
            shift_id,
            data["volunteerId"],
            data["slotIndex"],
            check_out_time
        )
        
        if not updated_shift:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shift not found"
            )
        
        return {
            "success": True,
            "message": "Volunteer checked out successfully",
            "data": updated_shift.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking out volunteer from shift: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get shift statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_shift_stats(
    event_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get shift statistics"""
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
            
            stats = await ShiftDB.get_stats(event_id)
        else:
            if current_user["role"] == UserRole.ADMIN:
                stats = await ShiftDB.get_stats()
            elif current_user["role"] == UserRole.ORGANIZER:
                events = await EventDB.list_all(organizer=str(current_user["_id"]))
                event_ids = [str(e._id) for e in events]
                stats = await ShiftDB.get_stats(event_ids[0]) if event_ids else {}
            else:
                # For volunteers, get stats for shifts they're assigned to
                shifts = await ShiftDB.get_volunteer_shifts(current_user["_id"])
                stats = await ShiftDB.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting shift stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
