from typing import Optional
from pydantic import BaseModel
from decimal import Decimal

class MajorBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    tuition_fee: Decimal
    duration_years: int = 4
    teacher_id: Optional[int] = None

class MajorCreate(MajorBase):
    organization_id: int

class MajorUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    tuition_fee: Optional[Decimal] = None
    duration_years: Optional[int] = None
    organization_id: Optional[int] = None
    teacher_id: Optional[int] = None

class Major(MajorBase):
    id: int
    code: Optional[str] = None
    organization_id: int

    class Config:
        from_attributes = True

