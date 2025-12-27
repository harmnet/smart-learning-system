from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Question(Base):
    """题目表"""
    __tablename__ = "question"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    question_type = Column(String(20), nullable=False)  # single_choice, multiple_choice, true_false, fill_blank, qa, short_answer
    title = Column(Text, nullable=False)  # 题干（支持文字）
    title_image = Column(String(500), nullable=True)  # 题干图片路径
    knowledge_point = Column(Text, nullable=True)  # 知识点
    answer = Column(Text, nullable=True)  # 正确答案（JSON格式存储，不同题型格式不同）
    answer_image = Column(String(500), nullable=True)  # 答案图片路径
    explanation = Column(Text, nullable=True)  # 解析（支持文字）
    explanation_image = Column(String(500), nullable=True)  # 解析图片路径
    difficulty = Column(Integer, default=1)  # 难度：1-简单，2-中等，3-困难
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    teacher = relationship("User", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")

class QuestionOption(Base):
    """题目选项表（用于单选和多选）"""
    __tablename__ = "question_option"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("question.id"), nullable=False)
    option_label = Column(String(10), nullable=False)  # A, B, C, D等
    option_text = Column(Text, nullable=False)  # 选项内容
    option_image = Column(String(500), nullable=True)  # 选项图片路径
    is_correct = Column(Boolean, default=False)  # 是否为正确答案
    sort_order = Column(Integer, default=0)  # 排序顺序
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系
    question = relationship("Question", back_populates="options")

