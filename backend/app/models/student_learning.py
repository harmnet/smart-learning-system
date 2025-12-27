from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class StudentLearningBehavior(Base):
    """
    学生学习行为记录表
    记录学生的各种学习行为：观看视频、阅读文档、做测试等
    """
    __tablename__ = "student_learning_behavior"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False, comment="学生ID")
    course_id = Column(Integer, ForeignKey("course.id"), nullable=False, comment="课程ID")
    chapter_id = Column(Integer, ForeignKey("course_chapter.id"), nullable=True, comment="章节ID")
    resource_id = Column(Integer, nullable=True, comment="资源ID")
    resource_type = Column(String(50), nullable=True, comment="资源类型：teaching_resource, reference_material")
    behavior_type = Column(String(50), nullable=False, comment="行为类型：view_resource, complete_section, take_exam, submit_homework")
    duration_seconds = Column(Integer, default=0, comment="持续时长（秒）")
    description = Column(Text, nullable=True, comment="行为描述")
    created_at = Column(DateTime, default=datetime.utcnow, comment="记录时间")
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id])


class StudentStudyDuration(Base):
    """
    学生学习时长统计表（按天统计）
    """
    __tablename__ = "student_study_duration"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False, comment="学生ID")
    course_id = Column(Integer, ForeignKey("course.id"), nullable=False, comment="课程ID")
    study_date = Column(DateTime, nullable=False, comment="学习日期")
    duration_minutes = Column(Integer, default=0, comment="学习时长（分钟）")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])


class StudentExamScore(Base):
    """
    学生考试成绩记录表
    """
    __tablename__ = "student_exam_score"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False, comment="学生ID")
    course_id = Column(Integer, ForeignKey("course.id"), nullable=False, comment="课程ID")
    exam_paper_id = Column(Integer, ForeignKey("exam_paper.id"), nullable=False, comment="试卷ID")
    exam_id = Column(Integer, ForeignKey("exam.id"), nullable=True, comment="考试ID")
    score = Column(Float, nullable=False, comment="得分")
    total_score = Column(Float, nullable=False, default=100, comment="总分")
    exam_date = Column(DateTime, nullable=False, comment="考试时间")
    is_submitted = Column(Boolean, default=False, comment="是否已提交")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])
    exam_paper = relationship("ExamPaper", foreign_keys=[exam_paper_id])
    exam = relationship("Exam", foreign_keys=[exam_id])

