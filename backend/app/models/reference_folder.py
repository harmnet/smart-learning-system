from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class ReferenceFolder(Base):
    """参考资料文件夹表"""
    __tablename__ = "reference_folder"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    folder_name = Column(String(255), nullable=False)
    parent_id = Column(Integer, ForeignKey("reference_folder.id"), nullable=True)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    teacher = relationship("User", back_populates="reference_folders")
    parent = relationship("ReferenceFolder", remote_side=[id], back_populates="subfolders")
    subfolders = relationship("ReferenceFolder", back_populates="parent", cascade="all, delete-orphan")
    materials = relationship("ReferenceMaterial", back_populates="folder", cascade="all, delete-orphan")

