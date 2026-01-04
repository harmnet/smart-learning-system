"""
通过API更新学生的班级信息，使热力图更有意义
"""
import asyncio
import httpx

# API配置
BASE_URL = "http://localhost:8000"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

async def get_token():
    """获取管理员token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            raise Exception(f"Login failed: {response.text}")

async def get_students(token):
    """获取所有学生"""
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{BASE_URL}/api/v1/admin/students?skip=0&limit=200",
            headers=headers
        )
        if response.status_code == 200:
            return response.json()["items"]
        else:
            print(f"获取学生失败: {response.status_code} - {response.text}")
            return []

async def update_student(token, student_id, class_id):
    """更新学生的班级"""
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.put(
                f"{BASE_URL}/api/v1/admin/students/{student_id}",
                headers=headers,
                json={"class_id": class_id}
            )
            if response.status_code == 200:
                return True, None
            else:
                return False, response.text
        except Exception as e:
            return False, str(e)

async def main():
    """主函数"""
    print("🚀 开始更新学生班级信息...")
    
    # 获取token
    print("📝 登录获取token...")
    token = await get_token()
    print("✅ Token获取成功")
    
    # 获取学生列表
    print("👥 获取学生列表...")
    students = await get_students(token)
    print(f"✅ 找到 {len(students)} 个学生")
    
    # 过滤出用户名以student10开头的学生
    target_students = [s for s in students if s.get("username", "").startswith("student10")]
    print(f"✅ 找到 {len(target_students)} 个需要更新的学生")
    
    if len(target_students) == 0:
        print("⚠️ 没有找到需要更新的学生")
        return
    
    # 班级分配策略
    # 班级ID: 34 (市场营销2401 - 2024级)
    # 班级ID: 35 (计科2301 - 2023级)
    # 班级ID: 36 (计科2501 - 2025级)
    
    class_distribution = [
        (34, 30),  # 前30个学生分配到班级34 (2024级)
        (35, 30),  # 接下来30个学生分配到班级35 (2023级)
        (36, 30),  # 再30个学生分配到班级36 (2025级)
    ]
    
    success_count = 0
    fail_count = 0
    current_index = 0
    
    for class_id, count in class_distribution:
        print(f"\n📚 分配学生到班级 {class_id}...")
        for i in range(count):
            if current_index >= len(target_students):
                break
            
            student = target_students[current_index]
            success, error = await update_student(token, student["id"], class_id)
            
            if success:
                success_count += 1
                if (current_index + 1) % 10 == 0:
                    print(f"✅ 已更新 {current_index + 1}/{len(target_students)} 个学生")
            else:
                fail_count += 1
                print(f"❌ 更新失败 ({student['username']}): {error}")
            
            current_index += 1
            await asyncio.sleep(0.05)  # 避免请求过快
    
    print(f"\n✨ 完成！")
    print(f"   成功: {success_count} 个")
    print(f"   失败: {fail_count} 个")
    print(f"   总计: {success_count + fail_count} 个")

if __name__ == "__main__":
    asyncio.run(main())

