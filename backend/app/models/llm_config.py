from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.models.base import Base

class LLMConfig(Base):
    __tablename__ = 'llm_config'
    
    id = Column(Integer, primary_key=True, index=True)
    provider_name = Column(String(100), nullable=False, comment='提供商名称')
    provider_key = Column(String(50), unique=True, nullable=False, comment='提供商唯一标识')
    api_key = Column(String(500), nullable=False, comment='API密钥')
    api_secret = Column(String(500), comment='API密钥（可选）')
    endpoint_url = Column(String(500), comment='API端点URL')
    model_name = Column(String(100), comment='模型名称')
    config_json = Column(Text, comment='额外配置（JSON格式）')
    is_active = Column(Boolean, default=True, comment='是否启用')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

