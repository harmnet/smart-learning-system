from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class TeacherStudentInteraction(Base):
    __tablename__ = "teacher_student_interaction"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("course.id"), nullable=True)
    interaction_type = Column(String(20), nullable=False)  # 'comment', 'message', 'feedback'
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    teacher = relationship("User", foreign_keys=[teacher_id])
    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", foreign_keys=[course_id])

