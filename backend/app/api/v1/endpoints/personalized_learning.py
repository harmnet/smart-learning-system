"""
个性化学习与AI测评API端点
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc, func, text
from sqlalchemy.orm import selectinload
import logging
import json
import re

from app.db.session import get_db
from app.models.base import User
from app.models.teaching_resource import TeachingResource
from app.models.student_learning import (
    PersonalizedLearningContent, 
    AIQuizRecord, 
    StudentLearningAssessment,
    StudentLearningProfile,
    StudentLearningBehavior
)
from app.models.llm_config import LLMConfig
from app.schemas.personalized_learning import (
    PersonalizedContentRequest,
    PersonalizedContentResponse,
    PersonalizedContentHistoryItem,
    PersonalizedContentStudyRecordRequest,
    AIQuizGenerateRequest,
    AIQuizResponse,
    AIQuizSubmitRequest,
    AIQuizSubmitResponse,
    AIQuizHistoryItem,
    AIQuizStudyRecordRequest,
    QuizQuestion
)
from app.api.v1.endpoints.students import get_current_user
from app.api.v1.endpoints.ai_creation import call_openai_compatible, call_aliyun_qwen
from app.utils.resource_parser import download_and_parse_resource

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== 个性化学习内容 APIs ====================

@router.get("/personalized-content/{resource_id}", response_model=PersonalizedContentResponse)
async def get_personalized_content(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取资源的个性化学习内容（最新）"""
    try:
        # 查询最新的个性化内容
        result = await db.execute(
            select(PersonalizedLearningContent)
            .where(
                PersonalizedLearningContent.student_id == current_user.id,
                PersonalizedLearningContent.resource_id == resource_id
            )
            .order_by(desc(PersonalizedLearningContent.created_at))
            .limit(1)
        )
        content = result.scalars().first()
        
        if not content:
            # 没有内容，返回空状态
            return PersonalizedContentResponse(
                id=0,
                content="",
                created_at=None,
                has_history=False,
                history_count=0
            )
        
        # 查询历史记录数量
        count_result = await db.execute(
            select(func.count(PersonalizedLearningContent.id))
            .where(
                PersonalizedLearningContent.student_id == current_user.id,
                PersonalizedLearningContent.resource_id == resource_id
            )
        )
        history_count = count_result.scalar()
        
        return PersonalizedContentResponse(
            id=content.id,
            content=content.content,
            created_at=content.created_at,
            has_history=history_count > 1,
            history_count=history_count
        )
    
    except Exception as e:
        logger.error(f"获取个性化内容失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/personalized-content/generate", response_model=PersonalizedContentResponse)
