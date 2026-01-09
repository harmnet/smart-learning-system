"""
课程管理功能数据库迁移脚本
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """执行数据库迁移"""
    # 使用同步驱动psycopg2
    db_url = settings.SQLALCHEMY_DATABASE_URI.replace('asyncpg', 'psycopg2')
    engine = create_engine(db_url)
    
    with open('add_course_management_fields.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # 按行处理，保留多行语句
    lines = sql_content.split('\n')
    current_stmt = []
    
    with engine.begin() as conn:
        for line in lines:
            stripped = line.strip()
            # 跳过注释和空行
            if not stripped or stripped.startswith('--'):
                continue
            
            current_stmt.append(line)
            
            # 如果以分号结尾，执行语句
            if stripped.endswith(';'):
                stmt = '\n'.join(current_stmt).strip()
                if stmt:
                    try:
                        print(f"执行: {stmt[:80]}...")
                        conn.execute(text(stmt))
                        print("✓ 成功")
                    except Exception as e:
                        error_msg = str(e)
                        if "already exists" in error_msg or "duplicate" in error_msg.lower() or "does not exist" in error_msg:
                            print(f"⚠ 跳过: {error_msg[:100]}")
                        else:
                            print(f"✗ 失败: {e}")
                            raise
                current_stmt = []
    
    print("\n数据库迁移完成!")

if __name__ == "__main__":
    migrate()

