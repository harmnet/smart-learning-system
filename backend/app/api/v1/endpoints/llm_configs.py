from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from pydantic import BaseModel
import httpx

from app.db.session import get_db
from app.models.llm_config import LLMConfig
from app.schemas.llm_config import LLMConfig as LLMConfigSchema, LLMConfigCreate, LLMConfigUpdate

router = APIRouter()

@router.get("", response_model=List[LLMConfigSchema])
async def get_llm_configs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取所有LLM配置列表
    """
    result = await db.execute(
        select(LLMConfig).offset(skip).limit(limit).order_by(LLMConfig.id)
    )
    configs = result.scalars().all()
    return configs

@router.get("/{config_id}", response_model=LLMConfigSchema)
async def get_llm_config(
    config_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    获取指定LLM配置详情
    """
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.id == config_id)
    )
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM配置不存在")
    return config

@router.post("", response_model=LLMConfigSchema)
async def create_llm_config(
    config_in: LLMConfigCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    创建新的LLM配置
    """
    # 检查provider_key是否已存在
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.provider_key == config_in.provider_key)
    )
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="该提供商标识已存在")
    
    config = LLMConfig(**config_in.model_dump())
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return config

@router.put("/{config_id}", response_model=LLMConfigSchema)
async def update_llm_config(
    config_id: int,
    config_in: LLMConfigUpdate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    更新LLM配置
    """
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.id == config_id)
    )
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM配置不存在")
    
    # 更新字段
    update_data = config_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)
    
    await db.commit()
    await db.refresh(config)
    return config

@router.delete("/{config_id}")
async def delete_llm_config(
    config_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    删除LLM配置
    """
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.id == config_id)
    )
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM配置不存在")
    
    await db.execute(
        delete(LLMConfig).where(LLMConfig.id == config_id)
    )
    await db.commit()
    return {"message": "删除成功"}

@router.patch("/{config_id}/toggle")
async def toggle_llm_config(
    config_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    切换LLM配置的启用状态
    系统只允许同时启用一个LLM配置
    """
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.id == config_id)
    )
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM配置不存在")
    
    # 如果要启用该配置，则禁用所有其他配置
    if not config.is_active:
        # 禁用所有其他配置
        await db.execute(
            select(LLMConfig).where(LLMConfig.id != config_id)
        )
        other_configs = (await db.execute(
            select(LLMConfig).where(LLMConfig.id != config_id)
        )).scalars().all()
        
        for other_config in other_configs:
            other_config.is_active = False
        
        # 启用当前配置
        config.is_active = True
    else:
        # 禁用当前配置
        config.is_active = False
    
    await db.commit()
    await db.refresh(config)
    return config

class TestRequest(BaseModel):
    message: str

class TestResponse(BaseModel):
    success: bool
    response: str = ""
    error: str = ""

@router.post("/{config_id}/test", response_model=TestResponse)
async def test_llm_config(
    config_id: int,
    test_req: TestRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    测试LLM配置的接口连接和对话功能
    """
    result = await db.execute(
        select(LLMConfig).where(LLMConfig.id == config_id)
    )
    config = result.scalars().first()
    if not config:
        raise HTTPException(status_code=404, detail="LLM配置不存在")
    
    if not config.api_key:
        return TestResponse(success=False, error="API Key未配置")
    
    try:
        # 根据不同的提供商调用不同的API
        provider_key = config.provider_key
        
        if provider_key == "aliyun_qwen":
            # 阿里云通义千问
            response = await test_aliyun_qwen(config, test_req.message)
        elif provider_key == "deepseek":
            # DeepSeek
            response = await test_openai_compatible(config, test_req.message)
        elif provider_key == "kimi":
            # KIMI (Moonshot)
            response = await test_openai_compatible(config, test_req.message)
        elif provider_key == "wenxin":
            # 文心一言
            response = await test_wenxin(config, test_req.message)
        elif provider_key == "volcengine_doubao":
            # 火山引擎豆包
            response = await test_openai_compatible(config, test_req.message)
        elif provider_key == "siliconflow":
            # 硅基流动
            response = await test_openai_compatible(config, test_req.message)
        else:
            return TestResponse(success=False, error=f"不支持的提供商: {provider_key}")
        
        return TestResponse(success=True, response=response)
    
    except Exception as e:
        return TestResponse(success=False, error=str(e))

async def test_openai_compatible(config: LLMConfig, message: str) -> str:
    """
    测试OpenAI兼容的API（DeepSeek, KIMI, SiliconFlow, 火山引擎等）
    """
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
            {"role": "user", "content": message}
        ],
        "max_tokens": 100
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        else:
            raise Exception("响应格式错误")

async def test_aliyun_qwen(config: LLMConfig, message: str) -> str:
    """
    测试阿里云通义千问API
    """
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
                {"role": "user", "content": message}
            ]
        },
        "parameters": {
            "max_tokens": 100
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=data, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        if "output" in result and "text" in result["output"]:
            return result["output"]["text"]
        else:
            raise Exception("响应格式错误")

async def test_wenxin(config: LLMConfig, message: str) -> str:
    """
    测试文心一言API
    """
    # 文心一言需要先获取access_token
    if not config.api_secret:
        raise Exception("文心一言需要配置API Secret")
    
    # 获取access_token
    token_url = "https://aip.baidubce.com/oauth/2.0/token"
    token_params = {
        "grant_type": "client_credentials",
        "client_id": config.api_key,
        "client_secret": config.api_secret
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
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
                {"role": "user", "content": message}
            ]
        }
        
        chat_response = await client.post(chat_url, json=data, headers=headers, params=params)
        chat_response.raise_for_status()
        result = chat_response.json()
        
        if "result" in result:
            return result["result"]
        else:
            raise Exception("响应格式错误")

