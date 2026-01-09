from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class CourseBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    course_type: Optional[str] = None  # 保留字段，用于兼容
    course_category: Optional[str] = None  # 课程类型：general、professional_basic、professional_core、expansion、elective_course
    enrollment_type: Optional[str] = None  # 选课类型：required、elective、retake
    hours: Optional[int] = None  # 课程学时
    introduction: Optional[str] = None  # 课程简介
    objectives: Optional[str] = None  # 授课目标
    main_teacher_id: Optional[int] = None  # 主讲教师ID
    is_public: Optional[bool] = False  # 是否公开课
    major_id: Optional[int] = None  # 所属专业ID（从教师专业获取，不能编辑）

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    course_type: Optional[str] = None  # 保留字段，用于兼容
    course_category: Optional[str] = None  # 课程类型：general、professional_basic、professional_core、expansion、elective_course
    enrollment_type: Optional[str] = None  # 选课类型：required、elective、retake
    hours: Optional[int] = None  # 课程学时
    introduction: Optional[str] = None  # 课程简介
    objectives: Optional[str] = None  # 授课目标
    main_teacher_id: Optional[int] = None  # 主讲教师ID
    is_public: Optional[bool] = None  # 是否公开课
    major_id: Optional[int] = None  # 所属专业ID（从教师专业获取，不能编辑）

class CourseInDBBase(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Course(CourseInDBBase):
    pass

class CourseWithProgress(Course):
    progress: Optional[int] = 0
    total_chapters: Optional[int] = 0
    completed_chapters: Optional[int] = 0

