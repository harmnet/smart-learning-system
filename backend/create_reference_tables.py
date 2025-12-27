"""创建参考资料相关的数据库表"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# 数据库连接
DATABASE_URL = "postgresql+asyncpg://postgres:smartlearning123@localhost:5433/smartlearning"

async def create_tables():
    """创建参考资料表"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # 创建参考资料文件夹表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS reference_folder (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER NOT NULL REFERENCES sys_user(id),
                folder_name VARCHAR(255) NOT NULL,
                parent_id INTEGER REFERENCES reference_folder(id),
                description VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # 创建参考资料表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS reference_material (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER NOT NULL REFERENCES sys_user(id),
                folder_id INTEGER REFERENCES reference_folder(id),
                resource_name VARCHAR(255) NOT NULL,
                resource_type VARCHAR(50) NOT NULL,
                original_filename VARCHAR(255),
                file_path VARCHAR(500),
                file_size BIGINT,
                link_url VARCHAR(1000),
                knowledge_point TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        print("✅ 参考资料表创建成功！")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())

