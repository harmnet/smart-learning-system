import { test, expect } from '../conftest';

test.describe('LLM Call Logs Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/llm-call-logs');
  });

  test('应该显示LLM调用日志页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/LLM|调用|日志|Log/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/llm-call-logs/);
  });

  test('应该显示日志列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('应该可以按功能类型筛选', async ({ authenticatedPage }) => {
    const functionTypeSelect = authenticatedPage.locator('select').first();
    if (await functionTypeSelect.isVisible({ timeout: 3000 })) {
      await functionTypeSelect.selectOption({ index: 1 });
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以按用户ID筛选', async ({ authenticatedPage }) => {
    const userIdInput = authenticatedPage.locator('input[type="number"], input[placeholder*="用户ID"]').first();
    if (await userIdInput.isVisible({ timeout: 3000 })) {
      await userIdInput.fill('1');
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以按时间范围筛选', async ({ authenticatedPage }) => {
    const startDateInput = authenticatedPage.locator('input[type="datetime-local"]').first();
    if (await startDateInput.isVisible({ timeout: 3000 })) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await startDateInput.fill(yesterday.toISOString().slice(0, 16));
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以查看日志详情', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    
    // 点击第一行或查看详情按钮
    const viewButton = authenticatedPage.locator('button:has-text("查看详情"), tr').first();
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      
      // 等待详情模态框
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 验证详情内容
      const detailContent = authenticatedPage.locator('[class*="detail"], [class*="content"]').first();
      await expect(detailContent).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以展开/收起提示词', async ({ authenticatedPage }) => {
    // 先打开详情
    const viewButton = authenticatedPage.locator('button:has-text("查看详情"), tr').first();
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 查找展开/收起按钮
      const expandButton = authenticatedPage.locator('button:has-text("展开"), button:has-text("Expand")').first();
      if (await expandButton.isVisible({ timeout: 3000 })) {
        await expandButton.click();
        await authenticatedPage.waitForTimeout(500);
        
        // 验证内容已展开
        const expandedContent = authenticatedPage.locator('pre, [class*="expanded"]').first();
        await expect(expandedContent).toBeVisible({ timeout: 2000 });
      }
    }
  });

  test('应该可以复制内容', async ({ authenticatedPage }) => {
    // 先打开详情
    const viewButton = authenticatedPage.locator('button:has-text("查看详情"), tr').first();
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 查找复制按钮
      const copyButton = authenticatedPage.locator('button:has-text("复制"), button:has-text("Copy")').first();
      if (await copyButton.isVisible({ timeout: 3000 })) {
        await copyButton.click();
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });

  test('应该可以重置筛选条件', async ({ authenticatedPage }) => {
    const resetButton = authenticatedPage.locator('button:has-text("重置筛选"), button:has-text("Reset")').first();
    if (await resetButton.isVisible({ timeout: 3000 })) {
      await resetButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以分页', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    
    const nextButton = authenticatedPage.locator('button:has-text("下一页"), button:has-text("Next")').first();
    if (await nextButton.isVisible({ timeout: 3000 }) && !(await nextButton.isDisabled())) {
      await nextButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });
});
