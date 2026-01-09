"""
个性化学习与AI测评的Pydantic Schemas
"""
from typing import List, Optional, Dict, Union
from datetime import datetime
from pydantic import BaseModel, Field


# ==================== 个性化学习内容 Schemas ====================

class PersonalizedContentRequest(BaseModel):
    """生成个性化学习内容请求"""
    resource_id: int = Field(..., description="教学资源ID")


class PersonalizedContentResponse(BaseModel):
    """个性化学习内容响应"""
    id: int
    content: str = Field(..., description="个性化学习内容（Markdown格式）")
    created_at: datetime
    has_history: bool = Field(False, description="是否有历史记录")
    history_count: int = Field(0, description="历史记录数量")
    
    class Config:
        from_attributes = True


class PersonalizedContentHistoryItem(BaseModel):
    """个性化学习内容历史记录项"""
    id: int
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== AI测评 Schemas ====================

class AIQuizGenerateRequest(BaseModel):
    """生成AI测评请求"""
    resource_id: int = Field(..., description="教学资源ID")


class QuizQuestion(BaseModel):
    """测评题目"""
    id: int
    type: str = Field(..., description="题目类型：single（单选）, multiple（多选）, judge（判断）")
    question: str = Field(..., description="题目内容")
    options: List[str] = Field(..., description="选项列表")
    correct_answer: Union[str, List[str]] = Field(..., description="正确答案")
    explanation: str = Field(..., description="答案解析")
    user_answer: Optional[Union[str, List[str]]] = Field(None, description="学生答案")
    is_correct: Optional[bool] = Field(None, description="是否答对")
    
    class Config:
        from_attributes = True


class AIQuizResponse(BaseModel):
    """AI测评响应"""
    id: int
    questions: List[QuizQuestion]
    is_submitted: bool = Field(False, description="是否已提交")
    score: Optional[float] = Field(None, description="得分")
    total_score: int = Field(100, description="总分")
    created_at: datetime
    submitted_at: Optional[datetime] = Field(None, description="提交时间")
    
    class Config:
        from_attributes = True


class AIQuizSubmitRequest(BaseModel):
    """提交AI测评答案请求"""
    quiz_id: int = Field(..., description="测评记录ID")
    answers: Dict[int, Union[str, List[str]]] = Field(..., description="答案字典，键为题目ID，值为答案")


class AIQuizSubmitResponse(BaseModel):
    """提交AI测评答案响应"""
    id: int
    score: float = Field(..., description="得分")
    total_score: int = Field(..., description="总分")
    questions: List[QuizQuestion] = Field(..., description="题目列表（含正确答案和解析）")
    submitted_at: datetime
    
    class Config:
        from_attributes = True


class AIQuizHistoryItem(BaseModel):
    """AI测评历史记录项"""
    id: int
    is_submitted: bool
    score: Optional[float]
    total_score: int
    created_at: datetime
    submitted_at: Optional[datetime]
    question_count: int = Field(..., description="题目数量")
    
    class Config:
        from_attributes = True


# ==================== 学习行为记录 Schemas ====================

class PersonalizedContentStudyRecordRequest(BaseModel):
    """记录个性化学习内容学习时长请求"""
    resource_id: int = Field(..., description="教学资源ID")
    content_id: int = Field(..., description="个性化内容ID")
    duration_seconds: int = Field(..., description="学习时长（秒）")


class AIQuizStudyRecordRequest(BaseModel):
    """记录AI测评学习时长请求"""
    resource_id: int = Field(..., description="教学资源ID")
    quiz_id: int = Field(..., description="测评记录ID")
    duration_seconds: int = Field(..., description="学习时长（秒）")
