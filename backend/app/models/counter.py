"""
EventFlow Counter Model
MongoDB counter document model for auto-incrementing IDs
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId

from ..core.database import Collections, db


class CounterModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, arbitrary_types_allowed=True)
    """Counter model for auto-incrementing IDs"""
    
    _id: Optional[ObjectId] = None
    name: str
    value: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = self.model_dump()
        data["_id"] = str(data["_id"]) if data["_id"] else None
        return data


class CounterDB:
    """Counter database operations"""
    
    @staticmethod
    async def get_next_sequence(name: str) -> int:
        """Get the next sequence value for a counter"""
        collection = db.get_collection(Collections.COUNTERS)
        
        # Find and update counter
        result = await collection.find_one_and_update(
            {"name": name},
            {"$inc": {"value": 1}},
            upsert=True,
            return_document=True
        )
        
        if result:
            return result["value"]
        
        # If no result, create new counter
        await collection.insert_one({"name": name, "value": 1})
        return 1
    
    @staticmethod
    async def get_current_value(name: str) -> int:
        """Get current counter value"""
        collection = db.get_collection(Collections.COUNTERS)
        
        counter = await collection.find_one({"name": name})
        if counter:
            return counter["value"]
        return 0
    
    @staticmethod
    async def set_value(name: str, value: int) -> None:
        """Set counter value"""
        collection = db.get_collection(Collections.COUNTERS)
        
        await collection.update_one(
            {"name": name},
            {"$set": {"value": value, "updatedAt": datetime.now(timezone.utc)}},
            upsert=True
        )
    
    @staticmethod
    async def reset_counter(name: str) -> None:
        """Reset counter to 0"""
        collection = db.get_collection(Collections.COUNTERS)
        
        await collection.update_one(
            {"name": name},
            {"$set": {"value": 0, "updatedAt": datetime.now(timezone.utc)}},
            upsert=True
        )
