"""
创建课程大纲相关表
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def create_tables():
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=True)
    async with engine.begin() as conn:
        # 创建课程章节表（章）
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_chapter (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES course(id) ON DELETE CASCADE,
                title VARCHAR NOT NULL,
                sort_order INTEGER DEFAULT 0,
                parent_id INTEGER REFERENCES course_chapter(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("✅ 创建course_chapter表成功")
        
        # 创建课程小节资源关联表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_section_resource (
                id SERIAL PRIMARY KEY,
                chapter_id INTEGER NOT NULL REFERENCES course_chapter(id) ON DELETE CASCADE,
                resource_type VARCHAR NOT NULL, -- teaching_resource, reference_material
                resource_id INTEGER NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("✅ 创建course_section_resource表成功")
        
        # 创建课程章节试卷关联表（章和小节都可以关联试卷）
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_chapter_exam_paper (
                id SERIAL PRIMARY KEY,
                chapter_id INTEGER NOT NULL REFERENCES course_chapter(id) ON DELETE CASCADE,
                exam_paper_id INTEGER NOT NULL REFERENCES exam_paper(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(chapter_id, exam_paper_id)
            )
        """))
        print("✅ 创建course_chapter_exam_paper表成功")
        
        # 创建课程小节作业表
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_section_homework (
                id SERIAL PRIMARY KEY,
                chapter_id INTEGER NOT NULL REFERENCES course_chapter(id) ON DELETE CASCADE,
                title VARCHAR NOT NULL,
                description TEXT,
                deadline TIMESTAMP,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        print("✅ 创建course_section_homework表成功")
        
        await conn.commit()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())

