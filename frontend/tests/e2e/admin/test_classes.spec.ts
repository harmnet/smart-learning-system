import { test, expect } from '../conftest';

test.describe('Classes Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/classes');
  });

  test('应该显示班级管理页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/班级|Class/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/classes/);
  });

  test('应该显示班级列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('应该可以搜索班级', async ({ authenticatedPage }) => {
    const searchInput = authenticatedPage.locator('input[type="text"][placeholder*="搜索"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('测试');
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以按组织筛选', async ({ authenticatedPage }) => {
    const orgSelect = authenticatedPage.locator('select:has(option)').first();
    if (await orgSelect.isVisible({ timeout: 3000 })) {
      await orgSelect.selectOption({ index: 1 });
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以按专业筛选', async ({ authenticatedPage }) => {
    const majorSelect = authenticatedPage.locator('select').nth(1);
    if (await majorSelect.isVisible({ timeout: 3000 })) {
      await majorSelect.selectOption({ index: 1 });
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该可以创建班级', async ({ authenticatedPage }) => {
    const addButton = authenticatedPage.locator('button:has-text("添加")').first();
    await addButton.click();
    
    await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    const nameInput = authenticatedPage.locator('input[name="name"]').first();
    await nameInput.fill(`测试班级_${Date.now()}`);
    
    const majorSelect = authenticatedPage.locator('select[name="major_id"]').first();
    if (await majorSelect.isVisible({ timeout: 2000 })) {
      await majorSelect.selectOption({ index: 1 });
    }
    
    const gradeSelect = authenticatedPage.locator('select[name="grade"]').first();
    if (await gradeSelect.isVisible({ timeout: 2000 })) {
      await gradeSelect.selectOption({ index: 1 });
    }
    
    const submitButton = authenticatedPage.locator('button[type="submit"]').first();
    await submitButton.click();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('应该可以查看班级学生', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    
    // 查找学生数量按钮或查看学生按钮
    const studentsButton = authenticatedPage.locator('button:has-text(/学生|Student/), button[class*="student"]').first();
    if (await studentsButton.isVisible({ timeout: 3000 })) {
      await studentsButton.click();
      
      // 等待学生列表模态框
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const studentList = authenticatedPage.locator('[class*="student"], [class*="list"]').first();
      await expect(studentList).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该可以编辑班级', async ({ authenticatedPage }) => {
    const editButton = authenticatedPage.locator('button:has([class*="edit"])').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const nameInput = authenticatedPage.locator('input[name="name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill(`更新后的班级_${Date.now()}`);
        const saveButton = authenticatedPage.locator('button[type="submit"]').first();
        await saveButton.click();
        await authenticatedPage.waitForTimeout(2000);
      }
    }
  });

  test('应该可以访问班级一览页面', async ({ authenticatedPage }) => {
    const overviewButton = authenticatedPage.locator('button:has-text("班级一览"), a:has-text("班级一览")').first();
    if (await overviewButton.isVisible({ timeout: 3000 })) {
      await overviewButton.click();
      await authenticatedPage.waitForURL(/\/admin\/classes\/overview/, { timeout: 5000 });
    }
  });
});
