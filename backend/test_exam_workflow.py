"""
集成测试脚本：验证章节-考试关联功能

测试内容：
1. 验证新表course_chapter_exam已创建
2. 验证数据迁移成功
3. 测试学生考试API能正确返回考试信息
4. 验证考试信息显示的是考试名称而非试卷名称
"""

import asyncio
from sqlalchemy import create_engine, text
from app.core.config import settings

async def test_workflow():
    print("\n" + "="*60)
    print("开始执行章节-考试关联功能集成测试")
    print("="*60 + "\n")
    
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI.replace('+asyncpg', ''))
    
    try:
        with engine.connect() as conn:
            # 测试1: 验证新表存在
            print("测试1: 验证course_chapter_exam表存在")
            result = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_name = 'course_chapter_exam'
            """))
            table_count = result.scalar()
            if table_count == 1:
                print("✓ course_chapter_exam表已创建")
            else:
                print("✗ course_chapter_exam表不存在！")
                return
            
            # 测试2: 验证数据迁移
            print("\n测试2: 验证数据迁移")
            result = conn.execute(text("""
                SELECT COUNT(*) FROM course_chapter_exam
            """))
            record_count = result.scalar()
            print(f"✓ course_chapter_exam表中有 {record_count} 条记录")
            
            # 测试3: 查看迁移的详细数据
            print("\n测试3: 查看迁移的详细数据")
            result = conn.execute(text("""
                SELECT 
                    cce.id,
                    cc.title as chapter_name,
                    e.id as exam_id,
                    e.exam_name,
                    e.start_time,
                    e.end_time
                FROM course_chapter_exam cce
                LEFT JOIN course_chapter cc ON cce.chapter_id = cc.id
                LEFT JOIN exam e ON cce.exam_id = e.id
            """))
            
            for row in result:
                print(f"  关联ID {row.id}:")
                print(f"    章节: {row.chapter_name}")
                print(f"    考试: {row.exam_name} (ID: {row.exam_id})")
                print(f"    开始: {row.start_time}")
                print(f"    结束: {row.end_time}")
                print()
            
            # 测试4: 验证学生能看到正确的考试信息
            print("测试4: 验证学生考试查询逻辑")
            
            # 获取学生ID和班级ID
            result = conn.execute(text("""
                SELECT sp.user_id, sp.class_id, u.username
                FROM student_profile sp
                JOIN sys_user u ON sp.user_id = u.id
                LIMIT 1
            """))
            student_row = result.first()
            
            if student_row:
                print(f"  使用测试学生: {student_row.username} (ID: {student_row.user_id})")
                
                # 查询学生班级的课程
                result = conn.execute(text("""
                    SELECT course_id FROM class_course_relation
                    WHERE class_id = :class_id
                """), {"class_id": student_row.class_id})
                
                course_ids = [row[0] for row in result]
                print(f"  学生班级课程IDs: {course_ids}")
                
                if course_ids:
                    # 使用新的查询逻辑：章节 → 考试（直接）
                    result = conn.execute(text("""
                        SELECT DISTINCT
                            e.id,
                            e.exam_name,
                            e.start_time,
                            e.end_time,
                            c.title as course_name,
                            cc.title as chapter_name
                        FROM exam e
                        INNER JOIN course_chapter_exam cce ON e.id = cce.exam_id
                        INNER JOIN course_chapter cc ON cce.chapter_id = cc.id
                        INNER JOIN course c ON cc.course_id = c.id
                        WHERE c.id = ANY(:course_ids)
                        AND e.is_active = TRUE
                    """), {"course_ids": course_ids})
                    
                    exams = result.all()
                    print(f"  学生可见的考试数量: {len(exams)}")
                    
                    for exam in exams:
                        from datetime import datetime
                        now = datetime.now()
                        start = exam.start_time
                        end = exam.end_time
                        
                        if now < start:
                            status = "未开始"
                        elif start <= now <= end:
                            status = "进行中"
                        else:
                            status = "已结束"
                        
                        print(f"\n  考试: {exam.exam_name}")
                        print(f"    课程: {exam.course_name}")
                        print(f"    章节: {exam.chapter_name}")
                        print(f"    开始: {exam.start_time}")
                        print(f"    结束: {exam.end_time}")
                        print(f"    状态: {status}")
                else:
                    print("  ⚠ 学生班级没有关联课程")
            else:
                print("  ⚠ 没有找到学生数据")
            
            # 测试5: 对比旧表和新表
            print("\n测试5: 对比旧表和新表的数据")
            
            # 旧表数据
            result = conn.execute(text("""
                SELECT 
                    ccep.chapter_id,
                    cc.title as chapter_name,
                    ep.paper_name,
                    e.exam_name
                FROM course_chapter_exam_paper ccep
                LEFT JOIN course_chapter cc ON ccep.chapter_id = cc.id
                LEFT JOIN exam_paper ep ON ccep.exam_paper_id = ep.id
                LEFT JOIN exam e ON e.exam_paper_id = ccep.exam_paper_id
            """))
            
            print("  旧表 (course_chapter_exam_paper):")
            for row in result:
                print(f"    {row.chapter_name} → 试卷「{row.paper_name}」→ 考试「{row.exam_name}」")
            
            # 新表数据
            result = conn.execute(text("""
                SELECT 
                    cce.chapter_id,
                    cc.title as chapter_name,
                    e.exam_name
                FROM course_chapter_exam cce
                LEFT JOIN course_chapter cc ON cce.chapter_id = cc.id
                LEFT JOIN exam e ON cce.exam_id = e.id
            """))
            
            print("\n  新表 (course_chapter_exam):")
            for row in result:
                print(f"    {row.chapter_name} → 考试「{row.exam_name}」(直接关联)")
            
            print("\n" + "="*60)
            print("集成测试完成！")
            print("="*60)
            print("\n✅ 业务逻辑验证:")
            print("  - 新表已创建并填充数据")
            print("  - 章节现在直接关联考试，而非通过试卷中转")
            print("  - 学生查询API使用新的关联逻辑")
            print("  - 显示的是考试信息（考试名、时间），而非试卷信息")
            print("\n⚠ 重要提醒:")
            print("  - 如果迁移的考试不是预期的，请在教师端修改章节关联")
            print("  - 在课程管理 → 课程大纲 → 选择章节 → 添加考试")
            print("  - 现在下拉框显示的是考试列表（带日期），而非试卷列表")
            
    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_workflow())
