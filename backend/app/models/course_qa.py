from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY
from datetime import datetime
from app.models.base import Base


class CourseQASession(Base):
    """课程问答会话表"""
    __tablename__ = "course_qa_session"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("course.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)  # 会话标题（自动生成或手动设置）
    status = Column(String(20), default='active')  # active, resolved, closed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])
    messages = relationship("CourseQAMessage", back_populates="session", cascade="all, delete-orphan", order_by="CourseQAMessage.created_at")


class CourseQAMessage(Base):
    """课程问答消息表"""
    __tablename__ = "course_qa_message"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("course_qa_session.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=True)  # 发送者ID（学生或教师，AI消息时为NULL）
    sender_type = Column(String(20), nullable=False)  # 'student', 'ai', 'teacher'
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default='text')  # 'text', 'system'
    is_sent_to_teacher = Column(Boolean, default=False)  # 是否已发送给教师
    teacher_ids = Column(PG_ARRAY(Integer), nullable=True)  # 接收消息的教师ID数组
    ai_response_id = Column(Integer, ForeignKey("course_qa_message.id"), nullable=True)  # 关联的AI回复ID（如果是学生问题）
    parent_message_id = Column(Integer, ForeignKey("course_qa_message.id"), nullable=True)  # 父消息ID（用于回复链）
    is_read = Column(Boolean, default=False)  # 是否已读（针对教师）
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("CourseQASession", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    ai_response = relationship("CourseQAMessage", remote_side=[id], foreign_keys=[ai_response_id])
    parent_message = relationship("CourseQAMessage", remote_side=[id], foreign_keys=[parent_message_id])
