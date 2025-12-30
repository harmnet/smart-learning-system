#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
组织管理功能单元测试脚本

测试覆盖：
1. 组织CRUD操作（创建、读取、更新、删除）
2. 组织树结构管理
3. 批量导入功能
4. 统计信息准确性
5. 关联数据统计（专业、班级、学生数量）
6. 边界条件和错误处理
"""

import pytest
import asyncio
import httpx
import pandas as pd
import io
from typing import Dict, List, Optional
import json

# 测试配置
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class OrganizationTestClient:
    """组织管理API测试客户端"""
    
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.token: Optional[str] = None
        self.client: Optional[httpx.AsyncClient] = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(
            base_url=self.base_url, 
            timeout=30.0,
            follow_redirects=True  # 自动跟随重定向
        )
        await self.login()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    async def login(self):
        """管理员登录"""
        response = await self.client.post(
            "/auth/login",
            data={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200, f"登录失败: {response.text}"
        data = response.json()
        self.token = data["access_token"]
        self.client.headers.update({"Authorization": f"Bearer {self.token}"})
    
    async def create_organization(self, name: str, parent_id: Optional[int] = None) -> Dict:
        """创建组织"""
        response = await self.client.post(
            "/organizations",
            json={"name": name, "parent_id": parent_id}
        )
        assert response.status_code == 200, f"创建组织失败: {response.text}"
        return response.json()
    
    async def get_organization(self, org_id: int) -> Dict:
        """获取组织详情"""
        response = await self.client.get(f"/organizations/{org_id}")
        assert response.status_code == 200, f"获取组织失败: {response.text}"
        return response.json()
    
    async def get_organizations(self, skip: int = 0, limit: int = 1000, search: Optional[str] = None) -> Dict:
        """获取组织列表"""
        params = {"skip": skip, "limit": limit}
        if search:
            params["search"] = search
        response = await self.client.get(
            "/organizations",
            params=params
        )
        assert response.status_code == 200, f"获取组织列表失败: {response.text}"
        return response.json()
    
    async def get_organization_tree(self) -> Dict:
        """获取组织树结构"""
        response = await self.client.get("/organizations/tree")
        assert response.status_code == 200, f"获取组织树失败: {response.text}"
        return response.json()
    
    async def update_organization(self, org_id: int, name: Optional[str] = None, parent_id: Optional[int] = None) -> Dict:
        """更新组织"""
        data = {}
        if name is not None:
            data["name"] = name
        if parent_id is not None:
            data["parent_id"] = parent_id
        response = await self.client.put(
            f"/organizations/{org_id}",
            json=data
        )
        assert response.status_code == 200, f"更新组织失败: {response.text}"
        return response.json()
    
    async def delete_organization(self, org_id: int) -> Dict:
        """删除组织"""
        response = await self.client.delete(f"/organizations/{org_id}")
        assert response.status_code == 200, f"删除组织失败: {response.text}"
        return response.json()
    
    async def download_template(self) -> bytes:
        """下载导入模板"""
        # 注意：FastAPI路由顺序问题，template需要在/{org_id}之前定义
        # 如果后端路由顺序不对，这里需要特殊处理
        response = await self.client.get("/organizations/template", follow_redirects=False)
        if response.status_code == 307:
            # 处理重定向
            redirect_url = response.headers.get("location")
            if redirect_url:
                response = await self.client.get(redirect_url)
        assert response.status_code == 200, f"下载模板失败: {response.text}"
        return response.content
    
    async def import_organizations(self, file_content: bytes, filename: str = "test.xlsx") -> Dict:
        """批量导入组织"""
        files = {"file": (filename, file_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        response = await self.client.post(
            "/organizations/import",
            files=files
        )
        assert response.status_code == 200, f"批量导入失败: {response.text}"
        return response.json()
    
    async def create_major(self, name: str, organization_id: int, tuition_fee: float = 5000.0) -> Dict:
        """创建专业（用于测试关联数据）"""
        response = await self.client.post(
            "/majors",
            json={
                "name": name,
                "organization_id": organization_id,
                "tuition_fee": tuition_fee,
                "duration_years": 4,
                "description": "测试专业"
            }
        )
        assert response.status_code == 200, f"创建专业失败: {response.text}"
        return response.json()
    
    async def create_class(self, name: str, major_id: int, grade: str = "2024") -> Dict:
        """创建班级（用于测试关联数据）"""
        response = await self.client.post(
            "/admin/classes",
            json={
                "name": name,
                "major_id": major_id,
                "grade": grade,
                "code": f"CLASS_{name}"
            }
        )
        assert response.status_code == 200, f"创建班级失败: {response.text}"
        return response.json()


class TestOrganizationCRUD:
    """组织CRUD操作测试 - 专注于根节点下的子组织"""
    
    async def get_root_organization(self, client: OrganizationTestClient) -> Dict:
        """获取根组织（辅助方法）"""
        orgs = await client.get_organizations()
        root_orgs = [org for org in orgs.get("items", []) if org.get("parent_id") is None]
        assert len(root_orgs) > 0, "系统中应该存在根组织"
        return root_orgs[0]
    
    @pytest.mark.asyncio
    async def test_create_child_organization(self):
        """测试创建子组织（根节点下的第一级子组织）"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建子组织
            child_org = await client.create_organization("测试子组织", parent_id=root_org["id"])
            assert child_org["name"] == "测试子组织"
            assert child_org["parent_id"] == root_org["id"]
            
            # 验证创建成功
            created_org = await client.get_organization(child_org["id"])
            assert created_org["name"] == "测试子组织"
            assert created_org["parent_id"] == root_org["id"]
    
    @pytest.mark.asyncio
    async def test_get_organization_list(self):
        """测试获取组织列表"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建测试子组织
            org1 = await client.create_organization("测试组织列表1", parent_id=root_org["id"])
            org2 = await client.create_organization("测试组织列表2", parent_id=root_org["id"])
            
            # 获取列表
            result = await client.get_organizations()
            assert "items" in result
            assert "total" in result
            assert len(result["items"]) > 0
            
            # 验证组织在列表中
            org_names = [org["name"] for org in result["items"]]
            assert "测试组织列表1" in org_names or "测试组织列表2" in org_names
            
            # 验证列表包含统计信息
            org_item = next((item for item in result["items"] if item["id"] == org1["id"]), None)
            assert org_item is not None
            assert "majors_count" in org_item
            assert "classes_count" in org_item
            assert "students_count" in org_item
            assert "level" in org_item
    
    @pytest.mark.asyncio
    async def test_get_organization_tree(self):
        """测试获取组织树结构"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建测试树结构（在根节点下）
            child1 = await client.create_organization("树测试子节点1", parent_id=root_org["id"])
            child2 = await client.create_organization("树测试子节点2", parent_id=root_org["id"])
            grandchild = await client.create_organization("树测试孙节点", parent_id=child1["id"])
            
            # 获取树结构
            tree_result = await client.get_organization_tree()
            assert "tree" in tree_result
            tree = tree_result["tree"]
            
            # 验证树结构
            assert len(tree) > 0
            root_node = next((node for node in tree if node["id"] == root_org["id"]), None)
            assert root_node is not None
            assert len(root_node.get("children", [])) >= 2
            
            # 验证子节点包含统计信息
            child1_node = next((node for node in root_node.get("children", []) if node["id"] == child1["id"]), None)
            assert child1_node is not None
            assert "majors_count" in child1_node
            assert "classes_count" in child1_node
            assert "students_count" in child1_node
    
    @pytest.mark.asyncio
    async def test_update_organization_name(self):
        """测试更新组织名称"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建子组织
            org = await client.create_organization("原始名称", parent_id=root_org["id"])
            
            # 更新名称（只更新name，不更新parent_id）
            updated = await client.update_organization(org["id"], name="更新后的名称")
            assert updated["name"] == "更新后的名称"
            assert updated["id"] == org["id"]
            assert updated["parent_id"] == root_org["id"]  # parent_id应该保持不变
            
            # 验证更新成功
            detail = await client.get_organization(org["id"])
            assert detail["name"] == "更新后的名称"
            assert detail["parent_id"] == root_org["id"]
    
    @pytest.mark.asyncio
    async def test_update_organization_parent(self):
        """测试更新组织父节点（在同一根节点下的子组织之间移动）"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建两个一级子组织
            parent1 = await client.create_organization("父组织1", parent_id=root_org["id"])
            parent2 = await client.create_organization("父组织2", parent_id=root_org["id"])
            
            # 创建子组织，初始父节点为parent1
            child = await client.create_organization("子节点", parent_id=parent1["id"])
            
            # 更新父节点到parent2
            updated = await client.update_organization(child["id"], parent_id=parent2["id"])
            assert updated["parent_id"] == parent2["id"]
            
            # 验证更新成功
            detail = await client.get_organization(child["id"])
            assert detail["parent_id"] == parent2["id"]
    
    @pytest.mark.asyncio
    async def test_delete_organization(self):
        """测试删除组织（子组织）"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建子组织（确保没有子组织和专业关联）
            org = await client.create_organization("待删除组织", parent_id=root_org["id"])
            org_id = org["id"]
            
            # 删除组织
            result = await client.delete_organization(org_id)
            assert "message" in result
            
            # 验证删除后无法获取
            response = await client.client.get(f"/organizations/{org_id}")
            assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_cannot_create_duplicate_root(self):
        """测试不能创建重复的根节点"""
        async with OrganizationTestClient() as client:
            # 验证根组织已存在
            root_org = await self.get_root_organization(client)
            
            # 尝试创建第二个根节点（应该失败）
            response = await client.client.post(
                "/organizations",
                json={"name": "新根节点", "parent_id": None}
            )
            assert response.status_code == 400
            assert "root" in response.json()["detail"].lower() or "根节点" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_cannot_set_parent_to_self(self):
        """测试不能将父节点设置为自己"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建子组织
            org = await client.create_organization("测试组织", parent_id=root_org["id"])
            
            # 尝试设置父节点为自己（应该失败）
            response = await client.client.put(
                f"/organizations/{org['id']}",
                json={"parent_id": org["id"]}
            )
            assert response.status_code == 400
            assert "itself" in response.json()["detail"].lower() or "自己" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_cannot_create_circular_reference(self):
        """测试不能创建循环引用"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建组织链：A -> B -> C（都在根节点下）
            org_a = await client.create_organization("组织A", parent_id=root_org["id"])
            org_b = await client.create_organization("组织B", parent_id=org_a["id"])
            org_c = await client.create_organization("组织C", parent_id=org_b["id"])
            
            # 尝试将A的父节点设置为C（应该失败，因为会形成循环）
            response = await client.client.put(
                f"/organizations/{org_a['id']}",
                json={"parent_id": org_c["id"]}
            )
            assert response.status_code == 400
            assert "circular" in response.json()["detail"].lower() or "循环" in response.json()["detail"]


class TestOrganizationStatistics:
    """组织统计信息测试"""
    
    async def get_root_organization(self, client: OrganizationTestClient) -> Dict:
        """获取根组织（辅助方法）"""
        orgs = await client.get_organizations()
        root_orgs = [org for org in orgs.get("items", []) if org.get("parent_id") is None]
        assert len(root_orgs) > 0, "系统中应该存在根组织"
        return root_orgs[0]
    
    @pytest.mark.asyncio
    async def test_organization_statistics(self):
        """测试组织统计信息准确性"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建子组织
            org = await client.create_organization("统计测试组织", parent_id=root_org["id"])
            
            # 创建专业
            major1 = await client.create_major("统计测试专业1", org["id"])
            major2 = await client.create_major("统计测试专业2", org["id"])
            
            # 创建班级
            class1 = await client.create_class("统计测试班级1", major1["id"])
            class2 = await client.create_class("统计测试班级2", major1["id"])
            class3 = await client.create_class("统计测试班级3", major2["id"])
            
            # 获取组织列表（包含统计信息）
            result = await client.get_organizations()
            org_item = next((item for item in result["items"] if item["id"] == org["id"]), None)
            
            assert org_item is not None
            # 验证专业数量
            assert org_item["majors_count"] == 2, f"专业数量应为2，实际为{org_item['majors_count']}"
            # 验证班级数量
            assert org_item["classes_count"] == 3, f"班级数量应为3，实际为{org_item['classes_count']}"
    
    @pytest.mark.asyncio
    async def test_nested_organization_statistics(self):
        """测试嵌套组织的统计信息（包含子组织的数据）"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建组织层级：父组织 -> 子组织（都在根节点下）
            parent_org = await client.create_organization("嵌套测试父组织", parent_id=root_org["id"])
            child_org = await client.create_organization("嵌套测试子组织", parent_id=parent_org["id"])
            
            # 在子组织下创建专业和班级
            major = await client.create_major("嵌套测试专业", child_org["id"])
            class1 = await client.create_class("嵌套测试班级1", major["id"])
            class2 = await client.create_class("嵌套测试班级2", major["id"])
            
            # 获取组织列表
            result = await client.get_organizations()
            parent_item = next((item for item in result["items"] if item["id"] == parent_org["id"]), None)
            child_item = next((item for item in result["items"] if item["id"] == child_org["id"]), None)
            
            assert parent_item is not None
            assert child_item is not None
            
            # 父组织的统计应该包含子组织的数据
            assert parent_item["majors_count"] >= 1, f"父组织专业数量应为>=1，实际为{parent_item['majors_count']}"
            assert parent_item["classes_count"] >= 2, f"父组织班级数量应为>=2，实际为{parent_item['classes_count']}"
            
            # 子组织的统计
            assert child_item["majors_count"] == 1, f"子组织专业数量应为1，实际为{child_item['majors_count']}"
            assert child_item["classes_count"] == 2, f"子组织班级数量应为2，实际为{child_item['classes_count']}"
    
    @pytest.mark.asyncio
    async def test_organization_level_calculation(self):
        """测试组织层级计算"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建多层级组织（在根节点下）
            level1 = await client.create_organization("层级测试一级组织", parent_id=root_org["id"])
            level2 = await client.create_organization("层级测试二级组织", parent_id=level1["id"])
            level3 = await client.create_organization("层级测试三级组织", parent_id=level2["id"])
            
            # 获取组织列表
            result = await client.get_organizations()
            
            # 验证层级
            root_item = next((item for item in result["items"] if item["id"] == root_org["id"]), None)
            level1_item = next((item for item in result["items"] if item["id"] == level1["id"]), None)
            level2_item = next((item for item in result["items"] if item["id"] == level2["id"]), None)
            level3_item = next((item for item in result["items"] if item["id"] == level3["id"]), None)
            
            assert root_item is not None
            assert level1_item is not None
            assert level2_item is not None
            assert level3_item is not None
            
            assert root_item["level"] == 0, f"根组织层级应为0，实际为{root_item['level']}"
            assert level1_item["level"] == 1, f"一级组织层级应为1，实际为{level1_item['level']}"
            assert level2_item["level"] == 2, f"二级组织层级应为2，实际为{level2_item['level']}"
            assert level3_item["level"] == 3, f"三级组织层级应为3，实际为{level3_item['level']}"
    
    @pytest.mark.asyncio
    async def test_statistics_after_deletion(self):
        """测试删除组织后统计信息更新"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建子组织
            org = await client.create_organization("待删除统计组织", parent_id=root_org["id"])
            major = await client.create_major("待删除统计专业", org["id"])
            
            # 获取统计信息
            result = await client.get_organizations()
            org_item = next((item for item in result["items"] if item["id"] == org["id"]), None)
            assert org_item is not None
            assert org_item["majors_count"] == 1, f"专业数量应为1，实际为{org_item['majors_count']}"
            
            # 尝试删除组织（应该失败，因为有专业关联）
            response = await client.client.delete(f"/organizations/{org['id']}")
            assert response.status_code == 400  # 应该返回错误，因为有专业关联
            assert "major" in response.json()["detail"].lower() or "专业" in response.json()["detail"]


class TestOrganizationImport:
    """组织批量导入测试"""
    
    async def get_root_organization(self, client: OrganizationTestClient) -> Dict:
        """获取根组织（辅助方法）"""
        orgs = await client.get_organizations()
        root_orgs = [org for org in orgs.get("items", []) if org.get("parent_id") is None]
        assert len(root_orgs) > 0, "系统中应该存在根组织"
        return root_orgs[0]
    
    @pytest.mark.asyncio
    async def test_download_template(self):
        """测试下载导入模板"""
        async with OrganizationTestClient() as client:
            template_bytes = await client.download_template()
            assert len(template_bytes) > 0
            
            # 验证是Excel文件
            assert template_bytes.startswith(b"PK")  # Excel文件以PK开头（ZIP格式）
    
    @pytest.mark.asyncio
    async def test_import_organizations(self):
        """测试批量导入组织（子组织）"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 使用时间戳确保组织名称唯一
            import time
            timestamp = int(time.time())
            
            # 创建Excel文件（所有组织都是根组织的子组织）
            data = {
                "组织名称": [f"导入组织1_{timestamp}", f"导入组织2_{timestamp}", f"导入组织3_{timestamp}"],
                "上级组织ID（可选）": [root_org["id"], root_org["id"], root_org["id"]]
            }
            df = pd.DataFrame(data)
            
            # 保存为Excel字节流
            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Sheet1')
            excel_bytes = excel_buffer.getvalue()
            
            # 导入组织
            result = await client.import_organizations(excel_bytes, "test_import.xlsx")
            assert "imported_count" in result
            assert result["imported_count"] == 3
            assert result["total_count"] == 3
    
    @pytest.mark.asyncio
    async def test_import_with_parent(self):
        """测试导入带父组织的组织"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 使用时间戳确保组织名称唯一
            import time
            timestamp = int(time.time())
            
            # 先创建父组织（根组织的子组织）
            parent = await client.create_organization(f"导入测试父组织_{timestamp}", parent_id=root_org["id"])
            
            # 创建Excel文件
            data = {
                "组织名称": [f"导入子组织1_{timestamp}", f"导入子组织2_{timestamp}"],
                "上级组织ID（可选）": [parent["id"], parent["id"]]
            }
            df = pd.DataFrame(data)
            
            # 保存为Excel字节流
            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Sheet1')
            excel_bytes = excel_buffer.getvalue()
            
            # 导入组织
            result = await client.import_organizations(excel_bytes, "test_import_parent.xlsx")
            assert result["imported_count"] == 2
            assert result["total_count"] == 2
    
    @pytest.mark.asyncio
    async def test_import_validation_errors(self):
        """测试导入数据验证错误"""
        async with OrganizationTestClient() as client:
            # 创建无效的Excel文件（缺少必需列）
            data = {
                "错误列名": ["组织1", "组织2"]
            }
            df = pd.DataFrame(data)
            
            excel_buffer = io.BytesIO()
            with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Sheet1')
            excel_bytes = excel_buffer.getvalue()
            
            # 尝试导入（应该失败）
            response = await client.client.post(
                "/organizations/import",
                files={"file": ("test.xlsx", excel_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
            )
            assert response.status_code == 400


class TestOrganizationEdgeCases:
    """组织管理边界条件测试"""
    
    async def get_root_organization(self, client: OrganizationTestClient) -> Dict:
        """获取根组织（辅助方法）"""
        orgs = await client.get_organizations()
        root_orgs = [org for org in orgs.get("items", []) if org.get("parent_id") is None]
        assert len(root_orgs) > 0, "系统中应该存在根组织"
        return root_orgs[0]
    
    @pytest.mark.asyncio
    async def test_delete_organization_with_children(self):
        """测试删除有子组织的组织（应该失败）"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建父子组织（在根节点下）
            parent = await client.create_organization("边界测试父组织", parent_id=root_org["id"])
            child = await client.create_organization("边界测试子组织", parent_id=parent["id"])
            
            # 尝试删除父组织（应该失败）
            response = await client.client.delete(f"/organizations/{parent['id']}")
            assert response.status_code == 400
            assert "children" in response.json()["detail"].lower() or "子组织" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_delete_organization_with_majors(self):
        """测试删除有专业关联的组织（应该失败）"""
        async with OrganizationTestClient() as client:
            # 获取根组织
            root_org = await self.get_root_organization(client)
            
            # 创建组织和专业
            org = await client.create_organization("边界测试有专业的组织", parent_id=root_org["id"])
            major = await client.create_major("边界测试专业", org["id"])
            
            # 尝试删除组织（应该失败）
            response = await client.client.delete(f"/organizations/{org['id']}")
            assert response.status_code == 400
            assert "major" in response.json()["detail"].lower() or "专业" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_organization(self):
        """测试获取不存在的组织"""
        async with OrganizationTestClient() as client:
            response = await client.client.get("/organizations/99999")
            assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_update_nonexistent_organization(self):
        """测试更新不存在的组织"""
        async with OrganizationTestClient() as client:
            response = await client.client.put(
                "/organizations/99999",
                json={"name": "新名称"}
            )
            assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_create_organization_with_invalid_parent(self):
        """测试使用无效的父组织ID创建组织"""
        async with OrganizationTestClient() as client:
            response = await client.client.post(
                "/organizations",
                json={"name": "测试组织", "parent_id": 99999}
            )
            assert response.status_code == 404


