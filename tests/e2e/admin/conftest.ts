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
    await page.waitForSelector('input[type="text"], input[type="email"], input[name="username"]', { timeout: 10000 });
    
    // 填写登录表单
    const usernameInput = page.locator('input[type="text"], input[type="email"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Login")').first();
    
    await usernameInput.fill(TEST_CONFIG.adminUsername);
    await passwordInput.fill(TEST_CONFIG.adminPassword);
    await submitButton.click();
    
    // 等待登录成功（跳转到admin页面或dashboard）
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    
    await use(page);
  },
});

export { expect };
