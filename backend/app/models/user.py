"""
EventFlow User Model
MongoDB user document model with Pydantic validation
"""

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum

from ..core.database import Collections, db
from ..core.security import get_password_hash, verify_password


# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    VOLUNTEER = "VOLUNTEER"


class UserStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class AccountType(str, Enum):
    EMAIL = "EMAIL"
    GOOGLE = "GOOGLE"
    GUEST = "GUEST"


class Gender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"
    PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY"


class SkillLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"


# Sub-models
class UserSkill(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    name: str
    category: str
    level: SkillLevel
    yearsOfExperience: Optional[int] = None
    certified: Optional[bool] = False
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class UserExperience(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    title: str
    organization: str
    role: str
    description: str
    startDate: Union[datetime, str]
    endDate: Optional[Union[datetime, str]] = None
    currentlyWorking: bool = False
    createdAt: Optional[datetime] = None


class UserAvailability(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    dayOfWeek: int  # 0-6 (0 = Sunday)
    startTime: str  # HH:mm format
    endTime: str  # HH:mm format
    isAvailable: bool = True


class SocialLinks(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    website: Optional[str] = None


class UserProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    bio: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    dateOfBirth: Optional[Union[datetime, str]] = None
    gender: Optional[Gender] = None
    profileImage: Optional[str] = None
    coverImage: Optional[str] = None
    socialLinks: Optional[SocialLinks] = None


class NotificationSettings(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    email: bool = True
    push: bool = True
    sms: bool = False


class UserPreferences(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    notificationSettings: NotificationSettings = Field(default_factory=NotificationSettings)
    theme: str = "LIGHT"  # LIGHT, DARK, SYSTEM
    language: str = "en"
    timezone: str = "UTC"


# Main User Model
class UserModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    
    _id: Optional[ObjectId] = None
    firstName: str
    lastName: str
    fullName: Optional[str] = None
    email: EmailStr
    password: Optional[str] = None  # Hashed password, not returned in responses
    role: UserRole
    status: UserStatus = UserStatus.PENDING
    accountType: AccountType = AccountType.EMAIL
    isVerified: bool = False
    isActive: bool = True
    skills: List[UserSkill] = Field(default_factory=list)
    experience: List[UserExperience] = Field(default_factory=list)
    availability: List[UserAvailability] = Field(default_factory=list)
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    profile: UserProfile = Field(default_factory=UserProfile)
    performanceScore: Optional[float] = None
    totalVolunteerHours: Optional[float] = 0.0
    eventsCompleted: Optional[int] = 0
    tasksCompleted: Optional[int] = 0
    badges: List[ObjectId] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lastLoginAt: Optional[datetime] = None
    googleId: Optional[str] = None
    resetToken: Optional[str] = None
    resetTokenExpires: Optional[datetime] = None
    verificationToken: Optional[str] = None
    verifiedAt: Optional[datetime] = None
    
    def __init__(self, **data):
        super().__init__(**data)
        if not self.fullName and self.firstName and self.lastName:
            self.fullName = f"{self.firstName} {self.lastName}"
    
    def set_password(self, password: str) -> None:
        """Hash and set the password"""
        self.password = get_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """Verify a password against the stored hash"""
        if not self.password:
            return False
        return verify_password(password, self.password)
    
    def to_dict(self, exclude_password: bool = True) -> Dict[str, Any]:
        """Convert to dictionary, optionally excluding password"""
        data = self.model_dump()
        if exclude_password:
            data.pop("password", None)
        return data
    
    def to_summary(self) -> Dict[str, Any]:
        """Convert to summary dictionary"""
        return {
            "_id": str(self._id) if self._id else None,
            "firstName": self.firstName,
            "lastName": self.lastName,
            "fullName": self.fullName,
            "email": self.email,
            "role": self.role,
            "status": self.status,
            "profileImage": self.profile.get("profileImage"),
            "performanceScore": self.performanceScore,
            "totalVolunteerHours": self.totalVolunteerHours,
            "eventsCompleted": self.eventsCompleted,
        }


class UserSummaryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Simplified user model for summaries"""
    
    _id: Optional[Union[ObjectId, str]] = None
    firstName: str
    lastName: str
    fullName: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    profileImage: Optional[str] = None
    performanceScore: Optional[float] = None
    totalVolunteerHours: Optional[float] = None
    eventsCompleted: Optional[int] = None
    
    @classmethod
    def from_user(cls, user: UserModel) -> "UserSummaryModel":
        """Create a summary from a full user model"""
        return cls(
            _id=str(user._id) if user._id else None,
            firstName=user.firstName,
            lastName=user.lastName,
            fullName=user.fullName or f"{user.firstName} {user.lastName}",
            email=user.email,
            role=user.role,
            status=user.status,
            profileImage=user.profile.get("profileImage"),
            performanceScore=user.performanceScore,
            totalVolunteerHours=user.totalVolunteerHours,
            eventsCompleted=user.eventsCompleted,
        )


# Database Operations
class UserDB:
    """User database operations"""
    
    @staticmethod
    async def create(user_data: Dict[str, Any]) -> UserModel:
        """Create a new user"""
        collection = db.get_collection(Collections.USERS)
        
        # Check if email already exists
        existing = await collection.find_one({"email": user_data["email"]})
        if existing:
            raise ValueError(f"User with email {user_data['email']} already exists")
        
        # Hash password if provided
        if "password" in user_data and user_data["password"]:
            user_data["password"] = get_password_hash(user_data["password"])
        
        # Set full name
        user_data["fullName"] = f"{user_data['firstName']} {user_data['lastName']}"
        
        # Insert user
        result = await collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        
        return UserModel(**user_data)
    
    @staticmethod
    async def get_by_id(user_id: Union[ObjectId, str]) -> Optional[UserModel]:
        """Get user by ID"""
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({"_id": ObjectId(user_id)})
        if user_data:
            return UserModel(**user_data)
        return None
    
    @staticmethod
    async def get_by_email(email: str) -> Optional[UserModel]:
        """Get user by email"""
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({"email": email})
        if user_data:
            return UserModel(**user_data)
        return None
    
    @staticmethod
    async def get_by_google_id(google_id: str) -> Optional[UserModel]:
        """Get user by Google ID"""
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({"googleId": google_id})
        if user_data:
            return UserModel(**user_data)
        return None
    
    @staticmethod
    async def update(user_id: Union[ObjectId, str], update_data: Dict[str, Any]) -> Optional[UserModel]:
        """Update a user"""
        collection = db.get_collection(Collections.USERS)
        
        # Hash password if provided
        if "password" in update_data and update_data["password"]:
            update_data["password"] = get_password_hash(update_data["password"])
        
        # Set full name if firstName or lastName changed
        if "firstName" in update_data or "lastName" in update_data:
            user = await collection.find_one({"_id": ObjectId(user_id)})
            if user:
                first_name = update_data.get("firstName", user.get("firstName", ""))
                last_name = update_data.get("lastName", user.get("lastName", ""))
                update_data["fullName"] = f"{first_name} {last_name}"
        
        update_data["updatedAt"] = datetime.now(timezone.utc)
        
        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            user_data = await collection.find_one({"_id": ObjectId(user_id)})
            return UserModel(**user_data) if user_data else None
        return None
    
    @staticmethod
    async def delete(user_id: Union[ObjectId, str]) -> bool:
        """Delete a user"""
        collection = db.get_collection(Collections.USERS)
        result = await collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    @staticmethod
    async def list_all(
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None,
        search: Optional[str] = None,
    ) -> List[UserModel]:
        """List all users with optional filters"""
        collection = db.get_collection(Collections.USERS)
        
        query = {}
        if role:
            query["role"] = role
        if status:
            query["status"] = status
        if search:
            query["$or"] = [
                {"firstName": {"$regex": search, "$options": "i"}},
                {"lastName": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
            ]
        
        cursor = collection.find(query).skip(skip).limit(limit)
        users = []
        async for user_data in cursor:
            users.append(UserModel(**user_data))
        
        return users
    
    @staticmethod
    async def count(
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None,
    ) -> int:
        """Count users with optional filters"""
        collection = db.get_collection(Collections.USERS)
        
        query = {}
        if role:
            query["role"] = role
        if status:
            query["status"] = status
        
        return await collection.count_documents(query)


# Helper function to create admin user if not exists
async def create_admin_user_if_not_exists() -> UserModel:
    """Create default admin user if not exists"""
    from ..core.config import get_settings
    
    settings = get_settings()
    
    # Check if admin already exists
    collection = db.get_collection(Collections.USERS)
    admin = await collection.find_one({"email": "admin@eventflow.app"})
    
    if admin:
        normalized_admin = {
            "_id": admin.get("_id"),
            "firstName": admin.get("firstName") or "Admin",
            "lastName": admin.get("lastName") or "User",
            "fullName": admin.get("fullName") or "Admin User",
            "email": admin.get("email") or "admin@eventflow.app",
            "password": admin.get("password") or get_password_hash("admin123"),
            "role": UserRole.ADMIN.value,
            "status": UserStatus.ACTIVE.value,
            "accountType": AccountType.EMAIL.value,
            "isVerified": bool(admin.get("isVerified", True)),
            "isActive": bool(admin.get("isActive", True)),
            "skills": admin.get("skills") if isinstance(admin.get("skills"), list) else [],
            "experience": admin.get("experience") if isinstance(admin.get("experience"), list) else [],
            "availability": admin.get("availability") if isinstance(admin.get("availability"), list) else [],
            "preferences": admin.get("preferences") if isinstance(admin.get("preferences"), dict) else {
                "notificationSettings": {"email": True, "push": True, "sms": False},
                "theme": "LIGHT",
                "language": "en",
                "timezone": "UTC",
            },
            "profile": admin.get("profile") if isinstance(admin.get("profile"), dict) else {
                "bio": "Platform Administrator",
                "phone": "+1-555-0123",
            },
            "performanceScore": admin.get("performanceScore"),
            "totalVolunteerHours": admin.get("totalVolunteerHours", 0.0),
            "eventsCompleted": admin.get("eventsCompleted", 0),
            "tasksCompleted": admin.get("tasksCompleted", 0),
            "badges": admin.get("badges") if isinstance(admin.get("badges"), list) else [],
            "createdAt": admin.get("createdAt") or datetime.now(timezone.utc),
            "updatedAt": admin.get("updatedAt") or datetime.now(timezone.utc),
            "lastLoginAt": admin.get("lastLoginAt"),
            "googleId": admin.get("googleId"),
            "resetToken": admin.get("resetToken"),
            "resetTokenExpires": admin.get("resetTokenExpires"),
            "verificationToken": admin.get("verificationToken"),
            "verifiedAt": admin.get("verifiedAt"),
        }
        await collection.update_one({"_id": admin["_id"]}, {"$set": normalized_admin})
        return UserModel(**normalized_admin)
    
    # Create admin user
    admin_data = {
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@eventflow.app",
        "password": get_password_hash("admin123"),
        "role": UserRole.ADMIN,
        "status": UserStatus.ACTIVE,
        "accountType": AccountType.EMAIL,
        "isVerified": True,
        "isActive": True,
        "profile": {
            "bio": "Platform Administrator",
            "phone": "+1-555-0123",
        },
        "preferences": {
            "notificationSettings": {"email": True, "push": True, "sms": False},
            "theme": "LIGHT",
        },
    }
    
    user = await UserDB.create(admin_data)
    print(f"✅ Created admin user: {user.email}")
    return user
