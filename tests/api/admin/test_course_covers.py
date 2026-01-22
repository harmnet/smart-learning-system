"""
Course Covers API测试
"""
import pytest
import httpx
import io
from datetime import datetime


class TestCourseCovers:
    """课程封面API测试类"""

    def test_get_course_covers_list(self, authenticated_client: httpx.Client):
        """测试获取封面列表"""
        response = authenticated_client.get("/api/v1/course-covers")
        
        assert response.status_code == 200, f"获取封面列表失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "返回应该是列表类型"

    def test_get_course_covers_count(self, authenticated_client: httpx.Client):
        """测试获取封面数量"""
        response = authenticated_client.get("/api/v1/course-covers/count")
        
        assert response.status_code == 200, f"获取封面数量失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "total" in data, "缺少total字段"
        assert isinstance(data["total"], int), "total应该是整数类型"

    def test_upload_course_cover(self, authenticated_client: httpx.Client):
        """测试上传封面"""
        # 创建一个简单的测试图片（1x1像素的PNG）
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        files = {
            "file": (f"test_cover_{timestamp}.png", io.BytesIO(png_data), "image/png")
        }
        
        response = authenticated_client.post(
            "/api/v1/course-covers/upload",
            files=files
        )
        
        assert response.status_code in [200, 201], f"上传封面失败: {response.status_code} - {response.text}"
        
        data = response.json()
        assert "id" in data, "返回数据缺少id字段"
        
        # 清理
        cover_id = data["id"]
        authenticated_client.delete(f"/api/v1/course-covers/{cover_id}")

    def test_get_course_cover_detail(self, authenticated_client: httpx.Client):
        """测试获取封面详情"""
        # 先创建一个封面
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        files = {
            "file": (f"test_cover_{timestamp}.png", io.BytesIO(png_data), "image/png")
        }
        
        create_response = authenticated_client.post("/api/v1/course-covers", files=files)
        if create_response.status_code in [200, 201]:
            cover_id = create_response.json()["id"]
            
            response = authenticated_client.get(f"/api/v1/course-covers/{cover_id}")
            
            assert response.status_code == 200, f"获取封面详情失败: {response.status_code} - {response.text}"
            
            data = response.json()
            assert data["id"] == cover_id, "封面ID不匹配"
            
            # 清理
            authenticated_client.delete(f"/api/v1/course-covers/{cover_id}")

    def test_update_course_cover(self, authenticated_client: httpx.Client):
        """测试更新封面（重命名）"""
        # 先创建一个封面
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        files = {
            "file": (f"test_cover_{timestamp}.png", io.BytesIO(png_data), "image/png")
        }
        
        create_response = authenticated_client.post("/api/v1/course-covers", files=files)
        if create_response.status_code in [200, 201]:
            cover_id = create_response.json()["id"]
            
            update_data = {
                "filename": f"updated_{timestamp}.png"
            }
            
            response = authenticated_client.put(
                f"/api/v1/course-covers/{cover_id}",
                json=update_data
            )
            
            # 注意：更新可能返回200或204
            assert response.status_code in [200, 204], f"更新封面失败: {response.status_code} - {response.text}"
            
            # 清理
            authenticated_client.delete(f"/api/v1/course-covers/{cover_id}")

    def test_replace_course_cover(self, authenticated_client: httpx.Client):
        """测试替换封面"""
        # 先创建一个封面
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        files = {
            "file": (f"test_cover_{timestamp}.png", io.BytesIO(png_data), "image/png")
        }
        
        create_response = authenticated_client.post("/api/v1/course-covers", files=files)
        if create_response.status_code in [200, 201]:
            cover_id = create_response.json()["id"]
            
            # 替换为新图片
            new_png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
            replace_files = {
                "file": (f"replaced_{timestamp}.png", io.BytesIO(new_png_data), "image/png")
            }
            
            response = authenticated_client.post(
                f"/api/v1/course-covers/{cover_id}/replace",
                files=replace_files
            )
            
            assert response.status_code in [200, 201], f"替换封面失败: {response.status_code} - {response.text}"
            
            # 清理
            authenticated_client.delete(f"/api/v1/course-covers/{cover_id}")

    def test_delete_course_cover(self, authenticated_client: httpx.Client):
        """测试删除封面"""
        # 先创建一个封面用于删除
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        files = {
            "file": (f"delete_cover_{timestamp}.png", io.BytesIO(png_data), "image/png")
        }
        
        create_response = authenticated_client.post("/api/v1/course-covers", files=files)
        if create_response.status_code in [200, 201]:
            cover_id = create_response.json()["id"]
            
            # 删除封面
            response = authenticated_client.delete(f"/api/v1/course-covers/{cover_id}")
            
            assert response.status_code in [200, 204], f"删除封面失败: {response.status_code} - {response.text}"

    def test_get_course_cover_url(self, authenticated_client: httpx.Client):
        """测试获取封面URL"""
        # 先创建一个封面
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        files = {
            "file": (f"test_cover_{timestamp}.png", io.BytesIO(png_data), "image/png")
        }
        
        create_response = authenticated_client.post("/api/v1/course-covers", files=files)
        if create_response.status_code in [200, 201]:
            cover_id = create_response.json()["id"]
            
            response = authenticated_client.get(f"/api/v1/course-covers/{cover_id}")
            
            assert response.status_code == 200, f"获取封面URL失败: {response.status_code} - {response.text}"
            
            # 清理
            authenticated_client.delete(f"/api/v1/course-covers/{cover_id}")
