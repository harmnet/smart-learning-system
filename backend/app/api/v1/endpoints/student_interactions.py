from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.base import User, Course
from app.models.interaction import TeacherStudentInteraction
from app.api.v1.endpoints.students import get_current_user

router = APIRouter()

@router.get("/interactions")
async def get_student_interactions(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生的师生互动记录
    包含教师信息、课程信息、消息内容、时间
    """
    try:
        result = await db.execute(
            select(TeacherStudentInteraction)
            .where(TeacherStudentInteraction.student_id == current_user.id)
            .options(
                selectinload(TeacherStudentInteraction.teacher),
                selectinload(TeacherStudentInteraction.course)
            )
            .order_by(desc(TeacherStudentInteraction.created_at))
            .limit(limit)
        )
        
        interactions = result.scalars().all()
        
        interactions_list = []
        for interaction in interactions:
            teacher_name = interaction.teacher.full_name if interaction.teacher else "未知教师"
            teacher_avatar = interaction.teacher.avatar if interaction.teacher else None
            course_name = interaction.course.title if interaction.course else "系统消息"
            
            interactions_list.append({
                "id": interaction.id,
                "teacher_name": teacher_name,
                "teacher_avatar": teacher_avatar,
                "course_name": course_name,
                "message": interaction.message,
                "interaction_type": interaction.interaction_type,
                "created_at": interaction.created_at.isoformat() if interaction.created_at else None,
                "is_read": interaction.is_read
            })
        
        return interactions_list
    
    except Exception as e:
        # 记录错误但返回空列表,避免前端报错
        print(f"[Interactions API] 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


@router.post("/interactions/{interaction_id}/read")
async def mark_interaction_as_read(
    interaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    标记互动消息为已读
    """
    try:
        result = await db.execute(
            select(TeacherStudentInteraction)
            .where(
                and_(
                    TeacherStudentInteraction.id == interaction_id,
                    TeacherStudentInteraction.student_id == current_user.id
                )
            )
        )
        interaction = result.scalars().first()
        
        if not interaction:
            raise HTTPException(status_code=404, detail="互动记录不存在")
        
        interaction.is_read = True
        await db.commit()
        
        return {"message": "已标记为已读"}
    
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"标记已读失败: {str(e)}")

