from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Learning System"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "smartlearning123"
    POSTGRES_DB: str = "smartlearning"
    POSTGRES_PORT: str = "5433"
    
    # Async Database URL
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Security
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Aliyun OSS Configuration
    OSS_ACCESS_KEY_ID: str = ""
    OSS_ACCESS_KEY_SECRET: str = ""
    OSS_BUCKET_NAME: str = "ezijingai"
    OSS_REGION: str = "cn-beijing"  # 华北2（北京）- IMM项目所在区域
    OSS_ENDPOINT: str = ""  # 可选：自定义域名，例如 https://static.example.com
    OSS_USE_CNAME: bool = False  # 是否使用自定义域名
    
    # Aliyun IMM (Intelligent Media Management) Configuration
    IMM_PROJECT_NAME: str = "lls"  # IMM项目名称
    IMM_SERVICE_ROLE: str = ""  # 可选：IMM服务角色ARN（如果使用RAM角色访问OSS）

    # Banana-Slides PPT服务配置
    BANANA_SLIDES_API_URL: str = "http://localhost:5002"
    BANANA_SLIDES_FRONTEND_URL: str = "http://localhost:3002"
    GEMINI_API_KEY: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
print(f"DEBUG: Loaded settings. OSS_ACCESS_KEY_ID={settings.OSS_ACCESS_KEY_ID}, CNAME={settings.OSS_USE_CNAME}, ENDPOINT={settings.OSS_ENDPOINT}")

