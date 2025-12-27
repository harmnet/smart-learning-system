from typing import Optional, Union
from pydantic import BaseModel, EmailStr, field_validator

class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: str = "student"

class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None
    major_id: Optional[int] = None
    id_card: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[Union[EmailStr, str]] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    
    @field_validator('email', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v

class UserInDBBase(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

