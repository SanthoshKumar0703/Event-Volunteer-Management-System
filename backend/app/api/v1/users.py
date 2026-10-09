"""
EventFlow Users API
User management endpoints
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
    get_password_hash,
    validate_password,
    get_password_validation_errors,
)
from ...core.database import db, Collections
from ...models.user import UserModel, UserDB, UserRole, UserStatus, AccountType
from ...models.counter import CounterDB
from ...services.email_service import EmailService
from ...services.notification_service import create_notification

router = APIRouter(prefix="/users", tags=["Users"])

settings = get_settings()


# Get all users (Admin only)
@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(check_admin)
):
    """Get all users with optional filters"""
    try:
        users = await UserDB.list_all(
            skip=skip,
            limit=limit,
            role=role,
            status=status,
            search=search
        )
        
        total = await UserDB.count(role=role, status=status)
        
        return {
            "success": True,
            "data": [user.to_dict(exclude_password=True) for user in users],
            "meta": {
                "skip": skip,
                "limit": limit,
                "total": total,
                "hasMore": skip + limit < total
            }
        }
    except Exception as e:
        print(f"Error getting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get user by ID
@router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user by ID"""
    try:
        # Check if user can access this profile
        if str(current_user["_id"]) != user_id and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this user"
            )
        
        user = await UserDB.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "data": user.to_dict(exclude_password=True)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Update user
@router.put("/{user_id}", status_code=status.HTTP_200_OK)
async def update_user(
    user_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update user information"""
    try:
        data = await request.json()
        
        # Check if user can update this profile
        if str(current_user["_id"]) != user_id and current_user["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this user"
            )
        
        # Get user
        user = await UserDB.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare update data
        update_data = {}
        
        if "firstName" in data:
            update_data["firstName"] = data["firstName"]
        if "lastName" in data:
            update_data["lastName"] = data["lastName"]
        if "email" in data:
            # Check if email is already taken
            existing = await UserDB.get_by_email(data["email"])
            if existing and str(existing._id) != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            update_data["email"] = data["email"]
        if "phone" in data:
            update_data["profile.phone"] = data["phone"]
        if "bio" in data:
            update_data["profile.bio"] = data["bio"]
        if "skills" in data:
            update_data["skills"] = data["skills"]
        if "experience" in data:
            update_data["experience"] = data["experience"]
        if "availability" in data:
            update_data["availability"] = data["availability"]
        if "preferences" in data:
            update_data["preferences"] = data["preferences"]
        if "password" in data:
            # Validate password
            if not validate_password(data["password"]):
                errors = get_password_validation_errors(data["password"])
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": "Password validation failed", "errors": errors}
                )
            update_data["password"] = get_password_hash(data["password"])
        
        # Admin-only fields
        if current_user["role"] == UserRole.ADMIN:
            if "role" in data:
                update_data["role"] = data["role"]
            if "status" in data:
                update_data["status"] = data["status"]
            if "isActive" in data:
                update_data["isActive"] = data["isActive"]
        
        # Update user
        updated_user = await UserDB.update(user_id, update_data)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "message": "User updated successfully",
            "data": updated_user.to_dict(exclude_password=True)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Delete user (Admin only)
@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(check_admin)
):
    """Delete a user"""
    try:
        user = await UserDB.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent deleting self
        if str(current_user["_id"]) == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        success = await UserDB.delete(user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "success": True,
            "message": "User deleted successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get user stats (Admin only)
@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_user_stats(
    current_user: dict = Depends(check_admin)
):
    """Get user statistics"""
    try:
        stats = await UserDB.get_stats()
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        print(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Approve organizer (Admin only)
@router.post("/{user_id}/approve", status_code=status.HTTP_200_OK)
async def approve_organizer(
    user_id: str,
    request: Request,
    current_user: dict = Depends(check_admin)
):
    """Approve an organizer account"""
    try:
        data = await request.json()
        status = data.get("status", "APPROVED")  # APPROVED or REJECTED
        notes = data.get("notes", "")
        
        user = await UserDB.get_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.ORGANIZER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not an organizer"
            )
        
        # Update user status
        update_data = {
            "status": status,
            "updatedAt": datetime.now(timezone.utc)
        }
        
        if status == UserStatus.APPROVED:
            update_data["isVerified"] = True
            update_data["verifiedAt"] = datetime.now(timezone.utc)
        
        updated_user = await UserDB.update(user_id, update_data)
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Send notification
        if status == UserStatus.APPROVED:
            await create_notification({
                "userId": user_id,
                "type": "SYSTEM",
                "priority": "HIGH",
                "title": "Account Approved",
                "message": "Your organizer account has been approved. You can now create and manage events.",
                "data": {
                    "status": "APPROVED",
                    "approvedBy": str(current_user["_id"]),
                },
                "relatedEntityId": user_id,
                "relatedEntityType": "USER"
            })
        else:
            await create_notification({
                "userId": user_id,
                "type": "SYSTEM",
                "priority": "HIGH",
                "title": "Account Rejected",
                "message": f"Your organizer account has been rejected. Reason: {notes or 'Not specified'}",
                "data": {
                    "status": "REJECTED",
                    "rejectedBy": str(current_user["_id"]),
                    "reason": notes
                },
                "relatedEntityId": user_id,
                "relatedEntityType": "USER"
            })
        
        return {
            "success": True,
            "message": f"Organizer {status.lower()} successfully",
            "data": updated_user.to_dict(exclude_password=True)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving organizer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Get organizers waiting for approval (Admin only)
@router.get("/organizers/pending", status_code=status.HTTP_200_OK)
async def get_pending_organizers(
    current_user: dict = Depends(check_admin)
):
    """Get organizers waiting for approval"""
    try:
        users = await UserDB.list_all(
            role=UserRole.ORGANIZER,
            status=UserStatus.PENDING
        )
        
        return {
            "success": True,
            "data": [user.to_dict(exclude_password=True) for user in users]
        }
    except Exception as e:
        print(f"Error getting pending organizers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
