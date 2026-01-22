"""
执行学生作业提交表迁移
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings


async def run_migration():
    """执行数据库迁移"""
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    # 读取SQL文件
    with open('migrations/create_student_homework_tables.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # 分割SQL语句（按分号分割，但要处理函数定义）
    statements = []
    current_statement = []
    in_function = False
    
    for line in sql_content.split('\n'):
        stripped = line.strip()
        
        # 跳过空行和纯注释行
        if not stripped or stripped.startswith('--'):
            continue
        
        # 检测函数定义开始
        if 'CREATE OR REPLACE FUNCTION' in line or 'CREATE FUNCTION' in line:
            in_function = True
        
        current_statement.append(line)
        
        # 检测函数定义结束
        if in_function and '$$ LANGUAGE' in line:
            in_function = False
            statements.append('\n'.join(current_statement))
            current_statement = []
        # 普通语句以分号结束
        elif not in_function and stripped.endswith(';'):
            statements.append('\n'.join(current_statement))
            current_statement = []
    
    # 添加最后一个语句（如果有）
    if current_statement:
        statements.append('\n'.join(current_statement))
    
    # 执行每个语句
    async with engine.begin() as conn:
        for i, statement in enumerate(statements, 1):
            if statement.strip():
                try:
                    print(f'执行语句 {i}/{len(statements)}: {statement[:60].strip()}...')
                    await conn.execute(text(statement))
                except Exception as e:
                    print(f'警告: 语句执行失败（可能表已存在）: {e}')
    
    await engine.dispose()
    print('\n✓ 数据库迁移完成：学生作业提交表已创建')


if __name__ == '__main__':
    asyncio.run(run_migration())
