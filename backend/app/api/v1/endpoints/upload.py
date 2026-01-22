"""
通用文件上传API
"""
from typing import Any, Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from pathlib import Path
import uuid
import logging
from datetime import datetime
from urllib.parse import urlparse

from app.db.session import get_db
from app.core.config import settings

# OSS客户端导入
try:
    from app.utils.oss_client import oss_client
except ImportError:
    oss_client = None

router = APIRouter()

# 支持在线预览的文件类型
PREVIEWABLE_EXTENSIONS = {
    'document': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
}

# 合并为一个集合
ALL_PREVIEWABLE_EXTENSIONS = set()
for exts in PREVIEWABLE_EXTENSIONS.values():
    ALL_PREVIEWABLE_EXTENSIONS.update(exts)

# 上传目录
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# 允许的文件类型
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'document': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    'video': ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
    'audio': ['.mp3', '.wav', '.flac', '.aac'],
    'archive': ['.zip', '.rar', '.7z', '.tar', '.gz'],
}

# 所有允许的扩展名
ALL_ALLOWED_EXTENSIONS = set()
for exts in ALLOWED_EXTENSIONS.values():
    ALL_ALLOWED_EXTENSIONS.update(exts)


@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form(default="general"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    通用文件上传接口
    - 支持上传到OSS（如果已配置）或本地存储
    - 返回文件URL和文件名
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="文件名不能为空")

    # 获取文件扩展名
    file_ext = Path(file.filename).suffix.lower()

    # 验证文件类型
    if file_ext not in ALL_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件类型: {file_ext}。支持的类型: {', '.join(sorted(ALL_ALLOWED_EXTENSIONS))}"
        )

    # 读取文件内容
    file_content = await file.read()
    file_size = len(file_content)

    # 限制文件大小 (100MB)
    max_size = 100 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"文件大小超过限制 (最大 {max_size // (1024*1024)} MB)")

    # 生成唯一文件名
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{file_ext}"

    # 创建文件夹
    folder_path = UPLOAD_DIR / folder
    folder_path.mkdir(parents=True, exist_ok=True)
    local_file_path = folder_path / filename

    # 保存到本地
    try:
        with open(local_file_path, 'wb') as f:
            f.write(file_content)
        logging.info(f"文件已保存到本地: {local_file_path}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")

    # 尝试上传到OSS
    file_url = None
    if oss_client and oss_client.enabled:
        try:
            oss_key = f"{folder}/{filename}"
            # 根据扩展名确定MIME类型
            mime_type = "application/octet-stream"
            if file_ext in ['.jpg', '.jpeg']:
                mime_type = "image/jpeg"
            elif file_ext == '.png':
                mime_type = "image/png"
            elif file_ext == '.gif':
                mime_type = "image/gif"
            elif file_ext == '.pdf':
                mime_type = "application/pdf"
            elif file_ext in ['.doc', '.docx']:
                mime_type = "application/msword"
            elif file_ext in ['.xls', '.xlsx']:
                mime_type = "application/vnd.ms-excel"
            elif file_ext in ['.ppt', '.pptx']:
                mime_type = "application/vnd.ms-powerpoint"
            elif file_ext == '.mp4':
                mime_type = "video/mp4"
            elif file_ext == '.mp3':
                mime_type = "audio/mpeg"

            file_url = oss_client.upload_file(file_content, oss_key, content_type=mime_type)
            logging.info(f"文件已上传到OSS: {oss_key}, URL: {file_url}")
        except Exception as e:
            error_msg = f"上传到OSS失败: {e}"
            logging.error(error_msg)
            # Write error to a file for debugging
            with open("upload_error.log", "a") as f:
                f.write(f"{datetime.now()}: {error_msg}\n")
            print(f"OSS UPLOAD ERROR: {e}") # Print to stdout/stderr
            file_url = None

    # 如果OSS上传失败，使用本地路径
    if not file_url:
        # 构建本地访问URL
        file_url = f"/uploads/{folder}/{filename}"

    # 检查是否可以预览
    can_preview = file_ext in ALL_PREVIEWABLE_EXTENSIONS
    preview_url = None

    if can_preview and oss_client and oss_client.enabled and file_url and file_url.startswith("http"):
        try:
            # 从URL中提取object_key
            oss_key = f"{folder}/{filename}"
            # 生成预览URL
            if file_ext in PREVIEWABLE_EXTENSIONS.get('document', []):
                # 文档类型使用WebOffice预览
                preview_url = oss_client.generate_weboffice_preview_url(oss_key, expires=7200)
            else:
                # 图片类型直接使用URL
                preview_url = file_url
        except Exception as e:
            logging.error(f"生成预览URL失败: {e}")
            preview_url = None

    return {
        "url": file_url,
        "filename": file.filename,
        "size": file_size,
        "type": file_ext[1:] if file_ext else "unknown",
        "can_preview": can_preview,
        "preview_url": preview_url,
    }


class PreviewRequest(BaseModel):
    """预览请求"""
    file_url: str
    watermark_text: Optional[str] = None


@router.post("/preview-url")
async def generate_preview_url(
    request: PreviewRequest,
) -> Any:
    """
    生成文件预览URL
    - 支持Office文档、PDF、图片等的在线预览
    - 文档类型使用阿里云WebOffice预览
    """
    file_url = request.file_url

    if not file_url:
        raise HTTPException(status_code=400, detail="文件URL不能为空")

    # 解析URL获取文件扩展名
    parsed = urlparse(file_url)
    path = parsed.path
    file_ext = Path(path).suffix.lower()

    if file_ext not in ALL_PREVIEWABLE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"该文件类型不支持预览: {file_ext}"
        )

    # 图片类型直接返回原URL
    if file_ext in PREVIEWABLE_EXTENSIONS.get('image', []):
        return {
            "preview_url": file_url,
            "preview_type": "image",
        }

    # 文档类型需要通过OSS WebOffice预览
    if not oss_client or not oss_client.enabled:
        raise HTTPException(
            status_code=500,
            detail="OSS服务未配置，无法生成预览URL"
        )

    # 从URL中提取object_key
    # URL格式: https://smarteduonline.cn/folder/filename.ext
    # 或: https://bucket.oss-region.aliyuncs.com/folder/filename.ext
    try:
        # 提取路径部分作为object_key
        object_key = path.lstrip('/')

        # 生成WebOffice预览URL
        preview_url = oss_client.generate_weboffice_preview_url(
            object_key,
            expires=7200,  # 2小时有效期
            allow_export=True,
            allow_print=True,
            watermark_text=request.watermark_text
        )

        return {
            "preview_url": preview_url,
            "preview_type": "weboffice",
            "expires_in": 7200,
        }
    except Exception as e:
        logging.error(f"生成预览URL失败: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"生成预览URL失败: {str(e)}"
        )


@router.get("/preview-url")
async def get_preview_url(
    file_url: str = Query(..., description="文件URL"),
    watermark: Optional[str] = Query(None, description="水印文字"),
) -> Any:
    """
    获取文件预览URL（GET方式）
    - 支持Office文档、PDF、图片等的在线预览
    """
    request = PreviewRequest(file_url=file_url, watermark_text=watermark)
    return await generate_preview_url(request)
