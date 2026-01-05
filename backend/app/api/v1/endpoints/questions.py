from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func, or_
from pathlib import Path
from datetime import datetime
import os
import shutil
import json
from urllib.parse import quote
import pandas as pd
import io
import httpx
from pydantic import BaseModel

from app.db.session import get_db
from app.models.base import User
from app.models.question import Question, QuestionOption
from app.models.llm_config import LLMConfig
from app.models.teaching_resource import TeachingResource
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# 题目类型配置
QUESTION_TYPES = {
    "single_choice": "单选题",
    "multiple_choice": "多选题",
    "true_false": "判断题",
    "fill_blank": "填空题",
    "qa": "问答题",
    "short_answer": "简答题"
}

UPLOAD_DIR = Path("uploads/questions")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def save_image(file: UploadFile, teacher_id: int, prefix: str) -> str:
    """保存图片文件"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique_filename = f"{teacher_id}_{prefix}_{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return str(file_path)

@router.get("/stats")
async def get_stats(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取题库统计信息"""
    # 总数
    total_result = await db.execute(
        select(func.count(Question.id)).where(
            and_(
                Question.teacher_id == teacher_id,
                Question.is_active == True
            )
        )
    )
    total = total_result.scalar() or 0
    
    # 按类型统计
    by_type = {}
    for question_type in QUESTION_TYPES.keys():
        type_result = await db.execute(
            select(func.count(Question.id)).where(
                and_(
                    Question.teacher_id == teacher_id,
                    Question.question_type == question_type,
                    Question.is_active == True
                )
            )
        )
        by_type[question_type] = type_result.scalar() or 0
    
    return {
        "total": total,
        "by_type": by_type
    }

@router.get("/")
async def get_questions(
    teacher_id: int,
    skip: int = 0,
    limit: int = 20,
    question_type: Optional[str] = None,
    knowledge_point: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取题目列表（支持分页）"""
    # 构建基础查询
    base_query = select(Question).where(
        and_(
            Question.teacher_id == teacher_id,
            Question.is_active == True
        )
    )
    
    if question_type:
        base_query = base_query.where(Question.question_type == question_type)
    
    if knowledge_point:
        base_query = base_query.where(Question.knowledge_point.ilike(f"%{knowledge_point}%"))
    
    if search:
        base_query = base_query.where(
            or_(
                Question.title.ilike(f"%{search}%"),
                Question.knowledge_point.ilike(f"%{search}%")
            )
        )
    
    # 获取总数
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 获取分页数据
    query = base_query.offset(skip).limit(limit).order_by(Question.created_at.desc())
    result = await db.execute(query)
    questions = result.scalars().all()
    
    # 获取选项（对于单选和多选）
    question_list = []
    for question in questions:
        # 获取选项
        options_result = await db.execute(
            select(QuestionOption).where(
                QuestionOption.question_id == question.id
            ).order_by(QuestionOption.sort_order)
        )
        options = options_result.scalars().all()
        
        question_list.append({
            "id": question.id,
            "teacher_id": question.teacher_id,
            "question_type": question.question_type,
            "title": question.title,
            "title_image": question.title_image,
            "knowledge_point": question.knowledge_point,
            "answer": question.answer,
            "answer_image": question.answer_image,
            "explanation": question.explanation,
            "explanation_image": question.explanation_image,
            "difficulty": question.difficulty,
            "is_active": question.is_active,
            "created_at": question.created_at.isoformat() if question.created_at else None,
            "updated_at": question.updated_at.isoformat() if question.updated_at else None,
            "options": [
                {
                    "id": opt.id,
                    "option_label": opt.option_label,
                    "option_text": opt.option_text,
                    "option_image": opt.option_image,
                    "is_correct": opt.is_correct,
                    "sort_order": opt.sort_order,
                }
                for opt in options
            ]
        })
    
    return {
        "questions": question_list,
        "total": total
    }

@router.post("/")
async def create_question(
    teacher_id: int = Form(...),
    question_type: str = Form(...),
    title: str = Form(...),
    knowledge_point: Optional[str] = Form(None),
    answer: Optional[str] = Form(None),
    explanation: Optional[str] = Form(None),
    difficulty: int = Form(1),
    options: Optional[str] = Form(None),  # JSON字符串
    title_image: Optional[UploadFile] = File(None),
    answer_image: Optional[UploadFile] = File(None),
    explanation_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建题目"""
    if question_type not in QUESTION_TYPES:
        raise HTTPException(status_code=400, detail="无效的题目类型")
    
    # 保存图片
    title_image_path = None
    answer_image_path = None
    explanation_image_path = None
    
    if title_image:
        title_image_path = save_image(title_image, teacher_id, "title")
    if answer_image:
        answer_image_path = save_image(answer_image, teacher_id, "answer")
    if explanation_image:
        explanation_image_path = save_image(explanation_image, teacher_id, "explanation")
    
    # 创建题目
    question = Question(
        teacher_id=teacher_id,
        question_type=question_type,
        title=title,
        title_image=title_image_path,
        knowledge_point=knowledge_point,
        answer=answer,
        answer_image=answer_image_path,
        explanation=explanation,
        explanation_image=explanation_image_path,
        difficulty=difficulty,
        is_active=True
    )
    
    db.add(question)
    await db.flush()  # 获取question.id
    
    # 处理选项（单选和多选）
    if question_type in ["single_choice", "multiple_choice"] and options:
        try:
            options_data = json.loads(options)
            for idx, opt_data in enumerate(options_data):
                option = QuestionOption(
                    question_id=question.id,
                    option_label=opt_data.get("option_label", chr(65 + idx)),  # A, B, C, D
                    option_text=opt_data.get("option_text", ""),
                    option_image=opt_data.get("option_image") or opt_data.get("option_image_path"),  # 支持两种字段名
                    is_correct=opt_data.get("is_correct", False),
                    sort_order=idx
                )
                db.add(option)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="选项数据格式错误")
    
    await db.commit()
    await db.refresh(question)
    
    return {
        "message": "题目创建成功",
        "id": question.id
    }

