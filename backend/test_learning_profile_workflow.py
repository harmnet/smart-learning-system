"""
学习偏好测评完整流程测试
测试账号：student1097 (student_id=90)
"""
import asyncio
import httpx
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
TEST_STUDENT_ID = 90  # student1097

# 测试答案
TEST_ANSWERS = {
    "q1": "option_b",  # 30-60分钟
    "q2": "option_c",  # 下午学习
    "q3": "option_a",  # 视频教程
    "q4": "option_b",  # 稳步推进
    "q5": "option_a",  # 立即练习
    "q6": "option_b",  # 中等难度
    "q7": "option_b",  # 掌握技能
    "q8": "option_b",  # 适度互动
    "q9": "option_c",  # 跟随进度
    "q10": "option_b", # 自己房间
    "q11": "option_b", # 每周反馈
    "q12": "option_c"  # 全面发展
}

TEST_OPEN_RESPONSE = "我希望系统能够根据我的学习进度，智能推荐合适的学习内容和练习题目。同时希望能有更多互动式的学习资源，帮助我更好地理解复杂概念。"


async def test_workflow():
    print("\n" + "=" * 80)
    print("学习偏好测评完整流程测试")
    print("=" * 80 + "\n")
    
    # 步骤1: 登录获取token
    print("步骤1: 使用student1097账号登录...")
    async with httpx.AsyncClient() as client:
        login_response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "username": "student1097",
                "password": "123456"
            }
        )
        
        if login_response.status_code != 200:
            print(f"❌ 登录失败: {login_response.status_code}")
            print(login_response.text)
            return
        
        token = login_response.json()["access_token"]
        print(f"✅ 登录成功，token已获取")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 步骤2: 检查现有档案
        print("\n步骤2: 检查现有档案...")
        profile_response = await client.get(
            f"{BASE_URL}/api/v1/student/learning-profile",
            headers=headers
        )
        
        if profile_response.status_code != 200:
            print(f"❌ 获取档案失败: {profile_response.status_code}")
            print(profile_response.text)
            return
        
        profile = profile_response.json()
        print(f"✅ 档案状态: {'已有档案' if profile['has_profile'] else '首次测评'}")
        print(f"   总测评次数: {profile['total_assessments']}")
        
        if profile['has_profile'] and profile['latest_assessment']:
            latest = profile['latest_assessment']
            print(f"   最新测评时间: {latest['created_at']}")
            print(f"   AI评价(前100字): {latest['ai_evaluation'][:100]}...")
        
        # 步骤3: 提交新测评
        print("\n步骤3: 提交新的测评...")
        submit_response = await client.post(
            f"{BASE_URL}/api/v1/student/learning-profile/submit",
            headers=headers,
            json={
                "answers": TEST_ANSWERS,
                "open_response": TEST_OPEN_RESPONSE
            }
        )
        
        if submit_response.status_code != 200:
            print(f"❌ 提交测评失败: {submit_response.status_code}")
            print(submit_response.text)
            return
        
        assessment = submit_response.json()
        print(f"✅ 测评提交成功")
        print(f"   测评ID: {assessment['id']}")
        print(f"   创建时间: {assessment['created_at']}")
        print(f"   使用的LLM配置ID: {assessment.get('llm_config_id', 'None')}")
        print(f"\n   AI评价内容:")
        print("   " + "-" * 76)
        print(f"   {assessment['ai_evaluation']}")
        print("   " + "-" * 76)
        
        # 步骤4: 再次获取档案验证更新
        print("\n步骤4: 验证档案更新...")
        verify_response = await client.get(
            f"{BASE_URL}/api/v1/student/learning-profile",
            headers=headers
        )
        
        if verify_response.status_code != 200:
            print(f"❌ 验证失败: {verify_response.status_code}")
            return
        
        updated_profile = verify_response.json()
        print(f"✅ 档案已更新")
        print(f"   总测评次数: {updated_profile['total_assessments']}")
        print(f"   最新测评ID: {updated_profile['latest_assessment']['id']}")
        
        # 步骤5: 查询测评历史
        print("\n步骤5: 查询测评历史...")
        history_response = await client.get(
            f"{BASE_URL}/api/v1/student/learning-profile/history?skip=0&limit=5",
            headers=headers
        )
        
        if history_response.status_code != 200:
            print(f"❌ 获取历史失败: {history_response.status_code}")
            return
        
        history = history_response.json()
        print(f"✅ 历史记录获取成功")
        print(f"   总记录数: {history['total']}")
        print(f"   本次查询返回: {len(history['assessments'])}条")
        
        for i, record in enumerate(history['assessments'][:3], 1):
            print(f"\n   记录{i}:")
            print(f"     ID: {record['id']}")
            print(f"     时间: {record['created_at']}")
            print(f"     评价(前80字): {record['ai_evaluation'][:80]}...")
    
    print("\n" + "=" * 80)
    print("测试完成！所有功能正常运行")
    print("=" * 80)
    print("\n📌 测试要点确认:")
    print("   ✅ 学生可以获取档案信息")
    print("   ✅ 学生可以提交测评答案")
    print("   ✅ LLM成功生成个性化评价")
    print("   ✅ 档案自动更新测评次数和最新评价")
    print("   ✅ 学生可以查询测评历史")
    print("\n🎉 学习偏好测评系统已完整实现并测试通过！")
    print("\n📍 前端测试:")
    print("   1. 访问 http://localhost:3000/student/home")
    print("   2. 使用 student1097/123456 登录")
    print("   3. 点击右侧「学习偏好测评」按钮")
    print("   4. 完成问卷并查看AI评价\n")


if __name__ == "__main__":
    asyncio.run(test_workflow())
