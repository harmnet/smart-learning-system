from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, ARRAY, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
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


class StudentLearningProfile(Base):
    """
    学生学习偏好档案表
    存储学生的学习偏好信息和最新评价ID
    """
    __tablename__ = "student_learning_profile"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, unique=True, comment="学生ID")
    latest_assessment_id = Column(Integer, ForeignKey("student_learning_assessment.id"), nullable=True, comment="最新的测评记录ID")
    total_assessments = Column(Integer, default=0, comment="总测评次数")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    latest_assessment = relationship("StudentLearningAssessment", foreign_keys=[latest_assessment_id], post_update=True)


class StudentLearningAssessment(Base):
    """
    学生学习偏好测评记录表
    存储每次测评的详细答案和LLM生成的评价
    """
    __tablename__ = "student_learning_assessment"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, comment="学生ID")
    answers = Column(JSONB, nullable=False, comment="JSON格式存储所有问题的答案")
    open_response = Column(Text, nullable=True, comment="开放题的文本回答")
    ai_evaluation = Column(Text, nullable=False, comment="LLM生成的个性化评价")
    tags = Column(ARRAY(String), nullable=True, comment="评测标签（3个关键词）")
    llm_config_id = Column(Integer, ForeignKey("llm_config.id"), nullable=True, comment="使用的大模型配置ID")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    llm_config = relationship("LLMConfig", foreign_keys=[llm_config_id])


class PersonalizedLearningContent(Base):
    """
    个性化学习内容表
    存储基于学生学习偏好生成的个性化学习材料
    """
    __tablename__ = "personalized_learning_content"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, comment="学生ID")
    resource_id = Column(Integer, ForeignKey("teaching_resource.id", ondelete="CASCADE"), nullable=False, comment="教学资源ID")
    content = Column(Text, nullable=False, comment="个性化学习内容（Markdown格式）")
    assessment_id = Column(Integer, ForeignKey("student_learning_assessment.id"), nullable=True, comment="关联的学习偏好测评ID")
    llm_config_id = Column(Integer, ForeignKey("llm_config.id"), nullable=True, comment="使用的大模型配置ID")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    resource = relationship("TeachingResource", foreign_keys=[resource_id])
    assessment = relationship("StudentLearningAssessment", foreign_keys=[assessment_id])
    llm_config = relationship("LLMConfig", foreign_keys=[llm_config_id])


class AIQuizRecord(Base):
    """
    AI测评记录表
    存储AI生成的测评题目、学生答案和成绩
    """
    __tablename__ = "ai_quiz_record"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, comment="学生ID")
    resource_id = Column(Integer, ForeignKey("teaching_resource.id", ondelete="CASCADE"), nullable=False, comment="教学资源ID")
    assessment_id = Column(Integer, ForeignKey("student_learning_assessment.id"), nullable=True, comment="关联的学习偏好测评ID")
    questions = Column(JSONB, nullable=False, comment="测评题目（JSON格式）")
    user_answers = Column(JSONB, nullable=True, comment="学生答案（JSON格式）")
    score = Column(Numeric(5, 2), nullable=True, comment="得分")
    total_score = Column(Integer, default=100, comment="总分")
    is_submitted = Column(Boolean, default=False, comment="是否已提交")
    llm_config_id = Column(Integer, ForeignKey("llm_config.id"), nullable=True, comment="使用的大模型配置ID")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    submitted_at = Column(DateTime, nullable=True, comment="提交时间")
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    resource = relationship("TeachingResource", foreign_keys=[resource_id])
    assessment = relationship("StudentLearningAssessment", foreign_keys=[assessment_id])
    llm_config = relationship("LLMConfig", foreign_keys=[llm_config_id])


class StudentHomeworkSubmission(Base):
    """
    学生作业提交记录表
    记录学生针对每个作业的提交情况
    """
    __tablename__ = "student_homework_submission"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, comment="学生ID")
    homework_id = Column(Integer, ForeignKey("course_section_homework.id", ondelete="CASCADE"), nullable=False, comment="作业ID")
    course_id = Column(Integer, ForeignKey("course.id", ondelete="CASCADE"), nullable=False, comment="课程ID")
    chapter_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=False, comment="章节ID（小节）")
    content = Column(Text, nullable=True, comment="富文本作业内容")
    status = Column(String(20), default='draft', comment="状态：draft（草稿）、submitted（已提交）、graded（已评分）")
    score = Column(Float, nullable=True, comment="教师评分")
    teacher_comment = Column(Text, nullable=True, comment="教师评语")
    submitted_at = Column(DateTime, nullable=True, comment="提交时间")
    graded_at = Column(DateTime, nullable=True, comment="评分时间")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="更新时间")
    
    # Relationships
    student = relationship("User", foreign_keys=[student_id])
    homework = relationship("CourseSectionHomework", foreign_keys=[homework_id])
    course = relationship("Course", foreign_keys=[course_id])
    chapter = relationship("CourseChapter", foreign_keys=[chapter_id])
    grade_histories = relationship("StudentHomeworkGradeHistory", foreign_keys="[StudentHomeworkGradeHistory.submission_id]", cascade="all, delete-orphan", lazy="selectin")


class StudentHomeworkGradeHistory(Base):
    """
    学生作业评分历史记录表
    """
    __tablename__ = "student_homework_grade_history"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_homework_submission.id", ondelete="CASCADE"), nullable=False, comment="作业提交记录ID")
    teacher_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, comment="评分教师ID")
    score = Column(Float, nullable=True, comment="评分")
    teacher_comment = Column(Text, nullable=True, comment="评分评语")
    graded_at = Column(DateTime, default=datetime.utcnow, comment="评分时间")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    
    # Relationships
    submission = relationship("StudentHomeworkSubmission", foreign_keys=[submission_id])
    teacher = relationship("User", foreign_keys=[teacher_id])


class StudentHomeworkAIGradingLog(Base):
    __tablename__ = "student_homework_ai_grading_log"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_homework_submission.id", ondelete="CASCADE"), nullable=False, comment="作业提交记录ID")
    teacher_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, comment="触发教师ID")
    llm_config_id = Column(Integer, ForeignKey("llm_config.id"), nullable=True, comment="使用的大模型配置ID")
    prompt = Column(Text, nullable=False, comment="AI批改提示词")
    result = Column(Text, nullable=False, comment="AI批改原始结果")
    score = Column(Float, nullable=True, comment="AI评分")
    comment = Column(Text, nullable=True, comment="AI评语")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    submission = relationship("StudentHomeworkSubmission", foreign_keys=[submission_id])
    teacher = relationship("User", foreign_keys=[teacher_id])
    llm_config = relationship("LLMConfig", foreign_keys=[llm_config_id])


class StudentHomeworkAttachment(Base):
    """
    学生作业附件表
    存储学生提交作业时上传的附件文件
    """
    __tablename__ = "student_homework_attachment"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("student_homework_submission.id", ondelete="CASCADE"), nullable=False, comment="作业提交记录ID")
    file_name = Column(String(255), nullable=False, comment="原始文件名")
    file_url = Column(String(500), nullable=False, comment="文件URL（OSS地址或本地路径）")
    file_size = Column(Integer, nullable=True, comment="文件大小（字节）")
    file_type = Column(String(100), nullable=True, comment="文件类型（扩展名）")
    sort_order = Column(Integer, default=0, comment="排序")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")
    
    # Relationships
    submission = relationship("StudentHomeworkSubmission", foreign_keys=[submission_id], backref="attachments")
