from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
import os
import uuid
from pathlib import Path
from datetime import datetime
import logging
import httpx

from app.db.session import get_db
from app.models.base import CourseCover
from app.utils.oss_client import oss_client
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# 配置
UPLOAD_DIR = Path("uploads/covers")
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# 确保上传目录存在（作为OSS不可用时的回退方案）
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def is_oss_url(url: str) -> bool:
    """判断是否为OSS URL"""
    return url.startswith("http://") or url.startswith("https://")

class CoverImageResponse(BaseModel):
    id: int
    filename: str
    image_url: str
    file_size: Optional[int] = None
    created_at: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[CoverImageResponse])
async def get_all_images(
    skip: int = 0,
    limit: int = 100,
    include_used: bool = True,  # 是否包含已使用的封面，默认为True
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取所有图片列表"""
    query = select(CourseCover)
    
    # 如果不包含已使用的封面，只查询course_id为None的
    if not include_used:
        query = query.where(CourseCover.course_id.is_(None))
    
    query = query.order_by(CourseCover.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    covers = result.scalars().all()
    
    print(f"📷 查询到 {len(covers)} 个封面 (include_used={include_used})")
    
    images = []
    for cover in covers:
        # 判断文件是否在OSS
        if is_oss_url(cover.filename):
            # OSS文件，直接使用OSS URL
            image_url = cover.filename
        else:
            # 本地文件
            image_url = f"/api/v1/course-covers/{cover.id}/image"
        
        # 优先使用数据库中的file_size，如果没有则尝试从文件系统获取（仅本地文件）
        file_size = cover.file_size
        if not file_size and not is_oss_url(cover.filename):
            file_path = UPLOAD_DIR / cover.filename
            if file_path.exists():
                file_size = file_path.stat().st_size
        
        images.append({
            "id": cover.id,
            "filename": cover.filename,
            "image_url": image_url,
            "file_size": file_size,
            "created_at": cover.created_at.isoformat() if cover.created_at else None
        })
    
    return images

@router.get("/count")
async def get_image_count(
    include_used: bool = True,  # 是否包含已使用的封面，默认为True
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取图片总数"""
    query = select(func.count(CourseCover.id))
    
    # 如果不包含已使用的封面，只统计course_id为None的
    if not include_used:
        query = query.where(CourseCover.course_id.is_(None))
    
    result = await db.execute(query)
    count = result.scalar() or 0
    return {"total": count}

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """上传图片到OSS或本地存储"""
    # 检查文件扩展名
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 读取文件内容并检查大小
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of 2MB. Current size: {file_size / 1024 / 1024:.2f}MB"
        )
    
    # 生成唯一文件名
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"
    
    # 确定文件MIME类型
    content_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png"
    }
    content_type = content_type_map.get(file_ext, "image/jpeg")
    
    # 优先上传到OSS
    oss_url = None
    if oss_client.enabled:
        try:
            oss_key = f"course_covers/{filename}"
            oss_url = oss_client.upload_file(file_content, oss_key, content_type=content_type)
            logger.info(f"封面已上传到OSS: {oss_key}, URL: {oss_url}")
        except Exception as e:
            logger.error(f"上传到OSS失败: {e}，将保存到本地")
            oss_url = None
    
    # 如果OSS上传失败或未启用，保存到本地
    if not oss_url:
        file_path = UPLOAD_DIR / filename
        try:
            with open(file_path, "wb") as f:
                f.write(file_content)
            logger.info(f"封面已保存到本地: {file_path}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        # 使用本地文件名
        stored_filename = filename
    else:
        # 使用OSS URL
        stored_filename = oss_url
    
    # 获取当前最大的 sort_order（用于排序）
    max_order_result = await db.execute(
        select(func.max(CourseCover.sort_order)).where(CourseCover.course_id.is_(None))
    )
    max_order = max_order_result.scalar() or 0
    
    # 创建图片记录（course_id为NULL表示独立图片）
    cover = CourseCover(
        course_id=None,  # 独立图片，不关联课程
        filename=stored_filename,  # 存储OSS URL或本地文件名
        file_size=file_size,  # 保存文件大小
        sort_order=max_order + 1
    )
    db.add(cover)
    await db.commit()
    await db.refresh(cover)
    
    # 返回图片URL
    if oss_url:
        image_url = oss_url
    else:
        image_url = f"/api/v1/course-covers/{cover.id}/image"
    
    return {
        "message": "Image uploaded successfully",
        "id": cover.id,
        "filename": stored_filename,
        "image_url": image_url
    }

@router.delete("/{image_id}")
async def delete_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除图片（OSS或本地）"""
    result = await db.execute(
        select(CourseCover).where(
            CourseCover.id == image_id,
            CourseCover.course_id.is_(None)  # 只删除独立图片
        )
    )
    cover = result.scalars().first()
    
    if not cover:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # 删除文件
    if is_oss_url(cover.filename):
        # OSS文件，从OSS URL中提取key
        try:
            # 从OSS URL中提取object key
            # 例如: https://ezijingai.oss-cn-hangzhou.aliyuncs.com/course_covers/xxx.jpg
            if oss_client.enabled:
                # 提取key部分
                if settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                    # 自定义域名格式
                    key = cover.filename.replace(f"{settings.OSS_ENDPOINT}/", "")
                else:
                    # OSS默认域名格式
                    key = cover.filename.split(f"{settings.OSS_BUCKET_NAME}.oss-{settings.OSS_REGION}.aliyuncs.com/")[-1]
                
                oss_client.delete_file(key)
                logger.info(f"已从OSS删除封面: {key}")
        except Exception as e:
            logger.error(f"删除OSS文件失败: {e}")
    else:
        # 本地文件
        file_path = UPLOAD_DIR / cover.filename
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"已从本地删除封面: {file_path}")
            except Exception as e:
                logger.error(f"删除本地文件失败: {e}")
    
    # 删除数据库记录
    await db.delete(cover)
    await db.commit()
    
    return {"message": "Image deleted successfully"}

@router.put("/{image_id}")
async def update_image(
    image_id: int,
    update_data: dict,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新图片信息（重命名等）"""
    result = await db.execute(
        select(CourseCover).where(
            CourseCover.id == image_id,
            CourseCover.course_id.is_(None)  # 只更新独立图片
        )
    )
    cover = result.scalars().first()
    
    if not cover:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # 更新文件名（如果提供）
    if "filename" in update_data:
        # 如果是OSS URL，只更新显示名称部分（这里简化处理，实际可能需要更复杂的逻辑）
        # 对于本地文件，可以重命名
        if not is_oss_url(cover.filename):
            # 本地文件可以重命名
            old_path = UPLOAD_DIR / cover.filename
            new_filename = update_data["filename"]
            new_path = UPLOAD_DIR / new_filename
            if old_path.exists():
                try:
                    old_path.rename(new_path)
                    cover.filename = new_filename
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to rename file: {str(e)}")
        # OSS文件暂不支持重命名（需要重新上传）
    
    await db.commit()
    await db.refresh(cover)
    
    # 返回更新后的图片信息
    if is_oss_url(cover.filename):
        image_url = cover.filename
    else:
        image_url = f"/api/v1/course-covers/{cover.id}/image"
    
    return {
        "id": cover.id,
        "filename": cover.filename,
        "image_url": image_url,
        "file_size": cover.file_size,
        "created_at": cover.created_at.isoformat() if cover.created_at else None
    }

@router.post("/{image_id}/replace")
async def replace_image(
    image_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """替换图片（保持ID不变）"""
    result = await db.execute(
        select(CourseCover).where(
            CourseCover.id == image_id,
            CourseCover.course_id.is_(None)  # 只替换独立图片
        )
    )
    cover = result.scalars().first()
    
    if not cover:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # 检查文件扩展名
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # 读取文件内容并检查大小
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of 2MB. Current size: {file_size / 1024 / 1024:.2f}MB"
        )
    
    # 确定文件MIME类型
    content_type_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png"
    }
    content_type = content_type_map.get(file_ext, "image/jpeg")
    
    # 删除旧文件
    if is_oss_url(cover.filename):
        # OSS文件，从OSS删除
        try:
            if oss_client.enabled:
                if settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                    key = cover.filename.replace(f"{settings.OSS_ENDPOINT}/", "")
                else:
                    key = cover.filename.split(f"{settings.OSS_BUCKET_NAME}.oss-{settings.OSS_REGION}.aliyuncs.com/")[-1]
                oss_client.delete_file(key)
                logger.info(f"已从OSS删除旧封面: {key}")
        except Exception as e:
            logger.error(f"删除OSS旧文件失败: {e}")
    else:
        # 本地文件，从本地删除
        old_path = UPLOAD_DIR / cover.filename
        if old_path.exists():
            try:
                old_path.unlink()
                logger.info(f"已从本地删除旧封面: {old_path}")
            except Exception as e:
                logger.error(f"删除本地旧文件失败: {e}")
    
    # 生成新文件名（保持原有格式）
    if is_oss_url(cover.filename):
        # OSS文件，生成新的UUID文件名
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_ext}"
    else:
        # 本地文件，保持原文件名或生成新文件名
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{file_ext}"
    
    # 上传新文件
    oss_url = None
    if oss_client.enabled:
        try:
            oss_key = f"course_covers/{filename}"
            oss_url = oss_client.upload_file(file_content, oss_key, content_type=content_type)
            logger.info(f"新封面已上传到OSS: {oss_key}, URL: {oss_url}")
        except Exception as e:
            logger.error(f"上传到OSS失败: {e}，将保存到本地")
            oss_url = None
    
    # 如果OSS上传失败或未启用，保存到本地
    if not oss_url:
        file_path = UPLOAD_DIR / filename
        try:
            with open(file_path, "wb") as f:
                f.write(file_content)
            logger.info(f"新封面已保存到本地: {file_path}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        stored_filename = filename
    else:
        stored_filename = oss_url
    
    # 更新数据库记录
    cover.filename = stored_filename
    cover.file_size = file_size
    await db.commit()
    await db.refresh(cover)
    
    # 返回图片URL
    if oss_url:
        image_url = oss_url
    else:
        image_url = f"/api/v1/course-covers/{cover.id}/image"
    
    return {
        "message": "Image replaced successfully",
        "id": cover.id,
        "filename": stored_filename,
        "image_url": image_url,
        "file_size": file_size
    }

@router.get("/{image_id}/image")
async def get_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取图片文件（OSS或本地）"""
    # 移除course_id限制，允许获取所有封面（包括已关联到课程的）
    result = await db.execute(
        select(CourseCover).where(
            CourseCover.id == image_id
        )
    )
    cover = result.scalars().first()
    
    if not cover:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # 如果是OSS URL，代理返回图片内容（避免CORS问题）
    if is_oss_url(cover.filename):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(cover.filename, timeout=10.0)
                if response.status_code == 200:
                    # 根据文件扩展名确定媒体类型
                    filename_lower = cover.filename.lower()
                    if filename_lower.endswith((".jpg", ".jpeg")):
                        media_type = "image/jpeg"
                    elif filename_lower.endswith(".png"):
                        media_type = "image/png"
                    elif filename_lower.endswith(".gif"):
                        media_type = "image/gif"
                    elif filename_lower.endswith(".webp"):
                        media_type = "image/webp"
                    else:
                        media_type = "image/jpeg"  # 默认
                    
                    return Response(
                        content=response.content,
                        media_type=media_type,
                        headers={
                            "Cache-Control": "public, max-age=31536000",  # 缓存1年
                        }
                    )
                else:
                    raise HTTPException(status_code=404, detail="Failed to fetch image from OSS")
        except Exception as e:
            logger.error(f"Failed to fetch image from OSS: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch image from OSS")
    
    # 本地文件
    file_path = UPLOAD_DIR / cover.filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image file not found")
    
    # 根据文件扩展名确定媒体类型
    filename_lower = cover.filename.lower()
    if filename_lower.endswith((".jpg", ".jpeg")):
        media_type = "image/jpeg"
    elif filename_lower.endswith(".png"):
        media_type = "image/png"
    elif filename_lower.endswith(".gif"):
        media_type = "image/gif"
    elif filename_lower.endswith(".webp"):
        media_type = "image/webp"
    else:
        media_type = "image/jpeg"  # 默认
    
    return FileResponse(
        file_path,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000",  # 缓存1年
        }
    )