class TestOrganizationSearch:
    """组织搜索筛选功能测试"""

    async def get_root_organization(self, client: OrganizationTestClient) -> Dict:
        """获取根组织（辅助方法）"""
        orgs_response = await client.get_organizations()
        root_orgs = [org for org in orgs_response.get("items", []) if org.get("parent_id") is None]
        assert len(root_orgs) > 0, "系统中应该存在根组织"
        return root_orgs[0]

    @pytest.mark.asyncio
    async def test_search_by_name_exact_match(self):
        """测试精确匹配组织名称搜索"""
        async with OrganizationTestClient() as client:
            root_org = await self.get_root_organization(client)
            
            # 创建测试组织
            test_org = await client.create_organization("搜索测试组织A", parent_id=root_org["id"])
            
            try:
                # 精确搜索
                result = await client.get_organizations(search="搜索测试组织A")
                assert "items" in result
                assert len(result["items"]) >= 1
                assert any(org["name"] == "搜索测试组织A" for org in result["items"])
            finally:
                # 清理
                await client.delete_organization(test_org["id"])

    @pytest.mark.asyncio
    async def test_search_by_name_partial_match(self):
        """测试部分匹配组织名称搜索"""
        async with OrganizationTestClient() as client:
            root_org = await self.get_root_organization(client)
            
            # 创建测试组织
            test_org1 = await client.create_organization("搜索测试组织B", parent_id=root_org["id"])
            test_org2 = await client.create_organization("搜索测试组织C", parent_id=root_org["id"])
            
            try:
                # 部分搜索
                result = await client.get_organizations(search="搜索测试")
                assert "items" in result
                assert len(result["items"]) >= 2
                org_names = [org["name"] for org in result["items"]]
                assert "搜索测试组织B" in org_names
                assert "搜索测试组织C" in org_names
            finally:
                # 清理
                await client.delete_organization(test_org1["id"])
                await client.delete_organization(test_org2["id"])

    @pytest.mark.asyncio
    async def test_search_no_results(self):
        """测试搜索无结果"""
        async with OrganizationTestClient() as client:
            # 搜索不存在的组织
            result = await client.get_organizations(search="不存在的组织名称12345")
            assert "items" in result
            assert len(result["items"]) == 0
            assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_search_empty_string(self):
        """测试空字符串搜索（应返回所有结果）"""
        async with OrganizationTestClient() as client:
            # 空字符串搜索应该返回所有组织
            result_with_search = await client.get_organizations(search="")
            result_without_search = await client.get_organizations()
            
            # 空字符串搜索应该等同于不搜索
            assert result_with_search["total"] == result_without_search["total"]

    @pytest.mark.asyncio
    async def test_search_with_pagination(self):
        """测试搜索与分页结合"""
        async with OrganizationTestClient() as client:
            root_org = await self.get_root_organization(client)
            
            # 创建多个测试组织
            test_orgs = []
            for i in range(5):
                org = await client.create_organization(f"搜索分页测试{i}", parent_id=root_org["id"])
                test_orgs.append(org)
            
            try:
                # 搜索并分页
                result_page1 = await client.get_organizations(search="搜索分页", skip=0, limit=2)
                result_page2 = await client.get_organizations(search="搜索分页", skip=2, limit=2)
                
                assert result_page1["total"] >= 5
                assert len(result_page1["items"]) == 2
                assert len(result_page2["items"]) == 2
                
                # 确保分页结果不重复
                page1_ids = {org["id"] for org in result_page1["items"]}
                page2_ids = {org["id"] for org in result_page2["items"]}
                assert len(page1_ids & page2_ids) == 0  # 没有交集
            finally:
                # 清理
                for org in test_orgs:
                    await client.delete_organization(org["id"])


if __name__ == "__main__":
    # 运行测试
    pytest.main([__file__, "-v", "--tb=short"])

