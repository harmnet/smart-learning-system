"""
阿里云IMM（智能媒体管理）服务模块
提供WebOffice文档在线预览和协作编辑功能
"""
import json
import logging
from typing import Optional, Dict, Any
from aliyunsdkcore.client import AcsClient
from aliyunsdkcore.request import CommonRequest
from app.core.config import settings

logger = logging.getLogger(__name__)


class IMMService:
    """阿里云IMM服务类"""
    
    def __init__(self):
        """初始化IMM服务"""
        # 创建AcsClient实例
        self.client = AcsClient(
            settings.OSS_ACCESS_KEY_ID,
            settings.OSS_ACCESS_KEY_SECRET,
            settings.OSS_REGION
        )
        # IMM项目名称（需要在阿里云控制台创建）
        self.project_name = getattr(settings, 'IMM_PROJECT_NAME', 'smartlearning-imm')
    
    def generate_weboffice_token(
        self,
        object_name: str,
        user_id: str,
        user_name: str = "用户",
        permission: str = "readonly",
        watermark: Optional[Dict[str, Any]] = None,
        expire_seconds: int = 3600
    ) -> Dict[str, Any]:
        """
        生成WebOffice在线预览凭证
        
        Args:
            object_name: OSS对象名称（文件路径），格式：oss://bucket/path/to/file
            user_id: 用户ID
            user_name: 用户显示名称
            permission: 权限类型，readonly（只读）或 readwrite（可编辑）
            watermark: 水印配置，格式：{"Type": 1, "Value": "水印文字"}
            expire_seconds: 凭证有效期（秒），默认3600秒（1小时）
        
        Returns:
            包含AccessToken和WebofficeURL的字典
        """
        try:
            # 构建OSS URI
            if not object_name.startswith('oss://'):
                oss_uri = f"oss://{settings.OSS_BUCKET_NAME}/{object_name}"
            else:
                oss_uri = object_name
            
            # 构建请求
            request = CommonRequest()
            request.set_accept_format('json')
            request.set_domain(f'imm.{settings.OSS_REGION}.aliyuncs.com')
            request.set_method('POST')
            request.set_protocol_type('https')
            request.set_version('2020-09-30')
            request.set_action_name('GenerateWebofficeToken')
            
            # 构建凭证配置
            credential_config = {
                "Policy": json.dumps({
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "oss:GetObject",
                                "oss:PutObject"
                            ],
                            "Resource": [
                                f"acs:oss:*:*:{settings.OSS_BUCKET_NAME}/*"
                            ]
                        }
                    ],
                    "Version": "1"
                })
            }
            
            # 只在配置了ServiceRole时才添加
            service_role = getattr(settings, 'IMM_SERVICE_ROLE', '')
            if service_role:
                credential_config["ServiceRole"] = service_role
            
            # 构建用户信息
            user_info = {
                "Id": str(user_id),
                "Name": user_name
            }
            
            # 构建权限配置
            permission_config = {
                "Readonly": permission == "readonly",
                "Print": True,
                "Copy": True,
                "Export": True if permission == "readonly" else False
            }
            
            # 添加查询参数 (RPC风格)
            request.add_query_param('ProjectName', self.project_name)
            request.add_query_param('SourceURI', oss_uri)  # SourceURI是顶级参数
            request.add_query_param('CredentialConfig', json.dumps(credential_config))
            request.add_query_param('User', json.dumps(user_info))
            request.add_query_param('Permission', json.dumps(permission_config))
            
            # 添加水印配置
            if watermark:
                request.add_query_param('Watermark', json.dumps(watermark))
            
            # 添加过期时间（可选）
            if expire_seconds:
                request.add_query_param('ExpiresSeconds', expire_seconds)
            
            # 发送请求
            response = self.client.do_action_with_exception(request)
            result = json.loads(response)
            
            return {
                "success": True,
                "access_token": result.get("AccessToken"),
                "weboffice_url": result.get("WebofficeURL"),
                "access_token_expired_time": result.get("AccessTokenExpiredTime"),
                "refresh_token": result.get("RefreshToken"),
                "refresh_token_expired_time": result.get("RefreshTokenExpiredTime")
            }
        
        except Exception as e:
            logger.error(f"生成WebOffice凭证失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def refresh_weboffice_token(
        self,
        refresh_token: str,
        access_token: str
    ) -> Dict[str, Any]:
        """
        刷新WebOffice凭证
        
        Args:
            refresh_token: 刷新令牌
            access_token: 访问令牌
        
        Returns:
            新的凭证信息
        """
        try:
            # 构建请求
            request = CommonRequest()
            request.set_accept_format('json')
            request.set_domain(f'imm.{settings.OSS_REGION}.aliyuncs.com')
            request.set_method('POST')
            request.set_protocol_type('https')
            request.set_version('2020-09-30')
            request.set_action_name('RefreshWebofficeToken')
            
            # 构建请求参数
            params = {
                "ProjectName": self.project_name,
                "AccessToken": access_token,
                "RefreshToken": refresh_token
            }
            
            request.set_content(json.dumps(params).encode('utf-8'))
            request.add_header('Content-Type', 'application/json')
            
            # 发送请求
            response = self.client.do_action_with_exception(request)
            result = json.loads(response)
            
            return {
                "success": True,
                "access_token": result.get("AccessToken"),
                "access_token_expired_time": result.get("AccessTokenExpiredTime"),
                "refresh_token": result.get("RefreshToken"),
                "refresh_token_expired_time": result.get("RefreshTokenExpiredTime")
            }
        
        except Exception as e:
            logger.error(f"刷新WebOffice凭证失败: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# 创建全局实例
try:
    imm_service = IMMService()
except Exception as e:
    logger.warning(f"IMM服务初始化失败: {str(e)}")
    imm_service = None
