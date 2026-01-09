from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class Exam(Base):
    __tablename__ = "exam"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    exam_paper_id = Column(Integer, ForeignKey("exam_paper.id"), nullable=False)
    exam_name = Column(String, nullable=False)  # 考试名称
    exam_date = Column(DateTime, nullable=False)  # 考试日期
    start_time = Column(DateTime, nullable=False)  # 开始时间（精确到秒）
    end_time = Column(DateTime, nullable=False)  # 结束时间（精确到秒）
    cover_image = Column(String, nullable=True)  # 考试封面
    early_login_minutes = Column(Integer, default=15)  # 提前登录时间（分钟）
    late_forbidden_minutes = Column(Integer, default=15)  # 迟到禁止登录时间（分钟）
    minimum_submission_minutes = Column(Integer, default=15, nullable=False)  # 最早交卷时间（分钟）
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, default=datetime.utcnow)

    # Relationships
    teacher = relationship("User", back_populates="exams")
    exam_paper = relationship("ExamPaper", back_populates="exams")
    exam_students = relationship("ExamStudent", back_populates="exam", cascade="all, delete-orphan")


class ExamStudent(Base):
    __tablename__ = "exam_student"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exam.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profile.id"), nullable=False)
    exam_status = Column(String(50), default='pending')  # pending, in_progress, submitted
    start_time = Column(DateTime, nullable=True)  # 开始考试时间
    submit_time = Column(DateTime, nullable=True)  # 提交考试时间
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    exam = relationship("Exam", back_populates="exam_students")
    student = relationship("StudentProfile")

