from typing import Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, aliased
import json
import re
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

from app.db.session import get_db
from app.models.base import TeacherProfile, User, Course, CourseChapter, StudentProfile, ClassCourseRelation
from app.models.course_outline import CourseSectionHomework, CourseSectionResource, CourseChapterKnowledgeGraph
from app.models.student_learning import (
    StudentHomeworkSubmission,
    StudentHomeworkGradeHistory,
    StudentHomeworkAIGradingLog,
)
from app.models.llm_config import LLMConfig
from app.models.teaching_resource import TeachingResource
from app.models.reference_material import ReferenceMaterial
from app.models.knowledge_graph import KnowledgeGraph, KnowledgeNode
from app.utils.resource_parser import download_and_parse_file_url
from app.api.v1.endpoints.ai_creation import call_aliyun_qwen, call_openai_compatible
from app.utils.llm_call_logger import log_llm_call
from fastapi import Depends, HTTPException, status
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

class HomeworkGradeRequest(BaseModel):
    score: float
    teacher_comment: str | None = None


def normalize_resource_type(file_name: Optional[str], file_type: Optional[str]) -> str:
    type_mapping = {
        "pdf": "pdf",
        "doc": "word",
        "docx": "word",
        "ppt": "ppt",
        "pptx": "ppt",
        "md": "markdown",
        "txt": "text",
        "text": "text",
        "word": "word",
        "markdown": "markdown",
        "ppt": "ppt",
        "excel": "excel",
        "xls": "excel",
        "xlsx": "excel",
    }
    if file_type:
        key = file_type.lower()
        if key in type_mapping:
            return type_mapping[key]
    if file_name:
        ext = Path(file_name).suffix.lower().lstrip(".")
        if ext in type_mapping:
            return type_mapping[ext]
    return "text"


def truncate_text(text: Optional[str], limit: int) -> str:
    if not text:
        return ""
    content = text.strip()
    if len(content) <= limit:
        return content
    return content[:limit] + "\n\n...(内容过长，已截取)"


def build_knowledge_tree(nodes: list[KnowledgeNode]) -> list[dict]:
    node_map: dict[int, dict] = {}
    for node in nodes:
        node_map[node.id] = {
            "id": node.id,
            "node_name": node.node_name,
            "node_content": node.node_content,
            "parent_id": node.parent_id,
            "children": [],
        }
    for node in node_map.values():
        parent_id = node["parent_id"]
        if parent_id and parent_id in node_map:
            node_map[parent_id]["children"].append(node)
    return [node for node in node_map.values() if not node["parent_id"]]


def build_knowledge_tree_text(nodes: list[dict], level: int = 0) -> str:
    lines: list[str] = []
    for node in nodes:
        indent = "  " * level
        label = node["node_name"]
        if node.get("node_content"):
            label = f"{label}：{node['node_content']}"
        lines.append(f"{indent}- {label}")
        if node.get("children"):
            lines.append(build_knowledge_tree_text(node["children"], level + 1))
    return "\n".join([line for line in lines if line])


def parse_ai_grading_response(text: str) -> tuple[Optional[float], Optional[str], str]:
    raw = (text or "").strip()
    if not raw:
        return None, None, raw
    try:
        data = json.loads(raw)
        score = data.get("score")
        comment = data.get("comment")
        return score, comment, raw
    except Exception:
        pass
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if json_match:
        try:
            data = json.loads(json_match.group(0))
            score = data.get("score")
            comment = data.get("comment")
            return score, comment, raw
        except Exception:
            pass
    score_match = re.search(r"(\d{1,3}(?:\.\d+)?)", raw)
    score = float(score_match.group(1)) if score_match else None
    return score, raw, raw

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


@router.get("/homeworks/courses")
async def get_teacher_homework_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")
    
    teacher_profile_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_profile_result.scalars().first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    relation_result = await db.execute(
        select(Course)
        .join(ClassCourseRelation, Course.id == ClassCourseRelation.course_id)
        .where(ClassCourseRelation.teacher_id == teacher_profile.id)
    )
    relation_courses = relation_result.scalars().all()
    
    main_teacher_result = await db.execute(
        select(Course).where(Course.main_teacher_id == current_user.id)
    )
    main_teacher_courses = main_teacher_result.scalars().all()
    
    course_map = {}
    for course in relation_courses + main_teacher_courses:
        course_map[course.id] = course
    
    return [
        {
            "id": course.id,
            "title": course.title,
        }
        for course in course_map.values()
    ]


