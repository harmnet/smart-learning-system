# WebOffice 在线预览配置指南

## 问题描述

学生端课程页面无法在线预览 Word、Excel、PPT 等 Office 文档，控制台显示 `preview_type: 'download'`。

## 原因分析

根据[阿里云 WebOffice 在线预览官方文档](https://help.aliyun.com/zh/oss/user-guide/online-object-preview)，要使用 WebOffice 预览需要：

1. **文件必须存储在阿里云 OSS 上**（不能是本地文件）
2. **Bucket 必须绑定自定义域名**（CNAME）
3. **使用 OSS 签名 URL + 处理参数的方式**生成预览链接

## 解决方案

### 1. 确认文件已上传到 OSS

检查资源的 `file_path` 字段：
- ✅ 正确：`https://smarteduonline.cn/teaching_resources/xxx.docx`
- ❌ 错误：本地路径如 `/uploads/teaching_resources/xxx.docx`

### 2. 配置环境变量

确保 `.env` 文件中配置了以下变量：

```bash
# 阿里云 OSS 配置
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET_NAME=ezijingai
OSS_REGION=cn-beijing
OSS_ENDPOINT=https://smarteduonline.cn  # 自定义域名
OSS_USE_CNAME=true
```

### 3. 绑定自定义域名到 OSS Bucket

在阿里云 OSS 控制台：
1. 进入 Bucket 管理
2. 选择"域名管理"
3. 绑定自定义域名 `smarteduonline.cn`
4. 配置 CNAME 解析

### 4. 后端代码修改

已修改 `backend/app/api/v1/endpoints/teaching_resources.py`：

```python
# 使用 oss_client 生成带 WebOffice 预览参数的签名 URL
preview_url = oss_client.generate_weboffice_preview_url(
    object_key=oss_key,
    expires=3600,  # 1小时有效期
    allow_export=True,
    allow_print=True,
    watermark_text=None  # 可选：添加水印
)

return {
    "preview_url": preview_url,
    "download_url": f"{base_url}/api/v1/teacher/resources/{resource_id}/download",
    "preview_type": "direct",  # 使用 direct 类型
    "resource_type": resource_type,
    "file_name": resource.original_filename
}
```

### 5. 前端代码修改

已修改 `frontend/src/components/common/DocumentPreview.tsx`：

- 添加了详细的调试日志
- 改进了 WebOffice 初始化逻辑
- 添加了错误处理和友好提示

## 测试步骤

### 1. 重启后端服务

```bash
cd /Users/duanxiaofei/Desktop/数珩智学
docker-compose restart backend
```

### 2. 清除浏览器缓存

按 `Cmd + Shift + R`（Mac）或 `Ctrl + Shift + R`（Windows）强制刷新页面。

### 3. 测试预览功能

1. 访问 `http://localhost:3000/student/courses/1`
2. 点击任意 Office 文档资源
3. 查看控制台输出：

**成功的输出示例**：
```javascript
获取到的预览信息: {
  preview_url: 'https://smarteduonline.cn/teaching_resources/xxx.docx?x-oss-process=doc%2Fpreview%2Cexport_1%2Cprint_1&...',
  download_url: 'http://localhost:8000/api/v1/teacher/resources/12/download',
  preview_type: 'direct',
  resource_type: 'word',
  file_name: 'Python数据采集教学指南.docx'
}
```

**失败的输出示例**：
```javascript
获取到的预览信息: {
  preview_url: 'http://localhost:8000/api/v1/teacher/resources/12/download',
  preview_type: 'download',  // ❌ 说明文件不在 OSS 或配置错误
  ...
}
```

## 支持的文件类型

根据阿里云官方文档，WebOffice 支持以下文件类型：

| 文件类型  | 文件后缀                                          |
| ----- | --------------------------------------------- |
| Word  | doc、dot、wps、wpt、docx、dotx、docm、dotm、rtf       |
| PPT   | ppt、pptx、pptm、ppsx、ppsm、pps、potx、potm、dpt、dps |
| Excel | xls、xlt、et、xlsx、xltx、csv、xlsm、xltm            |
| PDF   | pdf                                           |

## 注意事项

1. **文件大小限制**：最大支持 200 MB 的文档
2. **域名要求**：必须绑定自定义域名，不能使用 OSS 默认域名
3. **签名有效期**：默认 1 小时，可根据需要调整
4. **水印功能**：可选，需要 Base64 编码水印文字

## 故障排查

### 问题 1：返回 `preview_type: 'download'`

**原因**：
- 文件存储在本地而不是 OSS
- OSS 配置错误（AccessKey、SecretKey、Bucket 名称等）
- 未绑定自定义域名

**解决方法**：
1. 检查 `.env` 配置
2. 确认文件已上传到 OSS
3. 验证域名绑定

### 问题 2：预览页面空白或加载失败

**原因**：
- 签名 URL 生成错误
- 域名解析问题
- CORS 配置问题

**解决方法**：
1. 检查后端日志中的错误信息
2. 验证 OSS Bucket 的 CORS 配置
3. 确认自定义域名可以正常访问

### 问题 3：提示"域名未配置至小程序的 WebView 白名单"

**解决方法**：
通过钉钉用户群（钉钉群号：88490020073）联系智能媒体管理技术支持，提供微信可信域名验证文件。

## 参考文档

- [阿里云 WebOffice 在线预览官方文档](https://help.aliyun.com/zh/oss/user-guide/online-object-preview)
- [阿里云 OSS Python SDK 文档](https://help.aliyun.com/zh/oss/developer-reference/python)
- [阿里云 OSS 签名 URL 文档](https://help.aliyun.com/zh/oss/user-guide/authorized-third-party-download)

## 总结

通过以上配置，学生端可以正常使用 WebOffice 在线预览功能。关键点：

1. ✅ 文件必须在 OSS 上
2. ✅ 必须绑定自定义域名
3. ✅ 使用 OSS 签名 URL + 处理参数
4. ✅ 前端使用 `direct` 类型在 iframe 中打开

如果仍然无法预览，请检查后端日志中的详细错误信息。
