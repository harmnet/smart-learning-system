"""
添加课程新字段的脚本
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

async def add_course_fields():
    # 使用异步引擎
    engine = create_async_engine(
        settings.SQLALCHEMY_DATABASE_URI,
        echo=True
    )
    
    async with engine.begin() as conn:
        # 检查字段是否存在，如果不存在则添加
        # 课程类型
        await conn.execute(text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='course' AND column_name='course_type'
                ) THEN
                    ALTER TABLE course ADD COLUMN course_type VARCHAR(20);
                END IF;
            END $$;
        """))
        
        # 课程学时
        await conn.execute(text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='course' AND column_name='hours'
                ) THEN
                    ALTER TABLE course ADD COLUMN hours INTEGER;
                END IF;
            END $$;
        """))
        
        # 课程简介
        await conn.execute(text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='course' AND column_name='introduction'
                ) THEN
                    ALTER TABLE course ADD COLUMN introduction TEXT;
                END IF;
            END $$;
        """))
        
        # 授课目标
        await conn.execute(text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='course' AND column_name='objectives'
                ) THEN
                    ALTER TABLE course ADD COLUMN objectives TEXT;
                END IF;
            END $$;
        """))
        
        # 主讲教师ID（user_id）
        await conn.execute(text("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='course' AND column_name='main_teacher_id'
                ) THEN
                    ALTER TABLE course ADD COLUMN main_teacher_id INTEGER REFERENCES sys_user(id);
                END IF;
            END $$;
        """))
    
    print("✅ 课程字段添加成功！")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(add_course_fields())

