from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

# CourseChapter已经在base.py中定义，这里只定义其他相关模型

class CourseSectionResource(Base):
    """
    课程小节资源关联（教学资源、参考资料）
    """
    __tablename__ = "course_section_resource"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=False)
    resource_type = Column(String, nullable=False)  # teaching_resource, reference_material
    resource_id = Column(Integer, nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id])

class CourseChapterExamPaper(Base):
    """
    课程章节试卷关联（章和小节都可以关联试卷）
    """
    __tablename__ = "course_chapter_exam_paper"
    __table_args__ = (UniqueConstraint('chapter_id', 'exam_paper_id', name='uq_chapter_exam_paper'),)

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=False)
    exam_paper_id = Column(Integer, ForeignKey("exam_paper.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id], backref="exam_paper_links_backref")
    exam_paper = relationship("ExamPaper", foreign_keys=[exam_paper_id])

class CourseSectionHomework(Base):
    """
    课程小节作业
    """
    __tablename__ = "course_section_homework"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    deadline = Column(DateTime, nullable=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id])

