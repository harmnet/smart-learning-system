# 生产环境Nginx配置更新说明

## 更新时间
2026-01-20

## 问题
课后作业附件上传后，通过 `https://smarteduonline.cn/homework/xxx` 访问时返回404错误。

## 原因
生产环境的Nginx配置缺少OSS文件代理配置。

## 解决方案
在Nginx配置中添加OSS代理规则。

## 配置更新

### 文件位置
`nginx/nginx.conf`

### 新增配置
在 `location /health` 之后，`location /` 之前添加：

```nginx
# OSS文件代理 - 课后作业附件
location /homework/ {
    proxy_pass https://ezijingai.oss-cn-beijing.aliyuncs.com/homework/;
    proxy_http_version 1.1;
    proxy_set_header Host ezijingai.oss-cn-beijing.aliyuncs.com;
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    proxy_buffering off;
    proxy_request_buffering off;
    
    # 传递查询参数（包括OSS签名）
    proxy_pass_request_headers on;
    
    # 缓存配置
    proxy_cache_valid 200 302 60m;
    proxy_cache_valid 404 1m;
    add_header X-Cache-Status $upstream_cache_status;
    
    # 允许大文件
    client_max_body_size 200M;
}

# OSS文件代理 - 其他上传文件
location /uploads/ {
    proxy_pass https://ezijingai.oss-cn-beijing.aliyuncs.com/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host ezijingai.oss-cn-beijing.aliyuncs.com;
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_pass_request_headers on;
    proxy_cache_valid 200 302 60m;
    proxy_cache_valid 404 1m;
    client_max_body_size 200M;
}
```

## 部署步骤

### 方式1: 使用deploy.sh脚本（推荐）

```bash
cd /Users/duanxiaofei/Desktop/数珩智学
./deploy.sh
```

脚本会自动：
1. 构建前后端Docker镜像
2. 上传到服务器
3. 重启服务

### 方式2: 手动更新

```bash
# 1. 上传Nginx配置到服务器
scp -i duanxiaofei_key01.pem nginx/nginx.conf root@123.57.6.26:/root/smartlearning/nginx/

# 2. SSH登录服务器
ssh -i duanxiaofei_key01.pem root@123.57.6.26

# 3. 重启Nginx
cd /root/smartlearning
docker-compose restart nginx

# 4. 检查Nginx状态
docker-compose logs nginx

# 5. 验证配置
curl -I https://smarteduonline.cn/homework/test.txt
```

## 验证

### 测试上传的文件
```bash
# 替换为实际的文件名
curl -I "https://smarteduonline.cn/homework/9ad323d8-11b5-4444-866f-f06a4372cf53.xlsx"
```

预期结果：
- HTTP状态码: 200 OK
- Server: AliyunOSS (通过X-Cache-Status头可以看到)

### 测试带签名的预览URL
```bash
curl -I "https://smarteduonline.cn/homework/xxx.xlsx?x-oss-process=doc/preview&OSSAccessKeyId=...&Signature=..."
```

预期结果：
- HTTP状态码: 200 OK
- 返回WebOffice预览页面

## 配置说明

### 关键配置项

1. **proxy_set_header Host**
   ```nginx
   proxy_set_header Host ezijingai.oss-cn-beijing.aliyuncs.com;
   ```
   设置Host头为OSS域名，确保OSS正确处理请求

2. **proxy_ssl_server_name on**
   ```nginx
   proxy_ssl_server_name on;
   ```
   启用SNI，确保HTTPS连接正确

3. **proxy_buffering off**
   ```nginx
   proxy_buffering off;
   proxy_request_buffering off;
   ```
   关闭缓冲，支持大文件和流式传输

4. **传递查询参数**
   ```nginx
   proxy_pass_request_headers on;
   ```
   确保OSS签名参数正确传递

### 缓存策略

- 成功响应(200, 302): 缓存60分钟
- 404错误: 缓存1分钟（避免频繁查询不存在的文件）
- 添加 X-Cache-Status 头，方便调试

## 注意事项

1. **路径匹配**
   - `/homework/` 会匹配 `/homework/xxx.xlsx`
   - 不会匹配 `/homework` (没有尾部斜杠)
   
2. **查询参数**
   - OSS签名参数会自动传递
   - 包括 `x-oss-process`, `OSSAccessKeyId`, `Expires`, `Signature`

3. **大文件上传**
   - `client_max_body_size 200M` 支持最大200MB文件
   - 如需更大，调整此参数

4. **HTTPS**
   - Nginx与OSS之间使用HTTPS连接
   - 确保服务器支持TLSv1.2/TLSv1.3

## 故障排查

### 如果仍然404

1. 检查Nginx日志
   ```bash
   docker-compose logs nginx | grep homework
   ```

2. 检查OSS文件是否存在
   ```bash
   curl -I https://ezijingai.oss-cn-beijing.aliyuncs.com/homework/xxx.xlsx
   ```

3. 检查Nginx配置语法
   ```bash
   docker-compose exec nginx nginx -t
   ```

### 如果签名验证失败

- 确保查询参数完整传递
- 检查时间同步（签名有效期）
- 验证OSS访问密钥配置

## 后续优化

1. **启用CDN**
   - 考虑使用阿里云CDN加速文件访问
   - 减轻源站压力

2. **添加访问控制**
   - 限制文件类型
   - 添加防盗链
   
3. **监控告警**
   - 监控OSS代理错误率
   - 设置访问量告警

## 总结

通过在Nginx中添加OSS代理配置，实现了：
- ✅ `https://smarteduonline.cn/homework/xxx` 可以访问OSS文件
- ✅ 支持带签名参数的WebOffice预览URL
- ✅ 缓存优化，提升访问速度
- ✅ 支持大文件上传和下载

配置已更新到 `nginx/nginx.conf`，使用 `deploy.sh` 部署到生产环境即可生效。
