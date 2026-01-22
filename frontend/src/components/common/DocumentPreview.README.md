# DocumentPreview 通用文档预览组件

## 简介

`DocumentPreview` 是一个通用的文档在线预览组件，支持多种文档格式的预览，包括：

- **WebOffice预览**：Word、Excel、PPT文档（使用阿里云WebOffice SDK）
- **PDF预览**：PDF文档（使用iframe）
- **图片预览**：JPG、PNG、GIF、WebP、SVG等
- **视频预览**：MP4、WebM、OGG等
- **其他格式**：提供下载链接

## 特性

- ✅ 统一的预览接口，适用于学生端、教师端、管理员端
- ✅ 自动识别文档类型并选择合适的预览方式
- ✅ 支持WebOffice在线预览（需要后端返回token）
- ✅ 优雅的错误处理和加载状态
- ✅ 响应式设计，适配各种屏幕尺寸

## 使用方法

### 基本用法

```tsx
import DocumentPreview, { PreviewInfo } from '@/components/common/DocumentPreview';
import { teachingResourceService } from '@/services/teachingResource.service';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [resourceName, setResourceName] = useState('');

  const handlePreview = async (resourceId: number, name: string) => {
    try {
      // 获取预览信息
      const info = await teachingResourceService.getOfficePreviewUrl(resourceId);
      
      // 转换为PreviewInfo格式
      const fullInfo: PreviewInfo = {
        preview_url: info.preview_url,
        download_url: info.download_url,
        preview_type: info.preview_type as 'weboffice' | 'pdf' | 'download' | 'direct',
        resource_type: info.resource_type,
        file_name: info.file_name,
        // WebOffice需要的token信息
        access_token: info.access_token,
        refresh_token: info.refresh_token,
        access_token_expired_time: info.access_token_expired_time,
        refresh_token_expired_time: info.refresh_token_expired_time,
      };
      
      setPreviewInfo(fullInfo);
      setResourceName(name);
      setIsOpen(true);
    } catch (error) {
      console.error('获取预览信息失败:', error);
    }
  };

  return (
    <>
      <button onClick={() => handlePreview(12, '文档名称.docx')}>
        预览文档
      </button>
      
      {previewInfo && (
        <DocumentPreview
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setPreviewInfo(null);
          }}
          previewInfo={previewInfo}
          resourceName={resourceName}
        />
      )}
    </>
  );
}
```

### PreviewInfo 接口

```typescript
export interface PreviewInfo {
  preview_url: string;                    // 预览URL（必需）
  download_url?: string;                  // 下载URL（可选）
  preview_type: 'weboffice' | 'pdf' | 'download' | 'direct';  // 预览类型
  resource_type: string;                  // 资源类型（word、excel、ppt、pdf等）
  file_name?: string;                     // 文件名（可选）
  
  // WebOffice预览需要的token信息（可选）
  access_token?: string;
  refresh_token?: string;
  access_token_expired_time?: string;
  refresh_token_expired_time?: string;
}
```

### Props

| 属性 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `isOpen` | `boolean` | ✅ | 控制弹窗显示/隐藏 |
| `onClose` | `() => void` | ✅ | 关闭弹窗的回调函数 |
| `previewInfo` | `PreviewInfo \| null` | ✅ | 预览信息对象 |
| `resourceName` | `string` | ❌ | 资源名称（显示在弹窗标题） |
| `onError` | `(error: string) => void` | ❌ | 错误回调函数 |

## 预览类型说明

### 1. WebOffice预览 (`preview_type: 'weboffice'`)

用于Word、Excel、PPT文档的在线预览，需要：
- `preview_url`: WebOffice URL
- `access_token`: 访问令牌（必需）

组件会自动加载阿里云WebOffice SDK并初始化预览。

### 2. PDF预览 (`preview_type: 'pdf'`)

用于PDF文档预览，使用iframe直接加载PDF URL。

### 3. 下载预览 (`preview_type: 'download'`)

用于需要下载后查看的文档，显示下载按钮。

### 4. 直接预览 (`preview_type: 'direct'`)

用于图片、视频等可以直接在浏览器中预览的文件。

## 后端接口要求

后端 `/api/v1/teacher/resources/{resource_id}/preview` 接口应返回：

```json
{
  "preview_url": "https://...",
  "download_url": "https://...",
  "preview_type": "weboffice",
  "resource_type": "word",
  "file_name": "文档.docx",
  "access_token": "xxx",  // WebOffice预览需要
  "refresh_token": "xxx",  // WebOffice预览需要（可选）
  "access_token_expired_time": "2024-01-01T00:00:00Z",
  "refresh_token_expired_time": "2024-01-01T00:00:00Z"
}
```

## 注意事项

1. **WebOffice预览**：需要后端正确配置阿里云IMM服务，并返回有效的token
2. **CORS问题**：确保后端接口设置了正确的CORS头
3. **Token过期**：WebOffice token有过期时间，过期后需要重新获取
4. **文件大小**：大文件预览可能需要较长的加载时间

## 示例

参考 `frontend/src/app/student/courses/[id]/page.tsx` 中的使用示例。
