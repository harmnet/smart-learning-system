"""
PPT创作API端点
"""
import io
import uuid
import logging
from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Any
from pydantic import BaseModel

from app.services.ppt_service import ppt_service
from app.models.teaching_resource import TeachingResource
from app.models.knowledge_graph import KnowledgeGraph, KnowledgeNode
from app.models.base import User
from app.db.session import get_db
from app.utils.oss_client import oss_client
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class CreatePPTResponse(BaseModel):
    """创建PPT响应"""
    success: bool
    project_id: Optional[str] = None
    iframe_url: Optional[str] = None
    error: Optional[str] = None


class SavePPTResponse(BaseModel):
    """保存PPT响应"""
    success: bool
    resource_id: Optional[int] = None
    error: Optional[str] = None


async def build_outline_from_knowledge_graph(
    graph_id: int,
    knowledge_point: str,
    db: AsyncSession
) -> str:
    """
    从知识图谱构建PPT大纲
    
    Args:
        graph_id: 知识图谱ID
        knowledge_point: 选中的知识点
        db: 数据库会话
        
    Returns:
        Markdown格式的大纲
    """
    # 获取知识图谱的所有节点
    nodes_result = await db.execute(
        select(KnowledgeNode).where(
            KnowledgeNode.graph_id == graph_id
        ).order_by(KnowledgeNode.id)
    )
    all_nodes = nodes_result.scalars().all()
    
    # 构建树形结构
    def build_tree(parent_id: Optional[int], level: int = 0) -> str:
        outline = ""
        for node in all_nodes:
            if node.parent_id == parent_id:
                # Markdown格式：# 一级标题，## 二级标题，### 三级标题
                prefix = "#" * min(level + 1, 6)
                outline += f"{prefix} {node.node_name}\n\n"
                # 递归处理子节点
                outline += build_tree(node.id, level + 1)
        return outline
    
    # 从根节点开始构建
    outline = build_tree(None)
    
    if not outline:
        outline = f"# {knowledge_point}\n\n这是关于{knowledge_point}的课件内容。\n"
    
    return outline


async def fetch_reference_content(
    selected_resource_ids: str,
    db: AsyncSession
) -> str:
    """
    获取参考资源的内容
    
    Args:
        selected_resource_ids: 逗号分隔的资源ID列表
        db: 数据库会话
        
    Returns:
        合并后的参考内容
    """
    if not selected_resource_ids:
        return ""
    
    reference_content = ""
    
    try:
        resource_ids = [int(id.strip()) for id in selected_resource_ids.split(',') if id.strip()]
        
        for resource_id in resource_ids:
            # 获取资源信息
            resource_result = await db.execute(
                select(TeachingResource).where(TeachingResource.id == resource_id)
            )
            resource = resource_result.scalars().first()
            
            if resource and resource.file_path:
                try:
                    if oss_client and oss_client.enabled:
                        # 从OSS读取文件内容
                        file_content = oss_client.bucket.get_object(resource.file_path)
                        content_bytes = file_content.read()
                        
                        # 根据文件类型解析内容
                        if resource.resource_type in ['txt', 'markdown']:
                            content = content_bytes.decode('utf-8', errors='ignore')
                        elif resource.resource_type == 'pdf':
                            # PDF解析（简化版）
                            content = f"[PDF文件: {resource.resource_name}]"
                        elif resource.resource_type in ['word', 'excel']:
                            content = f"[{resource.resource_type.upper()}文件: {resource.resource_name}]"
                        else:
                            content = f"[文件: {resource.resource_name}]"
                        
                        # 限制每个资源的内容长度
                        if len(content) > 2000:
                            content = content[:2000] + "..."
                        
                        reference_content += f"\n\n### 参考资料：{resource.resource_name}\n\n{content}\n"
                        
                except Exception as e:
                    logger.warning(f"读取资源 {resource_id} 失败: {str(e)}")
                    continue
    
    except Exception as e:
        logger.error(f"处理参考资源失败: {str(e)}")
    
    return reference_content


