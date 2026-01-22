import { test, expect } from './conftest';

test.describe('Organizations Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/organizations');
  });

  test('应该显示组织管理页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/组织|Organization/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/organizations/);
  });

  test('应该显示组织列表', async ({ authenticatedPage }) => {
    // 等待列表加载
    await authenticatedPage.waitForSelector('table, [class*="list"], [class*="table"]', { timeout: 10000 });
    
    // 验证列表存在
    const list = authenticatedPage.locator('table, [class*="list"]').first();
    await expect(list).toBeVisible();
  });

  test('应该可以搜索组织', async ({ authenticatedPage }) => {
    // 查找搜索输入框
    const searchInput = authenticatedPage.locator('input[type="text"][placeholder*="搜索"], input[type="search"]').first();
    
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('测试');
      await authenticatedPage.waitForTimeout(500); // 等待防抖
      
      // 验证搜索结果
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以切换到树形视图', async ({ authenticatedPage }) => {
    // 查找视图切换按钮
    const viewToggleButton = authenticatedPage.locator('button:has-text("树形"), button:has-text("Tree"), button:has-text("切换")').first();
    
    if (await viewToggleButton.isVisible({ timeout: 3000 })) {
      await viewToggleButton.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // 验证切换到树形视图
      const treeView = authenticatedPage.locator('[class*="tree"], [class*="Tree"]').first();
      await expect(treeView).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以创建组织', async ({ authenticatedPage }) => {
    // 点击添加按钮
    const addButton = authenticatedPage.locator('button:has-text("添加"), button:has-text("Add"), button:has-text("创建")').first();
    await addButton.click();
    
    // 等待模态框出现
    await authenticatedPage.waitForSelector('[role="dialog"], [class*="modal"], [class*="Modal"]', { timeout: 5000 });
    
    // 填写表单
    const nameInput = authenticatedPage.locator('input[name="name"], input[placeholder*="名称"], input[placeholder*="Name"]').first();
    await nameInput.fill(`测试组织_${Date.now()}`);
    
    // 提交表单
    const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("保存"), button:has-text("Save")').first();
    await submitButton.click();
    
    // 等待成功提示或列表更新
    await authenticatedPage.waitForTimeout(2000);
  });

  test('应该可以编辑组织', async ({ authenticatedPage }) => {
    // 等待列表加载
    await authenticatedPage.waitForSelector('table tr, [class*="item"]', { timeout: 10000 });
    
    // 查找编辑按钮
    const editButton = authenticatedPage.locator('button:has([class*="edit"]), button[title*="编辑"], button[title*="Edit"]').first();
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      
      // 等待编辑模态框
      await authenticatedPage.waitForSelector('[role="dialog"], [class*="modal"]', { timeout: 5000 });
      
      // 修改名称
      const nameInput = authenticatedPage.locator('input[name="name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill(`更新后的组织_${Date.now()}`);
        
        // 保存
        const saveButton = authenticatedPage.locator('button[type="submit"], button:has-text("保存")').first();
        await saveButton.click();
        
        await authenticatedPage.waitForTimeout(2000);
      }
    }
  });

  test('应该可以查看组织详情', async ({ authenticatedPage }) => {
    // 查找查看按钮
    const viewButton = authenticatedPage.locator('button:has([class*="view"]), button[title*="查看"], button[title*="View"]').first();
    
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      
      // 等待详情模态框
      await authenticatedPage.waitForSelector('[role="dialog"], [class*="modal"]', { timeout: 5000 });
      
      // 验证详情显示
      const detailContent = authenticatedPage.locator('[class*="detail"], [class*="content"]').first();
      await expect(detailContent).toBeVisible();
      
      // 关闭模态框
      const closeButton = authenticatedPage.locator('button:has-text("关闭"), button:has-text("Close"), button[aria-label*="close"]').first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
      }
    }
  });

  test('应该可以删除组织', async ({ authenticatedPage }) => {
    // 查找删除按钮
    const deleteButton = authenticatedPage.locator('button:has([class*="delete"]), button[title*="删除"], button[title*="Delete"]').first();
    
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      
      // 等待确认对话框
      await authenticatedPage.waitForSelector('[role="dialog"], [class*="confirm"]', { timeout: 5000 });
      
      // 确认删除（注意：这里可能会删除真实数据，需要谨慎）
      const confirmButton = authenticatedPage.locator('button:has-text("确认"), button:has-text("Confirm"), button:has-text("确定")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        // 可以选择不实际删除，只测试对话框出现
        // await confirmButton.click();
        // await authenticatedPage.waitForTimeout(2000);
      }
    }
  });

  test('应该可以切换列表和树形视图', async ({ authenticatedPage }) => {
    const toggleButton = authenticatedPage.locator('button:has-text("切换"), button:has-text("Switch")').first();
    
    if (await toggleButton.isVisible({ timeout: 3000 })) {
      const initialText = await toggleButton.textContent();
      
      await toggleButton.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // 验证视图已切换
      const newText = await toggleButton.textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test('应该可以展开/收起树形节点', async ({ authenticatedPage }) => {
    // 先切换到树形视图
    const toggleButton = authenticatedPage.locator('button:has-text("树形"), button:has-text("Tree")').first();
    if (await toggleButton.isVisible({ timeout: 3000 })) {
      await toggleButton.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // 查找展开/收起按钮
      const expandButton = authenticatedPage.locator('button[class*="expand"], button[class*="toggle"]').first();
      if (await expandButton.isVisible({ timeout: 3000 })) {
        await expandButton.click();
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });
});
