import oss2
from urllib.parse import unquote

import os

# Mock settings
class Settings:
    OSS_ACCESS_KEY_ID = os.getenv("ALIYUN_ACCESS_KEY_ID", "")
    OSS_ACCESS_KEY_SECRET = os.getenv("ALIYUN_ACCESS_KEY_SECRET", "")
    OSS_BUCKET_NAME = "ezijingai"
    OSS_REGION = "cn-beijing"
    OSS_ENDPOINT = "https://smarteduonline.cn"
    OSS_USE_CNAME = True

settings = Settings()

def test_url_generation():
    print("Testing URL Generation...")
    
    auth = oss2.Auth(settings.OSS_ACCESS_KEY_ID, settings.OSS_ACCESS_KEY_SECRET)
    
    # CNAME bucket
    cname_bucket = oss2.Bucket(auth, settings.OSS_ENDPOINT, settings.OSS_BUCKET_NAME, is_cname=True)
    
    object_key = "homework/test.xlsx"
    
    # Generate signed URL
    url = cname_bucket.sign_url('GET', object_key, 3600)
    
    print(f"Generated URL: {url}")
    
    # Check if slash is encoded
    if "homework%2Ftest.xlsx" in url:
        print("ALERT: Slash is encoded!")
    elif "homework/test.xlsx" in url:
        print("Slash is NOT encoded.")
    else:
        print("Could not find object key in URL.")

if __name__ == "__main__":
    test_url_generation()
