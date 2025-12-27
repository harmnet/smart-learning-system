from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, func, or_
from pydantic import BaseModel
from datetime import datetime
from pathlib import Path
import uuid
import shutil

from app.db.session import get_db
from app.models.exam import Exam, ExamStudent
from app.models.exam_paper import ExamPaper
from app.models.base import User
from app.models.base import StudentProfile

router = APIRouter()

# 考试封面上传目录
COVER_UPLOAD_DIR = Path("uploads/exam_covers")
COVER_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ============= Schemas =============
class ExamCreate(BaseModel):
    exam_paper_id: int
    exam_name: str
    exam_date: str  # ISO格式日期字符串
    start_time: str  # ISO格式日期时间字符串
    end_time: str  # ISO格式日期时间字符串
    early_login_minutes: int = 15
    late_forbidden_minutes: int = 15

class ExamUpdate(BaseModel):
    exam_paper_id: Optional[int] = None
    exam_name: Optional[str] = None
    exam_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    early_login_minutes: Optional[int] = None
    late_forbidden_minutes: Optional[int] = None

class AddStudentsRequest(BaseModel):
    student_ids: List[int]

# ============= API Endpoints =============
@router.get("/")
async def get_exams(
    teacher_id: int,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,  # not_started, in_progress, ended
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取考试列表"""
    query = select(Exam, ExamPaper, User).join(
        ExamPaper, Exam.exam_paper_id == ExamPaper.id
    ).join(
        User, Exam.teacher_id == User.id
    ).where(
        Exam.is_active == True,
        Exam.teacher_id == teacher_id
    )
    
    if search:
        query = query.where(Exam.exam_name.ilike(f"%{search}%"))
    
    query = query.order_by(Exam.exam_date.desc(), Exam.start_time.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    now = datetime.utcnow()
    exams = []
    for exam, paper, teacher in rows:
        # 计算考试状态
        exam_status = "not_started"
        if exam.start_time <= now <= exam.end_time:
            exam_status = "in_progress"
        elif exam.end_time < now:
            exam_status = "ended"
        
        # 如果指定了状态筛选
        if status and exam_status != status:
            continue
        
        # 获取考生数量
        count_result = await db.execute(
            select(func.count(ExamStudent.id)).where(
                ExamStudent.exam_id == exam.id
            )
        )
        student_count = count_result.scalar() or 0
        
        exams.append({
            "id": exam.id,
            "teacher_id": exam.teacher_id,
            "teacher_name": teacher.full_name,
            "exam_paper_id": exam.exam_paper_id,
            "paper_name": paper.paper_name,
            "exam_name": exam.exam_name,
            "exam_date": exam.exam_date.isoformat() if exam.exam_date else None,
            "start_time": exam.start_time.isoformat() if exam.start_time else None,
            "end_time": exam.end_time.isoformat() if exam.end_time else None,
            "cover_image": exam.cover_image,
            "early_login_minutes": exam.early_login_minutes,
            "late_forbidden_minutes": exam.late_forbidden_minutes,
            "status": exam_status,
            "student_count": student_count,
            "is_active": exam.is_active,
            "created_at": exam.created_at.isoformat() if exam.created_at else None,
            "updated_at": exam.updated_at.isoformat() if exam.updated_at else None,
        })
    
    return exams

@router.get("/{exam_id}")
async def get_exam(
    exam_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取考试详情"""
    result = await db.execute(
        select(Exam, ExamPaper, User).join(
            ExamPaper, Exam.exam_paper_id == ExamPaper.id
        ).join(
            User, Exam.teacher_id == User.id
        ).where(
            Exam.id == exam_id,
            Exam.teacher_id == teacher_id,
            Exam.is_active == True
        )
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    exam, paper, teacher = row
    
    # 获取考生列表
    students_result = await db.execute(
        select(ExamStudent, StudentProfile, User).join(
            StudentProfile, ExamStudent.student_id == StudentProfile.id
        ).join(
            User, StudentProfile.user_id == User.id
        ).where(
            ExamStudent.exam_id == exam_id
        )
    )
    student_rows = students_result.all()
    
    students = []
    for es, sp, u in student_rows:
        students.append({
            "id": es.id,
            "student_id": sp.id,
            "student_no": sp.student_no,
            "student_name": u.full_name,
            "username": u.username,
            "phone": u.phone,
        })
    
    # 计算考试状态
    now = datetime.utcnow()
    exam_status = "not_started"
    if exam.start_time <= now <= exam.end_time:
        exam_status = "in_progress"
    elif exam.end_time < now:
        exam_status = "ended"
    
    return {
        "id": exam.id,
        "teacher_id": exam.teacher_id,
        "teacher_name": teacher.full_name,
        "exam_paper_id": exam.exam_paper_id,
        "paper_name": paper.paper_name,
        "exam_name": exam.exam_name,
        "exam_date": exam.exam_date.isoformat() if exam.exam_date else None,
        "start_time": exam.start_time.isoformat() if exam.start_time else None,
        "end_time": exam.end_time.isoformat() if exam.end_time else None,
        "cover_image": exam.cover_image,
        "early_login_minutes": exam.early_login_minutes,
        "late_forbidden_minutes": exam.late_forbidden_minutes,
        "status": exam_status,
        "students": students,
        "is_active": exam.is_active,
        "created_at": exam.created_at.isoformat() if exam.created_at else None,
        "updated_at": exam.updated_at.isoformat() if exam.updated_at else None,
    }

@router.post("/")
async def create_exam(
    exam_data: ExamCreate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建考试"""
    # 检查试卷是否存在
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == exam_data.exam_paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    # 解析日期时间
    try:
        # exam_date 是 YYYY-MM-DD 格式
        exam_date = datetime.strptime(exam_data.exam_date, '%Y-%m-%d')
        # start_time 和 end_time 是 YYYY-MM-DDTHH:mm:ss 格式
        start_time = datetime.fromisoformat(exam_data.start_time.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(exam_data.end_time.replace('Z', '+00:00'))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"日期时间格式错误: {str(e)}")
    
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail="开始时间必须早于结束时间")
    
    exam = Exam(
        teacher_id=teacher_id,
        exam_paper_id=exam_data.exam_paper_id,
        exam_name=exam_data.exam_name,
        exam_date=exam_date,
        start_time=start_time,
        end_time=end_time,
        early_login_minutes=exam_data.early_login_minutes,
        late_forbidden_minutes=exam_data.late_forbidden_minutes,
        is_active=True
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    
    return {
        "message": "考试创建成功",
        "id": exam.id,
        "exam_name": exam.exam_name
    }

@router.put("/{exam_id}")
async def update_exam(
    exam_id: int,
    exam_data: ExamUpdate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新考试"""
    result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # 更新字段
    if exam_data.exam_paper_id is not None:
        # 检查试卷是否存在
        paper_result = await db.execute(
            select(ExamPaper).where(
                and_(
                    ExamPaper.id == exam_data.exam_paper_id,
                    ExamPaper.teacher_id == teacher_id,
                    ExamPaper.is_active == True
                )
            )
        )
        paper = paper_result.scalar_one_or_none()
        if not paper:
            raise HTTPException(status_code=404, detail="试卷不存在")
        exam.exam_paper_id = exam_data.exam_paper_id
    
    if exam_data.exam_name is not None:
        exam.exam_name = exam_data.exam_name
    
    if exam_data.exam_date is not None:
        try:
            exam.exam_date = datetime.strptime(exam_data.exam_date, '%Y-%m-%d')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"日期格式错误: {str(e)}")
    
    if exam_data.start_time is not None:
        try:
            exam.start_time = datetime.fromisoformat(exam_data.start_time.replace('Z', '+00:00'))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"开始时间格式错误: {str(e)}")
    
    if exam_data.end_time is not None:
        try:
            exam.end_time = datetime.fromisoformat(exam_data.end_time.replace('Z', '+00:00'))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"结束时间格式错误: {str(e)}")
    
    if exam_data.early_login_minutes is not None:
        exam.early_login_minutes = exam_data.early_login_minutes
    
    if exam_data.late_forbidden_minutes is not None:
        exam.late_forbidden_minutes = exam_data.late_forbidden_minutes
    
    # 验证时间
    if exam.start_time >= exam.end_time:
        raise HTTPException(status_code=400, detail="开始时间必须早于结束时间")
    
    await db.commit()
    await db.refresh(exam)
    
    return {
        "message": "考试更新成功",
        "id": exam.id
    }

