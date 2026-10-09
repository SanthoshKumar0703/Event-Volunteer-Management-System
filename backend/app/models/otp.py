"""
EventFlow OTP Model
One-Time Password verification model
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, Union
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from ..core.database import Collections, db
from ..core.config import get_settings


class OTPModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """OTP verification model"""
    
    _id: Optional[ObjectId] = None
    email: str
    otp: str
    expiresAt: datetime
    used: bool = False
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def is_valid(self) -> bool:
        """Check if OTP is still valid"""
        settings = get_settings()
        now = datetime.now(timezone.utc)
        return not self.used and now < self.expiresAt
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        return data


class OTPDB:
    """OTP database operations"""
    
    @staticmethod
    async def create(email: str, otp: str) -> OTPModel:
        """Create a new OTP"""
        settings = get_settings()
        collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        
        # Delete existing OTPs for this email
        await collection.delete_many({"email": email})
        
        # Create new OTP
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.OTP_EXPIRE_MINUTES
        )
        
        otp_data = {
            "email": email,
            "otp": otp,
            "expiresAt": expires_at,
            "used": False,
            "createdAt": datetime.now(timezone.utc)
        }
        
        result = await collection.insert_one(otp_data)
        otp_data["_id"] = result.inserted_id
        
        return OTPModel(**otp_data)
    
    @staticmethod
    async def get_by_email(email: str) -> Optional[OTPModel]:
        """Get OTP by email"""
        collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        otp_data = await collection.find_one({"email": email})
        if otp_data:
            return OTPModel(**otp_data)
        return None
    
    @staticmethod
    async def get_by_otp(otp: str) -> Optional[OTPModel]:
        """Get OTP by OTP code"""
        collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        otp_data = await collection.find_one({"otp": otp})
        if otp_data:
            return OTPModel(**otp_data)
        return None
    
    @staticmethod
    async def mark_as_used(otp_id: Union[ObjectId, str]) -> bool:
        """Mark OTP as used"""
        collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        result = await collection.update_one(
            {"_id": ObjectId(otp_id)},
            {"$set": {"used": True}}
        )
        return result.modified_count > 0
    
    @staticmethod
    async def delete_expired() -> int:
        """Delete all expired OTPs"""
        collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        now = datetime.now(timezone.utc)
        result = await collection.delete_many({"expiresAt": {"$lt": now}})
        return result.deleted_count
    
    @staticmethod
    async def delete_by_email(email: str) -> int:
        """Delete OTPs by email"""
        collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        result = await collection.delete_many({"email": email})
        return result.deleted_count



