# 智能在线学习系统 - 技术选型与架构设计 (Technical Stack)

## 1. 核心技术栈 (Tech Stack)

### 1.1 前端 (Frontend)
*   **框架**: **React 18+** (基于 **Next.js** 框架)
    *   *理由*: 支持服务端渲染 (SSR)，利于门户页面的 SEO；开发体验统一，路由管理强大。
*   **UI 组件库**:
    *   管理后台: **Ant Design 5.0+** (企业级中后台首选，组件丰富)。
    *   学生端 (C端): **Tailwind CSS + Shadcn/ui** (风格现代，定制性强，适合打造差异化体验)。
*   **状态管理**: **Zustand** (轻量、Hooks 风格，比 Redux 更简洁)。
*   **HTTP 客户端**: **Axios** 或 **Ky**。

### 1.2 后端 (Backend)
*   **语言**: **Python 3.10+**
*   **Web 框架**: **FastAPI**
    *   *理由*: 高性能 (基于 Starlette)，原生支持异步 (AsyncIO)，自动生成 OpenAPI (Swagger) 文档，**非常适合处理 AI 接口的高并发等待场景**。
*   **任务队列**: **Celery**
    *   *理由*: 处理耗时任务（视频转码、AI 批量生成、发送通知）。
*   **AI 编排**: **LangChain** (Python版)
    *   *理由*: 简化与大模型交互的流程管理（Prompt 模板、记忆管理）。

### 1.3 数据库与存储 (Database)
*   **关系型数据库**: **PostgreSQL 15+**
    *   *用途*: 存储用户、课程、订单、班级等核心业务数据。
    *   *扩展*: 使用 `pgvector` 插件存储向量数据，支持 AI 知识库检索。
*   **文档数据库**: **MongoDB 6.0+**
    *   *用途*: 存储学习日志、题库（结构多变）、AI 对话历史、非结构化资源元数据。
*   **缓存与消息**: **Redis 7.0+**
    *   *用途*:
        1.  用户 Session/Token 存储。
        2.  热点数据缓存。
        3.  Celery 消息队列 Broker。

### 1.4 基础设施与 AI
*   **AI 服务**: **阿里云 DashScope API** (通义千问 Qwen)。
*   **部署**: Docker + Docker Compose (开发环境)。

---

## 2. 系统架构 (System Architecture)

### 2.1 逻辑架构图

```mermaid
graph TD
    User[用户 (Web/Mobile)] --> Nginx[Nginx 网关]
    
    subgraph Frontend [前端应用层]
        NextJS_Admin[Next.js (管理后台/教师端)]
        NextJS_Student[Next.js (学生端/门户)]
    end
    
    Nginx --> NextJS_Admin
    Nginx --> NextJS_Student
    
    subgraph Backend [后端服务层]
        FastAPI[FastAPI 主服务集群]
        Celery[Celery 异步任务 Worker]
    end
    
    NextJS_Admin -- REST API --> FastAPI
    NextJS_Student -- REST API --> FastAPI
    FastAPI -- 任务投递 --> Redis
    Redis -- 任务消费 --> Celery
    
    subgraph Data [数据持久层]
        PG[(PostgreSQL\n业务数据 + 向量)]
        Mongo[(MongoDB\n日志 + 题库)]
        RedisCache[(Redis\n缓存)]
    end
    
    FastAPI --> PG
    FastAPI --> Mongo
    FastAPI --> RedisCache
    Celery --> PG
    Celery --> Mongo
    
    subgraph External [外部服务]
        Aliyun[阿里云 AI (DashScope)]
        OSS[阿里云 OSS / MinIO (文件存储)]
    end
    
    FastAPI -- API调用 --> Aliyun
    Celery -- 异步调用 --> Aliyun
    FastAPI -- 文件上传 --> OSS
```

### 2.2 关键流程设计

1.  **AI 辅助学习流程**:
    *   学生提问 -> FastAPI 接收 -> 查询 PG (向量库) 检索相关知识 -> 组装 Prompt -> 调用阿里云 API -> 返回答案 -> 存入 Mongo (历史记录)。
2.  **异步视频处理**:
    *   教师上传视频 -> 存入 OSS -> FastAPI 写入记录 -> 发送 Celery 任务 -> Celery Worker 进行转码/提取字幕 -> 更新 PG 状态。

---

## 3. 项目结构规划

```text
smart-learning/
├── docs/                   # 项目文档
├── frontend/               # 前端 Monorepo (或独立目录)
│   ├── admin/              # 管理端/教师端 (Next.js + AntD)
│   └── student/            # 学生端/门户 (Next.js + Tailwind)
├── backend/                # 后端 API 服务
│   ├── app/
│   │   ├── api/            # API 路由定义 (v1/auth, v1/courses...)
│   │   ├── core/           # 核心配置 (Config, Security, Exceptions)
│   │   ├── models/         # SQLAlchemy Models (PG)
│   │   ├── schemas/        # Pydantic Schemas (数据验证)
│   │   ├── services/       # 业务逻辑层 (CRUD, AI Service)
│   │   └── db/             # 数据库连接 (PG, Mongo, Redis)
│   ├── celery_worker/      # 异步任务定义
│   └── main.py             # 启动文件
├── docker-compose.yml      # 容器编排
└── requirements.txt        # Python 依赖
```