async def generate_personalized_content(
    request: PersonalizedContentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """生成新的个性化学习内容"""
    try:
        logger.info(f"学生 {current_user.id} 请求为资源 {request.resource_id} 生成个性化内容")
        
        # 1. 获取教学资源
        resource_result = await db.execute(
            select(TeachingResource).where(TeachingResource.id == request.resource_id)
        )
        resource = resource_result.scalars().first()
        
        if not resource:
            raise HTTPException(status_code=404, detail="教学资源不存在")
        
        # 2. 获取学生最新的学习偏好测评
        profile_result = await db.execute(
            select(StudentLearningProfile)
            .where(StudentLearningProfile.student_id == current_user.id)
            .options(selectinload(StudentLearningProfile.latest_assessment))
        )
        profile = profile_result.scalars().first()
        
        if not profile or not profile.latest_assessment:
            raise HTTPException(
                status_code=400,
                detail="请先完成学习偏好测评，以便生成更适合您的个性化学习内容"
            )
        
        assessment = profile.latest_assessment
        tags = ", ".join(assessment.tags) if assessment.tags else "未知"
        
        # 3. 获取激活的LLM配置
        llm_result = await db.execute(
            select(LLMConfig).where(LLMConfig.is_active == True).limit(1)
        )
        llm_config = llm_result.scalars().first()
        
        if not llm_config:
            raise HTTPException(status_code=503, detail="系统未配置大模型服务")
        
        # 4. 下载并解析资源文件
        logger.info(f"开始解析资源文件: {resource.resource_name}")
        resource_content = await download_and_parse_resource(resource)
        
        if not resource_content or len(resource_content) < 50:
            raise HTTPException(status_code=400, detail="资源文件内容为空或过短，无法生成个性化内容")
        
        # 5. 构建AI提示词
        prompt = build_personalized_content_prompt(
            tags=tags,
            evaluation=assessment.ai_evaluation,
            resource_name=resource.resource_name,
            resource_content=resource_content
        )
        
        # 6. 调用LLM生成个性化内容
        logger.info("调用LLM生成个性化内容")
        if llm_config.provider_key == "aliyun_qwen":
            ai_content = await call_aliyun_qwen(llm_config, prompt)
        else:
            ai_content = await call_openai_compatible(llm_config, prompt)
        
        # 7. 保存到数据库
        new_content = PersonalizedLearningContent(
            student_id=current_user.id,
            resource_id=request.resource_id,
            content=ai_content,
            assessment_id=assessment.id,
            llm_config_id=llm_config.id
        )
        db.add(new_content)
        await db.commit()
        await db.refresh(new_content)
        
        logger.info(f"个性化内容生成成功: ID {new_content.id}")
        
        # 8. 查询历史记录数量
        count_result = await db.execute(
            select(func.count(PersonalizedLearningContent.id))
            .where(
                PersonalizedLearningContent.student_id == current_user.id,
                PersonalizedLearningContent.resource_id == request.resource_id
            )
        )
        history_count = count_result.scalar()
        
        return PersonalizedContentResponse(
            id=new_content.id,
            content=new_content.content,
            created_at=new_content.created_at,
            has_history=history_count > 1,
            history_count=history_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成个性化内容失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")


@router.post("/personalized-content/record-study", status_code=status.HTTP_204_NO_CONTENT)
async def record_personalized_content_study(
    request: PersonalizedContentStudyRecordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """记录个性化学习内容的学习行为"""
    try:
        # 过滤掉过短的学习时长
        if request.duration_seconds < 5:
            logger.info(f"学生 {current_user.id} 个性化内容 {request.content_id} 学习时长过短 ({request.duration_seconds}s)，不予记录。")
            return
        
        # 通过 course_section_resource 表查找资源所属的课程和章节
        section_resource_result = await db.execute(
            text("""
                SELECT csr.chapter_id, cc.course_id
                FROM course_section_resource csr
                JOIN course_chapter cc ON csr.chapter_id = cc.id
                WHERE csr.resource_type = 'teaching_resource' AND csr.resource_id = :resource_id
                LIMIT 1
            """),
            {"resource_id": request.resource_id}
        )
        section_resource = section_resource_result.fetchone()
        
        if not section_resource:
            logger.warning(f"记录个性化内容学习时长时，资源 {request.resource_id} 未关联到任何课程章节。")
            # 即使没有关联，也记录学习行为，只是 course_id 和 chapter_id 为空
            course_id = None
            chapter_id = None
        else:
            chapter_id = section_resource[0]
            course_id = section_resource[1]
        
        # 创建学习行为记录
        learning_behavior = StudentLearningBehavior(
            student_id=current_user.id,
            course_id=course_id,
            chapter_id=chapter_id,
            resource_id=request.resource_id,
            resource_type="personalized_learning_content",
            behavior_type="view_personalized_content",
            duration_seconds=request.duration_seconds,
            description=f"查看个性化学习内容 (ID: {request.content_id})"
        )
        
        db.add(learning_behavior)
        await db.commit()
        logger.info(f"学生 {current_user.id} 记录个性化内容 {request.content_id} 学习时长: {request.duration_seconds}秒 (课程ID: {course_id}, 章节ID: {chapter_id})")
        
    except Exception as e:
        logger.error(f"记录个性化学习行为失败: {e}")
        await db.rollback()


@router.get("/personalized-content/{resource_id}/history", response_model=List[PersonalizedContentHistoryItem])
async def get_personalized_content_history(
    resource_id: int,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取个性化学习内容历史记录"""
    try:
        result = await db.execute(
            select(PersonalizedLearningContent)
            .where(
                PersonalizedLearningContent.student_id == current_user.id,
                PersonalizedLearningContent.resource_id == resource_id
            )
            .order_by(desc(PersonalizedLearningContent.created_at))
            .offset(skip)
            .limit(limit)
        )
        history = result.scalars().all()
        
        return [
            PersonalizedContentHistoryItem(
                id=item.id,
                content=item.content,
                created_at=item.created_at
            )
            for item in history
        ]
    
    except Exception as e:
        logger.error(f"获取历史记录失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def build_personalized_content_prompt(tags: str, evaluation: str, resource_name: str, resource_content: str) -> str:
    """构建个性化学习内容的AI提示词"""
    prompt = f"""你是一位资深教育专家。请根据学生的学习特征，将以下学习资源内容转化为更适合该学生的个性化学习材料。

学生学习特征：{tags}

学生学习偏好分析：
{evaluation}

原始学习资源：《{resource_name}》

原始学习资源内容：
{resource_content}

**重要要求：**
1. 请直接讲解和阐述学习内容本身，而不是制定学习计划
2. 根据学生的学习特征调整内容的讲解方式、详细程度和重点
3. 如果学生喜欢视觉学习，多用类比和场景描述；如果喜欢系统学习，强调逻辑关系和结构
4. 保持内容的完整性和连贯性，字数在1000-2000字
5. 使用简体中文，结构清晰
6. 使用Markdown格式组织内容，包括：
   - 使用 ## 和 ### 标记章节标题
   - 使用 **粗体** 标记重点概念
   - 使用 > 引用重要提示
   - 使用代码块标记示例代码
   - 使用列表组织要点
7. 在适当位置加入针对该学生特点的小提示（用 > 💡 **提示：** 格式）

请直接生成学习内容，不要生成学习计划或学习建议。内容应该是可以直接阅读学习的知识讲解。
"""
    return prompt


# ==================== AI测评 APIs ====================

@router.post("/ai-quiz/generate", response_model=AIQuizResponse)
async def generate_ai_quiz(
    request: AIQuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """生成AI测评题目"""
    try:
        logger.info(f"学生 {current_user.id} 请求为资源 {request.resource_id} 生成AI测评")
        
        # 1. 获取教学资源
        resource_result = await db.execute(
            select(TeachingResource).where(TeachingResource.id == request.resource_id)
        )
        resource = resource_result.scalars().first()
        
        if not resource:
            raise HTTPException(status_code=404, detail="教学资源不存在")
        
        # 2. 获取学生最新的学习偏好测评
        profile_result = await db.execute(
            select(StudentLearningProfile)
            .where(StudentLearningProfile.student_id == current_user.id)
            .options(selectinload(StudentLearningProfile.latest_assessment))
        )
        profile = profile_result.scalars().first()
        
        if not profile or not profile.latest_assessment:
            raise HTTPException(
                status_code=400,
                detail="请先完成学习偏好测评，以便生成更适合您的测评题目"
            )
        
        assessment = profile.latest_assessment
        tags = ", ".join(assessment.tags) if assessment.tags else "未知"
        
        # 3. 获取历史测评记录（最近3次）
        history_result = await db.execute(
            select(AIQuizRecord)
            .where(
                AIQuizRecord.student_id == current_user.id,
                AIQuizRecord.resource_id == request.resource_id,
                AIQuizRecord.is_submitted == True
            )
            .order_by(desc(AIQuizRecord.submitted_at))
            .limit(3)
        )
        history_records = history_result.scalars().all()
        
        history_summary = build_quiz_history_summary(history_records)
        
        # 4. 获取激活的LLM配置
        llm_result = await db.execute(
            select(LLMConfig).where(LLMConfig.is_active == True).limit(1)
        )
        llm_config = llm_result.scalars().first()
        
        if not llm_config:
            raise HTTPException(status_code=503, detail="系统未配置大模型服务")
        
        # 5. 下载并解析资源文件
        logger.info(f"开始解析资源文件: {resource.resource_name}")
        resource_content = await download_and_parse_resource(resource)
        
        if not resource_content or len(resource_content) < 50:
            raise HTTPException(status_code=400, detail="资源文件内容为空或过短，无法生成测评题目")
        
        # 6. 构建AI提示词
        prompt = build_quiz_generation_prompt(
            tags=tags,
            history=history_summary,
            resource_name=resource.resource_name,
            resource_content=resource_content
        )
        
        # 7. 调用LLM生成题目
        logger.info("调用LLM生成测评题目")
        if llm_config.provider_key == "aliyun_qwen":
            ai_response = await call_aliyun_qwen(llm_config, prompt)
        else:
            ai_response = await call_openai_compatible(llm_config, prompt)
        
        # 8. 解析JSON格式的题目
        questions = parse_quiz_questions(ai_response)
        
        if not questions or len(questions) != 5:
            raise HTTPException(status_code=500, detail="AI生成的题目格式不正确，请重试")
        
        # 9. 保存到数据库
        new_quiz = AIQuizRecord(
            student_id=current_user.id,
            resource_id=request.resource_id,
            assessment_id=assessment.id,
            questions=questions,
            llm_config_id=llm_config.id
        )
        db.add(new_quiz)
        await db.commit()
        await db.refresh(new_quiz)
        
        logger.info(f"AI测评生成成功: ID {new_quiz.id}")
        
        # 10. 构建响应（不包含正确答案）
        quiz_questions = [
            QuizQuestion(
                id=q["id"],
                type=q["type"],
                question=q["question"],
                options=q["options"],
                correct_answer=q["correct_answer"],  # 前端不显示，提交时用于判题
                explanation=q["explanation"]
            )
            for q in questions
        ]
        
        return AIQuizResponse(
            id=new_quiz.id,
            questions=quiz_questions,
            is_submitted=False,
            score=None,
            total_score=100,
            created_at=new_quiz.created_at,
            submitted_at=None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成AI测评失败: {e}")
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")


@router.post("/ai-quiz/retry/{quiz_id}", response_model=AIQuizResponse)
async def retry_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """用相同的题目重新做一次测评"""
    try:
        # 获取原测评记录
        result = await db.execute(
            select(AIQuizRecord)
            .where(
                AIQuizRecord.id == quiz_id,
                AIQuizRecord.student_id == current_user.id
            )
        )
        original_quiz = result.scalars().first()
        
        if not original_quiz:
            raise HTTPException(status_code=404, detail="原测评记录不存在")
        
        # 创建新的测评记录，题目相同但是新的ID
        new_quiz = AIQuizRecord(
            student_id=current_user.id,
            resource_id=original_quiz.resource_id,
            assessment_id=original_quiz.assessment_id,
            questions=original_quiz.questions,  # 使用相同的题目
            llm_config_id=original_quiz.llm_config_id,
            is_submitted=False,
            total_score=original_quiz.total_score
        )
        
        db.add(new_quiz)
        await db.commit()
        await db.refresh(new_quiz)
        
        # 解析题目并返回
        questions = []
        for q_data in new_quiz.questions:
            if isinstance(q_data, str):
                q_dict = json.loads(q_data)
            else:
                q_dict = q_data
            questions.append(QuizQuestion(**q_dict))
        
        return AIQuizResponse(
            id=new_quiz.id,
            questions=questions,
            is_submitted=new_quiz.is_submitted,
            score=None,
            total_score=new_quiz.total_score,
            created_at=new_quiz.created_at,
            submitted_at=None,
            user_answers=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"重做测评失败: {e}")
        raise HTTPException(status_code=500, detail=f"重做测评失败: {str(e)}")


@router.post("/ai-quiz/submit", response_model=AIQuizSubmitResponse)
async def submit_ai_quiz(
    request: AIQuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """提交AI测评答案并自动判题"""
    try:
        # 1. 获取测评记录
        quiz_result = await db.execute(
            select(AIQuizRecord).where(
                AIQuizRecord.id == request.quiz_id,
                AIQuizRecord.student_id == current_user.id
            )
        )
        quiz = quiz_result.scalars().first()
        
        if not quiz:
            raise HTTPException(status_code=404, detail="测评记录不存在")
        
        if quiz.is_submitted:
            raise HTTPException(status_code=400, detail="该测评已提交，不能重复提交")
        
        # 2. 自动判题
        questions = quiz.questions
        total_score = 0.0
        scored_questions = []
        
        for question in questions:
            q_id = question["id"]
            correct_answer = question["correct_answer"]
            user_answer = request.answers.get(q_id)
            
            # 判断答案是否正确
            is_correct = False
            if question["type"] == "multiple":
                # 多选题：需要完全匹配
                if isinstance(user_answer, list) and isinstance(correct_answer, list):
                    is_correct = set(user_answer) == set(correct_answer)
            else:
                # 单选题和判断题
                is_correct = user_answer == correct_answer
            
            # 每题20分
            question_score = 20.0 if is_correct else 0.0
            total_score += question_score
            
            # 添加判题结果
            scored_question = question.copy()
            scored_question["user_answer"] = user_answer
            scored_question["is_correct"] = is_correct
            scored_questions.append(scored_question)
        
        # 3. 更新数据库
        from datetime import datetime
        quiz.user_answers = request.answers
        quiz.score = total_score
        quiz.is_submitted = True
        quiz.submitted_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(quiz)
        
        logger.info(f"测评提交成功: ID {quiz.id}, 得分 {total_score}")
        
        # 4. 构建响应
        quiz_questions = [
            QuizQuestion(
                id=q["id"],
                type=q["type"],
                question=q["question"],
                options=q["options"],
                correct_answer=q["correct_answer"],
                explanation=q["explanation"],
                user_answer=q.get("user_answer"),
                is_correct=q.get("is_correct")
            )
            for q in scored_questions
        ]
        
        return AIQuizSubmitResponse(
            id=quiz.id,
            score=total_score,
            total_score=100,
            questions=quiz_questions,
            submitted_at=quiz.submitted_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"提交测评失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai-quiz/detail/{quiz_id}", response_model=AIQuizResponse)
async def get_quiz_detail(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取测评详情"""
    try:
        result = await db.execute(
            select(AIQuizRecord)
            .where(
                AIQuizRecord.id == quiz_id,
                AIQuizRecord.student_id == current_user.id
            )
        )
        quiz_record = result.scalars().first()
        
        if not quiz_record:
            raise HTTPException(status_code=404, detail="测评记录不存在")
        
        # 解析题目
        questions = []
        for q_data in quiz_record.questions:
            if isinstance(q_data, str):
                q_dict = json.loads(q_data)
            else:
                q_dict = q_data
            
            question = QuizQuestion(**q_dict)
            
            # 如果已提交，添加用户答案和判题结果
            if quiz_record.is_submitted and quiz_record.user_answers:
                user_answer = quiz_record.user_answers.get(str(question.id))
                question.user_answer = user_answer
                
                # 判断是否正确
                is_correct = False
                if question.type == "single" or question.type == "judge":
                    is_correct = (str(user_answer) == str(question.correct_answer))
                elif question.type == "multiple":
                    user_ans_set = set(user_answer if isinstance(user_answer, list) else [user_answer])
                    correct_ans_set = set(question.correct_answer if isinstance(question.correct_answer, list) else [question.correct_answer])
                    is_correct = (user_ans_set == correct_ans_set)
                
                question.is_correct = is_correct
            
            questions.append(question)
        
        return AIQuizResponse(
            id=quiz_record.id,
            questions=questions,
            is_submitted=quiz_record.is_submitted,
            score=float(quiz_record.score) if quiz_record.score else None,
            total_score=quiz_record.total_score,
            created_at=quiz_record.created_at,
            submitted_at=quiz_record.submitted_at,
            user_answers=quiz_record.user_answers
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取测评详情失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取测评详情失败: {str(e)}")


@router.post("/ai-quiz/record-study", status_code=status.HTTP_204_NO_CONTENT)
async def record_quiz_study(
    request: AIQuizStudyRecordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """记录AI测评的学习行为"""
    try:
        # 过滤掉过短的学习时长
        if request.duration_seconds < 5:
            logger.info(f"学生 {current_user.id} AI测评 {request.quiz_id} 学习时长过短 ({request.duration_seconds}s)，不予记录。")
            return
        
        # 获取测评记录信息
        quiz_result = await db.execute(
            select(AIQuizRecord).where(AIQuizRecord.id == request.quiz_id)
        )
        quiz_record = quiz_result.scalars().first()
        
        if not quiz_record:
            logger.warning(f"记录AI测评学习时长时，测评记录 {request.quiz_id} 未找到。")
            return
        
        # 通过 course_section_resource 表查找资源所属的课程和章节
        section_resource_result = await db.execute(
            text("""
                SELECT csr.chapter_id, cc.course_id
                FROM course_section_resource csr
                JOIN course_chapter cc ON csr.chapter_id = cc.id
                WHERE csr.resource_type = 'teaching_resource' AND csr.resource_id = :resource_id
                LIMIT 1
            """),
            {"resource_id": quiz_record.resource_id}
        )
        section_resource = section_resource_result.fetchone()
        
        if not section_resource:
            logger.warning(f"记录AI测评学习时长时，资源 {quiz_record.resource_id} 未关联到任何课程章节。")
            course_id = None
            chapter_id = None
        else:
            chapter_id = section_resource[0]
            course_id = section_resource[1]
        
        # 创建学习行为记录
        learning_behavior = StudentLearningBehavior(
            student_id=current_user.id,
            course_id=course_id,
            chapter_id=chapter_id,
            resource_id=request.quiz_id,
            resource_type="ai_quiz",
            behavior_type="take_ai_quiz",
            duration_seconds=request.duration_seconds,
            description=f"AI智能测评 (ID: {request.quiz_id})"
        )
        
        db.add(learning_behavior)
        await db.commit()
        logger.info(f"学生 {current_user.id} 记录AI测评 {request.quiz_id} 学习时长: {request.duration_seconds}秒 (课程ID: {course_id}, 章节ID: {chapter_id})")
        
    except Exception as e:
        logger.error(f"记录AI测评行为失败: {e}")
        await db.rollback()


@router.get("/ai-quiz/{resource_id}/history", response_model=List[AIQuizHistoryItem])
async def get_ai_quiz_history(
    resource_id: int,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """获取AI测评历史记录"""
    try:
        result = await db.execute(
            select(AIQuizRecord)
            .where(
                AIQuizRecord.student_id == current_user.id,
                AIQuizRecord.resource_id == resource_id
            )
            .order_by(desc(AIQuizRecord.created_at))
            .offset(skip)
            .limit(limit)
        )
        history = result.scalars().all()
        
        return [
            AIQuizHistoryItem(
                id=item.id,
                is_submitted=item.is_submitted,
                score=float(item.score) if item.score else None,
                total_score=item.total_score,
                created_at=item.created_at,
                submitted_at=item.submitted_at,
                question_count=len(item.questions)
            )
            for item in history
        ]
    
    except Exception as e:
        logger.error(f"获取测评历史失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def build_quiz_history_summary(history_records: List[AIQuizRecord]) -> str:
    """构建测评历史摘要"""
    if not history_records:
        return "无历史测评记录"
    
    summary_parts = []
    for i, record in enumerate(history_records, 1):
        score = float(record.score) if record.score else 0
        summary_parts.append(f"第{i}次测评：得分 {score}分")
    
    return "；".join(summary_parts)


def build_quiz_generation_prompt(tags: str, history: str, resource_name: str, resource_content: str) -> str:
    """构建AI测评题目生成提示词"""
    prompt = f"""你是一位资深命题专家。请根据以下信息生成测评题目：

学生学习特征：{tags}

历史测评情况：{history}

学习资源名称：{resource_name}

学习资源内容：
{resource_content}

请生成5道测试题，要求：
- 2道单选题（4个选项，标记为A、B、C、D）
- 2道多选题（4个选项，标记为A、B、C、D，2-3个正确答案）
- 1道判断题（选项为"正确"和"错误"）

返回格式必须是有效的JSON数组，格式如下：
[
  {{
    "id": 1,
    "type": "single",
    "question": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "correct_answer": "A",
    "explanation": "答案解析"
  }},
  {{
    "id": 2,
    "type": "multiple",
    "question": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "correct_answer": ["A", "C"],
    "explanation": "答案解析"
  }},
  {{
    "id": 5,
    "type": "judge",
    "question": "题目内容",
    "options": ["正确", "错误"],
    "correct_answer": "正确",
    "explanation": "答案解析"
  }}
]

注意事项：
1. 题目要基于学习资源内容
2. 难度要适合学生的学习特征
3. 避免与历史测评题目重复
4. 使用简体中文
5. 直接返回JSON数组，不要添加任何额外的文字说明
"""
    return prompt


def parse_quiz_questions(ai_response: str) -> List[dict]:
    """解析AI返回的JSON格式题目"""
    try:
        # 尝试直接解析
        questions = json.loads(ai_response)
        return questions
    except json.JSONDecodeError:
        # 如果失败，尝试提取JSON部分
        logger.warning("JSON解析失败，尝试提取JSON内容")
        
        # 查找JSON数组
        match = re.search(r'\[\s*\{.*\}\s*\]', ai_response, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                questions = json.loads(json_str)
                return questions
            except:
                pass
        
        logger.error("无法解析AI返回的题目")
        raise Exception("AI返回的题目格式不正确")
