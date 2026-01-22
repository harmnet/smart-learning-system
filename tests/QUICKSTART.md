# 快速开始指南

## 快速运行测试

### 1. 启动服务

```bash
# 终端1: 启动后端
cd backend
uvicorn app.main:app --reload --port 8000

# 终端2: 启动前端
cd frontend
npm run dev
```

### 2. 运行API测试

```bash
cd backend
pytest tests/api/admin/ -v
```

### 3. 运行浏览器测试

首先安装Playwright（如果还没安装）：

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

然后运行测试：

```bash
npx playwright test tests/e2e/admin/ --ui
```

## 测试单个模块

### API测试示例

```bash
# 测试组织管理
pytest tests/api/admin/test_organizations.py -v

# 测试学生管理
pytest tests/api/admin/test_students.py -v
```

### 浏览器测试示例

```bash
# 测试Dashboard
npx playwright test tests/e2e/admin/test_dashboard.spec.ts

# 测试组织管理
npx playwright test tests/e2e/admin/test_organizations.spec.ts
```

## 常见问题

### Q: API测试失败，提示无法连接
A: 确保后端服务运行在 http://localhost:8000，并且管理员账号正确。

### Q: 浏览器测试失败，提示找不到元素
A: 
1. 确保前端服务运行在 http://localhost:3000
2. 使用 `--ui` 模式查看详细执行过程
3. 检查页面是否正常加载

### Q: 如何跳过某些测试？
A: 
- API测试：使用 `pytest -k "not test_delete"` 跳过包含delete的测试
- 浏览器测试：使用 `test.skip()` 或 `test.describe.skip()`

### Q: 如何调试失败的测试？
A:
- API测试：使用 `pytest -v -s` 显示详细输出
- 浏览器测试：使用 `--ui` 模式或 `--headed` 模式查看浏览器操作

## 下一步

查看 [README.md](./README.md) 了解完整的测试文档和配置选项。
