#!/usr/bin/env python3
"""
直接测试上传和预览API
"""
import requests
import json

API_URL = "http://localhost:8000/api/v1"

def test_upload_and_preview():
    print("=" * 80)
    print("测试文件上传和预览API")
    print("=" * 80)
    
    # 1. 测试文件上传
    print("\n1. 测试文件上传")
    print("-" * 40)
    
    # 创建测试文件
    test_content = b"""Test Homework Assignment

Requirements:
1. Complete exercises 1-10
2. Submit lab report  
3. Deadline: This Friday

This is a test file for testing OSS upload and preview functionality."""
    
    files = {
        'file': ('test_homework.txt', test_content, 'text/plain')
    }
    data = {
        'folder': 'homework'
    }
    
    try:
        response = requests.post(f"{API_URL}/upload/file", files=files, data=data)
        response.raise_for_status()
        upload_result = response.json()
        
        print(f"✓ 上传成功")
        print(f"  - 文件URL: {upload_result['url']}")
        print(f"  - 文件大小: {upload_result['size']} bytes")
        print(f"  - 可预览: {upload_result['can_preview']}")
        
        file_url = upload_result['url']
        
        # 2. 测试预览URL生成
        print("\n2. 测试预览URL生成")
        print("-" * 40)
        
        preview_data = {
            'file_url': file_url,
            'watermark_text': '测试水印'
        }
        
        response = requests.post(
            f"{API_URL}/upload/preview-url",
            headers={'Content-Type': 'application/json'},
            json=preview_data
        )
        
        if response.status_code == 200:
            preview_result = response.json()
            print(f"✓ 预览URL生成成功")
            print(f"  - 预览类型: {preview_result['preview_type']}")
            print(f"  - 预览URL: {preview_result['preview_url'][:100]}...")
            print(f"  - 完整URL: {preview_result['preview_url']}")
            
            # 3. 测试访问预览URL
            print("\n3. 测试访问预览URL")
            print("-" * 40)
            try:
                head_response = requests.head(preview_result['preview_url'], timeout=5)
                print(f"  - HTTP状态码: {head_response.status_code}")
                if head_response.status_code == 200:
                    print(f"  ✓ 预览URL可访问")
                elif head_response.status_code == 404:
                    print(f"  ✗ 预览URL返回404错误")
                    print(f"    这是问题所在！")
                else:
                    print(f"  ⚠ 预览URL返回状态码: {head_response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"  ✗ 访问预览URL失败: {e}")
                
        else:
            print(f"✗ 预览URL生成失败")
            print(f"  - 状态码: {response.status_code}")
            print(f"  - 错误信息: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"✗ 请求失败: {e}")
    except Exception as e:
        print(f"✗ 错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_upload_and_preview()