@router.post("/upload-image")
async def upload_question_image(
    file: UploadFile = File(...),
    teacher_id: int = Form(...),
    image_type: str = Form(...),  # title, answer, explanation, option
    db: AsyncSession = Depends(get_db),
) -> Any:
    """上传题目图片（用于选项图片等）"""
    if image_type not in ["title", "answer", "explanation", "option"]:
        raise HTTPException(status_code=400, detail="无效的图片类型")
    
    # 检查文件类型
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只能上传图片文件")
    
    # 保存图片
    image_path = save_image(file, teacher_id, image_type)
    
    return {
        "message": "图片上传成功",
        "image_path": image_path,
        "image_url": f"/api/v1/teacher/questions/image/{Path(image_path).name}"
    }

@router.get("/image/{filename}")
async def get_question_image(
    filename: str,
    db: AsyncSession = Depends(get_db),
):
    """获取题目图片"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="图片不存在")
    
    # 确定MIME类型
    mime_type = "image/jpeg"
    if filename.lower().endswith(".png"):
        mime_type = "image/png"
    elif filename.lower().endswith(".gif"):
        mime_type = "image/gif"
    elif filename.lower().endswith(".webp"):
        mime_type = "image/webp"
    
    return FileResponse(file_path, media_type=mime_type)

@router.put("/{question_id}")
async def update_question(
    question_id: int,
    teacher_id: int = Form(...),
    question_type: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    knowledge_point: Optional[str] = Form(None),
    answer: Optional[str] = Form(None),
    explanation: Optional[str] = Form(None),
    difficulty: Optional[int] = Form(None),
    options: Optional[str] = Form(None),
    title_image: Optional[UploadFile] = File(None),
    answer_image: Optional[UploadFile] = File(None),
    explanation_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新题目"""
    result = await db.execute(
        select(Question).where(
            and_(
                Question.id == question_id,
                Question.teacher_id == teacher_id,
                Question.is_active == True
            )
        )
    )
    question = result.scalars().first()
    
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")
    
    # 更新字段
    if question_type is not None:
        question.question_type = question_type
    if title is not None:
        question.title = title
    if knowledge_point is not None:
        question.knowledge_point = knowledge_point
    if answer is not None:
        question.answer = answer
    if explanation is not None:
        question.explanation = explanation
    if difficulty is not None:
        question.difficulty = difficulty
    
    # 更新图片
    if title_image:
        # 删除旧图片
        if question.title_image and Path(question.title_image).exists():
            Path(question.title_image).unlink()
        question.title_image = save_image(title_image, teacher_id, "title")
    if answer_image:
        if question.answer_image and Path(question.answer_image).exists():
            Path(question.answer_image).unlink()
        question.answer_image = save_image(answer_image, teacher_id, "answer")
    if explanation_image:
        if question.explanation_image and Path(question.explanation_image).exists():
            Path(question.explanation_image).unlink()
        question.explanation_image = save_image(explanation_image, teacher_id, "explanation")
    
    # 更新选项
    if options and question.question_type in ["single_choice", "multiple_choice"]:
        # 删除旧选项
        await db.execute(
            select(QuestionOption).where(QuestionOption.question_id == question_id)
        )
        old_options = await db.execute(
            select(QuestionOption).where(QuestionOption.question_id == question_id)
        )
        for opt in old_options.scalars().all():
            await db.delete(opt)
        
        # 添加新选项
        try:
            options_data = json.loads(options)
            for idx, opt_data in enumerate(options_data):
                option = QuestionOption(
                    question_id=question.id,
                    option_label=opt_data.get("option_label", chr(65 + idx)),
                    option_text=opt_data.get("option_text", ""),
                    option_image=opt_data.get("option_image") or opt_data.get("option_image_path"),  # 支持两种字段名
                    is_correct=opt_data.get("is_correct", False),
                    sort_order=idx
                )
                db.add(option)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="选项数据格式错误")
    
    question.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "题目更新成功"}

