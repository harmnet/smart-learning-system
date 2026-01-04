"""
更新学生档案数据，分配班级和年级
"""
import asyncio
import sys
from pathlib import Path

# 添加backend目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.session import engine

async def update_student_profiles():
    """更新学生档案"""
    async with engine.begin() as conn:
        print("🔄 开始更新学生档案...")
        
        # 更新前20个学生 -> 班级ID 34, 年级2024
        result1 = await conn.execute(text("""
            UPDATE student_profiles 
            SET class_id = 34, grade = '2024'
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE username LIKE 'student1%' 
                AND role = 'student'
                ORDER BY id
                LIMIT 20
            )
        """))
        print(f"✅ 更新了 {result1.rowcount} 个学生到2024年级")
        
        # 更新接下来20个学生 -> 班级ID 35, 年级2023
        result2 = await conn.execute(text("""
            UPDATE student_profiles 
            SET class_id = 35, grade = '2023'
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE username LIKE 'student1%' 
                AND role = 'student'
                AND id NOT IN (
                    SELECT user_id FROM student_profiles WHERE grade = '2024'
                )
                ORDER BY id
                LIMIT 20
            )
        """))
        print(f"✅ 更新了 {result2.rowcount} 个学生到2023年级")
        
        # 更新接下来20个学生 -> 班级ID 36, 年级2025
        result3 = await conn.execute(text("""
            UPDATE student_profiles 
            SET class_id = 36, grade = '2025'
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE username LIKE 'student1%' 
                AND role = 'student'
                AND id NOT IN (
                    SELECT user_id FROM student_profiles WHERE grade IN ('2024', '2023')
                )
                ORDER BY id
                LIMIT 20
            )
        """))
        print(f"✅ 更新了 {result3.rowcount} 个学生到2025年级")
        
        # 剩余学生分配到2022年级
        result4 = await conn.execute(text("""
            UPDATE student_profiles 
            SET grade = '2022', class_id = 34
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE username LIKE 'student1%' 
                AND role = 'student'
                AND id NOT IN (
                    SELECT user_id FROM student_profiles WHERE grade IN ('2024', '2023', '2025')
                )
                ORDER BY id
                LIMIT 15
            )
        """))
        print(f"✅ 更新了 {result4.rowcount} 个学生到2022年级")
        
        # 剩余学生分配到2021年级
        result5 = await conn.execute(text("""
            UPDATE student_profiles 
            SET grade = '2021', class_id = 35
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE username LIKE 'student1%' 
                AND role = 'student'
                AND id NOT IN (
                    SELECT user_id FROM student_profiles WHERE grade IN ('2024', '2023', '2025', '2022')
                )
                ORDER BY id
                LIMIT 15
            )
        """))
        print(f"✅ 更新了 {result5.rowcount} 个学生到2021年级")
        
        # 查看更新后的数据分布
        print("\n📊 年级分布统计:")
        result = await conn.execute(text("""
            SELECT grade, COUNT(*) as student_count
            FROM student_profiles
            WHERE grade IS NOT NULL
            GROUP BY grade
            ORDER BY grade
        """))
        for row in result:
            print(f"   {row.grade}年级: {row.student_count}人")
        
        print("\n📊 班级分布统计:")
        result = await conn.execute(text("""
            SELECT c.name as class_name, c.grade, COUNT(sp.id) as student_count
            FROM student_profiles sp
            JOIN classes c ON sp.class_id = c.id
            GROUP BY c.id, c.name, c.grade
            ORDER BY c.grade, c.name
        """))
        for row in result:
            print(f"   {row.class_name} ({row.grade}年级): {row.student_count}人")

if __name__ == "__main__":
    asyncio.run(update_student_profiles())
    print("\n✨ 完成!")

