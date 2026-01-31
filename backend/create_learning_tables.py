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

        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS student_imported_exam_score (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES sys_user(id),
                course_id INTEGER NOT NULL REFERENCES course(id),
                exam_type VARCHAR(20) NOT NULL,
                score FLOAT NOT NULL,
                total_score FLOAT DEFAULT 100,
                imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))

        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS course_grade (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES sys_user(id),
                course_id INTEGER NOT NULL REFERENCES course(id),
                final_score NUMERIC(5, 2),
                breakdown JSONB,
                is_published BOOLEAN DEFAULT FALSE,
                published_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))

        await session.execute(text("""
            CREATE TABLE IF NOT EXISTS course_grade_publish_history (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES course(id),
                class_id INTEGER REFERENCES sys_class(id),
                student_id INTEGER REFERENCES sys_user(id),
                action VARCHAR(20) NOT NULL,
                scope VARCHAR(20) NOT NULL,
                operator_id INTEGER NOT NULL REFERENCES sys_user(id),
                remark TEXT,
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

        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_imported_exam_score_student_course
            ON student_imported_exam_score(student_id, course_id);
        """))

        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_course_grade_student_course
            ON course_grade(student_id, course_id);
        """))

        await session.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_course_grade_publish_history_course
            ON course_grade_publish_history(course_id);
        """))
        
        await session.commit()
        print("✅ 学生学习数据表创建成功！")


if __name__ == "__main__":
    asyncio.run(create_tables())
