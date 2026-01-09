import apiClient from '@/lib/api-client';

export interface DashboardStatistics {
  teachers_count: number;
  students_count: number;
  majors_count: number;
  classes_count: number;
  courses_count: number;
  exams_count: number;
  active_users_today: number;
  active_users_week: number;
  new_users_trend: Array<{ date: string; count: number }>;
  user_activity_trend: Array<{ date: string; count: number }>;
  system_health: {
    database_status: 'healthy' | 'warning' | 'error';
    api_status: 'healthy' | 'warning' | 'error';
    storage_usage: number; // percentage
  };
}

class AdminDashboardService {
  /**
   * 获取Dashboard统计数据
   */
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    const response = await apiClient.get<DashboardStatistics>('/admin/dashboard/statistics');
    return response.data;
  }
}

export const adminDashboardService = new AdminDashboardService();
export default adminDashboardService;

