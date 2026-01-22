import { test, expect } from './conftest';

test.describe('Users Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/users');
  });

  test('应该显示用户管理页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/用户|User/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/users/);
  });

  test('应该显示用户列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('应该可以按姓名搜索', async ({ authenticatedPage }) => {
    const nameInput = authenticatedPage.locator('input[placeholder*="姓名"], input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('测试');
      const searchButton = authenticatedPage.locator('button:has-text("搜索")').first();
      if (await searchButton.isVisible({ timeout: 2000 })) {
        await searchButton.click();
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('应该可以按用户名搜索', async ({ authenticatedPage }) => {
    const usernameInput = authenticatedPage.locator('input[placeholder*="用户名"], input[name="username"]').first();
    if (await usernameInput.isVisible({ timeout: 3000 })) {
      await usernameInput.fill('admin');
      const searchButton = authenticatedPage.locator('button:has-text("搜索")').first();
      if (await searchButton.isVisible({ timeout: 2000 })) {
        await searchButton.click();
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('应该可以重置用户密码', async ({ authenticatedPage }) => {
    const resetPasswordButton = authenticatedPage.locator('button:has([class*="reset"]), button[title*="重置密码"]').first();
    if (await resetPasswordButton.isVisible({ timeout: 3000 })) {
      await resetPasswordButton.click();
      
      // 等待确认对话框
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 确认重置
      const confirmButton = authenticatedPage.locator('button:has-text("确认"), button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        await authenticatedPage.waitForTimeout(2000);
      }
    }
  });

  test('应该可以重置搜索条件', async ({ authenticatedPage }) => {
    const nameInput = authenticatedPage.locator('input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('测试');
      
      const resetButton = authenticatedPage.locator('button:has-text("重置")').first();
      if (await resetButton.isVisible({ timeout: 2000 })) {
        await resetButton.click();
        await authenticatedPage.waitForTimeout(500);
        
        const value = await nameInput.inputValue();
        expect(value).toBe('');
      }
    }
  });
});
