"""
Dashboard API测试
"""
import pytest
import httpx


class TestDashboard:
    """Dashboard API测试类"""

    def test_get_statistics(self, authenticated_client: httpx.Client):
        """测试获取统计数据"""
        response = authenticated_client.get("/api/v1/admin/dashboard/statistics")
        
        assert response.status_code == 200, f"获取统计数据失败: {response.status_code} - {response.text}"
        
        data = response.json()
        
        # 验证返回数据结构
        assert isinstance(data, dict), "返回数据格式不正确"
        
        # 验证统计项存在（使用实际的字段名）
        expected_keys = ["teachers_count", "students_count", "majors_count", "classes_count", "courses_count", "exams_count"]
        
        for key in expected_keys:
            assert key in data, f"缺少统计项: {key}"
            assert isinstance(data[key], int), f"统计项 {key} 应该是整数类型"
        
        # 验证活跃用户统计
        assert "active_users_today" in data, "缺少今日活跃用户统计"
        assert "active_users_week" in data, "缺少本周活跃用户统计"
        assert isinstance(data["active_users_today"], int), "active_users_today应该是整数类型"
        assert isinstance(data["active_users_week"], int), "active_users_week应该是整数类型"
        
        # 验证系统健康状态
        assert "system_health" in data, "缺少系统健康状态"
        health = data["system_health"]
        assert "database_status" in health, "缺少数据库健康状态"
        assert "api_status" in health, "缺少API服务健康状态"
