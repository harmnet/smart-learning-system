from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt
import hashlib
from app.core.config import settings

ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Use SHA256 for simplicity
    password_hash = hashlib.sha256((plain_password + settings.SECRET_KEY).encode()).hexdigest()
    return password_hash == hashed_password

def get_password_hash(password: str) -> str:
    # Use SHA256 for simplicity
    return hashlib.sha256((password + settings.SECRET_KEY).encode()).hexdigest()

