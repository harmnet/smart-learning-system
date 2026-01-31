from typing import Any, Dict, List, Optional
from datetime import datetime
import json
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, func, select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.db.session import get_db
from app.models.base import Course, Class, ClassCourseRelation, StudentProfile, TeacherProfile, User
from app.models.student_learning import StudentExamScore, StudentLearningBehavior, StudentImportedExamScore, CourseGrade, CourseGradePublishHistory
from app.models.llm_config import LLMConfig
from app.api.v1.endpoints.students import get_current_user
from app.utils.import_utils import parse_excel_file, generate_excel_template
from app.utils.llm_call_logger import log_llm_call
from app.api.v1.endpoints.learning_profile import call_llm_api

router = APIRouter()


class GradeComponent(BaseModel):
    key: str
    name: str
    weight: float
    enabled: bool = True


class GradeCompositionUpdate(BaseModel):
    components: List[GradeComponent]


class PublishRequest(BaseModel):
    scope: str
    class_id: Optional[int] = None
    student_ids: Optional[List[int]] = None
    remark: Optional[str] = None


class AIScoreRequest(BaseModel):
    student_id: int


DEFAULT_COMPONENTS = [
    {"key": "quiz", "name": "平时测验", "weight": 40, "enabled": True},
    {"key": "learning", "name": "学习数据", "weight": 20, "enabled": True},
    {"key": "midterm", "name": "期中考试", "weight": 20, "enabled": True},
    {"key": "final", "name": "期末考试", "weight": 20, "enabled": True}
]


async def get_teacher_profile(db: AsyncSession, user_id: int) -> TeacherProfile:
    result = await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == user_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="教师档案不存在")
    return profile


async def get_course_access(
    db: AsyncSession,
    course_id: int,
    teacher_profile: TeacherProfile,
    current_user: User
) -> Dict[str, Any]:
    course_result = await db.execute(select(Course).where(Course.id == course_id))
    course = course_result.scalars().first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")

    relation_query = select(ClassCourseRelation).where(
        ClassCourseRelation.course_id == course_id
    )
    relations_result = await db.execute(relation_query)
    relations = relations_result.scalars().all()

    has_relation = any(r.teacher_id == teacher_profile.id for r in relations)
    is_main_teacher = course.main_teacher_id == current_user.id

    if not has_relation and not is_main_teacher:
        raise HTTPException(status_code=403, detail="无权限访问该课程")

    return {"course": course, "relations": relations, "is_main_teacher": is_main_teacher}


def normalize_components(components: List[GradeComponent]) -> List[Dict[str, Any]]:
    normalized = []
    for item in components:
        normalized.append({
            "key": item.key,
            "name": item.name,
            "weight": float(item.weight),
            "enabled": bool(item.enabled)
        })
    return normalized


def get_course_composition(course: Course) -> Dict[str, Any]:
    if course.grade_composition and isinstance(course.grade_composition, dict):
        components = course.grade_composition.get("components")
        if components:
            return {"components": components}
    return {"components": DEFAULT_COMPONENTS}


def calculate_total_score(components: List[Dict[str, Any]], scores: Dict[str, Optional[float]]) -> float:
    total = 0.0
    for component in components:
        if not component.get("enabled", True):
            continue
        key = component.get("key")
        weight = float(component.get("weight", 0))
        score = scores.get(key)
        if score is None:
            continue
        total += float(score) * weight / 100
    return round(total, 2)


