#!/usr/bin/env python3
"""
修复预览URL生成问题的脚本
"""
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

print("=" * 80)
print("预览URL问题诊断和修复")
print("=" * 80)

# 读取当前的oss_client.py
oss_client_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'app', 'utils', 'oss_client.py')

print(f"\n当前OSS客户端文件: {oss_client_path}")
print("\n问题诊断:")
print("-" * 40)

with open(oss_client_path, 'r', encoding='utf-8') as f:
    content = f.read()
    
    # 检查当前实现
    if '# 始终使用标准Bucket签名' in content:
        print("✗ 发现问题: 使用标准Bucket签名后替换域名")
        print("  这会导致签名验证失败(Host不匹配)")
        print("\n解决方案:")
        print("- 使用CNAME bucket进行签名，确保Host匹配")
    else:
        print("✓ 签名逻辑正常")

print("\n" + "=" * 80)
print("建议的修复代码:")
print("=" * 80)
print('''
在 oss_client.py 的 generate_weboffice_preview_url 方法中，
将第143行修改为：

    # 如果配置了CNAME，使用CNAME bucket签名
    if self.use_cname and self.cname_bucket:
        url = self.cname_bucket.sign_url('GET', object_key, expires, 
                                        params={'x-oss-process': process_params})
    else:
        url = self.bucket.sign_url('GET', object_key, expires, 
                                   params={'x-oss-process': process_params})
''')

print("\n" + "=" * 80)
print("快速解决方案 (修改.env):")
print("=" * 80)
print('''
如果域名配置复杂，可以临时使用OSS标准域名：

OSS_ENDPOINT=
OSS_USE_CNAME=false

这样文件将通过 https://ezijingai.oss-cn-beijing.aliyuncs.com/ 访问
''')
