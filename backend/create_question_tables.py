"""创建题库相关的数据库表"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# 数据库连接
DATABASE_URL = "postgresql+asyncpg://postgres:smartlearning123@localhost:5433/smartlearning"

async def create_tables():
    """创建题库表"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # 创建题目表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS question (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER NOT NULL REFERENCES sys_user(id),
                question_type VARCHAR(20) NOT NULL,
                title TEXT NOT NULL,
                title_image VARCHAR(500),
                knowledge_point TEXT,
                answer TEXT,
                answer_image VARCHAR(500),
                explanation TEXT,
                explanation_image VARCHAR(500),
                difficulty INTEGER DEFAULT 1,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 创建题目选项表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS question_option (
                id SERIAL PRIMARY KEY,
                question_id INTEGER NOT NULL REFERENCES question(id) ON DELETE CASCADE,
                option_label VARCHAR(10) NOT NULL,
                option_text TEXT NOT NULL,
                option_image VARCHAR(500),
                is_correct BOOLEAN DEFAULT FALSE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        print("✅ 题库表创建成功！")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())

