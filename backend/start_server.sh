#!/bin/bash

# 后端服务启动脚本
# 自动检测并停止旧进程，然后启动新服务

cd "$(dirname "$0")"

# 激活虚拟环境
source venv/bin/activate

# 停止旧的uvicorn进程
echo "正在停止旧的后端服务..."
pkill -f "uvicorn app.main:app" 2>/dev/null
sleep 2

# 释放8000端口
lsof -ti:8000 | xargs kill -9 2>/dev/null
sleep 1

# 创建日志目录
mkdir -p logs

# 启动服务
echo "正在启动后端服务..."
nohup uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > logs/backend.log 2>&1 &

# 等待服务启动
sleep 3

# 检查服务是否启动成功
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功！"
    echo "📝 日志文件: logs/backend.log"
    echo "🌐 服务地址: http://localhost:8000"
    echo ""
    echo "查看日志: tail -f logs/backend.log"
    echo "停止服务: pkill -f 'uvicorn app.main:app'"
else
    echo "❌ 后端服务启动失败，请查看日志: logs/backend.log"
    tail -20 logs/backend.log
    exit 1
fi

