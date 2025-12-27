from typing import Optional
from pydantic import BaseModel
from decimal import Decimal

class MajorBase(BaseModel):
    name: str
    description: Optional[str] = None
    tuition_fee: Decimal
    duration_years: int = 4

class MajorCreate(MajorBase):
    organization_id: int

class MajorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tuition_fee: Optional[Decimal] = None
    duration_years: Optional[int] = None
    organization_id: Optional[int] = None

class Major(MajorBase):
    id: int
    organization_id: int

    class Config:
        from_attributes = True

