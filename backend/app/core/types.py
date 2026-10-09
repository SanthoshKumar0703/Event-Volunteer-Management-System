"""
EventFlow Custom Types
Custom type annotations for Pydantic models
"""

from pydantic import GetCoreSchemaHandler
from pydantic_core import CoreSchema, core_schema
from bson import ObjectId
from typing import Any


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic v2 compatibility"""
    
    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: GetCoreSchemaHandler,
    ) -> CoreSchema:
        def validate_objectid(value: Any) -> ObjectId:
            if isinstance(value, ObjectId):
                return value
            if isinstance(value, str):
                return ObjectId(value)
            raise ValueError(f"Invalid ObjectId: {value}")
        
        return core_schema.no_info_plain_validator_function(
            validate_objectid,
            serialization=core_schema.str_ser_schema(),
        )


# Export
__all__ = ['PyObjectId']
