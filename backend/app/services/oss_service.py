"""
阿里云OSS服务模块
提供文件上传、删除、预览URL生成等功能
"""
import os
import oss2
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from oss2.credentials import EnvironmentVariableCredentialsProvider
from app.core.config import settings


class OSSService:
    """阿里云OSS服务类"""
    
    def __init__(self):
        """初始化OSS服务"""
        # 从环境变量获取访问凭证
        auth = oss2.ProviderAuthV4(EnvironmentVariableCredentialsProvider())
        
        # 确定endpoint
        if settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
            # 使用自定义域名
            endpoint = settings.OSS_ENDPOINT
        else:
            # 使用默认endpoint
            endpoint = f"https://oss-{settings.OSS_REGION}.aliyuncs.com"
        
        # 创建Bucket实例 (V4签名需要指定region)
        self.bucket = oss2.Bucket(
            auth,
            endpoint,
            settings.OSS_BUCKET_NAME,
            connect_timeout=30,
            region=settings.OSS_REGION  # V4签名必须指定region
        )
        
        # 配置CNAME
        if settings.OSS_USE_CNAME:
            self.bucket.enable_cname()
    
    def upload_file(
        self,
        file_content: bytes,
        object_name: str,
        content_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        上传文件到OSS
        
        Args:
            file_content: 文件内容（字节）
            object_name: OSS对象名称（文件路径）
            content_type: 文件MIME类型
        
        Returns:
            包含上传结果的字典
        """
        try:
            # 设置请求头
            headers = {}
            if content_type:
                headers['Content-Type'] = content_type
            
            # 上传文件
            result = self.bucket.put_object(
                object_name,
                file_content,
                headers=headers
            )
            
            # 生成文件URL
            if settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
                file_url = f"{settings.OSS_ENDPOINT}/{object_name}"
            else:
                file_url = f"https://{settings.OSS_BUCKET_NAME}.oss-{settings.OSS_REGION}.aliyuncs.com/{object_name}"
            
            return {
                "success": True,
                "object_name": object_name,
                "file_url": file_url,
                "etag": result.etag,
                "request_id": result.request_id
            }
        
        except oss2.exceptions.OssError as e:
            return {
                "success": False,
                "error": str(e),
                "error_code": e.code if hasattr(e, 'code') else None
            }
    
    def delete_file(self, object_name: str) -> Dict[str, Any]:
        """
        删除OSS文件
        
        Args:
            object_name: OSS对象名称（文件路径）
        
        Returns:
            包含删除结果的字典
        """
        try:
            result = self.bucket.delete_object(object_name)
            return {
                "success": True,
                "object_name": object_name,
                "request_id": result.request_id
            }
        except oss2.exceptions.OssError as e:
            return {
                "success": False,
                "error": str(e),
                "error_code": e.code if hasattr(e, 'code') else None
            }
    
    def generate_presigned_url(
        self,
        object_name: str,
        expire_seconds: int = 3600
    ) -> str:
        """
        生成预签名URL（用于私有文件访问）
        
        Args:
            object_name: OSS对象名称（文件路径）
            expire_seconds: URL有效期（秒），默认3600秒（1小时）
        
        Returns:
            预签名URL
        """
        try:
            url = self.bucket.sign_url(
                'GET',
                object_name,
                expire_seconds,
                slash_safe=True
            )
            return url
        except oss2.exceptions.OssError as e:
            raise Exception(f"生成预签名URL失败: {str(e)}")
    
    def generate_preview_url(
        self,
        object_name: str,
        expire_seconds: int = 3600,
        allow_export: bool = True,
        allow_print: bool = True,
        watermark_text: Optional[str] = None,
        watermark_size: int = 30,
        watermark_transparency: int = 60
    ) -> str:
        """
        生成WebOffice在线预览URL
        
        Args:
            object_name: OSS对象名称（文件路径）
            expire_seconds: URL有效期（秒），默认3600秒（1小时）
            allow_export: 是否允许导出
            allow_print: 是否允许打印
            watermark_text: 水印文字（可选）
            watermark_size: 水印字号，默认30
            watermark_transparency: 水印透明度（0-100），默认60
        
        Returns:
            预览URL
        """
        try:
            # 构建文档处理参数
            style_params = [
                "doc/preview",
                f"export_{1 if allow_export else 0}",
                f"print_{1 if allow_print else 0}"
            ]
            
            # 添加水印参数
            if watermark_text:
                # 将水印文字进行Base64编码（中文需要）
                import base64
                watermark_encoded = base64.b64encode(watermark_text.encode('utf-8')).decode('utf-8')
                watermark_params = f"watermark,text_{watermark_encoded},size_{watermark_size},t_{watermark_transparency}"
                style_params.append(watermark_params)
            
            style = ",".join(style_params)
            
            # 生成带处理参数的预签名URL
            params = {'x-oss-process': style}
            url = self.bucket.sign_url(
                'GET',
                object_name,
                expire_seconds,
                slash_safe=True,
                params=params
            )
            
            return url
        except oss2.exceptions.OssError as e:
            raise Exception(f"生成预览URL失败: {str(e)}")
    
    def file_exists(self, object_name: str) -> bool:
        """
        检查文件是否存在
        
        Args:
            object_name: OSS对象名称（文件路径）
        
        Returns:
            文件是否存在
        """
        try:
            self.bucket.get_object_meta(object_name)
            return True
        except oss2.exceptions.NoSuchKey:
            return False
        except oss2.exceptions.OssError:
            return False
    
    def get_file_info(self, object_name: str) -> Optional[Dict[str, Any]]:
        """
        获取文件信息
        
        Args:
            object_name: OSS对象名称（文件路径）
        
        Returns:
            文件信息字典，如果文件不存在则返回None
        """
        try:
            meta = self.bucket.get_object_meta(object_name)
            return {
                "object_name": object_name,
                "size": int(meta.headers.get('Content-Length', 0)),
                "content_type": meta.headers.get('Content-Type', ''),
                "etag": meta.headers.get('ETag', '').strip('"'),
                "last_modified": meta.headers.get('Last-Modified', '')
            }
        except oss2.exceptions.NoSuchKey:
            return None
        except oss2.exceptions.OssError as e:
            raise Exception(f"获取文件信息失败: {str(e)}")


# 创建全局OSS服务实例
try:
    oss_service = OSSService()
except Exception as e:
    print(f"警告: OSS服务初始化失败 - {str(e)}")
    print("请确保已正确配置环境变量 OSS_ACCESS_KEY_ID 和 OSS_ACCESS_KEY_SECRET")
    oss_service = None

