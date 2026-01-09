from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, ORJSONResponse
from fastapi.exceptions import RequestValidationError
from pathlib import Path
import logging
import traceback
from app.core.config import settings
from app.api.v1.api import api_router

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    debug=True,
    default_response_class=ORJSONResponse  # 使用orjson，它默认不转义Unicode字符
)

# 422 验证错误处理
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"❌ [VALIDATION ERROR] 请求验证失败!")
    logger.error(f"📍 [REQUEST] Method: {request.method}, URL: {request.url}")
    logger.error(f"🔍 [ERRORS] {exc.errors()}")
    logger.error(f"📦 [BODY] {exc.body}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": str(exc.body) if exc.body else None
        }
    )

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"内部服务器错误: {str(exc)}",
            "type": type(exc).__name__
        }
    )

# 静态文件服务 - 用于访问上传的封面图片
uploads_dir = Path("uploads/covers")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/covers", StaticFiles(directory=str(uploads_dir)), name="covers")

# 挂载考试封面目录
exam_covers_dir = Path("uploads/exam_covers")
exam_covers_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads/exam_covers", StaticFiles(directory=str(exam_covers_dir)), name="exam_covers")

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有源（开发环境）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Learning System API", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

