#!/bin/bash

# PostgreSQL 数据库备份脚本
# 用于备份 smart learning 系统的数据库

# 数据库配置
DB_HOST="localhost"
DB_PORT="5433"
DB_NAME="smartlearning"
DB_USER="postgres"

# 备份文件路径
BACKUP_DIR="/Users/duanxiaofei/.cursor/worktrees/smart_learning/fvu/backend/database_backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/smartlearning_backup_$TIMESTAMP.sql"
LATEST_BACKUP="$BACKUP_DIR/smartlearning_latest.sql"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "=== 开始备份数据库 ==="
echo "数据库: $DB_NAME"
echo "备份文件: $BACKUP_FILE"
echo ""

# 使用 pg_dump 导出数据库
# 注意：需要设置 PGPASSWORD 环境变量或使用 .pgpass 文件
export PGPASSWORD="smartlearning123"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-privileges --clean --if-exists \
  -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功！"
    echo "备份文件: $BACKUP_FILE"
    
    # 创建最新备份的软链接
    ln -sf "$BACKUP_FILE" "$LATEST_BACKUP"
    echo "最新备份: $LATEST_BACKUP"
    
    # 显示备份文件大小
    echo ""
    echo "备份文件大小:"
    ls -lh "$BACKUP_FILE"
    
    # 列出所有备份文件
    echo ""
    echo "所有备份文件:"
    ls -lht "$BACKUP_DIR"/*.sql | head -5
else
    echo "❌ 数据库备份失败！"
    exit 1
fi

# 清理环境变量
unset PGPASSWORD

echo ""
echo "=== 备份完成 ==="

