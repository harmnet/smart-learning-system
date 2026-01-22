from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import text

from app.db.session import get_db
from app.core.config import settings
from app.models.base import Course, ClassCourseRelation, StudentProfile, User, CourseCover, Class, TeacherProfile
from app.models.course_outline import CourseSectionHomework, HomeworkAttachment
from app.models.student_learning import StudentHomeworkSubmission, StudentHomeworkAttachment
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """获取当前登录用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = int(payload.get("sub"))
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/profile")
async def get_student_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取当前学生的个人信息
    """
    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="学生信息不存在")
    
    # 获取班级信息
    class_result = await db.execute(
        select(Class).where(Class.id == profile.class_id)
    )
    class_info = class_result.scalars().first()
    
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "class_id": profile.class_id,
        "class_name": class_info.name if class_info else None,
        "student_no": profile.student_no,
        "major_id": profile.major_id
    }

@router.get("/courses")
async def get_student_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生的课程列表（基于班级关联）
    """
    # 获取学生的班级ID
    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    )
    student_profile = result.scalars().first()
    
    if not student_profile:
        return []
    
    # 获取班级关联的课程
    class_course_result = await db.execute(
        select(ClassCourseRelation).where(ClassCourseRelation.class_id == student_profile.class_id)
    )
    class_courses = class_course_result.scalars().all()
    
    if not class_courses:
        return []
    
    course_ids = [cc.course_id for cc in class_courses]
    
    # 获取课程详情
    query = select(Course).options(
        selectinload(Course.covers),
        selectinload(Course.class_relations).selectinload(ClassCourseRelation.teacher).selectinload(TeacherProfile.user),
        selectinload(Course.main_teacher)
    ).where(Course.id.in_(course_ids))
    
    courses_result = await db.execute(query)
    courses = courses_result.scalars().all()
    
    course_list = []
    for course in courses:
        # 获取封面信息
        cover_image = None
        cover_id = None
        if course.covers:
            cover = course.covers[0]
            cover_image = cover.filename  # CourseCover使用filename字段
            cover_id = cover.id
        
        # 获取教师信息
        teachers = []
        for relation in course.class_relations:
            if relation.teacher and relation.teacher.user:
                teachers.append({
                    "id": relation.teacher.id,
                    "name": relation.teacher.user.full_name or relation.teacher.user.username,
                    "username": relation.teacher.user.username
                })
        
        course_list.append({
            "id": course.id,
            "name": course.title,
            "title": course.title,
            "code": course.code,
            "description": course.description,
            "cover_image": cover_image,
            "cover_id": cover_id,
            "teachers": teachers,
            "course_type": course.course_type,
            "hours": course.hours,
            "credits": course.credits,
            "introduction": course.introduction,
            "objectives": course.objectives,
            "main_teacher_name": course.main_teacher.full_name if course.main_teacher else None
        })
    
    return course_list

@router.get("/courses/{course_id}/outline")
async def get_course_outline(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取学生可访问的课程大纲
    """
    # 验证学生是否有权限访问该课程
    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    )
    student_profile = result.scalars().first()
    
    if not student_profile:
        raise HTTPException(status_code=403, detail="学生信息不存在")
    
    # 检查课程是否关联到学生的班级
    class_course_result = await db.execute(
        select(ClassCourseRelation).where(
            ClassCourseRelation.class_id == student_profile.class_id,
            ClassCourseRelation.course_id == course_id
        )
    )
    class_course = class_course_result.scalars().first()
    
    if not class_course:
        raise HTTPException(status_code=403, detail="您没有权限访问此课程")
    
    # 获取课程大纲（使用原始SQL避免ORM问题）
    query = text("""
        SELECT id, course_id, title, sort_order, parent_id
        FROM course_chapter
        WHERE course_id = :course_id AND parent_id IS NULL
        ORDER BY sort_order
    """)
    
    chapters_result = await db.execute(query, {"course_id": course_id})
    chapters = chapters_result.fetchall()
    
    outline = []
    for chapter_row in chapters:
        chapter_id = chapter_row[0]
        
        # 获取章节下的小节
        sections_query = text("""
            SELECT id, course_id, title, sort_order, parent_id
            FROM course_chapter
            WHERE parent_id = :chapter_id
            ORDER BY sort_order
        """)
        sections_result = await db.execute(sections_query, {"chapter_id": chapter_id})
        sections = sections_result.fetchall()
        
        sections_data = []
        for section_row in sections:
            section_id = section_row[0]
            
            # 获取小节的资源
            resources_query = text("""
                SELECT resource_type, resource_id
                FROM course_section_resource
                WHERE chapter_id = :section_id
            """)
            resources_result = await db.execute(resources_query, {"section_id": section_id})
            resources_rows = resources_result.fetchall()
            
            resources_data = []
            for resource_row in resources_rows:
                resource_type = resource_row[0]
                resource_id = resource_row[1]
                
                # 获取资源详情
                resource_info = None
                if resource_type == 'teaching_resource' or resource_type == 'teaching':
                    res_query = text("""
                        SELECT id, teacher_id, resource_name, original_filename, resource_type, file_size, file_path
                        FROM teaching_resource
                        WHERE id = :resource_id AND is_active = true
                    """)
                    res_result = await db.execute(res_query, {"resource_id": resource_id})
                    res_row = res_result.fetchone()
                    if res_row:
                        # 构建下载URL
                        file_url = f"/api/v1/teacher/resources/{res_row[0]}/download"
                        resource_info = {
                            "id": res_row[0],
                            "teacher_id": res_row[1],  # 添加teacher_id，供ResourcePreviewModal使用
                            "type": "teaching_resource",
                            "resource_type": res_row[4] or "teaching_resource",  # 使用数据库中的resource_type
                            "name": res_row[2],  # resource_name -> name
                            "resource_name": res_row[2],  # 保留resource_name字段
                            "original_filename": res_row[3],  # 添加original_filename
                            "file_type": res_row[4] or "unknown",  # resource_type作为file_type
                            "file_url": file_url,
                            "file_size": res_row[5]
                        }
                elif resource_type == 'reference_material' or resource_type == 'reference':
                    res_query = text("""
                        SELECT id, teacher_id, material_name, original_filename, resource_type, file_size, file_path
                        FROM reference_material
                        WHERE id = :resource_id AND is_active = true
                    """)
                    res_result = await db.execute(res_query, {"resource_id": resource_id})
                    res_row = res_result.fetchone()
                    if res_row:
                        # 构建下载URL
                        file_url = f"/api/v1/teacher/references/{res_row[0]}/download"
                        resource_info = {
                            "id": res_row[0],
                            "teacher_id": res_row[1],  # 添加teacher_id，供ResourcePreviewModal使用
                            "type": "reference_material",
                            "resource_type": res_row[4] or "reference_material",  # 使用数据库中的resource_type
                            "name": res_row[2],  # material_name -> name
                            "material_name": res_row[2],  # 保留material_name字段
                            "original_filename": res_row[3],  # 添加original_filename
                            "file_type": res_row[4] or "unknown",  # resource_type作为file_type
                            "file_url": file_url,
                            "file_size": res_row[5]
                        }
                
                if resource_info:
                    resources_data.append(resource_info)
            
            # 获取小节的作业及学生提交状态
            homework_query = text("""
                SELECT hw.id, hw.title, hw.description, hw.deadline, hw.sort_order,
                       sub.id as submission_id, sub.status, sub.score, sub.submitted_at
                FROM course_section_homework hw
                LEFT JOIN student_homework_submission sub 
                    ON sub.homework_id = hw.id AND sub.student_id = :student_id
                WHERE hw.chapter_id = :section_id
                ORDER BY hw.sort_order
            """)
            homework_result = await db.execute(homework_query, {
                "section_id": section_id,
                "student_id": current_user.id
            })
            homework_rows = homework_result.fetchall()
            
            homework_data = []
            for hw_row in homework_rows:
                homework_data.append({
                    "id": hw_row[0],
                    "title": hw_row[1],
                    "description": hw_row[2],
                    "deadline": hw_row[3].isoformat() if hw_row[3] else None,
                    "sort_order": hw_row[4],
                    "submission_status": hw_row[6] or "not_started",  # draft, submitted, graded, not_started
                    "score": hw_row[7],
                    "submitted_at": hw_row[8].isoformat() if hw_row[8] else None,
                    "has_submission": hw_row[5] is not None
                })
            
            sections_data.append({
                "id": section_row[0],
                "title": section_row[2],
                "sort_order": section_row[3],
                "resources": resources_data,
                "exam_papers": [],
                "homework": homework_data
            })
        
        outline.append({
            "id": chapter_row[0],
            "title": chapter_row[2],
            "sort_order": chapter_row[3],
            "sections": sections_data,
            "exam_papers": []
        })
    
    return outline


