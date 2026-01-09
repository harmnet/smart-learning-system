from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.base import User, TeacherProfile, StudentProfile, Major, Class, Course
from app.models.exam import Exam

router = APIRouter()

@router.get("/statistics")
async def get_dashboard_statistics(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取管理员Dashboard统计数据
    包括：基础统计、趋势数据、系统健康状态
    """
    try:
        # 1. 基础统计：各模块总数
        # 教师数量（通过User表的is_active过滤）
        teachers_count = await db.scalar(
            select(func.count(TeacherProfile.id))
            .join(User, TeacherProfile.user_id == User.id)
            .where(User.is_active == True)
        )
        
        # 学生数量（通过User表的is_active过滤）
        students_count = await db.scalar(
            select(func.count(StudentProfile.id))
            .join(User, StudentProfile.user_id == User.id)
            .where(User.is_active == True)
        )
        
        # 专业、班级、课程、考试数量
        majors_count = await db.scalar(select(func.count(Major.id)).where(Major.is_active == True))
        classes_count = await db.scalar(select(func.count(Class.id)).where(Class.is_active == True))
        courses_count = await db.scalar(select(func.count(Course.id)).where(Course.is_deleted == False))
        exams_count = await db.scalar(select(func.count(Exam.id)).where(Exam.is_active == True))
        
        # 2. 活跃用户统计
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        
        # 今日活跃用户（这里简化为今日创建的用户，实际应该记录登录日志）
        active_today_result = await db.execute(
            select(func.count(User.id)).where(
                and_(
                    func.date(User.created_at) == today,
                    User.is_active == True
                )
            )
        )
        active_users_today = active_today_result.scalar() or 0
        
        # 本周活跃用户
        active_week_result = await db.execute(
            select(func.count(User.id)).where(
                and_(
                    func.date(User.created_at) >= week_ago,
                    User.is_active == True
                )
            )
        )
        active_users_week = active_week_result.scalar() or 0
        
        # 3. 近30天新增用户趋势
        thirty_days_ago = today - timedelta(days=30)
        new_users_trend_query = text("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM sys_user
            WHERE DATE(created_at) >= :start_date
            AND is_active = true
            GROUP BY DATE(created_at)
            ORDER BY date
        """)
        
        new_users_result = await db.execute(
            new_users_trend_query,
            {"start_date": thirty_days_ago}
        )
        new_users_trend = [
            {"date": row.date.isoformat() if row.date else "", "count": row.count}
            for row in new_users_result
        ]
        
        # 4. 近30天用户活跃度趋势（使用创建时间作为活跃度的简化指标）
        user_activity_trend = new_users_trend  # 简化版本，实际应该查询登录日志
        
        # 5. 系统健康状态
        # 数据库状态检查
        try:
            await db.execute(text("SELECT 1"))
            database_status = "healthy"
        except Exception:
            database_status = "error"
        
        # API状态（如果能执行到这里说明API是正常的）
        api_status = "healthy"
        
        # 存储使用率 - 返回None表示暂不支持，前端会隐藏此项
        storage_usage = None  # 需要实现真实的文件系统检查
        
        return {
            "teachers_count": teachers_count or 0,
            "students_count": students_count or 0,
            "majors_count": majors_count or 0,
            "classes_count": classes_count or 0,
            "courses_count": courses_count or 0,
            "exams_count": exams_count or 0,
            "active_users_today": active_users_today,
            "active_users_week": active_users_week,
            "new_users_trend": new_users_trend,
            "user_activity_trend": user_activity_trend,
            "system_health": {
                "database_status": database_status,
                "api_status": api_status,
                "storage_usage": storage_usage
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计数据失败: {str(e)}")

