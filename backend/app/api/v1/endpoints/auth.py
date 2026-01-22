from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.base import User, StudentProfile
from app.schemas import user as user_schemas
from app.schemas import token as token_schemas
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=token_schemas.Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    print(f"🔐 登录尝试 - 用户名/手机号/邮箱: {form_data.username}")
    
    # Find user by username, phone, or email
    result = await db.execute(
        select(User).where(
            (User.username == form_data.username)
            | (User.phone == form_data.username)
            | (User.email == form_data.username)
        )
    )
    user = result.scalars().first()
    
    if not user:
        print(f"❌ 用户不存在: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/phone/email or password",
        )
    
    print(f"✅ 找到用户: {user.username}, 手机: {user.phone}, ID: {user.id}, 激活状态: {user.is_active}")
    
    # 检查用户是否激活
    if not user.is_active:
        print(f"❌ 用户未激活: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )
    
    print(f"🔑 数据库密码hash: {user.hashed_password[:50]}...")
    
    password_valid = security.verify_password(form_data.password, user.hashed_password)
    print(f"🔐 密码验证结果: {password_valid}")
    
    if not password_valid:
        print(f"❌ 密码错误")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/phone/email or password",
        )
    
    print(f"✅ 登录成功! 用户角色: {user.role}")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active
        }
    }

@router.post("/register", response_model=user_schemas.User)
async def register_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: user_schemas.UserCreate,
) -> Any:
    # Check if user exists
    result = await db.execute(select(User).where(User.username == user_in.username))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
        
    # Create user
    user = User(
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        email=user_in.email,
        role=user_in.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # If student, create profile
    if user.role == "student":
        profile = StudentProfile(
            user_id=user.id,
            phone=user_in.phone,
            major_id=user_in.major_id,
            id_card=user_in.id_card
        )
        db.add(profile)
        await db.commit()
        
    return user
