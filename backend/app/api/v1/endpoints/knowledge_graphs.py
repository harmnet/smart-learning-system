from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from pydantic import BaseModel
from datetime import datetime
import httpx
import json
import logging
from pathlib import Path

from app.db.session import get_db
from app.models.base import User
from app.models.knowledge_graph import KnowledgeGraph, KnowledgeNode
from app.models.llm_config import LLMConfig
from app.models.teaching_resource import TeachingResource
from app.utils.pdf_extractor import pdf_extractor
from app.utils.llm_call_logger import log_llm_call

logger = logging.getLogger(__name__)

router = APIRouter()

class GraphCreate(BaseModel):
    graph_name: str
    description: Optional[str] = None

class GraphUpdate(BaseModel):
    graph_name: Optional[str] = None
    description: Optional[str] = None

class NodeCreate(BaseModel):
    node_name: str
    node_content: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = 0

class NodeUpdate(BaseModel):
    node_name: Optional[str] = None
    node_content: Optional[str] = None
    parent_id: Optional[int] = None
    sort_order: Optional[int] = None

def build_tree(nodes: List[KnowledgeNode], resource_counts: Dict[str, int] = None) -> List[Dict]:
    """构建树状结构，包含资源数量统计"""
    if resource_counts is None:
        resource_counts = {}
    
    # 创建节点字典
    node_dict = {node.id: {
        "id": node.id,
        "node_name": node.node_name,
        "node_content": node.node_content,
        "parent_id": node.parent_id,
        "sort_order": node.sort_order,
        "resource_count": resource_counts.get(node.node_name, 0),
        "children": []
    } for node in nodes}
    
    # 构建树
    root_nodes = []
    for node in nodes:
        node_data = node_dict[node.id]
        if node.parent_id is None:
            root_nodes.append(node_data)
        else:
            if node.parent_id in node_dict:
                node_dict[node.parent_id]["children"].append(node_data)
    
    # 递归计算每个节点及其子节点的资源总数
    def calculate_total_resources(node):
        total = node["resource_count"]
        for child in node["children"]:
            total += calculate_total_resources(child)
        node["total_resource_count"] = total
        return total
    
    # 排序
    def sort_nodes(nodes_list):
        nodes_list.sort(key=lambda x: x["sort_order"])
        for node in nodes_list:
            if node["children"]:
                sort_nodes(node["children"])
    
    sort_nodes(root_nodes)
    
    # 计算资源总数
    for node in root_nodes:
        calculate_total_resources(node)
    
    return root_nodes

