import { test, expect } from '../../conftest';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');
  });

  test('应该显示Dashboard页面', async ({ authenticatedPage }) => {
    // 验证页面标题
    await expect(authenticatedPage.locator('h1')).toContainText(/管理员|Admin|Dashboard/i);
    
    // 验证页面加载完成
    await expect(authenticatedPage).toHaveURL(/\/admin$/);
  });

  test('应该显示统计卡片', async ({ authenticatedPage }) => {
    // 等待统计卡片加载
    await authenticatedPage.waitForSelector('[class*="statistics"], [class*="card"]', { timeout: 10000 });
    
    // 验证统计卡片存在
    const statsCards = authenticatedPage.locator('text=/教师|学生|专业|班级|课程|考试/i');
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('应该显示快捷操作按钮', async ({ authenticatedPage }) => {
    // 验证快捷操作区域存在
    const quickActions = authenticatedPage.locator('text=/添加教师|添加学生|创建专业|管理班级/i');
    await expect(quickActions.first()).toBeVisible({ timeout: 5000 });
  });

  test('快捷操作按钮应该可以点击', async ({ authenticatedPage }) => {
    // 测试"添加教师"按钮
    const addTeacherButton = authenticatedPage.locator('text=/添加教师/i').first();
    if (await addTeacherButton.isVisible({ timeout: 3000 })) {
      await addTeacherButton.click();
      // 应该跳转到教师管理页面或打开模态框
      await authenticatedPage.waitForTimeout(1000);
    }
  });

  test('应该显示系统健康状态', async ({ authenticatedPage }) => {
    // 等待系统健康状态加载
    const systemHealth = authenticatedPage.locator('text=/系统健康|System Health|数据库|API服务|存储/i');
    await expect(systemHealth.first()).toBeVisible({ timeout: 10000 });
  });

  test('应该显示图表（如果存在）', async ({ authenticatedPage }) => {
    // 检查是否有图表元素
    const charts = authenticatedPage.locator('svg, canvas, [class*="chart"], [class*="graph"]');
    const chartCount = await charts.count();
    
    // 如果有图表，验证它们可见
    if (chartCount > 0) {
      await expect(charts.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
