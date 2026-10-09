"""
EventFlow Attendance API
Attendance management endpoints for check-in/check-out
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
from ...models.attendance import AttendanceModel, AttendanceDB, AttendanceStatus, CheckInMethod
from ...models.event import EventModel, EventDB
from ...models.user import UserModel, UserDB, UserRole
from ...models.shift import ShiftDB
from ...models.assignment import AssignmentDB
from ...services.notification_service import create_notification

router = APIRouter(prefix="/attendance", tags=["Attendance"])

settings = get_settings()


# Check in volunteer
@router.post("/check-in", status_code=status.HTTP_201_CREATED)
async def check_in_volunteer(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Record check-in for a volunteer"""
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
                detail="You do not have permission to check in volunteers for this event"
            )
        
        # Check if volunteer has an assignment for this event
        assignment = await AssignmentDB.get_by_volunteer_and_event(
            data["volunteerId"],
            data["eventId"]
        )
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer does not have an assignment for this event"
            )
        
        # Check if already checked in
        existing_attendance = await AttendanceDB.get_by_volunteer_and_event(
            data["volunteerId"],
            data["eventId"]
        )
        
        if existing_attendance and existing_attendance.checkOutTime is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer is already checked in"
            )
        
        # Record check-in
        attendance = await AttendanceDB.check_in(
            event_id=data["eventId"],
            volunteer_id=data["volunteerId"],
            shift_id=data.get("shiftId"),
            assignment_id=assignment._id,
            qr_token=data.get("qrToken"),
            check_in_method=data.get("checkInMethod", CheckInMethod.QR_CODE),
            check_in_by=current_user["_id"],
            health_declaration=data.get("healthDeclaration"),
            temperature=data.get("temperature")
        )
        
        # Update shift if provided
        if data.get("shiftId"):
            await ShiftDB.check_in_volunteer(
                data["shiftId"],
                data["volunteerId"],
                0  # Default slot index
            )
        
        # Update assignment
        await AssignmentDB.check_in(assignment._id)
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(data["volunteerId"])
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ATTENDANCE",
                "priority": "MEDIUM",
                "title": f"Checked In: {event.title}",
                "message": f"You have been checked in for the event '{event.title}'.",
                "data": {
                    "attendanceId": str(attendance._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "checkInTime": str(attendance.checkInTime)
                },
                "relatedEntityId": attendance._id,
                "relatedEntityType": "ATTENDANCE"
            })
        
        return {
            "success": True,
            "message": "Volunteer checked in successfully",
            "data": attendance.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking in volunteer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Check out volunteer
@router.post("/check-out", status_code=status.HTTP_200_OK)
async def check_out_volunteer(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Record check-out for a volunteer"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("attendanceId") and not data.get("eventId") and not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance ID or (Event ID and Volunteer ID) is required"
            )
        
        attendance = None
        
        if data.get("attendanceId"):
            attendance = await AttendanceDB.get_by_id(data["attendanceId"])
        else:
            # Find attendance by event and volunteer
            attendance = await AttendanceDB.get_by_volunteer_and_event(
                data["volunteerId"],
                data["eventId"]
            )
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )
        
        # Get event
        event = await EventDB.get_by_id(attendance.eventId)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if this is organizer's event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to check out volunteers for this event"
            )
        
        # Check if already checked out
        if attendance.checkOutTime is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer is already checked out"
            )
        
        # Record check-out
        checked_out_attendance = await AttendanceDB.check_out(
            attendance._id,
            data.get("checkOutMethod", CheckInMethod.QR_CODE),
            current_user["_id"],
            data.get("notes")
        )
        
        # Update shift if provided
        if attendance.shiftId:
            # Find the assignment to get slot index
            assignments = await AssignmentDB.get_volunteer_assignments(attendance.volunteerId)
            for assignment in assignments:
                if str(assignment.shiftId) == str(attendance.shiftId):
                    await ShiftDB.check_out_volunteer(
                        attendance.shiftId,
                        attendance.volunteerId,
                        0  # Default slot index
                    )
                    break
        
        # Update assignment
        if attendance.assignmentId:
            await AssignmentDB.check_out(attendance.assignmentId)
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(attendance.volunteerId)
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ATTENDANCE",
                "priority": "MEDIUM",
                "title": f"Checked Out: {event.title}",
                "message": f"You have been checked out for the event '{event.title}'. Total hours: {checked_out_attendance.hoursWorked}",
                "data": {
                    "attendanceId": str(checked_out_attendance._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "checkOutTime": str(checked_out_attendance.checkOutTime),
                    "hoursWorked": checked_out_attendance.hoursWorked
                },
                "relatedEntityId": checked_out_attendance._id,
                "relatedEntityType": "ATTENDANCE"
            })
        
        return {
            "success": True,
            "message": "Volunteer checked out successfully",
            "data": checked_out_attendance.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking out volunteer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all attendance records
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_attendance(
    skip: int = 0,
    limit: int = 100,
    event_id: Optional[str] = None,
    volunteer_id: Optional[str] = None,
    shift_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "checkInTime",
    sort_order: int = -1,
    current_user: dict = Depends(get_current_user)
):
    """Get all attendance records with optional filters"""
    try:
        # Convert status to enum if provided
        status_enum = None
        if status:
            try:
                status_enum = AttendanceStatus(status)
            except ValueError:
                pass
        
        # For organizers, filter by their events
        if current_user["role"] == UserRole.ORGANIZER:
            events = await EventDB.list_all(organizer=str(current_user["_id"]))
            event_ids = [str(e._id) for e in events]
            
            # Filter attendance by organizer's events
            attendance_records = []
            all_records = await AttendanceDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                shift_id=shift_id,
                status=status_enum,
                date_from=date_from,
                date_to=date_to,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            for record in all_records:
                if str(record.eventId) in event_ids:
                    attendance_records.append(record)
        else:
            attendance_records = await AttendanceDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                shift_id=shift_id,
                status=status_enum,
                date_from=date_from,
                date_to=date_to,
                search=search,
                sort_by=sort_by,
                sort_order=sort_order
            )
        
        total = await AttendanceDB.count(
            event_id=event_id,
            volunteer_id=volunteer_id,
            status=status_enum
        )
        
        # Enrich attendance records
        enriched_records = []
        for record in attendance_records:
            record_dict = record.to_dict()
            
            # Get event info
            event = await EventDB.get_by_id(record.eventId)
            if event:
                record_dict["eventInfo"] = {
                    "id": str(event._id),
                    "title": event.title,
                    "date": event.date
                }
            
            # Get volunteer info
            volunteer = await UserDB.get_by_id(record.volunteerId)
            if volunteer:
                record_dict["volunteerInfo"] = {
                    "id": str(volunteer._id),
                    "name": volunteer.fullName,
                    "email": volunteer.email,
                    "profileImage": volunteer.profile.get("profileImage")
                }
            
            # Get shift info
            if record.shiftId:
                shift = await ShiftDB.get_by_id(record.shiftId)
                if shift:
                    record_dict["shiftInfo"] = {
                        "id": str(shift._id),
                        "title": shift.title,
                        "date": shift.date
                    }
            
            enriched_records.append(record_dict)
        
        return {
            "success": True,
            "data": enriched_records,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting attendance records: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get attendance by ID
@router.get("/{attendance_id}", status_code=status.HTTP_200_OK)
async def get_attendance(
    attendance_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get attendance record by ID"""
    try:
        attendance = await AttendanceDB.get_by_id(attendance_id)
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )
        
        # Check if user can access this attendance
        if current_user["role"] == UserRole.VOLUNTEER:
            if str(current_user["_id"]) != str(attendance.volunteerId):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this attendance record"
                )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(attendance.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this attendance record"
                )
        
        # Get event info
        event = await EventDB.get_by_id(attendance.eventId)
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(attendance.volunteerId)
        
        # Get shift info
        shift_info = None
        if attendance.shiftId:
            shift = await ShiftDB.get_by_id(attendance.shiftId)
            if shift:
                shift_info = {
                    "id": str(shift._id),
                    "title": shift.title,
                    "date": shift.date
                }
        
        # Get assignment info
        assignment_info = None
        if attendance.assignmentId:
            assignment = await AssignmentDB.get_by_id(attendance.assignmentId)
            if assignment:
                assignment_info = {
                    "id": str(assignment._id),
                    "status": assignment.status
                }
        
        attendance_dict = attendance.to_dict()
        attendance_dict["eventInfo"] = {
            "id": str(event._id),
            "title": event.title,
            "date": event.date,
            "startTime": event.startTime,
            "endTime": event.endTime,
            "venue": event.location.venue if hasattr(event.location, 'venue') else "",
            "organizer": str(event.organizer)
        } if event else None
        attendance_dict["volunteerInfo"] = {
            "id": str(volunteer._id),
            "name": volunteer.fullName,
            "email": volunteer.email,
            "phone": volunteer.profile.get("phone"),
            "profileImage": volunteer.profile.get("profileImage")
        } if volunteer else None
        attendance_dict["shiftInfo"] = shift_info
        attendance_dict["assignmentInfo"] = assignment_info
        
        return {
            "success": True,
            "data": attendance_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Mark no-show
@router.post("/{attendance_id}/no-show", status_code=status.HTTP_200_OK)
async def mark_no_show(
    attendance_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Mark a volunteer as no-show"""
    try:
        data = await request.json()
        notes = data.get("notes", "")
        
        attendance = await AttendanceDB.get_by_id(attendance_id)
        
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )
        
        # Get event
        event = await EventDB.get_by_id(attendance.eventId)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if this is organizer's event
        if str(current_user["_id"]) != str(event.organizer) and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to mark no-show for this event"
            )
        
        if attendance.status != AttendanceStatus.CHECKED_IN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance must be CHECKED_IN to mark as no-show"
            )
        
        no_show_attendance = await AttendanceDB.mark_no_show(attendance_id, notes)
        
        if not no_show_attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attendance record not found"
            )
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(attendance.volunteerId)
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "ATTENDANCE",
                "priority": "MEDIUM",
                "title": f"No-Show Marked: {event.title}",
                "message": f"You have been marked as a no-show for the event '{event.title}'.",
                "data": {
                    "attendanceId": str(attendance._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "status": "NO_SHOW",
                    "reason": notes or "Not specified"
                },
                "relatedEntityId": attendance._id,
                "relatedEntityType": "ATTENDANCE"
            })
        
        return {
            "success": True,
            "message": "Volunteer marked as no-show successfully",
            "data": no_show_attendance.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error marking no-show: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get attendance statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_attendance_stats(
    event_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get attendance statistics"""
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
            
            stats = await AttendanceDB.get_stats(event_id)
        else:
            if current_user["role"] == UserRole.ADMIN:
                stats = await AttendanceDB.get_stats()
            elif current_user["role"] == UserRole.ORGANIZER:
                events = await EventDB.list_all(organizer=str(current_user["_id"]))
                event_ids = [str(e._id) for e in events]
                stats = await AttendanceDB.get_stats(event_ids[0]) if event_ids else {}
            else:
                stats = await AttendanceDB.get_stats(volunteer_id=str(current_user["_id"]))
        
        return {
            "success": True,
            "data": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting attendance stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get volunteer's total hours
@router.get("/volunteer/{volunteer_id}/hours", status_code=status.HTTP_200_OK)
async def get_volunteer_hours(
    volunteer_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get total volunteer hours for a volunteer"""
    try:
        # Check if user can access this volunteer's hours
        if current_user["role"] not in [UserRole.ADMIN, UserRole.ORGANIZER]:
            if str(current_user["_id"]) != volunteer_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this volunteer's hours"
                )
        
        total_hours = await AttendanceDB.get_volunteer_total_hours(volunteer_id)
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(volunteer_id)
        
        return {
            "success": True,
            "data": {
                "volunteerId": volunteer_id,
                "volunteerName": volunteer.fullName if volunteer else "Unknown",
                "totalHours": total_hours
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting volunteer hours: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
