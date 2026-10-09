"""
EventFlow Analytics API
Analytics and reporting endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timezone, timedelta
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
from ...models.event import EventDB, EventStatus
from ...models.user import UserDB, UserRole
from ...models.application import ApplicationDB, ApplicationStatus
from ...models.assignment import AssignmentDB, AssignmentStatus
from ...models.task import TaskDB, TaskStatus
from ...models.attendance import AttendanceDB, AttendanceStatus
from ...models.review import ReviewDB, ReviewStatus
from ...models.badge import BadgeDB, VolunteerBadgeDB

router = APIRouter(prefix="/analytics", tags=["Analytics"])

settings = get_settings()


# Get overall platform statistics
@router.get("/overview", status_code=status.HTTP_200_OK)
async def get_platform_overview(
    current_user: dict = Depends(get_current_user)
):
    """Get overall platform statistics"""
    try:
        # Get counts
        total_users = await UserDB.count()
        total_events = await EventDB.count()
        total_applications = await ApplicationDB.count()
        total_assignments = await AssignmentDB.count()
        total_tasks = await TaskDB.count()
        total_attendance = await AttendanceDB.count()
        total_reviews = await ReviewDB.count()
        total_badges = await BadgeDB.count()
        
        # Get user breakdown
        users_by_role = {
            "admin": await UserDB.count(role=UserRole.ADMIN),
            "organizer": await UserDB.count(role=UserRole.ORGANIZER),
            "volunteer": await UserDB.count(role=UserRole.VOLUNTEER),
        }
        
        # Get event breakdown
        events_by_status = await EventDB.get_stats()
        
        # Get application breakdown
        applications_by_status = await ApplicationDB.get_stats()
        
        # Get assignment breakdown
        assignments_by_status = await AssignmentDB.get_stats()
        
        # Get task breakdown
        tasks_by_status = await TaskDB.get_stats()
        
        # Get attendance stats
        attendance_stats = await AttendanceDB.get_stats()
        
        # Get review stats
        review_stats = await ReviewDB.get_stats()
        
        # Get badge stats
        badge_stats = await BadgeDB.get_stats()
        
        # Calculate engagement metrics
        active_volunteers = await UserDB.count(role=UserRole.VOLUNTEER, status=UserRole.ACTIVE)
        completed_assignments = await AssignmentDB.count(status=AssignmentStatus.COMPLETED)
        total_hours = await AttendanceDB.get_stats()
        
        return {
            "success": True,
            "data": {
                "users": {
                    "total": total_users,
                    "byRole": users_by_role
                },
                "events": {
                    "total": total_events,
                    "byStatus": events_by_status
                },
                "applications": {
                    "total": total_applications,
                    "byStatus": applications_by_status
                },
                "assignments": {
                    "total": total_assignments,
                    "byStatus": assignments_by_status,
                    "completed": completed_assignments
                },
                "tasks": {
                    "total": total_tasks,
                    "byStatus": tasks_by_status
                },
                "attendance": {
                    "total": total_attendance,
                    "stats": attendance_stats
                },
                "reviews": {
                    "total": total_reviews,
                    "stats": review_stats
                },
                "badges": {
                    "total": total_badges,
                    "stats": badge_stats
                },
                "engagement": {
                    "activeVolunteers": active_volunteers,
                    "totalHours": total_hours.get("totalHours", 0),
                    "averageHours": total_hours.get("averageHours", 0)
                }
            }
        }
    
    except Exception as e:
        print(f"Error getting platform overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get organizer dashboard statistics
@router.get("/organizer/dashboard", status_code=status.HTTP_200_OK)
async def get_organizer_dashboard(
    current_user: dict = Depends(check_organizer)
):
    """Get dashboard statistics for an organizer"""
    try:
        organizer_id = str(current_user["_id"])
        
        # Get organizer's events
        events = await EventDB.list_all(organizer=organizer_id)
        event_ids = [str(e._id) for e in events]
        
        # Get event stats
        event_stats = await EventDB.get_stats(organizer_id)
        
        # Get application stats for organizer's events
        applications = []
        for event_id in event_ids:
            apps = await ApplicationDB.list_all(event_id=event_id)
            applications.extend(apps)
        
        application_stats = {
            "total": len(applications),
            "pending": len([a for a in applications if a.status == ApplicationStatus.PENDING]),
            "approved": len([a for a in applications if a.status == ApplicationStatus.APPROVED]),
            "rejected": len([a for a in applications if a.status == ApplicationStatus.REJECTED]),
            "withdrawn": len([a for a in applications if a.status == ApplicationStatus.WITHDRAWN]),
        }
        
        # Get assignment stats for organizer's events
        assignments = []
        for event_id in event_ids:
            asns = await AssignmentDB.list_all(event_id=event_id)
            assignments.extend(asns)
        
        assignment_stats = {
            "total": len(assignments),
            "pending": len([a for a in assignments if a.status == AssignmentStatus.PENDING]),
            "assigned": len([a for a in assignments if a.status == AssignmentStatus.ASSIGNED]),
            "confirmed": len([a for a in assignments if a.status == AssignmentStatus.CONFIRMED]),
            "completed": len([a for a in assignments if a.status == AssignmentStatus.COMPLETED]),
            "cancelled": len([a for a in assignments if a.status == AssignmentStatus.CANCELLED]),
        }
        
        # Get task stats for organizer's events
        tasks = []
        for event_id in event_ids:
            ts = await TaskDB.list_all(event_id=event_id)
            tasks.extend(ts)
        
        task_stats = {
            "total": len(tasks),
            "pending": len([t for t in tasks if t.status == TaskStatus.PENDING]),
            "assigned": len([t for t in tasks if t.status == TaskStatus.ASSIGNED]),
            "in_progress": len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS]),
            "completed": len([t for t in tasks if t.status == TaskStatus.COMPLETED]),
            "cancelled": len([t for t in tasks if t.status == TaskStatus.CANCELLED]),
            "overdue": len([t for t in tasks if t.status == TaskStatus.OVERDUE]),
        }
        
        # Get attendance stats for organizer's events
        attendance = []
        for event_id in event_ids:
            att = await AttendanceDB.list_all(event_id=event_id)
            attendance.extend(att)
        
        attendance_stats = {
            "total": len(attendance),
            "checkedIn": len([a for a in attendance if a.status in [AttendanceStatus.CHECKED_IN, AttendanceStatus.CHECKED_OUT, AttendanceStatus.LATE, AttendanceStatus.EARLY_DEPARTURE]]),
            "checkedOut": len([a for a in attendance if a.status == AttendanceStatus.CHECKED_OUT]),
            "noShow": len([a for a in attendance if a.status == AttendanceStatus.NO_SHOW]),
        }
        
        # Get recent activity
        recent_events = events[:5]
        recent_assignments = assignments[:5]
        
        return {
            "success": True,
            "data": {
                "events": {
                    "total": event_stats.get("total", 0),
                    "byStatus": event_stats
                },
                "applications": application_stats,
                "assignments": assignment_stats,
                "tasks": task_stats,
                "attendance": attendance_stats,
                "recentEvents": [{
                    "id": str(e._id),
                    "title": e.title,
                    "date": e.date,
                    "status": e.status
                } for e in recent_events],
                "recentAssignments": [{
                    "id": str(a._id),
                    "volunteerName": (await UserDB.get_by_id(a.volunteerId)).fullName if a.volunteerId else "Unknown",
                    "status": a.status,
                    "assignedAt": a.assignedAt
                } for a in recent_assignments]
            }
        }
    
    except Exception as e:
        print(f"Error getting organizer dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get volunteer dashboard statistics
@router.get("/volunteer/dashboard", status_code=status.HTTP_200_OK)
async def get_volunteer_dashboard(
    current_user: dict = Depends(check_volunteer)
):
    """Get dashboard statistics for a volunteer"""
    try:
        volunteer_id = str(current_user["_id"])
        
        # Get volunteer's assignments
        assignments = await AssignmentDB.get_volunteer_assignments(volunteer_id)
        
        # Get assignment stats
        assignment_stats = {
            "total": len(assignments),
            "pending": len([a for a in assignments if a.status == AssignmentStatus.PENDING]),
            "assigned": len([a for a in assignments if a.status == AssignmentStatus.ASSIGNED]),
            "confirmed": len([a for a in assignments if a.status == AssignmentStatus.CONFIRMED]),
            "completed": len([a for a in assignments if a.status == AssignmentStatus.COMPLETED]),
            "cancelled": len([a for a in assignments if a.status == AssignmentStatus.CANCELLED]),
        }
        
        # Get volunteer's tasks
        tasks = await TaskDB.get_volunteer_tasks(volunteer_id)
        
        # Get task stats
        task_stats = {
            "total": len(tasks),
            "pending": len([t for t in tasks if t.status == TaskStatus.PENDING]),
            "assigned": len([t for t in tasks if t.status == TaskStatus.ASSIGNED]),
            "in_progress": len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS]),
            "completed": len([t for t in tasks if t.status == TaskStatus.COMPLETED]),
            "cancelled": len([t for t in tasks if t.status == TaskStatus.CANCELLED]),
            "overdue": len([t for t in tasks if t.status == TaskStatus.OVERDUE]),
        }
        
        # Get volunteer's attendance
        attendance = await AttendanceDB.get_volunteer_attendance(volunteer_id)
        
        # Get attendance stats
        attendance_stats = {
            "total": len(attendance),
            "checkedIn": len([a for a in attendance if a.status in [AttendanceStatus.CHECKED_IN, AttendanceStatus.CHECKED_OUT, AttendanceStatus.LATE, AttendanceStatus.EARLY_DEPARTURE]]),
            "checkedOut": len([a for a in attendance if a.status == AttendanceStatus.CHECKED_OUT]),
            "noShow": len([a for a in attendance if a.status == AttendanceStatus.NO_SHOW]),
        }
        
        # Get total hours
        total_hours = await AttendanceDB.get_volunteer_total_hours(volunteer_id)
        
        # Get volunteer's badges
        volunteer_badges = await VolunteerBadgeDB.get_volunteer_badges(volunteer_id)
        
        # Get volunteer's reviews
        reviews = await ReviewDB.get_user_reviews(volunteer_id)
        
        # Get review stats
        review_stats = {
            "total": len(reviews),
            "received": len([r for r in reviews if str(r.revieweeId) == volunteer_id]),
            "given": len([r for r in reviews if str(r.reviewerId) == volunteer_id]),
        }
        
        # Get recent activity
        recent_assignments = assignments[:5]
        recent_tasks = tasks[:5]
        
        return {
            "success": True,
            "data": {
                "assignments": assignment_stats,
                "tasks": task_stats,
                "attendance": attendance_stats,
                "totalHours": total_hours,
                "badges": {
                    "total": len(volunteer_badges),
                    "list": [vb.to_dict() for vb in volunteer_badges[:10]]
                },
                "reviews": review_stats,
                "recentAssignments": [{
                    "id": str(a._id),
                    "eventTitle": (await EventDB.get_by_id(a.eventId)).title if a.eventId else "Unknown",
                    "status": a.status,
                    "assignedAt": a.assignedAt
                } for a in recent_assignments],
                "recentTasks": [{
                    "id": str(t._id),
                    "title": t.title,
                    "status": t.status,
                    "dueDate": t.dueDate
                } for t in recent_tasks]
            }
        }
    
    except Exception as e:
        print(f"Error getting volunteer dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get time series data
@router.get("/time-series", status_code=status.HTTP_200_OK)
async def get_time_series_data(
    period: str = "month",
    current_user: dict = Depends(get_current_user)
):
    """Get time series data for analytics"""
    try:
        # Determine date range based on period
        now = datetime.now(timezone.utc)
        
        if period == "week":
            start_date = now - timedelta(days=7)
            interval = "day"
        elif period == "month":
            start_date = now - timedelta(days=30)
            interval = "day"
        elif period == "quarter":
            start_date = now - timedelta(days=90)
            interval = "week"
        elif period == "year":
            start_date = now - timedelta(days=365)
            interval = "month"
        else:
            start_date = now - timedelta(days=30)
            interval = "day"
        
        # For organizers, filter by their events
        if current_user["role"] == UserRole.ORGANIZER:
            events = await EventDB.list_all(organizer=str(current_user["_id"]))
            event_ids = [str(e._id) for e in events]
        else:
            event_ids = None
        
        # Generate time series data
        time_series = []
        current_date = start_date
        
        while current_date <= now:
            # Get counts for this period
            if interval == "day":
                end_date = current_date + timedelta(days=1)
            elif interval == "week":
                end_date = current_date + timedelta(days=7)
            else:  # month
                # Approximate month
                end_date = current_date + timedelta(days=30)
            
            # Count events
            if event_ids:
                events_count = len([
                    e for e in await EventDB.list_all(
                        date_from=current_date.isoformat(),
                        date_to=end_date.isoformat()
                    ) if str(e._id) in event_ids
                ])
            else:
                events_count = await EventDB.count(
                    date_from=current_date.isoformat(),
                    date_to=end_date.isoformat()
                )
            
            # Count applications
            if event_ids:
                applications = await ApplicationDB.list_all(
                    date_from=current_date.isoformat(),
                    date_to=end_date.isoformat()
                )
                applications_count = len([a for a in applications if str(a.eventId) in event_ids])
            else:
                applications_count = await ApplicationDB.count(
                    date_from=current_date.isoformat(),
                    date_to=end_date.isoformat()
                )
            
            # Count assignments
            if event_ids:
                assignments = await AssignmentDB.list_all(
                    date_from=current_date.isoformat(),
                    date_to=end_date.isoformat()
                )
                assignments_count = len([a for a in assignments if str(a.eventId) in event_ids])
            else:
                assignments_count = await AssignmentDB.count(
                    date_from=current_date.isoformat(),
                    date_to=end_date.isoformat()
                )
            
            time_series.append({
                "date": current_date.isoformat(),
                "events": events_count,
                "applications": applications_count,
                "assignments": assignments_count
            })
            
            current_date = end_date
        
        return {
            "success": True,
            "data": {
                "period": period,
                "interval": interval,
                "startDate": start_date.isoformat(),
                "endDate": now.isoformat(),
                "timeSeries": time_series
            }
        }
    
    except Exception as e:
        print(f"Error getting time series data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get leaderboard data
@router.get("/leaderboard", status_code=status.HTTP_200_OK)
async def get_leaderboard(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get leaderboard data for top volunteers"""
    try:
        # Get all volunteers
        volunteers = await UserDB.list_all(role=UserRole.VOLUNTEER, limit=100)
        
        # Get attendance for each volunteer
        leaderboard = []
        for volunteer in volunteers:
            attendance = await AttendanceDB.get_volunteer_attendance(str(volunteer._id))
            total_hours = await AttendanceDB.get_volunteer_total_hours(str(volunteer._id))
            assignments = await AssignmentDB.get_volunteer_assignments(str(volunteer._id))
            completed_assignments = len([a for a in assignments if a.status == AssignmentStatus.COMPLETED])
            badges = await VolunteerBadgeDB.get_volunteer_badges(str(volunteer._id))
            
            leaderboard.append({
                "volunteerId": str(volunteer._id),
                "name": volunteer.fullName,
                "email": volunteer.email,
                "profileImage": volunteer.profile.get("profileImage"),
                "totalHours": total_hours,
                "eventsCompleted": completed_assignments,
                "badgesEarned": len(badges),
                "performanceScore": volunteer.performanceScore or 0
            })
        
        # Sort by total hours (descending)
        leaderboard.sort(key=lambda x: x["totalHours"], reverse=True)
        
        return {
            "success": True,
            "data": {
                "leaderboard": leaderboard[:limit],
                "total": len(leaderboard)
            }
        }
    
    except Exception as e:
        print(f"Error getting leaderboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Export data
@router.post("/export", status_code=status.HTTP_200_OK)
async def export_data(
    request: Request,
    current_user: dict = Depends(check_admin)
):
    """Export analytics data in various formats"""
    try:
        data = await request.json()
        format = data.get("format", "csv")  # csv, json, pdf
        entity_type = data.get("entityType", "all")  # all, users, events, applications, etc.
        
        # Collect data based on entity type
        export_data = {}
        
        if entity_type in ["all", "users"]:
            users = await UserDB.list_all()
            export_data["users"] = [u.to_dict(exclude_password=True) for u in users]
        
        if entity_type in ["all", "events"]:
            events = await EventDB.list_all()
            export_data["events"] = [e.to_dict() for e in events]
        
        if entity_type in ["all", "applications"]:
            applications = await ApplicationDB.list_all()
            export_data["applications"] = [a.to_dict() for a in applications]
        
        if entity_type in ["all", "assignments"]:
            assignments = await AssignmentDB.list_all()
            export_data["assignments"] = [a.to_dict() for a in assignments]
        
        if entity_type in ["all", "tasks"]:
            tasks = await TaskDB.list_all()
            export_data["tasks"] = [t.to_dict() for t in tasks]
        
        if entity_type in ["all", "attendance"]:
            attendance = await AttendanceDB.list_all()
            export_data["attendance"] = [a.to_dict() for a in attendance]
        
        if entity_type in ["all", "reviews"]:
            reviews = await ReviewDB.list_all()
            export_data["reviews"] = [r.to_dict() for r in reviews]
        
        # Generate export based on format
        if format == "json":
            return {
                "success": True,
                "data": export_data,
                "format": "json"
            }
        elif format == "csv":
            # Convert to CSV format (simplified)
            csv_data = ""
            for entity_type, entities in export_data.items():
                if entities:
                    headers = list(entities[0].keys())
                    csv_data += f"# {entity_type.upper()}\n"
                    csv_data += ",".join(headers) + "\n"
                    for entity in entities:
                        row = [str(entity.get(h, "")).replace(",", ";") for h in headers]
                        csv_data += ",".join(row) + "\n"
                    csv_data += "\n"
            
            return {
                "success": True,
                "data": csv_data,
                "format": "csv"
            }
        else:
            return {
                "success": True,
                "data": export_data,
                "format": "json"
            }
    
    except Exception as e:
        print(f"Error exporting data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get activity log (placeholder - would be implemented with actual activity logging)
@router.get("/activity-log", status_code=status.HTTP_200_OK)
async def get_activity_log(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(check_admin)
):
    """Get activity log"""
    try:
        # In production, this would query the ACTIVITY_LOGS collection
        # For now, return a placeholder
        
        return {
            "success": True,
            "data": [],
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": 0
            }
        }
    
    except Exception as e:
        print(f"Error getting activity log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
