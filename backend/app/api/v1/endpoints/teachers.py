from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.base import TeacherProfile, User, Major
from app.core import security
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    从token获取当前用户
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

router = APIRouter()

@router.get("/me")
async def get_current_teacher(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取当前登录教师的信息（包括专业）
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")
    
    # 获取教师档案
    result = await db.execute(
        select(TeacherProfile)
        .options(selectinload(TeacherProfile.major))
        .where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = result.scalars().first()
    
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "major_id": teacher_profile.major_id,
        "major_name": teacher_profile.major.name if teacher_profile.major else None,
        "title": teacher_profile.title,
        "intro": teacher_profile.intro,
    }

