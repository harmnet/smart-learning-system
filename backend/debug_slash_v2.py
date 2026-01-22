import os
import sys
import oss2
import logging
import subprocess

# Mock settings
class Settings:
    OSS_ACCESS_KEY_ID = os.getenv("ALIYUN_ACCESS_KEY_ID", "")
    OSS_ACCESS_KEY_SECRET = os.getenv("ALIYUN_ACCESS_KEY_SECRET", "")
    OSS_BUCKET_NAME = "ezijingai"
    OSS_REGION = "cn-beijing"
    OSS_ENDPOINT = "https://smarteduonline.cn"
    OSS_USE_CNAME = True

settings = Settings()

def setup_and_test():
    auth = oss2.Auth(settings.OSS_ACCESS_KEY_ID, settings.OSS_ACCESS_KEY_SECRET)
    endpoint = f"https://oss-{settings.OSS_REGION}.aliyuncs.com"
    bucket = oss2.Bucket(auth, endpoint, settings.OSS_BUCKET_NAME)
    
    object_key = "homework/test_slash.txt"
    # Ensure file exists
    bucket.put_object(object_key, b"Slash Test Content")
    
    # 1. Standard URL (no CNAME)
    std_bucket = oss2.Bucket(auth, endpoint, settings.OSS_BUCKET_NAME)
    url_std = std_bucket.sign_url('GET', object_key, 3600)
    print(f"Standard URL: {url_std}")
    
    print("\nTesting Standard URL...")
    try:
        subprocess.check_call(["curl", "-f", "-s", "-o", "/dev/null", url_std])
        print("SUCCESS: Standard URL works")
    except subprocess.CalledProcessError:
        print("FAILURE: Standard URL failed")

    # 2. CNAME URL
    cname_bucket = oss2.Bucket(auth, settings.OSS_ENDPOINT, settings.OSS_BUCKET_NAME, is_cname=True)
    url_encoded = cname_bucket.sign_url('GET', object_key, 3600)
    url_decoded = url_encoded.replace("%2F", "/")
    
    print(f"\nCNAME Decoded URL: {url_decoded}")
    print("\nTesting CNAME Decoded URL...")
    try:
        subprocess.check_call(["curl", "-f", "-s", "-o", "/dev/null", url_decoded])
        print("SUCCESS: CNAME Decoded URL works")
    except subprocess.CalledProcessError:
        print("FAILURE: CNAME Decoded URL failed")

    # 3. Check domain resolution (simple curl to root)
    print("\nChecking domain root (expecting 403 or XML)...")
    try:
        subprocess.call(["curl", "-I", "https://smarteduonline.cn/"])
    except Exception as e:
        print(f"Domain check error: {e}")

if __name__ == "__main__":
    setup_and_test()
