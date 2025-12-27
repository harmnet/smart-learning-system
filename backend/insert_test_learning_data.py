"""
插入测试学习数据
"""
import asyncio
from sqlalchemy import text
from datetime import datetime, timedelta
import random
from app.db.session import get_db


async def insert_test_data():
    async for session in get_db():
        # 获取学生ID和课程ID
        result = await session.execute(text("SELECT id FROM sys_user WHERE role = 'student' LIMIT 1"))
        student = result.fetchone()
        if not student:
            print("❌ 未找到学生用户")
            return
        
        student_id = student[0]
        
        result = await session.execute(text("SELECT id FROM course LIMIT 1"))
        course = result.fetchone()
        if not course:
            print("❌ 未找到课程")
            return
        
        course_id = course[0]
        
        print(f"✅ 找到学生ID: {student_id}, 课程ID: {course_id}")
        
        # 插入学习行为记录
        behaviors = [
            ("view_resource", "查看了教学资源：Python基础入门", 300),
            ("view_resource", "查看了参考资料：Python官方文档", 600),
            ("complete_section", "完成了第一章第一节", 0),
            ("view_resource", "查看了视频：变量和数据类型", 900),
            ("view_resource", "查看了PPT：函数定义", 450),
        ]
        
        for i, (behavior_type, description, duration) in enumerate(behaviors):
            created_at = datetime.now() - timedelta(hours=i*2)
            await session.execute(text("""
                INSERT INTO student_learning_behavior 
                (student_id, course_id, behavior_type, description, duration_seconds, created_at)
                VALUES (:student_id, :course_id, :behavior_type, :description, :duration, :created_at)
            """), {
                "student_id": student_id,
                "course_id": course_id,
                "behavior_type": behavior_type,
                "description": description,
                "duration": duration,
                "created_at": created_at
            })
        
        print("✅ 插入了5条学习行为记录")
        
        # 插入学习时长数据（最近30天）
        for i in range(30):
            study_date = datetime.now() - timedelta(days=i)
            duration_minutes = random.randint(0, 120) if i < 20 else 0  # 最近20天有数据
            
            await session.execute(text("""
                INSERT INTO student_study_duration 
                (student_id, course_id, study_date, duration_minutes)
                VALUES (:student_id, :course_id, :study_date, :duration_minutes)
            """), {
                "student_id": student_id,
                "course_id": course_id,
                "study_date": study_date,
                "duration_minutes": duration_minutes
            })
        
        print("✅ 插入了30天的学习时长数据")
        
        # 插入考试成绩数据
        result = await session.execute(text("SELECT id FROM exam_paper LIMIT 1"))
        exam_paper = result.fetchone()
        
        if exam_paper:
            exam_paper_id = exam_paper[0]
            
            scores = [85, 78, 92, 88, 95, 82, 90, 87, 93, 89]
            for i, score in enumerate(scores):
                exam_date = datetime.now() - timedelta(days=i*3)
                await session.execute(text("""
                    INSERT INTO student_exam_score 
                    (student_id, course_id, exam_paper_id, score, total_score, exam_date, is_submitted)
                    VALUES (:student_id, :course_id, :exam_paper_id, :score, 100, :exam_date, TRUE)
                """), {
                    "student_id": student_id,
                    "course_id": course_id,
                    "exam_paper_id": exam_paper_id,
                    "score": score,
                    "exam_date": exam_date
                })
            
            print("✅ 插入了10条考试成绩记录")
        else:
            print("⚠️ 未找到试卷，跳过考试成绩数据插入")
        
        await session.commit()
        print("\n🎉 测试数据插入完成！")


if __name__ == "__main__":
    asyncio.run(insert_test_data())

