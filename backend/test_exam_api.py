import asyncio
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings
from datetime import datetime

async def test_exam_status():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI.replace('+asyncpg', ''))
    
    with engine.connect() as conn:
        # 查询考试数据
        result = conn.execute(text("""
            SELECT e.id, e.exam_name, e.start_time, e.end_time, e.is_active
            FROM exam e
            WHERE e.exam_name LIKE '%期末%'
        """))
        
        now = datetime.now()
        print(f"\n当前时间: {now}")
        print(f"\n考试信息:")
        
        for row in result:
            exam_id = row[0]
            exam_name = row[1]
            start_time = row[2]
            end_time = row[3]
            is_active = row[4]
            
            print(f"\n考试ID: {exam_id}")
            print(f"考试名称: {exam_name}")
            print(f"开始时间: {start_time}")
            print(f"结束时间: {end_time}")
            print(f"是否激活: {is_active}")
            
            # 判断状态
            if now < start_time:
                status = "not_started"
                status_text = "考试未开始"
            elif start_time <= now <= end_time:
                status = "in_progress"
                status_text = "考试进行中"
            else:
                status = "expired"
                status_text = "考试已结束"
            
            print(f"计算的状态: {status} ({status_text})")
            print(f"  now < start_time: {now < start_time}")
            print(f"  start_time <= now <= end_time: {start_time <= now <= end_time}")
            print(f"  now > end_time: {now > end_time}")

if __name__ == "__main__":
    asyncio.run(test_exam_status())
