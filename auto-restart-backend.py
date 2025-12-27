#!/usr/bin/env python3
"""
自动监控后端代码变化并重启服务的脚本
当检测到后端代码文件变化时，自动重启后端服务
"""

import os
import sys
import time
import subprocess
import signal
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BACKEND_PORT = 8000
FRONTEND_PORT = 3000

# 需要监控的文件扩展名
WATCH_EXTENSIONS = {'.py', '.yaml', '.yml', '.env', '.txt'}

# 需要监控的目录（相对backend目录）
WATCH_DIRS = [
    'app',
    'alembic',
]

# 忽略的目录和文件
IGNORE_PATTERNS = [
    '__pycache__',
    '.pyc',
    '.pyo',
    '.pyd',
    '.git',
    'node_modules',
    'venv',
    'env',
    '.env',
    'logs',
    '*.log',
]


class BackendChangeHandler(FileSystemEventHandler):
    """后端文件变化处理器"""
    
    def __init__(self):
        self.last_restart = 0
        self.restart_delay = 2  # 防抖延迟（秒）
        self.backend_process = None
        
    def should_ignore(self, file_path):
        """检查文件是否应该被忽略"""
        path_str = str(file_path)
        
        # 检查忽略模式
        for pattern in IGNORE_PATTERNS:
            if pattern in path_str:
                return True
        
        # 只监控Python文件和其他配置文件
        if file_path.suffix not in WATCH_EXTENSIONS:
            return True
            
        return False
    
    def is_backend_file(self, file_path):
        """检查是否是后端文件"""
        try:
            relative_path = file_path.relative_to(BACKEND_DIR)
            
            # 检查是否在监控目录中
            for watch_dir in WATCH_DIRS:
                if str(relative_path).startswith(watch_dir):
                    return True
                    
            # 检查根目录下的配置文件
            if relative_path.name in ['requirements.txt', '.env', 'alembic.ini']:
                return True
                
        except ValueError:
            # 文件不在backend目录中
            pass
            
        return False
    
    def on_modified(self, event):
        """文件修改事件"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # 忽略不需要的文件
        if self.should_ignore(file_path):
            return
        
        # 只处理后端文件
        if not self.is_backend_file(file_path):
            return
        
        # 防抖处理
        current_time = time.time()
        if current_time - self.last_restart < self.restart_delay:
            return
        
        self.last_restart = current_time
        
        print(f"\n🔄 检测到文件变化: {file_path.relative_to(PROJECT_ROOT)}")
        print("   正在重启后端服务...")
        
        self.restart_backend()
    
    def restart_backend(self):
        """重启后端服务"""
        # 停止现有服务
        self.stop_backend()
        
        # 等待端口释放
        time.sleep(2)
        
        # 启动新服务
        self.start_backend()
    
    def stop_backend(self):
        """停止后端服务"""
        try:
            # 查找占用端口的进程
            result = subprocess.run(
                ['lsof', '-ti', f':{BACKEND_PORT}'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid:
                        try:
                            os.kill(int(pid), signal.SIGKILL)
                        except ProcessLookupError:
                            pass
                print("   ✅ 后端服务已停止")
        except Exception as e:
            print(f"   ⚠️  停止服务时出错: {e}")
    
    def start_backend(self):
        """启动后端服务"""
        try:
            os.chdir(BACKEND_DIR)
            
            # 启动服务
            self.backend_process = subprocess.Popen(
                ['python3', '-m', 'uvicorn', 'app.main:app', '--reload', 
                 '--host', '0.0.0.0', '--port', str(BACKEND_PORT)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=BACKEND_DIR
            )
            
            # 等待服务启动
            time.sleep(3)
            
            # 检查服务是否启动成功
            result = subprocess.run(
                ['lsof', '-ti', f':{BACKEND_PORT}'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"   ✅ 后端服务已启动 (端口: {BACKEND_PORT})")
            else:
                print("   ❌ 后端服务启动失败，请检查日志")
                
        except Exception as e:
            print(f"   ❌ 启动服务时出错: {e}")


def main():
    """主函数"""
    print("🚀 启动后端代码监控...")
    print(f"   监控目录: {BACKEND_DIR}")
    print(f"   监控扩展: {', '.join(WATCH_EXTENSIONS)}")
    print("\n按 Ctrl+C 停止监控\n")
    
    # 创建事件处理器
    event_handler = BackendChangeHandler()
    
    # 创建观察者
    observer = Observer()
    
    # 监控backend目录
    observer.schedule(event_handler, str(BACKEND_DIR), recursive=True)
    
    # 启动观察者
    observer.start()
    
    try:
        # 保持运行
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 停止监控...")
        observer.stop()
        
        # 停止后端服务
        event_handler.stop_backend()
    
    observer.join()
    print("✅ 监控已停止")


if __name__ == "__main__":
    # 检查watchdog是否安装
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        print("❌ 缺少依赖: watchdog")
        print("   请运行: pip3 install watchdog")
        sys.exit(1)
    
    main()