@router.get("/homeworks/submissions")
async def get_teacher_homework_submissions(
    skip: int = 0,
    limit: int = 20,
    course_id: Optional[int] = None,
    student_no: Optional[str] = None,
    student_name: Optional[str] = None,
    homework_title: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")
    
    teacher_profile_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_profile_result.scalars().first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    parent_chapter = aliased(CourseChapter)
    
    base_query = (
        select(
            StudentHomeworkSubmission,
            CourseSectionHomework,
            CourseChapter,
            parent_chapter,
            Course,
            User,
            StudentProfile,
        )
        .select_from(StudentHomeworkSubmission)
        .join(CourseSectionHomework, StudentHomeworkSubmission.homework_id == CourseSectionHomework.id)
        .join(CourseChapter, StudentHomeworkSubmission.chapter_id == CourseChapter.id)
        .outerjoin(parent_chapter, CourseChapter.parent_id == parent_chapter.id)
        .join(Course, StudentHomeworkSubmission.course_id == Course.id)
        .join(User, StudentHomeworkSubmission.student_id == User.id)
        .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
        .outerjoin(
            ClassCourseRelation,
            and_(
                ClassCourseRelation.course_id == Course.id,
                ClassCourseRelation.class_id == StudentProfile.class_id,
            ),
        )
    )
    
    conditions = [
        StudentHomeworkSubmission.status != 'draft',
        or_(
            ClassCourseRelation.teacher_id == teacher_profile.id,
            Course.main_teacher_id == current_user.id,
        ),
    ]
    
    if status in {"submitted", "graded"}:
        conditions.append(StudentHomeworkSubmission.status == status)
    if course_id:
        conditions.append(StudentHomeworkSubmission.course_id == course_id)
    if student_no:
        conditions.append(StudentProfile.student_no.ilike(f"%{student_no}%"))
    if student_name:
        conditions.append(
            or_(
                User.full_name.ilike(f"%{student_name}%"),
                User.username.ilike(f"%{student_name}%"),
            )
        )
    if homework_title:
        conditions.append(CourseSectionHomework.title.ilike(f"%{homework_title}%"))
    
    total_result = await db.execute(
        select(func.count(func.distinct(StudentHomeworkSubmission.id)))
        .select_from(StudentHomeworkSubmission)
        .join(CourseSectionHomework, StudentHomeworkSubmission.homework_id == CourseSectionHomework.id)
        .join(CourseChapter, StudentHomeworkSubmission.chapter_id == CourseChapter.id)
        .join(Course, StudentHomeworkSubmission.course_id == Course.id)
        .join(User, StudentHomeworkSubmission.student_id == User.id)
        .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
        .outerjoin(
            ClassCourseRelation,
            and_(
                ClassCourseRelation.course_id == Course.id,
                ClassCourseRelation.class_id == StudentProfile.class_id,
            ),
        )
        .where(and_(*conditions))
    )
    total = total_result.scalar() or 0
    
    result = await db.execute(
        base_query.where(and_(*conditions))
        .order_by(desc(StudentHomeworkSubmission.submitted_at))
        .offset(skip)
        .limit(limit)
    )
    rows = result.all()
    
    items = []
    for submission, homework, chapter, parent, course, student, profile in rows:
        items.append({
            "id": submission.id,
            "homework_id": homework.id,
            "homework_title": homework.title,
            "course_id": course.id,
            "course_title": course.title,
            "chapter_title": chapter.title,
            "parent_chapter_title": parent.title if parent else None,
            "student_id": student.id,
            "student_name": student.full_name or student.username,
            "student_no": profile.student_no if profile else None,
            "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
            "status": submission.status,
            "score": submission.score,
        })
    
    return {
        "items": items,
        "total": total,
    }


@router.get("/homeworks/submissions/{submission_id}")
async def get_teacher_homework_submission_detail(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")
    
    teacher_profile_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_profile_result.scalars().first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    submission_result = await db.execute(
        select(StudentHomeworkSubmission)
        .options(selectinload(StudentHomeworkSubmission.attachments))
        .where(StudentHomeworkSubmission.id == submission_id)
    )
    submission = submission_result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    course_result = await db.execute(
        select(Course).where(Course.id == submission.course_id)
    )
    course = course_result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    student_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == submission.student_id)
    )
    student_profile = student_profile_result.scalars().first()
    
    if course.main_teacher_id != current_user.id:
        if not student_profile or not student_profile.class_id:
            raise HTTPException(status_code=403, detail="No permission to access this submission")
        relation_result = await db.execute(
            select(ClassCourseRelation).where(
                ClassCourseRelation.course_id == course.id,
                ClassCourseRelation.class_id == student_profile.class_id,
                ClassCourseRelation.teacher_id == teacher_profile.id,
            )
        )
        if not relation_result.scalars().first():
            raise HTTPException(status_code=403, detail="No permission to access this submission")
    
    student_result = await db.execute(
        select(User).where(User.id == submission.student_id)
    )
    student = student_result.scalars().first()
    
    homework_result = await db.execute(
        select(CourseSectionHomework)
        .options(selectinload(CourseSectionHomework.attachments))
        .where(CourseSectionHomework.id == submission.homework_id)
    )
    homework = homework_result.scalars().first()
    
    chapter_result = await db.execute(
        select(CourseChapter).where(CourseChapter.id == submission.chapter_id)
    )
    chapter = chapter_result.scalars().first()
    
    parent_title = None
    if chapter and chapter.parent_id:
        parent_result = await db.execute(
            select(CourseChapter).where(CourseChapter.id == chapter.parent_id)
        )
        parent = parent_result.scalars().first()
        parent_title = parent.title if parent else None
    
    attachments = [
        {
            "id": att.id,
            "file_name": att.file_name,
            "file_url": att.file_url,
            "file_size": att.file_size,
            "file_type": att.file_type,
        }
        for att in (submission.attachments or [])
    ]
    
    homework_attachments = []
    if homework and homework.attachments:
        for att in homework.attachments:
            homework_attachments.append({
                "id": att.id,
                "file_name": att.file_name,
                "file_url": att.file_url,
                "file_size": att.file_size,
                "file_type": att.file_type,
            })
    
    return {
        "id": submission.id,
        "content": submission.content,
        "status": submission.status,
        "score": submission.score,
        "teacher_comment": submission.teacher_comment,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
        "student": {
            "id": student.id if student else submission.student_id,
            "name": student.full_name or student.username if student else None,
            "student_no": student_profile.student_no if student_profile else None,
        },
        "course": {
            "id": course.id,
            "title": course.title,
        },
        "chapter": {
            "id": chapter.id if chapter else submission.chapter_id,
            "title": chapter.title if chapter else None,
            "parent_title": parent_title,
        },
        "homework": {
            "id": homework.id if homework else submission.homework_id,
            "title": homework.title if homework else None,
            "description": homework.description if homework else None,
            "deadline": homework.deadline.isoformat() if homework and homework.deadline else None,
        },
        "attachments": attachments,
        "homework_attachments": homework_attachments,
    }


