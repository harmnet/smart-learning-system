"""
学习偏好测评相关的 Pydantic Schemas
"""
from typing import Dict, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class AssessmentSubmit(BaseModel):
    """提交测评的请求体"""
    answers: Dict[str, str] = Field(..., description="问题答案，格式：{'q1': 'option_a', 'q2': 'option_b', ...}")
    open_response: Optional[str] = Field(None, description="开放题回答（选填）")

    class Config:
        json_schema_extra = {
            "example": {
                "answers": {
                    "q1": "option_b",
                    "q2": "option_c",
                    "q3": "option_a",
                    "q4": "option_b",
                    "q5": "option_a",
                    "q6": "option_b",
                    "q7": "option_b",
                    "q8": "option_b",
                    "q9": "option_c",
                    "q10": "option_b",
                    "q11": "option_b",
                    "q12": "option_c"
                },
                "open_response": "我希望能有更多互动式的学习内容，帮助我更好地理解复杂概念。"
            }
        }


class AssessmentResponse(BaseModel):
    """测评记录响应"""
    id: int
    student_id: int
    answers: Dict[str, str]
    open_response: Optional[str]
    ai_evaluation: str
    tags: Optional[List[str]] = Field(None, description="评测标签（3个关键词）")
    llm_config_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    """学习档案响应"""
    has_profile: bool = Field(..., description="是否有档案")
    total_assessments: int = Field(0, description="总测评次数")
    latest_assessment: Optional[AssessmentResponse] = Field(None, description="最新的测评记录")
    history: List[AssessmentResponse] = Field(default_factory=list, description="历史测评记录")

    class Config:
        from_attributes = True


class AssessmentHistoryResponse(BaseModel):
    """测评历史列表响应"""
    total: int
    assessments: List[AssessmentResponse]

    class Config:
        from_attributes = True