@router.post("/create", response_model=CreatePPTResponse)
async def create_ppt_project(
    title: str = Form(...),
    knowledge_point: str = Form(...),
    graph_id: int = Form(...),
    teacher_id: int = Form(...),
    custom_prompt: str = Form(default=""),
    selected_resource_ids: str = Form(default=""),
    template_file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    创建PPT项目并启动AI生成
    
    流程：
    1. 构建知识点大纲
    2. 获取选中的教学资源作为参考材料
    3. 调用banana-slides创建项目
    4. 返回项目ID和iframe URL
    """
    try:
        logger.info(f"开始创建PPT项目: title={title}, teacher_id={teacher_id}")
        
        # 1. 构建大纲
        outline = await build_outline_from_knowledge_graph(graph_id, knowledge_point, db)
        logger.info(f"大纲构建完成，长度: {len(outline)}")
        
        # 2. 获取参考资源内容
        reference_content = await fetch_reference_content(selected_resource_ids, db)
        logger.info(f"参考资源获取完成，长度: {len(reference_content)}")
        
        # 3. 调用PPT服务创建项目
        result = await ppt_service.create_project(
            title=title,
            outline=outline,
            reference_content=reference_content,
            custom_prompt=custom_prompt
        )
        
        if result.get("success"):
            project_id = result["project_id"]
            iframe_url = ppt_service.get_preview_url(project_id)
            
            logger.info(f"PPT项目创建成功: project_id={project_id}")
            
            return CreatePPTResponse(
                success=True,
                project_id=project_id,
                iframe_url=iframe_url
            )
        else:
            return CreatePPTResponse(
                success=False,
                error="创建PPT项目失败"
            )
    
    except Exception as e:
        logger.error(f"创建PPT项目失败: {str(e)}")
        return CreatePPTResponse(
            success=False,
            error=f"创建失败: {str(e)}"
        )


@router.post("/{project_id}/save", response_model=SavePPTResponse)
async def save_ppt_to_system(
    project_id: str,
    resource_name: str = Form(...),
    folder_id: Optional[int] = Form(None),
    knowledge_point: Optional[str] = Form(None),
    teacher_id: int = Form(...),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    将banana-slides生成的PPT保存到系统
    
    流程：
    1. 从banana-slides导出PPTX文件
    2. 上传到阿里云OSS
    3. 创建TeachingResource记录
    """
    try:
        logger.info(f"开始保存PPT到系统: project_id={project_id}, resource_name={resource_name}")
        
        # 1. 导出PPTX
        pptx_bytes = await ppt_service.export_pptx(project_id)
        logger.info(f"PPTX导出完成，大小: {len(pptx_bytes)} bytes")
        
        # 2. 上传到OSS
        if not oss_client.enabled:
            return SavePPTResponse(
                success=False,
                error="OSS服务未启用"
            )
        
        filename = f"{resource_name}.pptx"
        file_key = f"ppt-creation/{teacher_id}/{uuid.uuid4().hex}_{filename}"
        
        try:
            oss_client.bucket.put_object(file_key, pptx_bytes)
            logger.info(f"PPT上传OSS成功: {file_key}")
        except Exception as e:
            logger.error(f"OSS上传失败: {str(e)}")
            return SavePPTResponse(
                success=False,
                error=f"文件上传失败: {str(e)}"
            )
        
        # 3. 保存到数据库
        resource = TeachingResource(
            teacher_id=teacher_id,
            resource_name=resource_name,
            original_filename=filename,
            file_path=file_key,
            file_size=len(pptx_bytes),
            resource_type="ppt",
            knowledge_point=knowledge_point,
            folder_id=folder_id,
            is_active=True
        )
        
        db.add(resource)
        await db.commit()
        await db.refresh(resource)
        
        logger.info(f"PPT保存到系统成功: resource_id={resource.id}")
        
        return SavePPTResponse(
            success=True,
            resource_id=resource.id
        )
    
    except Exception as e:
        logger.error(f"保存PPT失败: {str(e)}")
        await db.rollback()
        return SavePPTResponse(
            success=False,
            error=f"保存失败: {str(e)}"
        )


@router.get("/{project_id}/export")
async def export_ppt_direct(project_id: str) -> StreamingResponse:
    """
    直接导出PPT文件到本地
    
    Args:
        project_id: banana-slides项目ID
        
    Returns:
        PPTX文件流
    """
    try:
        logger.info(f"导出PPT文件: project_id={project_id}")
        
        # 从banana-slides导出PPTX
        pptx_bytes = await ppt_service.export_pptx(project_id)
        
        logger.info(f"PPT导出成功，大小: {len(pptx_bytes)} bytes")
        
        # 返回文件流
        return StreamingResponse(
            io.BytesIO(pptx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f"attachment; filename=presentation_{project_id}.pptx"
            }
        )
    
    except Exception as e:
        logger.error(f"导出PPT失败: {str(e)}")
        # 返回错误响应
        return StreamingResponse(
            io.BytesIO(f"导出失败: {str(e)}".encode()),
            media_type="text/plain",
            status_code=500
        )

