"""
学习偏好测评数据库迁移脚本
"""
import asyncio
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    print("\n" + "=" * 60)
    print("开始执行学习偏好测评数据库迁移")
    print("=" * 60 + "\n")
    
    # 使用同步引擎
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI.replace('+asyncpg', ''))
    
    # 定义SQL语句（按顺序执行）
    sql_statements = [
        # 创建测评记录表
        """
        CREATE TABLE IF NOT EXISTS student_learning_assessment (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
            answers JSONB NOT NULL,
            open_response TEXT,
            ai_evaluation TEXT NOT NULL,
            llm_config_id INTEGER REFERENCES llm_config(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        # 创建索引
        "CREATE INDEX IF NOT EXISTS idx_assessment_student ON student_learning_assessment(student_id)",
        "CREATE INDEX IF NOT EXISTS idx_assessment_created ON student_learning_assessment(created_at DESC)",
        # 创建档案表
        """
        CREATE TABLE IF NOT EXISTS student_learning_profile (
            id SERIAL PRIMARY KEY,
            student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
            latest_assessment_id INTEGER REFERENCES student_learning_assessment(id),
            total_assessments INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_student_profile UNIQUE(student_id)
        )
        """
    ]
    
    with engine.connect() as conn:
        for i, statement in enumerate(sql_statements, 1):
            try:
                print(f"执行语句 {i}/{len(sql_statements)}...")
                conn.execute(text(statement))
                conn.commit()
                print(f"✅ 语句 {i} 执行成功")
            except Exception as e:
                if 'already exists' in str(e):
                    print(f"⚠️  语句 {i} 跳过（表或索引已存在）")
                else:
                    print(f"❌ 语句 {i} 执行失败: {e}")
                    conn.rollback()
    
    print("\n" + "=" * 60)
    print("数据库迁移完成！")
    print("=" * 60)
    print("\n创建的表：")
    print("  ✅ student_learning_assessment (学习偏好测评记录表)")
    print("  ✅ student_learning_profile (学习偏好档案表)")
    print("\n")

if __name__ == "__main__":
    migrate()
