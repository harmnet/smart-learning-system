import { test, expect } from './conftest';

test.describe('Finance Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/finance');
  });

  test('应该显示财务管理页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/财务|Finance/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/finance/);
  });

  test('应该显示财务统计卡片', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('[class*="stat"], [class*="card"]', { timeout: 10000 });
    const statsCards = authenticatedPage.locator('text=/收入|待支付|订单/i');
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('应该显示订单列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('应该可以按状态筛选订单', async ({ authenticatedPage }) => {
    // 测试"全部"筛选
    const allButton = authenticatedPage.locator('button:has-text("全部"), button:has-text("All")').first();
    if (await allButton.isVisible({ timeout: 3000 })) {
      await allButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
    
    // 测试"已支付"筛选
    const paidButton = authenticatedPage.locator('button:has-text("已支付"), button:has-text("Paid")').first();
    if (await paidButton.isVisible({ timeout: 3000 })) {
      await paidButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
    
    // 测试"待支付"筛选
    const pendingButton = authenticatedPage.locator('button:has-text("待支付"), button:has-text("Pending")').first();
    if (await pendingButton.isVisible({ timeout: 3000 })) {
      await pendingButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以查看订单详情', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    
    const viewButton = authenticatedPage.locator('button:has([class*="view"])').first();
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
    }
  });

  test('应该可以导出订单', async ({ authenticatedPage }) => {
    const exportButton = authenticatedPage.locator('button:has-text("导出"), button:has-text("Export")').first();
    if (await exportButton.isVisible({ timeout: 3000 })) {
      // 注意：导出可能会触发下载，这里只测试按钮可点击
      await exportButton.click();
      await authenticatedPage.waitForTimeout(2000);
    }
  });
});
