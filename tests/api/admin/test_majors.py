"""
Majors API测试
"""
import pytest
import httpx
from datetime import datetime


class TestMajors:
    """专业管理API测试类"""

    def test_get_majors_list(self, authenticated_client: httpx.Client):
        """测试获取专业列表"""
        response = authenticated_client.get(
            "/api/v1/majors",
            params={"skip": 0, "limit": 20}
        )
        
        assert response.status_code == 200, f"获取专业列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data, "返回数据缺少items字段"
        assert "total" in data, "返回数据缺少total字段"
        assert isinstance(data["items"], list), "items应该是列表类型"

    def test_get_majors_with_search(self, authenticated_client: httpx.Client):
        """测试搜索专业"""
        response = authenticated_client.get(
            "/api/v1/majors",
            params={"skip": 0, "limit": 20, "name": "测试"}
        )
        
        assert response.status_code == 200, f"搜索专业失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_create_major(self, authenticated_client: httpx.Client, test_major_data: dict):
        """测试创建专业"""
        response = authenticated_client.post(
            "/api/v1/majors",
            json=test_major_data
        )
        
        assert response.status_code in [200, 201], f"创建专业失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        assert data["name"] == test_major_data["name"], "专业名称不匹配"
        assert data["organization_id"] == test_major_data["organization_id"], "组织ID不匹配"
        
        # 清理
        major_id = data["id"]
        authenticated_client.delete(f"/api/v1/majors/{major_id}")

    def test_get_major_detail(self, authenticated_client: httpx.Client, test_major_id: int):
        """测试获取专业详情"""
        response = authenticated_client.get(f"/api/v1/majors/{test_major_id}")
        
        assert response.status_code == 200, f"获取专业详情失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["id"] == test_major_id, "专业ID不匹配"
        assert "name" in data, "缺少name字段"

    def test_update_major(self, authenticated_client: httpx.Client, test_major_id: int):
        """测试更新专业"""
        update_data = {
            "name": "更新后的专业名称",
            "description": "更新后的描述",
            "tuition_fee": 6000.0
        }
        
        response = authenticated_client.put(
            f"/api/v1/majors/{test_major_id}",
            json=update_data
        )
        
        assert response.status_code == 200, f"更新专业失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["name"] == update_data["name"], "专业名称未更新"

    def test_delete_major(self, authenticated_client: httpx.Client):
        """测试删除专业"""
        # 需要先创建一个组织
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        org_data = {
            "name": f"临时组织_{timestamp}",
            "code": f"TEMP_ORG_{timestamp}",
            "parent_id": None
        }
        org_response = authenticated_client.post("/api/v1/organizations", json=org_data)
        org_id = org_response.json()["id"]
        
        # 创建专业用于删除
        major_data = {
            "name": f"待删除专业_{timestamp}",
            "code": f"DELETE_{timestamp}",
            "description": "待删除",
            "tuition_fee": 5000.0,
            "duration_years": 4,
            "organization_id": org_id,
            "teacher_id": None
        }
        
        create_response = authenticated_client.post("/api/v1/majors", json=major_data)
        assert create_response.status_code in [200, 201]
        major_id = create_response.json()["id"]
        
        # 删除专业
        response = authenticated_client.delete(f"/api/v1/majors/{major_id}")
        
        assert response.status_code in [200, 204], f"删除专业失败: {response.status_code} - {response.text}"
        
        # 如果返回200，尝试解析JSON（可能返回空响应）
        if response.status_code == 200:
            try:
                data = response.json()
            except:
                pass  # 空响应也是可以的
        
        # 清理组织
        authenticated_client.delete(f"/api/v1/organizations/{org_id}")

    def test_search_teachers(self, authenticated_client: httpx.Client):
        """测试搜索教师（用于专业负责人选择）"""
        response = authenticated_client.get(
            "/api/v1/majors/teachers",
            params={"search": ""}
        )
        
        assert response.status_code == 200, f"搜索教师失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "返回应该是列表类型"

    def test_get_majors_pagination(self, authenticated_client: httpx.Client):
        """测试分页功能"""
        response1 = authenticated_client.get(
            "/api/v1/majors",
            params={"skip": 0, "limit": 10}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        response2 = authenticated_client.get(
            "/api/v1/majors",
            params={"skip": 10, "limit": 10}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        if len(data1["items"]) > 0 and len(data2["items"]) > 0:
            assert data1["items"][0]["id"] != data2["items"][0]["id"], "分页结果应该不同"

    def test_get_template(self, authenticated_client: httpx.Client):
        """测试下载模板"""
        response = authenticated_client.get("/api/v1/majors/template")
        
        assert response.status_code == 200, f"下载模板失败: {response.status_code} - {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", ""), "返回的不是Excel文件"
