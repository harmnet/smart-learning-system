"""
banana-slides PPT服务代理层
"""
import httpx
import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class PPTService:
    """banana-slides PPT服务代理"""
    
    def __init__(self):
        self.base_url = settings.BANANA_SLIDES_API_URL
        self.frontend_url = settings.BANANA_SLIDES_FRONTEND_URL
        self.timeout = 300.0  # PPT生成可能较慢，设置5分钟超时
    
    async def create_project(
        self,
        title: str,
        outline: Optional[str] = None,
        reference_content: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        创建PPT项目
        
        Args:
            title: 项目标题
            outline: 大纲内容（Markdown格式）
            reference_content: 参考资料内容
            custom_prompt: 用户自定义提示词
            
        Returns:
            包含project_id的字典
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                # 构建请求数据
                payload = {
                    "title": title,
                    "description": outline or "",
                }
                
                # 如果有参考内容，添加到描述中
                if reference_content:
                    payload["description"] += f"\n\n参考资料：\n{reference_content}"
                
                # 如果有自定义提示词，也添加进去
                if custom_prompt:
                    payload["description"] += f"\n\n额外要求：\n{custom_prompt}"
                
                logger.info(f"创建PPT项目: {title}")
                response = await client.post(
                    f"{self.base_url}/api/projects",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                project_id = result.get("id") or result.get("project_id")
                logger.info(f"PPT项目创建成功: {project_id}")
                
                return {
                    "success": True,
                    "project_id": project_id,
                    "data": result
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"创建PPT项目失败: HTTP {e.response.status_code} - {e.response.text}")
                raise Exception(f"创建PPT项目失败: HTTP {e.response.status_code}")
            except httpx.TimeoutException:
                logger.error("创建PPT项目超时")
                raise Exception("创建PPT项目超时，请稍后重试")
            except Exception as e:
                logger.error(f"创建PPT项目异常: {str(e)}")
                raise Exception(f"创建PPT项目失败: {str(e)}")
    
    async def generate_slides(
        self,
        project_id: str,
        outline: str,
        custom_prompt: str = ""
    ) -> Dict[str, Any]:
        """
        生成幻灯片页面
        
        Args:
            project_id: 项目ID
            outline: 大纲内容
            custom_prompt: 自定义提示词
            
        Returns:
            生成结果
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                payload = {
                    "outline": outline,
                    "custom_prompt": custom_prompt
                }
                
                logger.info(f"生成幻灯片: project_id={project_id}")
                response = await client.post(
                    f"{self.base_url}/api/projects/{project_id}/generate",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"幻灯片生成成功: project_id={project_id}")
                return {
                    "success": True,
                    "data": result
                }
            except Exception as e:
                logger.error(f"生成幻灯片失败: {str(e)}")
                raise Exception(f"生成幻灯片失败: {str(e)}")
    
    async def get_project_status(self, project_id: str) -> Dict[str, Any]:
        """
        获取项目状态
        
        Args:
            project_id: 项目ID
            
        Returns:
            项目状态信息
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                logger.info(f"获取项目状态: project_id={project_id}")
                response = await client.get(
                    f"{self.base_url}/api/projects/{project_id}"
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "data": result
                }
            except Exception as e:
                logger.error(f"获取项目状态失败: {str(e)}")
                raise Exception(f"获取项目状态失败: {str(e)}")
    
    async def export_pptx(self, project_id: str) -> bytes:
        """
        导出PPTX文件
        
        Args:
            project_id: 项目ID
            
        Returns:
            PPTX文件的字节数据
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                logger.info(f"导出PPTX: project_id={project_id}")
                response = await client.get(
                    f"{self.base_url}/api/projects/{project_id}/export/pptx"
                )
                response.raise_for_status()
                
                logger.info(f"PPTX导出成功: project_id={project_id}, size={len(response.content)} bytes")
                return response.content
            except httpx.HTTPStatusError as e:
                logger.error(f"导出PPTX失败: HTTP {e.response.status_code} - {e.response.text}")
                raise Exception(f"导出PPTX失败: HTTP {e.response.status_code}")
            except Exception as e:
                logger.error(f"导出PPTX异常: {str(e)}")
                raise Exception(f"导出PPTX失败: {str(e)}")
    
    async def update_slide(
        self,
        project_id: str,
        slide_id: str,
        description: str
    ) -> Dict[str, Any]:
        """
        更新单页描述
        
        Args:
            project_id: 项目ID
            slide_id: 幻灯片ID
            description: 新的描述
            
        Returns:
            更新结果
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                payload = {"description": description}
                
                logger.info(f"更新幻灯片: project_id={project_id}, slide_id={slide_id}")
                response = await client.put(
                    f"{self.base_url}/api/projects/{project_id}/slides/{slide_id}",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "data": result
                }
            except Exception as e:
                logger.error(f"更新幻灯片失败: {str(e)}")
                raise Exception(f"更新幻灯片失败: {str(e)}")
    
    def get_preview_url(self, project_id: str) -> str:
        """
        获取PPT预览页面的URL
        
        Args:
            project_id: 项目ID
            
        Returns:
            预览页面URL
        """
        return f"{self.frontend_url}/preview/{project_id}"


# 创建全局实例
ppt_service = PPTService()

