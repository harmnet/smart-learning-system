"""
阿里云OSS客户端工具类
用于文件上传和生成WebOffice预览URL
"""
import logging
import base64
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import quote
from app.core.config import settings

# 延迟导入oss2，避免未安装时导致导入错误
try:
    import oss2
    OSS2_AVAILABLE = True
except ImportError:
    OSS2_AVAILABLE = False
    oss2 = None

logger = logging.getLogger(__name__)

class OSSClient:
    """OSS客户端封装类"""
    
    def __init__(self):
        """初始化OSS客户端"""
        if not OSS2_AVAILABLE:
            logger.warning("oss2库未安装，OSS功能不可用。请运行: pip install oss2>=2.18.4")
            self.auth = None
            self.bucket = None
            self.enabled = False
            return
        
        if not settings.OSS_ACCESS_KEY_ID or not settings.OSS_ACCESS_KEY_SECRET:
            self.auth = None
            self.bucket = None
            self.enabled = False
            return
        
        try:
            # 创建认证对象
            self.auth = oss2.Auth(settings.OSS_ACCESS_KEY_ID, settings.OSS_ACCESS_KEY_SECRET)

            # 上传始终使用OSS原始endpoint
            endpoint = f"https://oss-{settings.OSS_REGION}.aliyuncs.com"
            self.bucket = oss2.Bucket(self.auth, endpoint, settings.OSS_BUCKET_NAME)

            # 根据配置决定是否使用CNAME
            self.use_cname = settings.OSS_USE_CNAME and bool(settings.OSS_ENDPOINT)
            self.cname_bucket = None

            self.enabled = True
        except Exception as e:
            logger.error(f"OSS客户端初始化失败: {e}")
            self.auth = None
            self.bucket = None
            self.enabled = False
    
    def upload_file(self, file_content: bytes, object_key: str, content_type: Optional[str] = None) -> str:
        """
        上传文件到OSS
        
        Args:
            file_content: 文件内容（字节）
            object_key: OSS对象键（文件路径）
            content_type: 文件MIME类型
        
        Returns:
            OSS对象URL（相对路径或完整URL）
        """
        if not self.enabled:
            raise Exception("OSS未配置，请设置OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET")
        
        # 上传文件
        headers = {}
        if content_type:
            headers['Content-Type'] = content_type
        
        self.bucket.put_object(object_key, file_content, headers=headers)
        
        # 返回文件URL
        if settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
            # 如果ENDPOINT是主域名(smarteduonline.cn)，返回相对路径以使用Next.js代理
            # 如果是OSS子域名(oss.smarteduonline.cn)，返回完整URL
            if 'oss.' in settings.OSS_ENDPOINT or 'cdn.' in settings.OSS_ENDPOINT:
                # OSS子域名或CDN，返回完整URL
                return f"{settings.OSS_ENDPOINT}/{object_key}"
            else:
                # 主域名，返回相对路径通过Next.js代理
                return f"/{object_key}"
        else:
            # 使用OSS默认域名
            return f"https://{settings.OSS_BUCKET_NAME}.oss-{settings.OSS_REGION}.aliyuncs.com/{object_key}"
    
    def generate_weboffice_preview_url(
        self, 
        object_key: str, 
        expires: int = 3600,
        allow_export: bool = True,
        allow_print: bool = True,
        watermark_text: Optional[str] = None
    ) -> str:
        """
        生成WebOffice在线预览URL
        
        Args:
            object_key: OSS对象键（文件路径）
            expires: URL过期时间（秒），默认3600秒（1小时）
            allow_export: 是否允许导出
            allow_print: 是否允许打印
            watermark_text: 水印文字（可选）
        
        Returns:
            带WebOffice预览参数的签名URL
        """
        if not self.enabled:
            raise Exception("OSS未配置，请设置OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET")
        
        # 构建处理参数
        # doc/preview 表示文档预览
        # export_1 表示允许导出，export_0 表示不允许
        # print_1 表示允许打印，print_0 表示不允许
        process_params = f"doc/preview,export_{1 if allow_export else 0},print_{1 if allow_print else 0}"
        
        # 如果设置了水印，添加水印参数
        # watermark,text_水印文字,size_字号,t_透明度
        # 注意：阿里云OSS要求水印文本必须是Base64编码
        if watermark_text:
            # Base64编码水印文字
            encoded_bytes = base64.b64encode(watermark_text.encode('utf-8'))
            encoded_text = encoded_bytes.decode('utf-8')
            process_params += f"/watermark,text_{encoded_text},size_30,t_60"
        
        # 生成签名URL
        # oss2 2.18.4+版本支持V4签名，sign_url方法会自动使用V4签名
        try:
            # 使用标准bucket签名（OSS直接访问）
            # slash_safe=True 确保路径中的斜杠不被编码，以便Next.js代理正确匹配
            url = self.bucket.sign_url('GET', object_key, expires, slash_safe=True, params={'x-oss-process': process_params})
            
            # 如果配置了CNAME且是主域名，需要通过Next.js代理
            # 将OSS标准域名替换为主域名
            if self.use_cname and settings.OSS_ENDPOINT:
                if 'oss.' not in settings.OSS_ENDPOINT and 'cdn.' not in settings.OSS_ENDPOINT:
                    # 主域名，返回完整URL但带OSS签名参数
                    # 前端会通过Next.js代理转发到OSS
                    standard_domain = f"https://{settings.OSS_BUCKET_NAME}.oss-{settings.OSS_REGION}.aliyuncs.com"
                    if standard_domain in url:
                        url = url.replace(standard_domain, settings.OSS_ENDPOINT)
                
            return url
        except Exception as e:
            logger.error(f"生成OSS签名URL失败: {e}")
            raise Exception(f"生成OSS预览URL失败: {str(e)}")
    
    def delete_file(self, object_key: str) -> bool:
        """
        删除OSS文件
        
        Args:
            object_key: OSS对象键（文件路径）
        
        Returns:
            是否删除成功
        """
        if not self.enabled:
            return False
        
        try:
            self.bucket.delete_object(object_key)
            return True
        except Exception as e:
            print(f"删除OSS文件失败: {e}")
            return False
    
    def file_exists(self, object_key: str) -> bool:
        """
        检查文件是否存在
        
        Args:
            object_key: OSS对象键（文件路径）
        
        Returns:
            文件是否存在
        """
        if not self.enabled:
            return False
        
        try:
            return self.bucket.object_exists(object_key)
        except Exception:
            return False
    
    def generate_download_url(self, object_key: str, expires: int = 3600) -> str:
        """
        生成文件下载URL（带签名，用于前端转换预览的备用方案）
        
        Args:
            object_key: OSS对象键（文件路径）
            expires: URL过期时间（秒），默认3600秒（1小时）
        
        Returns:
            带签名的下载URL
        """
        if not self.enabled:
            raise Exception("OSS未配置，请设置OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET")
        
        try:
            # 生成签名URL用于下载
            url = self.bucket.sign_url('GET', object_key, expires)
            return url
        except Exception as e:
            logger.error(f"生成OSS下载URL失败: {e}")
            raise Exception(f"生成OSS下载URL失败: {str(e)}")

# 创建全局OSS客户端实例
oss_client = OSSClient()

