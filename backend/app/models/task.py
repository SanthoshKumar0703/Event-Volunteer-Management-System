"""
EventFlow Task Model
MongoDB task document model for event tasks
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db


# Enums
class TaskStatus(str, Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class TaskType(str, Enum):
    SETUP = "SETUP"
    REGISTRATION = "REGISTRATION"
    COORDINATION = "COORDINATION"
    LOGISTICS = "LOGISTICS"
    TECHNICAL = "TECHNICAL"
    MARKETING = "MARKETING"
    CATERING = "CATERING"
    CLEANUP = "CLEANUP"
    SECURITY = "SECURITY"
    OTHER = "OTHER"


# Sub-models
class TaskRequirement(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    skill: Optional[str] = None
    experienceLevel: Optional[str] = None
    certification: Optional[str] = None
    equipment: Optional[str] = None


class TaskAttachment(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    filename: str
    url: str
    uploadedBy: Union[ObjectId, str]
    uploadedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TaskComment(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    comment: str
    postedBy: Union[ObjectId, str]
    postedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Main Task Model
class TaskModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    taskId: str
    eventId: Union[ObjectId, str]
    title: str
    description: str
    taskType: TaskType = TaskType.OTHER
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    assignmentId: Optional[Union[ObjectId, str]] = None  # Reference to assignment
    volunteerId: Optional[Union[ObjectId, str]] = None  # Direct volunteer assignment
    dueDate: Optional[datetime] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    location: Optional[str] = None
    requirements: List[TaskRequirement] = Field(default_factory=list)
    attachments: List[TaskAttachment] = Field(default_factory=list)
    comments: List[TaskComment] = Field(default_factory=list)
    checklists: List[Dict[str, Any]] = Field(default_factory=list)
    isRecurring: bool = False
    recurrencePattern: Optional[str] = None  # daily, weekly, monthly
    recurrenceEndDate: Optional[datetime] = None
    assignedBy: Optional[Union[ObjectId, str]] = None
    assignedAt: Optional[datetime] = None
    startedAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    cancelledAt: Optional[datetime] = None
    cancellationReason: Optional[str] = None
    notes: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        data["eventId"] = str(data["eventId"]) if data["eventId"] else None
        data["assignmentId"] = str(data["assignmentId"]) if data["assignmentId"] else None
        data["volunteerId"] = str(data["volunteerId"]) if data["volunteerId"] else None
        data["assignedBy"] = str(data["assignedBy"]) if data["assignedBy"] else None
        return data


class TaskSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified task model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    taskId: str
    eventId: Union[ObjectId, str]
    title: str
    description: str
    taskType: TaskType
    priority: TaskPriority
    status: TaskStatus
    dueDate: Optional[datetime] = None
    volunteerId: Optional[Union[ObjectId, str]] = None
    volunteerName: Optional[str] = None
    eventTitle: Optional[str] = None
    
    @classmethod
    def from_task(
        cls,
        task: TaskModel,
        volunteer_name: Optional[str] = None,
        event_title: Optional[str] = None
    ) -> "TaskSummaryModel":
        """Create a summary from a full task model"""
        return cls(
            _id=str(task._id) if task._id else None,
            taskId=task.taskId,
            eventId=str(task.eventId) if task.eventId else None,
            title=task.title,
            description=task.description,
            taskType=task.taskType,
            priority=task.priority,
            status=task.status,
            dueDate=task.dueDate,
            volunteerId=str(task.volunteerId) if task.volunteerId else None,
            volunteerName=volunteer_name,
            eventTitle=event_title
        )


# Database Operations
class TaskDB:
    """Task database operations"""
    
    @staticmethod
    async def create(task_data: Dict[str, Any]) -> TaskModel:
        """Create a new task"""
        collection = db.get_collection(Collections.TASKS)
        
        # Generate task ID
        from .counter import CounterDB
        task_id = await CounterDB.get_next_sequence("task_id")
        task_data["taskId"] = f"TASK-{task_id:06d}"
        
        # Insert task
        result = await collection.insert_one(task_data)
        task_data["_id"] = result.inserted_id
        
        return TaskModel(**task_data)
    
    @staticmethod
    async def get_by_id(task_id: Union[ObjectId, str]) -> Optional[TaskModel]:
        """Get task by ID"""
        collection = db.get_collection(Collections.TASKS)
        task_data = await collection.find_one({"_id": ObjectId(task_id)})
        if task_data:
            return TaskModel(**task_data)
        return None
    
    @staticmethod
    async def get_by_task_id(task_id: str) -> Optional[TaskModel]:
        """Get task by task ID"""
        collection = db.get_collection(Collections.TASKS)
        task_data = await collection.find_one({"taskId": task_id})
        if task_data:
            return TaskModel(**task_data)
        return None
    
    @staticmethod
    async def update(task_id: Union[ObjectId, str], update_data: Dict[str, Any]) -> Optional[TaskModel]:
        """Update a task"""
        collection = db.get_collection(Collections.TASKS)
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def delete(task_id: Union[ObjectId, str]) -> bool:
        """Delete a task"""
        collection = db.get_collection(Collections.TASKS)
        result = await collection.delete_one({"_id": ObjectId(task_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        search: Optional[str] = None,
        due_before: Optional[str] = None,
        due_after: Optional[str] = None,
        sort_by: str = "dueDate",
        sort_order: int = 1,
    ) -> List[TaskModel]:
        """List all tasks with optional filters"""
        collection = db.get_collection(Collections.TASKS)
        
        query = {}
        
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if volunteer_id:
            query["volunteerId"] = ObjectId(volunteer_id)
        if status:
            query["status"] = status
        if priority:
            query["priority"] = priority
        
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"taskId": {"$regex": search, "$options": "i"}},
            ]
        
        if due_before:
            query["dueDate"] = {"$lte": datetime.fromisoformat(due_before)}
        if due_after:
            if "dueDate" in query:
                query["dueDate"]["$gte"] = datetime.fromisoformat(due_after)
            else:
                query["dueDate"] = {"$gte": datetime.fromisoformat(due_after)}
        
        sort_field = sort_by
        if sort_by not in ["title", "priority", "status", "dueDate", "createdAt", "updatedAt"]:
            sort_field = "dueDate"
        
        cursor = collection.find(query).skip(skip).limit(limit).sort(sort_field, sort_order)
        tasks = []
        async for task_data in cursor:
            tasks.append(TaskModel(**task_data))
        
        return tasks
    
    @staticmethod
    async def count(
        event_id: Optional[str] = None,
        volunteer_id: Optional[str] = None,
        status: Optional[TaskStatus] = None,
    ) -> int:
        """Count tasks with optional filters"""
        collection = db.get_collection(Collections.TASKS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        if volunteer_id:
            query["volunteerId"] = ObjectId(volunteer_id)
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)
    
    @staticmethod
    async def get_stats(event_id: Optional[str] = None) -> Dict[str, int]:
        """Get task statistics"""
        collection = db.get_collection(Collections.TASKS)
        
        query = {}
        if event_id:
            query["eventId"] = ObjectId(event_id)
        
        return {
            "total": await collection.count_documents(query),
            "pending": await collection.count_documents({**query, "status": TaskStatus.PENDING}),
            "assigned": await collection.count_documents({**query, "status": TaskStatus.ASSIGNED}),
            "in_progress": await collection.count_documents({**query, "status": TaskStatus.IN_PROGRESS}),
            "completed": await collection.count_documents({**query, "status": TaskStatus.COMPLETED}),
            "cancelled": await collection.count_documents({**query, "status": TaskStatus.CANCELLED}),
            "overdue": await collection.count_documents({**query, "status": TaskStatus.OVERDUE}),
        }
    
    @staticmethod
    async def assign(
        task_id: Union[ObjectId, str],
        volunteer_id: Union[ObjectId, str],
        assigned_by: Union[ObjectId, str],
        notes: Optional[str] = None
    ) -> Optional[TaskModel]:
        """Assign a task to a volunteer"""
        collection = db.get_collection(Collections.TASKS)
        
        update_data = {
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id,
            "status": TaskStatus.ASSIGNED,
            "assignedBy": ObjectId(assigned_by) if isinstance(assigned_by, str) else assigned_by,
            "assignedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if notes:
            update_data["notes"] = [notes]
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def unassign(task_id: Union[ObjectId, str]) -> Optional[TaskModel]:
        """Unassign a task from a volunteer"""
        collection = db.get_collection(Collections.TASKS)
        
        update_data = {
            "volunteerId": None,
            "status": TaskStatus.PENDING,
            "assignedBy": None,
            "assignedAt": None,
            "startedAt": None,
            "updatedAt": datetime.now(timezone.utc)
        }
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def start(task_id: Union[ObjectId, str]) -> Optional[TaskModel]:
        """Mark a task as in progress"""
        collection = db.get_collection(Collections.TASKS)
        
        update_data = {
            "status": TaskStatus.IN_PROGRESS,
            "startedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def complete(
        task_id: Union[ObjectId, str],
        actual_hours: Optional[float] = None,
        notes: Optional[str] = None
    ) -> Optional[TaskModel]:
        """Mark a task as completed"""
        collection = db.get_collection(Collections.TASKS)
        
        update_data = {
            "status": TaskStatus.COMPLETED,
            "completedAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if actual_hours is not None:
            update_data["actualHours"] = actual_hours
        if notes:
            update_data["notes"] = [notes]
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def cancel(
        task_id: Union[ObjectId, str],
        reason: Optional[str] = None
    ) -> Optional[TaskModel]:
        """Cancel a task"""
        collection = db.get_collection(Collections.TASKS)
        
        update_data = {
            "status": TaskStatus.CANCELLED,
            "cancelledAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if reason:
            update_data["cancellationReason"] = reason
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def add_comment(
        task_id: Union[ObjectId, str],
        comment: str,
        posted_by: Union[ObjectId, str]
    ) -> Optional[TaskModel]:
        """Add a comment to a task"""
        collection = db.get_collection(Collections.TASKS)
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$push": {
                    "comments": {
                        "comment": comment,
                        "postedBy": ObjectId(posted_by) if isinstance(posted_by, str) else posted_by,
                        "postedAt": datetime.now(timezone.utc)
                    }
                },
                "$set": {"updatedAt": datetime.now(timezone.utc)}
            }
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def update_checklist(
        task_id: Union[ObjectId, str],
        checklist_item_id: str,
        completed: bool
    ) -> Optional[TaskModel]:
        """Update a checklist item"""
        collection = db.get_collection(Collections.TASKS)
        
        result = await collection.update_one(
            {"_id": ObjectId(task_id), "checklists._id": checklist_item_id},
            {
                "$set": {
                    "checklists.$.completed": completed,
                    "checklists.$.updatedAt": datetime.now(timezone.utc),
                    "updatedAt": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.modified_count > 0:
            task_data = await collection.find_one({"_id": ObjectId(task_id)})
            return TaskModel(**task_data) if task_data else None
        return None
    
    @staticmethod
    async def get_event_tasks(event_id: Union[ObjectId, str]) -> List[TaskModel]:
        """Get all tasks for an event"""
        collection = db.get_collection(Collections.TASKS)
        
        query = {
            "eventId": ObjectId(event_id) if isinstance(event_id, str) else event_id
        }
        
        tasks = []
        async for task_data in collection.find(query):
            tasks.append(TaskModel(**task_data))
        
        return tasks
    
    @staticmethod
    async def get_volunteer_tasks(volunteer_id: Union[ObjectId, str]) -> List[TaskModel]:
        """Get all tasks assigned to a volunteer"""
        collection = db.get_collection(Collections.TASKS)
        
        query = {
            "volunteerId": ObjectId(volunteer_id) if isinstance(volunteer_id, str) else volunteer_id
        }
        
        tasks = []
        async for task_data in collection.find(query):
            tasks.append(TaskModel(**task_data))
        
        return tasks
