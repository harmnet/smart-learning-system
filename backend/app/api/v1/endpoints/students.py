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
            
            sections_data.append({
                "id": section_row[0],
                "title": section_row[2],
                "sort_order": section_row[3],
                "resources": resources_data,
                "exam_papers": [],
                "homework": []
            })
        
        outline.append({
            "id": chapter_row[0],
            "title": chapter_row[2],
            "sort_order": chapter_row[3],
            "sections": sections_data,
            "exam_papers": []
        })
    
    return outline
