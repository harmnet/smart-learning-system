#!/bin/bash

# 部署脚本 - 更新Smart Learning系统到服务器
# 服务器: 123.57.6.26
# 注意: 不影响其他应用（使用独立端口和容器名称）

set -e

SSH_KEY="./duanxiaofei_key01.pem"
SERVER="root@123.57.6.26"
PROJECT_DIR="/root/smart-learning-system"
BACKUP_DIR="/root/smart-learning-backup-$(date +%Y%m%d_%H%M%S)"

echo "🚀 开始部署Smart Learning系统..."

# 1. 检查SSH密钥权限
echo "🔐 检查SSH密钥权限..."
chmod 400 "$SSH_KEY"

# 2. 检查SSH连接
echo "📡 检查SSH连接..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "echo 'SSH连接成功'" || {
    echo "❌ SSH连接失败"
    exit 1
}

# 3. 在服务器上创建备份目录
echo "💾 创建备份目录..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $BACKUP_DIR"

# 4. 备份当前配置（如果存在）
echo "📦 备份当前配置..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "
    if [ -d $PROJECT_DIR ]; then
        cp -r $PROJECT_DIR/docker-compose.yml $BACKUP_DIR/ 2>/dev/null || true
        cp -r $PROJECT_DIR/.env.production $BACKUP_DIR/ 2>/dev/null || true
        echo '已备份现有配置'
    fi
"

# 5. 同步代码到服务器
echo "📤 同步代码到服务器..."
rsync -avz --progress \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.env.local' \
    --exclude 'venv' \
    --exclude 'test-results' \
    --exclude 'playwright-report' \
    --exclude 'tests' \
    --exclude 'tests_temp' \
    ./ "$SERVER:$PROJECT_DIR/"

# 6. 在服务器上构建和部署
echo "🔨 在服务器上构建Docker镜像并部署..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "
    cd $PROJECT_DIR
    
    # 停止现有容器（只停止smartlearning相关的）
    echo '⏸️  停止现有容器...'
    docker-compose down backend frontend nginx 2>/dev/null || true
    
    # 清理旧镜像（可选）
    echo '🧹 清理旧镜像...'
    docker image prune -f
    
    # 构建后端镜像（在Linux环境）
    echo '🔨 构建后端镜像...'
    cd backend
    docker build --platform linux/amd64 -t smartlearning-backend:latest -f Dockerfile . || {
        echo '❌ 后端镜像构建失败'
        exit 1
    }
    
    # 构建前端镜像（在Linux环境）
    echo '🔨 构建前端镜像...'
    cd ../frontend
    docker build --platform linux/amd64 -t smartlearning-frontend:latest --build-arg NEXT_PUBLIC_API_URL=http://smarteduonline.cn/api/v1 -f Dockerfile . || {
        echo '❌ 前端镜像构建失败'
        exit 1
    }
    
    # 返回项目根目录
    cd ..
    
    # 启动数据库和Redis（如果未运行）
    echo '🗄️  确保数据库和Redis运行...'
    docker-compose up -d postgres redis
    
    # 等待数据库和Redis就绪
    echo '⏳ 等待数据库和Redis就绪...'
    sleep 15
    
    # 启动后端和前端服务
    echo '🚀 启动后端和前端服务...'
    docker-compose up -d backend frontend
    
    # 等待服务启动
    echo '⏳ 等待服务启动...'
    sleep 10
    
    # 启动Nginx
    echo '🌐 启动Nginx...'
    docker-compose up -d nginx
    
    # 等待Nginx启动
    sleep 5
    
    # 检查服务状态
    echo '✅ 检查服务状态...'
    docker-compose ps
"

# 7. 验证部署
echo "🔍 验证部署..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER" "
    echo '容器状态:'
    docker ps --filter 'name=smartlearning' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    
    echo ''
    echo '后端健康检查:'
    sleep 3
    curl -f http://localhost:8001/health 2>/dev/null && echo '✅ 后端正常' || echo '⚠️  后端检查失败，但可能正在启动中'
"

echo ""
echo "✅ 部署完成！"
echo "📝 备份位置: $BACKUP_DIR"
echo "🌐 服务端口映射："
echo "   - Nginx HTTP: 8080 -> 80"
echo "   - Nginx HTTPS: 8443 -> 443"
echo "   - 后端API: 8001 -> 8000"
echo "   - 前端: 3001 -> 3000"
echo "   - PostgreSQL: 5433 -> 5432"
echo "   - Redis: 6380 -> 6380"
echo ""
echo "⚠️  注意: 需要在服务器的主Nginx配置中添加反向代理规则"
echo "   将域名 smarteduonline.cn 代理到 localhost:8080"
