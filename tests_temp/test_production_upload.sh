#!/bin/bash
echo "=================================================="
echo "测试生产环境文件上传和预览"
echo "=================================================="

# 创建测试文件
echo "这是一个测试文件，用于验证OSS上传和预览功能" > /tmp/test_homework.txt

echo ""
echo "1. 测试文件上传..."
UPLOAD_RESULT=$(curl -s -X POST https://smarteduonline.cn/api/v1/upload/file \
  -F "file=@/tmp/test_homework.txt" \
  -F "folder=homework")

echo "$UPLOAD_RESULT" | python3 -m json.tool

FILE_URL=$(echo "$UPLOAD_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['url'])" 2>/dev/null)

if [ ! -z "$FILE_URL" ]; then
    echo ""
    echo "2. 测试文件访问..."
    echo "文件URL: $FILE_URL"
    curl -I "$FILE_URL" 2>&1 | head -10
    
    echo ""
    echo "3. 测试预览URL生成..."
    PREVIEW_RESULT=$(curl -s -X POST https://smarteduonline.cn/api/v1/upload/preview-url \
      -H "Content-Type: application/json" \
      -d "{\"file_url\": \"$FILE_URL\"}")
    
    echo "$PREVIEW_RESULT" | python3 -m json.tool
    
    PREVIEW_URL=$(echo "$PREVIEW_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['preview_url'])" 2>/dev/null)
    
    if [ ! -z "$PREVIEW_URL" ]; then
        echo ""
        echo "4. 测试预览URL访问..."
        curl -I "$PREVIEW_URL" 2>&1 | head -10
    fi
else
    echo "上传失败"
fi

# 清理
rm -f /tmp/test_homework.txt
