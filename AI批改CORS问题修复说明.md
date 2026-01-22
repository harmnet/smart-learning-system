# AI批改作业CORS问题修复说明

## 问题描述

在老师端使用AI批改作业功能时，出现以下错误：
1. **CORS错误**: `Access to XMLHttpRequest ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`
2. **500错误**: `POST .../ai-grade net::ERR_FAILED 500 (Internal Server Error)`

## 问题原因

1. **CORS头缺失**: 虽然全局异常处理器已经配置了CORS头，但在某些异常情况下，HTTPException的headers参数可能会覆盖全局处理器的headers
2. **异常处理不完善**: AI批改过程中如果出现异常，可能没有正确返回CORS头

## 修复内容

### 1. 更新HTTPException异常处理器 (`backend/app/main.py`)

**修复前**:
```python
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            'Access-Control-Allow-Origin': '*',
            ...
        }
    )
```

**修复后**:
```python
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # 合并CORS headers和HTTPException的headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
    }
    if exc.headers:
        headers.update(exc.headers)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )
```

### 2. 移除HTTPException中的headers参数 (`backend/app/api/v1/endpoints/teachers.py`)

**修复前**:
```python
raise HTTPException(
    status_code=500, 
    detail=f"AI批改服务调用失败: {str(e)}",
    headers={
        'Access-Control-Allow-Origin': '*',
        ...
    }
)
```

**修复后**:
```python
raise HTTPException(status_code=500, detail=f"AI批改服务调用失败: {str(e)}")
```

让全局异常处理器统一处理CORS头，避免headers冲突。

### 3. 添加ai_response空值检查

**新增代码**:
```python
if not ai_response:
    raise HTTPException(status_code=500, detail="AI批改服务未返回有效结果")
```

确保AI调用返回有效结果后再进行解析。

### 4. 改进异常处理流程

**修复后**:
```python
try:
    async with log_llm_call(...) as log_context:
        try:
            # AI调用
            ...
        except Exception as e:
            log_context.set_result(None, status='failed', error_message=str(e))
            raise HTTPException(status_code=500, detail=f"AI批改服务调用失败: {str(e)}")
except HTTPException:
    # 重新抛出HTTPException，让全局异常处理器处理CORS
    raise
except Exception as e:
    # 处理其他未预期的异常
    logger.error(f"AI批改过程中发生未预期错误: {str(e)}", exc_info=True)
    raise HTTPException(status_code=500, detail=f"AI批改服务异常: {str(e)}")
```

确保所有异常都能正确触发全局异常处理器，从而返回CORS头。

## 测试验证

修复后，所有HTTPException和未处理异常都会：
1. ✅ 正确返回CORS头
2. ✅ 返回正确的错误信息
3. ✅ 前端可以正常接收错误响应

## 注意事项

1. **LLM配置**: 确保系统中已配置并激活至少一个大模型服务（LLMConfig表中is_active=True的记录）
2. **AI调用失败**: 如果AI服务调用失败，现在会正确返回500错误和CORS头，前端可以正常显示错误信息
3. **错误信息**: 错误信息会包含详细的失败原因，便于调试

## 相关文件

- `backend/app/main.py` - HTTPException异常处理器
- `backend/app/api/v1/endpoints/teachers.py` - AI批改接口实现

## 后续建议

1. **错误提示优化**: 前端可以根据不同的错误类型显示更友好的提示信息
2. **重试机制**: 对于临时性错误（如网络超时），可以考虑添加重试机制
3. **日志记录**: 所有AI调用失败都会记录到LLM调用日志表中，便于问题追踪

---

**修复时间**: 2025-01-01
**修复状态**: ✅ 已完成
