"""
EventFlow Seed Data
Populates the database with realistic test data for development
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
import random
from bson import ObjectId
import asyncio

from .core.database import db, Collections
from .core.security import get_password_hash
from .models.user import UserModel
from .models.event_request import EventRequestModel
from .models.event import EventModel
from .models.application import ApplicationModel
from .models.assignment import AssignmentModel
from .models.task import TaskModel
from .models.shift import ShiftModel
from .models.attendance import AttendanceModel
from .models.notification import NotificationModel
from .models.announcement import AnnouncementModel
from .models.review import ReviewModel
from .models.badge import BadgeModel
from .models.activity_log import ActivityLogModel


# Helper functions
def random_date(start_date: datetime, end_date: datetime) -> datetime:
    """Generate a random date between start and end"""
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    return start_date + timedelta(days=random_days)


def random_time() -> str:
    """Generate a random time in HH:mm format"""
    hour = random.randint(8, 20)
    minute = random.choice([0, 15, 30, 45])
    return f"{hour:02d}:{minute:02d}"


def random_string(length: int = 10) -> str:
    """Generate a random string"""
    import string
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def random_email() -> str:
    """Generate a random email"""
    first = random.choice(["john", "jane", "mike", "sarah", "alex", "emily", "david", "lisa"])
    last = random.choice(["smith", "johnson", "williams", "brown", "jones", "miller", "davis"])
    domain = random.choice(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"])
    return f"{first}.{last}@{domain}"


def random_phone() -> str:
    """Generate a random phone number"""
    return f"+1-{random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"


def random_paragraph() -> str:
    """Generate a random paragraph"""
    sentences = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
    ]
    return random.choice(sentences)


# Seed data generators
async def create_users() -> List[Dict[str, Any]]:
    """Create sample users"""
    users = []
    
    # Admin user
    admin = {
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@eventflow.app",
        "password": get_password_hash("admin123"),
        "role": "ADMIN",
        "status": "ACTIVE",
        "accountType": "EMAIL",
        "isVerified": True,
        "isActive": True,
        "profile": {
            "bio": "Platform administrator",
            "phone": "+1-555-0123",
        },
        "preferences": {
            "notificationSettings": {"email": True, "push": True, "sms": False},
            "theme": "LIGHT",
        },
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    users.append(admin)
    
    # Organizers
    organizers = [
        {"firstName": "Alice", "lastName": "Johnson", "email": "alice@eventflow.app"},
        {"firstName": "Bob", "lastName": "Smith", "email": "bob@eventflow.app"},
        {"firstName": "Carol", "lastName": "Williams", "email": "carol@eventflow.app"},
        {"firstName": "David", "lastName": "Brown", "email": "david@eventflow.app"},
    ]
    
    for org in organizers:
        user = {
            "firstName": org["firstName"],
            "lastName": org["lastName"],
            "email": org["email"],
            "password": get_password_hash("organizer123"),
            "role": "ORGANIZER",
            "status": "APPROVED",
            "accountType": "EMAIL",
            "isVerified": True,
            "isActive": True,
            "profile": {
                "bio": f"Event organizer at {org['firstName']}'s Events",
                "phone": random_phone(),
            },
            "preferences": {
                "notificationSettings": {"email": True, "push": True, "sms": False},
                "theme": "LIGHT",
            },
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        users.append(user)
    
    # Volunteers
    first_names = ["Emma", "James", "Olivia", "William", "Ava", "Benjamin", "Sophia", "Elijah"]
    last_names = ["Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin"]
    
    for i in range(20):
        first = random.choice(first_names)
        last = random.choice(last_names)
        email = f"{first.lower()}.{last.lower()}{i}@example.com"
        
        user = {
            "firstName": first,
            "lastName": last,
            "email": email,
            "password": get_password_hash("volunteer123"),
            "role": "VOLUNTEER",
            "status": "ACTIVE",
            "accountType": "EMAIL",
            "isVerified": True,
            "isActive": True,
            "profile": {
                "bio": random_paragraph(),
                "phone": random_phone(),
                "city": random.choice(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]),
                "country": "USA",
            },
            "skills": [
                {"name": random.choice(["Event Planning", "Crowd Management", "Technical Support", "Hospitality", "Photography"]), "category": "Event Skills", "level": random.choice(["BEGINNER", "INTERMEDIATE", "ADVANCED"])},
                {"name": random.choice(["Communication", "Teamwork", "Leadership", "Problem Solving"]), "category": "Soft Skills", "level": random.choice(["BEGINNER", "INTERMEDIATE", "ADVANCED"])},
            ],
            "availability": [
                {"dayOfWeek": random.randint(0, 6), "startTime": "09:00", "endTime": "17:00", "isAvailable": True},
            ],
            "performanceScore": random.uniform(3.0, 5.0),
            "totalVolunteerHours": random.randint(0, 200),
            "eventsCompleted": random.randint(0, 10),
            "preferences": {
                "notificationSettings": {"email": True, "push": True, "sms": False},
                "theme": random.choice(["LIGHT", "DARK"]),
            },
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        users.append(user)
    
    # Insert users
    collection = db.get_collection(Collections.USERS)
    result = await collection.insert_many(users)
    
    # Add fullName to all users
    for user_id in result.inserted_ids:
        user = users[result.inserted_ids.index(user_id)]
        await collection.update_one(
            {"_id": user_id},
            {"$set": {"fullName": f"{user['firstName']} {user['lastName']}"}}
        )
    
    return users


async def create_event_requests(users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create sample event requests"""
    requests = []
    organizers = [u for u in users if u["role"] == "ORGANIZER"]
    
    event_names = [
        "Annual Charity Gala",
        "Community Food Drive",
        "Music Festival 2024",
        "Tech Conference",
        "Environmental Cleanup Day",
        "Health Awareness Workshop",
        "Art Exhibition",
        "Sports Tournament",
    ]
    
    categories = ["CHARITY", "COMMUNITY", "FESTIVAL", "CONFERENCE", "ENVIRONMENT", "HEALTH", "ARTS", "SPORTS"]
    
    for i, (event_name, category) in enumerate(zip(event_names, categories)):
        organizer = random.choice(organizers)
        
        request = {
            "eventName": event_name,
            "organizationName": f"{organizer['firstName']}'s Organization",
            "contactPerson": f"{organizer['firstName']} {organizer['lastName']}",
            "contactEmail": organizer["email"],
            "contactPhone": organizer["profile"]["phone"],
            "category": category,
            "description": random_paragraph(),
            "venue": f"{random.choice(['Convention Center', 'Park', 'Community Hall', 'Hotel'])} {random.randint(1, 100)}",
            "eventDate": random_date(datetime.now(timezone.utc), datetime.now(timezone.utc) + timedelta(days=90)),
            "startTime": "09:00",
            "endTime": "18:00",
            "expectedAttendees": random.randint(50, 1000),
            "requiredVolunteers": random.randint(5, 50),
            "requiredSkills": random.sample(["Event Planning", "Crowd Management", "Technical Support", "Hospitality", "Photography", "Communication"], k=random.randint(2, 4)),
            "additionalRequirements": random_paragraph(),
            "status": "APPROVED" if i < 4 else "PENDING_REVIEW",
            "requestId": f"REQ-{1000 + i}",
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        }
        
        if i < 4:  # First 4 are approved and assigned
            request["assignedOrganizer"] = organizer["_id"]
            request["assignedAt"] = datetime.now(timezone.utc)
            request["reviewedAt"] = datetime.now(timezone.utc)
        
        requests.append(request)
    
    # Insert requests
    collection = db.get_collection(Collections.EVENT_REQUESTS)
    result = await collection.insert_many(requests)
    
    return requests