# ==================== 作业相关API ====================

class HomeworkSubmissionCreate(BaseModel):
    """作业提交数据模型"""
    content: str | None = None
    is_final: bool = False  # 是否最终提交


class AttachmentInfo(BaseModel):
    """附件信息"""
    file_name: str
    file_url: str
    file_size: int | None = None
    file_type: str | None = None


@router.get("/homeworks/{homework_id}")
async def get_homework_detail(
    homework_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取作业详情及学生的提交记录
    """
    # 查询作业信息
    hw_result = await db.execute(
        select(CourseSectionHomework)
        .options(selectinload(CourseSectionHomework.attachments))
        .where(CourseSectionHomework.id == homework_id)
    )
    homework = hw_result.scalars().first()
    
    if not homework:
        raise HTTPException(status_code=404, detail="作业不存在")
    
    # 验证学生是否有权限访问（通过班级-课程关联）
    student_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    )
    student_profile = student_result.scalars().first()
    
    if not student_profile:
        raise HTTPException(status_code=403, detail="学生信息不存在")
    
    # 获取作业所属章节和课程
    from app.models.base import CourseChapter
    chapter_result = await db.execute(
        select(CourseChapter).where(CourseChapter.id == homework.chapter_id)
    )
    chapter = chapter_result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    # 验证学生班级是否有该课程
    class_course_result = await db.execute(
        select(ClassCourseRelation).where(
            ClassCourseRelation.class_id == student_profile.class_id,
            ClassCourseRelation.course_id == chapter.course_id
        )
    )
    if not class_course_result.scalars().first():
        raise HTTPException(status_code=403, detail="您没有权限访问此作业")
    
    # 查询学生的提交记录
    submission_result = await db.execute(
        select(StudentHomeworkSubmission)
        .options(selectinload(StudentHomeworkSubmission.attachments))
        .where(
            StudentHomeworkSubmission.homework_id == homework_id,
            StudentHomeworkSubmission.student_id == current_user.id
        )
    )
    submission = submission_result.scalars().first()
    
    # 构造作业附件信息
    homework_attachments = []
    if homework.attachments:
        for att in homework.attachments:
            homework_attachments.append({
                "id": att.id,
                "file_name": att.file_name,
                "file_url": att.file_url,
                "file_size": att.file_size,
                "file_type": att.file_type
            })
    
    # 构造提交信息
    submission_data = None
    if submission:
        student_attachments = []
        if submission.attachments:
            for att in submission.attachments:
                student_attachments.append({
                    "id": att.id,
                    "file_name": att.file_name,
                    "file_url": att.file_url,
                    "file_size": att.file_size,
                    "file_type": att.file_type
                })
        
        submission_data = {
            "id": submission.id,
            "content": submission.content,
            "status": submission.status,
            "score": submission.score,
            "teacher_comment": submission.teacher_comment,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
            "attachments": student_attachments
        }
    
    return {
        "id": homework.id,
        "title": homework.title,
        "description": homework.description,
        "deadline": homework.deadline.isoformat() if homework.deadline else None,
        "attachments": homework_attachments,
        "submission": submission_data
    }


@router.post("/homeworks/{homework_id}/submit")
async def submit_homework(
    homework_id: int,
    data: HomeworkSubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    提交或更新作业
    """
    # 查询作业信息
    hw_result = await db.execute(
        select(CourseSectionHomework).where(CourseSectionHomework.id == homework_id)
    )
    homework = hw_result.scalars().first()
    
    if not homework:
        raise HTTPException(status_code=404, detail="作业不存在")
    
    # 获取章节信息
    from app.models.base import CourseChapter
    chapter_result = await db.execute(
        select(CourseChapter).where(CourseChapter.id == homework.chapter_id)
    )
    chapter = chapter_result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="章节不存在")
    
    # 验证学生权限
    student_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == current_user.id)
    )
    student_profile = student_result.scalars().first()
    
    if not student_profile:
        raise HTTPException(status_code=403, detail="学生信息不存在")
    
    class_course_result = await db.execute(
        select(ClassCourseRelation).where(
            ClassCourseRelation.class_id == student_profile.class_id,
            ClassCourseRelation.course_id == chapter.course_id
        )
    )
    if not class_course_result.scalars().first():
        raise HTTPException(status_code=403, detail="您没有权限提交此作业")
    
    # 查询或创建提交记录
    submission_result = await db.execute(
        select(StudentHomeworkSubmission).where(
            StudentHomeworkSubmission.homework_id == homework_id,
            StudentHomeworkSubmission.student_id == current_user.id
        )
    )
    submission = submission_result.scalars().first()
    
    if submission:
        # 更新现有提交
        submission.content = data.content
        if data.is_final:
            submission.status = 'submitted'
            submission.submitted_at = datetime.utcnow()
        else:
            # 草稿状态
            if submission.status == 'draft' or submission.status is None:
                submission.status = 'draft'
        submission.updated_at = datetime.utcnow()
    else:
        # 创建新提交
        submission = StudentHomeworkSubmission(
            student_id=current_user.id,
            homework_id=homework_id,
            course_id=chapter.course_id,
            chapter_id=homework.chapter_id,
            content=data.content,
            status='submitted' if data.is_final else 'draft',
            submitted_at=datetime.utcnow() if data.is_final else None
        )
        db.add(submission)
    
    await db.commit()
    await db.refresh(submission)
    
    return {
        "id": submission.id,
        "status": submission.status,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "message": "作业提交成功" if data.is_final else "草稿保存成功"
    }


