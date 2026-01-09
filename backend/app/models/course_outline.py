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
    【已废弃】保留用于数据备份，新业务使用CourseChapterExam
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

class CourseChapterExam(Base):
    """
    课程章节考试关联（章和小节都可以关联考试）
    正确的业务逻辑：章节 → 考试（考试已关联试卷）
    """
    __tablename__ = "course_chapter_exam"
    __table_args__ = (UniqueConstraint('chapter_id', 'exam_id', name='uq_chapter_exam'),)

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=False)
    exam_id = Column(Integer, ForeignKey("exam.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id], backref="exam_links_backref")
    exam = relationship("Exam", foreign_keys=[exam_id])

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

class CourseChapterLearningRule(Base):
    """
    章节学习规则表
    """
    __tablename__ = "course_chapter_learning_rule"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=False, unique=True)
    rule_type = Column(String(20), nullable=False, default='none')  # none（无条件）、completion（完成度）、exam（通过测验）
    completion_percentage = Column(Integer, nullable=True)  # 完成度百分比（当rule_type为completion时使用）
    target_chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="SET NULL"), nullable=True)  # 目标章节ID（上一章/小节）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id], backref="learning_rule")
    target_chapter = relationship("CourseChapter", foreign_keys=[target_chapter_id])

class CourseChapterKnowledgeGraph(Base):
    """
    章节知识图谱关联表
    """
    __tablename__ = "course_chapter_knowledge_graph"
    __table_args__ = (UniqueConstraint('chapter_id', name='uq_chapter_knowledge_graph'),)

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=False)
    knowledge_graph_id = Column(Integer, ForeignKey("knowledge_graph.id", ondelete="CASCADE"), nullable=False)
    knowledge_node_id = Column(Integer, ForeignKey("knowledge_node.id", ondelete="CASCADE"), nullable=True)  # 关联的具体节点（可选）
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id], backref="knowledge_graph_links")
    knowledge_graph = relationship("KnowledgeGraph", foreign_keys=[knowledge_graph_id])
    knowledge_node = relationship("KnowledgeNode", foreign_keys=[knowledge_node_id])

