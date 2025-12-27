from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query, Request
from fastapi import Request
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from pathlib import Path
from datetime import datetime
import os
import shutil
from urllib.parse import quote

from app.db.session import get_db
from app.models.base import User
from app.models.reference_material import ReferenceMaterial
from app.models.reference_folder import ReferenceFolder
from app.utils.oss_client import oss_client
from app.core.config import settings

router = APIRouter()

# 资源类型配置（与教学资源相同，但增加了link和archive类型）
RESOURCE_TYPES = {
    "video": {"extensions": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv"], "mime_types": ["video/mp4", "video/x-msvideo", "video/quicktime"]},
    "ppt": {"extensions": [".ppt", ".pptx"], "mime_types": ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]},
    "pdf": {"extensions": [".pdf"], "mime_types": ["application/pdf"]},
    "word": {"extensions": [".doc", ".docx"], "mime_types": ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]},
    "excel": {"extensions": [".xls", ".xlsx"], "mime_types": ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]},
    "markdown": {"extensions": [".md", ".markdown"], "mime_types": ["text/markdown"]},
    "image": {"extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"], "mime_types": ["image/jpeg", "image/png", "image/gif"]},
    "archive": {"extensions": [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".tar.gz", ".tar.bz2"], "mime_types": ["application/zip", "application/x-rar-compressed", "application/x-7z-compressed", "application/x-tar", "application/gzip"]},
    "link": {"extensions": [], "mime_types": []}  # 链接类型不需要文件
}

UPLOAD_DIR = Path("uploads/reference_materials")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def get_resource_type(filename: str) -> str:
    """根据文件扩展名判断资源类型"""
    ext = Path(filename).suffix.lower()
    for resource_type, config in RESOURCE_TYPES.items():
        if ext in config["extensions"]:
            return resource_type
    return "other"

