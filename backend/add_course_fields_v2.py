"""
添加课程新字段：is_public, major_id
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def add_fields():
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True)
    async with engine.begin() as conn:
        # 添加is_public字段
        try:
            await conn.execute(text("""
                ALTER TABLE course 
                ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE
            """))
            print("✅ 添加is_public字段成功")
        except Exception as e:
            print(f"⚠️ is_public字段可能已存在: {e}")
        
        # 添加major_id字段
        try:
            await conn.execute(text("""
                ALTER TABLE course 
                ADD COLUMN IF NOT EXISTS major_id INTEGER REFERENCES major(id)
            """))
            print("✅ 添加major_id字段成功")
        except Exception as e:
            print(f"⚠️ major_id字段可能已存在: {e}")
        
        await conn.commit()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_fields())

