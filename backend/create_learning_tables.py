"""
创建学生学习数据相关表
"""
import asyncio
from sqlalchemy import text
from app.db.session import get_db


async def create_tables():
    async for session in get_db():
        # 创建学生学习行为记录表
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS student_learning_behavior (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES sys_user(id),
                course_id INTEGER NOT NULL REFERENCES course(id),
                chapter_id INTEGER REFERENCES course_chapter(id),
                resource_id INTEGER,
                resource_type VARCHAR(50),
                behavior_type VARCHAR(50) NOT NULL,
                duration_seconds INTEGER DEFAULT 0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # 创建学生学习时长统计表
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS student_study_duration (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES sys_user(id),
                course_id INTEGER NOT NULL REFERENCES course(id),
                study_date TIMESTAMP NOT NULL,
                duration_minutes INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # 创建学生考试成绩记录表
        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS student_exam_score (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES sys_user(id),
                course_id INTEGER NOT NULL REFERENCES course(id),
                exam_paper_id INTEGER NOT NULL REFERENCES exam_paper(id),
                exam_id INTEGER REFERENCES exam(id),
                score FLOAT NOT NULL,
                total_score FLOAT DEFAULT 100,
                exam_date TIMESTAMP NOT NULL,
                is_submitted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # 创建索引
        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_learning_behavior_student_course 
            ON student_learning_behavior(student_id, course_id);
        """))
        
        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_study_duration_student_course 
            ON student_study_duration(student_id, course_id);
        """))
        
        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_exam_score_student_course 
            ON student_exam_score(student_id, course_id);
        """))
        
        await session.commit()
        print("✅ 学生学习数据表创建成功！")


if __name__ == "__main__":
    asyncio.run(create_tables())

