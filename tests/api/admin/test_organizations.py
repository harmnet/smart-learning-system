"""
Organizations API测试
"""
import pytest
import httpx
from datetime import datetime


class TestOrganizations:
    """组织管理API测试类"""

    def test_get_organizations_list(self, authenticated_client: httpx.Client):
        """测试获取组织列表"""
        response = authenticated_client.get(
            "/api/v1/organizations",
            params={"skip": 0, "limit": 20}
        )
        
        assert response.status_code == 200, f"获取组织列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data, "返回数据缺少items字段"
        assert "total" in data, "返回数据缺少total字段"
        assert isinstance(data["items"], list), "items应该是列表类型"
        assert isinstance(data["total"], int), "total应该是整数类型"

    def test_get_organizations_with_search(self, authenticated_client: httpx.Client):
        """测试搜索组织"""
        response = authenticated_client.get(
            "/api/v1/organizations",
            params={"skip": 0, "limit": 20, "search": "测试"}
        )
        
        assert response.status_code == 200, f"搜索组织失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_organizations_tree(self, authenticated_client: httpx.Client):
        """测试获取组织树"""
        response = authenticated_client.get("/api/v1/organizations/tree")
        
        assert response.status_code == 200, f"获取组织树失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "tree" in data, "返回数据缺少tree字段"
        assert isinstance(data["tree"], list), "tree应该是列表类型"

    def test_create_organization(self, authenticated_client: httpx.Client, test_organization_data: dict):
        """测试创建组织"""
        response = authenticated_client.post(
            "/api/v1/organizations",
            json=test_organization_data
        )
        
        assert response.status_code in [200, 201], f"创建组织失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        assert data["name"] == test_organization_data["name"], "组织名称不匹配"
        
        # 清理
        org_id = data["id"]
        authenticated_client.delete(f"/api/v1/organizations/{org_id}")

    def test_create_child_organization(self, authenticated_client: httpx.Client, test_organization_id: int):
        """测试创建子组织"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        child_data = {
            "name": f"测试子组织_{timestamp}",
            "code": f"TEST_CHILD_{timestamp}",
            "parent_id": test_organization_id
        }
        
        response = authenticated_client.post(
            "/api/v1/organizations",
            json=child_data
        )
        
        assert response.status_code in [200, 201], f"创建子组织失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["parent_id"] == test_organization_id, "父组织ID不匹配"
        
        # 清理
        child_id = data["id"]
        authenticated_client.delete(f"/api/v1/organizations/{child_id}")

    def test_get_organization_detail(self, authenticated_client: httpx.Client, test_organization_id: int):
        """测试获取组织详情"""
        response = authenticated_client.get(f"/api/v1/organizations/{test_organization_id}")
        
        assert response.status_code == 200, f"获取组织详情失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["id"] == test_organization_id, "组织ID不匹配"
        assert "name" in data, "缺少name字段"

    def test_update_organization(self, authenticated_client: httpx.Client, test_organization_id: int):
        """测试更新组织"""
        update_data = {
            "name": "更新后的组织名称",
            "code": "UPDATED_CODE"
        }
        
        response = authenticated_client.put(
            f"/api/v1/organizations/{test_organization_id}",
            json=update_data
        )
        
        assert response.status_code == 200, f"更新组织失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data["name"] == update_data["name"], "组织名称未更新"

    def test_delete_organization(self, authenticated_client: httpx.Client):
        """测试删除组织"""
        # 先创建一个组织用于删除
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        org_data = {
            "name": f"待删除组织_{timestamp}",
            "code": f"DELETE_{timestamp}",
            "parent_id": None
        }
        
        create_response = authenticated_client.post(
            "/api/v1/organizations",
            json=org_data
        )
        assert create_response.status_code in [200, 201]
        org_id = create_response.json()["id"]
        
        # 删除组织
        response = authenticated_client.delete(f"/api/v1/organizations/{org_id}")
        
        assert response.status_code in [200, 204], f"删除组织失败: {response.status_code} - {response.text}"
        
        # 验证组织已删除
        get_response = authenticated_client.get(f"/api/v1/organizations/{org_id}")
        assert get_response.status_code == 404, "组织应该已被删除"

    def test_get_organizations_pagination(self, authenticated_client: httpx.Client):
        """测试分页功能"""
        # 第一页
        response1 = authenticated_client.get(
            "/api/v1/organizations",
            params={"skip": 0, "limit": 10}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        # 第二页
        response2 = authenticated_client.get(
            "/api/v1/organizations",
            params={"skip": 10, "limit": 10}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        # 验证分页结果不同
        if len(data1["items"]) > 0 and len(data2["items"]) > 0:
            assert data1["items"][0]["id"] != data2["items"][0]["id"], "分页结果应该不同"

    def test_get_template(self, authenticated_client: httpx.Client):
        """测试下载模板"""
        response = authenticated_client.get("/api/v1/organizations/template")
        
        assert response.status_code == 200, f"下载模板失败: {response.status_code} - {response.text}"
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", ""), "返回的不是Excel文件"
