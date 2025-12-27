from typing import Optional, Dict, Any
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[Dict[str, Any]] = None  # 添加用户信息

class TokenPayload(BaseModel):
    sub: Optional[str] = None

