"""
为学习偏好测评记录表添加tags字段
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def add_tags_column():
    print("\n" + "=" * 60)
    print("为student_learning_assessment表添加tags字段")
    print("=" * 60 + "\n")
    
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI.replace('+asyncpg', ''))
    
    with engine.connect() as conn:
        try:
            print("添加tags字段...")
            conn.execute(text("""
                ALTER TABLE student_learning_assessment 
                ADD COLUMN IF NOT EXISTS tags TEXT[]
            """))
            conn.commit()
            print("✅ tags字段添加成功\n")
            
            # 验证
            result = conn.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'student_learning_assessment' 
                AND column_name = 'tags'
            """))
            if result.fetchone():
                print("✅ 验证成功：tags字段已存在于表中")
            else:
                print("⚠️  验证失败：tags字段未找到")
                
        except Exception as e:
            print(f"❌ 错误: {e}")
            conn.rollback()
    
    print("\n" + "=" * 60)
    print("数据库更新完成")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    add_tags_column()
