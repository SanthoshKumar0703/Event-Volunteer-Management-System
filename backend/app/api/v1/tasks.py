"""
EventFlow Tasks API
Task management endpoints
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
from ...models.task import TaskModel, TaskDB, TaskStatus, TaskPriority, TaskType
from ...models.event import EventModel, EventDB
from ...models.user import UserModel, UserDB, UserRole
from ...models.assignment import AssignmentDB
from ...services.email_service import email_service
from ...services.notification_service import create_notification

router = APIRouter(prefix="/tasks", tags=["Tasks"])

settings = get_settings()


# Create task
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_task(
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Create a new task"""
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
        if not data.get("description"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description is required"
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
                detail="You do not have permission to create tasks for this event"
            )
        
        # Prepare task data
        task_data = {
            "eventId": ObjectId(data["eventId"]),
            "title": data["title"],
            "description": data["description"],
            "taskType": data.get("taskType", TaskType.OTHER),
            "priority": data.get("priority", TaskPriority.MEDIUM),
            "status": data.get("status", TaskStatus.PENDING),
            "assignmentId": data.get("assignmentId"),
            "volunteerId": data.get("volunteerId"),
            "dueDate": datetime.fromisoformat(data["dueDate"]) if data.get("dueDate") else None,
            "startDate": datetime.fromisoformat(data["startDate"]) if data.get("startDate") else None,
            "endDate": datetime.fromisoformat(data["endDate"]) if data.get("endDate") else None,
            "estimatedHours": data.get("estimatedHours"),
            "location": data.get("location"),
            "requirements": data.get("requirements", []),
            "attachments": data.get("attachments", []),
            "checklists": data.get("checklists", []),
            "isRecurring": data.get("isRecurring", False),
            "recurrencePattern": data.get("recurrencePattern"),
            "recurrenceEndDate": datetime.fromisoformat(data["recurrenceEndDate"]) if data.get("recurrenceEndDate") else None,
            "assignedBy": current_user["_id"],
            "assignedAt": datetime.now(timezone.utc),
        }
        
        # Create task
        task = await TaskDB.create(task_data)
        
        # If assigned to a volunteer, send notification
        if task.volunteerId:
            volunteer = await UserDB.get_by_id(task.volunteerId)
            if volunteer:
                await create_notification({
                    "userId": str(volunteer._id),
                    "type": "TASK",
                    "priority": "MEDIUM",
                    "title": f"New Task: {task.title}",
                    "message": f"You have been assigned a new task: '{task.title}' for event '{event.title}'.",
                    "data": {
                        "taskId": str(task._id),
                        "eventId": str(event._id),
                        "eventTitle": event.title,
                        "taskTitle": task.title,
                        "dueDate": str(task.dueDate) if task.dueDate else None,
                        "priority": task.priority
                    },
                    "relatedEntityId": task._id,
                    "relatedEntityType": "TASK"
                })
                
                # Send email notification
                if volunteer.email:
                    await email_service.send_task_assigned_email(
                        to=volunteer.email,
                        name=volunteer.fullName or volunteer.firstName,
                        task_title=task.title,
                        event_title=event.title,
                        due_date=str(task.dueDate) if task.dueDate else "Not specified",
                        priority=task.priority,
                        organizer_name=current_user.get("fullName", current_user.get("firstName", "Organizer"))
                    )
        
        return {
            "success": True,
            "message": "Task created successfully",
            "data": task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get all tasks
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_tasks(
    skip: int = 0,
    limit: int = 100,
    event_id: Optional[str] = None,
    volunteer_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    due_before: Optional[str] = None,
    due_after: Optional[str] = None,
    sort_by: str = "dueDate",
    sort_order: int = 1,
    current_user: dict = Depends(get_current_user)
):
    """Get all tasks with optional filters"""
    try:
        # Convert status and priority to enums if provided
        status_enum = None
        if status:
            try:
                status_enum = TaskStatus(status)
            except ValueError:
                pass
        
        priority_enum = None
        if priority:
            try:
                priority_enum = TaskPriority(priority)
            except ValueError:
                pass
        
        # For organizers, filter by their events
        if current_user["role"] == UserRole.ORGANIZER:
            events = await EventDB.list_all(organizer=str(current_user["_id"]))
            event_ids = [str(e._id) for e in events]
            
            # Filter tasks by organizer's events
            tasks = []
            all_tasks = await TaskDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                status=status_enum,
                priority=priority_enum,
                search=search,
                due_before=due_before,
                due_after=due_after,
                sort_by=sort_by,
                sort_order=sort_order
            )
            
            for task in all_tasks:
                if str(task.eventId) in event_ids:
                    tasks.append(task)
        else:
            tasks = await TaskDB.list_all(
                skip=skip,
                limit=limit,
                event_id=event_id,
                volunteer_id=volunteer_id,
                status=status_enum,
                priority=priority_enum,
                search=search,
                due_before=due_before,
                due_after=due_after,
                sort_by=sort_by,
                sort_order=sort_order
            )
        
        total = await TaskDB.count(
            event_id=event_id,
            volunteer_id=volunteer_id,
            status=status_enum
        )
        
        # Enrich tasks
        enriched_tasks = []
        for task in tasks:
            task_dict = task.to_dict()
            
            # Get event info
            event = await EventDB.get_by_id(task.eventId)
            if event:
                task_dict["eventInfo"] = {
                    "id": str(event._id),
                    "title": event.title,
                    "date": event.date
                }
            
            # Get volunteer info
            if task.volunteerId:
                volunteer = await UserDB.get_by_id(task.volunteerId)
                if volunteer:
                    task_dict["volunteerInfo"] = {
                        "id": str(volunteer._id),
                        "name": volunteer.fullName,
                        "email": volunteer.email,
                        "profileImage": volunteer.profile.get("profileImage")
                    }
            
            enriched_tasks.append(task_dict)
        
        return {
            "success": True,
            "data": enriched_tasks,
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    
    except Exception as e:
        print(f"Error getting tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get task by ID
@router.get("/{task_id}", status_code=status.HTTP_200_OK)
async def get_task(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get task by ID"""
    try:
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if user can access this task
        if current_user["role"] == UserRole.VOLUNTEER:
            # Check if task is assigned to this volunteer
            if str(current_user["_id"]) != str(task.volunteerId):
                # Check if volunteer has assignment for this event
                assignments = await AssignmentDB.get_volunteer_assignments(current_user["_id"])
                event_ids = [str(a.eventId) for a in assignments]
                if str(task.eventId) not in event_ids:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this task"
                    )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(task.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this task"
                )
        
        # Get event info
        event = await EventDB.get_by_id(task.eventId)
        
        # Get volunteer info
        volunteer_info = None
        if task.volunteerId:
            volunteer = await UserDB.get_by_id(task.volunteerId)
            if volunteer:
                volunteer_info = {
                    "id": str(volunteer._id),
                    "name": volunteer.fullName,
                    "email": volunteer.email,
                    "phone": volunteer.profile.get("phone"),
                    "profileImage": volunteer.profile.get("profileImage")
                }
        
        task_dict = task.to_dict()
        task_dict["eventInfo"] = {
            "id": str(event._id),
            "title": event.title,
            "date": event.date,
            "startTime": event.startTime,
            "endTime": event.endTime,
            "venue": event.location.venue if hasattr(event.location, 'venue') else "",
            "organizer": str(event.organizer)
        } if event else None
        task_dict["volunteerInfo"] = volunteer_info
        
        return {
            "success": True,
            "data": task_dict
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update task
@router.put("/{task_id}", status_code=status.HTTP_200_OK)
async def update_task(
    task_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update a task"""
    try:
        data = await request.json()
        
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if user can update this task
        if current_user["role"] == UserRole.VOLUNTEER:
            # Check if task is assigned to this volunteer
            if str(current_user["_id"]) != str(task.volunteerId):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this task"
                )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(task.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to update this task"
                )
        
        # Prepare update data
        update_data = {}
        
        if "title" in data:
            update_data["title"] = data["title"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "taskType" in data:
            update_data["taskType"] = data["taskType"]
        if "priority" in data:
            update_data["priority"] = data["priority"]
        if "status" in data:
            update_data["status"] = data["status"]
        if "assignmentId" in data:
            update_data["assignmentId"] = data["assignmentId"]
        if "volunteerId" in data:
            update_data["volunteerId"] = data["volunteerId"]
        if "dueDate" in data:
            update_data["dueDate"] = datetime.fromisoformat(data["dueDate"]) if isinstance(data["dueDate"], str) else data["dueDate"]
        if "startDate" in data:
            update_data["startDate"] = datetime.fromisoformat(data["startDate"]) if isinstance(data["startDate"], str) else data["startDate"]
        if "endDate" in data:
            update_data["endDate"] = datetime.fromisoformat(data["endDate"]) if isinstance(data["endDate"], str) else data["endDate"]
        if "estimatedHours" in data:
            update_data["estimatedHours"] = data["estimatedHours"]
        if "location" in data:
            update_data["location"] = data["location"]
        if "requirements" in data:
            update_data["requirements"] = data["requirements"]
        if "attachments" in data:
            update_data["attachments"] = data["attachments"]
        if "checklists" in data:
            update_data["checklists"] = data["checklists"]
        if "notes" in data:
            update_data["notes"] = data["notes"]
        if "cancellationReason" in data:
            update_data["cancellationReason"] = data["cancellationReason"]
        
        updated_task = await TaskDB.update(task_id, update_data)
        
        if not updated_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {
            "success": True,
            "message": "Task updated successfully",
            "data": updated_task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete task
@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
async def delete_task(
    task_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Delete a task"""
    try:
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(task.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this task"
            )
        
        success = await TaskDB.delete(task_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {
            "success": True,
            "message": "Task deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Assign task to volunteer
@router.post("/{task_id}/assign", status_code=status.HTTP_200_OK)
async def assign_task(
    task_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Assign a task to a volunteer"""
    try:
        data = await request.json()
        
        if not data.get("volunteerId"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer ID is required"
            )
        
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(task.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to assign this task"
            )
        
        assigned_task = await TaskDB.assign(
            task_id,
            data["volunteerId"],
            current_user["_id"],
            data.get("notes")
        )
        
        if not assigned_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Get volunteer info
        volunteer = await UserDB.get_by_id(data["volunteerId"])
        
        # Send notification to volunteer
        if volunteer:
            await create_notification({
                "userId": str(volunteer._id),
                "type": "TASK",
                "priority": "MEDIUM",
                "title": f"Task Assigned: {task.title}",
                "message": f"You have been assigned the task '{task.title}' for event '{event.title}'.",
                "data": {
                    "taskId": str(task._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "taskTitle": task.title,
                    "dueDate": str(task.dueDate) if task.dueDate else None,
                    "priority": task.priority
                },
                "relatedEntityId": task._id,
                "relatedEntityType": "TASK"
            })
        
        # Send email notification
        if volunteer and volunteer.email:
            await email_service.send_task_assigned_email(
                to=volunteer.email,
                name=volunteer.fullName or volunteer.firstName,
                task_title=task.title,
                event_title=event.title,
                due_date=str(task.dueDate) if task.dueDate else "Not specified",
                priority=task.priority,
                organizer_name=current_user.get("fullName", current_user.get("firstName", "Organizer"))
            )
        
        return {
            "success": True,
            "message": "Task assigned successfully",
            "data": assigned_task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Unassign task
@router.post("/{task_id}/unassign", status_code=status.HTTP_200_OK)
async def unassign_task(
    task_id: str,
    current_user: dict = Depends(check_organizer)
):
    """Unassign a task from a volunteer"""
    try:
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(task.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to unassign this task"
            )
        
        unassigned_task = await TaskDB.unassign(task_id)
        
        if not unassigned_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {
            "success": True,
            "message": "Task unassigned successfully",
            "data": unassigned_task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error unassigning task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Start task
@router.post("/{task_id}/start", status_code=status.HTTP_200_OK)
async def start_task(
    task_id: str,
    current_user: dict = Depends(check_volunteer)
):
    """Mark a task as in progress"""
    try:
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if task is assigned to this volunteer
        if str(current_user["_id"]) != str(task.volunteerId):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to start this task"
            )
        
        if task.status != TaskStatus.ASSIGNED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task is not in ASSIGNED status"
            )
        
        started_task = await TaskDB.start(task_id)
        
        if not started_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {
            "success": True,
            "message": "Task started successfully",
            "data": started_task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error starting task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Complete task
@router.post("/{task_id}/complete", status_code=status.HTTP_200_OK)
async def complete_task(
    task_id: str,
    request: Request,
    current_user: dict = Depends(check_volunteer)
):
    """Mark a task as completed"""
    try:
        data = await request.json()
        actual_hours = data.get("actualHours")
        notes = data.get("notes")
        
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if task is assigned to this volunteer
        if str(current_user["_id"]) != str(task.volunteerId):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to complete this task"
            )
        
        if task.status != TaskStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task is not in IN_PROGRESS status"
            )
        
        completed_task = await TaskDB.complete(task_id, actual_hours, notes)
        
        if not completed_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Get event info
        event = await EventDB.get_by_id(task.eventId)
        
        # Get organizer info
        organizer = await UserDB.get_by_id(event.organizer) if event else None
        
        # Send notification to organizer
        if organizer:
            await create_notification({
                "userId": str(organizer._id),
                "type": "TASK",
                "priority": "MEDIUM",
                "title": f"Task Completed: {task.title}",
                "message": f"{current_user['fullName']} has completed the task '{task.title}' for event '{event.title}'.",
                "data": {
                    "taskId": str(task._id),
                    "eventId": str(event._id),
                    "eventTitle": event.title,
                    "taskTitle": task.title,
                    "volunteerId": str(current_user["_id"]),
                    "volunteerName": current_user["fullName"],
                    "actualHours": actual_hours,
                    "status": "COMPLETED"
                },
                "relatedEntityId": task._id,
                "relatedEntityType": "TASK"
            })
        
        return {
            "success": True,
            "message": "Task completed successfully",
            "data": completed_task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error completing task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Cancel task
@router.post("/{task_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_task(
    task_id: str,
    request: Request,
    current_user: dict = Depends(check_organizer)
):
    """Cancel a task"""
    try:
        data = await request.json()
        reason = data.get("reason", "")
        
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if this is for organizer's event
        event = await EventDB.get_by_id(task.eventId)
        if not event or str(event.organizer) != str(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this task"
            )
        
        if task.status in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task cannot be cancelled"
            )
        
        cancelled_task = await TaskDB.cancel(task_id, reason)
        
        if not cancelled_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Get volunteer info
        if task.volunteerId:
            volunteer = await UserDB.get_by_id(task.volunteerId)
            
            # Send notification to volunteer
            if volunteer:
                await create_notification({
                    "userId": str(volunteer._id),
                    "type": "TASK",
                    "priority": "MEDIUM",
                    "title": f"Task Cancelled: {task.title}",
                    "message": f"The task '{task.title}' for event '{event.title}' has been cancelled. Reason: {reason or 'Not specified'}",
                    "data": {
                        "taskId": str(task._id),
                        "eventId": str(event._id),
                        "eventTitle": event.title,
                        "taskTitle": task.title,
                        "status": "CANCELLED",
                        "reason": reason or "Not specified"
                    },
                    "relatedEntityId": task._id,
                    "relatedEntityType": "TASK"
                })
        
        return {
            "success": True,
            "message": "Task cancelled successfully",
            "data": cancelled_task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error cancelling task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Add comment to task
@router.post("/{task_id}/comments", status_code=status.HTTP_200_OK)
async def add_task_comment(
    task_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a task"""
    try:
        data = await request.json()
        
        if not data.get("comment"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Comment is required"
            )
        
        task = await TaskDB.get_by_id(task_id)
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        # Check if user can comment on this task
        if current_user["role"] == UserRole.VOLUNTEER:
            # Check if task is assigned to this volunteer
            if str(current_user["_id"]) != str(task.volunteerId):
                # Check if volunteer has assignment for this event
                assignments = await AssignmentDB.get_volunteer_assignments(current_user["_id"])
                event_ids = [str(a.eventId) for a in assignments]
                if str(task.eventId) not in event_ids:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to comment on this task"
                    )
        elif current_user["role"] == UserRole.ORGANIZER:
            # Check if this is for organizer's event
            event = await EventDB.get_by_id(task.eventId)
            if not event or str(event.organizer) != str(current_user["_id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to comment on this task"
                )
        
        is_public = data.get("isPublic", True)
        
        commented_task = await TaskDB.add_comment(
            task_id,
            data["comment"],
            current_user["_id"],
            is_public
        )
        
        if not commented_task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {
            "success": True,
            "message": "Comment added successfully",
            "data": commented_task.to_dict()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error adding task comment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get task statistics
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_task_stats(
    event_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get task statistics"""
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
            
            stats = await TaskDB.get_stats(event_id)
        else:
            if current_user["role"] == UserRole.ADMIN:
                stats = await TaskDB.get_stats()
            elif current_user["role"] == UserRole.ORGANIZER:
                events = await EventDB.list_all(organizer=str(current_user["_id"]))
                event_ids = [str(e._id) for e in events]
                stats = await TaskDB.get_stats(event_ids[0]) if event_ids else {}
            else:
                stats = await TaskDB.get_stats(volunteer_id=str(current_user["_id"]))
        
        return {
            "success": True,
            "data": stats
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting task stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
