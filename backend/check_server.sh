#!/bin/bash

# 后端服务健康检查脚本
# 如果服务不可用，自动重启

cd "$(dirname "$0")"

# 检查服务是否运行
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "$(date): 后端服务不可用，正在重启..."
    ./start_server.sh
else
    echo "$(date): 后端服务运行正常"
fi

