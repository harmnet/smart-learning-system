"""
Teachers API测试
"""
import pytest
import httpx
from datetime import datetime


class TestTeachers:
    """教师管理API测试类"""

    def test_get_teachers_list(self, authenticated_client: httpx.Client):
        """测试获取教师列表"""
        response = authenticated_client.get("/api/v1/admin/teachers")
        
        assert response.status_code == 200, f"获取教师列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "返回应该是列表类型"

    def test_get_teachers_with_search(self, authenticated_client: httpx.Client):
        """测试搜索教师"""
        response = authenticated_client.get(
            "/api/v1/admin/teachers",
            params={"name": "测试"}
        )
        
        assert response.status_code == 200, f"搜索教师失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "返回应该是列表类型"

    def test_get_teachers_stats(self, authenticated_client: httpx.Client):
        """测试获取教师统计"""
        response = authenticated_client.get("/api/v1/admin/teachers/stats")
        
        assert response.status_code == 200, f"获取教师统计失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "active" in data, "缺少active字段"
        assert isinstance(data["active"], int), "active应该是整数类型"

    def test_create_teacher(self, authenticated_client: httpx.Client, test_teacher_data: dict):
        """测试创建教师"""
        response = authenticated_client.post(
            "/api/v1/admin/teachers",
            json=test_teacher_data
        )
        
        assert response.status_code in [200, 201], f"创建教师失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        assert data["full_name"] == test_teacher_data["full_name"], "教师姓名不匹配"
        
        # 清理
        teacher_id = data["id"]
        authenticated_client.delete(f"/api/v1/admin/teachers/{teacher_id}")

    def test_get_teacher_detail(self, authenticated_client: httpx.Client, test_teacher_id: int):
        """测试获取教师详情"""
        response = authenticated_client.get(f"/api/v1/admin/teachers/{test_teacher_id}")
        
        assert response.status_code == 200, f"获取教师详情失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["id"] == test_teacher_id, "教师ID不匹配"
        assert "full_name" in data, "缺少full_name字段"

    def test_update_teacher(self, authenticated_client: httpx.Client, test_teacher_id: int):
        """测试更新教师"""
        update_data = {
            "full_name": "更新后的教师姓名",
            "email": "updated@test.com"
        }
        
        response = authenticated_client.put(
            f"/api/v1/admin/teachers/{test_teacher_id}",
            json=update_data
        )
        
        assert response.status_code == 200, f"更新教师失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["full_name"] == update_data["full_name"], "教师姓名未更新"

    def test_delete_teacher(self, authenticated_client: httpx.Client):
        """测试删除教师"""
        # 需要先创建专业和组织
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
        
        # 创建教师用于删除
        teacher_data = {
            "username": None,
            "full_name": f"待删除教师_{timestamp}",
            "email": f"delete_{timestamp}@test.com",
            "phone": f"139{random_suffix}",
            "major_id": major_id,
            "is_active": True
        }
        
        create_response = authenticated_client.post("/api/v1/admin/teachers", json=teacher_data)
        assert create_response.status_code in [200, 201]
        teacher_id = create_response.json()["id"]
        
        # 删除教师
        response = authenticated_client.delete(f"/api/v1/admin/teachers/{teacher_id}")
        
        assert response.status_code in [200, 204], f"删除教师失败: {response.status_code} - {response.text}"
        
        # 如果返回200，尝试解析JSON（可能返回空响应）
        if response.status_code == 200:
            try:
                data = response.json()
            except:
                pass  # 空响应也是可以的
        
        # 清理
        authenticated_client.delete(f"/api/v1/majors/{major_id}")
        authenticated_client.delete(f"/api/v1/organizations/{org_id}")

    def test_reset_teacher_password(self, authenticated_client: httpx.Client, test_teacher_id: int):
        """测试重置教师密码"""
        response = authenticated_client.post(
            f"/api/v1/admin/teachers/{test_teacher_id}/reset-password"
        )
        
        assert response.status_code == 200, f"重置密码失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "new_password" in data, "返回数据缺少new_password字段"
        assert len(data["new_password"]) > 0, "新密码不应该为空"

    def test_get_template(self, authenticated_client: httpx.Client):
        """测试下载模板"""
        response = authenticated_client.get("/api/v1/admin/teachers/template")
        
        assert response.status_code == 200, f"下载模板失败: {response.status_code} - {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", ""), "返回的不是Excel文件"
