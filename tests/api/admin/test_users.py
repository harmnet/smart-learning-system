"""
Users API测试
"""
import pytest
import httpx


class TestUsers:
    """用户管理API测试类"""

    def test_get_users_list(self, authenticated_client: httpx.Client):
        """测试获取用户列表"""
        response = authenticated_client.get("/api/v1/admin/users")
        
        assert response.status_code == 200, f"获取用户列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data, "返回数据缺少items字段"
        assert "total" in data, "返回数据缺少total字段"
        assert isinstance(data["items"], list), "items应该是列表类型"

    def test_get_users_with_search(self, authenticated_client: httpx.Client):
        """测试搜索用户"""
        # 按姓名搜索
        response = authenticated_client.get(
            "/api/v1/admin/users",
            params={"name": "测试"}
        )
        
        assert response.status_code == 200, f"搜索用户失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_users_with_username_search(self, authenticated_client: httpx.Client):
        """测试按用户名搜索"""
        response = authenticated_client.get(
            "/api/v1/admin/users",
            params={"username": "admin"}
        )
        
        assert response.status_code == 200, f"按用户名搜索失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data

    def test_get_users_with_phone_search(self, authenticated_client: httpx.Client):
        """测试按手机号搜索"""
        response = authenticated_client.get(
            "/api/v1/admin/users",
            params={"phone": "138"}
        )
        
        assert response.status_code == 200, f"按手机号搜索失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data

    def test_reset_user_password(self, authenticated_client: httpx.Client):
        """测试重置用户密码"""
        # 先获取一个用户ID
        users_response = authenticated_client.get("/api/v1/admin/users")
        assert users_response.status_code == 200
        users_data = users_response.json()
        
        if len(users_data["items"]) > 0:
            user_id = users_data["items"][0]["id"]
            
            response = authenticated_client.post(
                f"/api/v1/admin/users/{user_id}/reset-password"
            )
            
            assert response.status_code == 200, f"重置密码失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert "new_password" in data or "message" in data, "返回数据格式不正确"