@router.get("/stats")
async def get_stats(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取参考资料统计信息"""
    # 总数
    total_result = await db.execute(
        select(func.count(ReferenceMaterial.id)).where(
            and_(
                ReferenceMaterial.teacher_id == teacher_id,
                ReferenceMaterial.is_active == True
            )
        )
    )
    total = total_result.scalar() or 0
    
    # 按类型统计
    by_type = {}
    for resource_type in RESOURCE_TYPES.keys():
        type_result = await db.execute(
            select(func.count(ReferenceMaterial.id)).where(
                and_(
                    ReferenceMaterial.teacher_id == teacher_id,
                    ReferenceMaterial.resource_type == resource_type,
                    ReferenceMaterial.is_active == True
                )
            )
        )
        by_type[resource_type] = type_result.scalar() or 0
    
    return {
        "total": total,
        "by_type": by_type
    }

@router.get("/")
async def get_materials(
    teacher_id: int,
    skip: int = 0,
    limit: int = 20,
    resource_type: Optional[str] = None,
    search: Optional[str] = None,
    folder_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
) -> List[Any]:
    """获取参考资料列表"""
    import logging
    logging.info(f"获取参考资料列表: teacher_id={teacher_id}, skip={skip}, limit={limit}")
    
    query = select(ReferenceMaterial).where(
        and_(
            ReferenceMaterial.teacher_id == teacher_id,
            ReferenceMaterial.is_active == True
        )
    )
    
    if resource_type:
        query = query.where(ReferenceMaterial.resource_type == resource_type)
    
    if search:
        query = query.where(ReferenceMaterial.resource_name.ilike(f"%{search}%"))
    
    if folder_id is not None:
        query = query.where(ReferenceMaterial.folder_id == folder_id)
    elif folder_id is None and 'folder_id' in locals():
        query = query.where(ReferenceMaterial.folder_id.is_(None))
    
    query = query.offset(skip).limit(limit).order_by(ReferenceMaterial.created_at.desc())
    
    result = await db.execute(query)
    materials = result.scalars().all()
    
    logging.info(f"查询到 {len(materials)} 个参考资料")
    
    # 获取教师姓名
    teacher_result = await db.execute(
        select(User).where(User.id == teacher_id)
    )
    teacher = teacher_result.scalars().first()
    teacher_name = teacher.full_name if teacher else "Unknown"
    
    result_list = [
        {
            "id": m.id,
            "teacher_id": m.teacher_id,
            "teacher_name": teacher_name,
            "resource_name": m.resource_name,
            "original_filename": m.original_filename,
            "file_size": m.file_size,
            "resource_type": m.resource_type,
            "knowledge_point": m.knowledge_point,
            "link_url": m.link_url,
            "folder_id": m.folder_id,
            "is_active": m.is_active,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "updated_at": m.updated_at.isoformat() if m.updated_at else None,
        }
        for m in materials
    ]
    
    logging.info(f"返回 {len(result_list)} 个参考资料")
    return result_list

@router.post("/upload")
async def upload_material(
    file: UploadFile = File(...),
    teacher_id: int = Form(...),
    resource_name: str = Form(...),
    knowledge_point: Optional[str] = Form(None),
    folder_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """上传参考资料文件"""
    # 检查文件大小（50MB限制）
    MAX_FILE_SIZE = 50 * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"文件大小超过限制（最大50MB）")
    
    # 确定资源类型
    resource_type = get_resource_type(file.filename)
    if resource_type == "other":
        raise HTTPException(status_code=400, detail="不支持的文件类型")
    
    # 读取文件内容
    file.file.seek(0)
    file_content = file.file.read()
    file.file.seek(0)
    
    # 所有文件类型都上传到OSS（如果OSS已启用）
    oss_url = None
    if oss_client.enabled:
        try:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            unique_filename = f"{teacher_id}_{timestamp}_{file.filename}"
            oss_key = f"reference_materials/{resource_type}/{unique_filename}"
            # 确定MIME类型
            mime_type = None
            if resource_type in RESOURCE_TYPES:
                mime_types = RESOURCE_TYPES[resource_type].get("mime_types", [])
                if mime_types:
                    mime_type = mime_types[0]
            oss_url = oss_client.upload_file(file_content, oss_key, content_type=mime_type)
            import logging
            logging.info(f"文件已上传到OSS: {oss_key}, URL: {oss_url}")
        except Exception as e:
            import logging
            logging.error(f"上传到OSS失败: {e}，将保存到本地")
            oss_url = None
    
    # 如果OSS上传失败，保存到本地
    if not oss_url:
        # 生成唯一文件名
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        unique_filename = f"{teacher_id}_{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        # 保存文件
        file.file.seek(0)  # 重置文件指针
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path_str = str(file_path)
    else:
        # 使用OSS URL作为文件路径
        file_path_str = oss_url
    
    # 创建数据库记录
    material = ReferenceMaterial(
        teacher_id=teacher_id,
        folder_id=folder_id,
        resource_name=resource_name,
        original_filename=file.filename,
        file_path=file_path_str,
        file_size=file_size,
        resource_type=resource_type,
        knowledge_point=knowledge_point,
        is_active=True
    )
    
    db.add(material)
    await db.commit()
    await db.refresh(material)
    
    return {
        "message": "参考资料上传成功",
        "id": material.id,
        "resource_name": material.resource_name
    }

@router.post("/link")
async def create_link(
    teacher_id: int = Form(...),
    resource_name: str = Form(...),
    link_url: str = Form(...),
    knowledge_point: Optional[str] = Form(None),
    folder_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建链接类型的参考资料"""
    if not link_url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="链接必须以http://或https://开头")
    
    material = ReferenceMaterial(
        teacher_id=teacher_id,
        folder_id=folder_id,
        resource_name=resource_name,
        resource_type="link",
        link_url=link_url,
        knowledge_point=knowledge_point,
        is_active=True
    )
    
    db.add(material)
    await db.commit()
    await db.refresh(material)
    
    return {
        "message": "链接添加成功",
        "id": material.id,
        "resource_name": material.resource_name
    }

