"""
API测试配置和fixtures
"""
import pytest
import httpx
from typing import Optional
import os
from datetime import datetime
import random
import string

# API基础URL
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
API_PREFIX = "/api/v1"

# 测试管理员账号（需要在实际环境中存在或创建）
TEST_ADMIN_USERNAME = os.getenv("TEST_ADMIN_USERNAME", "admin")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "admin123")


@pytest.fixture(scope="session")
def api_base_url():
    """API基础URL"""
    return API_BASE_URL


@pytest.fixture(scope="session")
def api_client():
    """创建API客户端"""
    with httpx.Client(base_url=API_BASE_URL, timeout=30.0, follow_redirects=True) as client:
        yield client


@pytest.fixture(scope="session")
def admin_token(api_client: httpx.Client) -> Optional[str]:
    """获取管理员token"""
    try:
        response = api_client.post(
            f"{API_PREFIX}/auth/login",
            data={
                "username": TEST_ADMIN_USERNAME,
                "password": TEST_ADMIN_PASSWORD
            }
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            pytest.skip(f"无法登录管理员账号: {response.status_code} - {response.text}")
    except Exception as e:
        pytest.skip(f"无法连接到API服务器: {str(e)}")


@pytest.fixture
def authenticated_client(api_client: httpx.Client, admin_token: str):
    """创建已认证的API客户端"""
    api_client.headers.update({"Authorization": f"Bearer {admin_token}"})
    yield api_client
    # 清理headers
    if "Authorization" in api_client.headers:
        del api_client.headers["Authorization"]


@pytest.fixture
def test_organization_data():
    """测试组织数据"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return {
        "name": f"测试组织_{timestamp}",
        "code": f"TEST_ORG_{timestamp}",
        "parent_id": None
    }


@pytest.fixture
def test_major_data(test_organization_id):
    """测试专业数据"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return {
        "name": f"测试专业_{timestamp}",
        "code": f"TEST_MAJOR_{timestamp}",
        "description": "这是一个测试专业",
        "tuition_fee": 5000.0,
        "duration_years": 4,
        "organization_id": test_organization_id,
        "teacher_id": None
    }


@pytest.fixture
def test_class_data(test_major_id):
    """测试班级数据"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return {
        "name": f"测试班级_{timestamp}",
        "code": f"TEST_CLASS_{timestamp}",
        "major_id": test_major_id,
        "grade": "2024"
    }


@pytest.fixture
def test_student_data(test_class_id):
    """测试学生数据"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return {
        "username": f"test_student_{timestamp}_{random_suffix}",
        "password": "student123",
        "full_name": f"测试学生_{timestamp}",
        "email": f"student_{timestamp}@test.com",
        "phone": f"138{random_suffix}",
        "class_id": test_class_id,
        "student_no": f"STU{timestamp}{random_suffix}",
        "is_active": True
    }


@pytest.fixture
def test_teacher_data(test_major_id):
    """测试教师数据"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_suffix = ''.join(random.choices(string.digits, k=4))
    return {
        "username": None,  # 将使用手机号
        "full_name": f"测试教师_{timestamp}",
        "email": f"teacher_{timestamp}@test.com",
        "phone": f"139{random_suffix}",
        "major_id": test_major_id,
        "is_active": True
    }


@pytest.fixture
def test_organization_id(authenticated_client: httpx.Client, test_organization_data: dict):
    """创建测试组织并返回ID"""
    # 如果parent_id为None（根组织），先检查是否已存在根组织
    if test_organization_data.get("parent_id") is None:
        # 获取现有组织列表，查找根组织
        orgs_response = authenticated_client.get(f"{API_PREFIX}/organizations")
        if orgs_response.status_code == 200:
            orgs_data = orgs_response.json()
            items = orgs_data.get("items", [])
            # 查找根组织（parent_id为None）
            for org in items:
                if org.get("parent_id") is None:
                    # 使用现有根组织，创建子组织
                    test_organization_data["parent_id"] = org["id"]
                    break
    
    response = authenticated_client.post(
        f"{API_PREFIX}/organizations",
        json=test_organization_data
    )
    assert response.status_code in [200, 201], f"创建组织失败: {response.status_code} - {response.text}"
    org_id = response.json().get("id")
    yield org_id
    # 清理：删除测试组织
    try:
        authenticated_client.delete(f"{API_PREFIX}/organizations/{org_id}")
    except:
        pass


@pytest.fixture
def test_major_id(authenticated_client: httpx.Client, test_major_data: dict):
    """创建测试专业并返回ID"""
    response = authenticated_client.post(
        f"{API_PREFIX}/majors",
        json=test_major_data
    )
    assert response.status_code in [200, 201], f"创建专业失败: {response.status_code} - {response.text}"
    major_id = response.json().get("id")
    yield major_id
    # 清理：删除测试专业
    try:
        authenticated_client.delete(f"{API_PREFIX}/majors/{major_id}")
    except:
        pass


@pytest.fixture
def test_class_id(authenticated_client: httpx.Client, test_class_data: dict):
    """创建测试班级并返回ID"""
    response = authenticated_client.post(
        f"{API_PREFIX}/admin/classes",
        json=test_class_data
    )
    assert response.status_code in [200, 201], f"创建班级失败: {response.status_code} - {response.text}"
    class_id = response.json().get("id")
    yield class_id
    # 清理：删除测试班级
    try:
        authenticated_client.delete(f"{API_PREFIX}/admin/classes/{class_id}")
    except:
        pass


@pytest.fixture
def test_student_id(authenticated_client: httpx.Client, test_student_data: dict):
    """创建测试学生并返回ID"""
    response = authenticated_client.post(
        f"{API_PREFIX}/admin/students",
        json=test_student_data
    )
    assert response.status_code in [200, 201], f"创建学生失败: {response.status_code} - {response.text}"
    student_id = response.json().get("id")
    yield student_id
    # 清理：删除测试学生
    try:
        authenticated_client.delete(f"{API_PREFIX}/admin/students/{student_id}")
    except:
        pass


@pytest.fixture
def test_teacher_id(authenticated_client: httpx.Client, test_teacher_data: dict):
    """创建测试教师并返回ID"""
    response = authenticated_client.post(
        f"{API_PREFIX}/admin/teachers",
        json=test_teacher_data
    )
    assert response.status_code in [200, 201], f"创建教师失败: {response.status_code} - {response.text}"
    teacher_id = response.json().get("id")
    yield teacher_id
    # 清理：删除测试教师
    try:
        authenticated_client.delete(f"{API_PREFIX}/admin/teachers/{teacher_id}")
    except:
        pass
