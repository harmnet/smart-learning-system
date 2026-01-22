"""
Classes API测试
"""
import pytest
import httpx
from datetime import datetime


class TestClasses:
    """班级管理API测试类"""

    def test_get_classes_list(self, authenticated_client: httpx.Client):
        """测试获取班级列表"""
        response = authenticated_client.get(
            "/api/v1/admin/classes",
            params={"skip": 0, "limit": 20}
        )
        
        assert response.status_code == 200, f"获取班级列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data, "返回数据缺少items字段"
        assert "total" in data, "返回数据缺少total字段"
        assert isinstance(data["items"], list), "items应该是列表类型"

    def test_get_classes_with_filters(self, authenticated_client: httpx.Client, test_major_id: int):
        """测试筛选班级"""
        # 按专业筛选
        response = authenticated_client.get(
            "/api/v1/admin/classes",
            params={"skip": 0, "limit": 20, "major_id": test_major_id}
        )
        
        assert response.status_code == 200, f"筛选班级失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data
        # 验证筛选结果
        for item in data["items"]:
            assert item["major_id"] == test_major_id, "筛选结果不正确"

    def test_create_class(self, authenticated_client: httpx.Client, test_class_data: dict):
        """测试创建班级"""
        response = authenticated_client.post(
            "/api/v1/admin/classes",
            json=test_class_data
        )
        
        assert response.status_code in [200, 201], f"创建班级失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        assert data["name"] == test_class_data["name"], "班级名称不匹配"
        assert data["major_id"] == test_class_data["major_id"], "专业ID不匹配"
        
        # 清理
        class_id = data["id"]
        authenticated_client.delete(f"/api/v1/admin/classes/{class_id}")

    def test_get_class_detail(self, authenticated_client: httpx.Client, test_class_id: int):
        """测试获取班级详情"""
        response = authenticated_client.get(f"/api/v1/admin/classes/{test_class_id}")
        
        assert response.status_code == 200, f"获取班级详情失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["id"] == test_class_id, "班级ID不匹配"
        assert "name" in data, "缺少name字段"

    def test_update_class(self, authenticated_client: httpx.Client, test_class_id: int):
        """测试更新班级"""
        update_data = {
            "name": "更新后的班级名称",
            "grade": "2025"
        }
        
        response = authenticated_client.put(
            f"/api/v1/admin/classes/{test_class_id}",
            json=update_data
        )
        
        assert response.status_code == 200, f"更新班级失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["name"] == update_data["name"], "班级名称未更新"

    def test_delete_class(self, authenticated_client: httpx.Client):
        """测试删除班级"""
        # 需要先创建专业和组织
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
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
        
        # 创建班级用于删除
        class_data = {
            "name": f"待删除班级_{timestamp}",
            "code": f"DELETE_{timestamp}",
            "major_id": major_id,
            "grade": "2024"
        }
        
        create_response = authenticated_client.post("/api/v1/admin/classes", json=class_data)
        assert create_response.status_code in [200, 201]
        class_id = create_response.json()["id"]
        
        # 删除班级
        response = authenticated_client.delete(f"/api/v1/admin/classes/{class_id}")
        
        assert response.status_code in [200, 204], f"删除班级失败: {response.status_code} - {response.text}"
        
        # 清理
        authenticated_client.delete(f"/api/v1/majors/{major_id}")
        authenticated_client.delete(f"/api/v1/organizations/{org_id}")

    def test_get_class_students(self, authenticated_client: httpx.Client, test_class_id: int):
        """测试获取班级学生列表"""
        response = authenticated_client.get(
            f"/api/v1/admin/classes/{test_class_id}/students",
            params={"skip": 0, "limit": 20}
        )
        
        assert response.status_code == 200, f"获取班级学生列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data, "返回数据缺少items字段"
        assert "total" in data, "返回数据缺少total字段"
        assert isinstance(data["items"], list), "items应该是列表类型"

    def test_get_classes_pagination(self, authenticated_client: httpx.Client):
        """测试分页功能"""
        response1 = authenticated_client.get(
            "/api/v1/admin/classes",
            params={"skip": 0, "limit": 10}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        response2 = authenticated_client.get(
            "/api/v1/admin/classes",
            params={"skip": 10, "limit": 10}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        if len(data1["items"]) > 0 and len(data2["items"]) > 0:
            assert data1["items"][0]["id"] != data2["items"][0]["id"], "分页结果应该不同"

    def test_get_template(self, authenticated_client: httpx.Client):
        """测试下载模板"""
        response = authenticated_client.get("/api/v1/admin/classes/template")
        
        assert response.status_code == 200, f"下载模板失败: {response.status_code} - {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", ""), "返回的不是Excel文件"
