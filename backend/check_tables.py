#!/usr/bin/env python3
"""
快速检查数据库表是否存在
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

async def check_tables():
    """检查必要的表是否存在"""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session_maker() as db:
        tables_to_check = [
            'course_qa_session',
            'course_qa_message',
            'llm_call_log'
        ]
        
        print("检查数据库表...")
        for table_name in tables_to_check:
            try:
                result = await db.execute(text(f"SELECT 1 FROM {table_name} LIMIT 1"))
                print(f"✓ {table_name} 表存在")
            except Exception as e:
                print(f"✗ {table_name} 表不存在: {e}")
        
        print("\n如果表不存在，请执行以下命令：")
        print("psql -U postgres -d smartlearning -f backend/migrations/create_course_qa_tables.sql")
        print("psql -U postgres -d smartlearning -f backend/migrations/create_llm_call_log_table.sql")

if __name__ == "__main__":
    asyncio.run(check_tables())
