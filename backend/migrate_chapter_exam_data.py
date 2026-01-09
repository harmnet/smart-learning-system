"""
数据迁移脚本：将章节-试卷关联转换为章节-考试关联

业务逻辑变更：
- 旧逻辑：课程章节 → 试卷 → 考试
- 新逻辑：课程章节 → 考试（考试已关联试卷）

迁移步骤：
1. 创建新的course_chapter_exam表
2. 从course_chapter_exam_paper表读取现有关联
3. 通过exam.exam_paper_id找到对应的考试
4. 将数据插入course_chapter_exam表
5. 保留旧表数据作为备份
"""

import asyncio
from sqlalchemy import create_engine, text
from app.core.config import settings

async def migrate_data():
    """执行数据迁移"""
    print("\n" + "="*60)
    print("开始执行章节-考试关联数据迁移")
    print("="*60 + "\n")
    
    # 使用同步引擎（因为使用text()执行原生SQL）
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI.replace('+asyncpg', ''))
    
    try:
        with engine.connect() as conn:
            # 步骤1: 创建新表
            print("步骤1: 创建course_chapter_exam表...")
            try:
                with open('/Users/duanxiaofei/Desktop/数珩智学/backend/migrations/add_course_chapter_exam_table.sql', 'r') as f:
                    sql_script = f.read()
                    conn.execute(text(sql_script))
                    conn.commit()
                print("✓ 表创建成功")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print("✓ 表已存在，跳过创建")
                else:
                    raise
            
            # 步骤2: 检查现有数据
            print("\n步骤2: 检查现有章节-试卷关联数据...")
            result = conn.execute(text("""
                SELECT COUNT(*) as count 
                FROM course_chapter_exam_paper
            """))
            old_count = result.scalar()
            print(f"✓ 找到 {old_count} 条章节-试卷关联记录")
            
            # 步骤3: 检查可以迁移的数据
            print("\n步骤3: 分析可迁移的数据...")
            result = conn.execute(text("""
                SELECT 
                    ccep.id,
                    ccep.chapter_id,
                    ccep.exam_paper_id,
                    cc.title as chapter_name,
                    ep.paper_name,
                    e.id as exam_id,
                    e.exam_name
                FROM course_chapter_exam_paper ccep
                LEFT JOIN course_chapter cc ON ccep.chapter_id = cc.id
                LEFT JOIN exam_paper ep ON ccep.exam_paper_id = ep.id
                LEFT JOIN exam e ON e.exam_paper_id = ccep.exam_paper_id
            """))
            
            migration_data = []
            skipped_no_exam = []
            
            for row in result:
                if row.exam_id:
                    migration_data.append({
                        'chapter_id': row.chapter_id,
                        'exam_id': row.exam_id,
                        'chapter_name': row.chapter_name,
                        'exam_name': row.exam_name
                    })
                else:
                    skipped_no_exam.append({
                        'chapter_id': row.chapter_id,
                        'chapter_name': row.chapter_name,
                        'paper_name': row.paper_name
                    })
            
            print(f"✓ 可迁移记录: {len(migration_data)} 条")
            if skipped_no_exam:
                print(f"⚠ 跳过记录: {len(skipped_no_exam)} 条（这些试卷没有关联的考试）")
                for skip in skipped_no_exam:
                    print(f"  - 章节: {skip['chapter_name']} → 试卷: {skip['paper_name']} (无对应考试)")
            
            # 步骤4: 执行迁移
            if migration_data:
                print(f"\n步骤4: 开始迁移 {len(migration_data)} 条记录...")
                
                # 显示迁移详情
                for data in migration_data:
                    print(f"  迁移: 章节「{data['chapter_name']}」→ 考试「{data['exam_name']}」")
                
                # 执行批量插入
                result = conn.execute(text("""
                    INSERT INTO course_chapter_exam (chapter_id, exam_id, created_at)
                    SELECT DISTINCT ccep.chapter_id, e.id, ccep.created_at
                    FROM course_chapter_exam_paper ccep
                    INNER JOIN exam e ON e.exam_paper_id = ccep.exam_paper_id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM course_chapter_exam cce 
                        WHERE cce.chapter_id = ccep.chapter_id AND cce.exam_id = e.id
                    )
                """))
                
                migrated_count = result.rowcount
                conn.commit()
                print(f"✓ 成功迁移 {migrated_count} 条记录")
            else:
                print("\n步骤4: 没有需要迁移的数据")
            
            # 步骤5: 验证迁移结果
            print("\n步骤5: 验证迁移结果...")
            result = conn.execute(text("""
                SELECT COUNT(*) as count 
                FROM course_chapter_exam
            """))
            new_count = result.scalar()
            print(f"✓ course_chapter_exam表中现有 {new_count} 条记录")
            
            # 显示详细的迁移结果
            print("\n迁移详情：")
            result = conn.execute(text("""
                SELECT 
                    cce.id,
                    cc.title as chapter_name,
                    e.exam_name,
                    e.start_time
                FROM course_chapter_exam cce
                LEFT JOIN course_chapter cc ON cce.chapter_id = cc.id
                LEFT JOIN exam e ON cce.exam_id = e.id
                ORDER BY cce.id
            """))
            
            for row in result:
                print(f"  ID {row.id}: {row.chapter_name} → {row.exam_name} ({row.start_time})")
            
            print("\n" + "="*60)
            print("数据迁移完成！")
            print("="*60)
            print("\n注意事项：")
            print("- 旧表course_chapter_exam_paper已保留作为备份")
            print("- 新表course_chapter_exam已创建并填充数据")
            print("- 后续代码将使用新表进行章节-考试关联")
            
    except Exception as e:
        print(f"\n❌ 迁移失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate_data())
