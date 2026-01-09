from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.base import User, StudentProfile, Course, Class, ClassCourseRelation, TeacherProfile
from app.models.student_learning import StudentLearningBehavior
from app.api.v1.endpoints.students import get_current_user

router = APIRouter()

@router.get("/dashboard")
async def get_student_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生首页Dashboard数据
    包括：我的课程（智能排序）、推荐课程、新上架课程、统计数据
    """
    try:
        print(f"[Dashboard] 获取用户 {current_user.id} 的Dashboard数据")
        
        # 获取学生档案
        student_profile_result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        )
        student_profile = student_profile_result.scalars().first()
        
        print(f"[Dashboard] 学生档案: {student_profile}")
        
        if not student_profile or not student_profile.class_id:
            print(f"[Dashboard] 学生没有档案或班级，返回基础数据")
            # 即使没有班级，也返回新上架课程
            new_courses_result = await db.execute(
                select(Course)
                .where(Course.is_deleted == False)
                .order_by(desc(Course.created_at))
                .limit(6)
            )
            new_courses_list = new_courses_result.scalars().all()
            
            new_courses = [
                {
                    "id": course.id,
                    "title": course.title,
                    "introduction": course.introduction,
                    "cover_image": course.cover_image,
                    "cover_id": None,  # 课程表没有cover_id字段
                    "created_at": None  # 课程表没有created_at字段
                }
                for course in new_courses_list
            ]
            
            return {
                "my_courses": [],
                "recommended_courses": [],
                "new_courses": new_courses,
                "stats": {
                    "total_courses": 0,
                    "completed_courses": 0,
                    "in_progress_courses": 0
                }
            }
        
        # 1. 获取学生的课程列表（通过班级关联）
        print(f"[Dashboard] 学生班级ID: {student_profile.class_id}")
        
        class_course_result = await db.execute(
            select(ClassCourseRelation).where(ClassCourseRelation.class_id == student_profile.class_id)
        )
        class_courses = class_course_result.scalars().all()
        course_ids = [cc.course_id for cc in class_courses]
        
        print(f"[Dashboard] 班级关联的课程数量: {len(course_ids)}, 课程IDs: {course_ids}")
        
        my_courses = []
        if course_ids:
            # 获取每个课程的详细信息、最后学习时间、学习统计
            last_learning_query = text("""
                SELECT 
                    c.id,
                    c.title,
                    c.code,
                    c.introduction,
                    c.cover_image,
                    cc.filename as cover_filename,
                    c.credits,
                    c.course_type,
                    c.is_public,
                    c.major_id,
                    m.name as major_name,
                    u.full_name as teacher_name,
                    MAX(lb.created_at) as last_learning_time,
                    COALESCE(SUM(lb.duration_seconds) / 60.0, 0) as study_minutes,
                    COUNT(lb.id) as study_count
                FROM course c
                LEFT JOIN student_learning_behavior lb ON c.id = lb.course_id AND lb.student_id = :student_id
                LEFT JOIN sys_user u ON c.main_teacher_id = u.id
                LEFT JOIN course_cover cc ON c.id = cc.course_id
                LEFT JOIN major m ON c.major_id = m.id
                WHERE c.id = ANY(:course_ids)
                AND c.is_deleted = FALSE
                GROUP BY c.id, c.title, c.code, c.introduction, c.cover_image, cc.filename, c.credits, 
                         c.course_type, c.is_public, c.major_id, m.name, u.full_name
                ORDER BY MAX(lb.created_at) DESC NULLS LAST, c.id DESC
            """)
            
            result = await db.execute(
                last_learning_query,
                {
                    "student_id": current_user.id,
                    "course_ids": course_ids
                }
            )
            
            my_courses = [
                {
                    "id": row.id,
                    "title": row.title,
                    "code": row.code,
                    "introduction": row.introduction,
                    "cover_image": row.cover_filename if row.cover_filename else row.cover_image,
                    "cover_id": None,
                    "credits": row.credits,
                    "course_type": row.course_type,
                    "is_public": row.is_public,
                    "major_name": row.major_name,
                    "teacher_name": row.teacher_name,
                    "last_learning_time": row.last_learning_time.isoformat() if row.last_learning_time else None,
                    "study_minutes": float(row.study_minutes) if row.study_minutes else 0,
                    "study_count": row.study_count if row.study_count else 0
                }
                for row in result
            ]
            print(f"[Dashboard] 我的课程数据: {my_courses}")
        
        # 2. 推荐课程（按学习人数排序，排除学生已有的课程）
        if course_ids:
            # 如果有课程，排除已有的课程
            popular_courses_query = text("""
                SELECT 
                    c.id,
                    c.title,
                    c.code,
                    c.introduction,
                    c.cover_image,
                    cc.filename as cover_filename,
                    c.credits,
                    c.course_type,
                    c.is_public,
                    m.name as major_name,
                    u.full_name as teacher_name,
                    COUNT(DISTINCT lb.student_id) as learner_count
                FROM course c
                LEFT JOIN student_learning_behavior lb ON c.id = lb.course_id
                LEFT JOIN sys_user u ON c.main_teacher_id = u.id
                LEFT JOIN course_cover cc ON c.id = cc.course_id
                LEFT JOIN major m ON c.major_id = m.id
                WHERE c.id != ALL(:exclude_course_ids)
                AND c.is_deleted = FALSE
                GROUP BY c.id, c.title, c.code, c.introduction, c.cover_image, cc.filename, c.credits, 
                         c.course_type, c.is_public, m.name, u.full_name
                ORDER BY learner_count DESC
                LIMIT 6
            """)
            
            recommended_result = await db.execute(
                popular_courses_query,
                {"exclude_course_ids": course_ids}
            )
        else:
            # 如果没有课程，显示所有热门课程
            popular_courses_query = text("""
                SELECT 
                    c.id,
                    c.title,
                    c.code,
                    c.introduction,
                    c.cover_image,
                    cc.filename as cover_filename,
                    c.credits,
                    c.course_type,
                    c.is_public,
                    m.name as major_name,
                    u.full_name as teacher_name,
                    COUNT(DISTINCT lb.student_id) as learner_count
                FROM course c
                LEFT JOIN student_learning_behavior lb ON c.id = lb.course_id
                LEFT JOIN sys_user u ON c.main_teacher_id = u.id
                LEFT JOIN course_cover cc ON c.id = cc.course_id
                LEFT JOIN major m ON c.major_id = m.id
                WHERE c.is_deleted = FALSE
                GROUP BY c.id, c.title, c.code, c.introduction, c.cover_image, cc.filename, c.credits,
                         c.course_type, c.is_public, m.name, u.full_name
                ORDER BY learner_count DESC
                LIMIT 6
            """)
            
            recommended_result = await db.execute(popular_courses_query)
        
        recommended_courses = [
            {
                "id": row.id,
                "title": row.title,
                "code": row.code,
                "introduction": row.introduction,
                "cover_image": row.cover_filename if row.cover_filename else row.cover_image,
                "cover_id": None,
                "credits": row.credits,
                "course_type": row.course_type,
                "is_public": row.is_public,
                "major_name": row.major_name,
                "teacher_name": row.teacher_name,
                "learner_count": row.learner_count
            }
            for row in recommended_result
        ]
        
        # 3. 新上架课程（按ID倒序-最新创建的课程ID最大）
        new_courses_query = text("""
            SELECT 
                c.id,
                c.title,
                c.code,
                c.introduction,
                c.cover_image,
                cc.filename as cover_filename,
                c.credits,
                c.course_type,
                c.is_public,
                m.name as major_name,
                u.full_name as teacher_name
            FROM course c
            LEFT JOIN sys_user u ON c.main_teacher_id = u.id
            LEFT JOIN course_cover cc ON c.id = cc.course_id
            LEFT JOIN major m ON c.major_id = m.id
            WHERE c.is_deleted = FALSE
            ORDER BY c.id DESC
            LIMIT 6
        """)
        
        new_courses_result = await db.execute(new_courses_query)
        
        new_courses = [
            {
                "id": row.id,
                "title": row.title,
                "code": row.code,
                "introduction": row.introduction,
                "cover_image": row.cover_filename if row.cover_filename else row.cover_image,
                "cover_id": None,
                "credits": row.credits,
                "course_type": row.course_type,
                "is_public": row.is_public,
                "major_name": row.major_name,
                "teacher_name": row.teacher_name,
                "created_at": None
            }
            for row in new_courses_result
        ]
        
        # 4. 获取班级信息
        class_info = None
        if student_profile.class_id:
            class_result = await db.execute(
                select(Class).where(Class.id == student_profile.class_id)
            )
            class_obj = class_result.scalars().first()
            if class_obj:
                class_info = {
                    "class_id": class_obj.id,
                    "class_name": class_obj.name
                }
        
        # 5. 统计数据（简化版本）
        stats = {
            "total_courses": len(my_courses),
            "completed_courses": 0,  # 需要根据实际进度计算
            "in_progress_courses": len(my_courses)
        }
        
        print(f"[Dashboard] 最终数据: 我的课程={len(my_courses)}, 推荐课程={len(recommended_courses)}, 新课程={len(new_courses)}")
        
        return {
            "my_courses": my_courses,
            "recommended_courses": recommended_courses,
            "new_courses": new_courses,
            "stats": stats,
            "class_info": class_info
        }
    
    except Exception as e:
        print(f"[Dashboard] 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取Dashboard数据失败: {str(e)}")


@router.get("/learning-curve")
async def get_learning_curve(
    days: int = 7,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生的学习曲线数据
    从learning_behavior表统计最近N天的学习次数和时长
    """
    try:
        start_date = datetime.utcnow().date() - timedelta(days=days-1)
        
        learning_curve_query = text("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as study_count,
                COALESCE(SUM(duration_seconds) / 60, 0) as study_duration
            FROM student_learning_behavior
            WHERE student_id = :student_id
            AND DATE(created_at) >= :start_date
            GROUP BY DATE(created_at)
            ORDER BY date
        """)
        
        result = await db.execute(
            learning_curve_query,
            {"student_id": current_user.id, "start_date": start_date}
        )
        
        learning_data = [
            {
                "date": row.date.isoformat() if row.date else "",
                "study_count": row.study_count,
                "study_duration": int(row.study_duration) if row.study_duration else 0
            }
            for row in result
        ]
        
        # 填充缺失的日期（确保返回完整的7天数据）
        all_dates = [(start_date + timedelta(days=i)).isoformat() for i in range(days)]
        date_map = {item["date"]: item for item in learning_data}
        
        complete_data = [
            date_map.get(date, {"date": date, "study_count": 0, "study_duration": 0})
            for date in all_dates
        ]
        
        return complete_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取学习曲线失败: {str(e)}")