@router.delete("/{question_id}")
async def delete_question(
    question_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除题目（逻辑删除）"""
    result = await db.execute(
        select(Question).where(
            and_(
                Question.id == question_id,
                Question.teacher_id == teacher_id,
                Question.is_active == True
            )
        )
    )
    question = result.scalars().first()
    
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")
    
    question.is_active = False
    question.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "题目删除成功"}

@router.get("/export")
async def export_questions(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """导出所有题目为Excel文件"""
    # 获取所有题目
    result = await db.execute(
        select(Question).where(
            and_(
                Question.teacher_id == teacher_id,
                Question.is_active == True
            )
        ).order_by(Question.created_at.desc())
    )
    questions = result.scalars().all()
    
    if not questions:
        raise HTTPException(status_code=404, detail="没有可导出的题目")
    
    # 准备Excel数据
    excel_data = []
    for question in questions:
        # 获取选项
        options_result = await db.execute(
            select(QuestionOption).where(
                QuestionOption.question_id == question.id
            ).order_by(QuestionOption.sort_order)
        )
        options = options_result.scalars().all()
        
        # 处理选项文本
        options_text = ""
        if options:
            options_list = []
            for opt in options:
                opt_text = f"{opt.option_label}. {opt.option_text}"
                if opt.is_correct:
                    opt_text += " ✓"
                options_list.append(opt_text)
            options_text = " | ".join(options_list)
        
        # 处理答案
        answer_text = question.answer or ""
        if question.question_type == "true_false":
            answer_text = "正确" if answer_text == "true" else "错误"
        
        excel_data.append({
            "题型": QUESTION_TYPES.get(question.question_type, question.question_type),
            "题干": question.title,
            "知识点": question.knowledge_point or "",
            "选项": options_text,
            "正确答案": answer_text,
            "解析": question.explanation or "",
            "难度": "简单" if question.difficulty == 1 else "中等" if question.difficulty == 2 else "困难",
        })
    
    # 创建DataFrame
    df = pd.DataFrame(excel_data)
    
    # 创建Excel文件
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='题目列表')
    
    output.seek(0)
    
    # 生成文件名
    filename = f"题目导出_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        io.BytesIO(output.read()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"
        }
    )

@router.get("/template")
async def download_template() -> Any:
    """下载题目导入模板"""
    # 创建模板数据
    template_data = {
        "题型": ["single_choice", "multiple_choice", "true_false", "fill_blank", "qa", "short_answer"],
        "题干": ["示例：1+1等于几？", "示例：以下哪些是编程语言？（多选）", "示例：地球是圆的", "示例：中国的首都是____", "示例：请简述什么是人工智能？", "示例：请列出三个常见的数据库类型"],
        "知识点": ["基础数学", "计算机基础", "地理知识", "地理知识", "人工智能", "数据库"],
        "选项": ["A. 1 | B. 2 ✓ | C. 3 | D. 4", "A. Python ✓ | B. Java ✓ | C. HTML ✓ | D. Word", "", "", "", ""],
        "正确答案": ["", "", "true", "北京", "人工智能是计算机科学的一个分支...", "1. MySQL\n2. MongoDB\n3. Redis"],
        "解析": ["这是最简单的加法题", "Python、Java、HTML都是编程相关", "地球确实是近似球形的", "北京是中国的首都", "人工智能涉及多个领域", "不同类型的数据库适用于不同场景"],
        "难度": ["1", "2", "1", "1", "3", "2"],
    }
    
    df = pd.DataFrame(template_data)
    
    # 创建Excel文件
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='题目模板')
        
        # 添加说明sheet
        instructions = pd.DataFrame({
            "说明": [
                "题型说明：",
                "single_choice - 单选题",
                "multiple_choice - 多选题",
                "true_false - 判断题",
                "fill_blank - 填空题",
                "qa - 问答题",
                "short_answer - 简答题",
                "",
                "选项格式说明：",
                "格式：A. 选项1 | B. 选项2 ✓ | C. 选项3",
                "✓ 表示该选项是正确答案",
                "单选题只能有一个✓，多选题可以有多个✓",
                "",
                "判断题答案：",
                "true - 正确",
                "false - 错误",
                "",
                "难度：",
                "1 - 简单",
                "2 - 中等",
                "3 - 困难",
            ]
        })
        instructions.to_excel(writer, index=False, sheet_name='使用说明')
    
    output.seek(0)
    
    filename = "题目导入模板.xlsx"
    
    return StreamingResponse(
        io.BytesIO(output.read()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"
        }
    )

@router.post("/import")
async def import_questions(
    file: UploadFile = File(...),
    teacher_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量导入题目"""
    # 检查文件类型
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="只支持Excel (.xlsx, .xls) 或 CSV (.csv) 文件")
    
    # 读取文件
    try:
        # 将文件内容读取到内存
        file_content = await file.read()
        file_io = io.BytesIO(file_content)
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file_io)
        else:
            df = pd.read_excel(file_io, engine='openpyxl')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件读取失败: {str(e)}")
    
    # 检查必需的列
    required_columns = ['题型', '题干']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise HTTPException(status_code=400, detail=f"缺少必需的列: {', '.join(missing_columns)}")
    
    # 验证和导入数据
    errors = []
    success_count = 0
    
    for index, row in df.iterrows():
        try:
            question_type = str(row.get('题型', '')).strip()
            title = str(row.get('题干', '')).strip()
            
            if not question_type or not title:
                errors.append(f"第{index + 2}行: 题型和题干不能为空")
                continue
            
            if question_type not in QUESTION_TYPES:
                errors.append(f"第{index + 2}行: 无效的题型 '{question_type}'")
                continue
            
            # 获取其他字段
            knowledge_point = str(row.get('知识点', '')).strip() or None
            answer = str(row.get('正确答案', '')).strip() or None
            explanation = str(row.get('解析', '')).strip() or None
            difficulty_str = str(row.get('难度', '1')).strip()
            
            # 处理难度
            try:
                difficulty = int(difficulty_str) if difficulty_str else 1
                if difficulty not in [1, 2, 3]:
                    difficulty = 1
            except:
                difficulty = 1
            
            # 处理判断题答案
            if question_type == "true_false" and answer:
                answer = "true" if answer.lower() in ["true", "正确", "1", "yes"] else "false"
            
            # 创建题目
            question = Question(
                teacher_id=teacher_id,
                question_type=question_type,
                title=title,
                knowledge_point=knowledge_point,
                answer=answer,
                explanation=explanation,
                difficulty=difficulty,
                is_active=True
            )
            
            db.add(question)
            await db.flush()
            
            # 处理选项（单选和多选）
            if question_type in ["single_choice", "multiple_choice"]:
                options_text = str(row.get('选项', '')).strip()
                if options_text:
                    # 解析选项：格式 "A. 选项1 | B. 选项2 ✓ | C. 选项3"
                    options_list = [opt.strip() for opt in options_text.split('|')]
                    for idx, opt_str in enumerate(options_list):
                        opt_str = opt_str.strip()
                        if not opt_str:
                            continue
                        
                        # 提取选项标签和文本
                        parts = opt_str.split('.', 1)
                        if len(parts) < 2:
                            continue
                        
                        option_label = parts[0].strip()
                        option_text = parts[1].strip()
                        
                        # 检查是否是正确答案
                        is_correct = '✓' in option_text or '√' in option_text
                        option_text = option_text.replace('✓', '').replace('√', '').strip()
                        
                        if option_text:
                            option = QuestionOption(
                                question_id=question.id,
                                option_label=option_label if option_label else chr(65 + idx),
                                option_text=option_text,
                                is_correct=is_correct,
                                sort_order=idx
                            )
                            db.add(option)
            
            success_count += 1
            
        except Exception as e:
            errors.append(f"第{index + 2}行: {str(e)}")
            continue
    
    # 如果有错误，回滚所有更改
    if errors:
        await db.rollback()
        return {
            "success": False,
            "message": f"导入失败，共{len(errors)}条错误",
            "errors": errors,
            "success_count": 0
        }
    
    # 提交所有更改
    await db.commit()
    
    return {
        "success": True,
        "message": f"成功导入{success_count}道题目",
        "success_count": success_count,
        "errors": []
    }

