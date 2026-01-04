# 阿里云OSS配置说明

## 📋 **概述**

本系统已集成阿里云对象存储OSS (Object Storage Service)，用于存储和管理教学资源文件，并支持WebOffice在线文档预览功能。

## 🔧 **配置步骤**

### 1. 创建或配置.env文件

在 `backend/` 目录下创建 `.env` 文件（如果不存在），添加以下配置：

```bash
# 数据库配置（保留原有配置）
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=smartlearning123
POSTGRES_DB=smartlearning
POSTGRES_PORT=5433

# 安全配置（保留原有配置）
SECRET_KEY=CHANGE_THIS_IN_PRODUCTION
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# ==============================
# 阿里云OSS配置（必须配置）
# ==============================

# OSS访问密钥（必填）
# 请在阿里云控制台获取 AccessKey ID 和 AccessKey Secret
# 链接: https://ram.console.aliyun.com/manage/ak
OSS_ACCESS_KEY_ID=your_access_key_id_here
OSS_ACCESS_KEY_SECRET=your_access_key_secret_here

# OSS Bucket配置（必填）
OSS_BUCKET_NAME=ezijingai
OSS_REGION=cn-hangzhou

# 自定义域名配置（可选）
# 如果要使用自定义域名 smarteduonline.cn，设置以下两项
OSS_ENDPOINT=https://smarteduonline.cn
OSS_USE_CNAME=true

# 如果不使用自定义域名，则注释或删除以下两行
# OSS_ENDPOINT=
# OSS_USE_CNAME=false
```

### 2. 获取阿里云AccessKey

