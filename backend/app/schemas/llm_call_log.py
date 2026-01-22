from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LLMCallLogListItem(BaseModel):
    """LLM调用记录列表项"""
    id: int
    function_type: str = Field(..., description="调用功能类型")
    user_id: int = Field(..., description="调用用户ID")
    user_name: Optional[str] = Field(None, description="用户姓名")
    user_role: str = Field(..., description="用户角色")
    llm_config_id: Optional[int] = Field(None, description="LLM配置ID")
    llm_config_name: Optional[str] = Field(None, description="LLM配置名称")
    result_summary: Optional[str] = Field(None, description="结果摘要（前100字符）")
    execution_time_ms: Optional[int] = Field(None, description="执行时长（毫秒）")
    status: str = Field(..., description="调用状态：success/failed")
    created_at: datetime = Field(..., description="创建时间")
    
    class Config:
        from_attributes = True


class LLMCallLogDetail(BaseModel):
    """LLM调用记录详情"""
    id: int
    function_type: str = Field(..., description="调用功能类型")
    user_id: int = Field(..., description="调用用户ID")
    user_name: Optional[str] = Field(None, description="用户姓名")
    user_role: str = Field(..., description="用户角色")
    llm_config_id: Optional[int] = Field(None, description="LLM配置ID")
    llm_config_name: Optional[str] = Field(None, description="LLM配置名称")
    prompt: str = Field(..., description="提示词")
    result: Optional[str] = Field(None, description="返回结果")
    execution_time_ms: Optional[int] = Field(None, description="执行时长（毫秒）")
    status: str = Field(..., description="调用状态：success/failed")
    error_message: Optional[str] = Field(None, description="错误信息")
    related_id: Optional[int] = Field(None, description="关联的业务ID")
    related_type: Optional[str] = Field(None, description="关联的业务类型")
    created_at: datetime = Field(..., description="创建时间")
    
    class Config:
        from_attributes = True


class LLMCallLogListResponse(BaseModel):
    """LLM调用记录列表响应"""
    items: list[LLMCallLogListItem]
    total: int = Field(..., description="总记录数")
    skip: int = Field(..., description="跳过记录数")
    limit: int = Field(..., description="每页记录数")
