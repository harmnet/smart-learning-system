"""
Dictionary API测试
"""
import pytest
import httpx
from datetime import datetime


class TestDictionary:
    """数据字典API测试类"""

    def test_get_dictionary_types(self, authenticated_client: httpx.Client):
        """测试获取字典类型列表"""
        response = authenticated_client.get("/api/v1/dictionary/types")
        
        assert response.status_code == 200, f"获取字典类型列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "返回应该是列表类型"

    def test_create_dictionary_type(self, authenticated_client: httpx.Client):
        """测试创建字典类型"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        type_data = {
            "code": f"test_type_{timestamp}",
            "name": f"测试类型_{timestamp}",
            "description": "这是一个测试类型",
            "is_active": True
        }
        
        response = authenticated_client.post(
            "/api/v1/dictionary/types",
            json=type_data
        )
        
        assert response.status_code in [200, 201], f"创建字典类型失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        assert data["code"] == type_data["code"], "类型代码不匹配"
        
        # 清理（如果需要）
        # 注意：字典类型可能不支持删除，需要根据实际API决定

    def test_get_dictionary_items(self, authenticated_client: httpx.Client):
        """测试获取字典项列表"""
        # 先获取一个类型
        types_response = authenticated_client.get("/api/v1/dictionary/types")
        assert types_response.status_code == 200
        types_data = types_response.json()
        
        if len(types_data) > 0:
            type_code = types_data[0]["code"]
            
            response = authenticated_client.get(
                f"/api/v1/dictionary/items/by-type/{type_code}"
            )
            
            assert response.status_code == 200, f"获取字典项列表失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert isinstance(data, list), "返回应该是列表类型"

    def test_create_dictionary_item(self, authenticated_client: httpx.Client):
        """测试创建字典项"""
        # 先获取一个类型
        types_response = authenticated_client.get("/api/v1/dictionary/types")
        assert types_response.status_code == 200
        types_data = types_response.json()
        
        if len(types_data) > 0:
            type_id = types_data[0]["id"]
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            
            # 获取类型代码
            type_code = types_data[0]["code"]
            
            item_data = {
                "code": type_code,  # 需要code字段
                "type_id": type_id,
                "label": f"测试项_{timestamp}",
                "value": f"test_value_{timestamp}",
                "sort_order": 1,
                "remark": "测试备注"
            }
            
            response = authenticated_client.post(
                "/api/v1/dictionary/items",
                json=item_data
            )
            
            assert response.status_code in [200, 201], f"创建字典项失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert "id" in data, "返回数据缺少id字段"

    def test_update_dictionary_item(self, authenticated_client: httpx.Client):
        """测试更新字典项"""
        # 先获取一个类型和它的项
        types_response = authenticated_client.get("/api/v1/dictionary/types")
        assert types_response.status_code == 200
        types_data = types_response.json()
        
        if len(types_data) > 0:
            type_code = types_data[0]["code"]
            items_response = authenticated_client.get(f"/api/v1/dictionary/items/by-type/{type_code}")
            
            if items_response.status_code == 200 and len(items_response.json()) > 0:
                item_id = items_response.json()[0]["id"]
                
                update_data = {
                    "label": "更新后的标签",
                    "sort_order": 2
                }
                
                response = authenticated_client.put(
                    f"/api/v1/dictionary/items/{item_id}",
                    json=update_data
                )
                
                assert response.status_code == 200, f"更新字典项失败: {response.status_code} - {response.text}"
                
                data = response.json()
                assert data["label"] == update_data["label"], "标签未更新"

    def test_delete_dictionary_item(self, authenticated_client: httpx.Client):
        """测试删除字典项"""
        # 先创建一个字典项用于删除
        types_response = authenticated_client.get("/api/v1/dictionary/types")
        assert types_response.status_code == 200
        types_data = types_response.json()
        
        if len(types_data) > 0:
            type_id = types_data[0]["id"]
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            
            # 获取类型代码
            type_code = types_data[0]["code"]
            
            # 创建项
            item_data = {
                "code": type_code,  # 需要code字段
                "type_id": type_id,
                "label": f"待删除项_{timestamp}",
                "value": f"delete_{timestamp}",
                "sort_order": 999,
                "remark": "待删除"
            }
            
            create_response = authenticated_client.post(
                "/api/v1/dictionary/items",
                json=item_data
            )
            
            if create_response.status_code in [200, 201]:
                item_id = create_response.json()["id"]
                
                # 删除项
                response = authenticated_client.delete(f"/api/v1/dictionary/items/{item_id}")
                
                assert response.status_code in [200, 204], f"删除字典项失败: {response.status_code} - {response.text}"
