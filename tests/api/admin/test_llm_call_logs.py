"""
LLM Call Logs API测试
"""
import pytest
import httpx


class TestLLMCallLogs:
    """LLM调用日志API测试类"""

    def test_get_llm_call_logs_list(self, authenticated_client: httpx.Client):
        """测试获取日志列表"""
        response = authenticated_client.get(
            "/api/v1/admin/llm-call-logs",
            params={"skip": 0, "limit": 20}
        )
        
        assert response.status_code == 200, f"获取日志列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data, "返回数据缺少items字段"
        assert "total" in data, "返回数据缺少total字段"
        assert isinstance(data["items"], list), "items应该是列表类型"

    def test_get_llm_call_logs_with_function_type_filter(self, authenticated_client: httpx.Client):
        """测试按功能类型筛选"""
        response = authenticated_client.get(
            "/api/v1/admin/llm-call-logs",
            params={"skip": 0, "limit": 20, "function_type": "question_generation"}
        )
        
        assert response.status_code == 200, f"筛选日志失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data
        # 验证筛选结果
        for item in data["items"]:
            assert item["function_type"] == "question_generation", "筛选结果不正确"

    def test_get_llm_call_logs_with_user_filter(self, authenticated_client: httpx.Client):
        """测试按用户ID筛选"""
        # 先获取一个用户ID（如果有的话）
        users_response = authenticated_client.get("/api/v1/admin/users")
        if users_response.status_code == 200 and len(users_response.json().get("items", [])) > 0:
            user_id = users_response.json()["items"][0]["id"]
            
            response = authenticated_client.get(
                "/api/v1/admin/llm-call-logs",
                params={"skip": 0, "limit": 20, "user_id": user_id}
            )
            
            assert response.status_code == 200, f"按用户筛选失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert "items" in data

    def test_get_llm_call_logs_with_date_range(self, authenticated_client: httpx.Client):
        """测试按时间范围筛选"""
        from datetime import datetime, timedelta
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        response = authenticated_client.get(
            "/api/v1/admin/llm-call-logs",
            params={
                "skip": 0,
                "limit": 20,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        )
        
        assert response.status_code == 200, f"按时间范围筛选失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "items" in data

    def test_get_llm_call_log_detail(self, authenticated_client: httpx.Client):
        """测试获取日志详情"""
        # 先获取一个日志ID
        logs_response = authenticated_client.get(
            "/api/v1/admin/llm-call-logs",
            params={"skip": 0, "limit": 1}
        )
        
        if logs_response.status_code == 200 and len(logs_response.json().get("items", [])) > 0:
            log_id = logs_response.json()["items"][0]["id"]
            
            response = authenticated_client.get(f"/api/v1/admin/llm-call-logs/{log_id}")
            
            assert response.status_code == 200, f"获取日志详情失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert data["id"] == log_id, "日志ID不匹配"
            assert "prompt" in data, "缺少prompt字段"
            assert "result" in data or "error_message" in data, "缺少result或error_message字段"

    def test_get_llm_call_logs_pagination(self, authenticated_client: httpx.Client):
        """测试分页功能"""
        response1 = authenticated_client.get(
            "/api/v1/admin/llm-call-logs",
            params={"skip": 0, "limit": 10}
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        response2 = authenticated_client.get(
            "/api/v1/admin/llm-call-logs",
            params={"skip": 10, "limit": 10}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        if len(data1["items"]) > 0 and len(data2["items"]) > 0:
            assert data1["items"][0]["id"] != data2["items"][0]["id"], "分页结果应该不同"
