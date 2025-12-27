"""
创建考试相关表的脚本
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.exam import Exam, ExamStudent
from app.models.exam_paper import ExamPaper  # 导入ExamPaper模型以确保外键关系正确
from app.models.base import Base
from app.core.config import settings

async def create_tables():
    # 使用异步引擎
    engine = create_async_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        echo=True
    )
    
    async with engine.begin() as conn:
        # 创建所有表
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ 考试相关表创建成功！")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())