@router.get("/")
async def get_graphs(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> List[Any]:
    """获取知识图谱列表"""
    result = await db.execute(
        select(KnowledgeGraph).where(
            and_(
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeGraph.is_active == True
            )
        ).order_by(KnowledgeGraph.created_at.desc())
    )
    graphs = result.scalars().all()
    
    graph_list = []
    for graph in graphs:
        # 统计节点数量
        node_count_result = await db.execute(
            select(func.count(KnowledgeNode.id)).where(
                and_(
                    KnowledgeNode.graph_id == graph.id,
                    KnowledgeNode.is_active == True
                )
            )
        )
        node_count = node_count_result.scalar() or 0
        
        graph_list.append({
            "id": graph.id,
            "teacher_id": graph.teacher_id,
            "graph_name": graph.graph_name,
            "description": graph.description,
            "node_count": node_count,
            "is_active": graph.is_active,
            "created_at": graph.created_at.isoformat() if graph.created_at else None,
            "updated_at": graph.updated_at.isoformat() if graph.updated_at else None,
        })
    
    return graph_list

@router.post("/")
async def create_graph(
    graph_data: GraphCreate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建知识图谱"""
    graph = KnowledgeGraph(
        teacher_id=teacher_id,
        graph_name=graph_data.graph_name,
        description=graph_data.description,
        is_active=True
    )
    
    db.add(graph)
    await db.commit()
    await db.refresh(graph)
    
    return {
        "message": "知识图谱创建成功",
        "id": graph.id,
        "graph_name": graph.graph_name
    }

@router.put("/{graph_id}")
async def update_graph(
    graph_id: int,
    graph_data: GraphUpdate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新知识图谱"""
    result = await db.execute(
        select(KnowledgeGraph).where(
            and_(
                KnowledgeGraph.id == graph_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeGraph.is_active == True
            )
        )
    )
    graph = result.scalars().first()
    
    if not graph:
        raise HTTPException(status_code=404, detail="知识图谱不存在")
    
    if graph_data.graph_name is not None:
        graph.graph_name = graph_data.graph_name
    if graph_data.description is not None:
        graph.description = graph_data.description
    
    graph.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "知识图谱更新成功"}

@router.delete("/{graph_id}")
async def delete_graph(
    graph_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除知识图谱（逻辑删除）"""
    result = await db.execute(
        select(KnowledgeGraph).where(
            and_(
                KnowledgeGraph.id == graph_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeGraph.is_active == True
            )
        )
    )
    graph = result.scalars().first()
    
    if not graph:
        raise HTTPException(status_code=404, detail="知识图谱不存在")
    
    graph.is_active = False
    graph.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "知识图谱删除成功"}

@router.get("/{graph_id}/tree")
async def get_graph_tree(
    graph_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取知识图谱的树状结构"""
    # 验证图谱所有权
    graph_result = await db.execute(
        select(KnowledgeGraph).where(
            and_(
                KnowledgeGraph.id == graph_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeGraph.is_active == True
            )
        )
    )
    graph = graph_result.scalars().first()
    
    if not graph:
        raise HTTPException(status_code=404, detail="知识图谱不存在")
    
    # 获取所有节点
    nodes_result = await db.execute(
        select(KnowledgeNode).where(
            and_(
                KnowledgeNode.graph_id == graph_id,
                KnowledgeNode.is_active == True
            )
        ).order_by(KnowledgeNode.sort_order)
    )
    nodes = nodes_result.scalars().all()
    
    # 查询每个知识点的资源数量
    resource_counts = {}
    resources_result = await db.execute(
        select(
            TeachingResource.knowledge_point,
            func.count(TeachingResource.id).label('count')
        ).where(
            and_(
                TeachingResource.teacher_id == teacher_id,
                TeachingResource.is_active == True,
                TeachingResource.knowledge_point.isnot(None)
            )
        ).group_by(TeachingResource.knowledge_point)
    )
    for row in resources_result:
        resource_counts[row.knowledge_point] = row.count
    
    # 构建树状结构
    tree = build_tree(nodes, resource_counts)
    
    return {
        "graph_id": graph.id,
        "graph_name": graph.graph_name,
        "description": graph.description,
        "tree": tree
    }

@router.post("/{graph_id}/nodes")
async def create_node(
    graph_id: int,
    node_data: NodeCreate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建知识节点"""
    # 验证图谱所有权
    graph_result = await db.execute(
        select(KnowledgeGraph).where(
            and_(
                KnowledgeGraph.id == graph_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeGraph.is_active == True
            )
        )
    )
    graph = graph_result.scalars().first()
    
    if not graph:
        raise HTTPException(status_code=404, detail="知识图谱不存在")
    
    # 验证父节点（如果指定）
    if node_data.parent_id:
        parent_result = await db.execute(
            select(KnowledgeNode).where(
                and_(
                    KnowledgeNode.id == node_data.parent_id,
                    KnowledgeNode.graph_id == graph_id,
                    KnowledgeNode.is_active == True
                )
            )
        )
        if not parent_result.scalars().first():
            raise HTTPException(status_code=404, detail="父节点不存在")
    
    node = KnowledgeNode(
        graph_id=graph_id,
        parent_id=node_data.parent_id,
        node_name=node_data.node_name,
        node_content=node_data.node_content,
        sort_order=node_data.sort_order or 0,
        is_active=True
    )
    
    db.add(node)
    await db.commit()
    await db.refresh(node)
    
    return {
        "message": "节点创建成功",
        "id": node.id,
        "node_name": node.node_name
    }

@router.put("/nodes/{node_id}")
async def update_node(
    node_id: int,
    node_data: NodeUpdate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新知识节点"""
    result = await db.execute(
        select(KnowledgeNode).join(KnowledgeGraph).where(
            and_(
                KnowledgeNode.id == node_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeNode.is_active == True,
                KnowledgeGraph.is_active == True
            )
        )
    )
    node = result.scalars().first()
    
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 验证父节点（如果指定）
    if node_data.parent_id is not None:
        if node_data.parent_id == node_id:
            raise HTTPException(status_code=400, detail="不能将节点设置为其自身的子节点")
        
        if node_data.parent_id:
            parent_result = await db.execute(
                select(KnowledgeNode).where(
                    and_(
                        KnowledgeNode.id == node_data.parent_id,
                        KnowledgeNode.graph_id == node.graph_id,
                        KnowledgeNode.is_active == True
                    )
                )
            )
            if not parent_result.scalars().first():
                raise HTTPException(status_code=404, detail="父节点不存在")
        
        # 检查是否形成循环引用
        current_parent_id = node_data.parent_id
        while current_parent_id:
            if current_parent_id == node_id:
                raise HTTPException(status_code=400, detail="不能形成循环引用")
            parent_check = await db.execute(
                select(KnowledgeNode.parent_id).where(KnowledgeNode.id == current_parent_id)
            )
            current_parent_id = parent_check.scalar()
    
    if node_data.node_name is not None:
        node.node_name = node_data.node_name
    if node_data.node_content is not None:
        node.node_content = node_data.node_content
    if node_data.parent_id is not None:
        node.parent_id = node_data.parent_id
    if node_data.sort_order is not None:
        node.sort_order = node_data.sort_order
    
    node.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "节点更新成功"}

@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除知识节点（逻辑删除）"""
    result = await db.execute(
        select(KnowledgeNode).join(KnowledgeGraph).where(
            and_(
                KnowledgeNode.id == node_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeNode.is_active == True,
                KnowledgeGraph.is_active == True
            )
        )
    )
    node = result.scalars().first()
    
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 检查是否有子节点
    children_result = await db.execute(
        select(func.count(KnowledgeNode.id)).where(
            and_(
                KnowledgeNode.parent_id == node_id,
                KnowledgeNode.is_active == True
            )
        )
    )
    children_count = children_result.scalar() or 0
    
    if children_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"无法删除节点：该节点下还有 {children_count} 个子节点"
        )
    
    node.is_active = False
    node.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "节点删除成功"}

@router.post("/nodes/{node_id}/move")
async def move_node(
    node_id: int,
    target_parent_id: Optional[int],
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """移动节点到另一个父节点"""
    result = await db.execute(
        select(KnowledgeNode).join(KnowledgeGraph).where(
            and_(
                KnowledgeNode.id == node_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeNode.is_active == True,
                KnowledgeGraph.is_active == True
            )
        )
    )
    node = result.scalars().first()
    
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 验证目标父节点
    if target_parent_id:
        if target_parent_id == node_id:
            raise HTTPException(status_code=400, detail="不能将节点移动到自身")
        
        target_result = await db.execute(
            select(KnowledgeNode).where(
                and_(
                    KnowledgeNode.id == target_parent_id,
                    KnowledgeNode.graph_id == node.graph_id,
                    KnowledgeNode.is_active == True
                )
            )
        )
        target_node = target_result.scalars().first()
        if not target_node:
            raise HTTPException(status_code=404, detail="目标父节点不存在")
        
        # 检查是否形成循环引用
        current_parent_id = target_parent_id
        while current_parent_id:
            if current_parent_id == node_id:
                raise HTTPException(status_code=400, detail="不能将节点移动到其子节点下")
            parent_check = await db.execute(
                select(KnowledgeNode.parent_id).where(KnowledgeNode.id == current_parent_id)
            )
            current_parent_id = parent_check.scalar()
    
    node.parent_id = target_parent_id
    node.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "节点移动成功"}

class AIGenerateGraphRequest(BaseModel):
    graph_name: str
    description: Optional[str] = None

class AIGenerateGraphResponse(BaseModel):
    success: bool
    graph_id: Optional[int] = None
    graph_name: Optional[str] = None
    nodes: Optional[List[Dict]] = None
    error: Optional[str] = None

@router.post("/ai-generate-from-pdf", response_model=AIGenerateGraphResponse)
async def ai_generate_graph_from_pdf(
    file: UploadFile = File(...),
    graph_name: str = Form(...),
    description: Optional[str] = Form(None),
    teacher_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    从PDF文档生成知识图谱
    """
    # 检查文件大小（1MB = 1024 * 1024 bytes）
    MAX_FILE_SIZE = 1024 * 1024  # 1MB
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > MAX_FILE_SIZE:
        return AIGenerateGraphResponse(
            success=False,
            error=f"文件大小超过限制（{file_size / 1024 / 1024:.2f}MB），最大允许1MB"
        )
    
    # 检查文件类型
    if not file.filename.lower().endswith('.pdf'):
        return AIGenerateGraphResponse(
            success=False,
            error="只支持PDF文件"
        )
    
    # 提取PDF文本
    logger.info(f"开始提取PDF文本: {file.filename}, 大小: {file_size} bytes")
    pdf_text = pdf_extractor.extract_text_from_bytes(file_content, max_pages=50)  # 限制最多50页
    
    if not pdf_text or len(pdf_text.strip()) < 100:
        return AIGenerateGraphResponse(
            success=False,
            error="PDF文件内容提取失败或内容过少，请确保PDF包含可提取的文本内容"
        )
    
    logger.info(f"PDF文本提取成功，长度: {len(pdf_text)} 字符")
    
    # 获取当前激活的LLM配置
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.is_active == True)
    )
    config = result.scalars().first()
    
    if not config:
        return AIGenerateGraphResponse(
            success=False,
            error="未找到激活的LLM配置，请先在管理后台配置并启用LLM"
        )
    
    if not config.api_key:
        return AIGenerateGraphResponse(
            success=False,
            error="LLM配置的API Key未设置"
        )
    
    # 构建提示词
    # 限制文本长度，避免超出token限制
    pdf_text_limited = pdf_text[:8000]
    prompt = f"""请仔细阅读以下PDF文档内容，并基于文档内容生成一个结构化的知识图谱。

文档内容：
{pdf_text_limited}

请按照以下JSON格式输出知识图谱结构，不要包含任何其他文字说明：

{{
  "graph_name": "{graph_name}",
  "description": "{description or '基于PDF文档自动生成的知识图谱'}",
  "nodes": [
    {{
      "node_name": "根节点名称",
      "node_content": "节点详细内容描述",
      "parent_id": null,
      "sort_order": 0,
      "children": [
        {{
          "node_name": "子节点1名称",
          "node_content": "子节点1详细内容",
          "sort_order": 0,
          "children": []
        }},
        {{
          "node_name": "子节点2名称",
          "node_content": "子节点2详细内容",
          "sort_order": 1,
          "children": []
        }}
      ]
    }}
  ]
}}

要求：
1. 知识图谱应该反映文档的核心知识结构和逻辑关系
2. 节点名称应该简洁明了，体现知识点的层次结构
3. 节点内容应该包含该知识点的详细说明
4. 必须输出有效的JSON格式，不要包含markdown代码块标记
5. 节点层级建议控制在3-4层以内
6. 每个节点都应该有明确的父子关系"""
    
    # 记录LLM调用
    response_text = None
    graph_id_for_log = None
    try:
        async with log_llm_call(
            db=db,
            function_type="ai_generate_knowledge_graph",
            user_id=teacher_id,
            user_role="teacher",
            llm_config_id=config.id,
            prompt=prompt,
            related_type="knowledge_graph"
        ) as log_context:
            try:
                # 调用LLM API
                provider_key = config.provider_key
                
                if provider_key == "aliyun_qwen":
                    response_text = await _call_aliyun_qwen(config, prompt)
                elif provider_key in ["deepseek", "kimi", "volcengine_doubao", "siliconflow"]:
                    response_text = await _call_openai_compatible(config, prompt)
                elif provider_key == "wenxin":
                    response_text = await _call_wenxin(config, prompt)
                else:
                    error_msg = f"不支持的LLM提供商: {provider_key}"
                    log_context.set_result(None, status='failed', error_message=error_msg)
                    return AIGenerateGraphResponse(
                        success=False,
                        error=error_msg
                    )
                
                log_context.set_result(response_text, status='success')
            except Exception as e:
                logger.error(f"LLM调用失败: {e}", exc_info=True)
                log_context.set_result(None, status='failed', error_message=str(e))
                raise
        
        # 解析返回的JSON
        response_text = response_text.strip()
        if "```json" in response_text:
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            if end != -1:
                response_text = response_text[start:end].strip()
        elif "```" in response_text:
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            if end != -1:
                response_text = response_text[start:end].strip()
        
        # 解析JSON
        try:
            graph_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析失败: {e}, 响应内容: {response_text[:500]}")
            return AIGenerateGraphResponse(
                success=False,
                error=f"AI返回的数据格式错误: {str(e)}"
            )
        
        # 创建知识图谱
        graph = KnowledgeGraph(
            teacher_id=teacher_id,
            graph_name=graph_data.get("graph_name", graph_name),
            description=graph_data.get("description", description),
            is_active=True
        )
        db.add(graph)
        await db.commit()
        await db.refresh(graph)
        graph_id_for_log = graph.id
        
        # 创建节点（递归创建）
        nodes_data = graph_data.get("nodes", [])
        created_nodes = []
        
        async def create_nodes_recursive(nodes: List[Dict], parent_id: Optional[int] = None, sort_order: int = 0):
            for node_data in nodes:
                node = KnowledgeNode(
                    graph_id=graph.id,
                    parent_id=parent_id,
                    node_name=node_data.get("node_name", ""),
                    node_content=node_data.get("node_content"),
                    sort_order=node_data.get("sort_order", sort_order),
                    is_active=True
                )
                db.add(node)
                await db.flush()
                await db.refresh(node)
                created_nodes.append({
                    "id": node.id,
                    "node_name": node.node_name,
                    "node_content": node.node_content,
                    "parent_id": node.parent_id
                })
                
                # 递归创建子节点
                children = node_data.get("children", [])
                if children:
                    await create_nodes_recursive(children, node.id, 0)
        
        await create_nodes_recursive(nodes_data)
        await db.commit()
        
        return AIGenerateGraphResponse(
            success=True,
            graph_id=graph.id,
            graph_name=graph.graph_name,
            nodes=created_nodes
        )
        
    except Exception as e:
        logger.error(f"AI生成知识图谱失败: {e}", exc_info=True)
        return AIGenerateGraphResponse(
            success=False,
            error=f"AI生成知识图谱失败: {str(e)}"
        )