@router.post("/homeworks/submissions/{submission_id}/grade")
async def grade_homework_submission(
    submission_id: int,
    data: HomeworkGradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")
    
    if data.score < 0:
        raise HTTPException(status_code=400, detail="Score must be greater than or equal to 0")
    
    teacher_profile_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_profile_result.scalars().first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    submission_result = await db.execute(
        select(StudentHomeworkSubmission).where(StudentHomeworkSubmission.id == submission_id)
    )
    submission = submission_result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    course_result = await db.execute(
        select(Course).where(Course.id == submission.course_id)
    )
    course = course_result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    student_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == submission.student_id)
    )
    student_profile = student_profile_result.scalars().first()
    
    if course.main_teacher_id != current_user.id:
        if not student_profile or not student_profile.class_id:
            raise HTTPException(status_code=403, detail="No permission to access this submission")
        relation_result = await db.execute(
            select(ClassCourseRelation).where(
                ClassCourseRelation.course_id == course.id,
                ClassCourseRelation.class_id == student_profile.class_id,
                ClassCourseRelation.teacher_id == teacher_profile.id,
            )
        )
        if not relation_result.scalars().first():
            raise HTTPException(status_code=403, detail="No permission to access this submission")
    
    if submission.status == 'draft':
        raise HTTPException(status_code=400, detail="Homework is not submitted yet")
    
    now = datetime.utcnow()
    submission.score = data.score
    submission.teacher_comment = data.teacher_comment
    submission.status = 'graded'
    submission.graded_at = now
    submission.updated_at = now
    
    history = StudentHomeworkGradeHistory(
        submission_id=submission.id,
        teacher_id=current_user.id,
        score=data.score,
        teacher_comment=data.teacher_comment,
        graded_at=now,
    )
    db.add(history)
    
    await db.commit()
    await db.refresh(submission)
    
    return {
        "id": submission.id,
        "status": submission.status,
        "score": submission.score,
        "teacher_comment": submission.teacher_comment,
        "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
    }


