from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# DictionaryItem schemas
class DictionaryItemBase(BaseModel):
    code: str
    label: str
    value: str
    sort_order: Optional[int] = 0
    is_active: Optional[bool] = True
    remark: Optional[str] = None

class DictionaryItemCreate(DictionaryItemBase):
    type_id: int

class DictionaryItemUpdate(BaseModel):
    code: Optional[str] = None
    label: Optional[str] = None
    value: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    remark: Optional[str] = None

class DictionaryItem(DictionaryItemBase):
    id: int
    type_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# DictionaryType schemas
class DictionaryTypeBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True

class DictionaryTypeCreate(DictionaryTypeBase):
    pass

class DictionaryTypeUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DictionaryType(DictionaryTypeBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[DictionaryItem] = []
    
    class Config:
        from_attributes = True

