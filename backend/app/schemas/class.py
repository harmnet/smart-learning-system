from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ClassBase(BaseModel):
    name: str
    code: Optional[str] = None
    major_id: int
    grade: Optional[str] = None
    semester: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    major_id: Optional[int] = None
    grade: Optional[str] = None
    semester: Optional[str] = None

class Class(ClassBase):
    id: int
    student_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

