"""
个性化学习与AI测评数据库迁移脚本
"""
import asyncio
from sqlalchemy import create_engine, text
from app.core.config import settings

async def migrate_personalized_learning_tables():
    print("\n" + "=" * 70)
    print("开始执行个性化学习与AI测评数据库迁移")
    print("=" * 70 + "\n")
    
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI.replace('+asyncpg', ''))
    
    # 读取SQL文件
    sql_file = "migrations/create_personalized_learning_tables.sql"
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # 分割SQL语句（按分号分割，但保留CREATE TABLE的完整语句）
    sql_statements = []
    current_statement = ""
    
    for line in sql_content.split('\n'):
        line = line.strip()
        if line.startswith('--') or not line:
            continue
        current_statement += line + "\n"
        if line.endswith(';'):
            sql_statements.append(current_statement.strip())
            current_statement = ""
    
    with engine.connect() as conn:
        for i, stmt in enumerate(sql_statements, 1):
            if not stmt or stmt.startswith('--'):
                continue
            
            print(f"执行语句 {i}/{len(sql_statements)}...")
            try:
                conn.execute(text(stmt))
                print(f"✅ 语句 {i} 执行成功")
            except Exception as e:
                print(f"❌ 执行SQL出错: {e}")
                print(f"语句内容: {stmt[:200]}...")
                conn.rollback()
                raise
        
        conn.commit()
        print("\n" + "=" * 70)
        print("数据库迁移完成！")
        print("=" * 70 + "\n")
        print("创建的表：")
        print("  ✅ personalized_learning_content (个性化学习内容表)")
        print("  ✅ ai_quiz_record (AI测评记录表)")
        print("\n已创建索引：")
        print("  - student_id, resource_id, created_at")

if __name__ == "__main__":
    asyncio.run(migrate_personalized_learning_tables())
