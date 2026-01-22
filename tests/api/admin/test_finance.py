"""
Finance API测试
"""
import pytest
import httpx


class TestFinance:
    """财务管理API测试类"""

    def test_get_finance_stats(self, authenticated_client: httpx.Client):
        """测试获取财务统计"""
        response = authenticated_client.get("/api/v1/admin/finance/stats")
        
        assert response.status_code == 200, f"获取财务统计失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "paid_amount" in data or "revenue" in data, "缺少收入统计字段"
        assert "pending_amount" in data or "pending" in data, "缺少待支付统计字段"
        assert "total_orders" in data or "orders" in data, "缺少订单统计字段"

    def test_get_orders_list(self, authenticated_client: httpx.Client):
        """测试获取订单列表"""
        response = authenticated_client.get("/api/v1/admin/finance/orders")
        
        assert response.status_code == 200, f"获取订单列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "返回应该是列表类型"
        
        # 如果有订单，验证订单数据结构
        if len(data) > 0:
            order = data[0]
            assert "id" in order, "订单缺少id字段"
            assert "amount" in order, "订单缺少amount字段"
            assert "status" in order, "订单缺少status字段"

    def test_get_orders_with_status_filter(self, authenticated_client: httpx.Client):
        """测试按状态筛选订单"""
        # 测试不同状态的筛选
        for status in ["completed", "pending", "refunded"]:
            response = authenticated_client.get(
                "/api/v1/admin/finance/orders",
                params={"status": status}
            )
            
            assert response.status_code == 200, f"筛选订单失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert isinstance(data, list), "返回应该是列表类型"
