from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class ResourceFolder(Base):
    """资源文件夹表"""
    __tablename__ = "resource_folder"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)  # 所属教师
    folder_name = Column(String(255), nullable=False)  # 文件夹名称
    parent_id = Column(Integer, ForeignKey("resource_folder.id"), nullable=True)  # 父文件夹ID（支持嵌套）
    description = Column(String(500), nullable=True)  # 文件夹描述
    is_active = Column(Boolean, default=True)  # 是否有效（逻辑删除）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    teacher = relationship("User", foreign_keys=[teacher_id])
    # 自引用关系（父子文件夹）
    children = relationship("ResourceFolder", backref="parent", remote_side=[id])

