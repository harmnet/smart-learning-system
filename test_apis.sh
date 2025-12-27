#!/bin/bash

echo "🧪 Smart Learning System API 测试"
echo "=================================="
echo ""

# 测试专业列表API
echo "1️⃣ 测试专业列表 API..."
MAJORS=$(curl -s http://localhost:8000/api/v1/majors/)
MAJOR_COUNT=$(echo $MAJORS | grep -o "id" | wc -l | tr -d ' ')
if [ "$MAJOR_COUNT" -gt 0 ]; then
    echo "   ✅ 专业列表 API 正常 (获取到 $MAJOR_COUNT 个专业)"
else
    echo "   ❌ 专业列表 API 失败"
fi
echo ""

# 测试登录API
echo "2️⃣ 测试登录 API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "   ✅ 登录 API 正常"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:50}..."
else
    echo "   ❌ 登录 API 失败"
    echo "   Response: $LOGIN_RESPONSE"
fi
echo ""

# 测试课程列表API
echo "3️⃣ 测试课程列表 API..."
COURSES=$(curl -s http://localhost:8000/api/v1/courses/)
if echo "$COURSES" | grep -q "\["; then
    echo "   ✅ 课程列表 API 正常"
else
    echo "   ❌ 课程列表 API 失败"
fi
echo ""

echo "=================================="
echo "✅ API 测试完成！"
echo ""
echo "📝 前端页面列表:"
echo "   - 首页: http://localhost:3000"
echo "   - 登录页: http://localhost:3000/auth/login"
echo "   - 注册页: http://localhost:3000/auth/register"
echo "   - 学生仪表盘: http://localhost:3000/dashboard"
echo "   - 专业列表: http://localhost:3000/majors"
echo "   - 课程学习: http://localhost:3000/learn/1"
echo ""
echo "🎉 系统开发完成！"

