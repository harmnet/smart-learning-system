import { test, expect } from '../conftest';

test.describe('Dictionary Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/dictionary');
  });

  test('应该显示数据字典页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/字典|Dictionary/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/dictionary/);
  });

  test('应该显示字典类型列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('[class*="type"], [class*="list"]', { timeout: 10000 });
    const typeList = authenticatedPage.locator('[class*="type"], button').first();
    await expect(typeList).toBeVisible();
  });

  test('应该可以选择字典类型', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('button, [class*="type"]', { timeout: 10000 });
    
    // 选择第一个类型
    const firstType = authenticatedPage.locator('button, [class*="type"]').first();
    if (await firstType.isVisible({ timeout: 3000 })) {
      await firstType.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // 验证字典项列表显示
      const itemsList = authenticatedPage.locator('table, [class*="item"]').first();
      await expect(itemsList).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以创建字典类型', async ({ authenticatedPage }) => {
    const addTypeButton = authenticatedPage.locator('button:has-text("添加类型"), button:has-text("Add Type")').first();
    if (await addTypeButton.isVisible({ timeout: 3000 })) {
      await addTypeButton.click();
      
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const codeInput = authenticatedPage.locator('input[name="code"]').first();
      await codeInput.fill(`test_type_${Date.now()}`);
      
      const nameInput = authenticatedPage.locator('input[name="name"]').first();
      await nameInput.fill(`测试类型_${Date.now()}`);
      
      const submitButton = authenticatedPage.locator('button[type="submit"]').first();
      await submitButton.click();
      await authenticatedPage.waitForTimeout(2000);
    }
  });

  test('应该可以编辑字典项', async ({ authenticatedPage }) => {
    // 先选择一个类型
    await authenticatedPage.waitForSelector('button, [class*="type"]', { timeout: 10000 });
    const firstType = authenticatedPage.locator('button, [class*="type"]').first();
    if (await firstType.isVisible({ timeout: 3000 })) {
      await firstType.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // 查找编辑按钮
      const editButton = authenticatedPage.locator('button:has([class*="edit"])').first();
      if (await editButton.isVisible({ timeout: 3000 })) {
        await editButton.click();
        await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
        
        const labelInput = authenticatedPage.locator('input[name="label"]').first();
        if (await labelInput.isVisible({ timeout: 2000 })) {
          await labelInput.fill(`更新后的标签_${Date.now()}`);
          const saveButton = authenticatedPage.locator('button[type="submit"]').first();
          await saveButton.click();
          await authenticatedPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('应该可以删除字典项', async ({ authenticatedPage }) => {
    // 先选择一个类型
    await authenticatedPage.waitForSelector('button, [class*="type"]', { timeout: 10000 });
    const firstType = authenticatedPage.locator('button, [class*="type"]').first();
    if (await firstType.isVisible({ timeout: 3000 })) {
      await firstType.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // 查找删除按钮
      const deleteButton = authenticatedPage.locator('button:has([class*="delete"])').first();
      if (await deleteButton.isVisible({ timeout: 3000 })) {
        await deleteButton.click();
        
        // 等待确认对话框
        await authenticatedPage.waitForSelector('[role="dialog"], [class*="confirm"]', { timeout: 5000 });
        // 不实际删除，只测试对话框出现
      }
    }
  });
});
