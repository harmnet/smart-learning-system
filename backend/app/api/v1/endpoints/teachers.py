from typing import Any
import builtins
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.base import TeacherProfile, User, Major, StudentProfile, ClassCourseRelation, Course
from app.models.student_learning import StudentLearningBehavior, StudentExamScore
from app.core import security
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


@router.get("/analytics/overview")
async def get_teacher_analytics_overview(
    time_range: str = Query("month", alias="range"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")

    if time_range not in {"week", "month", "term"}:
        raise HTTPException(status_code=400, detail="Invalid range")

    days = 7 if time_range == "week" else 30 if time_range == "month" else 120
    start_datetime = datetime.utcnow() - timedelta(days=days - 1)
    start_date = start_datetime.date()

    teacher_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_result.scalars().first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    relation_result = await db.execute(
        select(ClassCourseRelation).where(ClassCourseRelation.teacher_id == teacher_profile.id)
    )
    relations = relation_result.scalars().all()
    course_ids = list({relation.course_id for relation in relations if relation.course_id})
    class_ids = list({relation.class_id for relation in relations if relation.class_id})

    if not course_ids:
        return {
            "stats": {
                "total_courses": 0,
                "student_count": 0,
                "avg_completion_rate": 0,
                "warning_students": 0,
                "study_hours": 0
            },
            "learning_trend": [],
            "course_progress": [],
            "score_distribution": [
                {"name": "90-100", "value": 0},
                {"name": "80-89", "value": 0},
                {"name": "70-79", "value": 0},
                {"name": "60-69", "value": 0},
                {"name": "<60", "value": 0}
            ],
            "risk_students": []
        }

    students_result = await db.execute(
        select(StudentProfile, User)
        .join(User, StudentProfile.user_id == User.id)
        .where(
            StudentProfile.class_id.in_(class_ids),
            User.is_active == True,
            User.role == "student"
        )
    )
    student_map = {}
    for profile, user in students_result.all():
        student_map[profile.user_id] = {
            "student_id": profile.user_id,
            "student_no": profile.student_no,
            "student_name": user.full_name or user.username
        }
    student_ids = list(student_map.keys())

    if not student_ids:
        course_progress_result = await db.execute(
            select(Course.id, Course.title)
            .where(Course.id.in_(course_ids))
            .order_by(Course.title)
        )
        course_progress = [
            {
                "course_id": row.id,
                "course_name": row.title,
                "study_minutes": 0,
                "study_count": 0
            }
            for row in course_progress_result
        ]
        all_dates = [(start_date + timedelta(days=i)).isoformat() for i in range(days)]
        learning_trend = [{"date": date, "study_count": 0, "study_duration": 0} for date in all_dates]
        return {
            "stats": {
                "total_courses": len(course_ids),
                "student_count": 0,
                "avg_completion_rate": 0,
                "warning_students": 0,
                "study_hours": 0
            },
            "learning_trend": learning_trend,
            "course_progress": course_progress,
            "score_distribution": [
                {"name": "90-100", "value": 0},
                {"name": "80-89", "value": 0},
                {"name": "70-79", "value": 0},
                {"name": "60-69", "value": 0},
                {"name": "<60", "value": 0}
            ],
            "risk_students": []
        }

    active_students_result = await db.execute(
        select(StudentLearningBehavior.student_id)
        .where(
            StudentLearningBehavior.course_id.in_(course_ids),
            StudentLearningBehavior.created_at >= start_datetime,
            StudentLearningBehavior.student_id.in_(student_ids)
        )
        .distinct()
    )
    active_student_ids = {row[0] for row in active_students_result.fetchall()}

    total_study_seconds = await db.scalar(
        select(func.coalesce(func.sum(StudentLearningBehavior.duration_seconds), 0)).where(
            StudentLearningBehavior.course_id.in_(course_ids),
            StudentLearningBehavior.created_at >= start_datetime,
            StudentLearningBehavior.student_id.in_(student_ids)
        )
    )
    total_study_hours = round((total_study_seconds or 0) / 3600, 1)

    student_count = len(student_ids)
    active_count = len(active_student_ids)
    avg_completion_rate = round((active_count / student_count * 100) if student_count else 0, 2)
    warning_students = max(student_count - active_count, 0)

    learning_trend_result = await db.execute(
        select(
            func.date(StudentLearningBehavior.created_at).label("date"),
            func.count(StudentLearningBehavior.id).label("study_count"),
            func.coalesce(func.sum(StudentLearningBehavior.duration_seconds) / 60, 0).label("study_duration")
        )
        .where(
            StudentLearningBehavior.course_id.in_(course_ids),
            StudentLearningBehavior.created_at >= start_datetime,
            StudentLearningBehavior.student_id.in_(student_ids)
        )
        .group_by(func.date(StudentLearningBehavior.created_at))
        .order_by(func.date(StudentLearningBehavior.created_at))
    )
    learning_data = [
        {
            "date": row.date.isoformat() if row.date else "",
            "study_count": row.study_count,
            "study_duration": int(row.study_duration) if row.study_duration else 0
        }
        for row in learning_trend_result
    ]
    all_dates = [(start_date + timedelta(days=i)).isoformat() for i in builtins.range(int(days))]
    date_map = {item["date"]: item for item in learning_data}
    learning_trend = [
        date_map.get(date, {"date": date, "study_count": 0, "study_duration": 0})
        for date in all_dates
    ]

    course_progress_result = await db.execute(
        select(
            Course.id,
            Course.title,
            func.coalesce(func.sum(StudentLearningBehavior.duration_seconds), 0).label("duration_seconds"),
            func.coalesce(func.count(StudentLearningBehavior.id), 0).label("study_count")
        )
        .outerjoin(
            StudentLearningBehavior,
            and_(
                StudentLearningBehavior.course_id == Course.id,
                StudentLearningBehavior.created_at >= start_datetime,
                StudentLearningBehavior.student_id.in_(student_ids)
            )
        )
        .where(Course.id.in_(course_ids))
        .group_by(Course.id, Course.title)
        .order_by(Course.title)
    )
    course_progress = [
        {
            "course_id": row.id,
            "course_name": row.title,
            "study_minutes": int((row.duration_seconds or 0) / 60),
            "study_count": row.study_count or 0
        }
        for row in course_progress_result
    ]

    score_distribution_result = await db.execute(
        select(
            func.sum(case((StudentExamScore.score / func.nullif(StudentExamScore.total_score, 0) * 100 >= 90, 1), else_=0)).label("score_90"),
            func.sum(case((StudentExamScore.score / func.nullif(StudentExamScore.total_score, 0) * 100 >= 80, 1), else_=0)).label("score_80"),
            func.sum(case((StudentExamScore.score / func.nullif(StudentExamScore.total_score, 0) * 100 >= 70, 1), else_=0)).label("score_70"),
            func.sum(case((StudentExamScore.score / func.nullif(StudentExamScore.total_score, 0) * 100 >= 60, 1), else_=0)).label("score_60"),
            func.sum(case((StudentExamScore.score / func.nullif(StudentExamScore.total_score, 0) * 100 < 60, 1), else_=0)).label("score_lt")
        )
        .where(
            StudentExamScore.course_id.in_(course_ids),
            StudentExamScore.is_submitted == True,
            StudentExamScore.exam_date >= start_datetime,
            StudentExamScore.student_id.in_(student_ids)
        )
    )
    score_row = score_distribution_result.first()
    score_distribution = [
        {"name": "90-100", "value": int(score_row.score_90 or 0) if score_row else 0},
        {"name": "80-89", "value": int(score_row.score_80 or 0) if score_row else 0},
        {"name": "70-79", "value": int(score_row.score_70 or 0) if score_row else 0},
        {"name": "60-69", "value": int(score_row.score_60 or 0) if score_row else 0},
        {"name": "<60", "value": int(score_row.score_lt or 0) if score_row else 0}
    ]

    minutes_result = await db.execute(
        select(
            StudentLearningBehavior.student_id,
            func.coalesce(func.sum(StudentLearningBehavior.duration_seconds) / 60, 0).label("study_minutes")
        )
        .where(
            StudentLearningBehavior.course_id.in_(course_ids),
            StudentLearningBehavior.created_at >= start_datetime,
            StudentLearningBehavior.student_id.in_(student_ids)
        )
        .group_by(StudentLearningBehavior.student_id)
    )
    minutes_map = {row.student_id: float(row.study_minutes or 0) for row in minutes_result}
    max_minutes = max([0] + list(minutes_map.values()))

    risk_candidates = []
    for student_id, student_info in student_map.items():
        minutes = minutes_map.get(student_id, 0)
        if minutes == 0:
            reason = f"近{days}天无学习记录"
        elif minutes < 30:
            reason = "学习时长偏低"
        else:
            reason = "学习活跃度偏低"
        progress = 0 if max_minutes == 0 else min(100, round(minutes / max_minutes * 100))
        risk_candidates.append({
            "student_id": student_id,
            "student_name": student_info["student_name"],
            "student_no": student_info["student_no"],
            "course_name": "综合",
            "reason": reason,
            "progress": progress
        })
    risk_students = sorted(risk_candidates, key=lambda item: item["progress"])[:5]

    return {
        "stats": {
            "total_courses": len(course_ids),
            "student_count": student_count,
            "avg_completion_rate": avg_completion_rate,
            "warning_students": warning_students,
            "study_hours": total_study_hours
        },
        "learning_trend": learning_trend,
        "course_progress": course_progress,
        "score_distribution": score_distribution,
        "risk_students": risk_students
    }
