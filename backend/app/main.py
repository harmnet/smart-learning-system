from fastapi import FastAPI, Request, HTTPException
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

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]

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
        },
        headers=_build_cors_headers(request)
    )

# HTTPException异常处理（确保CORS头）
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = _build_cors_headers(request)
    if exc.headers:
        headers.update(exc.headers)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
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
        },
        headers=_build_cors_headers(request)
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
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

def _build_cors_headers(request: Request) -> dict:
    origin = request.headers.get("origin")
    if origin and origin in allowed_origins:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true"
        }
    return {
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*"
    }

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Learning System API", "version": "0.1.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
