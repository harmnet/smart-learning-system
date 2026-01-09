from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func

from app.db.session import get_db
from app.models.base import Major, Class, StudentProfile, User
from app.models.exam import Exam, ExamStudent
from pydantic import BaseModel

router = APIRouter()

# ============= Schemas =============
class MajorResponse(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    duration_years: int
    
class ClassResponse(BaseModel):
    id: int
    name: str
    major_id: int
    semester: Optional[str] = None
    grade: Optional[str] = None
    code: Optional[str] = None
    student_count: int

class StudentResponse(BaseModel):
    id: int
    student_no: str
    student_name: str
    username: str
    phone: Optional[str] = None
    class_name: Optional[str] = None

class ExamStudentResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    student_no: str
    student_name: str
    class_name: Optional[str] = None
    created_at: str

class BatchStudentsRequest(BaseModel):
    student_ids: List[int]

class BatchRemoveRequest(BaseModel):
    exam_student_ids: List[int]

# ============= API Endpoints =============

@router.get("/majors")
async def get_teacher_majors(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取教师管理的专业"""
    query = select(Major).where(
        and_(
            Major.teacher_id == teacher_id,
            Major.is_active == True
        )
    )
    result = await db.execute(query)
    majors = result.scalars().all()
    
    return [{
        "id": m.id,
        "name": m.name,
        "code": m.code,
        "description": m.description,
        "duration_years": m.duration_years,
    } for m in majors]

@router.get("/majors/{major_id}/classes")
async def get_major_classes(
    major_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取专业下的班级"""
    query = select(Class).where(
        and_(
            Class.major_id == major_id,
            Class.is_active == True
        )
    )
    result = await db.execute(query)
    classes = result.scalars().all()
    
    # 获取每个班级的学生数量
    class_list = []
    for c in classes:
        count_result = await db.execute(
            select(func.count(StudentProfile.id)).where(
                StudentProfile.class_id == c.id
            )
        )
        student_count = count_result.scalar() or 0
        
        class_list.append({
            "id": c.id,
            "name": c.name,
            "major_id": c.major_id,
            "semester": c.semester,
            "grade": c.grade,
            "code": c.code,
            "student_count": student_count,
        })
    
    return class_list

@router.get("/classes/{class_id}/students")
async def get_class_students(
    class_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取班级下的学生"""
    query = select(StudentProfile, User, Class).join(
        User, StudentProfile.user_id == User.id
    ).outerjoin(
        Class, StudentProfile.class_id == Class.id
    ).where(
        StudentProfile.class_id == class_id
    )
    result = await db.execute(query)
    rows = result.all()
    
    students = []
    for sp, u, c in rows:
        students.append({
            "id": sp.id,
            "student_no": sp.student_no,
            "student_name": u.full_name,
            "username": u.username,
            "phone": u.phone,
            "class_name": c.name if c else None,
        })
    
    return students

@router.get("/exams/{exam_id}/students")
async def get_exam_students(
    exam_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取考试的考生列表"""
    # 检查考试是否存在且属于该教师
    exam_result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # 获取考生列表
    query = select(ExamStudent, StudentProfile, User, Class).join(
        StudentProfile, ExamStudent.student_id == StudentProfile.id
    ).join(
        User, StudentProfile.user_id == User.id
    ).outerjoin(
        Class, StudentProfile.class_id == Class.id
    ).where(
        ExamStudent.exam_id == exam_id
    )
    result = await db.execute(query)
    rows = result.all()
    
    exam_students = []
    for es, sp, u, c in rows:
        exam_students.append({
            "id": es.id,
            "exam_id": es.exam_id,
            "student_id": sp.id,
            "student_no": sp.student_no,
            "student_name": u.full_name,
            "class_name": c.name if c else None,
            "created_at": es.created_at.isoformat() if es.created_at else None,
        })
    
    return exam_students

@router.post("/exams/{exam_id}/students/batch")
async def add_students_batch(
    exam_id: int,
    request: BatchStudentsRequest,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量添加学生到考试"""
    # 检查考试是否存在且属于该教师
    exam_result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # 检查学生是否存在
    students_result = await db.execute(
        select(StudentProfile).where(
            StudentProfile.id.in_(request.student_ids)
        )
    )
    students = students_result.scalars().all()
    
    if len(students) != len(request.student_ids):
        raise HTTPException(status_code=400, detail="部分学生不存在")
    
    # 检查学生是否已经在考试中
    existing_result = await db.execute(
        select(ExamStudent).where(
            and_(
                ExamStudent.exam_id == exam_id,
                ExamStudent.student_id.in_(request.student_ids)
            )
        )
    )
    existing = existing_result.scalars().all()
    existing_ids = {es.student_id for es in existing}
    
    # 添加新学生
    added_count = 0
    for student_id in request.student_ids:
        if student_id not in existing_ids:
            es = ExamStudent(
                exam_id=exam_id,
                student_id=student_id
            )
            db.add(es)
            added_count += 1
    
    await db.commit()
    
    return {
        "message": f"成功添加 {added_count} 名考生",
        "added_count": added_count,
        "skipped_count": len(existing_ids)
    }

@router.post("/exams/{exam_id}/students/class/{class_id}")
async def add_class_students(
    exam_id: int,
    class_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """添加整个班级的学生到考试"""
    # 检查考试是否存在且属于该教师
    exam_result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # 获取班级所有学生
    students_result = await db.execute(
        select(StudentProfile).where(
            StudentProfile.class_id == class_id
        )
    )
    students = students_result.scalars().all()
    
    if not students:
        raise HTTPException(status_code=404, detail="班级没有学生")
    
    student_ids = [s.id for s in students]
    
    # 检查学生是否已经在考试中
    existing_result = await db.execute(
        select(ExamStudent).where(
            and_(
                ExamStudent.exam_id == exam_id,
                ExamStudent.student_id.in_(student_ids)
            )
        )
    )
    existing = existing_result.scalars().all()
    existing_ids = {es.student_id for es in existing}
    
    # 添加新学生
    added_count = 0
    for student_id in student_ids:
        if student_id not in existing_ids:
            es = ExamStudent(
                exam_id=exam_id,
                student_id=student_id
            )
            db.add(es)
            added_count += 1
    
    await db.commit()
    
    return {
        "message": f"成功添加 {added_count} 名考生",
        "added_count": added_count,
        "skipped_count": len(existing_ids),
        "total_students": len(students)
    }

@router.delete("/exams/{exam_id}/students/batch")
async def remove_students_batch(
    exam_id: int,
    request: BatchRemoveRequest,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量移除考生"""
    # 检查考试是否存在且属于该教师
    exam_result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = exam_result.scalar_one_or_none()
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # 查找要删除的考生记录
    es_result = await db.execute(
        select(ExamStudent).where(
            and_(
                ExamStudent.exam_id == exam_id,
                ExamStudent.id.in_(request.exam_student_ids)
            )
        )
    )
    exam_students = es_result.scalars().all()
    
    # 删除记录
    removed_count = 0
    for es in exam_students:
        await db.delete(es)
        removed_count += 1
    
    await db.commit()
    
    return {
        "message": f"成功移除 {removed_count} 名考生",
        "removed_count": removed_count
    }

