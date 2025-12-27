"""
为course_cover表添加file_size字段
"""
import asyncio
from sqlalchemy import text
from app.db.session import get_db


async def add_file_size_column():
    async for session in get_db():
        # 添加file_size字段
        await session.execute(text("""
            ALTER TABLE course_cover 
            ADD COLUMN IF NOT EXISTS file_size INTEGER;
        """))
        
        await session.commit()
        print("✅ file_size字段添加成功！")


if __name__ == "__main__":
    asyncio.run(add_file_size_column())

