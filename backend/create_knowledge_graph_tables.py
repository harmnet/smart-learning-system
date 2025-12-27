"""创建知识图谱相关的数据库表"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# 数据库连接
DATABASE_URL = "postgresql+asyncpg://postgres:smartlearning123@localhost:5433/smartlearning"

async def create_tables():
    """创建知识图谱表"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # 创建知识图谱表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_graph (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER NOT NULL REFERENCES sys_user(id),
                graph_name VARCHAR(255) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 创建知识节点表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS knowledge_node (
                id SERIAL PRIMARY KEY,
                graph_id INTEGER NOT NULL REFERENCES knowledge_graph(id) ON DELETE CASCADE,
                parent_id INTEGER REFERENCES knowledge_node(id),
                node_name VARCHAR(255) NOT NULL,
                node_content TEXT,
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        print("✅ 知识图谱表创建成功！")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())