1. 登录阿里云控制台
2. 访问 [RAM访问控制 - 用户AccessKey](https://ram.console.aliyun.com/manage/ak)
3. 创建新的AccessKey或使用现有的
4. 将 `AccessKey ID` 和 `AccessKey Secret` 填入 `.env` 文件

**⚠️ 安全提示**: 
- 不要将 `.env` 文件提交到代码仓库
- AccessKey Secret 只在创建时显示一次，请妥善保存
- 建议使用RAM子账号，仅授予OSS相关权限

### 3. 配置OSS Bucket

#### 3.1 确认Bucket配置
- **Bucket名称**: `ezijingai`
- **地域**: 华东1（杭州）`cn-hangzhou`
- **读写权限**: 建议设置为"私有"，通过签名URL访问

#### 3.2 配置CORS（跨域资源共享）

在阿里云OSS控制台 -> 选择Bucket -> 权限管理 -> 跨域设置（CORS），添加规则：

```xml
<CORSConfiguration>
    <CORSRule>
        <AllowedOrigin>http://localhost:3000</AllowedOrigin>
        <AllowedOrigin>http://localhost:3001</AllowedOrigin>
        <AllowedOrigin>https://smarteduonline.cn</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>DELETE</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
        <ExposeHeader>ETag</ExposeHeader>
        <ExposeHeader>Content-Type</ExposeHeader>
        <ExposeHeader>Content-Length</ExposeHeader>
        <MaxAgeSeconds>3600</MaxAgeSeconds>
    </CORSRule>
</CORSConfiguration>
```

### 4. 配置WebOffice在线预览（可选但推荐）

WebOffice是阿里云提供的在线文档预览服务，支持Word、Excel、PPT、PDF文件的在线查看。

#### 4.1 开通智能媒体管理（IMM）服务

1. 访问 [智能媒体管理控制台](https://imm.console.aliyun.com/)
2. 开通IMM服务
3. 创建Project，选择与OSS Bucket相同的地域（cn-hangzhou）
4. 绑定Project到OSS Bucket

#### 4.2 配置自定义域名（WebOffice预览必需）

**重要**: WebOffice在线预览功能要求使用自定义域名。

1. 在阿里云OSS控制台 -> 选择Bucket -> 传输管理 -> 域名管理
2. 绑定自定义域名 `smarteduonline.cn`
3. 配置DNS解析：
   - 域名: `smarteduonline.cn`
   - 记录类型: CNAME
   - 记录值: `ezijingai.oss-cn-hangzhou.aliyuncs.com`
   - DNS服务器: `dns23.hichina.com`

4. 等待DNS解析生效（通常5-10分钟）

5. 更新 `.env` 文件：
```bash
OSS_ENDPOINT=https://smarteduonline.cn
OSS_USE_CNAME=true
```

#### 4.3 配置微信小程序白名单（如果需要）

如果需要在微信小程序中使用WebOffice预览，请联系IMM技术支持：
- 钉钉用户群: 88490020073
- 提供域名: `smarteduonline.cn`

## 📝 **支持的文件类型**

### WebOffice在线预览支持：

| 文件类型 | 文件后缀 |
|---------|---------|
| Word  | doc、dot、wps、wpt、docx、dotx、docm、dotm、rtf |
| PPT   | ppt、pptx、pptm、ppsx、ppsm、pps、potx、potm、dpt、dps |
| Excel | xls、xlt、et、xlsx、xltx、csv、xlsm、xltm |
| PDF   | pdf |

### 其他支持上传的类型：

- **视频**: mp4、avi、mov、wmv、flv、mkv
- **图片**: jpg、jpeg、png、gif、bmp、webp
- **Markdown**: md、markdown

## 🚀 **使用方法**

### 后端API

#### 1. 上传文件
```http
POST /api/v1/teacher/resources/upload
Content-Type: multipart/form-data

file: (文件)
resource_name: "资源名称"
knowledge_point: "知识点"  (可选)
folder_id: 1  (可选)
teacher_id: 2
```

**响应**:
```json
{
  "message": "资源上传成功",
  "id": 1,
  "resource_name": "教学文档",
  "resource_type": "word",
  "file_size": 1024000,
  "file_path": "https://smarteduonline.cn/teaching_resources/word/xxx.docx",
  "pdf_converted": true
}
```

#### 2. 获取WebOffice预览URL
```http
GET /api/v1/teacher/resources/{resource_id}/weboffice-url?expires=3600&allow_export=true&allow_print=true&watermark=内部资料
```

**响应**:
```json
{
  "success": true,
  "preview_url": "https://smarteduonline.cn/teaching_resources/word/xxx.docx?x-oss-process=doc/preview,export_1,print_1/watermark,text_5YaF6YOo6LWE5paZ,size_30,t_60&Expires=xxx&OSSAccessKeyId=xxx&Signature=xxx",
  "resource_id": 1,
  "resource_name": "教学文档",
  "resource_type": "word",
  "expires_in": 3600
}
```

### 前端使用

```typescript
// 获取预览URL
const response = await fetch(
  `/api/v1/teacher/resources/${resourceId}/weboffice-url?expires=3600&allow_export=true&allow_print=true&watermark=内部资料`
);
const data = await response.json();

// 在iframe中打开预览
window.open(data.preview_url, '_blank');
```

## 💰 **计费说明**

使用OSS和WebOffice会产生以下费用：

### 1. OSS费用
- **存储费用**: 按存储容量计费
- **流量费用**: 外网下载产生流出流量费用
- **请求费用**: API调用次数费用

### 2. WebOffice预览费用
- **按调用次数计费**: 每次打开预览页面计一次
- **截至2023年12月1日前**: 按文档打开次数收费
- **2023年12月1日后**: 按API接口调用次数收费

详细定价请参考:
- [OSS产品定价](https://www.aliyun.com/price/product#/oss/detail)
- [IMM产品定价](https://www.aliyun.com/price/product#/imm/detail)

## 🔍 **故障排查**

### 1. 文件上传失败

**问题**: 上传时提示"OSS未配置"

**解决方案**:
- 检查 `.env` 文件中 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET` 是否正确
- 重启后端服务使环境变量生效

### 2. WebOffice预览失败

**问题**: 点击预览没有反应或显示错误

**可能原因和解决方案**:
1. **未配置自定义域名**: WebOffice必须使用自定义域名
   - 确认 `OSS_ENDPOINT` 和 `OSS_USE_CNAME` 已正确配置
   - 确认DNS解析已生效

2. **未绑定IMM Project**: 
   - 在IMM控制台创建Project并绑定到OSS Bucket

3. **文件不在OSS中**:
   - 确认文件已成功上传到OSS（检查file_path是否以http/https开头）

4. **权限不足**:
   - 确认RAM用户有 `oss:ProcessImm`、`imm:GenerateWebofficeToken`、`imm:RefreshWebofficeToken` 权限

### 3. CORS错误

**问题**: 浏览器控制台显示CORS错误

**解决方案**:
- 检查OSS Bucket的CORS配置是否正确
- 确认域名已添加到AllowedOrigin列表

## 📞 **技术支持**

- 阿里云OSS文档: https://help.aliyun.com/product/31815.html
- WebOffice在线预览文档: https://help.aliyun.com/zh/oss/user-guide/online-object-preview
- OSS SDK下载: https://oss.console.aliyun.com/sdk
- IMM技术支持钉钉群: 88490020073

## ✅ **配置完成检查清单**

- [ ] 已创建.env文件并配置OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET
- [ ] 已确认OSS Bucket名称为ezijingai，地域为cn-hangzhou
- [ ] 已配置OSS Bucket的CORS规则
- [ ] （可选）已开通IMM服务并创建Project
- [ ] （可选）已绑定自定义域名smarteduonline.cn到OSS Bucket
- [ ] （可选）已配置DNS解析，CNAME记录指向OSS域名
- [ ] 已在.env中配置OSS_ENDPOINT和OSS_USE_CNAME（如使用自定义域名）
- [ ] 已重启后端服务使配置生效
- [ ] 已测试文件上传功能
- [ ] （可选）已测试WebOffice预览功能

