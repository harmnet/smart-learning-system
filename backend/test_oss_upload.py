#!/usr/bin/env python3
"""
测试OSS上传和预览功能
测试教学资源、参考资料和课程预览三个功能
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import asyncio
import httpx
from pathlib import Path

# 测试文件路径
TEST_FILE = "/Users/duanxiaofei/Desktop/smart learning/案例原文：职业生涯规划案例：技能匹配与发展建议_副本.docx"

async def test_oss_upload():
    """测试OSS上传功能"""
    print("=" * 60)
    print("测试OSS上传和预览功能")
    print("=" * 60)
    
    # 检查文件是否存在
    if not os.path.exists(TEST_FILE):
        print(f"❌ 测试文件不存在: {TEST_FILE}")
        return
    
    file_size = os.path.getsize(TEST_FILE)
    print(f"✅ 测试文件: {os.path.basename(TEST_FILE)}")
    print(f"   文件大小: {file_size / 1024 / 1024:.2f} MB")
    print()
    
    # 读取文件
    with open(TEST_FILE, 'rb') as f:
        file_content = f.read()
    
    base_url = "http://localhost:8000/api/v1"
    
    # 获取token（需要先登录）
    print("1. 获取认证token...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 尝试登录（使用教师账号）
        login_data = {
            "username": "T202511274400",
            "password": "12345678"
        }
        
        try:
            login_response = await client.post(
                f"{base_url}/auth/login",
                data=login_data
            )
            if login_response.status_code != 200:
                print(f"❌ 登录失败: {login_response.status_code}")
                print(f"   响应: {login_response.text}")
                return
            
            token_data = login_response.json()
            token = token_data.get("access_token")
            if not token:
                print("❌ 无法获取token")
                return
            
            print(f"✅ 登录成功，获取到token")
            print()
            
            headers = {
                "Authorization": f"Bearer {token}"
            }
            
            # 获取教师ID
            user_info = token_data.get("user", {})
            teacher_id = user_info.get("id")
            if not teacher_id:
                print("❌ 无法获取教师ID")
                return
            
            print(f"✅ 教师ID: {teacher_id}")
            print()
            
            # 测试1: 上传教学资源
            print("2. 测试上传教学资源...")
            files = {
                "file": (os.path.basename(TEST_FILE), file_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            }
            data = {
                "teacher_id": str(teacher_id),
                "resource_name": "测试文档-教学资源",
                "knowledge_point": "测试知识点"
            }
            
            upload_response = await client.post(
                f"{base_url}/teacher/resources/upload",
                headers=headers,
                files=files,
                data=data
            )
            
            if upload_response.status_code == 200:
                resource_data = upload_response.json()
                resource_id = resource_data.get("id")
                print(f"✅ 教学资源上传成功，ID: {resource_id}")
                print(f"   资源名称: {resource_data.get('resource_name')}")
                print(f"   文件路径: {resource_data.get('file_path', 'N/A')}")
                
                # 测试预览URL
                print()
                print("3. 测试教学资源预览...")
                preview_response = await client.get(
                    f"{base_url}/teacher/resources/{resource_id}/preview",
                    headers=headers,
                    follow_redirects=False
                )
                
                if preview_response.status_code in [302, 307]:
                    preview_url = preview_response.headers.get("Location", "")
                    print(f"✅ 预览URL生成成功（重定向）")
                    print(f"   URL: {preview_url[:100]}...")
                    if "x-oss-process=doc/preview" in preview_url or "aliyuncs.com" in preview_url:
                        print("   ✅ 确认使用OSS WebOffice预览")
                    else:
                        print("   ⚠️  可能未使用OSS预览")
                elif preview_response.status_code == 200:
                    print(f"✅ 预览响应成功（直接返回）")
                    content_type = preview_response.headers.get("Content-Type", "")
                    if "application" in content_type or "text" in content_type:
                        print(f"   Content-Type: {content_type}")
                else:
                    print(f"❌ 预览失败: {preview_response.status_code}")
                    print(f"   响应: {preview_response.text[:200]}")
            else:
                print(f"❌ 教学资源上传失败: {upload_response.status_code}")
                print(f"   响应: {upload_response.text[:200]}")
            
            print()
            
            # 测试2: 上传参考资料
            print("4. 测试上传参考资料...")
            files = {
                "file": (os.path.basename(TEST_FILE), file_content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            }
            data = {
                "teacher_id": str(teacher_id),
                "resource_name": "测试文档-参考资料",
                "knowledge_point": "测试知识点"
            }
            
            upload_response = await client.post(
                f"{base_url}/teacher/references/upload",
                headers=headers,
                files=files,
                data=data
            )
            
            if upload_response.status_code == 200:
                material_data = upload_response.json()
                material_id = material_data.get("id")
                print(f"✅ 参考资料上传成功，ID: {material_id}")
                print(f"   资源名称: {material_data.get('resource_name')}")
                print(f"   文件路径: {material_data.get('file_path', 'N/A')}")
                
                # 测试预览URL
                print()
                print("5. 测试参考资料预览...")
                preview_response = await client.get(
                    f"{base_url}/teacher/references/{material_id}/preview",
                    headers=headers,
                    follow_redirects=False
                )
                
                if preview_response.status_code in [302, 307]:
                    preview_url = preview_response.headers.get("Location", "")
                    print(f"✅ 预览URL生成成功（重定向）")
                    print(f"   URL: {preview_url[:100]}...")
                    if "x-oss-process=doc/preview" in preview_url or "aliyuncs.com" in preview_url:
                        print("   ✅ 确认使用OSS WebOffice预览")
                    else:
                        print("   ⚠️  可能未使用OSS预览")
                elif preview_response.status_code == 200:
                    print(f"✅ 预览响应成功（直接返回）")
                    content_type = preview_response.headers.get("Content-Type", "")
                    if "application" in content_type or "text" in content_type:
                        print(f"   Content-Type: {content_type}")
                else:
                    print(f"❌ 预览失败: {preview_response.status_code}")
                    print(f"   响应: {preview_response.text[:200]}")
            else:
                print(f"❌ 参考资料上传失败: {upload_response.status_code}")
                print(f"   响应: {upload_response.text[:200]}")
            
            print()
            print("=" * 60)
            print("测试完成")
            print("=" * 60)
            
        except Exception as e:
            print(f"❌ 测试过程中出错: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_oss_upload())

