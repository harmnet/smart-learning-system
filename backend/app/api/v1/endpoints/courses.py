from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, func

from app.db.session import get_db
from app.models.base import Course, ClassCourseRelation, TeacherProfile, User, CourseCover, Major, Class
from app.schemas import course as course_schemas
from app.core import security
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from app.core.config import settings
from pydantic import BaseModel

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

class LinkClassesRequest(BaseModel):
    class_ids: List[int]

@router.get("/")
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    teacher_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve courses with filtering and teacher information.
    """
    query = select(Course).options(
        selectinload(Course.covers),
        selectinload(Course.class_relations).selectinload(ClassCourseRelation.teacher).selectinload(TeacherProfile.user),
        selectinload(Course.main_teacher)  # 加载主讲教师信息
    )
    
    # 应用筛选条件
    conditions = []
    if search:
        conditions.append(Course.title.ilike(f"%{search}%"))
    
    if conditions:
        query = query.where(and_(*conditions))
    
    # 如果指定了teacher_id，查询该教师作为主讲师的课程，或者通过ClassCourseRelation关联的课程
    if teacher_id:
        # 方法1：查询main_teacher_id为该teacher_id的课程
        main_teacher_condition = Course.main_teacher_id == teacher_id
        
        # 方法2：查询通过ClassCourseRelation关联的课程
        teacher_courses_result = await db.execute(
            select(ClassCourseRelation.course_id).where(
                ClassCourseRelation.teacher_id == teacher_id
            ).distinct()
        )
        teacher_course_ids = [row[0] for row in teacher_courses_result.all()]
        
        # 合并两种方式的课程ID
        if teacher_course_ids:
            # 如果有通过ClassCourseRelation关联的课程，合并查询条件
            teacher_condition = or_(
                main_teacher_condition,
                Course.id.in_(teacher_course_ids)
            )
        else:
            # 如果没有通过ClassCourseRelation关联的课程，只查询main_teacher_id
            teacher_condition = main_teacher_condition
        
        # 将教师筛选条件添加到查询中
        if conditions:
            query = query.where(and_(teacher_condition, *conditions))
        else:
            query = query.where(teacher_condition)
    
    # Course模型没有created_at字段，使用id降序排列（新创建的课程ID更大）
    query = query.order_by(Course.id.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    courses = result.scalars().all()
    
    # 构建返回数据
    course_list = []
    for course in courses:
        # 获取课程封面（取第一个）
        cover_image = None
        if course.covers and len(course.covers) > 0:
            cover = course.covers[0]
            cover_image = cover.filename
        
        # 获取授课教师列表（去重）
        teachers = []
        teacher_ids = set()
        
        # 方法1：从ClassCourseRelation获取授课教师
        for relation in course.class_relations:
            if relation.teacher and relation.teacher.user_id not in teacher_ids:
                teacher_ids.add(relation.teacher.user_id)
                if relation.teacher.user:
                    teachers.append({
                        "id": relation.teacher.user.id,
                        "name": relation.teacher.user.full_name or relation.teacher.user.username,
                        "username": relation.teacher.user.username,
                    })
        
        # 方法2：从main_teacher_id获取主讲教师（如果还没有包含）
        if course.main_teacher_id and course.main_teacher_id not in teacher_ids:
            # 加载main_teacher关系
            if course.main_teacher:
                teachers.insert(0, {  # 主讲教师放在第一位
                    "id": course.main_teacher.id,
                    "name": course.main_teacher.full_name or course.main_teacher.username,
                    "username": course.main_teacher.username,
                })
                teacher_ids.add(course.main_teacher.id)
            else:
                # 如果关系未加载，手动查询
                main_teacher_result = await db.execute(
                    select(User).where(User.id == course.main_teacher_id)
                )
                main_teacher = main_teacher_result.scalars().first()
                if main_teacher:
                    teachers.insert(0, {
                        "id": main_teacher.id,
                        "name": main_teacher.full_name or main_teacher.username,
                        "username": main_teacher.username,
                    })
                    teacher_ids.add(main_teacher.id)
        
        cover_id = None
        if course.covers and len(course.covers) > 0:
            cover_id = course.covers[0].id
        
        course_list.append({
            "id": course.id,
            "title": course.title,
            "name": course.title,  # 兼容前端
            "code": course.code,
            "description": course.description,
            "credits": course.credits,
            "cover_image": cover_image,
            "cover_id": cover_id,  # 用于构建图片URL
            "teachers": teachers,
            "main_teacher_id": course.main_teacher_id,  # 添加主讲教师ID
            "created_at": None,  # Course模型没有created_at字段
            "updated_at": None,  # Course模型没有updated_at字段
        })
    
    return course_list

@router.post("/")
async def create_course(
    course_data: course_schemas.CourseCreate,
    cover_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a new course.
    """
    # 验证用户角色
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can create courses")
    
    # 获取教师专业信息
    teacher_profile_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_profile_result.scalars().first()
    
    if not teacher_profile or not teacher_profile.major_id:
        raise HTTPException(status_code=400, detail="教师未关联专业，无法创建课程")
    
    # 检查课程代码是否已存在
    if course_data.code:
        existing = await db.execute(
            select(Course).where(Course.code == course_data.code)
        )
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="课程代码已存在")
    
    # 确定主讲教师
    main_teacher_id = course_data.main_teacher_id or current_user.id
    
    # 确定专业ID：如果有主讲教师，从主讲教师获取；否则从当前用户获取
    major_id_to_use = None
    if course_data.main_teacher_id:
        # 从指定的主讲教师获取专业
        main_teacher_profile_result = await db.execute(
            select(TeacherProfile).where(TeacherProfile.user_id == course_data.main_teacher_id)
        )
        main_teacher_profile = main_teacher_profile_result.scalars().first()
        if main_teacher_profile and main_teacher_profile.major_id:
            major_id_to_use = main_teacher_profile.major_id
    else:
        # 从当前用户获取专业
        major_id_to_use = teacher_profile.major_id
    
    if not major_id_to_use:
        raise HTTPException(status_code=400, detail="无法确定课程所属专业，请确保教师已关联专业")
    
    # 创建课程（注意：Course模型使用title字段，但schema使用name）
    course = Course(
        title=course_data.name,  # 将name映射到title
        code=course_data.code,
        description=course_data.description,
        credits=course_data.credits or 2,
        course_type=course_data.course_type,
        hours=course_data.hours,
        introduction=course_data.introduction,
        objectives=course_data.objectives,
        main_teacher_id=main_teacher_id,
        is_public=course_data.is_public or False,
        major_id=major_id_to_use  # 根据主讲教师或当前用户确定专业
    )
    db.add(course)
    await db.flush()  # 获取course.id
    
    # 如果指定了封面ID，关联封面到课程
    if cover_id:
        cover_result = await db.execute(
            select(CourseCover).where(CourseCover.id == cover_id)
        )
        cover = cover_result.scalar_one_or_none()
        if cover:
            cover.course_id = course.id
            # 更新排序，确保新关联的封面排在第一位
            max_order_result = await db.execute(
                select(func.max(CourseCover.sort_order)).where(
                    CourseCover.course_id == course.id
                )
            )
            max_order = max_order_result.scalar() or 0
            cover.sort_order = max_order + 1
    
    await db.commit()
    await db.refresh(course)
    
    # 获取专业名称
    major_result = await db.execute(
        select(Major).where(Major.id == teacher_profile.major_id)
    )
    major = major_result.scalars().first()
    
    return {
        "message": "课程创建成功",
        "id": course.id,
        "title": course.title,
        "name": course.title,  # 兼容前端
        "is_public": course.is_public,
        "major_id": course.major_id,
        "major_name": major.name if major else None
    }