@router.get("/courses")
async def list_teacher_courses(
    search: Optional[str] = None,
    class_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    teacher_profile = await get_teacher_profile(db, current_user.id)

    relation_query = select(ClassCourseRelation).where(
        ClassCourseRelation.teacher_id == teacher_profile.id
    )
    if class_id:
        relation_query = relation_query.where(ClassCourseRelation.class_id == class_id)
    relation_result = await db.execute(relation_query)
    relations = relation_result.scalars().all()

    course_ids = {relation.course_id for relation in relations if relation.course_id}
    class_ids = {relation.class_id for relation in relations if relation.class_id}

    main_course_result = await db.execute(
        select(Course.id).where(
            and_(Course.main_teacher_id == current_user.id, Course.is_deleted == False)
        )
    )
    main_course_ids = {row[0] for row in main_course_result.fetchall()}
    all_course_ids = list(course_ids.union(main_course_ids))

    if not all_course_ids:
        return []

    course_query = select(Course).options(
        selectinload(Course.covers)
    ).where(Course.id.in_(all_course_ids), Course.is_deleted == False)
    if search:
        course_query = course_query.where(Course.title.ilike(f"%{search}%"))
    course_result = await db.execute(course_query)
    courses = course_result.scalars().all()
    
    classes: Dict[int, Class] = {}
    if class_ids:
        class_result = await db.execute(select(Class).where(Class.id.in_(class_ids)))
        classes = {item.id: item for item in class_result.scalars().all()}

    student_count_map: Dict[int, int] = {}
    if class_ids:
        count_result = await db.execute(
            select(StudentProfile.class_id, func.count(StudentProfile.id))
            .where(StudentProfile.class_id.in_(class_ids))
            .group_by(StudentProfile.class_id)
        )
        student_count_map = {row[0]: int(row[1]) for row in count_result.fetchall()}

    course_items = []
    for course in courses:
        related_class_ids = [
            relation.class_id for relation in relations if relation.course_id == course.id and relation.class_id
        ]
        class_info = [{
            "id": cid,
            "name": classes[cid].name if cid in classes else None,
            "student_count": student_count_map.get(cid, 0)
        } for cid in related_class_ids]
        course_items.append({
            "id": course.id,
            "title": course.title,
            "code": course.code,
            "grade_composition": get_course_composition(course),
            "class_list": class_info,
            "student_count": sum(item["student_count"] for item in class_info)
        })

    return course_items


@router.get("/courses/{course_id}/composition")
async def get_course_grade_composition(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    access = await get_course_access(db, course_id, teacher_profile, current_user)
    course = access["course"]

    return get_course_composition(course)


@router.put("/courses/{course_id}/composition")
async def update_course_grade_composition(
    course_id: int,
    payload: GradeCompositionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    access = await get_course_access(db, course_id, teacher_profile, current_user)
    course = access["course"]

    components = normalize_components(payload.components)
    enabled_sum = sum(item["weight"] for item in components if item.get("enabled", True))
    if enabled_sum > 0 and abs(enabled_sum - 100) > 0.01:
        raise HTTPException(status_code=400, detail="启用项权重合计必须为100")

    course.grade_composition = {
        "components": components,
        "updated_at": datetime.utcnow().isoformat()
    }
    await db.commit()
    await db.refresh(course)

    return get_course_composition(course)


@router.get("/courses/{course_id}/students")
async def list_course_students(
    course_id: int,
    class_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    access = await get_course_access(db, course_id, teacher_profile, current_user)
    course = access["course"]
    relations = access["relations"]
    is_main_teacher = access["is_main_teacher"]

    if is_main_teacher:
        relation_query = select(ClassCourseRelation).where(ClassCourseRelation.course_id == course_id)
        relation_result = await db.execute(relation_query)
        relations = relation_result.scalars().all()
    else:
        relations = [rel for rel in relations if rel.teacher_id == teacher_profile.id]

    class_ids = {relation.class_id for relation in relations if relation.class_id}
    if class_id:
        if class_id not in class_ids:
            raise HTTPException(status_code=403, detail="班级不在该教师授课范围内")
        class_ids = {class_id}

    if not class_ids:
        return {"course_id": course_id, "students": []}

    student_query = select(StudentProfile, User, Class).join(
        User, StudentProfile.user_id == User.id
    ).join(
        Class, StudentProfile.class_id == Class.id
    ).where(
        StudentProfile.class_id.in_(class_ids),
        User.is_active == True,
        User.role == "student"
    )
    student_result = await db.execute(student_query)
    student_rows = student_result.all()
    student_ids = [row[0].user_id for row in student_rows]

    composition = get_course_composition(course)["components"]

    quiz_map: Dict[int, float] = {}
    if student_ids:
        quiz_result = await db.execute(
            select(
                StudentExamScore.student_id,
                func.avg(StudentExamScore.score / func.nullif(StudentExamScore.total_score, 0) * 100)
            )
            .where(
                StudentExamScore.course_id == course_id,
                StudentExamScore.is_submitted == True,
                StudentExamScore.student_id.in_(student_ids)
            )
            .group_by(StudentExamScore.student_id)
        )
        quiz_map = {row[0]: float(row[1]) if row[1] is not None else None for row in quiz_result.fetchall()}

    grade_result = await db.execute(
        select(CourseGrade).where(
            CourseGrade.course_id == course_id,
            CourseGrade.student_id.in_(student_ids)
        )
    )
    grade_map = {item.student_id: item for item in grade_result.scalars().all()}

    imported_result = await db.execute(
        select(StudentImportedExamScore).where(
            StudentImportedExamScore.course_id == course_id,
            StudentImportedExamScore.student_id.in_(student_ids)
        )
    )
    imported_map: Dict[int, Dict[str, float]] = {}
    for item in imported_result.scalars().all():
        imported_map.setdefault(item.student_id, {})[item.exam_type] = float(item.score)

    students = []
    for profile, user, class_info in student_rows:
        grade = grade_map.get(profile.user_id)
        breakdown = grade.breakdown if grade and isinstance(grade.breakdown, dict) else {}
        component_scores = {
            "quiz": breakdown.get("quiz", {}).get("score") if breakdown.get("quiz") else quiz_map.get(profile.user_id),
            "learning": breakdown.get("learning", {}).get("score") if breakdown.get("learning") else None,
            "midterm": imported_map.get(profile.user_id, {}).get("midterm") or breakdown.get("midterm", {}).get("score") if breakdown.get("midterm") else None,
            "final": imported_map.get(profile.user_id, {}).get("final") or breakdown.get("final", {}).get("score") if breakdown.get("final") else None
        }
        total_score = calculate_total_score(composition, component_scores)
        students.append({
            "student_id": profile.user_id,
            "student_no": profile.student_no,
            "student_name": user.full_name or user.username,
            "class_id": class_info.id,
            "class_name": class_info.name,
            "scores": component_scores,
            "total_score": total_score,
            "is_published": grade.is_published if grade else False,
            "published_at": grade.published_at.isoformat() if grade and grade.published_at else None,
            "learning_ai_result": breakdown.get("learning", {}).get("ai_result") if breakdown.get("learning") else None
        })

    return {
        "course_id": course_id,
        "composition": composition,
        "students": students
    }


@router.post("/courses/{course_id}/learning-ai-score")
async def calculate_learning_ai_score(
    course_id: int,
    payload: AIScoreRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    access = await get_course_access(db, course_id, teacher_profile, current_user)
    course = access["course"]

    student_result = await db.execute(
        select(User, StudentProfile)
        .join(StudentProfile, StudentProfile.user_id == User.id)
        .where(User.id == payload.student_id)
    )
    student_row = student_result.first()
    if not student_row:
        raise HTTPException(status_code=404, detail="学生不存在")
    student_user, student_profile = student_row

    behavior_result = await db.execute(
        select(
            func.coalesce(func.sum(StudentLearningBehavior.duration_seconds), 0),
            func.count(StudentLearningBehavior.id),
            func.max(StudentLearningBehavior.created_at)
        )
        .where(
            StudentLearningBehavior.course_id == course_id,
            StudentLearningBehavior.student_id == payload.student_id
        )
    )
    total_seconds, study_count, last_active = behavior_result.first()
    total_minutes = round(float(total_seconds or 0) / 60, 2)
    last_active_str = last_active.isoformat() if last_active else "无"

    llm_result = await db.execute(
        select(LLMConfig).where(LLMConfig.is_active == True).limit(1)
    )
    llm_config = llm_result.scalars().first()
    if not llm_config:
        raise HTTPException(status_code=503, detail="系统未配置大模型服务")

    prompt = (
        "你是课程教师评分助手，请根据学习数据给出学习表现评分。\n"
        "请严格输出JSON格式，字段为 score（0-100数字）和 reason（简短中文）。\n"
        f"课程：{course.title}\n"
        f"学生：{student_user.full_name or student_user.username}\n"
        f"学习时长（分钟）：{total_minutes}\n"
        f"学习次数：{study_count}\n"
        f"最近学习时间：{last_active_str}\n"
    )

    ai_response = None
    async with log_llm_call(
        db=db,
        function_type="grade_learning_ai",
        user_id=current_user.id,
        user_role=current_user.role,
        llm_config_id=llm_config.id,
        prompt=prompt,
        related_id=course_id,
        related_type="course_grade"
    ) as log_context:
        try:
            ai_response = await call_llm_api(llm_config, prompt)
            log_context.set_result(ai_response, status="success")
        except Exception as e:
            log_context.set_result(None, status="failed", error_message=str(e))
            raise HTTPException(status_code=500, detail=str(e))

    score_value = None
    try:
        parsed = json.loads(ai_response.strip())
        score_value = float(parsed.get("score"))
        reason = parsed.get("reason")
    except Exception:
        match = re.search(r"(\d{1,3}(\.\d+)?)", ai_response or "")
        score_value = float(match.group(1)) if match else None
        reason = None

    if score_value is None:
        raise HTTPException(status_code=500, detail="无法解析AI评分结果")
    score_value = max(0, min(100, score_value))

    grade_result = await db.execute(
        select(CourseGrade).where(
            CourseGrade.course_id == course_id,
            CourseGrade.student_id == payload.student_id
        )
    )
    grade = grade_result.scalars().first()
    if not grade:
        grade = CourseGrade(
            course_id=course_id,
            student_id=payload.student_id
        )
        db.add(grade)

    breakdown = grade.breakdown if grade.breakdown and isinstance(grade.breakdown, dict) else {}
    breakdown["learning"] = {
        "score": score_value,
        "ai_result": ai_response,
        "reason": reason,
        "metrics": {
            "study_minutes": total_minutes,
            "study_count": int(study_count),
            "last_active": last_active_str
        }
    }
    grade.breakdown = breakdown
    grade.final_score = score_value
    grade.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(grade)

    return {
        "student_id": payload.student_id,
        "score": score_value,
        "reason": reason,
        "raw_response": ai_response
    }


@router.get("/courses/{course_id}/import/template")
async def download_import_template(
    course_id: int,
    exam_type: str = Query("midterm"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    await get_course_access(db, course_id, teacher_profile, current_user)

    if exam_type not in {"midterm", "final"}:
        raise HTTPException(status_code=400, detail="考试类型不支持")

    headers = ["学号", "学生ID", "成绩"]
    content = generate_excel_template(headers)
    filename = f"{exam_type}_scores_template.xlsx"

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.post("/courses/{course_id}/import/{exam_type}")
async def import_exam_scores(
    course_id: int,
    exam_type: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    if exam_type not in {"midterm", "final"}:
        raise HTTPException(status_code=400, detail="考试类型不支持")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    access = await get_course_access(db, course_id, teacher_profile, current_user)
    relations = access["relations"]
    class_ids = {relation.class_id for relation in relations if relation.class_id}

    df = await parse_excel_file(file)
    if "成绩" not in df.columns:
        raise HTTPException(status_code=400, detail="缺少成绩列")
    if "学生ID" not in df.columns and "学号" not in df.columns:
        raise HTTPException(status_code=400, detail="必须包含学生ID或学号列")

    student_result = await db.execute(
        select(StudentProfile).where(StudentProfile.class_id.in_(class_ids))
    )
    students = student_result.scalars().all()
    student_by_no = {item.student_no: item.user_id for item in students if item.student_no}
    student_by_id = {item.user_id: item.user_id for item in students}

    updated = 0
    for _, row in df.iterrows():
        score_value = row.get("成绩")
        if score_value is None:
            continue
        try:
            score_value = float(score_value)
        except Exception:
            continue

        student_id = None
        if "学生ID" in df.columns and row.get("学生ID") is not None:
            try:
                student_id = int(row.get("学生ID"))
            except Exception:
                student_id = None
        if not student_id and "学号" in df.columns:
            student_no = str(row.get("学号")).strip()
            student_id = student_by_no.get(student_no)

        if not student_id or student_id not in student_by_id:
            continue

        existing_result = await db.execute(
            select(StudentImportedExamScore).where(
                StudentImportedExamScore.course_id == course_id,
                StudentImportedExamScore.student_id == student_id,
                StudentImportedExamScore.exam_type == exam_type
            )
        )
        existing = existing_result.scalars().first()
        if existing:
            existing.score = score_value
            existing.imported_at = datetime.utcnow()
        else:
            db.add(StudentImportedExamScore(
                course_id=course_id,
                student_id=student_id,
                exam_type=exam_type,
                score=score_value
            ))
        grade_result = await db.execute(
            select(CourseGrade).where(
                CourseGrade.course_id == course_id,
                CourseGrade.student_id == student_id
            )
        )
        grade = grade_result.scalars().first()
        if not grade:
            grade = CourseGrade(course_id=course_id, student_id=student_id, breakdown={})
            db.add(grade)
        breakdown = grade.breakdown if grade.breakdown and isinstance(grade.breakdown, dict) else {}
        breakdown[exam_type] = {"score": score_value}
        grade.breakdown = breakdown
        grade.updated_at = datetime.utcnow()
        updated += 1

    await db.commit()
    return {"updated": updated}


@router.post("/courses/{course_id}/publish")
async def publish_course_grades(
    course_id: int,
    payload: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    if payload.scope not in {"class", "student"}:
        raise HTTPException(status_code=400, detail="发布维度不支持")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    access = await get_course_access(db, course_id, teacher_profile, current_user)
    relations = access["relations"]
    class_ids = {relation.class_id for relation in relations if relation.class_id}

    target_student_ids: List[int] = []
    if payload.scope == "class":
        if not payload.class_id:
            raise HTTPException(status_code=400, detail="缺少班级ID")
        if payload.class_id not in class_ids:
            raise HTTPException(status_code=403, detail="班级不在授课范围")
        student_result = await db.execute(
            select(StudentProfile.user_id).where(StudentProfile.class_id == payload.class_id)
        )
        target_student_ids = [row[0] for row in student_result.fetchall()]
    else:
        if not payload.student_ids:
            raise HTTPException(status_code=400, detail="缺少学生ID列表")
        target_student_ids = payload.student_ids

    if not target_student_ids:
        return {"updated": 0}

    grade_result = await db.execute(
        select(CourseGrade).where(
            CourseGrade.course_id == course_id,
            CourseGrade.student_id.in_(target_student_ids)
        )
    )
    grade_map = {item.student_id: item for item in grade_result.scalars().all()}

    updated = 0
    for student_id in target_student_ids:
        grade = grade_map.get(student_id)
        if not grade:
            grade = CourseGrade(course_id=course_id, student_id=student_id, breakdown={})
            db.add(grade)
        grade.is_published = True
        grade.published_at = datetime.utcnow()
        updated += 1

        history = CourseGradePublishHistory(
            course_id=course_id,
            class_id=payload.class_id if payload.scope == "class" else None,
            student_id=student_id if payload.scope == "student" else None,
            action="publish",
            scope=payload.scope,
            operator_id=current_user.id,
            remark=payload.remark
        )
        db.add(history)

    await db.commit()
    return {"updated": updated}


@router.post("/courses/{course_id}/unpublish")
async def unpublish_course_grades(
    course_id: int,
    payload: PublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    if payload.scope not in {"class", "student"}:
        raise HTTPException(status_code=400, detail="取消发布维度不支持")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    access = await get_course_access(db, course_id, teacher_profile, current_user)
    relations = access["relations"]
    class_ids = {relation.class_id for relation in relations if relation.class_id}

    target_student_ids: List[int] = []
    if payload.scope == "class":
        if not payload.class_id:
            raise HTTPException(status_code=400, detail="缺少班级ID")
        if payload.class_id not in class_ids:
            raise HTTPException(status_code=403, detail="班级不在授课范围")
        student_result = await db.execute(
            select(StudentProfile.user_id).where(StudentProfile.class_id == payload.class_id)
        )
        target_student_ids = [row[0] for row in student_result.fetchall()]
    else:
        if not payload.student_ids:
            raise HTTPException(status_code=400, detail="缺少学生ID列表")
        target_student_ids = payload.student_ids

    if not target_student_ids:
        return {"updated": 0}

    grade_result = await db.execute(
        select(CourseGrade).where(
            CourseGrade.course_id == course_id,
            CourseGrade.student_id.in_(target_student_ids)
        )
    )
    grade_map = {item.student_id: item for item in grade_result.scalars().all()}

    updated = 0
    for student_id in target_student_ids:
        grade = grade_map.get(student_id)
        if not grade:
            continue
        grade.is_published = False
        grade.published_at = None
        updated += 1

        history = CourseGradePublishHistory(
            course_id=course_id,
            class_id=payload.class_id if payload.scope == "class" else None,
            student_id=student_id if payload.scope == "student" else None,
            action="unpublish",
            scope=payload.scope,
            operator_id=current_user.id,
            remark=payload.remark
        )
        db.add(history)

    await db.commit()
    return {"updated": updated}


@router.get("/courses/{course_id}/publish-history")
async def list_publish_history(
    course_id: int,
    student_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="只有教师可以访问")

    teacher_profile = await get_teacher_profile(db, current_user.id)
    await get_course_access(db, course_id, teacher_profile, current_user)

    history_query = select(CourseGradePublishHistory).where(
        CourseGradePublishHistory.course_id == course_id
    ).order_by(CourseGradePublishHistory.created_at.desc())
    if student_id:
        history_query = history_query.where(CourseGradePublishHistory.student_id == student_id)

    history_result = await db.execute(history_query)
    history_items = history_result.scalars().all()

    class_ids = {item.class_id for item in history_items if item.class_id}
    student_ids = {item.student_id for item in history_items if item.student_id}
    operator_ids = {item.operator_id for item in history_items if item.operator_id}

    class_map: Dict[int, Class] = {}
    if class_ids:
        class_result = await db.execute(select(Class).where(Class.id.in_(class_ids)))
        class_map = {item.id: item for item in class_result.scalars().all()}

    user_ids = list(student_ids.union(operator_ids))
    user_map: Dict[int, User] = {}
    if user_ids:
        user_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        user_map = {item.id: item for item in user_result.scalars().all()}

    history_data = []
    for item in history_items:
        history_data.append({
            "id": item.id,
            "action": item.action,
            "scope": item.scope,
            "class_id": item.class_id,
            "class_name": class_map[item.class_id].name if item.class_id and item.class_id in class_map else None,
            "student_id": item.student_id,
            "student_name": user_map[item.student_id].full_name if item.student_id and item.student_id in user_map else None,
            "operator_id": item.operator_id,
            "operator_name": user_map[item.operator_id].full_name if item.operator_id and item.operator_id in user_map else None,
            "remark": item.remark,
            "created_at": item.created_at.isoformat() if item.created_at else None
        })

    return history_data