async def _call_openai_compatible(config: LLMConfig, prompt: str) -> str:
    """调用OpenAI兼容的API"""
    endpoint = config.endpoint_url.rstrip('/') if config.endpoint_url else ""
    # 如果endpoint已经包含/chat/completions，就不需要再拼接
    if endpoint.endswith('/chat/completions'):
        url = endpoint
    else:
        url = f"{endpoint}/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": config.model_name or "default",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 4000
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        else:
            raise Exception("响应格式错误")

async def _call_aliyun_qwen(config: LLMConfig, prompt: str) -> str:
    """调用阿里云通义千问API"""
    endpoint = config.endpoint_url.rstrip('/') if config.endpoint_url else ""
    url = f"{endpoint}/services/aigc/text-generation/generation"
    
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": config.model_name or "qwen-max",
        "input": {
            "messages": [
                {"role": "user", "content": prompt}
            ]
        },
        "parameters": {
            "temperature": 0.7,
            "max_tokens": 4000
        }
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        if "output" in result and "text" in result["output"]:
            return result["output"]["text"]
        else:
            raise Exception("响应格式错误")

async def _call_wenxin(config: LLMConfig, prompt: str) -> str:
    """调用文心一言API"""
    if not config.api_secret:
        raise Exception("文心一言需要配置API Secret")
    
    # 获取access_token
    token_url = "https://aip.baidubce.com/oauth/2.0/token"
    token_params = {
        "grant_type": "client_credentials",
        "client_id": config.api_key,
        "client_secret": config.api_secret
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        token_response = await client.post(token_url, params=token_params)
        token_response.raise_for_status()
        access_token = token_response.json()["access_token"]
        
        # 调用对话API
        endpoint = config.endpoint_url.rstrip('/') if config.endpoint_url else ""
        chat_url = f"{endpoint}/wenxinworkshop/chat/completions"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        params = {
            "access_token": access_token
        }
        
        data = {
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_output_tokens": 4000
        }
        
        chat_response = await client.post(chat_url, json=data, headers=headers, params=params)
        chat_response.raise_for_status()
        result = chat_response.json()
        
        if "result" in result:
            return result["result"]
        else:
            raise Exception("响应格式错误")

@router.get("/{graph_id}/nodes/{node_id}/resources-recursive")
async def get_node_resources_recursive(
    graph_id: int,
    node_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """递归获取知识图谱节点及其所有子节点的关联资源"""
    # 验证图谱归属
    graph_result = await db.execute(
        select(KnowledgeGraph).where(
            and_(
                KnowledgeGraph.id == graph_id,
                KnowledgeGraph.teacher_id == teacher_id,
                KnowledgeGraph.is_active == True
            )
        )
    )
    graph = graph_result.scalars().first()
    if not graph:
        raise HTTPException(status_code=404, detail="知识图谱不存在")
    
    # 验证节点存在
    node_result = await db.execute(
        select(KnowledgeNode).where(
            and_(
                KnowledgeNode.id == node_id,
                KnowledgeNode.graph_id == graph_id,
                KnowledgeNode.is_active == True
            )
        )
    )
    node = node_result.scalars().first()
    if not node:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 递归获取所有子节点ID（包括自己）
    async def get_all_subnode_ids(parent_node_id: int) -> List[int]:
        ids = [parent_node_id]
        result = await db.execute(
            select(KnowledgeNode.id).where(
                and_(
                    KnowledgeNode.parent_id == parent_node_id,
                    KnowledgeNode.is_active == True
                )
            )
        )
        child_ids = result.scalars().all()
        for child_id in child_ids:
            ids.extend(await get_all_subnode_ids(child_id))
        return ids
    
    node_ids = await get_all_subnode_ids(node_id)
    
    # 获取所有节点的名称，用于知识点搜索
    nodes_result = await db.execute(
        select(KnowledgeNode).where(KnowledgeNode.id.in_(node_ids))
    )
    nodes = nodes_result.scalars().all()
    knowledge_points = [n.node_name for n in nodes]
    
    # 查询包含这些知识点的资源
    from app.models.teaching_resource import TeachingResource
    query = select(TeachingResource, User).join(
        User, TeachingResource.teacher_id == User.id
    ).where(
        and_(
            TeachingResource.teacher_id == teacher_id,
            TeachingResource.is_active == True
        )
    )
    
    # 使用knowledge_point字段进行过滤
    # 由于knowledge_point可能包含多个知识点（逗号分隔），我们需要进行模糊匹配
    if knowledge_points:
        from sqlalchemy import or_
        conditions = [TeachingResource.knowledge_point.ilike(f"%{kp}%") for kp in knowledge_points]
        query = query.where(or_(*conditions))
    
    query = query.order_by(TeachingResource.created_at.desc())
    
    result = await db.execute(query)
    rows = result.all()
    
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
            "folder_id": resource.folder_id,
            "is_active": resource.is_active,
            "created_at": resource.created_at.isoformat() if resource.created_at else None,
            "updated_at": resource.updated_at.isoformat() if resource.updated_at else None
        })
    
    return {
        "node": {
            "id": node.id,
            "node_name": node.node_name,
            "node_content": node.node_content
        },
        "resources": resources,
        "node_ids": node_ids,
        "knowledge_points": knowledge_points
    }

