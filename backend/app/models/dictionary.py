from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class DictionaryType(Base):
    """数据字典类型表"""
    __tablename__ = "dictionary_type"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, comment="类型编码")
    name = Column(String, nullable=False, comment="类型名称")
    description = Column(String, comment="描述")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    items = relationship("DictionaryItem", back_populates="dict_type", cascade="all, delete-orphan")


class DictionaryItem(Base):
    """数据字典项表"""
    __tablename__ = "dictionary_item"
    
    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey("dictionary_type.id"), nullable=False, comment="字典类型ID")
    code = Column(String, nullable=False, comment="项编码")
    label = Column(String, nullable=False, comment="项标签")
    value = Column(String, nullable=False, comment="项值")
    sort_order = Column(Integer, default=0, comment="排序")
    is_active = Column(Boolean, default=True, comment="是否启用")
    remark = Column(String, comment="备注")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    dict_type = relationship("DictionaryType", back_populates="items")

