# OSS文件访问代理配置说明

## 问题分析

`smarteduonline.cn` 是网站的主域名，解析到服务器IP (123.57.6.26)，运行Next.js应用。它**不是**OSS的CNAME域名。

## 解决方案

通过Next.js配置代理，将特定路径的请求转发到OSS。

### 方案1: 使用Next.js Rewrites (推荐)

在 `frontend/next.config.js` 中添加：

```javascript
async rewrites() {
  return [
    {
      source: '/oss/:path*',
      destination: 'https://ezijingai.oss-cn-beijing.aliyuncs.com/:path*'
    }
  ]
}
```

然后修改后端返回的URL格式为相对路径：
```python
# backend/app/utils/oss_client.py
if settings.OSS_USE_CNAME and settings.OSS_ENDPOINT:
    return f"/oss/{object_key}"  # 使用相对路径，通过Next.js代理
else:
    return f"https://{settings.OSS_BUCKET_NAME}.oss-{settings.OSS_REGION}.aliyuncs.com/{object_key}"
```

### 方案2: 配置OSS子域名 (最佳)

1. 配置DNS: `oss.smarteduonline.cn` CNAME到 `ezijingai.oss-cn-beijing.aliyuncs.com`
2. 在OSS控制台绑定域名 `oss.smarteduonline.cn`
3. 更新配置：
```env
OSS_ENDPOINT=https://oss.smarteduonline.cn
OSS_USE_CNAME=true
```

### 方案3: 直接使用OSS标准域名 (临时)

最简单的方案，文件直接通过OSS域名访问：

```env
OSS_ENDPOINT=
OSS_USE_CNAME=false
```

文件URL: `https://ezijingai.oss-cn-beijing.aliyuncs.com/homework/xxx.txt`

## 推荐实施步骤

1. **立即** (5分钟): 使用方案3，确保功能可用
2. **短期** (1小时): 实施方案1的Next.js代理
3. **长期** (按需): 配置OSS子域名方案2

## 当前配置需要修改

### 后端配置
```bash
cd /Users/duanxiaofei/Desktop/数珩智学/backend
# 修改 .env
OSS_ENDPOINT=
OSS_USE_CNAME=false
```

### 前端配置 (如果使用方案1)
修改 `frontend/next.config.js` 添加rewrites配置
