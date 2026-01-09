from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, func
from pydantic import BaseModel
import random

from app.db.session import get_db
from app.models.exam_paper import ExamPaper, ExamPaperQuestion
from app.models.question import Question
from app.models.base import User

router = APIRouter()

# ============= Schemas =============
class ExamPaperCreate(BaseModel):
    paper_name: str
    duration_minutes: Optional[int] = 0  # 可选字段，默认0（不限制）
    min_submit_minutes: Optional[int] = 0  # 可选字段，默认0（不限制）
    composition_mode: str  # manual, auto
    total_score: float = 100.0
    question_order: str = "fixed"  # fixed, random
    option_order: str = "fixed"  # fixed, random
    knowledge_point: str  # 关联的知识点名称（必填）

class ExamPaperUpdate(BaseModel):
    paper_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    min_submit_minutes: Optional[int] = None
    composition_mode: Optional[str] = None
    total_score: Optional[float] = None
    question_order: Optional[str] = None
    option_order: Optional[str] = None
    knowledge_point: Optional[str] = None

class ExamPaperQuestionAdd(BaseModel):
    question_id: int
    score: float

class ExamPaperQuestionUpdate(BaseModel):
    score: Optional[float] = None
    sort_order: Optional[int] = None

class AutoCompositionConfig(BaseModel):
    question_type: str
    count: int
    score_per_question: float

class QuestionTypeConfig(BaseModel):
    question_type: str  # single_choice, multiple_choice, true_false, etc.
    count: int
    score_per_question: float

class AIAssembleConfig(BaseModel):
    question_configs: List[QuestionTypeConfig]

class AIAssembleQuestionItem(BaseModel):
    question_id: int
    score: float

class AIAssembleConfirm(BaseModel):
    questions: List[AIAssembleQuestionItem]

