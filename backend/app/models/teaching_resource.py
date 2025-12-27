from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class TeachingResource(Base):
    """教学资源表"""
    __tablename__ = "teaching_resource"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)  # 上传教师ID
    resource_name = Column(String(255), nullable=False)  # 资源名称
    original_filename = Column(String(255), nullable=False)  # 原始文件名
    file_path = Column(String(500), nullable=False)  # 文件存储路径（OSS或本地）
    local_file_path = Column(String(500), nullable=True)  # 本地文件路径（用于PDF转换）
    file_size = Column(BigInteger, nullable=False)  # 文件大小（字节）
    resource_type = Column(String(20), nullable=False)  # 资源类型: video, ppt, pdf, word, excel, markdown, image
    pdf_path = Column(String(500), nullable=True)  # PDF文件路径（OSS或本地）
    pdf_local_path = Column(String(500), nullable=True)  # PDF本地文件路径
    pdf_converted_at = Column(DateTime, nullable=True)  # PDF转换时间
    pdf_conversion_status = Column(String(20), nullable=True, default='pending')  # PDF转换状态: pending/success/failed
    knowledge_point = Column(Text, nullable=True)  # 知识点（非必填）
    folder_id = Column(Integer, ForeignKey("resource_folder.id"), nullable=True)  # 所属文件夹ID
    is_active = Column(Boolean, default=True)  # 是否有效（逻辑删除）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系
    teacher = relationship("User", foreign_keys=[teacher_id])
    folder = relationship("ResourceFolder", foreign_keys=[folder_id])

