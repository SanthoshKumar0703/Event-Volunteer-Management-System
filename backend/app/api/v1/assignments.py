"""
EventFlow Assignments API
Volunteer assignment management endpoints
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
from ...models.assignment import AssignmentModel, AssignmentDB, AssignmentStatus
from ...models.event import EventModel, EventDB, EventStatus
from ...models.user import UserModel, UserDB, UserRole
from ...models.application import ApplicationDB
from ...models.task import TaskDB
from ...services.email_service import email_service
from ...services.notification_service import create_notification

router = APIRouter(prefix="/assignments", tags=["Assignments"])

settings = get_settings()


# Create assignment
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Create a new assignment for a volunteer"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("eventId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event ID is required"
            )
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
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
                detail="You do not have permission to create assignments for this event"
            )
        
        # Check if volunteer is already assigned
        existing_assignment = await AssignmentDB.get_by_volunteer_and_event(
            data["volunteerId"],
            data["eventId"]
        )
        
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer is already assigned to this event"
            )
        
        # Prepare assignment data
        assignment_data = {
            "eventId": ObjectId(data["eventId"]),
            "volunteerId": ObjectId(data["volunteerId"]),
            "roleId": data.get("roleId"),
            "shiftId": data.get("shiftId"),
            "status": data.get("status", AssignmentStatus.ASSIGNED),
            "assignedAt": datetime.now(timezone.utc),
            "notes": data.get("notes", []),
        }
        
        # Create assignment
        assignment = await AssignmentDB.create(assignment_data)
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(data["volunteerId"])
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ASSIGNMENT",
                "priority": "HIGH",
                "title": f"New Assignment: {event.title}",
                "message": f"You have been assigned to the event '{event.title}'. Please review the details in your dashboard.",
                "data": {
                    "assignmentId": str(assignment._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "eventDate": str(event.date),
                    "roleId": str(assignment.roleId) if assignment.roleId else None
                },
                "relatedEntityId": assignment._id,
                "relatedEntityType": "ASSIGNMENT"
            })
        
        # Send email notification
        if volunteer and volunteer.email:
            role_name = "Volunteer"
            if assignment.roleId:
                # In production, get role name from database
                role_name = "Role"
            
            await email_service.send_event_assigned_email(
                to=volunteer.email,
                name=volunteer.fullName or volunteer.firstName,
                event_title=event.title,
                event_date=str(event.date),
                event_venue=event.location.venue if hasattr(event.location, 'venue') else "",
                role=role_name,
                organizer_name=current_user.get("fullName", current_user.get("firstName", "Organizer"))
            )
        
        return {
            "success": True,
            "message": "Assignment created successfully",
            "data": assignment.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all assignments
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_assignments(
    skip: int = 0,
    limit: int = 100,
    event_id: Optional[str] = None,
    volunteer_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "assignedAt",
    sort_order: int = -1,
    current_user: dict = Depends(get_current_user)
):
    """Get all assignments with optional filters"""
    try:
        # Convert status to enum if provided
        status_enum = None
        if status:
            try:
                status_enum = AssignmentStatus(status)
            except ValueError:
                pass
        
        # For organizers, filter by their events
        if current_user["role"] == UserRole.ORGANIZER:
            events = await EventDB.list_all(organizer=str(current_user["_id"]))
            event_ids = [str(e._id) for e in events]
            
            # Filter assignments by organizer's events
            assignments = []
            all_assignments = await AssignmentDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                status=status_enum,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            for assignment in all_assignments:
                if str(assignment.eventId) in event_ids:
                    assignments.append(assignment)
        else:
            assignments = await AssignmentDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                status=status_enum,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
        
        total = await AssignmentDB.count(
            event_id=event_id,
            volunteer_id=volunteer_id,
            status=status_enum
        )
        
        # Enrich assignments
        enriched_assignments = []
        for assignment in assignments:
            assignment_dict = assignment.to_dict()
            
            # Get event info
            event = await EventDB.get_by_id(assignment.eventId)
            if event:
                assignment_dict["eventInfo"] = {
                    "id": str(event._id),
                    "title": event.title,
                    "date": event.date,
                    "status": event.status
                }
            
            # Get volunteer info
            volunteer = await UserDB.get_by_id(assignment.volunteerId)
            if volunteer:
                assignment_dict["volunteerInfo"] = {
                    "id": str(volunteer._id),
                    "name": volunteer.fullName,
                    "email": volunteer.email,
                    "profileImage": volunteer.profile.get("profileImage")
                }
            
            # Get role info
            if assignment.roleId:
                assignment_dict["roleInfo"] = {"id": str(assignment.roleId)}
            
            # Get shift info
            if assignment.shiftId:
                # In production, get shift from database
                assignment_dict["shiftInfo"] = {"id": str(assignment.shiftId)}
            
            enriched_assignments.append(assignment_dict)
        
        return {
            "success": True,
            "data": enriched_assignments,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting assignments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get assignment by ID
@router.get("/{assignment_id}", status_code=status.HTTP_200_OK)
async def get_assignment(
    assignment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get assignment by ID"""
    try:
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if user can access this assignment
        if current_user["role"] == UserRole.VOLUNTEER:
            if str(current_user["_id"]) != str(assignment.volunteerId):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this assignment"
                )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(assignment.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this assignment"
                )
        
        # Get event info
        event = await EventDB.get_by_id(assignment.eventId)
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(assignment.volunteerId)
        
        # Get role info
        role_info = None
        if assignment.roleId:
            role_info = {"id": str(assignment.roleId)}
        
        # Get shift info
        shift_info = None
        if assignment.shiftId:
            shift_info = {"id": str(assignment.shiftId)}
        
        # Get tasks for this assignment
        tasks = await TaskDB.list_all(
            assignment_id=assignment_id,
            volunteer_id=str(assignment.volunteerId)
        )
        
        assignment_dict = assignment.to_dict()
        assignment_dict["eventInfo"] = {
            "id": str(event._id),
            "title": event.title,
            "date": event.date,
            "startTime": event.startTime,
            "endTime": event.endTime,
            "venue": event.location.venue if hasattr(event.location, 'venue') else "",
            "status": event.status,
            "organizer": str(event.organizer)
        } if event else None
        assignment_dict["volunteerInfo"] = {
            "id": str(volunteer._id),
            "name": volunteer.fullName,
            "email": volunteer.email,
            "phone": volunteer.profile.get("phone"),
            "profileImage": volunteer.profile.get("profileImage")
        } if volunteer else None
        assignment_dict["roleInfo"] = role_info
        assignment_dict["shiftInfo"] = shift_info
        assignment_dict["tasks"] = [t.to_dict() for t in tasks]
        
        return {
            "success": True,
            "data": assignment_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update assignment
@router.put("/{assignment_id}", status_code=status.HTTP_200_OK)
async def update_assignment(
    assignment_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update an assignment"""
    try:
        data = await request.json()
        
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if user can update this assignment
        if current_user["role"] == UserRole.VOLUNTEER:
            if str(current_user["_id"]) != str(assignment.volunteerId):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this assignment"
                )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(assignment.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this assignment"
                )
        
        # Prepare update data
        update_data = {}
        
        if "roleId" in data:
            update_data["roleId"] = data["roleId"]
        if "shiftId" in data:
            update_data["shiftId"] = data["shiftId"]
        if "notes" in data:
            update_data["notes"] = data["notes"]
        
        # Only organizers can update status
        if current_user["role"] in [UserRole.ORGANIZER, UserRole.ADMIN]:
            if "status" in data:
                update_data["status"] = data["status"]
            if "cancellationReason" in data:
                update_data["cancellationReason"] = data["cancellationReason"]
        
        updated_assignment = await AssignmentDB.update(assignment_id, update_data)
        
        if not updated_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        return {
            "success": True,
            "message": "Assignment updated successfully",
            "data": updated_assignment.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete assignment
@router.delete("/{assignment_id}", status_code=status.HTTP_200_OK)
async def delete_assignment(
    assignment_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Delete an assignment"""
    try:
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(assignment.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this assignment"
            )
        
        success = await AssignmentDB.delete(assignment_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        return {
            "success": True,
            "message": "Assignment deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Confirm assignment
@router.post("/{assignment_id}/confirm", status_code=status.HTTP_200_OK)
async def confirm_assignment(
    assignment_id: str,
    request: Request,
    current_user: dict = Depends(check_volunteer)
):
    """Confirm an assignment"""
    try:
        data = await request.json()
        notes = data.get("notes", "")
        
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if this is the volunteer's assignment
        if str(current_user["_id"]) != str(assignment.volunteerId):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to confirm this assignment"
            )
        
        if assignment.status != AssignmentStatus.ASSIGNED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment is not in ASSIGNED status"
            )
        
        confirmed_assignment = await AssignmentDB.confirm(assignment_id, notes)
        
        if not confirmed_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Get event info
        event = await EventDB.get_by_id(assignment.eventId)
        
        # Get organizer info
        organizer = await UserDB.get_by_id(event.organizer) if event else None
        
        # Send notification to organizer
        if organizer:
            await create_notification({
                "userId": str(organizer._id),
                "type": "ASSIGNMENT",
                "priority": "MEDIUM",
                "title": f"Assignment Confirmed for {event.title}",
                "message": f"{current_user['fullName']} has confirmed their assignment for '{event.title}'.",
                "data": {
                    "assignmentId": str(assignment._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "volunteerId": str(current_user["_id"]),
                    "volunteerName": current_user["fullName"],
                    "status": "CONFIRMED"
                },
                "relatedEntityId": assignment._id,
                "relatedEntityType": "ASSIGNMENT"
            })
        
        return {
            "success": True,
            "message": "Assignment confirmed successfully",
            "data": confirmed_assignment.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error confirming assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Complete assignment
@router.post("/{assignment_id}/complete", status_code=status.HTTP_200_OK)
async def complete_assignment(
    assignment_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Mark an assignment as completed"""
    try:
        data = await request.json()
        hours_worked = data.get("hoursWorked")
        performance_rating = data.get("performanceRating")
        feedback = data.get("feedback")
        
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(assignment.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to complete this assignment"
            )
        
        if assignment.status in [AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment cannot be completed"
            )
        
        completed_assignment = await AssignmentDB.complete(
            assignment_id,
            hours_worked,
            performance_rating,
            feedback
        )
        
        if not completed_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(assignment.volunteerId)
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ASSIGNMENT",
                "priority": "MEDIUM",
                "title": f"Assignment Completed for {event.title}",
                "message": f"Your assignment for '{event.title}' has been marked as completed. Thank you for your service!",
                "data": {
                    "assignmentId": str(assignment._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "hoursWorked": hours_worked,
                    "performanceRating": performance_rating,
                    "feedback": feedback
                },
                "relatedEntityId": assignment._id,
                "relatedEntityType": "ASSIGNMENT"
            })
        
        # Update volunteer's total hours
        if volunteer and hours_worked:
            total_hours = volunteer.totalVolunteerHours or 0
            total_hours += hours_worked
            await UserDB.update(str(volunteer._id), {"totalVolunteerHours": round(total_hours, 2)})
        
        return {
            "success": True,
            "message": "Assignment completed successfully",
            "data": completed_assignment.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error completing assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Cancel assignment
@router.post("/{assignment_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_assignment(
    assignment_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Cancel an assignment"""
    try:
        data = await request.json()
        reason = data.get("reason", "")
        
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(assignment.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this assignment"
            )
        
        if assignment.status in [AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment cannot be cancelled"
            )
        
        cancelled_assignment = await AssignmentDB.cancel(assignment_id, reason)
        
        if not cancelled_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(assignment.volunteerId)
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ASSIGNMENT",
                "priority": "HIGH",
                "title": f"Assignment Cancelled for {event.title}",
                "message": f"Your assignment for '{event.title}' has been cancelled. Reason: {reason or 'Not specified'}",
                "data": {
                    "assignmentId": str(assignment._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "status": "CANCELLED",
                    "reason": reason or "Not specified"
                },
                "relatedEntityId": assignment._id,
                "relatedEntityType": "ASSIGNMENT"
            })
        
        return {
            "success": True,
            "message": "Assignment cancelled successfully",
            "data": cancelled_assignment.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Check in for assignment
@router.post("/{assignment_id}/check-in", status_code=status.HTTP_200_OK)
async def check_in_assignment(
    assignment_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Record check-in for an assignment"""
    try:
        data = await request.json()
        check_in_time = data.get("checkInTime")
        
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(assignment.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to check in for this assignment"
            )
        
        checked_in_assignment = await AssignmentDB.check_in(assignment_id, check_in_time)
        
        if not checked_in_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        return {
            "success": True,
            "message": "Check-in recorded successfully",
            "data": checked_in_assignment.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking in assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Check out for assignment
@router.post("/{assignment_id}/check-out", status_code=status.HTTP_200_OK)
async def check_out_assignment(
    assignment_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Record check-out for an assignment"""
    try:
        data = await request.json()
        check_out_time = data.get("checkOutTime")
        notes = data.get("notes", "")
        
        assignment = await AssignmentDB.get_by_id(assignment_id)
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(assignment.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to check out for this assignment"
            )
        
        checked_out_assignment = await AssignmentDB.check_out(assignment_id, check_out_time)
        
        if not checked_out_assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        return {
            "success": True,
            "message": "Check-out recorded successfully",
            "data": checked_out_assignment.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking out assignment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get assignment statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_assignment_stats(
    event_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get assignment statistics"""
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
            
            stats = await AssignmentDB.get_stats(event_id)
        else:
            if current_user["role"] == UserRole.ADMIN:
                stats = await AssignmentDB.get_stats()
            elif current_user["role"] == UserRole.ORGANIZER:
                events = await EventDB.list_all(organizer=str(current_user["_id"]))
                event_ids = [str(e._id) for e in events]
                stats = await AssignmentDB.get_stats(event_ids[0]) if event_ids else {}
            else:
                stats = await AssignmentDB.get_stats(volunteer_id=str(current_user["_id"]))
        
        return {
            "success": True,
            "data": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting assignment stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
