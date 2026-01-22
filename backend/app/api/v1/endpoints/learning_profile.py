"""
学生学习偏好测评API
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
import httpx
import logging

from app.db.session import get_db
from app.models.base import User
from app.models.student_learning import StudentLearningProfile, StudentLearningAssessment
from app.models.llm_config import LLMConfig
from app.schemas.learning_profile import (
    AssessmentSubmit,
    AssessmentResponse,
    ProfileResponse,
    AssessmentHistoryResponse
)
from app.api.v1.endpoints.students import get_current_user
from app.utils.llm_call_logger import log_llm_call

router = APIRouter()
logger = logging.getLogger(__name__)

# 问卷题目配置（用于生成评价时的提示词）
QUESTION_LABELS = {
    "q1": "我喜欢在固定的时间段学习（如每天晚上8点）",
    "q2": "我能够长时间保持专注学习（超过1小时不休息）",
    "q3": "我喜欢通过视频学习新知识，而不是阅读文字材料",
    "q4": "学习新内容后，我会主动做练习题来巩固知识",
    "q5": "我喜欢做笔记来整理和记忆学习内容",
    "q6": "我更喜欢有挑战性的学习内容，而不是简单易懂的",
    "q7": "我会制定详细的学习计划并严格执行",
    "q8": "我喜欢与同学讨论学习内容，而不是独自学习",
    "q9": "我需要安静的环境才能有效学习",
    "q10": "我会定期回顾之前学过的内容，避免遗忘"
}

SCORE_LABELS = {
    "1": "完全不符合",
    "2": "不太符合",
    "3": "一般",
    "4": "比较符合",
    "5": "完全符合"
}


@router.get("", response_model=ProfileResponse)
async def get_learning_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取当前学生的学习偏好档案
    """
    try:
        # 查询档案
        profile_result = await db.execute(
            select(StudentLearningProfile)
            .where(StudentLearningProfile.student_id == current_user.id)
            .options(selectinload(StudentLearningProfile.latest_assessment))
        )
        profile = profile_result.scalars().first()

        if not profile:
            # 没有档案，返回空状态
            return ProfileResponse(
                has_profile=False,
                total_assessments=0,
                latest_assessment=None,
                history=[]
            )

        # 查询历史记录（最近5条）
        history_result = await db.execute(
            select(StudentLearningAssessment)
            .where(StudentLearningAssessment.student_id == current_user.id)
            .order_by(desc(StudentLearningAssessment.created_at))
            .limit(5)
        )
        history = history_result.scalars().all()

        return ProfileResponse(
            has_profile=True,
            total_assessments=profile.total_assessments,
            latest_assessment=profile.latest_assessment,
            history=history
        )

    except Exception as e:
        logger.error(f"获取学习档案失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取学习档案失败: {str(e)}")


