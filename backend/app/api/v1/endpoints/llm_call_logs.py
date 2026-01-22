"""
LLM调用记录管理API端点
提供管理员查询LLM调用记录的功能
"""
from typing import Any, Optional
from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, desc, func

from app.db.session import get_db
from app.models.llm_call_log import LLMCallLog
from app.models.base import User
from app.models.llm_config import LLMConfig
from app.schemas.llm_call_log import (
    LLMCallLogListItem,
    LLMCallLogDetail,
    LLMCallLogListResponse
)
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """从token获取当前用户"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """验证当前用户是否为管理员"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this endpoint"
        )
    return current_user


@router.get("", response_model=LLMCallLogListResponse)
async def get_llm_call_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    function_type: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    获取LLM调用记录列表
    需要管理员权限
    """
    try:
        # 构建查询条件
        conditions = []
        
        if function_type:
            conditions.append(LLMCallLog.function_type == function_type)
        
        if user_id:
            conditions.append(LLMCallLog.user_id == user_id)
        
        if start_date:
            conditions.append(LLMCallLog.created_at >= start_date)
        
        if end_date:
            conditions.append(LLMCallLog.created_at <= end_date)
        
        # 构建查询
        query = select(LLMCallLog)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # 获取总数
        count_query = select(func.count(LLMCallLog.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # 获取分页数据
        query = query.order_by(desc(LLMCallLog.created_at)).offset(skip).limit(limit)
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # 批量加载用户和LLM配置信息
        user_ids = list(set([log.user_id for log in logs]))
        llm_config_ids = list(set([log.llm_config_id for log in logs if log.llm_config_id]))
        
        users_map = {}
        if user_ids:
            users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
            users = users_result.scalars().all()
            users_map = {user.id: user for user in users}
        
        llm_configs_map = {}
        if llm_config_ids:
            configs_result = await db.execute(select(LLMConfig).where(LLMConfig.id.in_(llm_config_ids)))
            configs = configs_result.scalars().all()
            llm_configs_map = {config.id: config for config in configs}
        
        # 将关联数据附加到日志对象
        for log in logs:
            if log.user_id in users_map:
                log.user = users_map[log.user_id]
            if log.llm_config_id and log.llm_config_id in llm_configs_map:
                log.llm_config = llm_configs_map[log.llm_config_id]
    except Exception as e:
        logger.error(f"查询LLM调用记录失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")
    
    # 转换为列表项
    items = []
    for log in logs:
        try:
            # 获取结果摘要（前100字符）
            result_summary = None
            if log.result:
                result_summary = log.result[:100] + ("..." if len(log.result) > 100 else "")
            
            # 获取用户名称（使用try-except处理关系加载失败的情况）
            user_name = None
            try:
                if log.user:
                    user_name = log.user.full_name or log.user.username
            except Exception:
                # 如果关系加载失败，使用user_id作为后备
                user_name = f"用户{log.user_id}"
            
            # 获取LLM配置名称（使用try-except处理关系加载失败的情况）
            llm_config_name = None
            try:
                if log.llm_config:
                    llm_config_name = log.llm_config.provider_name
            except Exception:
                # 如果关系加载失败，忽略
                pass
            
            items.append(LLMCallLogListItem(
                id=log.id,
                function_type=log.function_type,
                user_id=log.user_id,
                user_name=user_name,
                user_role=log.user_role,
                llm_config_id=log.llm_config_id,
                llm_config_name=llm_config_name,
                result_summary=result_summary,
                execution_time_ms=log.execution_time_ms,
                status=log.status,
                created_at=log.created_at
            ))
        except Exception as e:
            # 记录错误但继续处理其他记录
            logger.error(f"处理LLM调用记录 {log.id} 时出错: {str(e)}", exc_info=True)
            # 创建一个基本的列表项，即使关系加载失败
            items.append(LLMCallLogListItem(
                id=log.id,
                function_type=log.function_type,
                user_id=log.user_id,
                user_name=f"用户{log.user_id}",
                user_role=log.user_role,
                llm_config_id=log.llm_config_id,
                llm_config_name=None,
                result_summary=log.result[:100] + "..." if log.result and len(log.result) > 100 else (log.result or None),
                execution_time_ms=log.execution_time_ms,
                status=log.status,
                created_at=log.created_at
            ))
    
    return LLMCallLogListResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{log_id}", response_model=LLMCallLogDetail)
async def get_llm_call_log_detail(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Any:
    """
    获取LLM调用记录详情
    需要管理员权限
    """
    try:
        result = await db.execute(
            select(LLMCallLog).where(LLMCallLog.id == log_id)
        )
        log = result.scalars().first()
        
        if log:
            # 加载关联的用户信息
            if log.user_id:
                user_result = await db.execute(select(User).where(User.id == log.user_id))
                log.user = user_result.scalars().first()
            
            # 加载关联的LLM配置信息
            if log.llm_config_id:
                config_result = await db.execute(select(LLMConfig).where(LLMConfig.id == log.llm_config_id))
                log.llm_config = config_result.scalars().first()
    except Exception as e:
        logger.error(f"查询LLM调用记录详情失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")
    
    if not log:
        raise HTTPException(status_code=404, detail="LLM调用记录不存在")
    
    # 获取用户名称（使用try-except处理关系加载失败的情况）
    user_name = None
    try:
        if log.user:
            user_name = log.user.full_name or log.user.username
    except Exception:
        user_name = f"用户{log.user_id}"
    
    # 获取LLM配置名称（使用try-except处理关系加载失败的情况）
    llm_config_name = None
    try:
        if log.llm_config:
            llm_config_name = log.llm_config.provider_name
    except Exception:
        pass
    
    return LLMCallLogDetail(
        id=log.id,
        function_type=log.function_type,
        user_id=log.user_id,
        user_name=user_name,
        user_role=log.user_role,
        llm_config_id=log.llm_config_id,
        llm_config_name=llm_config_name,
        prompt=log.prompt,
        result=log.result,
        execution_time_ms=log.execution_time_ms,
        status=log.status,
        error_message=log.error_message,
        related_id=log.related_id,
        related_type=log.related_type,
        created_at=log.created_at
    )
