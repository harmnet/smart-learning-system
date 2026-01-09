from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class ExamPaper(Base):
    __tablename__ = "exam_paper"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    paper_name = Column(String, nullable=False)  # 试卷名称
    duration_minutes = Column(Integer, nullable=False)  # 考试时长（分钟）
    min_submit_minutes = Column(Integer, nullable=False)  # 最短交卷时长（分钟）
    composition_mode = Column(String, nullable=False)  # 组卷模式：manual（手工组卷）、auto（智能组卷）
    total_score = Column(Numeric(10, 2), nullable=False, default=100)  # 试卷总分值
    question_order = Column(String, nullable=False, default="fixed")  # 试题顺序：fixed（固定）、random（随机）
    option_order = Column(String, nullable=False, default="fixed")  # 选项顺序：fixed（固定）、random（随机）
    knowledge_point = Column(String(255), nullable=False)  # 关联的知识点名称
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, default=datetime.utcnow)

    # Relationships
    teacher = relationship("User", back_populates="exam_papers")
    questions = relationship("ExamPaperQuestion", back_populates="exam_paper", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="exam_paper")


class ExamPaperQuestion(Base):
    __tablename__ = "exam_paper_question"

    id = Column(Integer, primary_key=True, index=True)
    exam_paper_id = Column(Integer, ForeignKey("exam_paper.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("question.id"), nullable=False)
    score = Column(Numeric(10, 2), nullable=False)  # 该题在试卷中的分值
    sort_order = Column(Integer, default=0)  # 题目在试卷中的排序
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    exam_paper = relationship("ExamPaper", back_populates="questions")
    question = relationship("Question")

