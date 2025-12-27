from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LLMConfigBase(BaseModel):
    provider_name: str = Field(..., description="提供商名称")
    provider_key: str = Field(..., description="提供商唯一标识")
    api_key: str = Field(..., description="API密钥")
    api_secret: Optional[str] = Field(None, description="API密钥（可选）")
    endpoint_url: Optional[str] = Field(None, description="API端点URL")
    model_name: Optional[str] = Field(None, description="模型名称")
    config_json: Optional[str] = Field(None, description="额外配置（JSON格式）")
    is_active: bool = Field(True, description="是否启用")

class LLMConfigCreate(LLMConfigBase):
    pass

class LLMConfigUpdate(BaseModel):
    provider_name: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    endpoint_url: Optional[str] = None
    model_name: Optional[str] = None
    config_json: Optional[str] = None
    is_active: Optional[bool] = None

class LLMConfig(LLMConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

