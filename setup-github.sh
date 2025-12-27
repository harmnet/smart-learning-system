#!/bin/bash

# GitHub 仓库设置脚本
# 使用方法：bash setup-github.sh

echo "🚀 Smart Learning System - GitHub 仓库设置"
echo "=========================================="
echo ""

# 检查Git配置
echo "📋 检查Git配置..."
if [ -z "$(git config --global user.name)" ] || [ -z "$(git config --global user.email)" ]; then
    echo "⚠️  Git用户信息未配置"
    echo ""
    read -p "请输入您的Git用户名（用于提交记录）: " GIT_USER_NAME
    read -p "请输入您的Git邮箱（用于提交记录）: " GIT_USER_EMAIL
    
    git config --global user.name "$GIT_USER_NAME"
    git config --global user.email "$GIT_USER_EMAIL"
    echo "✅ Git用户信息已配置"
else
    echo "✅ Git用户信息已配置："
    echo "   用户名: $(git config --global user.name)"
    echo "   邮箱: $(git config --global user.email)"
fi

echo ""
echo "📝 下一步操作："
echo "=============="
echo ""
echo "1. 在浏览器中打开：https://github.com/new"
echo ""
echo "2. 填写仓库信息："
echo "   - Repository name: smart-learning-system（或您喜欢的名称）"
echo "   - Description: 智慧学习平台 - 现代化的在线教育管理系统"
echo "   - 选择 Public 或 Private"
echo "   - ⚠️  不要勾选 'Initialize this repository with a README'"
echo "   - 点击 'Create repository'"
echo ""
echo "3. 创建仓库后，GitHub会显示设置说明，请复制仓库URL"
echo ""
read -p "请输入GitHub仓库URL（例如：https://github.com/username/smart-learning-system.git）: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ 未输入仓库URL，退出"
    exit 1
fi

echo ""
echo "🔗 添加远程仓库..."
git remote add origin "$REPO_URL" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ 远程仓库已添加"
elif [ $? -eq 128 ]; then
    echo "⚠️  远程仓库已存在，正在更新..."
    git remote set-url origin "$REPO_URL"
    echo "✅ 远程仓库URL已更新"
else
    echo "❌ 添加远程仓库失败"
    exit 1
fi

echo ""
echo "📤 推送代码到GitHub..."
echo "   这可能需要一些时间，请耐心等待..."
echo ""

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  检测到未提交的更改，正在提交..."
    git add .
    git commit -m "Update: 代码更新"
fi

# 推送代码
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 成功！代码已推送到GitHub"
    echo ""
    echo "📦 仓库信息："
    echo "   URL: $REPO_URL"
    echo "   分支: main"
    echo ""
    echo "✅ 设置完成！您可以在GitHub上查看您的代码了。"
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因："
    echo "1. 网络连接问题"
    echo "2. 认证失败（需要配置GitHub Personal Access Token）"
    echo "3. 仓库URL不正确"
    echo ""
    echo "解决方案："
    echo "1. 检查网络连接"
    echo "2. 如果使用HTTPS，需要配置Personal Access Token："
    echo "   - 访问：https://github.com/settings/tokens"
    echo "   - 创建新token（选择repo权限）"
    echo "   - 推送时使用token作为密码"
    echo "3. 或者配置SSH key（更安全）："
    echo "   - 生成SSH key: ssh-keygen -t ed25519 -C \"your_email@example.com\""
    echo "   - 添加到GitHub: https://github.com/settings/keys"
    echo "   - 使用SSH URL: git@github.com:username/repo.git"
fi

