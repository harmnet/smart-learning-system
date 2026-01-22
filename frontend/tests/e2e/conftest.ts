import { test as base, expect } from '@playwright/test';

// 测试配置
export const TEST_CONFIG = {
  baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
  adminUsername: process.env.TEST_ADMIN_USERNAME || 'admin',
  adminPassword: process.env.TEST_ADMIN_PASSWORD || 'admin123',
  apiBaseURL: process.env.API_BASE_URL || 'http://localhost:8000',
};

// 扩展test fixture以包含认证状态
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // 登录管理员账号
    await page.goto('/auth/login');
    
    // 等待登录页面加载
    await page.waitForSelector('textbox[placeholder*="用户名"], input[type="text"]', { timeout: 10000 });
    
    // 填写登录表单
    const usernameInput = page.locator('textbox[placeholder*="用户名"], input[type="text"]').first();
    const passwordInput = page.locator('textbox[placeholder*="密码"], input[type="password"]').first();
    const submitButton = page.locator('button:has-text("立即登录"), button[type="submit"]').first();
    
    await usernameInput.fill(TEST_CONFIG.adminUsername);
    await passwordInput.fill(TEST_CONFIG.adminPassword);
    
    // 等待按钮可点击
    await submitButton.waitFor({ state: 'visible', timeout: 5000 });
    
    // 点击登录按钮
    await submitButton.click();
    
    // 等待登录响应 - 检查是否有错误消息或成功跳转
    try {
      // 先等待可能的错误消息出现（如果登录失败）
      await page.waitForSelector('text=/错误|失败|Error|Failed/i', { timeout: 5000 }).catch(() => {});
      
      // 检查是否还在登录页面（说明登录失败）
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/login')) {
        // 检查是否有错误消息
        const errorElement = page.locator('text=/错误|失败|Error|Failed|无法连接|服务器错误/i').first();
        if (await errorElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          const errorText = await errorElement.textContent();
          throw new Error(`登录失败: ${errorText}`);
        }
        // 如果后端服务未运行，可能需要跳过测试
        throw new Error('登录超时：可能是后端服务未运行或登录凭据错误');
      }
    } catch (error: any) {
      // 如果不是超时错误，重新抛出
      if (!error.message?.includes('Timeout')) {
        throw error;
      }
    }
    
    // 等待导航到admin页面（允许更多时间）
    await page.waitForURL(/\/admin/, { timeout: 30000 }).catch(async () => {
      // 如果超时，检查当前URL
      const currentUrl = page.url();
      if (!currentUrl.includes('/admin')) {
        throw new Error(`登录后未跳转到/admin页面，当前URL: ${currentUrl}`);
      }
    });
    
    // 确保页面已加载
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    await use(page);
  },
});

export { expect };
