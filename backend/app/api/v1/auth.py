"""
EventFlow Auth API
Authentication endpoints for user registration, login, logout, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import httpx

from ...core.config import get_settings
from ...core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    get_current_user,
    check_admin,
    check_organizer,
    check_volunteer,
    validate_password,
    get_password_validation_errors,
    generate_otp,
    generate_token,
    get_google_user_info,
)
from ...core.database import db, Collections
from ...models.user import UserModel, UserDB, UserRole, UserStatus, AccountType
from ...models.otp import OTPModel, OTPDB
from ...models.counter import CounterDB
from ...services.email_service import EmailService
from ...services.notification_service import create_notification

router = APIRouter(prefix="/auth", tags=["Authentication"])

settings = get_settings()


# Register endpoint
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    request: Request,
    response: Response
):
    """Register a new user"""
    try:
        data = await request.json()
        
        # Validate required fields
        if not data.get("email"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        if not data.get("password"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required"
            )
        if not data.get("firstName"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="First name is required"
            )
        if not data.get("lastName"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Last name is required"
            )
        if not data.get("role"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is required"
            )
        
        # Check if user already exists
        collection = db.get_collection(Collections.USERS)
        existing_user = await collection.find_one({"email": data["email"]})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Validate password
        if not validate_password(data["password"]):
            errors = get_password_validation_errors(data["password"])
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Password validation failed", "errors": errors}
            )
        
        # Create user data
        user_data = {
            "firstName": data["firstName"],
            "lastName": data["lastName"],
            "email": data["email"],
            "password": get_password_hash(data["password"]),
            "role": data["role"],
            "accountType": AccountType.EMAIL,
            "status": UserStatus.PENDING if data["role"] == UserRole.ORGANIZER else UserStatus.ACTIVE,
            "isVerified": False,
            "isActive": True,
            "profile": {
                "phone": data.get("phone", ""),
            },
            "preferences": {
                "notificationSettings": {"email": True, "push": True, "sms": False},
                "theme": "LIGHT",
            },
        }
        
        # Create user
        user = await UserDB.create(user_data)
        
        # Generate verification token for email verification
        verification_token = generate_token()
        await collection.update_one(
            {"_id": user._id},
            {"$set": {"verificationToken": verification_token}}
        )
        
        # Send verification email (in production)
        # For now, we'll just log it
        print(f"Verification email would be sent to {user.email}")
        
        # Create access token
        token_data = {
            "sub": str(user._id),
            "email": user.email,
            "role": user.role,
        }
        access_token = create_access_token(token_data)
        
        # Prepare user response (without password)
        user_response = user.to_dict(exclude_password=True)
        
        return {
            "success": True,
            "message": "User registered successfully. Please verify your email.",
            "user": user_response,
            "token": access_token,
        }
    
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Login endpoint
@router.post("/login")
async def login_user(
    request: Request,
    response: Response
):
    """Login user with email and password"""
    try:
        data = await request.json()
        
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )
        
        # Find user
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({"email": email})
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        user = UserModel(**user_data)
        
        # Verify password
        if not verify_password(password, user.password or ""):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user.isActive:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Check if organizer is approved
        if user.role == UserRole.ORGANIZER and user.status != UserStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Organizer account is {user.status.lower().replace('_', ' ')}. Please wait for admin approval."
            )
        
        # Create token
        token_data = {
            "sub": str(user._id),
            "email": user.email,
            "role": user.role,
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Update last login
        await collection.update_one(
            {"_id": user._id},
            {"$set": {"lastLoginAt": datetime.now(timezone.utc)}}
        )
        
        # Prepare user response
        user_response = user.to_dict(exclude_password=True)
        
        # Set cookies
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            secure=settings.DEBUG == False,
            samesite="lax"
        )
        
        return {
            "success": True,
            "message": "Login successful",
            "user": user_response,
            "token": access_token,
            "refreshToken": refresh_token,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Logout endpoint
@router.post("/logout")
async def logout_user(
    request: Request,
    response: Response,
    current_user: dict = Depends(get_current_user)
):
    """Logout user"""
    try:
        # Clear cookies
        response.delete_cookie("access_token")
        
        return {
            "success": True,
            "message": "Logout successful"
        }
    except Exception as e:
        print(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Google OAuth endpoint
@router.post("/google")
async def google_login(
    request: Request,
    response: Response
):
    """Login with Google OAuth"""
    try:
        data = await request.json()
        token = data.get("token")
        
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token is required"
            )
        
        # Get Google user info
        google_user = await get_google_user_info(token)
        
        if not google_user.get("email"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google token"
            )
        
        # Find or create user
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({"email": google_user["email"]})
        
        if user_data:
            # User exists, update Google info
            user = UserModel(**user_data)
            
            # Update Google ID if not set
            if not user.googleId:
                await collection.update_one(
                    {"_id": user._id},
                    {"$set": {"googleId": google_user["id"]}}
                )
            
            # Check if user is active
            if not user.isActive:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User account is inactive"
                )
            
            # Check if organizer is approved
            if user.role == UserRole.ORGANIZER and user.status != UserStatus.APPROVED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Organizer account is {user.status.lower().replace('_', ' ')}. Please wait for admin approval."
                )
        else:
            # Create new user from Google
            user_id = await CounterDB.get_next_sequence("user_id")
            
            user_data = {
                "_id": user_id,
                "firstName": google_user.get("given_name", ""),
                "lastName": google_user.get("family_name", ""),
                "email": google_user["email"],
                "googleId": google_user["id"],
                "role": UserRole.VOLUNTEER,  # Default role for Google users
                "accountType": AccountType.GOOGLE,
                "status": UserStatus.ACTIVE,
                "isVerified": True,  # Google users are verified
                "isActive": True,
                "profile": {
                    "phone": "",
                    "profileImage": google_user.get("picture", ""),
                },
                "preferences": {
                    "notificationSettings": {"email": True, "push": True, "sms": False},
                    "theme": "LIGHT",
                },
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc),
            }
            
            result = await collection.insert_one(user_data)
            user_data["_id"] = result.inserted_id
            user = UserModel(**user_data)
        
        # Create token
        token_data = {
            "sub": str(user._id),
            "email": user.email,
            "role": user.role,
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Update last login
        await collection.update_one(
            {"_id": user._id},
            {"$set": {"lastLoginAt": datetime.now(timezone.utc)}}
        )
        
        # Prepare user response
        user_response = user.to_dict(exclude_password=True)
        
        return {
            "success": True,
            "message": "Google login successful",
            "user": user_response,
            "token": access_token,
            "refreshToken": refresh_token,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Refresh token endpoint
@router.post("/refresh")
async def refresh_token(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Refresh access token"""
    try:
        token_data = {
            "sub": str(current_user["_id"]),
            "email": current_user["email"],
            "role": current_user["role"],
        }
        
        new_token = create_access_token(token_data)
        
        return {
            "success": True,
            "token": new_token,
        }
    except Exception as e:
        print(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Forgot password endpoint
@router.post("/forgot-password")
async def forgot_password(
    request: Request
):
    """Request password reset"""
    try:
        data = await request.json()
        email = data.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        
        # Find user
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({"email": email})
        
        if not user_data:
            # Don't reveal that user doesn't exist for security
            return {
                "success": True,
                "message": "If an account exists with this email, a reset link has been sent."
            }
        
        user = UserModel(**user_data)
        
        # Generate reset token
        reset_token = generate_token()
        reset_token_expires = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
        
        # Save reset token
        await collection.update_one(
            {"_id": user._id},
            {"$set": {
                "resetToken": reset_token,
                "resetTokenExpires": reset_token_expires
            }}
        )
        
        # Send reset email (in production)
        # For now, we'll just log it
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
        print(f"Password reset email would be sent to {user.email}")
        print(f"Reset link: {reset_link}")
        
        return {
            "success": True,
            "message": "If an account exists with this email, a reset link has been sent.",
            "resetLink": reset_link,  # Only for development
        }
    
    except Exception as e:
        print(f"Forgot password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Reset password endpoint
@router.post("/reset-password")
async def reset_password(
    request: Request
):
    """Reset password with token"""
    try:
        data = await request.json()
        token = data.get("token")
        password = data.get("password")
        confirm_password = data.get("confirmPassword")
        
        if not token or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token and password are required"
            )
        
        if password != confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Validate password
        if not validate_password(password):
            errors = get_password_validation_errors(password)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Password validation failed", "errors": errors}
            )
        
        # Find user with reset token
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({
            "resetToken": token,
            "resetTokenExpires": {"$gt": datetime.now(timezone.utc)}
        })
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired token"
            )
        
        user = UserModel(**user_data)
        
        # Update password
        hashed_password = get_password_hash(password)
        await collection.update_one(
            {"_id": user._id},
            {"$set": {
                "password": hashed_password,
                "resetToken": None,
                "resetTokenExpires": None,
                "updatedAt": datetime.now(timezone.utc)
            }}
        )
        
        # Create access token
        token_data = {
            "sub": str(user._id),
            "email": user.email,
            "role": user.role,
        }
        access_token = create_access_token(token_data)
        
        # Prepare user response
        user_response = user.to_dict(exclude_password=True)
        user_response["password"] = None
        
        return {
            "success": True,
            "message": "Password reset successful",
            "user": user_response,
            "token": access_token,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# OTP verification endpoint
@router.post("/verify-otp")
async def verify_otp(
    request: Request
):
    """Verify OTP for email verification"""
    try:
        data = await request.json()
        email = data.get("email")
        otp = data.get("otp")
        
        if not email or not otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and OTP are required"
            )
        
        # Find OTP
        collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        otp_data = await collection.find_one({
            "email": email,
            "otp": otp,
            "expiresAt": {"$gt": datetime.now(timezone.utc)},
            "used": False
        })
        
        if not otp_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Mark OTP as used
        await collection.update_one(
            {"_id": otp_data["_id"]},
            {"$set": {"used": True}}
        )
        
        # Verify user email
        users_collection = db.get_collection(Collections.USERS)
        await users_collection.update_one(
            {"email": email},
            {"$set": {
                "isVerified": True,
                "verifiedAt": datetime.now(timezone.utc),
                "verificationToken": None
            }}
        )
        
        return {
            "success": True,
            "message": "Email verified successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"OTP verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Resend OTP endpoint
@router.post("/resend-otp")
async def resend_otp(
    request: Request
):
    """Resend OTP for email verification"""
    try:
        data = await request.json()
        email = data.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required"
            )
        
        # Find user
        collection = db.get_collection(Collections.USERS)
        user_data = await collection.find_one({"email": email})
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User not found"
            )
        
        user = UserModel(**user_data)
        
        if user.isVerified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already verified"
            )
        
        # Generate new OTP
        new_otp = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.OTP_EXPIRE_MINUTES
        )
        
        # Save OTP
        otp_collection = db.get_collection(Collections.OTP_VERIFICATIONS)
        await otp_collection.insert_one({
            "email": email,
            "otp": new_otp,
            "expiresAt": expires_at,
            "used": False,
            "createdAt": datetime.now(timezone.utc)
        })
        
        # Send OTP email (in production)
        # For now, we'll just log it
        print(f"OTP email would be sent to {email}")
        print(f"OTP: {new_otp}")
        
        return {
            "success": True,
            "message": "New OTP sent successfully",
            "otp": new_otp  # Only for development
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Resend OTP error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Protected test endpoint
@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_user)
):
    """Get current user information"""
    return {
        "success": True,
        "user": current_user
    }
