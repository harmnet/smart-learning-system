from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base


class LLMCallLog(Base):
    """
    LLM调用记录表
    统一记录所有大模型调用，包括调用时间、功能类型、提示词、返回结果、执行时长等信息
    """
    __tablename__ = "llm_call_log"

    id = Column(Integer, primary_key=True, index=True)
    function_type = Column(String(50), nullable=False, comment="调用功能类型")
    user_id = Column(Integer, ForeignKey("sys_user.id", ondelete="CASCADE"), nullable=False, comment="调用用户ID")
    user_role = Column(String(20), nullable=False, comment="用户角色：teacher/student/admin")
    llm_config_id = Column(Integer, ForeignKey("llm_config.id"), nullable=True, comment="使用的大模型配置ID")
    prompt = Column(Text, nullable=False, comment="提示词")
    result = Column(Text, nullable=True, comment="返回结果")
    execution_time_ms = Column(Integer, nullable=True, comment="执行时长（毫秒）")
    status = Column(String(20), nullable=False, comment="调用状态：success/failed")
    error_message = Column(Text, nullable=True, comment="错误信息")
    related_id = Column(Integer, nullable=True, comment="关联的业务ID")
    related_type = Column(String(50), nullable=True, comment="关联的业务类型")
    created_at = Column(DateTime, default=datetime.utcnow, comment="创建时间")

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    llm_config = relationship("LLMConfig", foreign_keys=[llm_config_id])

    __table_args__ = (
        CheckConstraint("user_role IN ('teacher', 'student', 'admin')", name="check_user_role"),
        CheckConstraint("status IN ('success', 'failed')", name="check_status"),
    )
