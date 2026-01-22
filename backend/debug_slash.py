import os
import sys
import oss2
import logging

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
    # 1. Upload file
    auth = oss2.Auth(settings.OSS_ACCESS_KEY_ID, settings.OSS_ACCESS_KEY_SECRET)
    endpoint = f"https://oss-{settings.OSS_REGION}.aliyuncs.com"
    bucket = oss2.Bucket(auth, endpoint, settings.OSS_BUCKET_NAME)
    
    object_key = "homework/test_slash.txt"
    bucket.put_object(object_key, b"Slash Test Content")
    print(f"Uploaded {object_key}")
    
    # 2. Generate URL with CNAME
    cname_bucket = oss2.Bucket(auth, settings.OSS_ENDPOINT, settings.OSS_BUCKET_NAME, is_cname=True)
    url_encoded = cname_bucket.sign_url('GET', object_key, 3600)
    print(f"Encoded URL: {url_encoded}")
    
    url_decoded = url_encoded.replace("%2F", "/")
    print(f"Decoded URL: {url_decoded}")
    
    # 3. Test with curl
    import subprocess
    
    print("\nTesting Encoded URL...")
    try:
        subprocess.check_call(["curl", "-f", "-s", "-o", "/dev/null", url_encoded])
        print("SUCCESS: Encoded URL works")
    except subprocess.CalledProcessError:
        print("FAILURE: Encoded URL returned error (404/403)")
        
    print("\nTesting Decoded URL...")
    try:
        subprocess.check_call(["curl", "-f", "-s", "-o", "/dev/null", url_decoded])
        print("SUCCESS: Decoded URL works")
    except subprocess.CalledProcessError:
        print("FAILURE: Decoded URL returned error (404/403)")

if __name__ == "__main__":
    setup_and_test()