@router.get("/{question_id}")
async def get_question(
    question_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取单个题目详情"""
    result = await db.execute(
        select(Question).where(
            and_(
                Question.id == question_id,
                Question.teacher_id == teacher_id,
                Question.is_active == True
            )
        )
    )
    question = result.scalars().first()
    
    if not question:
        raise HTTPException(status_code=404, detail="题目不存在")
    
    # 获取选项
    options_result = await db.execute(
        select(QuestionOption).where(
            QuestionOption.question_id == question.id
        ).order_by(QuestionOption.sort_order)
    )
    options = options_result.scalars().all()
    
    return {
        "id": question.id,
        "teacher_id": question.teacher_id,
        "question_type": question.question_type,
        "title": question.title,
        "title_image": question.title_image,
        "knowledge_point": question.knowledge_point,
        "answer": question.answer,
        "answer_image": question.answer_image,
        "explanation": question.explanation,
        "explanation_image": question.explanation_image,
        "difficulty": question.difficulty,
        "is_active": question.is_active,
        "created_at": question.created_at.isoformat() if question.created_at else None,
        "updated_at": question.updated_at.isoformat() if question.updated_at else None,
        "options": [
            {
                "id": opt.id,
                "option_label": opt.option_label,
                "option_text": opt.option_text,
                "option_image": opt.option_image,
                "is_correct": opt.is_correct,
                "sort_order": opt.sort_order,
            }
            for opt in options
        ]
    }

class AIGenerateQuestionRequest(BaseModel):
    knowledge_point: str
    question_type: str
    additional_prompt: Optional[str] = ""
    resource_id: Optional[int] = None

class AIGenerateQuestionResponse(BaseModel):
    success: bool
    question: Optional[dict] = None
    error: Optional[str] = None

@router.post("/ai-generate", response_model=AIGenerateQuestionResponse)
async def ai_generate_question(
    request: AIGenerateQuestionRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    使用AI生成题目
    """
    # 获取当前激活的LLM配置
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.is_active == True)
    )
    config = result.scalars().first()
    
    if not config:
        return AIGenerateQuestionResponse(
            success=False,
            error="未找到激活的LLM配置，请先在管理后台配置并启用LLM"
        )
    
    if not config.api_key:
        return AIGenerateQuestionResponse(
            success=False,
            error="LLM配置的API Key未设置"
        )
    
    # 读取教学资源内容（如果提供了resource_id）
    resource_content = ""
    if request.resource_id:
        try:
            result = await db.execute(
                select(TeachingResource).where(TeachingResource.id == request.resource_id)
            )
            resource = result.scalars().first()
            
            if resource:
                # 从OSS读取文件内容
                try:
                    from app.utils.oss_client import get_oss_client
                    oss_client = get_oss_client()
                    
                    # 下载文件内容
                    file_content = oss_client.bucket.get_object(resource.file_path)
                    content_bytes = file_content.read()
                    
                    # 根据文件类型解析内容
                    if resource.resource_type in ['pdf', 'word', 'txt', 'markdown']:
                        # 尝试解码为文本
                        try:
                            resource_content = content_bytes.decode('utf-8')
                        except UnicodeDecodeError:
                            try:
                                resource_content = content_bytes.decode('gbk')
                            except:
                                resource_content = f"[文件内容无法解析，文件类型: {resource.resource_type}]"
                    elif resource.resource_type == 'excel':
                        # 使用pandas读取Excel
                        try:
                            df = pd.read_excel(io.BytesIO(content_bytes))
                            resource_content = df.to_string()
                        except:
                            resource_content = "[Excel文件内容无法解析]"
                    else:
                        resource_content = f"[不支持的文件类型: {resource.resource_type}]"
                    
                    # 检查内容长度，限制在60k字符
                    if len(resource_content) > 60000:
                        return AIGenerateQuestionResponse(
                            success=False,
                            error="教学资源文件太大，无法AI出题"
                        )
                except Exception as e:
                    logger.error(f"Failed to read resource content: {str(e)}")
                    resource_content = f"[资源内容读取失败: {str(e)}]"
        except Exception as e:
            logger.error(f"Failed to fetch resource: {str(e)}")
    
    # 构建提示词
    question_type_name = QUESTION_TYPES.get(request.question_type, request.question_type)
    
    # 根据题型构建不同的提示词模板
    if request.question_type in ["single_choice", "multiple_choice", "true_false"]:
        resource_section = ""
        if resource_content:
            resource_section = f"\n\n教学资源内容：\n{resource_content}\n\n请结合以上教学资源内容出题。"
        
        prompt_template = f"""请根据以下要求生成一道{question_type_name}：

知识点：{request.knowledge_point}
题型：{question_type_name}
补充要求：{request.additional_prompt if request.additional_prompt else "无特殊要求"}{resource_section}

请严格按照以下JSON格式输出，不要包含任何其他文字说明：

{{
  "title": "题干内容（必填）",
  "options": [
    {{"option_label": "A", "option_text": "选项A内容", "is_correct": true/false}},
    {{"option_label": "B", "option_text": "选项B内容", "is_correct": true/false}},
    {{"option_label": "C", "option_text": "选项C内容", "is_correct": true/false}},
    {{"option_label": "D", "option_text": "选项D内容", "is_correct": true/false}}
  ],
  "explanation": "解析内容（可选）",
  "difficulty": 1或2或3（1=简单，2=中等，3=困难）
}}

注意：
1. 如果是判断题（true_false），options数组只需要2个选项，option_text分别为"正确"和"错误"
2. 如果是单选题（single_choice），options数组中只有一个选项的is_correct为true
3. 如果是多选题（multiple_choice），options数组中至少有两个选项的is_correct为true
4. 必须输出有效的JSON格式，不要包含markdown代码块标记
5. 题干应该清晰、准确，符合{request.knowledge_point}的知识点要求"""
    else:
        resource_section = ""
        if resource_content:
            resource_section = f"\n\n教学资源内容：\n{resource_content}\n\n请结合以上教学资源内容出题。"
        
        prompt_template = f"""请根据以下要求生成一道{question_type_name}：

知识点：{request.knowledge_point}
题型：{question_type_name}
补充要求：{request.additional_prompt if request.additional_prompt else "无特殊要求"}{resource_section}

请严格按照以下JSON格式输出，不要包含任何其他文字说明：

{{
  "title": "题干内容（必填）",
  "answer": "正确答案内容（必填）",
  "explanation": "解析内容（可选）",
  "difficulty": 1或2或3（1=简单，2=中等，3=困难）
}}

注意：
1. 必须输出有效的JSON格式，不要包含markdown代码块标记
2. 题干应该清晰、准确，符合{request.knowledge_point}的知识点要求
3. 答案应该准确、完整"""
    
    try:
        # 调用LLM API
        provider_key = config.provider_key
        
        if provider_key == "aliyun_qwen":
            response_text = await call_aliyun_qwen(config, prompt_template)
        elif provider_key == "deepseek" or provider_key == "kimi" or provider_key == "volcengine_doubao" or provider_key == "siliconflow":
            response_text = await call_openai_compatible(config, prompt_template)
        elif provider_key == "wenxin":
            response_text = await call_wenxin(config, prompt_template)
        else:
            return AIGenerateQuestionResponse(
                success=False,
                error=f"不支持的LLM提供商: {provider_key}"
            )
        
        # 解析返回的JSON
        # 尝试提取JSON（可能包含markdown代码块）
        response_text = response_text.strip()
        if "```json" in response_text:
            # 提取JSON代码块
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            if end != -1:
                response_text = response_text[start:end].strip()
        elif "```" in response_text:
            # 提取代码块
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            if end != -1:
                response_text = response_text[start:end].strip()
        
        # 解析JSON
        try:
            question_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}, 原始响应: {response_text}")
            return AIGenerateQuestionResponse(
                success=False,
                error=f"AI返回的格式不正确，无法解析JSON: {str(e)}"
            )
        
        # 验证和格式化返回数据
        result_question = {
            "question_type": request.question_type,
            "knowledge_point": request.knowledge_point,
            "title": question_data.get("title", ""),
            "answer": question_data.get("answer", ""),
            "explanation": question_data.get("explanation", ""),
            "difficulty": question_data.get("difficulty", 1),
            "options": question_data.get("options", [])
        }
        
        # 验证必填字段
        if not result_question["title"]:
            return AIGenerateQuestionResponse(
                success=False,
                error="AI生成的题目缺少题干"
            )
        
        if request.question_type in ["single_choice", "multiple_choice", "true_false"]:
            if not result_question["options"] or len(result_question["options"]) < 2:
                return AIGenerateQuestionResponse(
                    success=False,
                    error="AI生成的题目选项不足"
                )
        else:
            if not result_question["answer"]:
                return AIGenerateQuestionResponse(
                    success=False,
                    error="AI生成的题目缺少答案"
                )
        
        return AIGenerateQuestionResponse(
            success=True,
            question=result_question
        )
        
    except Exception as e:
        logger.error(f"AI出题失败: {e}", exc_info=True)
        return AIGenerateQuestionResponse(
            success=False,
            error=f"AI出题失败: {str(e)}"
        )

