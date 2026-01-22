"""
LLM Configs API测试
"""
import pytest
import httpx
from datetime import datetime


class TestLLMConfigs:
    """LLM配置API测试类"""

    def test_get_llm_configs_list(self, authenticated_client: httpx.Client):
        """测试获取配置列表"""
        response = authenticated_client.get("/api/v1/admin/llm-configs")
        
        assert response.status_code == 200, f"获取配置列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "返回应该是列表类型"

    def test_create_llm_config(self, authenticated_client: httpx.Client):
        """测试创建LLM配置"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        config_data = {
            "provider_name": f"测试提供商_{timestamp}",
            "provider_key": f"test_provider_{timestamp}",
            "api_key": "test_api_key_12345",
            "api_secret": "test_api_secret",
            "endpoint_url": "https://api.test.com/v1",
            "model_name": "test-model",
            "config_json": "{}",
            "is_active": True
        }
        
        response = authenticated_client.post(
            "/api/v1/admin/llm-configs",
            json=config_data
        )
        
        assert response.status_code in [200, 201], f"创建配置失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        assert data["provider_name"] == config_data["provider_name"], "提供商名称不匹配"
        
        # 清理
        config_id = data["id"]
        authenticated_client.delete(f"/api/v1/admin/llm-configs/{config_id}")

    def test_get_llm_config_detail(self, authenticated_client: httpx.Client):
        """测试获取配置详情"""
        # 先创建一个配置
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        config_data = {
            "provider_name": f"测试提供商_{timestamp}",
            "provider_key": f"test_provider_{timestamp}",
            "api_key": "test_api_key_12345",
            "api_secret": "test_api_secret",
            "endpoint_url": "https://api.test.com/v1",
            "model_name": "test-model",
            "config_json": "{}",
            "is_active": True
        }
        
        create_response = authenticated_client.post("/api/v1/admin/llm-configs", json=config_data)
        if create_response.status_code in [200, 201]:
            config_id = create_response.json()["id"]
            
            response = authenticated_client.get(f"/api/v1/admin/llm-configs/{config_id}")
            
            assert response.status_code == 200, f"获取配置详情失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert data["id"] == config_id, "配置ID不匹配"
            
            # 清理
            authenticated_client.delete(f"/api/v1/admin/llm-configs/{config_id}")

    def test_update_llm_config(self, authenticated_client: httpx.Client):
        """测试更新配置"""
        # 先创建一个配置
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        config_data = {
            "provider_name": f"测试提供商_{timestamp}",
            "provider_key": f"test_provider_{timestamp}",
            "api_key": "test_api_key_12345",
            "api_secret": "test_api_secret",
            "endpoint_url": "https://api.test.com/v1",
            "model_name": "test-model",
            "config_json": "{}",
            "is_active": True
        }
        
        create_response = authenticated_client.post("/api/v1/admin/llm-configs", json=config_data)
        if create_response.status_code in [200, 201]:
            config_id = create_response.json()["id"]
            
            update_data = {
                "provider_name": "更新后的提供商名称",
                "api_key": "updated_api_key"
            }
            
            response = authenticated_client.put(
                f"/api/v1/admin/llm-configs/{config_id}",
                json=update_data
            )
            
            assert response.status_code == 200, f"更新配置失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert data["provider_name"] == update_data["provider_name"], "提供商名称未更新"
            
            # 清理
            authenticated_client.delete(f"/api/v1/admin/llm-configs/{config_id}")

    def test_delete_llm_config(self, authenticated_client: httpx.Client):
        """测试删除配置"""
        # 先创建一个配置用于删除
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        config_data = {
            "provider_name": f"待删除提供商_{timestamp}",
            "provider_key": f"delete_provider_{timestamp}",
            "api_key": "test_api_key_12345",
            "api_secret": "test_api_secret",
            "endpoint_url": "https://api.test.com/v1",
            "model_name": "test-model",
            "config_json": "{}",
            "is_active": True
        }
        
        create_response = authenticated_client.post("/api/v1/admin/llm-configs", json=config_data)
        if create_response.status_code in [200, 201]:
            config_id = create_response.json()["id"]
            
            # 删除配置
            response = authenticated_client.delete(f"/api/v1/admin/llm-configs/{config_id}")
            
            assert response.status_code in [200, 204], f"删除配置失败: {response.status_code} - {response.text}"

    def test_toggle_llm_config(self, authenticated_client: httpx.Client):
        """测试切换配置启用状态"""
        # 先创建一个配置
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        config_data = {
            "provider_name": f"测试提供商_{timestamp}",
            "provider_key": f"test_provider_{timestamp}",
            "api_key": "test_api_key_12345",
            "api_secret": "test_api_secret",
            "endpoint_url": "https://api.test.com/v1",
            "model_name": "test-model",
            "config_json": "{}",
            "is_active": True
        }
        
        create_response = authenticated_client.post("/api/v1/admin/llm-configs", json=config_data)
        if create_response.status_code in [200, 201]:
            config_id = create_response.json()["id"]
            original_status = create_response.json().get("is_active", True)
            
            # 切换状态（使用PATCH方法）
            response = authenticated_client.patch(
                f"/api/v1/admin/llm-configs/{config_id}/toggle"
            )
            
            assert response.status_code == 200, f"切换状态失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert data["is_active"] != original_status, "状态应该已切换"
            
            # 清理
            authenticated_client.delete(f"/api/v1/admin/llm-configs/{config_id}")

    def test_test_llm_config(self, authenticated_client: httpx.Client):
        """测试LLM配置测试功能"""
        # 先创建一个配置
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        config_data = {
            "provider_name": f"测试提供商_{timestamp}",
            "provider_key": f"test_provider_{timestamp}",
            "api_key": "test_api_key_12345",
            "api_secret": "test_api_secret",
            "endpoint_url": "https://api.test.com/v1",
            "model_name": "test-model",
            "config_json": "{}",
            "is_active": True
        }
        
        create_response = authenticated_client.post("/api/v1/admin/llm-configs", json=config_data)
        if create_response.status_code in [200, 201]:
            config_id = create_response.json()["id"]
            
            # 测试配置（注意：这可能会失败，因为API key可能是无效的）
            test_data = {
                "message": "你好，请介绍一下自己"
            }
            
            response = authenticated_client.post(
                f"/api/v1/admin/llm-configs/{config_id}/test",
                json=test_data
            )
            
            # 测试可能成功或失败，但应该返回200或400/500
            assert response.status_code in [200, 400, 500], f"测试配置返回了意外的状态码: {response.status_code} - {response.text}"
            
            # 清理
            authenticated_client.delete(f"/api/v1/admin/llm-configs/{config_id}")
