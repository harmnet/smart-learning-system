from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_, text
import logging
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.course_outline import CourseSectionResource, CourseChapterExamPaper, CourseSectionHomework
from app.models.base import Course, CourseChapter
from app.models.teaching_resource import TeachingResource
from app.models.reference_material import ReferenceMaterial
from app.models.exam_paper import ExamPaper
from app.core import security
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    from app.models.base import User
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

# Schemas
class ChapterCreate(BaseModel):
    title: str
    sort_order: int = 0
    parent_id: Optional[int] = None
    
    class Config:
        # 忽略额外的字段（如id），避免前端错误地发送id字段
        extra = "ignore"

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    sort_order: Optional[int] = None

class SectionResourceCreate(BaseModel):
    resource_type: str  # teaching_resource, reference_material
    resource_id: int
    sort_order: int = 0

class ExamPaperLink(BaseModel):
    exam_paper_id: int

class HomeworkCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    sort_order: int = 0

class HomeworkUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    sort_order: Optional[int] = None

@router.get("/courses/{course_id}/outline")
async def get_course_outline(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    获取课程大纲
    """
    # 验证课程是否存在且用户有权限
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can access this course outline")
    
    # 获取所有章节（章和小节）
    # 使用原始SQL查询，避免created_at和updated_at字段问题（如果表中没有这些字段）
    try:
        logging.info(f"查询课程大纲: course_id={course_id}, current_user_id={current_user.id}")
        # 使用原始SQL查询，只选择存在的字段
        sql = text("""
            SELECT id, course_id, title, sort_order, parent_id 
            FROM course_chapter 
            WHERE course_id = :course_id 
            ORDER BY sort_order, id
        """)
        result = await db.execute(sql, {"course_id": course_id})
        rows = result.all()
        logging.info(f"查询到 {len(rows)} 个章节")
        all_chapters = []
        for row in rows:
            chapter_obj = CourseChapter()
            chapter_obj.id = row.id
            chapter_obj.course_id = row.course_id
            chapter_obj.title = row.title
            chapter_obj.sort_order = row.sort_order
            chapter_obj.parent_id = row.parent_id
            all_chapters.append(chapter_obj)
            logging.info(f"章节: id={row.id}, course_id={row.course_id}, title={row.title}")
    except Exception as e:
        # 如果原始SQL也失败，记录错误并抛出异常
        logging.error(f"查询课程章节失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"查询课程章节失败: {str(e)}")
    
    # 手动加载关联数据
    chapter_ids = [ch.id for ch in all_chapters]
    
    # 加载资源
    resources_result = await db.execute(
        select(CourseSectionResource).where(CourseSectionResource.chapter_id.in_(chapter_ids))
    )
    all_resources = resources_result.scalars().all()
    resources_by_chapter = {}
    for res in all_resources:
        if res.chapter_id not in resources_by_chapter:
            resources_by_chapter[res.chapter_id] = []
        resources_by_chapter[res.chapter_id].append(res)
    
    # 加载试卷关联
    exam_papers_result = await db.execute(
        select(CourseChapterExamPaper).where(CourseChapterExamPaper.chapter_id.in_(chapter_ids))
    )
    all_exam_papers = exam_papers_result.scalars().all()
    exam_papers_by_chapter = {}
    for ep in all_exam_papers:
        if ep.chapter_id not in exam_papers_by_chapter:
            exam_papers_by_chapter[ep.chapter_id] = []
        exam_papers_by_chapter[ep.chapter_id].append(ep)
    
    # 加载作业
    homeworks_result = await db.execute(
        select(CourseSectionHomework).where(CourseSectionHomework.chapter_id.in_(chapter_ids))
    )
    all_homeworks = homeworks_result.scalars().all()
    homeworks_by_chapter = {}
    for hw in all_homeworks:
        if hw.chapter_id not in homeworks_by_chapter:
            homeworks_by_chapter[hw.chapter_id] = []
        homeworks_by_chapter[hw.chapter_id].append(hw)
    
    # 分离章和小节
    chapters = [ch for ch in all_chapters if ch.parent_id is None]
    logging.info(f"分离后的章数量: {len(chapters)}")
    sections = {ch.id: [] for ch in chapters}
    
    for section in all_chapters:
        if section.parent_id:
            if section.parent_id in sections:
                sections[section.parent_id].append(section)
    
    logging.info(f"准备构建返回数据，章数量: {len(chapters)}")
    # 构建返回数据
    outline = []
    for chapter in chapters:
        logging.info(f"处理章: id={chapter.id}, title={chapter.title}")
        chapter_data = {
            "id": chapter.id,
            "title": chapter.title,
            "sort_order": chapter.sort_order,
            "sections": [],
            "exam_papers": [{"id": ep.exam_paper_id} for ep in exam_papers_by_chapter.get(chapter.id, [])],
        }
        
        # 添加小节
        for section in sections[chapter.id]:
            section_data = {
                "id": section.id,
                "title": section.title,
                "sort_order": section.sort_order,
                "resources": [],
                "exam_papers": [{"id": ep.exam_paper_id} for ep in exam_papers_by_chapter.get(section.id, [])],
                "homeworks": [
                    {
                        "id": hw.id,
                        "title": hw.title,
                        "description": hw.description,
                        "deadline": hw.deadline.isoformat() if hw.deadline else None,
                        "sort_order": hw.sort_order,
                    }
                    for hw in homeworks_by_chapter.get(section.id, [])
                ],
            }
            
            # 添加资源
            for resource in resources_by_chapter.get(section.id, []):
                resource_data = {
                    "id": resource.id,
                    "resource_type": resource.resource_type,
                    "resource_id": resource.resource_id,
                    "sort_order": resource.sort_order,
                }
                section_data["resources"].append(resource_data)
            
            chapter_data["sections"].append(section_data)
        
        outline.append(chapter_data)
    
    logging.info(f"最终返回的outline数量: {len(outline)}")
    return {"course_id": course_id, "outline": outline}

@router.post("/courses/{course_id}/chapters")
async def create_chapter(
    course_id: int,
    chapter_data: ChapterCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    创建章或小节
    """
    # 验证课程权限
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalars().first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    # 如果parent_id不为空，验证父章存在（使用原始SQL避免created_at和updated_at字段问题）
    if chapter_data.parent_id:
        try:
            sql_parent = text("""
                SELECT id, course_id, title, sort_order, parent_id 
                FROM course_chapter 
                WHERE id = :parent_id 
                AND course_id = :course_id 
                AND parent_id IS NULL
            """)
            parent_result = await db.execute(sql_parent, {
                "parent_id": chapter_data.parent_id,
                "course_id": course_id
            })
            parent_row = parent_result.first()
            if not parent_row:
                raise HTTPException(status_code=400, detail="Invalid parent chapter")
            logging.info(f"验证父章成功: parent_id={chapter_data.parent_id}, title={parent_row.title}")
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"验证父章失败: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"验证父章失败: {str(e)}")
    
    # 创建章节（使用原始SQL避免created_at和updated_at字段问题）
    try:
        logging.info(f"创建章节: course_id={course_id}, title={chapter_data.title}, sort_order={chapter_data.sort_order}, parent_id={chapter_data.parent_id}")
        # 使用原始SQL插入，不包含created_at和updated_at字段
        sql = text("""
            INSERT INTO course_chapter (course_id, title, sort_order, parent_id)
            VALUES (:course_id, :title, :sort_order, :parent_id)
            RETURNING id
        """)
        params = {
            "course_id": course_id,
            "title": chapter_data.title,
            "sort_order": chapter_data.sort_order if chapter_data.sort_order is not None else 0,
            "parent_id": chapter_data.parent_id
        }
        logging.info(f"执行SQL插入，参数: {params}")
        result = await db.execute(sql, params)
        chapter_id = result.scalar_one()
        
        await db.commit()
        logging.info(f"章节创建成功: chapter_id={chapter_id}, course_id={course_id}")
        
        # 验证数据是否真的保存了
        verify_sql = text("SELECT id, course_id, title FROM course_chapter WHERE id = :chapter_id")
        verify_result = await db.execute(verify_sql, {"chapter_id": chapter_id})
        verify_row = verify_result.first()
        if verify_row:
            logging.info(f"验证成功: 章节ID={verify_row.id}, 课程ID={verify_row.course_id}, 标题={verify_row.title}")
        else:
            logging.warning(f"警告: 章节创建后验证失败，chapter_id={chapter_id}")
        
        return {
            "id": chapter_id,
            "title": chapter_data.title,
            "sort_order": chapter_data.sort_order if chapter_data.sort_order is not None else 0,
            "parent_id": chapter_data.parent_id,
        }
    except Exception as e:
        await db.rollback()
        logging.error(f"创建章节失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"创建章节失败: {str(e)}")

@router.put("/chapters/{chapter_id}")
async def update_chapter(
    chapter_id: int,
    chapter_data: ChapterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    更新章或小节
    """
    # 使用原始SQL查询章节，避免created_at和updated_at字段问题
    sql_select = text("""
        SELECT id, course_id, title, sort_order, parent_id 
        FROM course_chapter 
        WHERE id = :chapter_id
    """)
    result = await db.execute(sql_select, {"chapter_id": chapter_id})
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # 验证课程权限
    course_result = await db.execute(
        select(Course).where(Course.id == row.course_id)
    )
    course = course_result.scalars().first()
    
    if not course or course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    # 使用原始SQL更新，避免created_at和updated_at字段问题
    update_fields = []
    update_params = {"chapter_id": chapter_id}
    
    if chapter_data.title is not None:
        update_fields.append("title = :title")
        update_params["title"] = chapter_data.title
    
    if chapter_data.sort_order is not None:
        update_fields.append("sort_order = :sort_order")
        update_params["sort_order"] = chapter_data.sort_order
    
    if update_fields:
        sql_update = text(f"""
            UPDATE course_chapter 
            SET {', '.join(update_fields)}
            WHERE id = :chapter_id
            RETURNING id, course_id, title, sort_order, parent_id
        """)
        update_result = await db.execute(sql_update, update_params)
        updated_row = update_result.first()
        await db.commit()
        
        return {
            "id": updated_row.id,
            "title": updated_row.title,
            "sort_order": updated_row.sort_order,
            "parent_id": updated_row.parent_id,
        }
    else:
        # 如果没有要更新的字段，直接返回当前数据
        return {
            "id": row.id,
            "title": row.title,
            "sort_order": row.sort_order,
            "parent_id": row.parent_id,
        }

@router.delete("/chapters/{chapter_id}")
async def delete_chapter(
    chapter_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    删除章或小节（级联删除）
    """
    # 使用原始SQL查询章节，避免created_at和updated_at字段问题
    try:
        sql_select = text("""
            SELECT id, course_id, title, sort_order, parent_id 
            FROM course_chapter 
            WHERE id = :chapter_id
        """)
        result = await db.execute(sql_select, {"chapter_id": chapter_id})
        row = result.first()
        
        if not row:
            raise HTTPException(status_code=404, detail="Chapter not found")
        
        # 验证课程权限
        course_result = await db.execute(
            select(Course).where(Course.id == row.course_id)
        )
        course = course_result.scalars().first()
        
        if not course or course.main_teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
        
        # 使用原始SQL删除，级联删除会自动处理关联数据
        sql_delete = text("DELETE FROM course_chapter WHERE id = :chapter_id")
        await db.execute(sql_delete, {"chapter_id": chapter_id})
        await db.commit()
        
        logging.info(f"章节删除成功: chapter_id={chapter_id}")
        return {"message": "Chapter deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logging.error(f"删除章节失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"删除章节失败: {str(e)}")

@router.post("/chapters/{chapter_id}/resources")
async def add_section_resource(
    chapter_id: int,
    resource_data: SectionResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    为小节添加资源（教学资源或参考资料）
    """
    # 使用原始SQL查询章节和课程信息，避免关系加载问题
    sql_chapter = text("""
        SELECT cc.id, cc.course_id, cc.title, cc.parent_id, c.main_teacher_id
        FROM course_chapter cc
        JOIN course c ON cc.course_id = c.id
        WHERE cc.id = :chapter_id
    """)
    chapter_result = await db.execute(sql_chapter, {"chapter_id": chapter_id})
    chapter_row = chapter_result.first()
    
    if not chapter_row:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if chapter_row.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    # 验证必须是小节（有parent_id）
    if chapter_row.parent_id is None:
        raise HTTPException(status_code=400, detail="Resources can only be added to sections, not chapters")
    
    # 验证资源存在且属于当前教师
    if resource_data.resource_type == "teaching_resource":
        resource_result = await db.execute(
            select(TeachingResource).where(TeachingResource.id == resource_data.resource_id)
        )
        resource = resource_result.scalars().first()
        if not resource or resource.teacher_id != current_user.id:
            raise HTTPException(status_code=404, detail="Teaching resource not found")
    elif resource_data.resource_type == "reference_material":
        resource_result = await db.execute(
            select(ReferenceMaterial).where(ReferenceMaterial.id == resource_data.resource_id)
        )
        resource = resource_result.scalars().first()
        if not resource or resource.teacher_id != current_user.id:
            raise HTTPException(status_code=404, detail="Reference material not found")
    else:
        raise HTTPException(status_code=400, detail="Invalid resource type")
    
    # 检查是否已关联
    existing_result = await db.execute(
        select(CourseSectionResource).where(
            CourseSectionResource.chapter_id == chapter_id,
            CourseSectionResource.resource_type == resource_data.resource_type,
            CourseSectionResource.resource_id == resource_data.resource_id
        )
    )
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Resource already linked")
    
    section_resource = CourseSectionResource(
        chapter_id=chapter_id,
        resource_type=resource_data.resource_type,
        resource_id=resource_data.resource_id,
        sort_order=resource_data.sort_order
    )
    db.add(section_resource)
    await db.commit()
    await db.refresh(section_resource)
    
    return {
        "id": section_resource.id,
        "resource_type": section_resource.resource_type,
        "resource_id": section_resource.resource_id,
        "sort_order": section_resource.sort_order,
    }

@router.delete("/chapters/{chapter_id}/resources/{resource_id}")
async def remove_section_resource(
    chapter_id: int,
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    移除小节资源
    """
    # 使用原始SQL查询章节和课程信息，避免关系加载问题
    sql_chapter = text("""
        SELECT cc.id, cc.course_id, cc.title, cc.parent_id, c.main_teacher_id
        FROM course_chapter cc
        JOIN course c ON cc.course_id = c.id
        WHERE cc.id = :chapter_id
    """)
    chapter_result = await db.execute(sql_chapter, {"chapter_id": chapter_id})
    chapter_row = chapter_result.first()
    
    if not chapter_row:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if chapter_row.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    # 查询资源关联记录
    resource_result = await db.execute(
        select(CourseSectionResource).where(
            CourseSectionResource.id == resource_id,
            CourseSectionResource.chapter_id == chapter_id
        )
    )
    resource = resource_result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # 删除资源关联
    await db.delete(resource)
    await db.commit()
    
    return {"message": "Resource removed successfully"}

@router.post("/chapters/{chapter_id}/exam-papers")
async def link_exam_paper(
    chapter_id: int,
    exam_data: ExamPaperLink,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    关联试卷到章或小节
    """
    chapter_result = await db.execute(
        select(CourseChapter).options(selectinload(CourseChapter.course))
        .where(CourseChapter.id == chapter_id)
    )
    chapter = chapter_result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if chapter.course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    # 验证试卷存在且属于当前教师
    exam_paper_result = await db.execute(
        select(ExamPaper).where(ExamPaper.id == exam_data.exam_paper_id)
    )
    exam_paper = exam_paper_result.scalars().first()
    
    if not exam_paper or exam_paper.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="Exam paper not found")
    
    # 检查是否已关联
    existing_result = await db.execute(
        select(CourseChapterExamPaper).where(
            CourseChapterExamPaper.chapter_id == chapter_id,
            CourseChapterExamPaper.exam_paper_id == exam_data.exam_paper_id
        )
    )
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Exam paper already linked")
    
    link = CourseChapterExamPaper(
        chapter_id=chapter_id,
        exam_paper_id=exam_data.exam_paper_id
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    
    return {
        "id": link.id,
        "chapter_id": link.chapter_id,
        "exam_paper_id": link.exam_paper_id,
    }

@router.delete("/chapters/{chapter_id}/exam-papers/{exam_paper_id}")
async def unlink_exam_paper(
    chapter_id: int,
    exam_paper_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    取消关联试卷
    """
    chapter_result = await db.execute(
        select(CourseChapter).options(selectinload(CourseChapter.course))
        .where(CourseChapter.id == chapter_id)
    )
    chapter = chapter_result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if chapter.course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    link_result = await db.execute(
        select(CourseChapterExamPaper).where(
            CourseChapterExamPaper.chapter_id == chapter_id,
            CourseChapterExamPaper.exam_paper_id == exam_paper_id
        )
    )
    link = link_result.scalars().first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    
    await db.delete(link)
    await db.commit()
    
    return {"message": "Exam paper unlinked successfully"}

@router.post("/chapters/{chapter_id}/homeworks")
async def create_homework(
    chapter_id: int,
    homework_data: HomeworkCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    为小节创建作业
    """
    chapter_result = await db.execute(
        select(CourseChapter).options(selectinload(CourseChapter.course))
        .where(CourseChapter.id == chapter_id)
    )
    chapter = chapter_result.scalars().first()
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if chapter.course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    # 验证必须是小节
    if chapter.parent_id is None:
        raise HTTPException(status_code=400, detail="Homework can only be added to sections, not chapters")
    
    homework = CourseSectionHomework(
        chapter_id=chapter_id,
        title=homework_data.title,
        description=homework_data.description,
        deadline=homework_data.deadline,
        sort_order=homework_data.sort_order
    )
    db.add(homework)
    await db.commit()
    await db.refresh(homework)
    
    return {
        "id": homework.id,
        "title": homework.title,
        "description": homework.description,
        "deadline": homework.deadline.isoformat() if homework.deadline else None,
        "sort_order": homework.sort_order,
    }

@router.put("/homeworks/{homework_id}")
async def update_homework(
    homework_id: int,
    homework_data: HomeworkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    更新作业
    """
    homework_result = await db.execute(
        select(CourseSectionHomework).options(selectinload(CourseSectionHomework.chapter).selectinload(CourseChapter.course))
        .where(CourseSectionHomework.id == homework_id)
    )
    homework = homework_result.scalars().first()
    
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    
    if homework.chapter.course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    if homework_data.title is not None:
        homework.title = homework_data.title
    if homework_data.description is not None:
        homework.description = homework_data.description
    if homework_data.deadline is not None:
        homework.deadline = homework_data.deadline
    if homework_data.sort_order is not None:
        homework.sort_order = homework_data.sort_order
    
    await db.commit()
    await db.refresh(homework)
    
    return {
        "id": homework.id,
        "title": homework.title,
        "description": homework.description,
        "deadline": homework.deadline.isoformat() if homework.deadline else None,
        "sort_order": homework.sort_order,
    }

@router.delete("/homeworks/{homework_id}")
async def delete_homework(
    homework_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
) -> Any:
    """
    删除作业
    """
    homework_result = await db.execute(
        select(CourseSectionHomework).options(selectinload(CourseSectionHomework.chapter).selectinload(CourseChapter.course))
        .where(CourseSectionHomework.id == homework_id)
    )
    homework = homework_result.scalars().first()
    
    if not homework:
        raise HTTPException(status_code=404, detail="Homework not found")
    
    if homework.chapter.course.main_teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the main teacher can manage course outline")
    
    await db.delete(homework)
    await db.commit()
    
    return {"message": "Homework deleted successfully"}

