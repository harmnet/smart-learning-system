from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi import Request
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from pydantic import BaseModel
import os
import uuid
from pathlib import Path
from datetime import datetime
import logging

from app.db.session import get_db
from app.models.teaching_resource import TeachingResource
from app.models.base import User
from app.utils.oss_client import oss_client
from app.utils.libreoffice_converter import libreoffice_converter
from app.core.config import settings
from app.services.imm_service import imm_service

router = APIRouter()

# 配置
UPLOAD_DIR = Path("uploads/teaching_resources")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# 资源类型配置
RESOURCE_TYPES = {
    "video": {
        "extensions": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"],
        "mime_types": ["video/mp4", "video/x-msvideo", "video/quicktime"]
    },
    "ppt": {
        "extensions": [".ppt", ".pptx"],
        "mime_types": ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]
    },
    "pdf": {
        "extensions": [".pdf"],
        "mime_types": ["application/pdf"]
    },
    "word": {
        "extensions": [".doc", ".docx"],
        "mime_types": ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    },
    "excel": {
        "extensions": [".xls", ".xlsx"],
        "mime_types": ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]
    },
    "markdown": {
        "extensions": [".md", ".markdown"],
        "mime_types": ["text/markdown", "text/plain"]
    },
    "image": {
        "extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
        "mime_types": ["image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp"]
    }
}

# 确保上传目录存在
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class TeachingResourceResponse(BaseModel):
    id: int
    teacher_id: int
    teacher_name: str
    resource_name: str
    original_filename: str
    file_size: int
    resource_type: str
    knowledge_point: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

class TeachingResourceUpdate(BaseModel):
    resource_name: Optional[str] = None
    knowledge_point: Optional[str] = None
    folder_id: Optional[int] = None

def get_resource_type_from_filename(filename: str) -> Optional[str]:
    """根据文件名获取资源类型"""
    ext = Path(filename).suffix.lower()
    for resource_type, config in RESOURCE_TYPES.items():
        if ext in config["extensions"]:
            return resource_type
    return None

@router.get("/stats")
async def get_resources_stats(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(lambda: None)  # TODO: 添加认证
) -> Any:
    """获取教学资源统计（仅当前教师的资源）"""
    # 总数（仅当前教师）
    total_result = await db.execute(
        select(func.count(TeachingResource.id)).where(
            and_(
                TeachingResource.is_active == True,
                TeachingResource.teacher_id == teacher_id
            )
        )
    )
    total = total_result.scalar() or 0
    
    # 按类型统计（仅当前教师）
    type_stats = {}
    for resource_type in RESOURCE_TYPES.keys():
        type_result = await db.execute(
            select(func.count(TeachingResource.id)).where(
                and_(
                    TeachingResource.is_active == True,
                    TeachingResource.resource_type == resource_type,
                    TeachingResource.teacher_id == teacher_id
                )
            )
        )
        type_stats[resource_type] = type_result.scalar() or 0
    
    return {
        "total": total,
        "by_type": type_stats
    }

