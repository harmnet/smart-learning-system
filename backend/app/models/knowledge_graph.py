from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class KnowledgeGraph(Base):
    """知识图谱表"""
    __tablename__ = "knowledge_graph"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("sys_user.id"), nullable=False)
    graph_name = Column(String(255), nullable=False)  # 知识图谱名称
    description = Column(Text, nullable=True)  # 描述
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    teacher = relationship("User", back_populates="knowledge_graphs")
    nodes = relationship("KnowledgeNode", back_populates="graph", cascade="all, delete-orphan")

class KnowledgeNode(Base):
    """知识节点表"""
    __tablename__ = "knowledge_node"

    id = Column(Integer, primary_key=True, index=True)
    graph_id = Column(Integer, ForeignKey("knowledge_graph.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("knowledge_node.id"), nullable=True)  # 父节点ID，支持树状结构
    node_name = Column(String(255), nullable=False)  # 节点名称
    node_content = Column(Text, nullable=True)  # 节点内容/描述
    sort_order = Column(Integer, default=0)  # 排序顺序
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    graph = relationship("KnowledgeGraph", back_populates="nodes")
    parent = relationship("KnowledgeNode", remote_side=[id], back_populates="children")
    children = relationship("KnowledgeNode", back_populates="parent", cascade="all, delete-orphan")

