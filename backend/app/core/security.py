"""
EventFlow Security Utilities
Authentication, hashing, and JWT token management
"""

from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import re

from .config import get_settings


# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Security
security = HTTPBearer()


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token"""
    settings = get_settings()
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT refresh token"""
    settings = get_settings()
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token"""
    settings = get_settings()
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and return token payload"""
    payload = decode_token(token)
    
    # Check if token is expired
    if datetime.fromtimestamp(payload["exp"], tz=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    # Check if user exists in database
    from ..models.user import get_user_by_id
    user = await get_user_by_id(payload.get("sub"))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("isActive", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    return user


async def get_current_user_role(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """Get current user's role"""
    return current_user.get("role", "VOLUNTEER")


async def get_current_user_id(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> str:
    """Get current user's ID"""
    return str(current_user.get("_id"))


# Role-based access control
def has_role(required_roles: list, user_role: str) -> bool:
    """Check if user has required role"""
    return user_role in required_roles


async def check_role(
    required_roles: list,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> bool:
    """Check if current user has required role"""
    user_role = current_user.get("role", "VOLUNTEER")
    if user_role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Require one of roles: {', '.join(required_roles)}",
        )
    return True


async def check_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> bool:
    """Check if current user is admin"""
    return await check_role(["ADMIN"], current_user)


async def check_organizer(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> bool:
    """Check if current user is organizer"""
    return await check_role(["ADMIN", "ORGANIZER"], current_user)


async def check_volunteer(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> bool:
    """Check if current user is volunteer"""
    return await check_role(["ADMIN", "ORGANIZER", "VOLUNTEER"], current_user)


# Password validation
def validate_password(password: str) -> bool:
    """Validate password against policy"""
    settings = get_settings()
    
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False
    if len(password) > settings.PASSWORD_MAX_LENGTH:
        return False
    
    if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
        return False
    if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
        return False
    if settings.PASSWORD_REQUIRE_NUMBER and not re.search(r'\d', password):
        return False
    if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    
    return True


def get_password_validation_errors(password: str) -> list:
    """Get list of password validation errors"""
    settings = get_settings()
    errors = []
    
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters")
    if len(password) > settings.PASSWORD_MAX_LENGTH:
        errors.append(f"Password must be at most {settings.PASSWORD_MAX_LENGTH} characters")
    
    if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    if settings.PASSWORD_REQUIRE_NUMBER and not re.search(r'\d', password):
        errors.append("Password must contain at least one number")
    if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    return errors


# OTP utilities
import random
import string


def generate_otp(length: int = 6) -> str:
    """Generate a random OTP code"""
    return ''.join(random.choices(string.digits, k=length))


def generate_token(length: int = 32) -> str:
    """Generate a random token"""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))


# Google OAuth utilities
import httpx


async def get_google_user_info(access_token: str) -> Dict[str, Any]:
    """Get Google user info from access token"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error fetching Google user info: {str(e)}",
        )
