# API v1 module
from .auth import router as auth_router
from .users import router as users_router
from .event_requests import router as event_requests_router
from .events import router as events_router
from .applications import router as applications_router
from .assignments import router as assignments_router
from .tasks import router as tasks_router
from .shifts import router as shifts_router
from .attendance import router as attendance_router
from .announcements import router as announcements_router
from .notifications import router as notifications_router
from .reviews import router as reviews_router
from .badges import router as badges_router
from .analytics import router as analytics_router

__all__ = [
    'auth_router',
    'users_router',
    'event_requests_router',
    'events_router',
    'applications_router',
    'assignments_router',
    'tasks_router',
    'shifts_router',
    'attendance_router',
    'announcements_router',
    'notifications_router',
    'reviews_router',
    'badges_router',
    'analytics_router',
]