@router.put("/{material_id}")
async def update_material(
    material_id: int,
    resource_name: Optional[str] = Form(None),
    knowledge_point: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    teacher_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新参考资料信息"""
    result = await db.execute(
        select(ReferenceMaterial).where(
            and_(
                ReferenceMaterial.id == material_id,
                ReferenceMaterial.teacher_id == teacher_id,
                ReferenceMaterial.is_active == True
            )
        )
    )
    material = result.scalars().first()
    
    if not material:
        raise HTTPException(status_code=404, detail="参考资料不存在")
    
    if resource_name is not None:
        material.resource_name = resource_name
    if knowledge_point is not None:
        material.knowledge_point = knowledge_point
    if link_url is not None and material.resource_type == "link":
        if not link_url.startswith(('http://', 'https://')):
            raise HTTPException(status_code=400, detail="链接必须以http://或https://开头")
        material.link_url = link_url
    
    material.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "参考资料更新成功"}

@router.delete("/{material_id}")
async def delete_material(
    material_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除参考资料（逻辑删除）"""
    result = await db.execute(
        select(ReferenceMaterial).where(
            and_(
                ReferenceMaterial.id == material_id,
                ReferenceMaterial.teacher_id == teacher_id,
                ReferenceMaterial.is_active == True
            )
        )
    )
    material = result.scalars().first()
    
    if not material:
        raise HTTPException(status_code=404, detail="参考资料不存在")
    
    material.is_active = False
    material.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "参考资料删除成功"}

