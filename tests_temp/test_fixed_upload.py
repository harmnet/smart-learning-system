#!/usr/bin/env python3
"""
测试修复后的上传和预览功能
"""
import sys
import os
import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_upload_and_preview():
    """测试上传和预览"""
    print("=" * 80)
    print("测试修复后的上传和预览功能")
    print("=" * 80)
    
    # 1. 创建测试文件
    print("\n1. 准备测试文件...")
    test_content = b"""Test Homework Document

This is a test document for homework attachment.

Content:
- Line 1: Introduction
- Line 2: Main content  
- Line 3: Conclusion

End of document."""
    
    # 2. 上传文件（不需要登录，使用匿名上传测试）
    print("\n2. 上传测试文件...")
    files = {'file': ('test_homework_fixed.txt', test_content, 'text/plain')}
    data = {'folder': 'homework'}
    
    try:
        response = requests.post(f"{BASE_URL}/upload/file", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ 上传成功！")
            print(f"   - 文件URL: {result['url']}")
            print(f"   - 文件名: {result['filename']}")
            print(f"   - 大小: {result['size']} 字节")
            print(f"   - 可预览: {result.get('can_preview', False)}")
            
            file_url = result['url']
            
            # 检查URL格式
            if 'aliyuncs.com' in file_url:
                print(f"   ✅ 使用OSS标准域名（修复成功！）")
            elif 'smarteduonline.cn' in file_url:
                print(f"   ⚠️  仍然使用自定义域名（需要重启服务）")
            else:
                print(f"   ❌ URL格式异常")
                
        else:
            print(f"   ❌ 上传失败: HTTP {response.status_code}")
            print(f"   {response.text}")
            return
    except Exception as e:
        print(f"   ❌ 上传请求失败: {str(e)}")
        return
    
    # 3. 生成预览URL
    print("\n3. 生成预览URL...")
    preview_request = {"file_url": file_url}
    
    try:
        response = requests.post(f"{BASE_URL}/upload/preview-url", json=preview_request)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ 预览URL生成成功！")
            print(f"   - 预览类型: {result.get('preview_type')}")
            preview_url = result['preview_url']
            
            # 显示部分URL
            if len(preview_url) > 100:
                print(f"   - 预览URL: {preview_url[:80]}...")
            else:
                print(f"   - 预览URL: {preview_url}")
                
        else:
            print(f"   ❌ 生成预览URL失败: HTTP {response.status_code}")
            print(f"   {response.text}")
            return
    except Exception as e:
        print(f"   ❌ 生成预览URL失败: {str(e)}")
        return
    
    # 4. 验证预览URL可访问性
    print("\n4. 验证预览URL...")
    try:
        response = requests.head(preview_url, timeout=10, allow_redirects=True)
        if response.status_code in [200, 302]:
            print(f"   ✅ 预览URL可访问！(HTTP {response.status_code})")
        elif response.status_code == 404:
            print(f"   ❌ 预览URL返回404（文件未找到）")
        else:
            print(f"   ⚠️  预览URL返回 HTTP {response.status_code}")
    except Exception as e:
        print(f"   ⚠️  无法验证预览URL: {str(e)}")
    
    print("\n" + "=" * 80)
    print("测试完成！")
    print("如果所有步骤都显示✅，说明问题已修复。")
    print("=" * 80)

if __name__ == "__main__":
    test_upload_and_preview()