@router.get("/homeworks/submissions/{submission_id}/history")
async def get_homework_submission_history(
    submission_id: int,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")
    
    teacher_profile_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_profile_result.scalars().first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    submission_result = await db.execute(
        select(StudentHomeworkSubmission).where(StudentHomeworkSubmission.id == submission_id)
    )
    submission = submission_result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    course_result = await db.execute(
        select(Course).where(Course.id == submission.course_id)
    )
    course = course_result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    student_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == submission.student_id)
    )
    student_profile = student_profile_result.scalars().first()
    
    if course.main_teacher_id != current_user.id:
        if not student_profile or not student_profile.class_id:
            raise HTTPException(status_code=403, detail="No permission to access this submission")
        relation_result = await db.execute(
            select(ClassCourseRelation).where(
                ClassCourseRelation.course_id == course.id,
                ClassCourseRelation.class_id == student_profile.class_id,
                ClassCourseRelation.teacher_id == teacher_profile.id,
            )
        )
        if not relation_result.scalars().first():
            raise HTTPException(status_code=403, detail="No permission to access this submission")
    
    total_result = await db.execute(
        select(func.count(StudentHomeworkGradeHistory.id)).where(
            StudentHomeworkGradeHistory.submission_id == submission_id
        )
    )
    total = total_result.scalar() or 0
    
    history_result = await db.execute(
        select(StudentHomeworkGradeHistory, User)
        .join(User, StudentHomeworkGradeHistory.teacher_id == User.id)
        .where(StudentHomeworkGradeHistory.submission_id == submission_id)
        .order_by(desc(StudentHomeworkGradeHistory.graded_at))
        .offset(skip)
        .limit(limit)
    )
    rows = history_result.all()
    
    items = []
    for history, teacher in rows:
        items.append({
            "id": history.id,
            "score": history.score,
            "teacher_comment": history.teacher_comment,
            "graded_at": history.graded_at.isoformat() if history.graded_at else None,
            "teacher_id": teacher.id,
            "teacher_name": teacher.full_name or teacher.username,
        })
    
    return {
        "total": total,
        "items": items,
    }


