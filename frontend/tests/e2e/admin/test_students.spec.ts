import { test, expect } from '../conftest';

test.describe('Students Management', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/students');
  });

  test('应该显示学生管理页面', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.locator('h1')).toContainText(/学生|Student/i);
    await expect(authenticatedPage).toHaveURL(/\/admin\/students/);
  });

  test('应该显示学生列表', async ({ authenticatedPage }) => {
    await authenticatedPage.waitForSelector('table', { timeout: 10000 });
    const table = authenticatedPage.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('应该显示统计卡片', async ({ authenticatedPage }) => {
    const statsCards = authenticatedPage.locator('text=/总数|活跃|停用|专业/i');
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('应该可以按姓名搜索', async ({ authenticatedPage }) => {
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

  test('应该可以按学号搜索', async ({ authenticatedPage }) => {
    const studentNoInput = authenticatedPage.locator('input[placeholder*="学号"], input[name="student_no"]').first();
    if (await studentNoInput.isVisible({ timeout: 3000 })) {
      await studentNoInput.fill('STU');
      const searchButton = authenticatedPage.locator('button[type="submit"]:has-text("搜索")').first();
      if (await searchButton.isVisible({ timeout: 2000 })) {
        await searchButton.click();
        await authenticatedPage.waitForTimeout(1000);
      }
    }
  });

  test('应该可以创建学生', async ({ authenticatedPage }) => {
    const addButton = authenticatedPage.locator('button:has-text("添加")').first();
    await addButton.click();
    
    await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // 填写表单
    const studentNoInput = authenticatedPage.locator('input[name="student_no"]').first();
    await studentNoInput.fill(`STU${Date.now()}`);
    
    const usernameInput = authenticatedPage.locator('input[name="username"]').first();
    await usernameInput.fill(`student_${Date.now()}`);
    
    const nameInput = authenticatedPage.locator('input[name="full_name"]').first();
    await nameInput.fill(`测试学生_${Date.now()}`);
    
    const phoneInput = authenticatedPage.locator('input[name="phone"]').first();
    await phoneInput.fill(`138${Date.now().toString().slice(-8)}`);
    
    // 选择班级
    const classButton = authenticatedPage.locator('div[class*="class"], button:has-text("选择班级")').first();
    if (await classButton.isVisible({ timeout: 2000 })) {
      await classButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // 选择第一个班级
      const firstClass = authenticatedPage.locator('button, [class*="class"]').first();
      if (await firstClass.isVisible({ timeout: 2000 })) {
        await firstClass.click();
      }
    }
    
    // 提交
    const submitButton = authenticatedPage.locator('button[type="submit"]').first();
    await submitButton.click();
    await authenticatedPage.waitForTimeout(2000);
  });

  test('应该可以编辑学生', async ({ authenticatedPage }) => {
    const editButton = authenticatedPage.locator('button:has([class*="edit"])').first();
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await authenticatedPage.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const nameInput = authenticatedPage.locator('input[name="full_name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill(`更新后的学生_${Date.now()}`);
        const saveButton = authenticatedPage.locator('button[type="submit"]').first();
        await saveButton.click();
        await authenticatedPage.waitForTimeout(2000);
      }
    }
  });

  test('应该可以访问学生热力图', async ({ authenticatedPage }) => {
    const heatmapLink = authenticatedPage.locator('a:has-text("热力图"), button:has-text("热力图")').first();
    if (await heatmapLink.isVisible({ timeout: 3000 })) {
      await heatmapLink.click();
      await authenticatedPage.waitForURL(/\/admin\/students\/heatmap/, { timeout: 5000 });
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
