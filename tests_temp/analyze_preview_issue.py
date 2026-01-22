#!/usr/bin/env python3
"""
分析预览404问题的根本原因
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from urllib.parse import urlparse
from app.core.config import settings
from app.utils.oss_client import oss_client

print("=" * 80)
print("分析预览404问题")
print("=" * 80)

# 模拟不同的file_url情况
test_urls = [
    "https://smarteduonline.cn/homework/test.pdf",
    "https://ezijingai.oss-cn-beijing.aliyuncs.com/homework/test.pdf",
    "/homework/test.pdf",
    "homework/test.pdf"
]

print("\n1. OSS配置:")
print(f"   - BUCKET: {settings.OSS_BUCKET_NAME}")
print(f"   - REGION: {settings.OSS_REGION}")
print(f"   - ENDPOINT: {settings.OSS_ENDPOINT}")
print(f"   - USE_CNAME: {settings.OSS_USE_CNAME}")
print(f"   - OSS客户端状态: {oss_client.enabled}")

print("\n2. 测试不同URL格式的object_key提取:")
for url in test_urls:
    print(f"\n   URL: {url}")
    parsed = urlparse(url)
    path = parsed.path
    object_key = path.lstrip('/')
    print(f"   - Path: {path}")
    print(f"   - Object Key: {object_key}")
    
    if oss_client.enabled:
        try:
            # 生成预览URL
            preview_url = oss_client.generate_weboffice_preview_url(
                object_key,
                expires=3600
            )
            print(f"   ✓ 预览URL: {preview_url[:80]}...")
        except Exception as e:
            print(f"   ❌ 生成预览URL失败: {str(e)}")

print("\n3. 问题分析:")
print("   可能的404原因:")
print("   1. file_url格式不正确，导致object_key提取错误")
print("   2. 文件实际未上传到OSS")
print("   3. OSS签名验证失败")
print("   4. CNAME配置问题导致签名不匹配")

print("\n4. 推荐解决方案:")
print("   - 检查上传时返回的file_url格式")
print("   - 验证OSS中文件是否真实存在")
print("   - 确保CNAME配置与签名一致")

print("\n=" * 80)