async def call_openai_compatible(config: LLMConfig, prompt: str) -> str:
    """调用OpenAI兼容的API"""
    endpoint = config.endpoint_url.rstrip('/') if config.endpoint_url else ""
    # 如果endpoint已经包含/chat/completions，就不需要再拼接
    if endpoint.endswith('/chat/completions'):
        url = endpoint
    else:
        url = f"{endpoint}/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": config.model_name or "default",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 2000
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        else:
            raise Exception("响应格式错误")

async def call_aliyun_qwen(config: LLMConfig, prompt: str) -> str:
    """调用阿里云通义千问API"""
    endpoint = config.endpoint_url.rstrip('/') if config.endpoint_url else ""
    url = f"{endpoint}/services/aigc/text-generation/generation"
    
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": config.model_name or "qwen-max",
        "input": {
            "messages": [
                {"role": "user", "content": prompt}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 2000
        }
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        if "output" in result and "text" in result["output"]:
            return result["output"]["text"]
        else:
            raise Exception("响应格式错误")

async def call_wenxin(config: LLMConfig, prompt: str) -> str:
    """调用文心一言API"""
    if not config.api_secret:
        raise Exception("文心一言需要配置API Secret")
    
    # 获取access_token
    token_url = "https://aip.baidubce.com/oauth/2.0/token"
    token_params = {
        "grant_type": "client_credentials",
        "client_id": config.api_key,
        "client_secret": config.api_secret
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        token_response = await client.post(token_url, params=token_params)
        token_response.raise_for_status()
        access_token = token_response.json()["access_token"]
        
        # 调用对话API
        endpoint = config.endpoint_url.rstrip('/') if config.endpoint_url else ""
        chat_url = f"{endpoint}/wenxinworkshop/chat/completions"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        params = {
            "access_token": access_token
        }
        
        data = {
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_output_tokens": 2000
        }
        
        chat_response = await client.post(chat_url, json=data, headers=headers, params=params)
        chat_response.raise_for_status()
        result = chat_response.json()
        
        if "result" in result:
            return result["result"]
        else:
            raise Exception("响应格式错误")

