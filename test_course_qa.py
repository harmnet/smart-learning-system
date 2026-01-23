#!/usr/bin/env python3
"""
课程问答功能完整测试脚本
"""
import asyncio
import httpx
import sys
import bcrypt

async def test_course_qa():
    """测试课程问答功能"""
    base_url = 'http://localhost:8000/api/v1'
    
    # 先重置student001的密码
    print("🔐 重置student001的密码...")
    sys.path.insert(0, 'backend')
    from sqlalchemy import text
    from app.db.session import AsyncSessionLocal
    
    async with AsyncSessionLocal() as db:
        # 生成新密码hash
        password = "password123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        await db.execute(
            text("UPDATE sys_user SET hashed_password = :hash WHERE username = 'student001'"),
            {"hash": hashed}
        )
        await db.commit()
        print("✓ 密码已重置为: password123")
    
    # 测试API
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. 登录
        print("\n1️⃣ 测试登录...")
        login_response = await client.post(
            f'{base_url}/auth/login',
            data={'username': 'student001', 'password': 'password123'}
        )
        if login_response.status_code != 200:
            print(f"   ✗ 登录失败: {login_response.text}")
            return False
        
        token = login_response.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        print("   ✓ 登录成功")
        
        # 2. 获取或创建会话
        print("\n2️⃣ 测试获取或创建会话...")
        session_response = await client.get(
            f'{base_url}/student/courses/1/qa/session',
            headers=headers
        )
        print(f"   状态码: {session_response.status_code}")
        if session_response.status_code != 200:
            print(f"   ✗ 错误: {session_response.text}")
            return False
        
        session = session_response.json()
        print(f"   ✓ 会话ID: {session.get('id')}, 课程ID: {session.get('course_id')}")
        print(f"   标题: {session.get('title')}, 状态: {session.get('status')}")
        
        # 3. 获取消息列表（初始应该为空）
        print("\n3️⃣ 测试获取消息列表（初始）...")
        messages_response = await client.get(
            f'{base_url}/student/courses/1/qa/messages',
            headers=headers
        )
        print(f"   状态码: {messages_response.status_code}")
        if messages_response.status_code != 200:
            print(f"   ✗ 错误: {messages_response.text}")
            return False
        
        messages = messages_response.json()
        print(f"   ✓ 消息数量: {len(messages)}")
        
        # 4. 发送消息
        print("\n4️⃣ 测试发送消息...")
        test_question = "什么是Python编程语言？"
        send_response = await client.post(
            f'{base_url}/student/courses/1/qa/messages',
            headers=headers,
            json={'content': test_question}
        )
        print(f"   状态码: {send_response.status_code}")
        if send_response.status_code != 200:
            print(f"   ✗ 错误: {send_response.text}")
            return False
        
        new_messages = send_response.json()
        print(f"   ✓ 收到 {len(new_messages)} 条消息")
        for i, msg in enumerate(new_messages, 1):
            sender_type = msg.get('sender_type')
            content = msg.get('content', '')[:80]
            sender_id = msg.get('sender_id')
            print(f"   消息{i}: [{sender_type}] sender_id={sender_id}")
            print(f"           内容: {content}...")
        
        # 5. 再次获取消息列表（应该包含新消息）
        print("\n5️⃣ 再次获取消息列表...")
        messages_response2 = await client.get(
            f'{base_url}/student/courses/1/qa/messages',
            headers=headers
        )
        if messages_response2.status_code == 200:
            messages2 = messages_response2.json()
            print(f"   ✓ 消息数量: {len(messages2)}")
            for msg in messages2:
                print(f"      - [{msg.get('sender_type')}] {msg.get('content', '')[:50]}...")
        
        # 6. 获取教师列表
        print("\n6️⃣ 测试获取教师列表...")
        teachers_response = await client.get(
            f'{base_url}/student/courses/1/qa/teachers',
            headers=headers
        )
        print(f"   状态码: {teachers_response.status_code}")
        if teachers_response.status_code == 200:
            teachers_data = teachers_response.json()
            teachers = teachers_data.get('teachers', [])
            print(f"   ✓ 教师数量: {len(teachers)}")
            for teacher in teachers:
                print(f"      - {teacher.get('name')} (ID: {teacher.get('id')}, 用户名: {teacher.get('username')})")
        else:
            print(f"   ✗ 错误: {teachers_response.text}")
        
        # 7. 测试发送消息给教师（如果有教师和消息）
        if len(teachers) > 0 and len(messages2) > 0:
            # 找到AI消息
            ai_message = None
            for msg in messages2:
                if msg.get('sender_type') == 'ai' and not msg.get('is_sent_to_teacher'):
                    ai_message = msg
                    break
            
            if ai_message:
                print("\n7️⃣ 测试发送消息给教师...")
                teacher_id = teachers[0].get('id')
                send_to_teacher_response = await client.post(
                    f'{base_url}/student/courses/1/qa/messages/{ai_message.get("id")}/send-to-teacher',
                    headers=headers,
                    json={'teacher_ids': [teacher_id]}
                )
                print(f"   状态码: {send_to_teacher_response.status_code}")
                if send_to_teacher_response.status_code == 200:
                    updated_msg = send_to_teacher_response.json()
                    print(f"   ✓ 消息已发送给教师")
                    print(f"   is_sent_to_teacher: {updated_msg.get('is_sent_to_teacher')}")
                    print(f"   teacher_ids: {updated_msg.get('teacher_ids')}")
                else:
                    print(f"   ✗ 错误: {send_to_teacher_response.text}")
        
        print("\n✅ 所有测试完成！")
        return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_course_qa())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