@router.post("/submit", response_model=AssessmentResponse)
async def submit_assessment(
    data: AssessmentSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    提交学习偏好测评
    """
    try:
        logger.info(f"学生 {current_user.id} 提交学习偏好测评")

        # 1. 验证答案完整性（10道题）
        if len(data.answers) != 10:
            raise HTTPException(status_code=400, detail="请完成所有10道题目")

        for i in range(1, 11):
            if f"q{i}" not in data.answers:
                raise HTTPException(status_code=400, detail=f"缺少问题{i}的答案")

        # 2. 获取激活的LLM配置
        llm_result = await db.execute(
            select(LLMConfig).where(LLMConfig.is_active == True)
        )
        llm_config = llm_result.scalars().first()

        if not llm_config:
            raise HTTPException(status_code=503, detail="系统未配置大模型服务，请联系管理员")

        # 3. 构建提示词
        prompt = build_evaluation_prompt(data.answers, data.open_response)

        # 4. 调用LLM生成评价
        logger.info(f"调用LLM生成评价，使用配置: {llm_config.provider_name}")
        ai_evaluation = None
        async with log_llm_call(
            db=db,
            function_type="learning_profile_assessment",
            user_id=current_user.id,
            user_role=current_user.role,
            llm_config_id=llm_config.id,
            prompt=prompt,
            related_type="learning_assessment"
        ) as log_context:
            try:
                ai_evaluation = await call_llm_api(llm_config, prompt)
                log_context.set_result(ai_evaluation, status='success')
            except Exception as e:
                logger.error(f"LLM调用失败: {str(e)}", exc_info=True)
                log_context.set_result(None, status='failed', error_message=str(e))
                raise

        # 5. 提取标签和评价内容
        tags = []
        evaluation_text = ai_evaluation
        
        # 尝试从评价中提取标签（格式：标签：xxx、xxx、xxx）
        if "标签：" in ai_evaluation or "标签:" in ai_evaluation:
            lines = ai_evaluation.split('\n')
            for i, line in enumerate(lines):
                if '标签：' in line or '标签:' in line:
                    # 提取标签行
                    tag_line = line.split('：')[-1].split(':')[-1].strip()
                    # 分割标签（支持顿号、逗号、空格等分隔符）
                    import re
                    raw_tags = re.split('[、，,\\s]+', tag_line)
                    tags = [t.strip() for t in raw_tags if t.strip()][:3]  # 最多3个标签
                    
                    # 移除标签行，保留其余内容作为评价文本
                    evaluation_text = '\n'.join(lines[:i] + lines[i+1:]).strip()
                    break
        
        logger.info(f"提取的标签: {tags}")

        # 6. 保存测评记录
        assessment = StudentLearningAssessment(
            student_id=current_user.id,
            answers=data.answers,
            open_response=data.open_response,
            ai_evaluation=evaluation_text,  # 保存不含标签行的评价文本
            tags=tags if tags else None,
            llm_config_id=llm_config.id
        )
        db.add(assessment)
        await db.flush()
        await db.refresh(assessment)

        # 7. 更新或创建档案
        profile_result = await db.execute(
            select(StudentLearningProfile)
            .where(StudentLearningProfile.student_id == current_user.id)
        )
        profile = profile_result.scalars().first()

        if profile:
            # 更新现有档案
            profile.latest_assessment_id = assessment.id
            profile.total_assessments += 1
        else:
            # 创建新档案
            profile = StudentLearningProfile(
                student_id=current_user.id,
                latest_assessment_id=assessment.id,
                total_assessments=1
            )
            db.add(profile)

        await db.commit()
        await db.refresh(assessment)

        logger.info(f"测评提交成功，ID: {assessment.id}")
        return assessment

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"提交测评失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"提交测评失败: {str(e)}")


@router.get("/history", response_model=AssessmentHistoryResponse)
async def get_assessment_history(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取测评历史记录（分页）
    """
    try:
        # 查询总数
        total_result = await db.execute(
            select(StudentLearningAssessment)
            .where(StudentLearningAssessment.student_id == current_user.id)
        )
        total = len(total_result.scalars().all())

        # 查询历史记录
        history_result = await db.execute(
            select(StudentLearningAssessment)
            .where(StudentLearningAssessment.student_id == current_user.id)
            .order_by(desc(StudentLearningAssessment.created_at))
            .offset(skip)
            .limit(limit)
        )
        assessments = history_result.scalars().all()

        return AssessmentHistoryResponse(
            total=total,
            assessments=assessments
        )

    except Exception as e:
        logger.error(f"获取测评历史失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取测评历史失败: {str(e)}")


def build_evaluation_prompt(answers: dict, open_response: str = None) -> str:
    """
    构建LLM评价提示词
    """
    # 格式化问题和答案（按q1-q10排序）
    formatted_answers = []
    for i in range(1, 11):
        q_id = f"q{i}"
        if q_id in answers:
            q_label = QUESTION_LABELS.get(q_id, q_id)
            score = answers[q_id]
            score_label = SCORE_LABELS.get(score, score)
            formatted_answers.append(f"- {q_label}: {score}分（{score_label}）")

    answers_text = "\n".join(formatted_answers)

    # 构建提示词
    prompt = f"""你是一位专业的学习分析师。以下是一位学生的学习习惯和偏好测评结果（评分范围1-5分），请基于这些信息，为该学生生成分析报告。

**重要要求**：
1. 只分析学生的学习习惯和偏好特点，不要给出任何学习建议或改进方案
2. 使用简体中文撰写，字数控制在200-300字
3. 语气保持客观、积极或中性，避免负面评价
4. 在分析报告的**最开始**，用"标签："开头，提供3个最能概括该学生学习特征的关键词（用中文顿号分隔，如：标签：自律型、视觉学习者、独立思考），然后换行开始正文分析

测评结果（1-5分制）：
{answers_text}
"""

    if open_response:
        prompt += f"\n学生补充说明：{open_response}\n"

    prompt += "\n请生成分析报告："

    return prompt


async def call_llm_api(config: LLMConfig, prompt: str) -> str:
    """
    调用LLM API生成评价
    支持多种提供商
    """
    provider_key = config.provider_key

    try:
        if provider_key == "aliyun_qwen":
            return await call_aliyun_qwen(config, prompt)
        elif provider_key in ["deepseek", "kimi", "volcengine_doubao", "siliconflow"]:
            return await call_openai_compatible(config, prompt)
        elif provider_key == "wenxin":
            return await call_wenxin(config, prompt)
        else:
            raise Exception(f"不支持的LLM提供商: {provider_key}")

    except Exception as e:
        logger.error(f"LLM API调用失败: {str(e)}")
        raise Exception(f"AI评价生成失败: {str(e)}")


async def call_openai_compatible(config: LLMConfig, prompt: str) -> str:
    """
    调用OpenAI兼容的API（DeepSeek, KIMI, SiliconFlow, 火山引擎等）
    """
    endpoint = config.endpoint_url.rstrip('/') if config.endpoint_url else ""
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
        "max_tokens": 1000
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        else:
            raise Exception("LLM响应格式错误")


async def call_aliyun_qwen(config: LLMConfig, prompt: str) -> str:
    """
    调用阿里云通义千问API
    """
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
            "max_tokens": 1000,
            "temperature": 0.7
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()

        if "output" in result and "text" in result["output"]:
            return result["output"]["text"]
        else:
            raise Exception("阿里云API响应格式错误")


async def call_wenxin(config: LLMConfig, prompt: str) -> str:
    """
    调用文心一言API
    """
    if not config.api_secret:
        raise Exception("文心一言需要配置API Secret")

    # 获取access_token
    token_url = "https://aip.baidubce.com/oauth/2.0/token"
    token_params = {
        "grant_type": "client_credentials",
        "client_id": config.api_key,
        "client_secret": config.api_secret
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
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
            ]
        }

        chat_response = await client.post(chat_url, json=data, headers=headers, params=params)
        chat_response.raise_for_status()
        result = chat_response.json()

        if "result" in result:
            return result["result"]
        else:
            raise Exception("文心一言API响应格式错误")