@router.get("/{material_id}/download")
async def download_material(
    material_id: int,
    db: AsyncSession = Depends(get_db),
):
    """下载参考资料（支持OSS和本地文件）"""
    result = await db.execute(
        select(ReferenceMaterial).where(
            ReferenceMaterial.id == material_id,
            ReferenceMaterial.is_active == True
        )
    )
    material = result.scalars().first()
    
    if not material:
        raise HTTPException(status_code=404, detail="参考资料不存在")
    
    if material.resource_type == "link" or material.resource_type == "hyperlink":
        raise HTTPException(status_code=400, detail="链接类型无法下载")
    
    # 如果是OSS文件，从OSS下载并返回
    if material.file_path.startswith('http://') or material.file_path.startswith('https://'):
        try:
            # 从OSS URL中提取key
            oss_key = None
            if '.aliyuncs.com/' in material.file_path:
                parts = material.file_path.split('.aliyuncs.com/')
                if len(parts) > 1:
                    oss_key = parts[1].split('?')[0]
            elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                if material.file_path.startswith(settings.OSS_ENDPOINT):
                    oss_key = material.file_path.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
            
            if oss_key and oss_client.enabled:
                # 从OSS下载文件
                import httpx
                async with httpx.AsyncClient() as client:
                    download_url = oss_client.generate_download_url(oss_key, expires=3600)
                    response = await client.get(download_url)
                    response.raise_for_status()
                    
                    # 确定 MIME 类型
                    mime_type = "application/octet-stream"
                    if material.resource_type in RESOURCE_TYPES:
                        mime_types = RESOURCE_TYPES[material.resource_type]["mime_types"]
                        if mime_types:
                            mime_type = mime_types[0]
                    
                    from fastapi.responses import Response
                    encoded_filename = quote(material.original_filename)
                    
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
            import logging
            logging.error(f"从OSS下载文件失败: {e}")
            raise HTTPException(status_code=500, detail=f"文件下载失败: {str(e)}")
    
    # 本地文件
    file_path = Path(material.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 确定 MIME 类型
    mime_type = "application/octet-stream"
    if material.resource_type in RESOURCE_TYPES:
        mime_types = RESOURCE_TYPES[material.resource_type]["mime_types"]
        if mime_types:
            mime_type = mime_types[0]
    
    # URL编码文件名以支持中文
    encoded_filename = quote(material.original_filename)
    
    return FileResponse(
        file_path,
        media_type=mime_type,
        headers={
            'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': '*',
        },
        filename=material.original_filename
    )

@router.get("/{material_id}/preview")
async def preview_material(
    material_id: int,
    request: Request,
    token: Optional[str] = Query(None, description="Authentication token (optional, for iframe/img/video tags)"),
    db: AsyncSession = Depends(get_db),
):
    """预览参考资料"""
    result = await db.execute(
        select(ReferenceMaterial).where(
            ReferenceMaterial.id == material_id,
            ReferenceMaterial.is_active == True
        )
    )
    material = result.scalars().first()
    
    if not material:
        raise HTTPException(status_code=404, detail="参考资料不存在")
    
    if material.resource_type == "link" or material.resource_type == "hyperlink":
        # 对于链接类型，返回重定向
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=material.link_url)
    
    resource_type = material.resource_type.lower()
    
    # Office文档（Word、Excel、PPT）使用前端JavaScript转换预览
    if resource_type in ['word', 'excel', 'ppt']:
        # 使用后端代理下载URL（避免CORS问题）
        if request:
            base_url = str(request.base_url).rstrip('/')
            proxy_download_url = f"{base_url}/api/v1/teacher/references/{material_id}/download"
        else:
            # 如果request不可用，使用默认URL
            proxy_download_url = f"/api/v1/teacher/references/{material_id}/download"
        
        import logging
        logging.info(f"使用后端代理下载URL用于前端转换预览")
        return {
            "preview_url": proxy_download_url,
            "download_url": proxy_download_url,
            "preview_type": "download",  # 标记为下载类型，前端使用转换方案
            "resource_type": resource_type,
            "file_name": material.original_filename
        }
    
    # 处理OSS URL（非Office文档，或Office文档但不在上面的处理逻辑中）
    if material.file_path.startswith('http://') or material.file_path.startswith('https://'):
        # OSS文件，生成带签名的下载URL
        try:
            # 从OSS URL中提取key
            oss_key = None
            
            # 尝试从标准OSS域名提取
            if '.aliyuncs.com/' in material.file_path:
                parts = material.file_path.split('.aliyuncs.com/')
                if len(parts) > 1:
                    oss_key = parts[1].split('?')[0]  # 移除查询参数
            # 尝试从自定义域名提取
            elif settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                if material.file_path.startswith(settings.OSS_ENDPOINT):
                    oss_key = material.file_path.replace(settings.OSS_ENDPOINT + '/', '').split('?')[0]
            
            if oss_key and oss_client.enabled:
                # 生成带签名的下载URL
                download_url = oss_client.generate_download_url(oss_key, expires=3600)
                return {
                    "preview_url": download_url,
                    "download_url": download_url,
                    "preview_type": "direct",  # 直接访问（图片、PDF、视频等）
                    "resource_type": resource_type,
                    "file_name": material.original_filename
                }
        except Exception as e:
            import logging
            logging.error(f"生成OSS下载URL失败: {e}")
        
        # 如果无法生成签名URL，直接返回原URL
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=str(material.file_path))
    
    # 本地文件预览（图片、PDF、视频等）
    file_path = Path(material.file_path)
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    
    # 确定 MIME 类型
    mime_type = "application/octet-stream"
    if material.resource_type in RESOURCE_TYPES:
        mime_types = RESOURCE_TYPES[material.resource_type]["mime_types"]
        if mime_types:
            mime_type = mime_types[0]
    
    # URL编码文件名以支持中文
    encoded_filename = quote(material.original_filename)
    
    # 对于某些类型，使用 inline 显示
    inline_types = ['image', 'pdf', 'video']
    
    if material.resource_type.lower() in inline_types:
        # 读取文件内容
        with open(file_path, 'rb') as f:
            content = f.read()
        
        return Response(
            content=content,
            media_type=mime_type,
            headers={
                'Content-Disposition': f'inline; filename*=UTF-8\'\'{encoded_filename}',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': '*',
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

