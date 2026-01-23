#!/bin/bash
# 执行课程问答数据库迁移脚本

echo "开始执行数据库迁移..."
echo "数据库: smartlearning"
echo "迁移文件: backend/migrations/create_course_qa_tables.sql"
echo ""

# 执行迁移
psql -U postgres -d smartlearning -f backend/migrations/create_course_qa_tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ 迁移执行成功！"
    echo ""
    echo "验证表是否创建成功："
    psql -U postgres -d smartlearning -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('course_qa_session', 'course_qa_message');"
else
    echo ""
    echo "✗ 迁移执行失败，请检查错误信息"
    exit 1
fi
