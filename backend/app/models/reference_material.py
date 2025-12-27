from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class ReferenceMaterial(Base):
    """参考资料表"""
    __tablename__ = "reference_material"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("reference_folder.id"), nullable=True)
    resource_name = Column(String(255), nullable=False)
    resource_type = Column(String(50), nullable=False)  # video, ppt, pdf, word, excel, markdown, image, link
    
    # 对于文件类型
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(BigInteger, nullable=True)
    
    # 对于链接类型
    link_url = Column(String(1000), nullable=True)
    
    knowledge_point = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    teacher = relationship("User", back_populates="reference_materials")
    folder = relationship("ReferenceFolder", back_populates="materials")

