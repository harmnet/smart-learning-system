#!/usr/bin/env python3
"""
添加缺失的数据库列
"""
import asyncio
import asyncpg
from app.core.config import settings

async def add_missing_columns():
    """添加缺失的列"""
    conn = await asyncpg.connect(
        host=settings.POSTGRES_SERVER,
        port=int(settings.POSTGRES_PORT),
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        database=settings.POSTGRES_DB
    )
    
    try:
        # 检查并添加 teaching_resource.local_file_path
        result = await conn.fetch("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'teaching_resource' 
            AND column_name = 'local_file_path'
        """)
        
        if not result:
            print("添加 teaching_resource.local_file_path 列...")
            await conn.execute("""
                ALTER TABLE teaching_resource 
                ADD COLUMN local_file_path VARCHAR(500)
            """)
            print("✅ 已添加 local_file_path 列")
        else:
            print("ℹ️  local_file_path 列已存在")
        
        # 检查并添加 teaching_resource.pdf_path
        result = await conn.fetch("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'teaching_resource' 
            AND column_name = 'pdf_path'
        """)
        
        if not result:
            print("添加 teaching_resource.pdf_path 列...")
            await conn.execute("""
                ALTER TABLE teaching_resource 
                ADD COLUMN pdf_path VARCHAR(500)
            """)
            print("✅ 已添加 pdf_path 列")
        else:
            print("ℹ️  pdf_path 列已存在")
        
        # 检查并添加 teaching_resource.pdf_local_path
        result = await conn.fetch("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'teaching_resource' 
            AND column_name = 'pdf_local_path'
        """)
        
        if not result:
            print("添加 teaching_resource.pdf_local_path 列...")
            await conn.execute("""
                ALTER TABLE teaching_resource 
                ADD COLUMN pdf_local_path VARCHAR(500)
            """)
            print("✅ 已添加 pdf_local_path 列")
        else:
            print("ℹ️  pdf_local_path 列已存在")
        
        # 检查并添加 teaching_resource.pdf_converted_at
        result = await conn.fetch("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'teaching_resource' 
            AND column_name = 'pdf_converted_at'
        """)
        
        if not result:
            print("添加 teaching_resource.pdf_converted_at 列...")
            await conn.execute("""
                ALTER TABLE teaching_resource 
                ADD COLUMN pdf_converted_at TIMESTAMP
            """)
            print("✅ 已添加 pdf_converted_at 列")
        else:
            print("ℹ️  pdf_converted_at 列已存在")
        
        # 检查并添加 teaching_resource.pdf_conversion_status
        result = await conn.fetch("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'teaching_resource' 
            AND column_name = 'pdf_conversion_status'
        """)
        
        if not result:
            print("添加 teaching_resource.pdf_conversion_status 列...")
            await conn.execute("""
                ALTER TABLE teaching_resource 
                ADD COLUMN pdf_conversion_status VARCHAR(20) DEFAULT 'pending'
            """)
            print("✅ 已添加 pdf_conversion_status 列")
        else:
            print("ℹ️  pdf_conversion_status 列已存在")
        
        print("\n✅ 所有缺失的列已添加完成！")
        
    except Exception as e:
        print(f"❌ 错误: {e}")
        raise
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(add_missing_columns())

