# 配置指南

本文档说明如何配置数珩智学系统的各项服务。

## 目录

- [环境变量配置](#环境变量配置)
- [数据库配置](#数据库配置)
- [阿里云服务配置](#阿里云服务配置)
- [大模型 API 配置](#大模型-api-配置)
- [本地开发配置](#本地开发配置)

---

## 环境变量配置

### 后端配置

1. 复制配置模板：
```bash
cd backend
cp .env.example .env
```

2. 编辑 `.env` 文件，填写实际配置值

### 前端配置

1. 复制配置模板：
```bash
cd frontend
cp .env.example .env.local
```

2. 编辑 `.env.local` 文件，填写后端 API 地址

---

## 数据库配置

### PostgreSQL 安装

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Docker:**
```bash
docker run -d \
  --name smartlearning-postgres \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DB=smartlearning \
  -p 5432:5432 \
  postgres:14
```

### 创建数据库

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE smartlearning;

# 创建用户（可选）
CREATE USER smartlearning_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE smartlearning TO smartlearning_user;
```

### 导入数据库结构

```bash
cd backend

# 方式1: 使用初始化脚本
psql -U postgres -d smartlearning -f init.sql

# 方式2: 使用备份文件（如果有完整数据）
psql -U postgres -d smartlearning -f database_backup/smartlearning_backup_YYYYMMDD_HHMMSS.sql

# 方式3: 运行迁移脚本
python create_learning_tables.py
python create_exam_tables.py
python create_question_tables.py
python create_knowledge_graph_tables.py
python create_course_outline_tables.py
```

### 数据库环境变量

在 `backend/.env` 中配置：

```bash
POSTGRES_SERVER=localhost      # 数据库服务器地址
POSTGRES_USER=postgres         # 数据库用户名
POSTGRES_PASSWORD=your-password  # 数据库密码
POSTGRES_DB=smartlearning      # 数据库名称
POSTGRES_PORT=5432             # 数据库端口
```

---

## 阿里云服务配置

### 1. 获取 AccessKey

1. 登录 [阿里云控制台](https://ram.console.aliyun.com/manage/ak)
2. 进入 **访问控制 (RAM)** -> **身份管理** -> **用户**
3. 创建用户或选择现有用户
4. 点击 **创建 AccessKey**
5. 保存 `AccessKey ID` 和 `AccessKey Secret`

⚠️ **安全提示：** 不要将 AccessKey 提交到代码仓库！

### 2. OSS 对象存储配置

#### 创建 Bucket

1. 登录 [OSS 控制台](https://oss.console.aliyun.com/)
2. 点击 **创建 Bucket**
3. 配置：
   - Bucket 名称：如 `ezijingai`
   - 区域：选择就近区域（如 `cn-beijing`）
   - 存储类型：标准存储
   - 读写权限：私有
   - 版本控制：关闭（可选）

#### 配置 CORS 规则

在 Bucket 设置中添加 CORS 规则：

```xml
<CORSRule>
  <AllowedOrigin>*</AllowedOrigin>
  <AllowedMethod>GET</AllowedMethod>
  <AllowedMethod>POST</AllowedMethod>
  <AllowedMethod>PUT</AllowedMethod>
  <AllowedMethod>DELETE</AllowedMethod>
  <AllowedHeader>*</AllowedHeader>
  <ExposeHeader>ETag</ExposeHeader>
  <MaxAgeSeconds>3600</MaxAgeSeconds>
</CORSRule>
```

#### 环境变量配置

在 `backend/.env` 中配置：

```bash
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET_NAME=your-bucket-name
OSS_REGION=cn-beijing
OSS_ENDPOINT=
OSS_USE_CNAME=false
```

### 3. IMM 智能媒体管理配置

用于文档预览（Word、Excel、PDF 等）。

#### 开通服务

1. 登录 [IMM 控制台](https://imm.console.aliyun.com/)
2. 开通服务并创建项目
3. 绑定 OSS Bucket

#### 环境变量配置

```bash
IMM_PROJECT=your-imm-project-name
IMM_REGION=cn-beijing
```

---

## 大模型 API 配置

### 1. 通义千问（主要 LLM）

#### 获取 API Key

1. 访问 [DashScope](https://dashscope.aliyun.com/)
2. 登录阿里云账号
3. 进入 **API-KEY 管理**
4. 创建新的 API Key

#### 环境变量配置

```bash
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

#### 支持的模型

- `qwen-turbo` - 快速响应，适合对话
- `qwen-plus` - 平衡性能，推荐使用
- `qwen-max` - 最强性能，复杂任务

### 2. OpenAI API（可选）

如果需要使用 OpenAI 模型作为备用：

```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

---

## 本地开发配置

### 完整的开发环境配置示例

#### backend/.env

```bash
# 数据库
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=smartlearning123
POSTGRES_DB=smartlearning
POSTGRES_PORT=5432

# 安全
SECRET_KEY=dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# CORS
BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# 阿里云 OSS
OSS_ACCESS_KEY_ID=LTAI5txxxxxxxxxxxxx
OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
OSS_BUCKET_NAME=your-bucket
OSS_REGION=cn-beijing
OSS_ENDPOINT=
OSS_USE_CNAME=false

# 阿里云 IMM
IMM_PROJECT=your-imm-project
IMM_REGION=cn-beijing

# 大模型
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx

# 应用
ENVIRONMENT=development
DEBUG=True
```

#### frontend/.env.local

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=数珩智学
NEXT_PUBLIC_ENVIRONMENT=development
```

### 启动开发服务器

#### 后端

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 前端

```bash
cd frontend
npm install
npm run dev
```

访问：
- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

---

## 生产环境配置

### 安全加固

1. **使用强密钥**

```bash
# 生成 SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. **限制 CORS**

```bash
# 只允许特定域名
BACKEND_CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

3. **关闭 DEBUG**

```bash
ENVIRONMENT=production
DEBUG=False
```

4. **使用 HTTPS**

确保 OSS 和 API 都使用 HTTPS 访问。

5. **数据库连接池**

配置合适的数据库连接池大小。

### 环境变量管理

推荐使用密钥管理服务：
- 阿里云 KMS（密钥管理服务）
- AWS Secrets Manager
- HashiCorp Vault

---

## 常见问题

### Q1: 数据库连接失败

检查：
- 数据库服务是否启动
- 端口是否正确（默认 5432）
- 防火墙是否开放端口
- 用户名密码是否正确

### Q2: OSS 上传失败

检查：
- AccessKey 是否正确
- Bucket 名称是否正确
- CORS 规则是否配置
- 网络连接是否正常

### Q3: 大模型 API 调用失败

检查：
- API Key 是否有效
- 账户余额是否充足
- 网络是否能访问 API 端点
- 请求频率是否超限

---

## 技术支持

如有问题，请查看：
- 项目文档：[功能清单/SmartLearning_FeatureList.md](功能清单/SmartLearning_FeatureList.md)
- 数据库设计：[功能清单/Database_Design.md](功能清单/Database_Design.md)
- 技术栈说明：[功能清单/Technical_Stack.md](功能清单/Technical_Stack.md)
