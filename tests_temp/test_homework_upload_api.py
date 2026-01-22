#!/usr/bin/env python3
"""
测试课后作业附件上传和预览API
模拟前端的完整流程
"""
import sys
import os
import requests
import json

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

BASE_URL = "http://localhost:8000/api/v1"

def test_homework_upload_preview():
    """测试作业附件上传和预览完整流程"""
    print("=" * 80)
    print("测试课后作业附件上传和预览功能")
    print("=" * 80)
    
    # 1. 登录获取token
    print("\n1. 登录系统...")
    login_data = {
        "username": "teacher1",
        "password": "123456"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"   ✓ 登录成功，获取到token")
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print(f"   ❌ 登录失败: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"   ❌ 登录请求失败: {str(e)}")
        return
    
    # 2. 上传测试文件
    print("\n2. 上传测试文件...")
    test_content = b"This is a test homework attachment document.\nLine 2\nLine 3"
    
    files = {'file': ('test_homework.txt', test_content, 'text/plain')}
    data = {'folder': 'homework'}
    
    try:
        response = requests.post(
            f"{BASE_URL}/upload/file", 
            files=files,
            data=data,
            headers=headers
        )
        
        if response.status_code == 200:
            upload_result = response.json()
            print(f"   ✓ 文件上传成功")
            print(f"   - URL: {upload_result['url']}")
            print(f"   - 文件名: {upload_result['filename']}")
            print(f"   - 大小: {upload_result['size']} 字节")
            print(f"   - 可预览: {upload_result.get('can_preview', False)}")
            
            file_url = upload_result['url']
        else:
            print(f"   ❌ 上传失败: {response.status_code}")
            print(f"   响应: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ 上传请求失败: {str(e)}")
        return
    
    # 3. 生成预览URL
    print("\n3. 生成预览URL...")
    preview_request = {
        "file_url": file_url,
        "watermark_text": "测试水印"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/upload/preview-url",
            json=preview_request,
            headers=headers
        )
        
        if response.status_code == 200:
            preview_result = response.json()
            print(f"   ✓ 预览URL生成成功")
            print(f"   - 预览URL: {preview_result['preview_url'][:100]}...")
            print(f"   - 预览类型: {preview_result.get('preview_type', 'unknown')}")
            print(f"   - 有效期: {preview_result.get('expires_in', 0)} 秒")
            
            preview_url = preview_result['preview_url']
        else:
            print(f"   ❌ 生成预览URL失败: {response.status_code}")
            print(f"   响应: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ 生成预览URL请求失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return
    
    # 4. 验证预览URL
    print("\n4. 验证预览URL...")
    try:
        # 尝试访问预览URL（不下载内容，只验证可访问性）
        response = requests.head(preview_url, timeout=10, allow_redirects=True)
        if response.status_code in [200, 302, 307]:
            print(f"   ✓ 预览URL可访问 (HTTP {response.status_code})")
        elif response.status_code == 404:
            print(f"   ❌ 预览URL返回404 - 文件未找到")
            print(f"   - URL: {preview_url}")
        else:
            print(f"   ⚠ 预览URL返回 HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ 访问预览URL失败: {str(e)}")
    
    # 5. 检查URL格式
    print("\n5. URL格式分析:")
    print(f"   - 上传返回URL: {file_url}")
    if 'smarteduonline.cn' in file_url:
        print(f"   ✓ 使用自定义域名")
    elif 'aliyuncs.com' in file_url:
        print(f"   ⚠ 使用OSS标准域名")
    else:
        print(f"   ❌ URL格式异常")
    
    # 提取object_key
    from urllib.parse import urlparse
    parsed = urlparse(file_url)
    object_key = parsed.path.lstrip('/')
    print(f"   - 提取的Object Key: {object_key}")
    
    print("\n" + "=" * 80)
    print("测试完成")
    print("=" * 80)

if __name__ == "__main__":
    test_homework_upload_preview()
