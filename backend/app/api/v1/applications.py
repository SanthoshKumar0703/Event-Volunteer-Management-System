"""
EventFlow Applications API
Volunteer application management endpoints
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
from ...models.application import ApplicationModel, ApplicationDB, ApplicationStatus
from ...models.event import EventModel, EventDB, EventStatus
from ...models.user import UserModel, UserDB, UserRole
from ...models.assignment import AssignmentDB
from ...models.counter import CounterDB
from ...services.email_service import email_service
from ...services.notification_service import create_notification

router = APIRouter(prefix="/applications", tags=["Applications"])

settings = get_settings()


# Create application
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_application(
    request: Request,
    current_user: dict = Depends(check_volunteer)
):
    """Create a new application for an event"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("eventId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event ID is required"
            )
        
        # Get event
        event = await EventDB.get_by_id(data["eventId"])
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if event is open for applications
        if event.status not in [EventStatus.OPEN_FOR_REGISTRATION, EventStatus.UPCOMING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is not open for applications"
            )
        
        # Check if volunteer already has an application for this event
        existing_application = await ApplicationDB.get_by_volunteer_and_event(
            current_user["_id"],
            data["eventId"]
        )
        
        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already applied for this event"
            )
        
        # Check if event has reached maximum volunteers
        if event.maximumVolunteers and event.currentVolunteers >= event.maximumVolunteers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event has reached maximum number of volunteers"
            )
        
        # Prepare application data
        application_data = {
            "eventId": ObjectId(data["eventId"]),
            "volunteerId": current_user["_id"],
            "roleId": data.get("roleId"),
            "coverLetter": data.get("coverLetter"),
            "answers": data.get("answers", []),
            "skillMatches": data.get("skillMatches", []),
            "matchScore": data.get("matchScore", 0.0),
            "priority": data.get("priority"),
        }
        
        # Calculate match score
        if event.requiredSkills:
            volunteer = await UserDB.get_by_id(current_user["_id"])
            if volunteer:
                match_score = await ApplicationDB.calculate_match_score(
                    volunteer.skills,
                    event.requiredSkills,
                    event.preferredSkills
                )
                application_data["matchScore"] = match_score
        
        # Create application
        application = await ApplicationDB.create(application_data)
        
        # Send notification to organizer
        organizer = await UserDB.get_by_id(event.organizer)
        if organizer:
            await create_notification({
                "userId": str(organizer._id),
                "type": "APPLICATION",
                "priority": "MEDIUM",
                "title": f"New Application for {event.title}",
                "message": f"{current_user['fullName']} has applied for the event '{event.title}'.",
                "data": {
                    "applicationId": str(application._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "volunteerId": str(current_user["_id"]),
                    "volunteerName": current_user["fullName"],
                    "matchScore": application.matchScore
                },
                "relatedEntityId": application._id,
                "relatedEntityType": "APPLICATION"
            })
        
        return {
            "success": True,
            "message": "Application submitted successfully",
            "data": application.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all applications
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_applications(
    skip: int = 0,
    limit: int = 100,
    event_id: Optional[str] = None,
    volunteer_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "applicationDate",
    sort_order: int = -1,
    current_user: dict = Depends(get_current_user)
):
    """Get all applications with optional filters"""
    try:
        # Convert status to enum if provided
        status_enum = None
        if status:
            try:
                status_enum = ApplicationStatus(status)
            except ValueError:
                pass
        
        # For organizers, filter by their events
        if current_user["role"] == UserRole.ORGANIZER:
            # Get organizer's events
            events = await EventDB.list_all(organizer=str(current_user["_id"]))
            event_ids = [str(e._id) for e in events]
            
            # Filter applications by organizer's events
            applications = []
            all_applications = await ApplicationDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                status=status_enum,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            for app in all_applications:
                if str(app.eventId) in event_ids:
                    applications.append(app)
        else:
            applications = await ApplicationDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                status=status_enum,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
        
        total = await ApplicationDB.count(
            event_id=event_id,
            volunteer_id=volunteer_id,
            status=status_enum
        )
        
        # Enrich applications
        enriched_applications = []
        for app in applications:
            app_dict = app.to_dict()
            
            # Get event info
            event = await EventDB.get_by_id(app.eventId)
            if event:
                app_dict["eventInfo"] = {
                    "id": str(event._id),
                    "title": event.title,
                    "date": event.date,
                    "status": event.status
                }
            
            # Get volunteer info
            volunteer = await UserDB.get_by_id(app.volunteerId)
            if volunteer:
                app_dict["volunteerInfo"] = {
                    "id": str(volunteer._id),
                    "name": volunteer.fullName,
                    "email": volunteer.email,
                    "profileImage": volunteer.profile.get("profileImage")
                }
            
            # Get role info
            if app.roleId:
                # In production, get role from database
                app_dict["roleInfo"] = {"id": str(app.roleId)}
            
            enriched_applications.append(app_dict)
        
        return {
            "success": True,
            "data": enriched_applications,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting applications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get application by ID
@router.get("/{application_id}", status_code=status.HTTP_200_OK)
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get application by ID"""
    try:
        application = await ApplicationDB.get_by_id(application_id)
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Check if user can access this application
        if current_user["role"] == UserRole.VOLUNTEER:
            if str(current_user["_id"]) != str(application.volunteerId):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this application"
                )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(application.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this application"
                )
        
        # Get event info
        event = await EventDB.get_by_id(application.eventId)
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(application.volunteerId)
        
        # Get role info
        role_info = None
        if application.roleId:
            # In production, get role from database
            role_info = {"id": str(application.roleId)}
        
        app_dict = application.to_dict()
        app_dict["eventInfo"] = {
            "id": str(event._id),
            "title": event.title,
            "date": event.date,
            "status": event.status,
            "organizer": str(event.organizer)
        } if event else None
        app_dict["volunteerInfo"] = {
            "id": str(volunteer._id),
            "name": volunteer.fullName,
            "email": volunteer.email,
            "phone": volunteer.profile.get("phone"),
            "profileImage": volunteer.profile.get("profileImage"),
            "skills": volunteer.skills,
            "experience": volunteer.experience
        } if volunteer else None
        app_dict["roleInfo"] = role_info
        
        return {
            "success": True,
            "data": app_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update application
@router.put("/{application_id}", status_code=status.HTTP_200_OK)
async def update_application(
    application_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update an application"""
    try:
        data = await request.json()
        
        application = await ApplicationDB.get_by_id(application_id)
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Check if user can update this application
        if current_user["role"] == UserRole.VOLUNTEER:
            if str(current_user["_id"]) != str(application.volunteerId):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this application"
                )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(application.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this application"
                )
        
        # Prepare update data
        update_data = {}
        
        if "coverLetter" in data:
            update_data["coverLetter"] = data["coverLetter"]
        if "answers" in data:
            update_data["answers"] = data["answers"]
        if "priority" in data:
            update_data["priority"] = data["priority"]
        
        # Only organizers can update status and notes
        if current_user["role"] in [UserRole.ORGANIZER, UserRole.ADMIN]:
            if "status" in data:
                update_data["status"] = data["status"]
            if "notes" in data:
                update_data["notes"] = data["notes"]
            if "rejectionReason" in data:
                update_data["rejectionReason"] = data["rejectionReason"]
        
        updated_application = await ApplicationDB.update(application_id, update_data)
        
        if not updated_application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        return {
            "success": True,
            "message": "Application updated successfully",
            "data": updated_application.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete application
@router.delete("/{application_id}", status_code=status.HTTP_200_OK)
async def delete_application(
    application_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Delete an application"""
    try:
        application = await ApplicationDB.get_by_id(application_id)
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Check if user can delete this application
        if current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(application.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete this application"
                )
        
        success = await ApplicationDB.delete(application_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        return {
            "success": True,
            "message": "Application deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Approve application
@router.post("/{application_id}/approve", status_code=status.HTTP_200_OK)
async def approve_application(
    application_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Approve a volunteer application"""
    try:
        data = await request.json()
        notes = data.get("notes", "")
        
        application = await ApplicationDB.get_by_id(application_id)
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(application.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to approve this application"
            )
        
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application is not in PENDING status"
            )
        
        approved_application = await ApplicationDB.approve(
            application_id,
            current_user["_id"],
            notes
        )
        
        if not approved_application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Create assignment
        assignment_data = {
            "eventId": application.eventId,
            "volunteerId": application.volunteerId,
            "roleId": application.roleId,
            "status": "ASSIGNED",
            "assignedAt": datetime.now(timezone.utc),
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        assignment = await AssignmentDB.create(assignment_data)
        
        # Update application with assignment ID
        await ApplicationDB.update(application_id, {"assignmentId": assignment._id})
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(application.volunteerId)
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "APPLICATION",
                "priority": "HIGH",
                "title": f"Application Approved for {event.title}",
                "message": f"Your application for '{event.title}' has been approved! You are now assigned to this event.",
                "data": {
                    "applicationId": str(application._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "assignmentId": str(assignment._id),
                    "status": "APPROVED"
                },
                "relatedEntityId": application._id,
                "relatedEntityType": "APPLICATION"
            })
        
        # Send email notification
        if volunteer and volunteer.email:
            await email_service.send_event_assigned_email(
                to=volunteer.email,
                name=volunteer.fullName or volunteer.firstName,
                event_title=event.title,
                event_date=str(event.date),
                event_venue=event.location.venue if hasattr(event.location, 'venue') else "",
                role=application.roleId or "Volunteer",
                organizer_name=current_user.get("fullName", current_user.get("firstName", "Organizer"))
            )
        
        return {
            "success": True,
            "message": "Application approved successfully",
            "data": {
                "application": approved_application.to_dict(),
                "assignment": assignment.to_dict()
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Reject application
@router.post("/{application_id}/reject", status_code=status.HTTP_200_OK)
async def reject_application(
    application_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Reject a volunteer application"""
    try:
        data = await request.json()
        rejection_reason = data.get("rejectionReason", "")
        notes = data.get("notes", "")
        
        application = await ApplicationDB.get_by_id(application_id)
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(application.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to reject this application"
            )
        
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application is not in PENDING status"
            )
        
        rejected_application = await ApplicationDB.reject(
            application_id,
            current_user["_id"],
            rejection_reason,
            notes
        )
        
        if not rejected_application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(application.volunteerId)
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "APPLICATION",
                "priority": "HIGH",
                "title": f"Application Rejected for {event.title}",
                "message": f"Your application for '{event.title}' has been rejected. Reason: {rejection_reason or 'Not specified'}",
                "data": {
                    "applicationId": str(application._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "status": "REJECTED",
                    "reason": rejection_reason or "Not specified"
                },
                "relatedEntityId": application._id,
                "relatedEntityType": "APPLICATION"
            })
        
        return {
            "success": True,
            "message": "Application rejected successfully",
            "data": rejected_application.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error rejecting application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Withdraw application
@router.post("/{application_id}/withdraw", status_code=status.HTTP_200_OK)
async def withdraw_application(
    application_id: str,
    request: Request,
    current_user: dict = Depends(check_volunteer)
):
    """Withdraw a volunteer application"""
    try:
        data = await request.json()
        reason = data.get("withdrawalReason", "")
        
        application = await ApplicationDB.get_by_id(application_id)
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Check if this is the volunteer's application
        if str(current_user["_id"]) != str(application.volunteerId):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to withdraw this application"
            )
        
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application is not in PENDING status"
            )
        
        withdrawn_application = await ApplicationDB.withdraw(application_id, reason)
        
        if not withdrawn_application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        # Get event info
        event = await EventDB.get_by_id(application.eventId)
        
        # Get organizer info
        organizer = await UserDB.get_by_id(event.organizer) if event else None
        
        # Send notification to organizer
        if organizer:
            await create_notification({
                "userId": str(organizer._id),
                "type": "APPLICATION",
                "priority": "MEDIUM",
                "title": f"Application Withdrawn for {event.title}",
                "message": f"{current_user['fullName']} has withdrawn their application for '{event.title}'.",
                "data": {
                    "applicationId": str(application._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "volunteerId": str(current_user["_id"]),
                    "volunteerName": current_user["fullName"],
                    "status": "WITHDRAWN",
                    "reason": reason or "Not specified"
                },
                "relatedEntityId": application._id,
                "relatedEntityType": "APPLICATION"
            })
        
        return {
            "success": True,
            "message": "Application withdrawn successfully",
            "data": withdrawn_application.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error withdrawing application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get application statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_application_stats(
    event_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get application statistics"""
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
            
            stats = await ApplicationDB.get_stats(event_id)
        else:
            if current_user["role"] == UserRole.ADMIN:
                stats = await ApplicationDB.get_stats()
            elif current_user["role"] == UserRole.ORGANIZER:
                events = await EventDB.list_all(organizer=str(current_user["_id"]))
                event_ids = [str(e._id) for e in events]
                stats = await ApplicationDB.get_stats(event_ids[0]) if event_ids else {}
            else:
                stats = await ApplicationDB.get_stats(volunteer_id=str(current_user["_id"]))
        
        return {
            "success": True,
            "data": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting application stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