@router.delete("/{exam_id}")
async def delete_exam(
    exam_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除考试（逻辑删除）"""
    result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    exam.is_active = False
    await db.commit()
    
    return {"message": "考试删除成功"}

@router.post("/{exam_id}/cover")
async def upload_cover(
    exam_id: int,
    file: UploadFile = File(...),
    teacher_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """上传考试封面"""
    # 检查考试是否存在
    result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # 检查文件类型
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="只能上传图片文件")
    
    # 检查文件大小（50MB）
    file_content = await file.read()
    file_size = len(file_content)
    if file_size > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="文件大小不能超过50MB")
    
    # 生成唯一文件名
    file_ext = Path(file.filename).suffix.lower()
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    file_path = COVER_UPLOAD_DIR / filename
    
    # 保存文件
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")
    
    # 删除旧封面
    if exam.cover_image:
        old_path = Path(exam.cover_image)
        if old_path.exists():
            try:
                old_path.unlink()
            except:
                pass
    
    # 更新数据库
    exam.cover_image = str(file_path)
    await db.commit()
    await db.refresh(exam)
    
    return {
        "message": "封面上传成功",
        "cover_image": exam.cover_image
    }

# ============= 考生管理 =============
@router.post("/{exam_id}/students")
async def add_students(
    exam_id: int,
    request: AddStudentsRequest,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """添加考生到考试"""
    # 检查考试是否存在
    result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = result.scalar_one_or_none()
    
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

@router.delete("/{exam_id}/students/{student_id}")
async def remove_student(
    exam_id: int,
    student_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """从考试中移除考生"""
    # 检查考试是否存在
    result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # 检查考生关联
    es_result = await db.execute(
        select(ExamStudent).where(
            and_(
                ExamStudent.exam_id == exam_id,
                ExamStudent.student_id == student_id
            )
        )
    )
    es = es_result.scalar_one_or_none()
    
    if not es:
        raise HTTPException(status_code=404, detail="考生不在考试中")
    
    await db.delete(es)
    await db.commit()
    
    return {"message": "考生移除成功"}

@router.get("/{exam_id}/export-grades")
async def export_grades(
    exam_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """导出考试成绩（暂时返回空数据，后续实现）"""
    # 检查考试是否存在
    result = await db.execute(
        select(Exam).where(
            and_(
                Exam.id == exam_id,
                Exam.teacher_id == teacher_id,
                Exam.is_active == True
            )
        )
    )
    exam = result.scalar_one_or_none()
    
    if not exam:
        raise HTTPException(status_code=404, detail="考试不存在")
    
    # TODO: 实现成绩导出逻辑
    # 暂时返回空数据
    return {
        "message": "成绩导出功能开发中",
        "exam_id": exam_id,
        "exam_name": exam.exam_name
    }