@router.get("/{graph_id}/child-nodes")
async def get_child_nodes(
    graph_id: int,
    parent_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取知识图谱的直接子节点
    - 如果parent_id为None，返回根节点
    - 如果parent_id有值，返回该节点的直接子节点
    """
    # 验证图谱存在
    graph_query = select(KnowledgeGraph).where(KnowledgeGraph.id == graph_id)
    if teacher_id:
        graph_query = graph_query.where(KnowledgeGraph.teacher_id == teacher_id)
    
    graph_result = await db.execute(graph_query)
    graph = graph_result.scalars().first()
    
    if not graph:
        raise HTTPException(status_code=404, detail="Knowledge graph not found")
    
    # 如果指定了parent_id，验证父节点存在
    if parent_id is not None:
        parent_result = await db.execute(
            select(KnowledgeNode).where(
                and_(
                    KnowledgeNode.id == parent_id,
                    KnowledgeNode.graph_id == graph_id
                )
            )
        )
        parent_node = parent_result.scalars().first()
        if not parent_node:
            raise HTTPException(status_code=404, detail="Parent node not found")
    
    # 获取直接子节点
    nodes_result = await db.execute(
        select(KnowledgeNode).where(
            and_(
                KnowledgeNode.graph_id == graph_id,
                KnowledgeNode.parent_id == parent_id,
                KnowledgeNode.is_active == True
            )
        ).order_by(KnowledgeNode.sort_order)
    )
    nodes = nodes_result.scalars().all()
    
    return {
        "graph_id": graph_id,
        "parent_id": parent_id,
        "nodes": [
            {
                "id": node.id,
                "node_name": node.node_name,
                "node_content": node.node_content,
                "sort_order": node.sort_order,
                "has_children": bool(node.children) if hasattr(node, 'children') else False
            }
            for node in nodes
        ]
    }

