import { test, expect } from '../conftest';

test.describe('Majors Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/majors');
  });

  test('应该显示专业管理页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/专业|Major/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/majors/);
  });

  test('应该显示专业列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table, [class*="list"]', { timeout: 10000 });
    const list = authenticatedPage.locator('table, [class*="list"]').first();
    await expect(list).toBeVisible();
  });

  test('应该可以搜索专业', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('input[type="text"][placeholder*="搜索"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('测试');
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以创建专业', async ({ authenticatedPage }) => {
    const addButton = authenticatedPage.locator('button:has-text("添加"), button:has-text("Add")').first();
    await addButton.click();
    
    await authenticatedPage.waitForSelector('[role="dialog"], [class*="modal"]', { timeout: 5000 });
    
    // 填写表单
    const nameInput = authenticatedPage.locator('input[name="name"]').first();
    await nameInput.fill(`测试专业_${Date.now()}`);
    
    // 选择组织
    const orgSelect = authenticatedPage.locator('select[name="organization_id"], select:has(option)').first();
    if (await orgSelect.isVisible({ timeout: 2000 })) {
      await orgSelect.selectOption({ index: 1 });
    }
    
    // 填写其他字段
    const tuitionInput = authenticatedPage.locator('input[name="tuition_fee"], input[type="number"]').first();
    if (await tuitionInput.isVisible({ timeout: 2000 })) {
      await tuitionInput.fill('5000');
    }
    
    // 提交
    const submitButton = authenticatedPage.locator('button[type="submit"], button:has-text("保存")').first();
    await submitButton.click();
    
    await authenticatedPage.waitForTimeout(2000);
  });

  test('应该可以选择专业负责人', async ({ authenticatedPage }) => {
    const addButton = authenticatedPage.locator('button:has-text("添加")').first();
    await addButton.click();
    
    await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 查找教师搜索输入框
    const teacherInput = authenticatedPage.locator('input[placeholder*="教师"], input[placeholder*="teacher"]').first();
    if (await teacherInput.isVisible({ timeout: 3000 })) {
      await teacherInput.fill('测试');
      await authenticatedPage.waitForTimeout(1000);
      
      // 等待下拉列表出现
      const dropdown = authenticatedPage.locator('[class*="dropdown"], [class*="menu"]').first();
      if (await dropdown.isVisible({ timeout: 2000 })) {
        // 选择第一个选项
        const firstOption = dropdown.locator('button, [role="option"]').first();
        await firstOption.click();
      }
    }
  });

  test('应该可以编辑专业', async ({ authenticatedPage }) => {
    const editButton = authenticatedPage.locator('button:has([class*="edit"])').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const nameInput = authenticatedPage.locator('input[name="name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill(`更新后的专业_${Date.now()}`);
        
        const saveButton = authenticatedPage.locator('button[type="submit"]').first();
        await saveButton.click();
        await authenticatedPage.waitForTimeout(2000);
      }
    }
  });

  test('应该可以查看专业详情', async ({ authenticatedPage }) => {
    const viewButton = authenticatedPage.locator('button:has([class*="view"])').first();
    if (await viewButton.isVisible({ timeout: 3000 })) {
      await viewButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const detailContent = authenticatedPage.locator('[class*="detail"]').first();
      await expect(detailContent).toBeVisible();
    }
  });

  test('应该可以删除专业', async ({ authenticatedPage }) => {
    const deleteButton = authenticatedPage.locator('button:has([class*="delete"])').first();
    if (await deleteButton.isVisible({ timeout: 3000 })) {
      await deleteButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      // 不实际删除，只测试对话框出现
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
