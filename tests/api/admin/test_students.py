"""
Students API测试
"""
import pytest
import httpx
from datetime import datetime


class TestStudents:
    """学生管理API测试类"""

    def test_get_students_list(self, authenticated_client: httpx.Client):
        """测试获取学生列表"""
        response = authenticated_client.get(
            "/api/v1/admin/students",
            params={"skip": 0, "limit": 20}
        )
        
        assert response.status_code == 200, f"获取学生列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data, "返回数据缺少items字段"
        assert "total" in data, "返回数据缺少total字段"
        assert isinstance(data["items"], list), "items应该是列表类型"

    def test_get_students_with_search(self, authenticated_client: httpx.Client):
        """测试搜索学生"""
        # 按姓名搜索
        response = authenticated_client.get(
            "/api/v1/admin/students",
            params={"skip": 0, "limit": 20, "name": "测试"}
        )
        
        assert response.status_code == 200, f"搜索学生失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_students_stats(self, authenticated_client: httpx.Client):
        """测试获取学生统计"""
        response = authenticated_client.get("/api/v1/admin/students/stats")
        
        assert response.status_code == 200, f"获取学生统计失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "total" in data, "缺少total字段"
        assert "active" in data, "缺少active字段"
        assert "inactive" in data, "缺少inactive字段"
        assert isinstance(data["total"], int), "total应该是整数类型"

    def test_create_student(self, authenticated_client: httpx.Client, test_student_data: dict):
        """测试创建学生"""
        response = authenticated_client.post(
            "/api/v1/admin/students",
            json=test_student_data
        )
        
        assert response.status_code in [200, 201], f"创建学生失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        assert data["username"] == test_student_data["username"], "用户名不匹配"
        assert data["student_no"] == test_student_data["student_no"], "学号不匹配"
        
        # 清理
        student_id = data["id"]
        authenticated_client.delete(f"/api/v1/admin/students/{student_id}")

    def test_get_student_detail(self, authenticated_client: httpx.Client, test_student_id: int):
        """测试获取学生详情"""
        response = authenticated_client.get(f"/api/v1/admin/students/{test_student_id}")
        
        assert response.status_code == 200, f"获取学生详情失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["id"] == test_student_id, "学生ID不匹配"
        assert "username" in data, "缺少username字段"

    def test_update_student(self, authenticated_client: httpx.Client, test_student_id: int):
        """测试更新学生"""
        update_data = {
            "full_name": "更新后的学生姓名",
            "email": "updated@test.com",
            "phone": "13900000000"
        }
        
        response = authenticated_client.put(
            f"/api/v1/admin/students/{test_student_id}",
            json=update_data
        )
        
        assert response.status_code == 200, f"更新学生失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["full_name"] == update_data["full_name"], "学生姓名未更新"

    def test_delete_student(self, authenticated_client: httpx.Client):
        """测试删除学生"""
        # 需要先创建组织、专业、班级
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        import random
        import string
        random_suffix = ''.join(random.choices(string.digits, k=4))
        
        org_data = {
            "name": f"临时组织_{timestamp}",
            "code": f"TEMP_ORG_{timestamp}",
            "parent_id": None
        }
        org_response = authenticated_client.post("/api/v1/organizations", json=org_data)
        org_id = org_response.json()["id"]
        
        major_data = {
            "name": f"临时专业_{timestamp}",
            "code": f"TEMP_MAJOR_{timestamp}",
            "description": "临时",
            "tuition_fee": 5000.0,
            "duration_years": 4,
            "organization_id": org_id,
            "teacher_id": None
        }
        major_response = authenticated_client.post("/api/v1/majors", json=major_data)
        major_id = major_response.json()["id"]
        
        class_data = {
            "name": f"临时班级_{timestamp}",
            "code": f"TEMP_CLASS_{timestamp}",
            "major_id": major_id,
            "grade": "2024"
        }
        class_response = authenticated_client.post("/api/v1/admin/classes", json=class_data)
        class_id = class_response.json()["id"]
        
        # 创建学生用于删除
        student_data = {
            "username": f"delete_student_{timestamp}_{random_suffix}",
            "password": "student123",
            "full_name": f"待删除学生_{timestamp}",
            "email": f"delete_{timestamp}@test.com",
            "phone": f"138{random_suffix}",
            "class_id": class_id,
            "student_no": f"DEL{timestamp}{random_suffix}",
            "is_active": True
        }
        
        create_response = authenticated_client.post("/api/v1/admin/students", json=student_data)
        assert create_response.status_code in [200, 201]
        student_id = create_response.json()["id"]
        
        # 删除学生
        response = authenticated_client.delete(f"/api/v1/admin/students/{student_id}")
        
        assert response.status_code in [200, 204], f"删除学生失败: {response.status_code} - {response.text}"
        
        # 如果返回200，尝试解析JSON（可能返回空响应）
        if response.status_code == 200:
            try:
                data = response.json()
            except:
                pass  # 空响应也是可以的
        
        # 清理
        authenticated_client.delete(f"/api/v1/admin/classes/{class_id}")
        authenticated_client.delete(f"/api/v1/majors/{major_id}")
        authenticated_client.delete(f"/api/v1/organizations/{org_id}")

    def test_get_students_pagination(self, authenticated_client: httpx.Client):
        """测试分页功能"""
        response1 = authenticated_client.get(
            "/api/v1/admin/students",
            params={"skip": 0, "limit": 10}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        response2 = authenticated_client.get(
            "/api/v1/admin/students",
            params={"skip": 10, "limit": 10}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        if len(data1["items"]) > 0 and len(data2["items"]) > 0:
            assert data1["items"][0]["id"] != data2["items"][0]["id"], "分页结果应该不同"

    def test_get_template(self, authenticated_client: httpx.Client):
        """测试下载模板"""
        response = authenticated_client.get("/api/v1/admin/students/template")
        
        assert response.status_code == 200, f"下载模板失败: {response.status_code} - {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", ""), "返回的不是Excel文件"
