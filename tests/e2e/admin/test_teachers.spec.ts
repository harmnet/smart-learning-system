import { test, expect } from './conftest';

test.describe('Teachers Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/teachers');
  });

  test('应该显示教师管理页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/教师|Teacher/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/teachers/);
  });

  test('应该显示教师列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('应该显示统计卡片', async ({ authenticatedPage }) => {
    const statsCards = authenticatedPage.locator('text=/活跃|课程|学生/i');
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('应该可以搜索教师', async ({ authenticatedPage }) => {
    const nameInput = authenticatedPage.locator('input[placeholder*="姓名"], input[name="name"]').first();
    if (await nameInput.isVisible({ timeout: 3000 })) {
      await nameInput.fill('测试');
      const searchButton = authenticatedPage.locator('button[type="submit"]:has-text("搜索")').first();
      if (await searchButton.isVisible({ timeout: 2000 })) {
        await searchButton.click();
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('应该可以创建教师', async ({ authenticatedPage }) => {
    const addButton = authenticatedPage.locator('button:has-text("添加")').first();
    await addButton.click();
    
    await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    const nameInput = authenticatedPage.locator('input[name="full_name"]').first();
    await nameInput.fill(`测试教师_${Date.now()}`);
    
    const emailInput = authenticatedPage.locator('input[name="email"]').first();
    await emailInput.fill(`teacher_${Date.now()}@test.com`);
    
    const phoneInput = authenticatedPage.locator('input[name="phone"]').first();
    await phoneInput.fill(`139${Date.now().toString().slice(-8)}`);
    
    const majorSelect = authenticatedPage.locator('select[name="major_id"]').first();
    if (await majorSelect.isVisible({ timeout: 2000 })) {
      await majorSelect.selectOption({ index: 1 });
    }
    
    const submitButton = authenticatedPage.locator('button[type="submit"]').first();
    await submitButton.click();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('应该可以重置密码', async ({ authenticatedPage }) => {
    const resetPasswordButton = authenticatedPage.locator('button:has([class*="reset"]), button[title*="重置密码"]').first();
    if (await resetPasswordButton.isVisible({ timeout: 3000 })) {
      await resetPasswordButton.click();
      
      // 等待确认对话框
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 确认重置
      const confirmButton = authenticatedPage.locator('button:has-text("确认"), button:has-text("Confirm")').first();
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
        
        // 等待密码显示模态框
        await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
        
        // 验证新密码显示
        const passwordDisplay = authenticatedPage.locator('text=/新密码|New Password/, [class*="password"]').first();
        await expect(passwordDisplay).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('应该可以查看教师课程', async ({ authenticatedPage }) => {
    const viewCoursesButton = authenticatedPage.locator('button[title*="课程"], button:has([class*="course"])').first();
    if (await viewCoursesButton.isVisible({ timeout: 3000 })) {
      await viewCoursesButton.click();
      
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const coursesList = authenticatedPage.locator('[class*="course"], [class*="list"]').first();
      await expect(coursesList).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以查看教师班级', async ({ authenticatedPage }) => {
    const viewClassesButton = authenticatedPage.locator('button[title*="班级"], button:has([class*="class"])').first();
    if (await viewClassesButton.isVisible({ timeout: 3000 })) {
      await viewClassesButton.click();
      
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const classesList = authenticatedPage.locator('[class*="class"], [class*="list"]').first();
      await expect(classesList).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以编辑教师', async ({ authenticatedPage }) => {
    const editButton = authenticatedPage.locator('button:has([class*="edit"])').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const nameInput = authenticatedPage.locator('input[name="full_name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill(`更新后的教师_${Date.now()}`);
        const saveButton = authenticatedPage.locator('button[type="submit"]').first();
        await saveButton.click();
        await authenticatedPage.waitForTimeout(2000);
      }
    }
  });
});
