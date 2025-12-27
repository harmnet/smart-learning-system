# Smart Learning System

智慧学习平台 - 一个现代化的在线教育管理系统

## 项目简介

Smart Learning System 是一个功能完整的在线教育管理平台，支持管理员、教师和学生三种角色，提供完整的教学资源管理、题库管理、课程管理等功能。

## 技术栈

### 后端
- **框架**: FastAPI
- **数据库**: PostgreSQL
- **ORM**: SQLAlchemy (异步)
- **Python版本**: 3.9+

### 前端
- **框架**: Next.js 14
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **HTTP客户端**: Axios

## 项目结构

```
smart learning/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── models/         # 数据模型
│   │   ├── core/          # 核心配置
│   │   └── db/            # 数据库配置
│   └── uploads/            # 上传文件存储
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── app/           # Next.js页面
│   │   ├── components/    # React组件
│   │   ├── services/      # API服务
│   │   └── locales/       # 国际化文件
│   └── public/            # 静态资源
└── README.md              # 项目说明
```

## 功能特性

### 管理员功能
- 组织管理
- 专业管理
- 班级管理
- 教师管理
- 学生管理
- 数据字典管理
- 课程封面管理

### 教师功能
- 知识图谱管理（支持树图、脑图、图谱三种展示方式）
- 教学资源管理（支持文件夹、多种文件类型、在线预览）
- 参考资料管理（支持超链接、压缩包等）
- 题库管理（单选、多选、判断、填空、问答、简答）
- 试卷卷库（待开发）
- 课程管理（待开发）
- 批改作业（待开发）
- 答疑解惑（待开发）
- 学情分析（待开发）
- 成绩管理（待开发）

### 学生功能
- 课程学习（待开发）
- 作业提交（待开发）
- 成绩查询（待开发）

## 快速开始

### 环境要求
- Python 3.9+
- Node.js 18+
- PostgreSQL 12+

### 后端启动

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置数据库（修改 app/core/config.py 中的数据库连接）

# 运行数据库迁移
python create_*.py  # 根据需要运行相应的表创建脚本

# 启动服务
uvicorn app.main:app --reload --port 8000
```

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量（可选）
# 创建 .env.local 文件，设置 NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 默认账号

### 管理员
- 用户名: `admin`
- 密码: `admin123`

### 教师（示例）
- 用户名: `13800138002`
- 密码: `12345678`

## 开发说明

### 数据库
项目使用 PostgreSQL 数据库，默认配置：
- 主机: localhost
- 端口: 5433
- 数据库: smartlearning
- 用户: postgres
- 密码: smartlearning123

### API 文档
启动后端服务后，访问 http://localhost:8000/docs 查看 Swagger API 文档

### 代码规范
- 后端遵循 PEP 8 Python 代码规范
- 前端使用 TypeScript 严格模式
- 使用 ESLint 进行代码检查

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

