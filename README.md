# 数珩智学 - Smart Learning System

智慧学习平台，基于AI技术的现代化教育管理系统。

## 🎯 项目简介

数珩智学是一个功能完善的教育管理平台，集成了组织管理、专业管理、班级管理、学生管理、教师管理、教学资源管理、题库管理、AI智能创作等功能。

## 🚀 技术栈

### 后端
- **框架**: FastAPI (Python 3.13)
- **数据库**: PostgreSQL 14
- **缓存**: Redis
- **ORM**: SQLAlchemy (async)
- **认证**: JWT
- **文档**: Swagger/ReDoc
- **云存储**: 阿里云OSS

### 前端
- **框架**: Next.js 14
- **语言**: TypeScript
- **UI库**: Tailwind CSS, UI UX Pro Max
- **图表**: AntV G6, Graphin
- **状态管理**: React Hooks
- **HTTP客户端**: Axios

### DevOps
- **容器化**: Docker, Docker Compose
- **版本控制**: Git

## 📋 功能模块

### 管理员功能
- 🏢 **组织管理**: 组织架构的增删改查、批量导入、树形展示
- 📚 **专业管理**: 专业信息管理、专业负责人分配
- 🎓 **班级管理**: 班级管理、班级一览（可视化）、学生分布热力图
- 👨‍🎓 **学生管理**: 学生信息管理、分页查询
- 👨‍🏫 **教师管理**: 教师信息管理、用户管理
- 📖 **数据字典管理**: 系统配置管理
- 🤖 **LLM管理**: 大模型配置管理

### 教师功能
- 📁 **教学资源管理**: 
  - 文件夹管理（树形结构）
  - 教学资源上传（支持多种格式）
  - 在线预览（阿里云WebOffice）
  - 知识点关联
  - AI智能创作（Word文档生成）
  - PPT智能创作（集成Banana-Slides）
  
- 🧠 **知识图谱管理**: 
  - 知识点管理
  - 图形化展示（G6）
  - 父子节点关系
  
- ❓ **题库管理**: 
  - 多种题型（单选、多选、判断、填空、简答）
  - AI出题功能
  - 知识点关联
  - 分页查询

### 学生功能
- 📚 学习资源浏览
- 📝 在线答题
- 📊 学习进度跟踪

## 🛠️ 环境要求

- **Python**: 3.10+
- **Node.js**: 18+
- **PostgreSQL**: 14+
- **Redis**: 6+
- **Docker**: 20+ (可选)
- **Docker Compose**: 2+ (可选)

## 📦 安装部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd 数珩智学
```

### 2. 数据库初始化

使用Docker Compose启动数据库服务：

```bash
docker-compose up -d postgres redis
```

或手动安装PostgreSQL和Redis后，执行数据库脚本：

```bash
# 创建数据库
createdb -U postgres smartlearning

# 执行数据库脚本
psql -U postgres -d smartlearning -f backend/init_db.sql
```

可选：导入示例数据

```bash
# 导入50道示例试题
psql -U postgres -d smartlearning -f backend/insert_50_questions.sql
```

### 3. 后端配置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写实际的配置值
```

**重要配置项**:
- `POSTGRES_*`: 数据库连接信息
- `SECRET_KEY`: JWT密钥（生产环境必须修改）
- `OSS_*`: 阿里云OSS配置（用于文件存储）
- `GEMINI_API_KEY`: Google Gemini API密钥（用于AI功能）

### 4. 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件
```

### 5. 启动服务

**后端**:
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**前端**:
```bash
cd frontend
npm run dev
```

### 6. 访问系统

- 前端: http://localhost:3000
- 后端API文档: http://localhost:8000/docs
- ReDoc文档: http://localhost:8000/redoc

## 👤 默认账号

### 管理员
- 用户名: `admin`
- 密码: `111111`

### 教师
- 用户名: `teacher001`
- 密码: `111111`

### 学生
- 用户名: `student001`
- 密码: `111111`

## 📁 项目结构

```
数珩智学/
├── backend/                  # 后端代码
│   ├── app/
│   │   ├── api/             # API路由
│   │   │   └── v1/
│   │   │       └── endpoints/  # 各功能模块端点
│   │   ├── core/            # 核心配置
│   │   ├── models/          # 数据模型
│   │   ├── schemas/         # Pydantic模型
│   │   ├── services/        # 业务逻辑
│   │   └── utils/           # 工具函数
│   ├── requirements.txt     # Python依赖
│   ├── .env.example         # 环境变量示例
│   └── init_db.sql          # 数据库初始化脚本
├── frontend/                # 前端代码
│   ├── src/
│   │   ├── app/            # Next.js页面
│   │   │   ├── admin/      # 管理员页面
│   │   │   ├── teacher/    # 教师页面
│   │   │   ├── student/    # 学生页面
│   │   │   └── auth/       # 认证页面
│   │   ├── components/     # 组件
│   │   ├── contexts/       # React Context
│   │   ├── services/       # API服务
│   │   └── styles/         # 样式文件
│   ├── package.json        # Node依赖
│   └── .env.example        # 环境变量示例
├── docker-compose.yml      # Docker配置
└── README.md              # 项目文档
```

## 🔧 配置说明

### 阿里云OSS配置

教学资源文件存储在阿里云OSS，需要配置以下环境变量：

```env
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET_NAME=your-bucket-name
OSS_REGION=cn-beijing
```

### LLM配置

AI功能需要配置大模型API：

1. 登录系统后访问: http://localhost:3000/admin/llm-config
2. 配置硅基流动（SiliconFlow）或其他兼容OpenAI的API
3. 填写API Base URL和API Key

## 📝 开发指南

### 后端开发

```bash
# 安装开发依赖
pip install -r requirements-dev.txt

# 运行测试
pytest

# 代码格式化
black app/
isort app/

# 类型检查
mypy app/
```

### 前端开发

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务
npm start

# 代码检查
npm run lint
```

## 🐛 常见问题

### Q1: 前端无法连接后端API
**A**: 检查后端是否正常运行，CORS配置是否正确。

### Q2: 文件上传失败
**A**: 检查阿里云OSS配置是否正确，Bucket权限是否设置。

### Q3: AI功能无法使用
**A**: 检查LLM配置是否正确，API Key是否有效。

### Q4: 数据库连接失败
**A**: 检查PostgreSQL是否运行，端口是否正确（默认5433）。

## 📄 许可证

本项目采用 MIT 许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

如有问题，请通过以下方式联系：
- 项目Issues
- Email: support@smarteduonline.cn

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

---

**Made with ❤️ by Smart Learning Team**
