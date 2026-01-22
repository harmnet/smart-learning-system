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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_oss_upload():
    print("Testing OSS Upload...")
    
    try:
        # Create Auth
        auth = oss2.Auth(settings.OSS_ACCESS_KEY_ID, settings.OSS_ACCESS_KEY_SECRET)
        
        # Endpoint for upload (Standard)
        endpoint = f"https://oss-{settings.OSS_REGION}.aliyuncs.com"
        print(f"Upload Endpoint: {endpoint}")
        
        bucket = oss2.Bucket(auth, endpoint, settings.OSS_BUCKET_NAME)
        
        # Test file
        object_key = "test_debug_upload.txt"
        content = b"Hello OSS Debug"
        
        print(f"Uploading to {object_key}...")
        result = bucket.put_object(object_key, content)
        
        print(f"Upload Result: status={result.status}, request_id={result.request_id}")
        
        # Verify existence
        exists = bucket.object_exists(object_key)
        print(f"File exists: {exists}")
        
        # Clean up
        bucket.delete_object(object_key)
        print("Cleaned up.")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_oss_upload()