@router.post("/homeworks/attachments/upload")
async def upload_homework_attachment(
    homework_id: int,
    file_name: str,
    file_url: str,
    file_size: int | None = None,
    file_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    添加作业附件记录
    注意：文件已通过 /api/v1/upload/file 上传，这里只是关联到作业提交
    """
    # 查询或创建提交记录
    submission_result = await db.execute(
        select(StudentHomeworkSubmission).where(
            StudentHomeworkSubmission.homework_id == homework_id,
            StudentHomeworkSubmission.student_id == current_user.id
        )
    )
    submission = submission_result.scalars().first()
    
    if not submission:
        # 如果还没有提交记录，创建一个草稿
        hw_result = await db.execute(
            select(CourseSectionHomework).where(CourseSectionHomework.id == homework_id)
        )
        homework = hw_result.scalars().first()
        
        if not homework:
            raise HTTPException(status_code=404, detail="作业不存在")
        
        from app.models.base import CourseChapter
        chapter_result = await db.execute(
            select(CourseChapter).where(CourseChapter.id == homework.chapter_id)
        )
        chapter = chapter_result.scalars().first()
        
        submission = StudentHomeworkSubmission(
            student_id=current_user.id,
            homework_id=homework_id,
            course_id=chapter.course_id,
            chapter_id=homework.chapter_id,
            status='draft'
        )
        db.add(submission)
        await db.flush()
    
    # 创建附件记录
    attachment = StudentHomeworkAttachment(
        submission_id=submission.id,
        file_name=file_name,
        file_url=file_url,
        file_size=file_size,
        file_type=file_type
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    
    return {
        "id": attachment.id,
        "file_name": attachment.file_name,
        "file_url": attachment.file_url,
        "file_size": attachment.file_size,
        "file_type": attachment.file_type,
        "message": "附件添加成功"
    }


@router.delete("/homeworks/attachments/{attachment_id}")
async def delete_homework_attachment(
    attachment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    删除作业附件
    """
    # 查询附件
    att_result = await db.execute(
        select(StudentHomeworkAttachment)
        .options(selectinload(StudentHomeworkAttachment.submission))
        .where(StudentHomeworkAttachment.id == attachment_id)
    )
    attachment = att_result.scalars().first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="附件不存在")
    
    # 验证是否是学生自己的附件
    if attachment.submission.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="您没有权限删除此附件")
    
    # 删除附件记录
    await db.delete(attachment)
    await db.commit()
    
    return {"message": "附件删除成功"}
