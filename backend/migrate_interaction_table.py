import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """执行师生互动表迁移"""
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    # 读取SQL文件
    with open('create_interaction_table.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # 执行SQL
    with engine.connect() as conn:
        # 分割SQL语句并执行
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        for statement in statements:
            try:
                conn.execute(text(statement))
                print(f"✓ 执行成功: {statement[:50]}...")
            except Exception as e:
                print(f"✗ 执行失败: {statement[:50]}...")
                print(f"  错误: {e}")
        
        conn.commit()
    
    print("\n✅ 师生互动表迁移完成！")

if __name__ == "__main__":
    migrate()