# ============= API Endpoints =============
@router.get("/")
async def get_exam_papers(
    teacher_id: int,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取试卷列表"""
    query = select(ExamPaper, User).join(
        User, ExamPaper.teacher_id == User.id
    ).where(
        ExamPaper.is_active == True,
        ExamPaper.teacher_id == teacher_id
    )
    
    if search:
        query = query.where(ExamPaper.paper_name.ilike(f"%{search}%"))
    
    query = query.order_by(ExamPaper.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    papers = []
    for paper, teacher in rows:
        # 获取题目数量
        count_result = await db.execute(
            select(func.count(ExamPaperQuestion.id)).where(
                ExamPaperQuestion.exam_paper_id == paper.id
            )
        )
        question_count = count_result.scalar() or 0
        
        papers.append({
            "id": paper.id,
            "teacher_id": paper.teacher_id,
            "teacher_name": teacher.full_name,
            "paper_name": paper.paper_name,
            "duration_minutes": paper.duration_minutes,
            "min_submit_minutes": paper.min_submit_minutes,
            "composition_mode": paper.composition_mode,
            "total_score": float(paper.total_score),
            "question_order": paper.question_order,
            "option_order": paper.option_order,
            "knowledge_point": paper.knowledge_point,
            "question_count": question_count,
            "is_active": paper.is_active,
            "created_at": paper.created_at.isoformat() if paper.created_at else None,
            "updated_at": paper.updated_at.isoformat() if paper.updated_at else None,
        })
    
    return papers

@router.get("/{paper_id}")
async def get_exam_paper(
    paper_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取试卷详情"""
    result = await db.execute(
        select(ExamPaper, User).join(
            User, ExamPaper.teacher_id == User.id
        ).where(
            ExamPaper.id == paper_id,
            ExamPaper.teacher_id == teacher_id,
            ExamPaper.is_active == True
        )
    )
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    paper, teacher = row
    
    # 获取试卷中的题目（使用selectinload加载选项）
    questions_result = await db.execute(
        select(ExamPaperQuestion, Question)
        .join(Question, ExamPaperQuestion.question_id == Question.id)
        .options(selectinload(Question.options))
        .where(ExamPaperQuestion.exam_paper_id == paper_id)
        .order_by(ExamPaperQuestion.sort_order)
    )
    question_rows = questions_result.all()
    
    questions = []
    for epq, question in question_rows:
        question_data = {
            "id": question.id,
            "question_type": question.question_type,
            "title": question.title,
            "title_image": question.title_image,
            "knowledge_point": question.knowledge_point,
            "answer": question.answer,
            "answer_image": question.answer_image,
            "explanation": question.explanation,
            "explanation_image": question.explanation_image,
            "difficulty": question.difficulty,
            "score": float(epq.score),
            "sort_order": epq.sort_order,
            "options": []
        }
        
        # 获取选项
        if question.options:
            question_data["options"] = [
                {
                    "id": opt.id,
                    "option_text": opt.option_text,
                    "option_image": opt.option_image,
                    "is_correct": opt.is_correct,
                }
                for opt in question.options
            ]
        
        questions.append(question_data)
    
    return {
        "id": paper.id,
        "teacher_id": paper.teacher_id,
        "teacher_name": teacher.full_name,
        "paper_name": paper.paper_name,
        "duration_minutes": paper.duration_minutes,
        "min_submit_minutes": paper.min_submit_minutes,
        "composition_mode": paper.composition_mode,
        "total_score": float(paper.total_score),
        "question_order": paper.question_order,
        "option_order": paper.option_order,
        "knowledge_point": paper.knowledge_point,
        "questions": questions,
        "is_active": paper.is_active,
        "created_at": paper.created_at.isoformat() if paper.created_at else None,
        "updated_at": paper.updated_at.isoformat() if paper.updated_at else None,
    }

@router.post("/")
async def create_exam_paper(
    paper_data: ExamPaperCreate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建试卷"""
    paper = ExamPaper(
        teacher_id=teacher_id,
        paper_name=paper_data.paper_name,
        duration_minutes=paper_data.duration_minutes,
        min_submit_minutes=paper_data.min_submit_minutes,
        composition_mode=paper_data.composition_mode,
        total_score=paper_data.total_score,
        question_order=paper_data.question_order,
        option_order=paper_data.option_order,
        knowledge_point=paper_data.knowledge_point,
        is_active=True
    )
    db.add(paper)
    await db.commit()
    await db.refresh(paper)
    
    return {
        "message": "试卷创建成功",
        "id": paper.id,
        "paper_name": paper.paper_name
    }

@router.put("/{paper_id}")
async def update_exam_paper(
    paper_id: int,
    paper_data: ExamPaperUpdate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新试卷"""
    result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    # 更新字段
    if paper_data.paper_name is not None:
        paper.paper_name = paper_data.paper_name
    if paper_data.duration_minutes is not None:
        paper.duration_minutes = paper_data.duration_minutes
    if paper_data.min_submit_minutes is not None:
        paper.min_submit_minutes = paper_data.min_submit_minutes
    if paper_data.composition_mode is not None:
        paper.composition_mode = paper_data.composition_mode
    if paper_data.total_score is not None:
        paper.total_score = paper_data.total_score
    if paper_data.question_order is not None:
        paper.question_order = paper_data.question_order
    if paper_data.option_order is not None:
        paper.option_order = paper_data.option_order
    if paper_data.knowledge_point is not None:
        paper.knowledge_point = paper_data.knowledge_point
    
    await db.commit()
    await db.refresh(paper)
    
    return {
        "message": "试卷更新成功",
        "id": paper.id
    }

@router.delete("/{paper_id}")
async def delete_exam_paper(
    paper_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除试卷（逻辑删除）"""
    result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    paper.is_active = False
    await db.commit()
    
    return {"message": "试卷删除成功"}

# ============= 试题管理 =============
@router.post("/{paper_id}/questions")
async def add_question_to_paper(
    paper_id: int,
    question_data: ExamPaperQuestionAdd,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """添加题目到试卷（手工组卷）"""
    # 检查试卷是否存在
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    if paper.composition_mode != "manual":
        raise HTTPException(status_code=400, detail="只有手工组卷模式才能手动添加题目")
    
    # 检查题目是否存在
    question_result = await db.execute(
        select(Question).where(
            and_(
                Question.id == question_data.question_id,
                Question.teacher_id == teacher_id,
                Question.is_active == True
            )
        )
    )
    question = question_result.scalar_one_or_none()
    
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")
    
    # 检查题目是否已经在试卷中
    existing_result = await db.execute(
        select(ExamPaperQuestion).where(
            and_(
                ExamPaperQuestion.exam_paper_id == paper_id,
                ExamPaperQuestion.question_id == question_data.question_id
            )
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="题目已在试卷中")
    
    # 获取当前最大排序
    max_order_result = await db.execute(
        select(func.max(ExamPaperQuestion.sort_order)).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    max_order = max_order_result.scalar() or 0
    
    # 添加题目
    epq = ExamPaperQuestion(
        exam_paper_id=paper_id,
        question_id=question_data.question_id,
        score=question_data.score,
        sort_order=max_order + 1
    )
    db.add(epq)
    await db.commit()
    await db.refresh(epq)
    
    # 检查总分值
    total_result = await db.execute(
        select(func.sum(ExamPaperQuestion.score)).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    total_score = float(total_result.scalar() or 0)
    
    return {
        "message": "题目添加成功",
        "id": epq.id,
        "total_score": total_score,
        "paper_total_score": float(paper.total_score),
        "score_match": abs(total_score - float(paper.total_score)) < 0.01
    }

@router.put("/{paper_id}/questions/{epq_id}")
async def update_paper_question(
    paper_id: int,
    epq_id: int,
    question_data: ExamPaperQuestionUpdate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新试卷中的题目（修改分值、排序）"""
    # 检查试卷
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    # 检查试卷题目关联
    epq_result = await db.execute(
        select(ExamPaperQuestion).where(
            and_(
                ExamPaperQuestion.id == epq_id,
                ExamPaperQuestion.exam_paper_id == paper_id
            )
        )
    )
    epq = epq_result.scalar_one_or_none()
    
    if not epq:
        raise HTTPException(status_code=404, detail="试卷题目关联不存在")
    
    # 更新
    if question_data.score is not None:
        epq.score = question_data.score
    if question_data.sort_order is not None:
        epq.sort_order = question_data.sort_order
    
    await db.commit()
    await db.refresh(epq)
    
    # 检查总分值
    total_result = await db.execute(
        select(func.sum(ExamPaperQuestion.score)).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    total_score = float(total_result.scalar() or 0)
    
    return {
        "message": "题目更新成功",
        "total_score": total_score,
        "paper_total_score": float(paper.total_score),
        "score_match": abs(total_score - float(paper.total_score)) < 0.01
    }

@router.delete("/{paper_id}/questions/clear")
async def clear_all_questions(
    paper_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """清空试卷所有试题"""
    # 检查试卷
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    # 删除所有试题关联
    questions_result = await db.execute(
        select(ExamPaperQuestion).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    questions = questions_result.scalars().all()
    
    for question in questions:
        await db.delete(question)
    
    await db.commit()
    
    return {"message": "试卷题目已全部清空"}

@router.delete("/{paper_id}/questions/{epq_id}")
async def remove_question_from_paper(
    paper_id: int,
    epq_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """从试卷中移除题目"""
    # 检查试卷
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    # 检查试卷题目关联
    epq_result = await db.execute(
        select(ExamPaperQuestion).where(
            and_(
                ExamPaperQuestion.id == epq_id,
                ExamPaperQuestion.exam_paper_id == paper_id
            )
        )
    )
    epq = epq_result.scalar_one_or_none()
    
    if not epq:
        raise HTTPException(status_code=404, detail="试卷题目关联不存在")
    
    await db.delete(epq)
    await db.commit()
    
    return {"message": "题目移除成功"}

@router.post("/{paper_id}/auto-compose")
async def auto_compose_paper(
    paper_id: int,
    configs: List[AutoCompositionConfig],
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """智能组卷：根据配置自动抽取题目"""
    # 检查试卷
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    if paper.composition_mode != "auto":
        raise HTTPException(status_code=400, detail="只有智能组卷模式才能使用自动组卷")
    
    # 清空现有题目
    await db.execute(
        select(ExamPaperQuestion).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    existing_result = await db.execute(
        select(ExamPaperQuestion).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    existing_epqs = existing_result.scalars().all()
    for epq in existing_epqs:
        await db.delete(epq)
    
    # 计算总分值
    total_score = sum(config.count * config.score_per_question for config in configs)
    
    if abs(total_score - float(paper.total_score)) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"配置的总分值 ({total_score}) 与试卷总分值 ({paper.total_score}) 不一致"
        )
    
    # 按题型抽取题目
    sort_order = 1
    added_questions = []
    
    for config in configs:
        # 获取该题型的可用题目（排除已在试卷中的）
        question_result = await db.execute(
            select(Question).where(
                and_(
                    Question.teacher_id == teacher_id,
                    Question.question_type == config.question_type,
                    Question.is_active == True
                )
            ).limit(config.count)
        )
        questions = question_result.scalars().all()
        
        if len(questions) < config.count:
            raise HTTPException(
                status_code=400,
                detail=f"题型 {config.question_type} 的可用题目不足，需要 {config.count} 道，只有 {len(questions)} 道"
            )
        
        # 添加到试卷
        for question in questions:
            epq = ExamPaperQuestion(
                exam_paper_id=paper_id,
                question_id=question.id,
                score=config.score_per_question,
                sort_order=sort_order
            )
            db.add(epq)
            added_questions.append({
                "question_id": question.id,
                "score": config.score_per_question
            })
            sort_order += 1
    
    await db.commit()
    
    return {
        "message": "智能组卷成功",
        "added_questions": added_questions,
        "total_score": total_score
    }

@router.post("/{paper_id}/ai-assemble")
async def ai_assemble_paper(
    paper_id: int,
    config: AIAssembleConfig,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """AI一键组卷：根据知识点和题型配置自动选择题目"""
    # 检查试卷
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    # 计算配置的总分
    total_configured_score = sum(
        cfg.count * cfg.score_per_question 
        for cfg in config.question_configs
    )
    
    # 验证总分不超标
    if total_configured_score > float(paper.total_score):
        raise HTTPException(
            status_code=400,
            detail=f"配置的总分({total_configured_score})超过试卷总分({paper.total_score})"
        )
    
    # 获取试卷已有的题目ID列表
    existing_questions_result = await db.execute(
        select(ExamPaperQuestion.question_id).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    existing_question_ids = set(existing_questions_result.scalars().all())
    
    # 为每种题型选择题目
    selected_questions = []
    for cfg in config.question_configs:
        # 查询该知识点下该题型的所有可用题目(排除已添加的)
        questions_result = await db.execute(
            select(Question).where(
                and_(
                    Question.teacher_id == teacher_id,
                    Question.knowledge_point == paper.knowledge_point,
                    Question.question_type == cfg.question_type,
                    Question.is_active == True,
                    Question.id.notin_(existing_question_ids)
                )
            )
        )
        available_questions = list(questions_result.scalars().all())
        
        # 检查题目数量是否充足
        if len(available_questions) < cfg.count:
            raise HTTPException(
                status_code=400,
                detail=f"知识点'{paper.knowledge_point}'下'{cfg.question_type}'类型的题目数量不足(需要{cfg.count}道,可用{len(available_questions)}道)"
            )
        
        # 随机选择指定数量的题目
        selected = random.sample(available_questions, cfg.count)
        for question in selected:
            selected_questions.append({
                "question": question,
                "score": cfg.score_per_question
            })
    
    # 返回选择的题目供前端预览
    result_questions = []
    for item in selected_questions:
        question = item["question"]
        # 获取选项(如果有)
        options_result = await db.execute(
            select(Question).options(selectinload(Question.options)).where(
                Question.id == question.id
            )
        )
        question_with_options = options_result.scalar_one_or_none()
        
        question_data = {
            "id": question.id,
            "question_type": question.question_type,
            "title": question.title,
            "title_image": question.title_image,
            "knowledge_point": question.knowledge_point,
            "answer": question.answer,
            "explanation": question.explanation,
            "difficulty": question.difficulty,
            "score": item["score"],
            "options": []
        }
        
        if question_with_options and question_with_options.options:
            question_data["options"] = [
                {
                    "id": opt.id,
                    "option_text": opt.option_text,
                    "option_image": opt.option_image,
                    "is_correct": opt.is_correct,
                }
                for opt in question_with_options.options
            ]
        
        result_questions.append(question_data)
    
    return {
        "message": "AI组卷预览成功",
        "questions": result_questions,
        "total_score": total_configured_score
    }

@router.post("/{paper_id}/ai-assemble/confirm")
async def confirm_ai_assemble(
    paper_id: int,
    confirm_data: AIAssembleConfirm,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """确认AI组卷结果并添加到试卷"""
    # 检查试卷
    paper_result = await db.execute(
        select(ExamPaper).where(
            and_(
                ExamPaper.id == paper_id,
                ExamPaper.teacher_id == teacher_id,
                ExamPaper.is_active == True
            )
        )
    )
    paper = paper_result.scalar_one_or_none()
    
    if not paper:
        raise HTTPException(status_code=404, detail="试卷不存在")
    
    # 获取当前最大的sort_order
    max_sort_result = await db.execute(
        select(func.max(ExamPaperQuestion.sort_order)).where(
            ExamPaperQuestion.exam_paper_id == paper_id
        )
    )
    max_sort = max_sort_result.scalar() or 0
    sort_order = max_sort + 1
    
    added_count = 0
    for item in confirm_data.questions:
        # 检查题目是否已存在
        existing_result = await db.execute(
            select(ExamPaperQuestion).where(
                and_(
                    ExamPaperQuestion.exam_paper_id == paper_id,
                    ExamPaperQuestion.question_id == item.question_id
                )
            )
        )
        if existing_result.scalar_one_or_none():
            continue
        
        # 添加题目
        epq = ExamPaperQuestion(
            exam_paper_id=paper_id,
            question_id=item.question_id,
            score=item.score,
            sort_order=sort_order
        )
        db.add(epq)
        added_count += 1
        sort_order += 1
    
    await db.commit()
    
    return {
        "message": f"成功添加{added_count}道题目到试卷",
        "added_count": added_count
    }

