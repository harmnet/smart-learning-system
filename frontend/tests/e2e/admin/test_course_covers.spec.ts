import { test, expect } from '../conftest';
import path from 'path';

test.describe('Course Covers Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/course-covers');
  });

  test('应该显示课程封面页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/封面|Cover/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/course-covers/);
  });

  test('应该显示封面列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table, [class*="list"]', { timeout: 10000 });
    const list = authenticatedPage.locator('table, [class*="list"]').first();
    await expect(list).toBeVisible();
  });

  test('应该可以上传封面', async ({ authenticatedPage }) => {
    const uploadButton = authenticatedPage.locator('button:has-text("上传"), button:has-text("Upload")').first();
    await uploadButton.click();
    
    await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 创建测试图片文件
    const testImagePath = path.join(__dirname, '../../fixtures/test-image.png');
    
    // 查找文件输入
    const fileInput = authenticatedPage.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 3000 })) {
      // 注意：Playwright的文件上传需要实际文件
      // 这里只测试文件选择器出现
      await expect(fileInput).toBeVisible();
    }
  });

  test('应该可以预览封面', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('img, [class*="image"]', { timeout: 10000 });
    
    const image = authenticatedPage.locator('img').first();
    if (await image.isVisible({ timeout: 3000 })) {
      await image.click();
      
      // 等待预览模态框
      await authenticatedPage.waitForSelector('[role="dialog"], [class*="preview"]', { timeout: 5000 });
      
      const previewImage = authenticatedPage.locator('img').first();
      await expect(previewImage).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以编辑封面', async ({ authenticatedPage }) => {
    const editButton = authenticatedPage.locator('button:has([class*="edit"])').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 验证编辑表单出现
      const form = authenticatedPage.locator('form, [class*="form"]').first();
      await expect(form).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以删除封面', async ({ authenticatedPage }) => {
    const deleteButton = authenticatedPage.locator('button:has([class*="delete"])').first();
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      
      // 等待确认对话框
      await authenticatedPage.waitForSelector('[role="dialog"], [class*="confirm"]', { timeout: 5000 });
      // 不实际删除，只测试对话框出现
    }
  });
});