@router.get("/{course_id}")
async def get_course(
    course_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get course by ID.
    """
    result = await db.execute(
        select(Course)
        .options(selectinload(Course.major), selectinload(Course.covers))
        .where(Course.id == course_id)
    )
    course = result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # 获取封面
    cover_id = None
    cover_image = None
    if course.covers and len(course.covers) > 0:
        cover = course.covers[0]
        cover_id = cover.id
        cover_image = cover.filename
    
    return {
        "id": course.id,
        "title": course.title,
        "name": course.title,
        "code": course.code,
        "description": course.description,
        "credits": course.credits,
        "course_type": course.course_type,
        "hours": course.hours,
        "introduction": course.introduction,
        "objectives": course.objectives,
        "main_teacher_id": course.main_teacher_id,
        "is_public": course.is_public,
        "major_id": course.major_id,
        "major_name": course.major.name if course.major else None,
        "cover_id": cover_id,
        "cover_image": cover_image,
    }

@router.put("/{course_id}")
async def update_course(
    course_id: int,
    course_data: course_schemas.CourseUpdate,
    cover_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update course.
    """
    try:
        # 验证用户角色
        if current_user.role != 'teacher':
            raise HTTPException(status_code=403, detail="Only teachers can update courses")
        
        # 获取课程
        result = await db.execute(
            select(Course).where(Course.id == course_id)
        )
        course = result.scalars().first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # 验证权限：只有主讲教师可以编辑
        if course.main_teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the main teacher can update this course")
        
        # 更新课程信息（major_id不能修改）
        if course_data.name is not None:
            course.title = course_data.name
        if course_data.code is not None:
            # 将空字符串转换为 None
            code_value = course_data.code.strip() if course_data.code else None
            # 检查课程代码是否已被其他课程使用（只有当新代码不为空时）
            if code_value and code_value != course.code:
                existing = await db.execute(
                    select(Course).where(Course.code == code_value, Course.id != course_id)
                )
                if existing.scalars().first():
                    raise HTTPException(status_code=400, detail="课程代码已存在")
            course.code = code_value
        if course_data.description is not None:
            course.description = course_data.description
        if course_data.credits is not None:
            course.credits = course_data.credits
        if course_data.course_type is not None:
            course.course_type = course_data.course_type
        if course_data.hours is not None:
            course.hours = course_data.hours
        if course_data.introduction is not None:
            course.introduction = course_data.introduction
        if course_data.objectives is not None:
            course.objectives = course_data.objectives
        # 处理主讲教师更新
        if course_data.main_teacher_id is not None:
            old_main_teacher_id = course.main_teacher_id
            course.main_teacher_id = course_data.main_teacher_id
            
            # 如果主讲教师改变了，需要根据新主讲教师的专业更新major_id
            if course_data.main_teacher_id != old_main_teacher_id:
                teacher_profile_result = await db.execute(
                    select(TeacherProfile).where(TeacherProfile.user_id == course_data.main_teacher_id)
                )
                teacher_profile = teacher_profile_result.scalars().first()
                
                if teacher_profile and teacher_profile.major_id:
                    course.major_id = teacher_profile.major_id
                else:
                    raise HTTPException(status_code=400, detail="新主讲教师未关联专业，无法更新课程专业信息")
        
        if course_data.is_public is not None:
            course.is_public = course_data.is_public
        
        # 无论是否修改主讲教师，都确保课程有专业信息
        # 优先级：1. 主讲教师的专业 2. 当前用户的专业
        if not course.major_id:
            major_id_to_set = None
            
            # 优先从主讲教师获取专业
            if course.main_teacher_id:
                teacher_profile_result = await db.execute(
                    select(TeacherProfile).where(TeacherProfile.user_id == course.main_teacher_id)
                )
                teacher_profile = teacher_profile_result.scalars().first()
                if teacher_profile and teacher_profile.major_id:
                    major_id_to_set = teacher_profile.major_id
            
            # 如果主讲教师没有专业，从当前用户获取
            if not major_id_to_set:
                current_user_profile_result = await db.execute(
                    select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
                )
                current_user_profile = current_user_profile_result.scalars().first()
                if current_user_profile and current_user_profile.major_id:
                    major_id_to_set = current_user_profile.major_id
            
            if major_id_to_set:
                course.major_id = major_id_to_set
            else:
                raise HTTPException(status_code=400, detail="无法确定课程所属专业，请确保教师已关联专业")
        
        # 如果指定了封面ID，关联封面到课程
        if cover_id:
            cover_result = await db.execute(
                select(CourseCover).where(CourseCover.id == cover_id)
            )
            cover = cover_result.scalar_one_or_none()
            if cover:
                # 取消旧封面的关联
                old_covers_result = await db.execute(
                    select(CourseCover).where(CourseCover.course_id == course.id)
                )
                for old_cover in old_covers_result.scalars().all():
                    old_cover.course_id = None
                
                # 关联新封面
                cover.course_id = course.id
        
        await db.commit()
        await db.refresh(course)
        
        # 获取专业名称和主讲教师信息
        major_result = await db.execute(
            select(Major).where(Major.id == course.major_id)
        )
        major = major_result.scalars().first()
        
        # 获取主讲教师信息
        main_teacher = None
        if course.main_teacher_id:
            teacher_result = await db.execute(
                select(User).where(User.id == course.main_teacher_id)
            )
            main_teacher = teacher_result.scalars().first()
        
        # 获取封面信息（从CourseCover表中查询）
        cover_id_result = None
        cover_image = None
        cover_result = await db.execute(
            select(CourseCover).where(CourseCover.course_id == course.id)
        )
        cover = cover_result.scalars().first()
        if cover:
            cover_id_result = cover.id
            cover_image = cover.filename
        
        return {
            "message": "课程更新成功",
            "id": course.id,
            "title": course.title,
            "name": course.title,
            "code": course.code,
            "description": course.description,
            "credits": course.credits,
            "course_type": course.course_type,
            "hours": course.hours,
            "introduction": course.introduction,
            "objectives": course.objectives,
            "main_teacher_id": course.main_teacher_id,
            "main_teacher_name": main_teacher.full_name if main_teacher else None,
            "is_public": course.is_public,
            "major_id": course.major_id,
            "major_name": major.name if major else None,
            "cover_id": cover_id_result,
            "cover_image": cover_image,
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"更新课程失败: {str(e)}")

@router.post("/{course_id}/link-classes")
async def link_classes_to_course(
    course_id: int,
    request: LinkClassesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    关联班级到课程
    """
    # 验证用户角色
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can link classes")
    
    # 获取课程
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # 如果课程没有关联专业，尝试设置专业信息
    # 优先级：1. 主讲教师的专业 2. 当前用户的专业
    if not course.major_id:
        major_id_to_set = None
        
        # 优先从主讲教师获取专业
        if course.main_teacher_id:
            teacher_profile_result = await db.execute(
                select(TeacherProfile).where(TeacherProfile.user_id == course.main_teacher_id)
            )
            teacher_profile = teacher_profile_result.scalars().first()
            if teacher_profile and teacher_profile.major_id:
                major_id_to_set = teacher_profile.major_id
        
        # 如果主讲教师没有专业，从当前用户获取
        if not major_id_to_set:
            current_user_profile_result = await db.execute(
                select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
            )
            current_user_profile = current_user_profile_result.scalars().first()
            if current_user_profile and current_user_profile.major_id:
                major_id_to_set = current_user_profile.major_id
        
        if major_id_to_set:
            course.major_id = major_id_to_set
            await db.commit()
            await db.refresh(course)
        else:
            raise HTTPException(status_code=400, detail="无法确定课程所属专业，请确保教师已关联专业")
    
    if not course.major_id:
        raise HTTPException(status_code=400, detail="课程未关联专业，无法关联班级")
    
    # 验证权限
    if course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can link classes")
    
    # 验证班级是否属于同一专业
    classes_result = await db.execute(
        select(Class).where(Class.id.in_(request.class_ids))
    )
    classes = classes_result.scalars().all()
    
    invalid_classes = [c for c in classes if c.major_id != course.major_id]
    if invalid_classes:
        raise HTTPException(
            status_code=400, 
            detail=f"以下班级不属于课程所在专业: {[c.name for c in invalid_classes]}"
        )
    
    # 创建或更新关联关系
    linked_count = 0
    for class_id in request.class_ids:
        # 检查是否已存在关联
        existing_result = await db.execute(
            select(ClassCourseRelation).where(
                ClassCourseRelation.course_id == course_id,
                ClassCourseRelation.class_id == class_id
            )
        )
        existing = existing_result.scalars().first()
        
        if not existing:
            # 获取教师档案（用于关联教师）
            teacher_profile_result = await db.execute(
                select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
            )
            teacher_profile = teacher_profile_result.scalars().first()
            
            if teacher_profile:
                relation = ClassCourseRelation(
                    course_id=course_id,
                    class_id=class_id,
                    teacher_id=teacher_profile.id
                )
                db.add(relation)
                linked_count += 1
    
    await db.commit()
    
    return {
        "message": f"成功关联 {linked_count} 个班级",
        "linked_count": linked_count
    }

@router.get("/{course_id}/classes")
async def get_course_classes(
    course_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取课程关联的班级列表
    """
    result = await db.execute(
        select(ClassCourseRelation)
        .options(selectinload(ClassCourseRelation.class_))
        .where(ClassCourseRelation.course_id == course_id)
    )
    relations = result.scalars().all()
    
    classes = []
    for relation in relations:
        if relation.class_:
            classes.append({
                "id": relation.class_.id,
                "name": relation.class_.name,
                "code": relation.class_.code,
                "grade": relation.class_.grade,
            })
    
    return classes

