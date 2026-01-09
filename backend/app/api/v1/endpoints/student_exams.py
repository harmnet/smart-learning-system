from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, text
from sqlalchemy.orm import selectinload
from datetime import datetime
from app.db.session import get_db
from app.models.base import User, StudentProfile, Course, ClassCourseRelation
from app.models.exam import Exam, ExamStudent
from app.models.course_outline import CourseChapterExam, CourseSectionResource
from app.api.v1.endpoints.students import get_current_user

router = APIRouter()

@router.get("/exams")
async def get_student_exams(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生的考试列表
    包括：直接分配的考试(exam_student) + 课程章节关联的考试
    
    数据结构: Course -> CourseChapter -> CourseChapterExam -> Exam
    正确的业务逻辑：章节直接关联考试，而非通过试卷中转
    """
    try:
        print(f"\n[Exams API] 获取学生 {current_user.id} 的考试列表")
        
        student_profile_result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        )
        student_profile = student_profile_result.scalars().first()
        
        if not student_profile:
            print("[Exams API] 未找到学生档案")
            return []
        
        print(f"[Exams API] 学生班级ID: {student_profile.class_id}")
        
        exams_list = []
        now = datetime.now()  # 使用本地时间而非UTC时间
        
        # 1. 获取直接分配给学生的考试（exam_student表）
        exam_student_result = await db.execute(
            select(ExamStudent, Exam)
            .join(Exam, ExamStudent.exam_id == Exam.id)
            .where(ExamStudent.student_id == current_user.id)
        )
        
        for exam_student, exam in exam_student_result:
            status = get_exam_status(exam.start_time, exam.end_time, now)
            duration_minutes = int((exam.end_time - exam.start_time).total_seconds() / 60) if exam.end_time and exam.start_time else 120
            
            exams_list.append({
                "id": exam.id,
                "exam_name": exam.exam_name,
                "course_name": None,
                "course_id": None,
                "chapter_name": None,
                "section_name": None,
                "start_time": exam.start_time.isoformat() if exam.start_time else None,
                "end_time": exam.end_time.isoformat() if exam.end_time else None,
                "duration": duration_minutes,
                "status": status,
                "source": "direct"
            })
        
        print(f"[Exams API] 直接分配的考试: {len(exams_list)}")
        
        # 2. 获取学生班级的课程
        class_course_result = await db.execute(
            select(ClassCourseRelation).where(ClassCourseRelation.class_id == student_profile.class_id)
        )
        class_courses = class_course_result.scalars().all()
        course_ids = [cc.course_id for cc in class_courses]
        
        print(f"[Exams API] 班级课程IDs: {course_ids}")
        
        if course_ids:
            # 3. 通过课程章节直接关联查找考试
            # 数据流: course -> course_chapter -> course_chapter_exam -> exam
            course_exams_query = text("""
                SELECT DISTINCT
                    e.id,
                    e.exam_name,
                    e.start_time,
                    e.end_time,
                    c.id as course_id,
                    c.title as course_name,
                    cc.title as chapter_name
                FROM exam e
                INNER JOIN course_chapter_exam cce ON e.id = cce.exam_id
                INNER JOIN course_chapter cc ON cce.chapter_id = cc.id
                INNER JOIN course c ON cc.course_id = c.id
                WHERE c.id = ANY(:course_ids)
                AND e.is_active = TRUE
                ORDER BY e.start_time DESC NULLS LAST
            """)
            
            course_exams_result = await db.execute(
                course_exams_query,
                {"course_ids": course_ids}
            )
            
            # 检查是否已经添加（避免重复）
            existing_exam_ids = {exam["id"] for exam in exams_list}
            
            for row in course_exams_result:
                if row.id not in existing_exam_ids:
                    status = get_exam_status(row.start_time, row.end_time, now)
                    duration_minutes = int((row.end_time - row.start_time).total_seconds() / 60) if row.end_time and row.start_time else 120
                    
                    exams_list.append({
                        "id": row.id,
                        "exam_name": row.exam_name,
                        "course_name": row.course_name,
                        "course_id": row.course_id,
                        "chapter_name": row.chapter_name,
                        "section_name": None,
                        "start_time": row.start_time.isoformat() if row.start_time else None,
                        "end_time": row.end_time.isoformat() if row.end_time else None,
                        "duration": duration_minutes,
                        "status": status,
                        "source": "course"
                    })
            
            print(f"[Exams API] 课程关联的考试: {len(exams_list) - len(existing_exam_ids)}")
        
        # 按开始时间倒序排序
        exams_list.sort(key=lambda x: x["start_time"] or "", reverse=True)
        
        print(f"[Exams API] 总计考试: {len(exams_list)}")
        return exams_list
    
    except Exception as e:
        # 记录错误但返回空列表,避免前端报错
        print(f"[Exams API] 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return []


def get_exam_status(start_time: datetime, end_time: datetime, now: datetime) -> str:
    """
    判断考试状态
    """
    if now < start_time:
        return "not_started"
    elif start_time <= now <= end_time:
        return "in_progress"
    else:
        return "expired"

