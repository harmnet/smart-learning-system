#!/usr/bin/env python3
"""
测试文件上传和预览功能
"""
import sys
import os
import asyncio

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.utils.oss_client import oss_client
from app.core.config import settings

async def test_oss_upload():
    """测试OSS上传"""
    print("=" * 80)
    print("测试OSS配置和上传功能")
    print("=" * 80)
    
    # 检查配置
    print("\n1. OSS配置检查:")
    print(f"   - OSS_ACCESS_KEY_ID: {'已配置' if settings.OSS_ACCESS_KEY_ID else '未配置'}")
    print(f"   - OSS_ACCESS_KEY_SECRET: {'已配置' if settings.OSS_ACCESS_KEY_SECRET else '未配置'}")
    print(f"   - OSS_BUCKET_NAME: {settings.OSS_BUCKET_NAME}")
    print(f"   - OSS_REGION: {settings.OSS_REGION}")
    print(f"   - OSS_ENDPOINT: {settings.OSS_ENDPOINT if settings.OSS_ENDPOINT else '未配置（使用默认）'}")
    print(f"   - OSS_USE_CNAME: {settings.OSS_USE_CNAME}")
    print(f"   - OSS客户端状态: {'已启用' if oss_client.enabled else '未启用'}")
    
    if not oss_client.enabled:
        print("\n❌ OSS客户端未启用，请检查配置")
        return
    
    # 测试上传
    print("\n2. 测试文件上传:")
    test_content = b"Test content for homework attachment"
    test_key = "homework/test_upload_preview.txt"
    
    try:
        file_url = oss_client.upload_file(test_content, test_key, content_type="text/plain")
        print(f"   ✓ 上传成功")
        print(f"   - Object Key: {test_key}")
        print(f"   - File URL: {file_url}")
        
        # 测试生成预览URL
        print("\n3. 测试生成预览URL:")
        preview_url = oss_client.generate_weboffice_preview_url(
            test_key,
            expires=3600,
            watermark_text="测试水印"
        )
        print(f"   ✓ 预览URL生成成功")
        print(f"   - Preview URL: {preview_url[:100]}...")
        
        # 检查URL格式
        print("\n4. URL格式检查:")
        if file_url.startswith("https://smarteduonline.cn"):
            print(f"   ✓ 使用自定义域名: smarteduonline.cn")
        elif "aliyuncs.com" in file_url:
            print(f"   ⚠ 使用OSS标准域名")
        else:
            print(f"   ❌ URL格式异常: {file_url}")
        
        # 清理测试文件
        print("\n5. 清理测试文件:")
        if oss_client.delete_file(test_key):
            print(f"   ✓ 测试文件已删除")
        
    except Exception as e:
        print(f"   ❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_oss_upload())
