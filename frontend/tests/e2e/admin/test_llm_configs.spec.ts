import { test, expect } from '../conftest';

test.describe('LLM Configs Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/llm-configs');
  });

  test('应该显示LLM配置页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/LLM|配置|Config/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/llm-configs/);
  });

  test('应该显示配置列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('应该可以创建LLM配置', async ({ authenticatedPage }) => {
    const addButton = authenticatedPage.locator('button:has-text("添加"), button:has-text("Add")').first();
    await addButton.click();
    
    await authenticatedPage.waitForSelector('[role="dialog"], [class*="modal"]', { timeout: 5000 });
    
    // 填写表单
    const providerNameInput = authenticatedPage.locator('input[name="provider_name"]').first();
    await providerNameInput.fill(`测试提供商_${Date.now()}`);
    
    const providerKeyInput = authenticatedPage.locator('input[name="provider_key"]').first();
    await providerKeyInput.fill(`test_provider_${Date.now()}`);
    
    const apiKeyInput = authenticatedPage.locator('input[name="api_key"]').first();
    await apiKeyInput.fill('test_api_key_12345');
    
    const submitButton = authenticatedPage.locator('button[type="submit"]').first();
    await submitButton.click();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('应该可以编辑配置', async ({ authenticatedPage }) => {
    const editButton = authenticatedPage.locator('button:has-text("编辑"), button:has-text("Edit")').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const providerNameInput = authenticatedPage.locator('input[name="provider_name"]').first();
      if (await providerNameInput.isVisible({ timeout: 2000 })) {
        await providerNameInput.fill(`更新后的提供商_${Date.now()}`);
        const saveButton = authenticatedPage.locator('button[type="submit"]').first();
        await saveButton.click();
        await authenticatedPage.waitForTimeout(2000);
      }
    }
  });

  test('应该可以切换配置状态', async ({ authenticatedPage }) => {
    const toggleButton = authenticatedPage.locator('button:has-text("切换"), button:has-text("Toggle")').first();
    if (await toggleButton.isVisible({ timeout: 3000 })) {
      await toggleButton.click();
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以测试配置', async ({ authenticatedPage }) => {
    const testButton = authenticatedPage.locator('button:has-text("测试"), button:has-text("Test")').first();
    if (await testButton.isVisible({ timeout: 3000 })) {
      await testButton.click();
      
      // 等待测试模态框
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 输入测试消息
      const messageInput = authenticatedPage.locator('textarea, input[type="text"]').first();
      if (await messageInput.isVisible({ timeout: 2000 })) {
        await messageInput.fill('你好，请介绍一下自己');
        
        // 发送测试
        const sendButton = authenticatedPage.locator('button:has-text("发送"), button:has-text("Send")').first();
        if (await sendButton.isVisible({ timeout: 2000 })) {
          await sendButton.click();
          await authenticatedPage.waitForTimeout(5000); // 等待LLM响应
        }
      }
    }
  });

  test('应该可以删除配置', async ({ authenticatedPage }) => {
    const deleteButton = authenticatedPage.locator('button:has-text("删除"), button:has-text("Delete")').first();
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      
      // 等待确认对话框
      await authenticatedPage.waitForSelector('[role="dialog"], [class*="confirm"]', { timeout: 5000 });
      // 不实际删除，只测试对话框出现
    }
  });
});