async def create_events(users: List[Dict[str, Any]], requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create sample events"""
    events = []
    organizers = [u for u in users if u["role"] == "ORGANIZER"]
    
    for i, request in enumerate(requests):
        if request["status"] != "APPROVED":
            continue
        
        organizer = next((u for u in organizers if str(u["_id"]) == str(request["assignedOrganizer"])), organizers[0])
        
        event = {
            "title": request["eventName"],
            "description": request["description"],
            "category": request["category"],
            "status": random.choice(["OPEN_FOR_REGISTRATION", "UPCOMING", "LIVE"]),
            "eventId": f"EVT-{2000 + i}",
            "organizer": organizer["_id"],
            "location": {
                "venue": request["venue"],
                "address": f"{random.randint(100, 999)} Main St",
                "city": random.choice(["New York", "Los Angeles", "Chicago", "Houston"]),
                "state": random.choice(["NY", "CA", "IL", "TX"]),
                "postalCode": f"{random.randint(10000, 99999)}",
                "country": "USA",
            },
            "date": request["eventDate"],
            "startTime": request["startTime"],
            "endTime": request["endTime"],
            "registrationDeadline": request["eventDate"] - timedelta(days=7),
            "requiredVolunteers": request["requiredVolunteers"],
            "maximumVolunteers": request["requiredVolunteers"] + 10,
            "tags": random.sample(["Popular", "Featured", "Urgent", "New"], k=random.randint(1, 3)),
            "contactEmail": request["contactEmail"],
            "contactPhone": request["contactPhone"],
            "qrToken": random_string(20),
            "applicationsCount": 0,
            "approvedVolunteersCount": 0,
            "assignedVolunteersCount": 0,
            "checkedInCount": 0,
            "tasksCount": 0,
            "completedTasksCount": 0,
            "announcementsCount": 0,
            "totalVolunteerHours": 0,
            "expectedAttendees": request["expectedAttendees"],
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
            "requestId": request["_id"],
        }
        
        events.append(event)
    
    # Insert events
    collection = db.get_collection(Collections.EVENTS)
    result = await collection.insert_many(events)
    
    # Update organizers with their events
    for event in events:
        organizer_id = event["organizer"]
        await db.get_collection(Collections.USERS).update_one(
            {"_id": organizer_id},
            {"$addToSet": {"events": event["_id"]}}
        )
    
    return events


async def create_event_roles(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create sample event roles"""
    roles = []
    
    role_names = [
        "Registration",
        "Crowd Management",
        "Technical Support",
        "Hospitality",
        "Photography",
        "Logistics",
        "Guest Assistance",
        "Social Media",
        "AV Support",
    ]
    
    for event in events:
        for i, role_name in enumerate(role_names[:random.randint(3, 6)]):
            role = {
                "name": role_name,
                "description": f"Responsible for {role_name.lower()} during the event",
                "requiredCount": random.randint(1, 5),
                "requiredSkills": random.sample(["Communication", "Technical", "Organization", "Creativity"], k=random.randint(1, 2)),
                "filledCount": 0,
                "eventId": event["_id"],
                "order": i,
                "color": random.choice(["#FF7A33", "#FFAB33", "#B064FF", "#10B981", "#3B82F6", "#F59E0B"]),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            roles.append(role)
    
    # Insert roles
    collection = db.get_collection(Collections.EVENT_ROLES)
    result = await collection.insert_many(roles)
    
    # Update events with role counts
    for event in events:
        role_count = await collection.count_documents({"eventId": event["_id"]})
        await db.get_collection(Collections.EVENTS).update_one(
            {"_id": event["_id"]},
            {"$set": {"rolesCount": role_count}}
        )
    
    return roles


async def create_shifts(events: List[Dict[str, Any]], roles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create sample shifts"""
    shifts = []
    
    shift_names = ["Morning", "Afternoon", "Evening", "Full Day"]
    shift_times = [
        ("08:00", "12:00"),
        ("12:00", "16:00"),
        ("16:00", "20:00"),
        ("08:00", "20:00"),
    ]
    
    for event in events:
        event_date = event["date"]
        if isinstance(event_date, str):
            event_date = datetime.fromisoformat(event_date)
        
        for i, (shift_name, (start, end)) in enumerate(zip(shift_names, shift_times)):
            shift = {
                "shiftId": f"SHIFT-{event['eventId']}-{i+1}",
                "name": shift_name,
                "description": f"{shift_name} shift for {event['title']}",
                "eventId": event["_id"],
                "startTime": start,
                "endTime": end,
                "date": event_date,
                "capacity": random.randint(5, 20),
                "assignedCount": 0,
                "availableSlots": random.randint(5, 20),
                "status": "OPEN",
                "color": random.choice(["#FF7A33", "#FFAB33", "#B064FF", "#10B981"]),
                "isRecurring": False,
                "breakDuration": 30,
                "checkInStart": "08:00",
                "checkInEnd": start,
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            shifts.append(shift)
    
    # Insert shifts
    collection = db.get_collection(Collections.SHIFTS)
    result = await collection.insert_many(shifts)
    
    return shifts


async def create_applications(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    roles: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample applications"""
    applications = []
    volunteers = [u for u in users if u["role"] == "VOLUNTEER"]
    
    for event in events:
        event_roles = [r for r in roles if str(r["eventId"]) == str(event["_id"])]
        
        # Each event gets 5-15 applications
        num_applications = random.randint(5, min(15, len(volunteers)))
        selected_volunteers = random.sample(volunteers, num_applications)
        
        for volunteer in selected_volunteers:
            role = random.choice(event_roles)
            
            # Calculate match score (40% skills, 20% availability, 20% experience, 20% performance)
            skills_match = random.uniform(0.6, 1.0)
            availability_match = random.uniform(0.7, 1.0)
            experience_match = random.uniform(0.5, 1.0)
            performance_match = volunteer.get("performanceScore", 4.0) / 5.0
            
            match_score = (
                skills_match * 0.4 +
                availability_match * 0.2 +
                experience_match * 0.2 +
                performance_match * 0.2
            ) * 100
            
            status = "PENDING"
            if match_score > 80:
                status = random.choice(["PENDING", "APPROVED"])
            elif match_score > 60:
                status = "PENDING"
            else:
                status = random.choice(["PENDING", "REJECTED"])
            
            application = {
                "applicationId": f"APP-{random.randint(3000, 9999)}",
                "event": event["_id"],
                "volunteer": volunteer["_id"],
                "role": role["_id"],
                "status": status,
                "matchScore": round(match_score, 1),
                "matchReasons": [
                    {"type": "SKILL", "description": "Required skills matched", "matched": True, "score": skills_match * 100},
                    {"type": "AVAILABILITY", "description": "Available during event", "matched": True, "score": availability_match * 100},
                    {"type": "EXPERIENCE", "description": "Relevant experience", "matched": True, "score": experience_match * 100},
                    {"type": "PERFORMANCE", "description": "Strong performance history", "matched": True, "score": performance_match * 100},
                ],
                "applicationDate": datetime.now(timezone.utc),
                "availabilityConfirmed": True,
                "skillsConfirmed": [s["name"] for s in volunteer.get("skills", [])],
                "experienceConfirmed": [e["title"] for e in volunteer.get("experience", [])],
                "priority": random.choice(["LOW", "MEDIUM", "HIGH"]),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            
            if status == "APPROVED":
                application["reviewedDate"] = datetime.now(timezone.utc)
                application["reviewedBy"] = event["organizer"]
            
            applications.append(application)
    
    # Insert applications
    collection = db.get_collection(Collections.APPLICATIONS)
    result = await collection.insert_many(applications)
    
    # Update event application counts
    for event in events:
        count = await collection.count_documents({"event": event["_id"]})
        await db.get_collection(Collections.EVENTS).update_one(
            {"_id": event["_id"]},
            {"$set": {"applicationsCount": count}}
        )
    
    return applications


async def create_assignments(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    applications: List[Dict[str, Any]],
    shifts: List[Dict[str, Any]],
    roles: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample assignments"""
    assignments = []
    
    for application in applications:
        if application["status"] != "APPROVED":
            continue
        
        event = next((e for e in events if str(e["_id"]) == str(application["event"])), None)
        if not event:
            continue
        
        role = next((r for r in roles if str(r["_id"]) == str(application["role"])), None)
        if not role:
            continue
        
        event_shifts = [s for s in shifts if str(s["eventId"]) == str(event["_id"])]
        shift = random.choice(event_shifts) if event_shifts else None
        
        assignment = {
            "assignmentId": f"ASSIGN-{random.randint(4000, 9999)}",
            "event": application["event"],
            "volunteer": application["volunteer"],
            "role": application["role"],
            "shift": shift["_id"] if shift else None,
            "status": random.choice(["ASSIGNED", "CONFIRMED"]),
            "confirmedAt": datetime.now(timezone.utc) if random.random() > 0.5 else None,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
            "createdBy": event["organizer"],
        }
        
        assignments.append(assignment)
    
    # Insert assignments
    collection = db.get_collection(Collections.ASSIGNMENTS)
    result = await collection.insert_many(assignments)
    
    # Update event assignment counts
    for event in events:
        count = await collection.count_documents({"event": event["_id"]})
        await db.get_collection(Collections.EVENTS).update_one(
            {"_id": event["_id"]},
            {"$set": {"assignedVolunteersCount": count}}
        )
    
    return assignments


async def create_tasks(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    assignments: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample tasks"""
    tasks = []
    
    task_titles = [
        "Set up registration desk",
        "Prepare welcome packets",
        "Coordinate volunteer check-in",
        "Manage crowd flow",
        "Assist with technical setup",
        "Monitor equipment",
        "Greet guests",
        "Serve refreshments",
        "Take event photos",
        "Post on social media",
        "Manage parking",
        "Assist with cleanup",
    ]
    
    for assignment in assignments:
        event = next((e for e in events if str(e["_id"]) == str(assignment["event"])), None)
        if not event:
            continue
        
        # Each assignment gets 2-5 tasks
        num_tasks = random.randint(2, 5)
        
        for i in range(num_tasks):
            due_date = event["date"]
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date)
            
            task = {
                "taskId": f"TASK-{random.randint(5000, 9999)}",
                "title": random.choice(task_titles),
                "description": random_paragraph(),
                "event": assignment["event"],
                "volunteer": assignment["volunteer"],
                "assignment": assignment["_id"],
                "priority": random.choice(["LOW", "MEDIUM", "HIGH", "URGENT"]),
                "status": random.choice(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED"]),
                "dueDate": due_date - timedelta(days=random.randint(1, 7)),
                "dueTime": random_time(),
                "estimatedHours": random.randint(1, 8),
                "category": random.choice(["Setup", "Operation", "Cleanup", "Support"]),
                "tags": random.sample(["Urgent", "Important", "Routine"], k=random.randint(1, 2)),
                "createdBy": event["organizer"],
                "assignedBy": event["organizer"],
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            
            if task["status"] == "IN_PROGRESS":
                task["startedAt"] = datetime.now(timezone.utc)
            elif task["status"] == "COMPLETED":
                task["startedAt"] = datetime.now(timezone.utc) - timedelta(hours=2)
                task["completedAt"] = datetime.now(timezone.utc)
                task["actualHours"] = task["estimatedHours"]
            
            tasks.append(task)
    
    # Insert tasks
    collection = db.get_collection(Collections.TASKS)
    result = await collection.insert_many(tasks)
    
    # Update event task counts
    for event in events:
        count = await collection.count_documents({"event": event["_id"]})
        completed = await collection.count_documents({
            "event": event["_id"],
            "status": "COMPLETED"
        })
        await db.get_collection(Collections.EVENTS).update_one(
            {"_id": event["_id"]},
            {"$set": {"tasksCount": count, "completedTasksCount": completed}}
        )
    
    return tasks


async def create_attendance(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    assignments: List[Dict[str, Any]],
    shifts: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample attendance records"""
    attendance_records = []
    
    for assignment in assignments:
        event = next((e for e in events if str(e["_id"]) == str(assignment["event"])), None)
        if not event:
            continue
        
        shift = next((s for s in shifts if str(s["_id"]) == str(assignment.get("shift"))), None) if assignment.get("shift") else None
        
        # Only create attendance for confirmed assignments
        if assignment["status"] != "CONFIRMED":
            continue
        
        # Randomly decide if volunteer attended
        if random.random() > 0.7:  # 70% attendance rate
            check_in_time = event["date"]
            if isinstance(check_in_time, str):
                check_in_time = datetime.fromisoformat(check_in_time)
            
            # Add random time to check-in
            check_in_time = check_in_time.replace(
                hour=random.randint(8, 12),
                minute=random.choice([0, 15, 30, 45])
            )
            
            check_out_time = check_in_time + timedelta(hours=random.randint(4, 8))
            
            attendance = {
                "attendanceId": f"ATT-{random.randint(6000, 9999)}",
                "event": assignment["event"],
                "volunteer": assignment["volunteer"],
                "shift": shift["_id"] if shift else None,
                "status": "CHECKED_OUT",
                "checkInTime": check_in_time,
                "checkInMethod": "QR",
                "checkInBy": event["organizer"],
                "checkOutTime": check_out_time,
                "checkOutMethod": "QR",
                "checkOutBy": event["organizer"],
                "totalHours": round((check_out_time - check_in_time).total_seconds() / 3600, 2),
                "qrToken": event["qrToken"],
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            attendance_records.append(attendance)
    
    # Insert attendance
    collection = db.get_collection(Collections.ATTENDANCE)
    result = await collection.insert_many(attendance_records)
    
    # Update event checked-in count
    for event in events:
        count = await collection.count_documents({"event": event["_id"], "status": "CHECKED_OUT"})
        await db.get_collection(Collections.EVENTS).update_one(
            {"_id": event["_id"]},
            {"$set": {"checkedInCount": count}}
        )
    
    return attendance_records


async def create_announcements(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample announcements"""
    announcements = []
    
    for event in events:
        organizer = next((u for u in users if str(u["_id"]) == str(event["organizer"])), None)
        if not organizer:
            continue
        
        # Each event gets 2-5 announcements
        num_announcements = random.randint(2, 5)
        
        for i in range(num_announcements):
            announcement = {
                "announcementId": f"ANN-{random.randint(7000, 9999)}",
                "event": event["_id"],
                "title": f"Important Update for {event['title']}",
                "message": random_paragraph(),
                "content": f"<p>{random_paragraph()}</p><p>{random_paragraph()}</p>",
                "priority": random.choice(["LOW", "MEDIUM", "HIGH", "URGENT"]),
                "status": "PUBLISHED",
                "isPinned": random.random() > 0.8,
                "publishedAt": datetime.now(timezone.utc),
                "createdBy": organizer["_id"],
                "readBy": [],
                "readCount": 0,
                "likeCount": random.randint(0, 20),
                "commentCount": random.randint(0, 10),
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            announcements.append(announcement)
    
    # Insert announcements
    collection = db.get_collection(Collections.ANNOUNCEMENTS)
    result = await collection.insert_many(announcements)
    
    # Update event announcement counts
    for event in events:
        count = await collection.count_documents({"event": event["_id"]})
        await db.get_collection(Collections.EVENTS).update_one(
            {"_id": event["_id"]},
            {"$set": {"announcementsCount": count}}
        )
    
    return announcements


async def create_reviews(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    assignments: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample reviews"""
    reviews = []
    organizers = [u for u in users if u["role"] == "ORGANIZER"]
    
    for assignment in assignments:
        if assignment["status"] != "CONFIRMED":
            continue
        
        event = next((e for e in events if str(e["_id"]) == str(assignment["event"])), None)
        if not event:
            continue
        
        organizer = random.choice(organizers)
        volunteer = next((u for u in users if str(u["_id"]) == str(assignment["volunteer"])), None)
        if not volunteer:
            continue
        
        # Only create review if event is completed
        if event["status"] != "COMPLETED":
            if random.random() > 0.5:  # 50% chance to skip
                continue
        
        dimensions = [
            {"dimension": "COMMUNICATION", "score": random.randint(3, 5), "comment": random_paragraph()},
            {"dimension": "TEAMWORK", "score": random.randint(3, 5), "comment": random_paragraph()},
            {"dimension": "PUNCTUALITY", "score": random.randint(3, 5), "comment": random_paragraph()},
            {"dimension": "TASK_COMPLETION", "score": random.randint(3, 5), "comment": random_paragraph()},
            {"dimension": "RESPONSIBILITY", "score": random.randint(3, 5), "comment": random_paragraph()},
        ]
        
        overall_score = sum(d["score"] for d in dimensions) / len(dimensions)
        
        review = {
            "reviewId": f"REV-{random.randint(8000, 9999)}",
            "reviewer": organizer["_id"],
            "reviewee": volunteer["_id"],
            "event": event["_id"],
            "assignment": assignment["_id"],
            "type": "VOLUNTEER",
            "status": "PUBLISHED",
            "dimensions": dimensions,
            "overallScore": round(overall_score, 2),
            "comments": random_paragraph(),
            "strengths": random.sample(["Punctual", "Team player", "Hardworking", "Reliable", "Enthusiastic"], k=random.randint(2, 4)),
            "improvements": random.sample(["Communication", "Time management", "Attention to detail"], k=random.randint(0, 2)),
            "rating": round(overall_score, 1),
            "recommendation": random.choice(["STRONGLY_RECOMMEND", "RECOMMEND", "NEUTRAL"]),
            "isAnonymous": False,
            "isPublic": True,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
            "submittedAt": datetime.now(timezone.utc),
            "publishedAt": datetime.now(timezone.utc),
        }
        reviews.append(review)
    
    # Insert reviews
    collection = db.get_collection(Collections.REVIEWS)
    result = await collection.insert_many(reviews)
    
    return reviews


async def create_badges() -> List[Dict[str, Any]]:
    """Create sample badges"""
    badges = [
        {
            "badgeId": "first-event",
            "name": "First Event",
            "description": "Successfully completed your first volunteer event",
            "shortDescription": "First event completed",
            "category": "PARTICIPATION",
            "rarity": "COMMON",
            "icon": "medal",
            "iconColor": "#FF7A33",
            "backgroundColor": "#FFF7F0",
            "borderColor": "#FF9559",
            "criteria": {"type": "EVENT_COUNT", "target": 1, "operator": "GTE"},
            "points": 10,
            "isActive": True,
            "order": 1,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        },
        {
            "badgeId": "quick-responder",
            "name": "Quick Responder",
            "description": "Applied to an event within 24 hours of it being posted",
            "shortDescription": "Fast application",
            "category": "ACHIEVEMENT",
            "rarity": "UNCOMMON",
            "icon": "zap",
            "iconColor": "#B064FF",
            "backgroundColor": "#F9F7FF",
            "borderColor": "#C28CFF",
            "criteria": {"type": "SPECIAL_ACHIEVEMENT", "target": 1, "operator": "GTE"},
            "points": 20,
            "isActive": True,
            "order": 2,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        },
        {
            "badgeId": "perfect-attendance",
            "name": "Perfect Attendance",
            "description": "Checked in and out for every assigned shift in an event",
            "shortDescription": "Perfect attendance",
            "category": "PARTICIPATION",
            "rarity": "RARE",
            "icon": "check-circle",
            "iconColor": "#10B981",
            "backgroundColor": "#ECFDF5",
            "borderColor": "#34D399",
            "criteria": {"type": "SPECIAL_ACHIEVEMENT", "target": 1, "operator": "GTE"},
            "points": 30,
            "isActive": True,
            "order": 3,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        },
        {
            "badgeId": "team-player",
            "name": "Team Player",
            "description": "Consistently receives high teamwork scores in reviews",
            "shortDescription": "Great teamwork",
            "category": "PERFORMANCE",
            "rarity": "RARE",
            "icon": "users",
            "iconColor": "#3B82F6",
            "backgroundColor": "#EFF6FF",
            "borderColor": "#60A5FA",
            "criteria": {"type": "PERFORMANCE_SCORE", "target": 4.5, "operator": "GTE"},
            "points": 40,
            "isActive": True,
            "order": 4,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        },
        {
            "badgeId": "10-events",
            "name": "10 Events Completed",
            "description": "Successfully completed 10 volunteer events",
            "shortDescription": "10 events completed",
            "category": "PARTICIPATION",
            "rarity": "UNCOMMON",
            "icon": "calendar",
            "iconColor": "#FFAB33",
            "backgroundColor": "#FFFBF0",
            "borderColor": "#FFC166",
            "criteria": {"type": "EVENT_COUNT", "target": 10, "operator": "GTE"},
            "points": 50,
            "isActive": True,
            "order": 5,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        },
        {
            "badgeId": "50-hours",
            "name": "50 Volunteer Hours",
            "description": "Completed 50 hours of volunteer service",
            "shortDescription": "50 hours served",
            "category": "TIME",
            "rarity": "RARE",
            "icon": "clock",
            "iconColor": "#8B5CF6",
            "backgroundColor": "#F5F3FF",
            "borderColor": "#A78BFA",
            "criteria": {"type": "VOLUNTEER_HOURS", "target": 50, "operator": "GTE"},
            "points": 60,
            "isActive": True,
            "order": 6,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        },
        {
            "badgeId": "top-volunteer",
            "name": "Top Volunteer",
            "description": "Completed 100+ hours with excellent performance",
            "shortDescription": "Top volunteer",
            "category": "ACHIEVEMENT",
            "rarity": "EPIC",
            "icon": "trophy",
            "iconColor": "#F59E0B",
            "backgroundColor": "#FFFBEB",
            "borderColor": "#FBBF24",
            "criteria": {"type": "VOLUNTEER_HOURS", "target": 100, "operator": "GTE"},
            "points": 100,
            "isActive": True,
            "order": 7,
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        },
    ]
    
    # Insert badges
    collection = db.get_collection(Collections.BADGES)
    result = await collection.insert_many(badges)
    
    return badges


async def create_volunteer_badges(
    users: List[Dict[str, Any]],
    badges: List[Dict[str, Any]],
    attendance_records: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Award badges to volunteers based on their activity"""
    volunteer_badges = []
    volunteers = [u for u in users if u["role"] == "VOLUNTEER"]
    
    for volunteer in volunteers:
        events_completed = volunteer.get("eventsCompleted", 0)
        total_hours = volunteer.get("totalVolunteerHours", 0)
        performance_score = volunteer.get("performanceScore", 4.0)
        
        # Award badges based on criteria
        for badge in badges:
            criteria = badge["criteria"]
            
            if criteria["type"] == "EVENT_COUNT":
                if criteria["operator"] == "GTE" and events_completed >= criteria["target"]:
                    volunteer_badges.append({
                        "volunteerId": volunteer["_id"],
                        "badgeId": badge["_id"],
                        "earnedAt": datetime.now(timezone.utc),
                        "isActive": True,
                        "level": 1,
                        "createdAt": datetime.now(timezone.utc),
                        "updatedAt": datetime.now(timezone.utc),
                    })
            
            elif criteria["type"] == "VOLUNTEER_HOURS":
                if criteria["operator"] == "GTE" and total_hours >= criteria["target"]:
                    volunteer_badges.append({
                        "volunteerId": volunteer["_id"],
                        "badgeId": badge["_id"],
                        "earnedAt": datetime.now(timezone.utc),
                        "isActive": True,
                        "level": 1,
                        "createdAt": datetime.now(timezone.utc),
                        "updatedAt": datetime.now(timezone.utc),
                    })
            
            elif criteria["type"] == "PERFORMANCE_SCORE":
                if criteria["operator"] == "GTE" and performance_score >= criteria["target"]:
                    volunteer_badges.append({
                        "volunteerId": volunteer["_id"],
                        "badgeId": badge["_id"],
                        "earnedAt": datetime.now(timezone.utc),
                        "isActive": True,
                        "level": 1,
                        "createdAt": datetime.now(timezone.utc),
                        "updatedAt": datetime.now(timezone.utc),
                    })
    
    # Insert volunteer badges
    if volunteer_badges:
        collection = db.get_collection(Collections.VOLUNTEER_BADGES)
        result = await collection.insert_many(volunteer_badges)
    
    return volunteer_badges


async def create_notifications(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    applications: List[Dict[str, Any]],
    assignments: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    announcements: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample notifications"""
    notifications = []
    
    # Event assignment notifications
    for assignment in assignments:
        event = next((e for e in events if str(e["_id"]) == str(assignment["event"])), None)
        if not event:
            continue
        
        volunteer = next((u for u in users if str(u["_id"]) == str(assignment["volunteer"])), None)
        if not volunteer:
            continue
        
        notifications.append({
            "notificationId": f"NOT-{random.randint(9000, 9999)}",
            "userId": volunteer["_id"],
            "type": "ASSIGNMENT",
            "priority": "HIGH",
            "title": f"You've been assigned to {event['title']}",
            "message": f"You have been assigned to {event['title']} as a volunteer. Please check your dashboard for details.",
            "data": {
                "eventId": str(event["_id"]),
                "eventTitle": event["title"],
                "assignmentId": str(assignment["_id"]),
            },
            "isRead": random.random() > 0.5,
            "isArchived": False,
            "relatedEntityId": assignment["_id"],
            "relatedEntityType": "ASSIGNMENT",
            "actionUrl": f"/volunteer/events/{event['_id']}",
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        })
    
    # Task notifications
    for task in tasks:
        volunteer = next((u for u in users if str(u["_id"]) == str(task["volunteer"])), None)
        if not volunteer:
            continue
        
        event = next((e for e in events if str(e["_id"]) == str(task["event"])), None)
        if not event:
            continue
        
        notifications.append({
            "notificationId": f"NOT-{random.randint(9000, 9999)}",
            "userId": volunteer["_id"],
            "type": "TASK",
            "priority": "MEDIUM" if task["priority"] == "LOW" else "HIGH",
            "title": f"New task: {task['title']}",
            "message": f"You have been assigned a new task: {task['title']}. Due: {task['dueDate']}",
            "data": {
                "taskId": str(task["_id"]),
                "taskTitle": task["title"],
                "eventId": str(event["_id"]),
                "dueDate": str(task["dueDate"]),
                "priority": task["priority"],
            },
            "isRead": random.random() > 0.5,
            "isArchived": False,
            "relatedEntityId": task["_id"],
            "relatedEntityType": "TASK",
            "actionUrl": f"/volunteer/tasks/{task['_id']}",
            "createdAt": datetime.now(timezone.utc),
            "updatedAt": datetime.now(timezone.utc),
        })
    
    # Announcement notifications
    for announcement in announcements:
        event = next((e for e in events if str(e["_id"]) == str(announcement["event"])), None)
        if not event:
            continue
        
        # Get volunteers assigned to this event
        assignments_for_event = [a for a in assignments if str(a["event"]) == str(event["_id"])]
        
        for assignment in assignments_for_event:
            volunteer = next((u for u in users if str(u["_id"]) == str(assignment["volunteer"])), None)
            if not volunteer:
                continue
            
            notifications.append({
                "notificationId": f"NOT-{random.randint(9000, 9999)}",
                "userId": volunteer["_id"],
                "type": "ANNOUNCEMENT",
                "priority": announcement["priority"],
                "title": announcement["title"],
                "message": announcement["message"],
                "data": {
                    "announcementId": str(announcement["_id"]),
                    "eventId": str(event["_id"]),
                    "eventTitle": event["title"],
                },
                "isRead": random.random() > 0.5,
                "isArchived": False,
                "relatedEntityId": announcement["_id"],
                "relatedEntityType": "ANNOUNCEMENT",
                "actionUrl": f"/volunteer/announcements/{announcement['_id']}",
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            })
    
    # Insert notifications
    if notifications:
        collection = db.get_collection(Collections.NOTIFICATIONS)
        result = await collection.insert_many(notifications)
    
    return notifications


async def create_activity_logs(
    users: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    applications: List[Dict[str, Any]],
    assignments: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    attendance_records: List[Dict[str, Any]],
    announcements: List[Dict[str, Any]],
    reviews: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Create sample activity logs"""
    logs = []
    
    # User registration logs
    for user in users:
        logs.append({
            "userId": user["_id"],
            "action": "USER_REGISTERED",
            "entityType": "USER",
            "entityId": user["_id"],
            "description": f"User {user['fullName']} registered",
            "metadata": {"role": user["role"], "email": user["email"]},
            "ipAddress": "192.168.1.1",
            "userAgent": "Mozilla/5.0",
            "createdAt": datetime.now(timezone.utc),
        })
    
    # Event creation logs
    for event in events:
        logs.append({
            "userId": event["organizer"],
            "action": "EVENT_CREATED",
            "entityType": "EVENT",
            "entityId": event["_id"],
            "description": f"Event {event['title']} created",
            "metadata": {"title": event["title"], "date": str(event["date"])},
            "createdAt": datetime.now(timezone.utc),
        })
    
    # Application logs
    for application in applications:
        logs.append({
            "userId": application["volunteer"],
            "action": "APPLICATION_SUBMITTED",
            "entityType": "APPLICATION",
            "entityId": application["_id"],
            "description": f"Applied to event {application['event']}",
            "metadata": {"status": application["status"], "matchScore": application["matchScore"]},
            "createdAt": datetime.now(timezone.utc),
        })
    
    # Assignment logs
    for assignment in assignments:
        logs.append({
            "userId": assignment["createdBy"],
            "action": "VOLUNTEER_ASSIGNED",
            "entityType": "ASSIGNMENT",
            "entityId": assignment["_id"],
            "description": f"Assigned volunteer {assignment['volunteer']} to event {assignment['event']}",
            "metadata": {"status": assignment["status"]},
            "createdAt": datetime.now(timezone.utc),
        })
    
    # Task logs
    for task in tasks:
        logs.append({
            "userId": task["createdBy"],
            "action": "TASK_CREATED",
            "entityType": "TASK",
            "entityId": task["_id"],
            "description": f"Task {task['title']} created",
            "metadata": {"priority": task["priority"], "status": task["status"]},
            "createdAt": datetime.now(timezone.utc),
        })
    
    # Attendance logs
    for attendance in attendance_records:
        logs.append({
            "userId": attendance["volunteer"],
            "action": "VOLUNTEER_CHECKED_IN",
            "entityType": "ATTENDANCE",
            "entityId": attendance["_id"],
            "description": f"Checked in for event {attendance['event']}",
            "metadata": {"status": attendance["status"], "totalHours": attendance["totalHours"]},
            "createdAt": attendance["checkInTime"],
        })
        
        logs.append({
            "userId": attendance["volunteer"],
            "action": "VOLUNTEER_CHECKED_OUT",
            "entityType": "ATTENDANCE",
            "entityId": attendance["_id"],
            "description": f"Checked out for event {attendance['event']}",
            "metadata": {"totalHours": attendance["totalHours"]},
            "createdAt": attendance["checkOutTime"],
        })
    
    # Insert logs
    if logs:
        collection = db.get_collection(Collections.ACTIVITY_LOGS)
        result = await collection.insert_many(logs)
    
    return logs


# Main seed function
async def seed_database() -> Dict[str, Any]:
    """Seed the database with all test data"""
    print("🌱 Seeding EventFlow database...")
    
    result = {}
    
    # Clear existing data
    await clear_database()
    
    # Create users
    print("👥 Creating users...")
    users = await create_users()
    result["users"] = len(users)
    
    # Create event requests
    print("📝 Creating event requests...")
    requests = await create_event_requests(users)
    result["event_requests"] = len(requests)
    
    # Create events
    print("🎉 Creating events...")
    events = await create_events(users, requests)
    result["events"] = len(events)
    
    # Create event roles
    print("👔 Creating event roles...")
    roles = await create_event_roles(events)
    result["roles"] = len(roles)
    
    # Create shifts
    print("⏰ Creating shifts...")
    shifts = await create_shifts(events, roles)
    result["shifts"] = len(shifts)
    
    # Create applications
    print("📋 Creating applications...")
    applications = await create_applications(users, events, roles)
    result["applications"] = len(applications)
    
    # Create assignments
    print("🎯 Creating assignments...")
    assignments = await create_assignments(users, events, applications, shifts, roles)
    result["assignments"] = len(assignments)
    
    # Create tasks
    print("📝 Creating tasks...")
    tasks = await create_tasks(users, events, assignments)
    result["tasks"] = len(tasks)
    
    # Create attendance
    print("🎫 Creating attendance records...")
    attendance_records = await create_attendance(users, events, assignments, shifts)
    result["attendance"] = len(attendance_records)
    
    # Create announcements
    print("📢 Creating announcements...")
    announcements = await create_announcements(users, events)
    result["announcements"] = len(announcements)
    
    # Create reviews
    print("⭐ Creating reviews...")
    reviews = await create_reviews(users, events, assignments)
    result["reviews"] = len(reviews)
    
    # Create badges
    print("🏅 Creating badges...")
    badges = await create_badges()
    result["badges"] = len(badges)
    
    # Create volunteer badges
    print("🎖️ Awarding volunteer badges...")
    volunteer_badges = await create_volunteer_badges(users, badges, attendance_records)
    result["volunteer_badges"] = len(volunteer_badges)
    
    # Create notifications
    print("🔔 Creating notifications...")
    notifications = await create_notifications(
        users, events, applications, assignments, tasks, announcements
    )
    result["notifications"] = len(notifications)
    
    # Create activity logs
    print("📜 Creating activity logs...")
    activity_logs = await create_activity_logs(
        users, events, applications, assignments, tasks, attendance_records, announcements, reviews
    )
    result["activity_logs"] = len(activity_logs)
    
    print("✅ Database seeding complete!")
    print(f"📊 Summary: {json.dumps(result, indent=2)}")
    
    return result


async def clear_database() -> None:
    """Clear all database collections"""
    print("🗑️ Clearing database...")
    
    collections_to_clear = [
        Collections.USERS,
        Collections.EVENT_REQUESTS,
        Collections.EVENTS,
        Collections.EVENT_ROLES,
        Collections.SHIFTS,
        Collections.APPLICATIONS,
        Collections.ASSIGNMENTS,
        Collections.TASKS,
        Collections.ATTENDANCE,
        Collections.NOTIFICATIONS,
        Collections.ANNOUNCEMENTS,
        Collections.REVIEWS,
        Collections.BADGES,
        Collections.VOLUNTEER_BADGES,
        Collections.OTP_VERIFICATIONS,
        Collections.PASSWORD_RESET_TOKENS,
        Collections.COUNTERS,
        Collections.ACTIVITY_LOGS,
    ]
    
    for collection_name in collections_to_clear:
        collection = db.get_collection(collection_name)
        await collection.delete_many({})
        print(f"🧹 Cleared {collection_name}")
    
    # Reset counters
    collection = db.get_collection(Collections.COUNTERS)
    await collection.insert_one({"name": "user_id", "value": 0})
    await collection.insert_one({"name": "event_id", "value": 0})
    await collection.insert_one({"name": "application_id", "value": 0})
    await collection.insert_one({"name": "assignment_id", "value": 0})
    await collection.insert_one({"name": "task_id", "value": 0})
    
    print("✅ Database cleared successfully")


# For direct execution
if __name__ == "__main__":
    import asyncio
    
    async def main():
        await seed_database()
    
    asyncio.run(main())
