# 管理员端完整功能测试

本目录包含管理员端所有功能的完整测试，包括API测试和浏览器端到端测试。

## 目录结构

```
tests/
├── api/
│   └── admin/              # API测试
│       ├── conftest.py      # pytest配置和fixtures
│       ├── test_dashboard.py
│       ├── test_organizations.py
│       ├── test_majors.py
│       ├── test_classes.py
│       ├── test_students.py
│       ├── test_teachers.py
│       ├── test_users.py
│       ├── test_dictionary.py
│       ├── test_finance.py
│       ├── test_course_covers.py
│       ├── test_llm_configs.py
│       └── test_llm_call_logs.py
└── e2e/
    └── admin/               # 浏览器端到端测试
        ├── conftest.ts      # Playwright配置
        ├── playwright.config.ts
        ├── test_dashboard.spec.ts
        ├── test_organizations.spec.ts
        ├── test_majors.spec.ts
        ├── test_classes.spec.ts
        ├── test_students.spec.ts
        ├── test_teachers.spec.ts
        ├── test_users.spec.ts
        ├── test_dictionary.spec.ts
        ├── test_finance.spec.ts
        ├── test_course_covers.spec.ts
        ├── test_llm_configs.spec.ts
        └── test_llm_call_logs.spec.ts
```

## 环境要求

### API测试
- Python 3.8+
- pytest
- httpx
- 后端服务运行在 `http://localhost:8000`

### 浏览器测试
- Node.js 16+
- Playwright
- 前端服务运行在 `http://localhost:3000`
- 后端服务运行在 `http://localhost:8000`

## 环境变量配置

可以通过环境变量配置测试参数：

```bash
# API测试
export API_BASE_URL=http://localhost:8000
export TEST_ADMIN_USERNAME=admin
export TEST_ADMIN_PASSWORD=admin123

# 浏览器测试
export FRONTEND_URL=http://localhost:3000
export API_BASE_URL=http://localhost:8000
export TEST_ADMIN_USERNAME=admin
export TEST_ADMIN_PASSWORD=admin123
```

## 安装依赖

### API测试依赖

依赖已包含在 `backend/requirements.txt` 中：
- pytest
- pytest-asyncio
- httpx

### 浏览器测试依赖

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

## 运行测试

### API测试

```bash
# 进入后端目录
cd backend

# 运行所有API测试
pytest tests/api/admin/ -v

# 运行特定模块测试
pytest tests/api/admin/test_organizations.py -v

# 生成覆盖率报告
pytest tests/api/admin/ --cov=backend/app/api/v1/endpoints --cov-report=html

# 运行并显示详细输出
pytest tests/api/admin/ -v -s
```

### 浏览器测试

```bash
# 进入前端目录
cd frontend

# 运行所有E2E测试
npx playwright test tests/e2e/admin/

# 运行特定模块测试
npx playwright test tests/e2e/admin/test_organizations.spec.ts

# 以UI模式运行（推荐用于调试）
npx playwright test tests/e2e/admin/ --ui

# 以headed模式运行（显示浏览器）
npx playwright test tests/e2e/admin/ --headed

# 生成测试报告
npx playwright show-report

# 运行并生成HTML报告
npx playwright test tests/e2e/admin/ --reporter=html
```

## 测试前准备

1. **启动服务**
   ```bash
   # 启动后端服务
   cd backend
   uvicorn app.main:app --reload --port 8000

   # 启动前端服务（另一个终端）
   cd frontend
   npm run dev
   ```

2. **准备测试数据**
   - 确保有有效的管理员账号（默认：admin/admin123）
   - 确保数据库中有一些基础数据（组织、专业、班级等）

3. **检查服务状态**
   - 后端API: http://localhost:8000/docs
   - 前端页面: http://localhost:3000

## 测试覆盖范围

### API测试覆盖
- ✅ Dashboard统计接口
- ✅ Organizations CRUD、搜索、分页、导入导出
- ✅ Majors CRUD、搜索、分页、导入导出、教师搜索
- ✅ Classes CRUD、搜索、筛选、分页、导入导出、学生列表
- ✅ Students CRUD、搜索、分页、导入导出、统计
- ✅ Teachers CRUD、搜索、分页、导入导出、重置密码、统计
- ✅ Users 列表查询、搜索、重置密码
- ✅ Dictionary 类型和字典项的CRUD操作
- ✅ Finance 订单列表、统计、筛选
- ✅ Course Covers 列表、上传、更新、删除、替换
- ✅ LLM Configs CRUD、状态切换、测试功能
- ✅ LLM Call Logs 列表查询、筛选、详情查看

### 浏览器测试覆盖
- ✅ Dashboard页面加载、统计显示、快捷操作
- ✅ Organizations 列表/树形视图切换、CRUD、搜索、导入
- ✅ Majors 列表、CRUD、教师选择、导入
- ✅ Classes 列表、CRUD、筛选、学生查看、导入
- ✅ Students 列表、CRUD、班级选择、热力图、导入
- ✅ Teachers 列表、CRUD、重置密码、查看课程/班级、导入
- ✅ Users 列表、搜索、重置密码
- ✅ Dictionary 类型选择、字典项CRUD
- ✅ Finance 统计显示、订单列表、筛选、导出
- ✅ Course Covers 列表、上传、预览、编辑、删除
- ✅ LLM Configs 列表、CRUD、状态切换、测试功能
- ✅ LLM Call Logs 列表、筛选、详情查看、展开收起

## 注意事项

1. **测试数据隔离**
   - API测试会自动创建和清理测试数据
   - 浏览器测试可能会使用现有数据，请谨慎操作删除功能

2. **并发执行**
   - API测试支持并行执行
   - 浏览器测试默认并行执行，可通过 `--workers=1` 限制

3. **认证**
   - 所有测试都需要有效的管理员账号
   - 如果认证失败，测试会被跳过

4. **服务依赖**
   - 确保前后端服务都已启动
   - 确保数据库连接正常

5. **测试稳定性**
   - 某些测试可能因为网络延迟或异步操作需要调整等待时间
   - 如果测试失败，检查服务是否正常运行

## 故障排查

### API测试失败
1. 检查后端服务是否运行：`curl http://localhost:8000/docs`
2. 检查管理员账号是否正确
3. 检查数据库连接是否正常
4. 查看详细错误信息：`pytest tests/api/admin/ -v -s`

### 浏览器测试失败
1. 检查前端服务是否运行：访问 `http://localhost:3000`
2. 检查Playwright浏览器是否安装：`npx playwright install`
3. 以UI模式运行查看详细过程：`npx playwright test --ui`
4. 检查截图和视频（失败时自动生成）

## 持续集成

可以在CI/CD流程中集成这些测试：

```yaml
# GitHub Actions 示例
- name: Run API Tests
  run: |
    cd backend
    pytest tests/api/admin/ -v

- name: Run E2E Tests
  run: |
    cd frontend
    npx playwright test tests/e2e/admin/
```

## 贡献

添加新测试时：
1. 遵循现有的测试结构和命名规范
2. 确保测试可以独立运行
3. 添加必要的注释和文档
4. 更新本README文件
