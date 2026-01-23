# 服务器主Nginx配置说明

## 重要提示
本应用使用独立端口运行，不会影响服务器上的其他应用（如nce-learning等）。

## 端口分配
- 应用内部Nginx: 8080 (HTTP), 8443 (HTTPS)
- 后端API: 8001
- 前端: 3001
- PostgreSQL: 5433
- Redis: 6380

## 服务器主Nginx配置

需要在服务器的主Nginx配置文件中添加以下配置，将域名代理到我们的应用Nginx。

### 配置文件位置
通常在: `/etc/nginx/conf.d/smartlearning.conf` 或 `/etc/nginx/sites-available/smartlearning.conf`

### 配置内容

```nginx
# Smart Learning 应用配置
# 代理到容器内的Nginx (端口8080/8443)

# HTTP服务器 - 重定向到HTTPS
server {
    listen 80;
    server_name smarteduonline.cn www.smarteduonline.cn;
    
    # 重定向所有HTTP请求到HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS服务器
server {
    listen 443 ssl http2;
    server_name smarteduonline.cn www.smarteduonline.cn;
    
    # SSL证书配置（使用服务器上的证书）
    ssl_certificate /root/ssl/fullchain.pem;
    ssl_certificate_key /root/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 代理到容器内的Nginx
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 200M;
    }
}
```

### 部署后操作步骤

1. **创建配置文件**
```bash
ssh -i duanxiaofei_key01.pem root@123.57.6.26
nano /etc/nginx/conf.d/smartlearning.conf
# 粘贴上述配置内容
```

2. **测试Nginx配置**
```bash
nginx -t
```

3. **重载Nginx**
```bash
nginx -s reload
# 或
systemctl reload nginx
```

4. **验证配置**
```bash
# 检查主Nginx状态
systemctl status nginx

# 检查端口监听
netstat -tulpn | grep nginx

# 测试访问
curl -I http://localhost:8080
```

## 故障排查

### 如果访问不通
1. 检查主Nginx是否正常运行
2. 检查容器内Nginx是否正常运行: `docker ps | grep smartlearning-nginx`
3. 检查端口是否被占用: `netstat -tulpn | grep 8080`
4. 查看主Nginx日志: `tail -f /var/log/nginx/error.log`
5. 查看容器Nginx日志: `docker logs smartlearning-nginx`

### 如果需要回滚
```bash
# 停止新部署的容器
cd /root/smart-learning-system
docker-compose down

# 恢复备份的配置
cp /root/smart-learning-backup-YYYYMMDD_HHMMSS/docker-compose.yml ./

# 重新启动
docker-compose up -d
```

## 注意事项

1. **不影响其他应用**: 所有服务使用独立端口，不会与其他应用冲突
2. **SSL证书**: 主Nginx使用服务器现有的SSL证书
3. **端口防火墙**: 确保服务器防火墙允许80和443端口访问
4. **容器网络**: 所有容器在独立的网络 `smart-learning-network` 中运行
