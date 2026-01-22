#!/usr/bin/env python3
"""
修复用户密码 - 将旧的hash格式更新为bcrypt格式
默认密码: password123
"""
import sys
import os
import bcrypt

# 添加app目录到Python路径
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """生成bcrypt密码哈希"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def main():
    # 创建数据库连接
    DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    engine = create_engine(DATABASE_URL)
    
    # 默认密码
    default_password = "password123"
    hashed_password = get_password_hash(default_password)
    
    print(f"🔐 生成的bcrypt hash示例: {hashed_password[:20]}...")
    print(f"📝 将更新所有用户密码为: {default_password}")
    print()
    
    with engine.connect() as conn:
        # 获取所有用户
        result = conn.execute(text("SELECT id, username, role FROM sys_user ORDER BY id"))
        users = result.fetchall()
        
        print(f"找到 {len(users)} 个用户:")
        for user in users:
            print(f"  - ID: {user[0]}, 用户名: {user[1]}, 角色: {user[2]}")
        print()
        
        # 确认
        confirm = input("确认更新所有用户密码？(yes/no): ")
        if confirm.lower() != 'yes':
            print("❌ 取消操作")
            return
        
        # 更新所有用户的密码
        for user in users:
            user_id = user[0]
            username = user[1]
            # 为每个用户生成新的hash（每次都不同，更安全）
            new_hash = get_password_hash(default_password)
            
            conn.execute(
                text("UPDATE sys_user SET hashed_password = :hash WHERE id = :id"),
                {"hash": new_hash, "id": user_id}
            )
            print(f"✅ 更新用户: {username} (ID: {user_id})")
        
        conn.commit()
        print()
        print("🎉 所有用户密码已更新！")
        print(f"📌 默认密码: {default_password}")
        print("⚠️  建议用户登录后立即修改密码！")

if __name__ == "__main__":
    main()
