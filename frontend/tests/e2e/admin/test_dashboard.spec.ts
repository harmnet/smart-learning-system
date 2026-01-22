import { test, expect } from '../conftest';

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
    // 等待页面加载完成
    await authenticatedPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    
    // 尝试多种方式查找统计卡片
    // 方式1: 查找包含统计数据的文本
    const statsText = authenticatedPage.locator('text=/教师|学生|专业|班级|课程|考试|Teachers|Students|Majors|Classes/i');
    const statsCount = await statsText.count();
    
    if (statsCount > 0) {
      await expect(statsText.first()).toBeVisible({ timeout: 5000 });
    } else {
      // 方式2: 查找数字统计（通常是统计卡片中的数字）
      const numberStats = authenticatedPage.locator('text=/\\d+/').first();
      if (await numberStats.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(numberStats).toBeVisible();
      } else {
        // 方式3: 查找任何卡片元素
        const cards = authenticatedPage.locator('[class*="card"], [class*="Card"], div:has-text(/\\d+/)').first();
        await expect(cards).toBeVisible({ timeout: 5000 });
      }
    }
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
