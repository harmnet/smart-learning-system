from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text, func
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.base import User
from app.models.student_learning import StudentLearningBehavior, StudentStudyDuration, StudentExamScore
from jose import jwt
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings

router = APIRouter()

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
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/courses/{course_id}/learning-behaviors")
async def get_learning_behaviors(
    course_id: int,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生在某门课程的学习行为记录
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="只有学生才能访问此资源")

    query = text("""
        SELECT 
            slb.id,
            slb.behavior_type,
            slb.description,
            slb.duration_seconds,
            slb.created_at,
            slb.resource_type,
            slb.resource_id,
            cc.title as chapter_title
        FROM student_learning_behavior slb
        LEFT JOIN course_chapter cc ON slb.chapter_id = cc.id
        WHERE slb.student_id = :student_id AND slb.course_id = :course_id
        ORDER BY slb.created_at DESC
        LIMIT :limit
    """)
    
    result = await db.execute(
        query, 
        {"student_id": current_user.id, "course_id": course_id, "limit": limit}
    )
    rows = result.fetchall()
    
    behaviors = []
    for row in rows:
        behaviors.append({
            "id": row[0],
            "behavior_type": row[1],
            "description": row[2],
            "duration_seconds": row[3],
            "created_at": row[4].isoformat() if row[4] else None,
            "resource_type": row[5],
            "resource_id": row[6],
            "chapter_title": row[7]
        })
    
    return behaviors


@router.get("/courses/{course_id}/study-duration")
async def get_study_duration(
    course_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生在某门课程的学习时长走势（最近N天）
    从 student_learning_behavior 表聚合学习时长
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="只有学生才能访问此资源")

    # 计算起始日期
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days-1)
    
    # 从 student_learning_behavior 表聚合学习时长（秒转为分钟）
    query = text("""
        SELECT 
            DATE(created_at) as date,
            ROUND(SUM(duration_seconds) / 60.0) as total_minutes
        FROM student_learning_behavior
        WHERE student_id = :student_id 
            AND course_id = :course_id
            AND DATE(created_at) >= :start_date
            AND DATE(created_at) <= :end_date
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """)
    
    result = await db.execute(
        query,
        {
            "student_id": current_user.id,
            "course_id": course_id,
            "start_date": start_date,
            "end_date": end_date
        }
    )
    rows = result.fetchall()
    
    # 创建完整的日期序列，填充缺失的日期为0
    duration_data = []
    current_date = start_date
    data_dict = {row[0]: int(row[1]) if row[1] else 0 for row in rows}
    
    while current_date <= end_date:
        duration_data.append({
            "date": current_date.isoformat(),
            "duration_minutes": data_dict.get(current_date, 0)
        })
        current_date += timedelta(days=1)
    
    return duration_data


@router.get("/courses/{course_id}/exam-scores")
async def get_exam_scores(
    course_id: int,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生在某门课程的测评成绩走势（包括传统考试和AI测评）
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="只有学生才能访问此资源")

    # 使用UNION合并传统考试成绩和AI测评成绩
    query = text("""
        SELECT 
            id,
            score,
            total_score,
            exam_date,
            is_submitted,
            exam_title,
            exam_type
        FROM (
            -- 传统考试成绩
            SELECT 
                ses.id,
                ses.score,
                ses.total_score,
                ses.exam_date,
                ses.is_submitted,
                COALESCE(e.exam_name, ep.paper_name, '未命名考试') as exam_title,
                '考试' as exam_type
            FROM student_exam_score ses
            LEFT JOIN exam_paper ep ON ses.exam_paper_id = ep.id
            LEFT JOIN exam e ON ses.exam_id = e.id
            WHERE ses.student_id = :student_id 
                AND ses.course_id = :course_id
                AND ses.is_submitted = TRUE
            
            UNION ALL
            
            -- AI测评成绩
            SELECT 
                aqr.id,
                aqr.score,
                aqr.total_score,
                aqr.submitted_at as exam_date,
                aqr.is_submitted,
                CONCAT('AI测评 - ', tr.resource_name) as exam_title,
                'AI测评' as exam_type
            FROM ai_quiz_record aqr
            JOIN teaching_resource tr ON aqr.resource_id = tr.id
            JOIN course_section_resource csr ON tr.id = csr.resource_id AND csr.resource_type = 'teaching_resource'
            JOIN course_chapter cc ON csr.chapter_id = cc.id
            WHERE aqr.student_id = :student_id 
                AND cc.course_id = :course_id
                AND aqr.is_submitted = TRUE
        ) combined_scores
        ORDER BY exam_date DESC
        LIMIT :limit
    """)
    
    result = await db.execute(
        query,
        {"student_id": current_user.id, "course_id": course_id, "limit": limit}
    )
    rows = result.fetchall()
    
    scores = []
    for row in rows:
        score_val = float(row[1]) if row[1] is not None else 0
        total_val = float(row[2]) if row[2] else 100
        scores.append({
            "id": row[0],
            "score": score_val,
            "total_score": total_val,
            "percentage": round((score_val / total_val * 100) if total_val > 0 else 0, 2),
            "exam_date": row[3].isoformat() if row[3] else None,
            "is_submitted": row[4],
            "exam_paper_title": row[5],
            "exam_name": row[5],  # 统一使用exam_title
            "exam_type": row[6]  # 新增：考试类型
        })
    
    return scores


@router.post("/courses/{course_id}/record-behavior")
async def record_learning_behavior(
    course_id: int,
    behavior_data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    记录学生学习行为
    """
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="只有学生才能访问此资源")

    # 创建学习行为记录
    behavior = StudentLearningBehavior(
        student_id=current_user.id,
        course_id=course_id,
        chapter_id=behavior_data.get("chapter_id"),
        resource_id=behavior_data.get("resource_id"),
        resource_type=behavior_data.get("resource_type"),
        behavior_type=behavior_data.get("behavior_type", "view_resource"),
        duration_seconds=behavior_data.get("duration_seconds", 0),
        description=behavior_data.get("description")
    )
    db.add(behavior)
    
    # 更新当天的学习时长统计
    today = datetime.now().date()
    duration_minutes = behavior_data.get("duration_seconds", 0) // 60
    
    if duration_minutes > 0:
        # 查找今天的记录
        query = text("""
            SELECT id, duration_minutes
            FROM student_study_duration
            WHERE student_id = :student_id 
                AND course_id = :course_id
                AND DATE(study_date) = :today
        """)
        result = await db.execute(
            query,
            {"student_id": current_user.id, "course_id": course_id, "today": today}
        )
        existing = result.fetchone()
        
        if existing:
            # 更新现有记录
            update_query = text("""
                UPDATE student_study_duration
                SET duration_minutes = duration_minutes + :duration_minutes,
                    updated_at = :now
                WHERE id = :id
            """)
            await db.execute(
                update_query,
                {
                    "duration_minutes": duration_minutes,
                    "now": datetime.utcnow(),
                    "id": existing[0]
                }
            )
        else:
            # 创建新记录
            duration_record = StudentStudyDuration(
                student_id=current_user.id,
                course_id=course_id,
                study_date=datetime.now(),
                duration_minutes=duration_minutes
            )
            db.add(duration_record)
    
    await db.commit()
    
    return {"message": "学习行为记录成功", "behavior_id": behavior.id}

