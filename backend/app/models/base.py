from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Numeric, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "sys_user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=False)  # admin, teacher, student
    is_active = Column(Boolean, default=True)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, default=datetime.utcnow)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False)
    reference_materials = relationship("ReferenceMaterial", back_populates="teacher")
    reference_folders = relationship("ReferenceFolder", back_populates="teacher")
    questions = relationship("Question", back_populates="teacher")
    knowledge_graphs = relationship("KnowledgeGraph", back_populates="teacher")
    exam_papers = relationship("ExamPaper", back_populates="teacher")
    exams = relationship("Exam", back_populates="teacher")

class Organization(Base):
    __tablename__ = "organization"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_id = Column(Integer, ForeignKey("organization.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("sys_user.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("sys_user.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, default=datetime.utcnow)
    
    # Relationships
    majors = relationship("Major", back_populates="organization")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])

class Major(Base):
    __tablename__ = "major"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    organization_id = Column(Integer, ForeignKey("organization.id"))
    tuition_fee = Column(Numeric(10, 2), nullable=False)
    description = Column(Text)
    duration_years = Column(Integer, default=4)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="majors")
    classes = relationship("Class", back_populates="major")

class Semester(Base):
    __tablename__ = "semester"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "2024-Fall"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_current = Column(Boolean, default=False)

class Class(Base):
    __tablename__ = "sys_class"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    major_id = Column(Integer, ForeignKey("major.id"))
    # semester_id = Column(Integer, ForeignKey("semester.id")) # 修正：数据库实际是 semester string
    semester = Column(String, nullable=True)
    grade = Column(String, nullable=True)
    code = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Relationships
    major = relationship("Major", back_populates="classes")
    # semester = relationship("Semester") # 修正：移除关联
    students = relationship("StudentProfile", back_populates="class_")
    course_relations = relationship("ClassCourseRelation", back_populates="class_")

class StudentProfile(Base):
    __tablename__ = "student_profile"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("sys_user.id"))
    class_id = Column(Integer, ForeignKey("sys_class.id"), nullable=True)
    major_id = Column(Integer, ForeignKey("major.id"), nullable=True)
    student_no = Column(String, unique=True)
    status = Column(String, default="active")  # active, graduated, suspended
    
    # Relationships
    user = relationship("User", back_populates="student_profile")
    class_ = relationship("Class", back_populates="students")

class TeacherProfile(Base):
    __tablename__ = "teacher_profile"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("sys_user.id"))
    major_id = Column(Integer, ForeignKey("major.id"), nullable=True)  # Added major_id
    title = Column(String)  # e.g., Professor, Lecturer
    intro = Column(Text)
    
    # Relationships
    user = relationship("User", back_populates="teacher_profile")
    major = relationship("Major")  # Added relationship
    teaching_tasks = relationship("ClassCourseRelation", back_populates="teacher")

class Course(Base):
    __tablename__ = "course"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    code = Column(String, unique=True)
    description = Column(Text)
    cover_image = Column(String)  # 保留字段，用于兼容
    credits = Column(Integer, default=2)
    course_type = Column(String(20))  # 课程类型：required（必修课）、elective（选修课）
    hours = Column(Integer)  # 课程学时
    introduction = Column(Text)  # 课程简介
    objectives = Column(Text)  # 授课目标
    main_teacher_id = Column(Integer, ForeignKey("sys_user.id"))  # 主讲教师ID
    is_public = Column(Boolean, default=False)  # 是否公开课
    major_id = Column(Integer, ForeignKey("major.id"), nullable=True)  # 所属专业ID
    
    # Relationships
    chapters = relationship("CourseChapter", back_populates="course", cascade="all, delete-orphan")
    class_relations = relationship("ClassCourseRelation", back_populates="course")
    covers = relationship("CourseCover", back_populates="course", cascade="all, delete-orphan")
    main_teacher = relationship("User", foreign_keys=[main_teacher_id])
    major = relationship("Major")

class CourseCover(Base):
    __tablename__ = "course_cover"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("course.id"), nullable=True)  # 改为可空，支持独立图片管理
    filename = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)  # 文件大小（字节）
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (可选，如果course_id不为空)
    course = relationship("Course", back_populates="covers")

class ClassCourseRelation(Base):
    __tablename__ = "class_course_relation"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("sys_class.id"))
    course_id = Column(Integer, ForeignKey("course.id"))
    teacher_id = Column(Integer, ForeignKey("teacher_profile.id"))
    semester_id = Column(Integer, ForeignKey("semester.id"))
    schedule_desc = Column(String, nullable=True)  # e.g. "Mon 10:00-12:00"
    
    # Relationships
    class_ = relationship("Class", back_populates="course_relations")
    course = relationship("Course", back_populates="class_relations")
    teacher = relationship("TeacherProfile", back_populates="teaching_tasks")

class CourseChapter(Base):
    __tablename__ = "course_chapter"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("course.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)
    parent_id = Column(Integer, ForeignKey("course_chapter.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    course = relationship("Course", back_populates="chapters")
    parent = relationship("CourseChapter", remote_side=[id], backref="children")
    resources = relationship("CourseResource", back_populates="chapter")
    # 课程大纲相关关系（延迟导入避免循环依赖）
    section_resources = relationship("CourseSectionResource", foreign_keys="[CourseSectionResource.chapter_id]", cascade="all, delete-orphan", lazy="selectin")
    exam_paper_links = relationship("CourseChapterExamPaper", foreign_keys="[CourseChapterExamPaper.chapter_id]", cascade="all, delete-orphan", lazy="selectin")
    homework_items = relationship("CourseSectionHomework", foreign_keys="[CourseSectionHomework.chapter_id]", cascade="all, delete-orphan", lazy="selectin")

class CourseResource(Base):
    __tablename__ = "course_resource"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("course_chapter.id"))
    title = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)  # video, ppt, pdf, doc, zip
    file_url = Column(String, nullable=False)
    duration_seconds = Column(Integer, nullable=True)  # for video
    
    # Relationships
    chapter = relationship("CourseChapter", back_populates="resources")

class EnrollmentOrder(Base):
    __tablename__ = "enrollment_order"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, unique=True, nullable=False)
    student_id = Column(Integer, ForeignKey("student_profile.id"))
    major_id = Column(Integer, ForeignKey("major.id"))
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default="pending")  # pending, paid, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

