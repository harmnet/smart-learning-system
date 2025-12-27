#!/bin/bash

# 前后端服务启动/重启脚本
# 使用方法: ./restart-services.sh [start|restart|stop|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

# 端口定义
BACKEND_PORT=8000
FRONTEND_PORT=3000

# 日志文件
LOG_DIR="${PROJECT_ROOT}/logs"
BACKEND_LOG="${LOG_DIR}/backend.log"
FRONTEND_LOG="${LOG_DIR}/frontend.log"

# 创建日志目录
mkdir -p "${LOG_DIR}"

# 函数：打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函数：检查端口是否被占用
check_port() {
    local port=$1
    lsof -ti:${port} > /dev/null 2>&1
}

# 函数：停止指定端口的服务
stop_service() {
    local port=$1
    local service_name=$2
    
    if check_port ${port}; then
        print_message "${YELLOW}" "正在停止 ${service_name} (端口 ${port})..."
        lsof -ti:${port} | xargs kill -9 2>/dev/null || true
        sleep 2
        
        if check_port ${port}; then
            print_message "${RED}" "❌ 无法停止 ${service_name}"
            return 1
        else
            print_message "${GREEN}" "✅ ${service_name} 已停止"
            return 0
        fi
    else
        print_message "${YELLOW}" "ℹ️  ${service_name} 未运行"
        return 0
    fi
}

# 函数：启动后端服务
start_backend() {
    print_message "${YELLOW}" "正在启动后端服务..."
    
    cd "${BACKEND_DIR}"
    
    # 检查Python环境
    if ! command -v python3 &> /dev/null; then
        print_message "${RED}" "❌ Python3 未安装"
        return 1
    fi
    
    # 检查依赖
    if ! python3 -c "import fastapi" 2>/dev/null; then
        print_message "${YELLOW}" "⚠️  检测到缺少依赖，正在安装..."
        pip3 install -r requirements.txt > /dev/null 2>&1 || true
    fi
    
    # 启动服务
    nohup python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port ${BACKEND_PORT} > "${BACKEND_LOG}" 2>&1 &
    BACKEND_PID=$!
    
    # 等待服务启动
    sleep 5
    
    if check_port ${BACKEND_PORT}; then
        print_message "${GREEN}" "✅ 后端服务已启动 (PID: ${BACKEND_PID}, 端口: ${BACKEND_PORT})"
        print_message "${GREEN}" "   日志文件: ${BACKEND_LOG}"
        print_message "${GREEN}" "   API文档: http://localhost:${BACKEND_PORT}/docs"
        return 0
    else
        print_message "${RED}" "❌ 后端服务启动失败，请查看日志: ${BACKEND_LOG}"
        return 1
    fi
}

# 函数：启动前端服务
start_frontend() {
    print_message "${YELLOW}" "正在启动前端服务..."
    
    cd "${FRONTEND_DIR}"
    
    # 检查Node.js环境
    if ! command -v node &> /dev/null; then
        print_message "${RED}" "❌ Node.js 未安装"
        return 1
    fi
    
    # 检查node_modules
    if [ ! -d "node_modules" ]; then
        print_message "${YELLOW}" "⚠️  检测到缺少依赖，正在安装..."
        npm install > /dev/null 2>&1 || true
    fi
    
    # 启动服务
    nohup npm run dev > "${FRONTEND_LOG}" 2>&1 &
    FRONTEND_PID=$!
    
    # 等待服务启动
    sleep 10
    
    if check_port ${FRONTEND_PORT}; then
        print_message "${GREEN}" "✅ 前端服务已启动 (PID: ${FRONTEND_PID}, 端口: ${FRONTEND_PORT})"
        print_message "${GREEN}" "   日志文件: ${FRONTEND_LOG}"
        print_message "${GREEN}" "   访问地址: http://localhost:${FRONTEND_PORT}"
        return 0
    else
        print_message "${RED}" "❌ 前端服务启动失败，请查看日志: ${FRONTEND_LOG}"
        return 1
    fi
}

# 函数：停止所有服务
stop_all() {
    print_message "${YELLOW}" "正在停止所有服务..."
    stop_service ${BACKEND_PORT} "后端服务"
    stop_service ${FRONTEND_PORT} "前端服务"
    print_message "${GREEN}" "✅ 所有服务已停止"
}

# 函数：启动所有服务
start_all() {
    print_message "${GREEN}" "🚀 开始启动服务..."
    echo ""
    
    start_backend
    echo ""
    start_frontend
    echo ""
    
    print_message "${GREEN}" "🎉 服务启动完成！"
    print_message "${GREEN}" "   前端: http://localhost:${FRONTEND_PORT}"
    print_message "${GREEN}" "   后端: http://localhost:${BACKEND_PORT}"
}

# 函数：重启所有服务
restart_all() {
    print_message "${YELLOW}" "🔄 正在重启服务..."
    echo ""
    stop_all
    echo ""
    sleep 2
    start_all
}

# 函数：查看服务状态
show_status() {
    print_message "${GREEN}" "📊 服务状态:"
    echo ""
    
    if check_port ${BACKEND_PORT}; then
        BACKEND_PID=$(lsof -ti:${BACKEND_PORT} | head -1)
        print_message "${GREEN}" "✅ 后端服务: 运行中 (PID: ${BACKEND_PID}, 端口: ${BACKEND_PORT})"
    else
        print_message "${RED}" "❌ 后端服务: 未运行"
    fi
    
    if check_port ${FRONTEND_PORT}; then
        FRONTEND_PID=$(lsof -ti:${FRONTEND_PORT} | head -1)
        print_message "${GREEN}" "✅ 前端服务: 运行中 (PID: ${FRONTEND_PID}, 端口: ${FRONTEND_PORT})"
    else
        print_message "${RED}" "❌ 前端服务: 未运行"
    fi
    
    echo ""
    print_message "${YELLOW}" "日志文件:"
    print_message "${YELLOW}" "  后端: ${BACKEND_LOG}"
    print_message "${YELLOW}" "  前端: ${FRONTEND_LOG}"
}

# 主函数
main() {
    case "${1:-restart}" in
        start)
            start_all
            ;;
        restart)
            restart_all
            ;;
        stop)
            stop_all
            ;;
        status)
            show_status
            ;;
        *)
            echo "使用方法: $0 [start|restart|stop|status]"
            echo ""
            echo "命令说明:"
            echo "  start   - 启动所有服务"
            echo "  restart - 重启所有服务（默认）"
            echo "  stop    - 停止所有服务"
            echo "  status  - 查看服务状态"
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"

