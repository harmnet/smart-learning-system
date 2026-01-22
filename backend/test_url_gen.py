import sys
import os
from app.utils.oss_client import OSSClient
from app.core.config import settings

# Force reload settings to be sure
print(f"Settings loaded: CNAME={settings.OSS_USE_CNAME}, ENDPOINT={settings.OSS_ENDPOINT}")

client = OSSClient()
print(f"Client enabled: {client.enabled}")
print(f"Client use_cname: {client.use_cname}")

if client.enabled:
    key = "homework/test_file.xlsx"
    try:
        url = client.generate_weboffice_preview_url(key)
        print(f"Generated URL: {url}")
        
        if "%2F" in url:
            print("FAIL: URL still contains %2F")
        elif "smarteduonline.cn" not in url:
            print("FAIL: URL does not contain custom domain")
        else:
            print("SUCCESS: URL looks correct")
            
    except Exception as e:
        print(f"Error: {e}")
else:
    print("OSS Client not enabled")
