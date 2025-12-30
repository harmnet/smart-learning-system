# 组织管理功能单元测试脚本

## 概述

本测试脚本用于测试智能学习系统中组织管理功能的所有操作，包括：

1. **CRUD操作**：创建、读取、更新、删除组织
2. **组织树结构管理**：测试多层级组织关系
3. **批量导入功能**：测试Excel批量导入
4. **统计信息准确性**：验证组织统计数据的正确性
5. **关联数据统计**：验证专业、班级、学生数量的统计准确性
6. **边界条件和错误处理**：测试各种异常情况

## 测试覆盖范围

### 1. 组织CRUD操作测试 (`TestOrganizationCRUD`)
- ✅ 创建根组织
- ✅ 创建子组织
- ✅ 获取组织列表
- ✅ 获取组织树结构
- ✅ 更新组织名称
- ✅ 更新组织父节点
- ✅ 删除组织
- ✅ 不能创建重复的根节点
- ✅ 不能将父节点设置为自己
- ✅ 不能创建循环引用

### 2. 组织统计信息测试 (`TestOrganizationStatistics`)
- ✅ 组织统计信息准确性
- ✅ 嵌套组织的统计信息（包含子组织的数据）
- ✅ 组织层级计算
- ✅ 删除组织后统计信息更新

### 3. 组织批量导入测试 (`TestOrganizationImport`)
- ✅ 下载导入模板
- ✅ 批量导入组织
- ✅ 导入带父组织的组织
- ✅ 导入数据验证错误

### 4. 组织管理边界条件测试 (`TestOrganizationEdgeCases`)
- ✅ 删除有子组织的组织（应该失败）
- ✅ 删除有专业关联的组织（应该失败）
- ✅ 获取不存在的组织
- ✅ 更新不存在的组织
- ✅ 使用无效的父组织ID创建组织

## 环境要求

- Python 3.8+
- 后端服务运行在 `http://localhost:8000`
- 数据库已初始化
- 管理员账号：`admin` / `admin123`

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行测试

### 运行所有测试

```bash
pytest test_organization_management.py -v
```

### 运行特定测试类

```bash
# 只运行CRUD测试
pytest test_organization_management.py::TestOrganizationCRUD -v

# 只运行统计信息测试
pytest test_organization_management.py::TestOrganizationStatistics -v

# 只运行批量导入测试
pytest test_organization_management.py::TestOrganizationImport -v

# 只运行边界条件测试
pytest test_organization_management.py::TestOrganizationEdgeCases -v
```

### 运行特定测试用例

```bash
# 运行单个测试
pytest test_organization_management.py::TestOrganizationCRUD::test_create_root_organization -v
```

### 生成测试报告

```bash
# 生成HTML报告
pytest test_organization_management.py --html=report.html --self-contained-html

# 生成JUnit XML报告
pytest test_organization_management.py --junitxml=report.xml
```

## 测试配置

测试脚本使用以下默认配置：

- **API基础URL**: `http://localhost:8000/api/v1`
- **管理员用户名**: `admin`
- **管理员密码**: `admin123`

如需修改配置，请编辑 `test_organization_management.py` 文件中的配置常量：

```python
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
```

## 测试数据清理

测试脚本会在测试过程中创建测试数据。为了保持测试环境的干净，建议：

1. 在测试前清理数据库中的测试数据
2. 或者使用测试数据库
3. 测试完成后手动清理测试数据

## 注意事项

1. **测试顺序**：某些测试可能依赖于其他测试创建的数据，建议按顺序运行所有测试
2. **数据库状态**：确保数据库已正确初始化，包含必要的表结构
3. **服务状态**：确保后端服务正在运行且可访问
4. **权限**：确保管理员账号有足够的权限执行所有操作
5. **数据隔离**：测试可能会修改数据库，建议在测试环境中运行

## 测试结果解读

### 成功示例

```
test_organization_management.py::TestOrganizationCRUD::test_create_root_organization PASSED
test_organization_management.py::TestOrganizationCRUD::test_create_child_organization PASSED
...
```

### 失败示例

如果测试失败，会显示详细的错误信息：

```
test_organization_management.py::TestOrganizationCRUD::test_create_root_organization FAILED
...
AssertionError: 创建组织失败: {"detail": "Root organization already exists"}
```

## 故障排查

### 1. 连接错误

如果出现连接错误，检查：
- 后端服务是否正在运行
- API地址是否正确
- 网络连接是否正常

### 2. 认证错误

如果出现401错误，检查：
- 管理员账号密码是否正确
- Token是否有效
- 认证中间件是否正常工作

### 3. 数据错误

如果出现数据相关错误，检查：
- 数据库连接是否正常
- 表结构是否正确
- 测试数据是否已清理

## 扩展测试

如需添加新的测试用例，请参考现有测试的结构：

1. 继承相应的测试类
2. 使用 `@pytest.mark.asyncio` 装饰器
3. 使用 `OrganizationTestClient` 进行API调用
4. 使用 `assert` 进行断言

示例：

```python
@pytest.mark.asyncio
async def test_new_feature(self):
    async with OrganizationTestClient() as client:
        # 执行测试操作
        result = await client.some_method()
        # 断言
        assert result["status"] == "success"
```

## 贡献

如有问题或建议，请提交Issue或Pull Request。