@router.post("/homeworks/submissions/{submission_id}/ai-grade")
async def ai_grade_homework_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="Only teachers can access this endpoint")

    teacher_profile_result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == current_user.id)
    )
    teacher_profile = teacher_profile_result.scalars().first()
    if not teacher_profile:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    submission_result = await db.execute(
        select(StudentHomeworkSubmission)
        .options(selectinload(StudentHomeworkSubmission.attachments))
        .where(StudentHomeworkSubmission.id == submission_id)
    )
    submission = submission_result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    course_result = await db.execute(
        select(Course).where(Course.id == submission.course_id)
    )
    course = course_result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == submission.student_id)
    )
    student_profile = student_profile_result.scalars().first()

    if course.main_teacher_id != current_user.id:
        if not student_profile or not student_profile.class_id:
            raise HTTPException(status_code=403, detail="No permission to access this submission")
        relation_result = await db.execute(
            select(ClassCourseRelation).where(
                ClassCourseRelation.course_id == course.id,
                ClassCourseRelation.class_id == student_profile.class_id,
                ClassCourseRelation.teacher_id == teacher_profile.id,
            )
        )
        if not relation_result.scalars().first():
            raise HTTPException(status_code=403, detail="No permission to access this submission")

    if submission.status == 'draft':
        raise HTTPException(status_code=400, detail="Homework is not submitted yet")

    homework_result = await db.execute(
        select(CourseSectionHomework)
        .options(selectinload(CourseSectionHomework.attachments))
        .where(CourseSectionHomework.id == submission.homework_id)
    )
    homework = homework_result.scalars().first()

    chapter_result = await db.execute(
        select(CourseChapter).where(CourseChapter.id == submission.chapter_id)
    )
    chapter = chapter_result.scalars().first()

    chapter_title = chapter.title if chapter else None

    resources_result = await db.execute(
        select(CourseSectionResource).where(CourseSectionResource.chapter_id == submission.chapter_id)
    )
    resources = resources_result.scalars().all()

    resource_contents: list[str] = []
    for resource in resources:
        if resource.resource_type == "teaching_resource":
            res_result = await db.execute(
                select(TeachingResource).where(TeachingResource.id == resource.resource_id)
            )
            teaching_resource = res_result.scalars().first()
            if teaching_resource:
                if teaching_resource.pdf_path and teaching_resource.pdf_conversion_status == 'success':
                    file_url = teaching_resource.pdf_path
                    file_type = "pdf"
                else:
                    file_url = teaching_resource.file_path
                    file_type = teaching_resource.resource_type
                try:
                    content = await download_and_parse_file_url(
                        file_url=file_url,
                        resource_type=file_type,
                        original_filename=teaching_resource.original_filename,
                    )
                except Exception as e:
                    content = f"[资源解析失败: {teaching_resource.resource_name}, {str(e)}]"
                resource_contents.append(f"教学资源：{teaching_resource.resource_name}\n{truncate_text(content, 12000)}")
        elif resource.resource_type == "reference_material":
            res_result = await db.execute(
                select(ReferenceMaterial).where(ReferenceMaterial.id == resource.resource_id)
            )
            reference_material = res_result.scalars().first()
            if reference_material:
                if reference_material.resource_type in {"link", "hyperlink"}:
                    link_info = reference_material.link_url or ""
                    content = f"[链接] {link_info}"
                else:
                    file_url = reference_material.file_path or ""
                    file_type = normalize_resource_type(reference_material.original_filename, reference_material.resource_type)
                    try:
                        content = await download_and_parse_file_url(
                            file_url=file_url,
                            resource_type=file_type,
                            original_filename=reference_material.original_filename,
                        )
                    except Exception as e:
                        content = f"[资源解析失败: {reference_material.resource_name}, {str(e)}]"
                resource_contents.append(f"参考资料：{reference_material.resource_name}\n{truncate_text(content, 12000)}")

    knowledge_graph_text = ""
    kg_link_result = await db.execute(
        select(CourseChapterKnowledgeGraph).where(CourseChapterKnowledgeGraph.chapter_id == submission.chapter_id)
    )
    kg_link = kg_link_result.scalars().first()
    if kg_link:
        kg_result = await db.execute(
            select(KnowledgeGraph).where(KnowledgeGraph.id == kg_link.knowledge_graph_id)
        )
        knowledge_graph = kg_result.scalars().first()
        if knowledge_graph:
            nodes_result = await db.execute(
                select(KnowledgeNode).where(KnowledgeNode.graph_id == knowledge_graph.id)
            )
            nodes = nodes_result.scalars().all()
            if kg_link.knowledge_node_id:
                target_nodes = [node for node in nodes if node.id == kg_link.knowledge_node_id]
                if target_nodes:
                    node_map = {node.id: node for node in nodes}
                    def collect_subtree(node_id: int) -> list[KnowledgeNode]:
                        subtree = []
                        for node in nodes:
                            if node.parent_id == node_id:
                                subtree.append(node)
                                subtree.extend(collect_subtree(node.id))
                        return subtree
                    subtree_nodes = [target_nodes[0]] + collect_subtree(target_nodes[0].id)
                    nodes = subtree_nodes
            tree = build_knowledge_tree(nodes)
            knowledge_graph_text = f"{knowledge_graph.graph_name}\n{build_knowledge_tree_text(tree)}"

    attachment_texts: list[str] = []
    for attachment in (submission.attachments or []):
        file_type = normalize_resource_type(attachment.file_name, attachment.file_type)
        try:
            attachment_content = await download_and_parse_file_url(
                file_url=attachment.file_url,
                resource_type=file_type,
                original_filename=attachment.file_name,
            )
        except Exception as e:
            attachment_content = f"[附件解析失败: {attachment.file_name}, {str(e)}]"
        attachment_texts.append(f"附件：{attachment.file_name}\n{truncate_text(attachment_content, 8000)}")

    prompt = "\n".join([
        "你是一名严格且友善的教师，请根据以下信息进行AI辅助批改。",
        "请输出JSON格式结果：{\"score\": 0-100之间的数字, \"comment\": \"评语\"}",
        "",
        f"课程：{course.title}",
        f"章节：{chapter_title or ''}",
        f"作业标题：{homework.title if homework else ''}",
        f"作业说明：{truncate_text(homework.description if homework else '', 2000)}",
        "",
        "章节资源内容：",
        truncate_text("\n\n".join(resource_contents) if resource_contents else "无", 30000),
        "",
        "章节知识图谱内容：",
        truncate_text(knowledge_graph_text or "无", 10000),
        "",
        "学生提交内容：",
        truncate_text(submission.content or "无", 12000),
        "",
        "学生附件解析：",
        truncate_text("\n\n".join(attachment_texts) if attachment_texts else "无", 20000),
    ])

    llm_result = await db.execute(
        select(LLMConfig).where(LLMConfig.is_active == True).limit(1)
    )
    llm_config = llm_result.scalars().first()
    if not llm_config:
        raise HTTPException(status_code=503, detail="系统未配置大模型服务")

    # 记录LLM调用
    ai_response = None
    try:
        async with log_llm_call(
            db=db,
            function_type="ai_grade_homework",
            user_id=current_user.id,
            user_role=current_user.role,
            llm_config_id=llm_config.id,
            prompt=prompt,
            related_id=submission.id,
            related_type="homework_submission"
        ) as log_context:
            try:
                if llm_config.provider_key == "aliyun_qwen":
                    ai_response = await call_aliyun_qwen(llm_config, prompt)
                else:
                    ai_response = await call_openai_compatible(llm_config, prompt)
                log_context.set_result(ai_response, status='success')
            except Exception as e:
                logger.error(f"AI批改调用失败: {str(e)}", exc_info=True)
                log_context.set_result(None, status='failed', error_message=str(e))
                raise HTTPException(status_code=500, detail=f"AI批改服务调用失败: {str(e)}")
    except HTTPException:
        # 重新抛出HTTPException，让全局异常处理器处理CORS
        raise
    except Exception as e:
        # 处理其他未预期的异常
        logger.error(f"AI批改过程中发生未预期错误: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI批改服务异常: {str(e)}")

    if not ai_response:
        raise HTTPException(status_code=500, detail="AI批改服务未返回有效结果")

    score, comment, raw = parse_ai_grading_response(ai_response)
    if score is not None:
        score = max(0.0, min(100.0, float(score)))

    log = StudentHomeworkAIGradingLog(
        submission_id=submission.id,
        teacher_id=current_user.id,
        llm_config_id=llm_config.id if llm_config else None,
        prompt=prompt,
        result=raw,
        score=score,
        comment=comment,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    return {
        "score": score,
        "feedback": comment,  # 使用feedback字段名匹配前端
        "raw_result": raw,  # 添加raw_result字段
        "log_id": log.id,
    }
