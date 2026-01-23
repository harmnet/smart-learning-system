"""
LLM调用记录工具
提供统一的LLM调用记录功能，自动记录执行时长
"""
import time
import logging
from contextlib import asynccontextmanager
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.llm_call_log import LLMCallLog

logger = logging.getLogger(__name__)


@asynccontextmanager
async def log_llm_call(
    db: AsyncSession,
    function_type: str,
    user_id: int,
    user_role: str,
    llm_config_id: Optional[int],
    prompt: str,
    related_id: Optional[int] = None,
    related_type: Optional[str] = None,
):
    """
    LLM调用记录上下文管理器
    
    用法：
    async with log_llm_call(db, function_type, user_id, user_role, llm_config_id, prompt) as log_context:
        result = await call_llm_api(...)
        log_context.set_result(result)
    
    或者：
    async with log_llm_call(...) as log_context:
        try:
            result = await call_llm_api(...)
            log_context.set_result(result, status='success')
        except Exception as e:
            log_context.set_result(None, status='failed', error_message=str(e))
    """
    start_time = time.perf_counter()
    log_entry = None
    
    # 检查表是否存在
    table_exists = False
    try:
        result = await db.execute(text("SELECT 1 FROM llm_call_log LIMIT 1"))
        table_exists = True
    except Exception as check_err:
        # 表不存在，跳过日志记录
        logger.debug(f"llm_call_log表不存在或检查失败，跳过日志记录: {check_err}")
        table_exists = False
    
    if not table_exists:
        # 如果表不存在，创建一个空的上下文管理器
        class EmptyLogContext:
            def set_result(self, result=None, status='success', error_message=None):
                pass
        
        yield EmptyLogContext()
        return
    
    try:
        # 创建日志记录对象（先不保存）
        log_entry = LLMCallLog(
            function_type=function_type,
            user_id=user_id if user_id else 0,  # 如果user_id为None，使用0
            user_role=user_role,
            llm_config_id=llm_config_id,
            prompt=prompt,
            related_id=related_id,
            related_type=related_type,
            status='success',  # 默认成功，如果出错会在except中修改
        )
        
        # 创建上下文对象
        class LogContext:
            def __init__(self, log_entry: Optional[LLMCallLog], start_time: float):
                self.log_entry = log_entry
                self.start_time = start_time
            
            def set_result(
                self,
                result: Optional[str] = None,
                status: str = 'success',
                error_message: Optional[str] = None
            ):
                """设置调用结果"""
                if self.log_entry:
                    execution_time_ms = int((time.perf_counter() - self.start_time) * 1000)
                    self.log_entry.result = result
                    self.log_entry.status = status
                    self.log_entry.execution_time_ms = execution_time_ms
                    if error_message:
                        self.log_entry.error_message = error_message
        
        log_context = LogContext(log_entry, start_time)
        
        yield log_context
        
        # 如果log_entry存在，处理结果
        if log_entry:
            # 如果调用成功但没有设置结果，尝试获取
            if log_entry.status == 'success' and log_entry.result is None:
                # 这种情况不应该发生，但为了安全起见
                log_entry.result = ""
            
            # 计算执行时长
            if log_entry.execution_time_ms is None:
                log_entry.execution_time_ms = int((time.perf_counter() - start_time) * 1000)
        
    except Exception as e:
        # 如果记录过程中出错，记录错误但不影响主流程
        logger.warning(f"记录LLM调用日志失败（可能表不存在），继续执行: {str(e)}")
        log_entry = None  # 设置为None，避免后续保存
    finally:
        # 保存日志记录（如果log_entry存在）
        if log_entry:
            try:
                # 检查数据库会话是否仍然有效
                if db.is_active:
                    db.add(log_entry)
                    await db.commit()
                    await db.refresh(log_entry)
            except Exception as e:
                # 如果保存失败（可能是表不存在或会话已关闭），记录警告但不抛出异常
                logger.warning(f"保存LLM调用日志失败（可能表不存在或会话已关闭）: {str(e)}")
                try:
                    if db.is_active:
                        await db.rollback()
                except:
                    pass


async def create_llm_call_log(
    db: AsyncSession,
    function_type: str,
    user_id: int,
    user_role: str,
    llm_config_id: Optional[int],
    prompt: str,
    result: Optional[str] = None,
    execution_time_ms: Optional[int] = None,
    status: str = 'success',
    error_message: Optional[str] = None,
    related_id: Optional[int] = None,
    related_type: Optional[str] = None,
) -> LLMCallLog:
    """
    直接创建LLM调用记录（不使用上下文管理器）
    
    适用于已经知道执行时长的场景
    """
    log_entry = LLMCallLog(
        function_type=function_type,
        user_id=user_id,
        user_role=user_role,
        llm_config_id=llm_config_id,
        prompt=prompt,
        result=result,
        execution_time_ms=execution_time_ms,
        status=status,
        error_message=error_message,
        related_id=related_id,
        related_type=related_type,
    )
    
    try:
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"创建LLM调用日志失败: {str(e)}", exc_info=True)
        await db.rollback()
        raise