@router.get("", response_model=List[TeachingResourceResponse])
@router.get("/", response_model=List[TeachingResourceResponse])
async def get_resources(
    teacher_id: int,
    skip: int = 0,
    limit: int = 20,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    folder_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(lambda: None)  # TODO: 添加认证
) -> Any:
    """获取教学资源列表"""
    import logging
    logging.info(f"获取教学资源列表: teacher_id={teacher_id}, skip={skip}, limit={limit}")
    
    query = select(TeachingResource, User).join(
        User, TeachingResource.teacher_id == User.id
    ).where(
        TeachingResource.is_active == True,
        TeachingResource.teacher_id == teacher_id
    )
    
    if resource_type:
        query = query.where(TeachingResource.resource_type == resource_type)
    
    if search:
        query = query.where(
            TeachingResource.resource_name.ilike(f"%{search}%")
        )
    
    # 文件夹筛选
    if folder_id is not None:
        if folder_id == 0:
            # folder_id=0 表示根目录（未分类）
            query = query.where(TeachingResource.folder_id.is_(None))
        else:
            query = query.where(TeachingResource.folder_id == folder_id)
    
    query = query.order_by(TeachingResource.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    rows = result.all()
    
    logging.info(f"查询到 {len(rows)} 个教学资源")
    
    resources = []
    for resource, teacher in rows:
        resources.append({
            "id": resource.id,
            "teacher_id": resource.teacher_id,
            "teacher_name": teacher.full_name,
            "resource_name": resource.resource_name,
            "original_filename": resource.original_filename,
            "file_size": resource.file_size,
            "resource_type": resource.resource_type,
            "knowledge_point": resource.knowledge_point,
            "is_active": resource.is_active,
            "created_at": resource.created_at.isoformat() if resource.created_at else None,
            "updated_at": resource.updated_at.isoformat() if resource.updated_at else None
        })
    
    logging.info(f"返回 {len(resources)} 个教学资源")
    return resources

@router.post("/upload")
async def upload_resource(
    file: UploadFile = File(...),
    resource_name: Optional[str] = Form(None),
    knowledge_point: Optional[str] = Form(None),
    folder_id: Optional[int] = Form(None),
    teacher_id: int = Form(...),  # TODO: 从认证中获取
    db: AsyncSession = Depends(get_db),
) -> Any:
    """上传教学资源"""
    # 检查文件名
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="文件名不能为空"
        )
    
    logging.info(f"上传文件: {file.filename}, 类型: {file.content_type}")
    
    # 检查文件大小
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"文件大小超过限制。最大允许 50MB，当前文件: {file_size / 1024 / 1024:.2f}MB"
        )
    
    # 确定资源类型
    resource_type = get_resource_type_from_filename(file.filename)
    if not resource_type:
        logging.error(f"不支持的文件类型: {file.filename}, 扩展名: {Path(file.filename).suffix.lower()}")
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型。支持的类型: {', '.join(RESOURCE_TYPES.keys())}"
        )
    
    # 生成唯一文件名
    file_ext = Path(file.filename).suffix.lower()
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    
    # 先保存到本地服务器（无论OSS是否启用，都需要本地文件用于PDF转换）
    type_dir = UPLOAD_DIR / resource_type
    type_dir.mkdir(parents=True, exist_ok=True)
    local_file_path = type_dir / filename
    
    try:
        with open(local_file_path, "wb") as f:
            f.write(file_content)
        logging.info(f"文件已保存到本地: {local_file_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")
    
    # 同时上传到OSS（如果OSS已启用）
    oss_url = None
    if oss_client.enabled:
        try:
            oss_key = f"teaching_resources/{resource_type}/{filename}"
            # 确定MIME类型
            mime_type = None
            if resource_type in RESOURCE_TYPES:
                mime_types = RESOURCE_TYPES[resource_type]["mime_types"]
                if mime_types:
                    mime_type = mime_types[0]
            oss_url = oss_client.upload_file(file_content, oss_key, content_type=mime_type)
            logging.info(f"文件已上传到OSS: {oss_key}, URL: {oss_url}")
        except Exception as e:
            logging.error(f"上传到OSS失败: {e}，继续使用本地存储")
            oss_url = None
    
    # 文件路径：优先使用OSS URL，否则使用本地路径
    file_path_str = oss_url if oss_url else str(local_file_path)
    
    # 如果是Office文档，尝试转换为PDF
    pdf_local_path = None
    pdf_path = None
    pdf_conversion_status = 'pending'
    
    if resource_type in ['word', 'excel', 'ppt']:
        if libreoffice_converter.is_supported_format(local_file_path):
            try:
                # 创建PDF输出目录
                pdf_output_dir = UPLOAD_DIR / "pdfs" / resource_type
                pdf_output_dir.mkdir(parents=True, exist_ok=True)
                
                # 转换为PDF
                pdf_file = libreoffice_converter.convert_to_pdf(local_file_path, pdf_output_dir)
                
                if pdf_file and pdf_file.exists():
                    pdf_local_path = str(pdf_file)
                    pdf_conversion_status = 'success'
                    
                    # 读取PDF文件内容
                    with open(pdf_file, 'rb') as f:
                        pdf_content = f.read()
                    
                    # 上传PDF到OSS（如果OSS已启用）
                    if oss_client.enabled:
                        try:
                            pdf_oss_key = f"teaching_resources/pdfs/{resource_type}/{pdf_file.name}"
                            pdf_path = oss_client.upload_file(pdf_content, pdf_oss_key, content_type="application/pdf")
                            logging.info(f"PDF已上传到OSS: {pdf_oss_key}, URL: {pdf_path}")
                        except Exception as e:
                            logging.error(f"PDF上传到OSS失败: {e}")
                            pdf_path = pdf_local_path  # 使用本地路径
                    else:
                        pdf_path = pdf_local_path
                    
                    logging.info(f"PDF转换成功: {pdf_local_path}")
                else:
                    pdf_conversion_status = 'failed'
                    logging.warning(f"PDF转换失败: {local_file_path}")
            except Exception as e:
                pdf_conversion_status = 'failed'
                logging.error(f"PDF转换过程中出错: {e}")
    
    # 创建数据库记录
    resource = TeachingResource(
        teacher_id=teacher_id,
        resource_name=resource_name or file.filename,
        original_filename=file.filename,
        file_path=file_path_str,  # OSS URL或本地路径
        local_file_path=str(local_file_path),  # 本地文件路径（用于PDF转换）
        file_size=file_size,
        resource_type=resource_type,
        pdf_path=pdf_path,  # PDF文件路径（OSS或本地）
        pdf_local_path=pdf_local_path,  # PDF本地文件路径
        pdf_converted_at=datetime.utcnow() if pdf_local_path else None,
        pdf_conversion_status=pdf_conversion_status,
        knowledge_point=knowledge_point,
        folder_id=folder_id,
        is_active=True
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    
    return {
        "message": "资源上传成功",
        "id": resource.id,
        "resource_name": resource.resource_name,
        "resource_type": resource.resource_type,
        "file_size": file_size,
        "file_path": file_path_str,
        "pdf_converted": pdf_conversion_status == 'success'
    }

@router.put("/{resource_id}")
async def update_resource(
    resource_id: int,
    resource_update: TeachingResourceUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新教学资源信息"""
    result = await db.execute(
        select(TeachingResource).where(
            TeachingResource.id == resource_id,
            TeachingResource.is_active == True
        )
    )
    resource = result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    if resource_update.resource_name is not None:
        resource.resource_name = resource_update.resource_name
    if resource_update.knowledge_point is not None:
        resource.knowledge_point = resource_update.knowledge_point
    if resource_update.folder_id is not None:
        resource.folder_id = resource_update.folder_id
    
    resource.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(resource)
    
    return {"message": "资源更新成功", "id": resource.id}

@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除教学资源（逻辑删除）"""
    result = await db.execute(
        select(TeachingResource).where(
            TeachingResource.id == resource_id,
            TeachingResource.is_active == True
        )
    )
    resource = result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    # 逻辑删除
    resource.is_active = False
    resource.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "资源删除成功"}

@router.get("/{resource_id}/download")
async def download_resource(
    resource_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
):
    """下载教学资源（支持OSS和本地文件）- 需要权限验证"""
    result = await db.execute(
        select(TeachingResource).where(
            TeachingResource.id == resource_id,
            TeachingResource.teacher_id == teacher_id,
            TeachingResource.is_active == True
        )
    )
    resource = result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在或无权访问")
    
    # 如果是OSS文件，从OSS下载并返回
    if resource.file_path.startswith('http://') or resource.file_path.startswith('https://'):
        try:
            # 从OSS URL中提取key
            oss_key = None
            if '.aliyuncs.com/' in resource.file_path:
                parts = resource.file_path.split('.aliyuncs.com/')
                if len(parts) > 1:
                    oss_key = parts[1].split('?')[0]
            elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                if resource.file_path.startswith(settings.OSS_ENDPOINT):
                    oss_key = resource.file_path.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
            
            if oss_key and oss_client.enabled:
                # 从OSS下载文件
                import httpx
                async with httpx.AsyncClient() as client:
                    download_url = oss_client.generate_download_url(oss_key, expires=3600)
                    response = await client.get(download_url)
                    response.raise_for_status()
                    
                    # 确定 MIME 类型
                    mime_type = "application/octet-stream"
                    if resource.resource_type in RESOURCE_TYPES:
                        mime_types = RESOURCE_TYPES[resource.resource_type]["mime_types"]
                        if mime_types:
                            mime_type = mime_types[0]
                    
                    from fastapi.responses import Response
                    from urllib.parse import quote
                    encoded_filename = quote(resource.original_filename)
                    
                    return Response(
                        content=response.content,
                        media_type=mime_type,
                        headers={
                            'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET',
                            'Access-Control-Allow-Headers': '*',
                        }
                    )
        except Exception as e:
            logging.error(f"从OSS下载文件失败: {e}")
            raise HTTPException(status_code=500, detail=f"文件下载失败: {str(e)}")
    
    # 本地文件
    file_path = Path(resource.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 确定 MIME 类型
    mime_type = "application/octet-stream"
    if resource.resource_type in RESOURCE_TYPES:
        mime_types = RESOURCE_TYPES[resource.resource_type]["mime_types"]
        if mime_types:
            mime_type = mime_types[0]
    
    return FileResponse(
        file_path,
        media_type=mime_type,
        filename=resource.original_filename
    )

@router.get("/{resource_id}/pdf")
async def get_pdf(
    resource_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取PDF文件（转换后的PDF或原始PDF文件）- 需要权限验证"""
    result = await db.execute(
        select(TeachingResource).where(
            TeachingResource.id == resource_id,
            TeachingResource.teacher_id == teacher_id,
            TeachingResource.is_active == True
        )
    )
    resource = result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在或无权访问")
    
    # 优先使用转换后的PDF（pdf_path）
    pdf_path_to_use = None
    pdf_is_oss = False
    
    if resource.pdf_path:
        pdf_path_to_use = resource.pdf_path
        pdf_is_oss = pdf_path_to_use.startswith('http://') or pdf_path_to_use.startswith('https://')
        logging.info(f"使用pdf_path: {pdf_path_to_use}, is_oss: {pdf_is_oss}")
    elif resource.pdf_local_path:
        pdf_path_to_use = resource.pdf_local_path
        pdf_is_oss = False
        logging.info(f"使用pdf_local_path: {pdf_path_to_use}, is_oss: {pdf_is_oss}")
    elif resource.resource_type.lower() == 'pdf':
        # 如果是原始PDF文件，使用原始文件路径
        pdf_path_to_use = resource.file_path
        pdf_is_oss = pdf_path_to_use.startswith('http://') or pdf_path_to_use.startswith('https://')
        logging.info(f"使用原始file_path: {pdf_path_to_use}, is_oss: {pdf_is_oss}")
    
    if not pdf_path_to_use:
        logging.error(f"资源ID {resource_id} 没有找到PDF路径")
        raise HTTPException(status_code=404, detail="PDF文件不存在")
    
    logging.info(f"处理PDF文件: path={pdf_path_to_use}, is_oss={pdf_is_oss}, oss_enabled={oss_client.enabled}")
    
    # 处理OSS PDF文件
    if pdf_is_oss:
        try:
            # 如果OSS客户端已启用，尝试使用签名URL
            if oss_client.enabled:
                # 从OSS URL中提取key
                oss_key = None
                if '.aliyuncs.com/' in pdf_path_to_use:
                    parts = pdf_path_to_use.split('.aliyuncs.com/')
                    if len(parts) > 1:
                        oss_key = parts[1].split('?')[0]
                elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                    if pdf_path_to_use.startswith(settings.OSS_ENDPOINT):
                        oss_key = pdf_path_to_use.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
                
                if oss_key:
                    try:
                        import httpx
                        async with httpx.AsyncClient() as client:
                            download_url = oss_client.generate_download_url(oss_key, expires=3600)
                            logging.info(f"生成OSS签名下载URL: {download_url}")
                            response = await client.get(download_url)
                            response.raise_for_status()
                            
                            from fastapi.responses import Response
                            from urllib.parse import quote
                            pdf_filename = resource.original_filename
                            if not pdf_filename.endswith('.pdf'):
                                pdf_filename = resource.original_filename.replace(Path(resource.original_filename).suffix, '.pdf')
                            encoded_filename = quote(pdf_filename)
                            
                            logging.info(f"成功从OSS获取PDF（使用签名URL），大小: {len(response.content)} bytes")
                            return Response(
                                content=response.content,
                                media_type="application/pdf",
                                headers={
                                    'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
                                    'Access-Control-Allow-Origin': '*',
                                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                                    'Access-Control-Allow-Headers': '*',
                                    'Access-Control-Expose-Headers': 'Content-Type, Content-Disposition',
                                    'Cache-Control': 'public, max-age=3600',
                                }
                            )
                    except Exception as e:
                        logging.warning(f"使用OSS签名URL失败: {e}，尝试直接访问OSS URL")
            
            # 如果OSS客户端未启用或签名URL失败，直接通过HTTP访问OSS URL（后端代理）
            logging.info(f"通过后端代理直接访问OSS URL: {pdf_path_to_use}")
            import httpx
            async with httpx.AsyncClient() as client:
                # 直接访问OSS URL（后端代理，避免CORS问题）
                response = await client.get(pdf_path_to_use, timeout=30.0)
                response.raise_for_status()
                
                from fastapi.responses import Response
                from urllib.parse import quote
                pdf_filename = resource.original_filename
                if not pdf_filename.endswith('.pdf'):
                    pdf_filename = resource.original_filename.replace(Path(resource.original_filename).suffix, '.pdf')
                encoded_filename = quote(pdf_filename)
                
                logging.info(f"成功从OSS获取PDF（直接访问），大小: {len(response.content)} bytes")
                return Response(
                    content=response.content,
                    media_type="application/pdf",
                    headers={
                        'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': '*',
                        'Access-Control-Expose-Headers': 'Content-Type, Content-Disposition',
                        'Cache-Control': 'public, max-age=3600',
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"从OSS获取PDF失败: {e}")
            raise HTTPException(status_code=500, detail=f"获取PDF文件失败: {str(e)}")
    
    # 使用本地PDF文件
    pdf_path = Path(pdf_path_to_use)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF文件不存在: {pdf_path_to_use}")
    
    from fastapi.responses import FileResponse
    from urllib.parse import quote
    pdf_filename = resource.original_filename
    if not pdf_filename.endswith('.pdf'):
        pdf_filename = resource.original_filename.replace(Path(resource.original_filename).suffix, '.pdf')
    encoded_filename = quote(pdf_filename)
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={
            'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Expose-Headers': 'Content-Type, Content-Disposition',
            'Cache-Control': 'public, max-age=3600',
        }
    )

@router.get("/{resource_id}/weboffice-url")
async def get_weboffice_preview_url(
    resource_id: int,
    teacher_id: int,
    expires: int = Query(3600, description="URL有效期（秒），默认3600秒（1小时）"),
    allow_export: bool = Query(True, description="是否允许导出"),
    allow_print: bool = Query(True, description="是否允许打印"),
    watermark: Optional[str] = Query(None, description="水印文字（可选）"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取WebOffice在线预览URL
    仅支持Word、Excel、PPT、PDF文件 - 需要权限验证
    """
    result = await db.execute(
        select(TeachingResource).where(
            TeachingResource.id == resource_id,
            TeachingResource.teacher_id == teacher_id,
            TeachingResource.is_active == True
        )
    )
    resource = result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在或无权访问")
    
    # 检查资源类型是否支持WebOffice预览
    supported_types = ['word', 'excel', 'ppt', 'pdf']
    if resource.resource_type.lower() not in supported_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型。WebOffice仅支持: {', '.join(supported_types)}"
        )
    
    # 确保OSS已启用
    if not oss_client.enabled:
        raise HTTPException(
            status_code=503,
            detail="OSS服务未配置，无法生成预览URL"
        )
    
    # 检查文件是否在OSS中
    if not (resource.file_path.startswith('http://') or resource.file_path.startswith('https://')):
        raise HTTPException(
            status_code=400,
            detail="文件未上传到OSS，无法使用WebOffice预览"
        )
    
    try:
        # 从OSS URL中提取object_key
        oss_key = None
        if '.aliyuncs.com/' in resource.file_path:
            parts = resource.file_path.split('.aliyuncs.com/')
            if len(parts) > 1:
                oss_key = parts[1].split('?')[0]
        elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
            if resource.file_path.startswith(settings.OSS_ENDPOINT):
                oss_key = resource.file_path.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
        
        if not oss_key:
            raise HTTPException(
                status_code=400,
                detail="无法从文件路径提取OSS对象键"
            )
        
        # 生成WebOffice预览URL
        preview_url = oss_client.generate_weboffice_preview_url(
            object_key=oss_key,
            expires=expires,
            allow_export=allow_export,
            allow_print=allow_print,
            watermark_text=watermark
        )
        
        return {
            "success": True,
            "preview_url": preview_url,
            "resource_id": resource_id,
            "resource_name": resource.resource_name,
            "resource_type": resource.resource_type,
            "expires_in": expires
        }
    
    except Exception as e:
        logging.error(f"生成WebOffice预览URL失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"生成预览URL失败: {str(e)}"
        )

@router.get("/{resource_id}/preview")
async def preview_resource(
    resource_id: int,
    teacher_id: int,
    request: Request,
    token: Optional[str] = Query(None, description="Authentication token (optional, for iframe/img/video tags)"),
    db: AsyncSession = Depends(get_db),
):
    """预览教学资源（用于图片、PDF等）- 需要权限验证"""
    result = await db.execute(
        select(TeachingResource).where(
            TeachingResource.id == resource_id,
            TeachingResource.teacher_id == teacher_id,
            TeachingResource.is_active == True
        )
    )
    resource = result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    resource_type = resource.resource_type.lower()
    
    # Office文档（Word、Excel、PPT）优先使用转换后的PDF预览
    if resource_type in ['word', 'excel', 'ppt']:
        # 如果没有PDF或转换失败，尝试自动转换
        if not resource.pdf_path or resource.pdf_conversion_status != 'success':
            if resource.local_file_path:
                local_file = Path(resource.local_file_path)
                if local_file.exists() and libreoffice_converter.is_supported_format(local_file):
                    try:
                        # 创建PDF输出目录
                        pdf_output_dir = UPLOAD_DIR / "pdfs" / resource_type
                        pdf_output_dir.mkdir(parents=True, exist_ok=True)
                        
                        # 转换为PDF
                        pdf_file = libreoffice_converter.convert_to_pdf(local_file, pdf_output_dir)
                        
                        if pdf_file and pdf_file.exists():
                            pdf_local_path_str = str(pdf_file)
                            
                            # 读取PDF文件内容
                            with open(pdf_file, 'rb') as f:
                                pdf_content = f.read()
                            
                            # 上传PDF到OSS（如果OSS已启用）
                            pdf_path_str = None
                            if oss_client.enabled:
                                try:
                                    pdf_oss_key = f"teaching_resources/pdfs/{resource_type}/{pdf_file.name}"
                                    pdf_path_str = oss_client.upload_file(pdf_content, pdf_oss_key, content_type="application/pdf")
                                    logging.info(f"PDF已上传到OSS: {pdf_oss_key}")
                                except Exception as e:
                                    logging.error(f"PDF上传到OSS失败: {e}")
                                    pdf_path_str = pdf_local_path_str
                            else:
                                pdf_path_str = pdf_local_path_str
                            
                            # 更新数据库记录
                            resource.pdf_path = pdf_path_str
                            resource.pdf_local_path = pdf_local_path_str
                            resource.pdf_converted_at = datetime.utcnow()
                            resource.pdf_conversion_status = 'success'
                            await db.commit()
                            await db.refresh(resource)
                            
                            logging.info(f"自动转换PDF成功: {pdf_local_path_str}")
                    except Exception as e:
                        logging.error(f"自动转换PDF失败: {e}")
        
        # 检查是否有转换后的PDF
        if resource.pdf_path and resource.pdf_conversion_status == 'success':
            # 使用PDF预览
            pdf_url = None
            
            if resource.pdf_path.startswith('http://') or resource.pdf_path.startswith('https://'):
                # OSS URL，通过后端代理返回
                try:
                    # 从OSS URL中提取key
                    oss_key = None
                    if '.aliyuncs.com/' in resource.pdf_path:
                        parts = resource.pdf_path.split('.aliyuncs.com/')
                        if len(parts) > 1:
                            oss_key = parts[1].split('?')[0]
                    elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                        if resource.pdf_path.startswith(settings.OSS_ENDPOINT):
                            oss_key = resource.pdf_path.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
                    
                    if oss_key and oss_client.enabled:
                        # 生成PDF的预览URL（通过后端代理）
                        base_url = str(request.base_url).rstrip('/')
                        pdf_url = f"{base_url}/api/v1/teacher/resources/{resource_id}/pdf"
                except Exception as e:
                    logging.error(f"处理PDF OSS URL失败: {e}")
            
            if not pdf_url and resource.pdf_local_path:
                # 本地PDF文件，返回后端代理URL
                pdf_path = Path(resource.pdf_local_path)
                if pdf_path.exists():
                    base_url = str(request.base_url).rstrip('/')
                    pdf_url = f"{base_url}/api/v1/teacher/resources/{resource_id}/pdf"
            
            if pdf_url:
                return {
                    "preview_url": pdf_url,
                    "download_url": pdf_url,
                    "preview_type": "pdf",  # 标记为PDF类型，前端使用PDF.js预览
                    "resource_type": "pdf",  # 返回PDF类型，让前端按PDF处理
                    "file_name": resource.original_filename.replace(Path(resource.original_filename).suffix, '.pdf')
                }
        
        # 如果没有PDF，尝试使用WebOffice预览（如果文件在OSS上）
        if resource.file_path and oss_client.enabled:
            # 判断文件是否在OSS上（可能是完整URL或相对路径）
            oss_key = None
            
            # 情况1：完整的HTTP/HTTPS URL
            if resource.file_path.startswith('http://') or resource.file_path.startswith('https://'):
                # 从URL中提取object_key
                if '.aliyuncs.com/' in resource.file_path:
                    parts = resource.file_path.split('.aliyuncs.com/')
                    if len(parts) > 1:
                        oss_key = parts[1].split('?')[0]
                elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                    if resource.file_path.startswith(settings.OSS_ENDPOINT):
                        oss_key = resource.file_path.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
            # 情况2：相对路径（直接就是object_key）
            elif not resource.file_path.startswith('/'):
                # 相对路径，直接作为object_key使用
                oss_key = resource.file_path
                logging.info(f"检测到相对路径，作为OSS key使用: {oss_key}")
            
            if oss_key:
                # 优先使用IMM服务生成WebOffice预览URL和token（支持iframe嵌入）
                if imm_service:
                    try:
                        # 获取当前用户信息（从request中获取，如果没有则使用默认值）
                        # 注意：这里需要从认证信息中获取用户ID和名称
                        # 暂时使用teacher_id作为user_id
                        user_id = str(teacher_id)
                        user_name = "学生"  # 可以从request中获取实际用户名
                        
                        # 构建水印配置（可选）
                        watermark_config = None
                        # 如果需要水印，可以这样配置：
                        # watermark_config = {"Type": 1, "Value": "内部资料"}
                        
                        # 使用IMM服务生成WebOffice预览凭证
                        imm_result = imm_service.generate_weboffice_token(
                            object_name=oss_key,
                            user_id=user_id,
                            user_name=user_name,
                            permission="readonly",  # 学生端只读
                            watermark=watermark_config,
                            expire_seconds=3600  # 1小时有效期
                        )
                        
                        if imm_result.get("success") and imm_result.get("weboffice_url") and imm_result.get("access_token"):
                            logging.info(f"成功使用IMM服务生成WebOffice预览URL")
                            return {
                                "preview_url": imm_result.get("weboffice_url"),
                                "download_url": f"{str(request.base_url).rstrip('/')}/api/v1/teacher/resources/{resource_id}/download",
                                "preview_type": "weboffice",  # 使用weboffice类型，前端使用WebOffice SDK
                                "resource_type": resource_type,
                                "file_name": resource.original_filename,
                                "access_token": imm_result.get("access_token"),
                                "refresh_token": imm_result.get("refresh_token"),
                                "access_token_expired_time": imm_result.get("access_token_expired_time"),
                                "refresh_token_expired_time": imm_result.get("refresh_token_expired_time")
                            }
                        else:
                            error_msg = imm_result.get("error", "未知错误")
                            logging.warning(f"IMM服务生成WebOffice凭证失败: {error_msg}，尝试使用OSS签名URL")
                    except Exception as e:
                        logging.error(f"使用IMM服务生成WebOffice凭证失败: {e}，尝试使用OSS签名URL")
                
                # 如果IMM服务不可用或失败，回退到OSS签名URL方式
                try:
                    # 使用oss_client生成带WebOffice预览参数的签名URL
                    preview_url = oss_client.generate_weboffice_preview_url(
                        object_key=oss_key,
                        expires=3600,  # 1小时有效期
                        allow_export=True,
                        allow_print=True,
                        watermark_text=None  # 可选：添加水印
                    )
                    
                    if preview_url:
                        logging.info(f"成功生成WebOffice预览URL: {preview_url}")
                        return {
                            "preview_url": preview_url,
                            "download_url": f"{str(request.base_url).rstrip('/')}/api/v1/teacher/resources/{resource_id}/download",
                            "preview_type": "direct",  # 使用direct类型，前端直接在iframe中打开
                            "resource_type": resource_type,
                            "file_name": resource.original_filename
                        }
                    else:
                        logging.error("生成WebOffice预览URL失败：返回空URL")
                except Exception as e:
                    logging.error(f"生成WebOffice签名URL失败: {e}")
        
        # 如果WebOffice失败，使用后端代理下载URL（前端JavaScript转换作为备用方案）
        base_url = str(request.base_url).rstrip('/')
        proxy_download_url = f"{base_url}/api/v1/teacher/resources/{resource_id}/download"
        return {
            "preview_url": proxy_download_url,
            "download_url": proxy_download_url,
            "preview_type": "download",  # 标记为下载类型，前端使用转换方案
            "resource_type": resource_type,
            "file_name": resource.original_filename
        }
    
    # PDF文件特殊处理 - 返回代理URL而不是直接返回文件内容
    if resource_type == 'pdf':
        # 对于PDF文件，返回代理URL（通过后端代理，避免CORS问题）
        base_url = str(request.base_url).rstrip('/')
        
        # 检查是否有PDF路径（可能是转换后的PDF）
        pdf_path_to_use = resource.pdf_path if resource.pdf_path else resource.file_path
        
        if pdf_path_to_use and (pdf_path_to_use.startswith('http://') or pdf_path_to_use.startswith('https://')):
            # OSS PDF文件，返回后端代理URL
            pdf_proxy_url = f"{base_url}/api/v1/teacher/resources/{resource_id}/pdf"
            return {
                "preview_url": pdf_proxy_url,
                "download_url": pdf_proxy_url,
                "preview_type": "pdf",  # 标记为PDF类型
                "resource_type": "pdf",  # 返回PDF类型
                "file_name": resource.original_filename
            }
        elif resource.pdf_local_path:
            # 本地PDF文件，返回后端代理URL
            pdf_proxy_url = f"{base_url}/api/v1/teacher/resources/{resource_id}/pdf"
            return {
                "preview_url": pdf_proxy_url,
                "download_url": pdf_proxy_url,
                "preview_type": "pdf",  # 标记为PDF类型
                "resource_type": "pdf",  # 返回PDF类型
                "file_name": resource.original_filename
            }
        else:
            # 使用原始文件路径的代理URL
            pdf_proxy_url = f"{base_url}/api/v1/teacher/resources/{resource_id}/download"
            return {
                "preview_url": pdf_proxy_url,
                "download_url": pdf_proxy_url,
                "preview_type": "pdf",  # 标记为PDF类型
                "resource_type": "pdf",  # 返回PDF类型
                "file_name": resource.original_filename
            }
    
    # 处理OSS URL（图片、视频等，不包括PDF）
    if resource.file_path.startswith('http://') or resource.file_path.startswith('https://'):
        # OSS文件，通过后端代理返回文件内容（避免CORS问题）
        try:
            # 从OSS URL中提取key
            oss_key = None
            if '.aliyuncs.com/' in resource.file_path:
                parts = resource.file_path.split('.aliyuncs.com/')
                if len(parts) > 1:
                    oss_key = parts[1].split('?')[0]  # 移除查询参数
            elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                if resource.file_path.startswith(settings.OSS_ENDPOINT):
                    oss_key = resource.file_path.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
            
            if oss_key and oss_client.enabled:
                # 从OSS下载文件并返回
                import httpx
                async with httpx.AsyncClient() as client:
                    download_url = oss_client.generate_download_url(oss_key, expires=3600)
                    response = await client.get(download_url)
                    response.raise_for_status()
                    
                    # 确定 MIME 类型
                    mime_type = "application/octet-stream"
                    if resource.resource_type in RESOURCE_TYPES:
                        mime_types = RESOURCE_TYPES[resource.resource_type]["mime_types"]
                        if mime_types:
                            mime_type = mime_types[0]
                    
                    from fastapi.responses import Response
                    from urllib.parse import quote
                    encoded_filename = quote(resource.original_filename)
                    
                    return Response(
                        content=response.content,
                        media_type=mime_type,
                        headers={
                            'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, OPTIONS',
                            'Access-Control-Allow-Headers': '*',
                            'Access-Control-Expose-Headers': 'Content-Type, Content-Disposition',
                            'Cache-Control': 'public, max-age=3600',
                        }
                    )
        except Exception as e:
            logging.error(f"从OSS获取文件失败: {e}")
            # 如果OSS获取失败，继续尝试本地文件
        
        # 如果无法从OSS获取，尝试直接重定向（可能不是OSS URL）
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=str(resource.file_path))
    
    # 本地文件预览
    file_path = Path(resource.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 确定 MIME 类型
    mime_type = "application/octet-stream"
    if resource.resource_type in RESOURCE_TYPES:
        mime_types = RESOURCE_TYPES[resource.resource_type]["mime_types"]
        if mime_types:
            mime_type = mime_types[0]
    
    # 返回文件用于在线预览（不触发下载）
    from fastapi.responses import Response
    from urllib.parse import quote
    
    # 对于某些类型，使用 inline 显示
    inline_types = ['image', 'pdf', 'video']
    
    # URL编码文件名以支持中文
    encoded_filename = quote(resource.original_filename)
    
    if resource.resource_type.lower() in inline_types:
        # 读取文件内容
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # 对于PDF，确保Content-Type正确
        if resource_type == 'pdf':
            mime_type = 'application/pdf'
        
        return Response(
            content=content,
            media_type=mime_type,
            headers={
                'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Expose-Headers': 'Content-Type, Content-Disposition',
                'Cache-Control': 'public, max-age=3600',
            }
        )
    else:
        # 其他类型返回 FileResponse
        return FileResponse(
            file_path,
            media_type=mime_type,
            headers={
                'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': '*',
                'Cache-Control': 'public, max-age=3600',
            }
        )

