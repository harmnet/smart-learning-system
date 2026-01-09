import apiClient from '@/lib/api-client';
import { courseCoverService } from './courseCover.service';

export interface CourseTeacher {
  id: number;
  name: string;
  username: string;
}

export interface Course {
  id: number;
  name: string;
  title?: string;  // 后端返回的字段
  code?: string;
  description?: string;
  credits?: number;
  course_type?: string;  // 保留字段，用于兼容
  course_category?: string;  // 课程类型：general、professional_basic、professional_core、expansion、elective_course
  enrollment_type?: string;  // 选课类型：required、elective、retake
  hours?: number;
  introduction?: string;  // 课程简介
  objectives?: string;  // 授课目标
  is_public?: boolean;
  is_deleted?: boolean;  // 逻辑删除标记
  major_id?: number;
  major_name?: string;
  cover_image?: string;
  cover_id?: number;  // 封面图片ID，用于构建URL
  teachers?: CourseTeacher[];
  main_teacher_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CourseWithProgress extends Course {
  progress?: number;
  total_chapters?: number;
  completed_chapters?: number;
}

class CourseService {
  /**
   * 获取课程列表
   */
  async getAll(
    skip: number = 0,
    limit: number = 100,
    search?: string,
    teacherId?: number,
    includeDeleted: boolean = false
  ): Promise<Course[]> {
    const params: any = { skip, limit };
    if (search) params.search = search;
    if (teacherId) params.teacher_id = teacherId;
    if (includeDeleted) params.include_deleted = includeDeleted;
    
    const response = await apiClient.get<Course[]>('/courses/', { params });
    return response.data;
  }

  /**
   * 获取课程详情
   */
  async getById(id: number): Promise<Course> {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  }

  /**
   * 创建课程
   */
  async create(data: {
    name: string;
    code?: string;
    description?: string;
    credits?: number;
    course_type?: string;
    course_category?: string;
    enrollment_type?: string;
    hours?: number;
    introduction?: string;
    objectives?: string;
    main_teacher_id?: number;
    is_public?: boolean;
    cover_id?: number;
  }): Promise<any> {
    const { cover_id, ...courseData } = data;
    const params: any = {};
    if (cover_id) {
      params.cover_id = cover_id;
    }
    const response = await apiClient.post('/courses/', courseData, { params });
    return response.data;
  }

  /**
   * 更新课程
   */
  async update(id: number, data: {
    name?: string;
    code?: string;
    description?: string;
    credits?: number;
    course_type?: string;
    course_category?: string;
    enrollment_type?: string;
    hours?: number;
    introduction?: string;
    objectives?: string;
    main_teacher_id?: number;
    is_public?: boolean;
    cover_id?: number;
  }): Promise<any> {
    const { cover_id, ...courseData } = data;
    const params: any = {};
    if (cover_id) {
      params.cover_id = cover_id;
    }
    const response = await apiClient.put(`/courses/${id}`, courseData, { params });
    return response.data;
  }

  /**
   * 删除课程（逻辑删除）
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/courses/${id}`);
  }

  /**
   * 恢复已删除的课程
   */
  async restore(id: number): Promise<void> {
    await apiClient.put(`/courses/${id}/restore`);
  }

  /**
   * 关联班级到课程
   */
  async linkClasses(courseId: number, classIds: number[]): Promise<any> {
    const response = await apiClient.post(`/courses/${courseId}/link-classes`, {
      class_ids: classIds
    });
    return response.data;
  }

  /**
   * 获取课程关联的班级列表
   */
  async getCourseClasses(courseId: number): Promise<any[]> {
    const response = await apiClient.get(`/courses/${courseId}/classes`);
    return response.data;
  }

  /**
   * 获取课程封面URL
   */
  getCoverUrl(coverImage?: string, coverId?: number): string {
    // 如果有coverId，优先使用ID访问
    if (coverId) {
      return courseCoverService.getImageUrl(coverId);
    }
    
    // 否则使用文件名（如果后端支持）
    if (coverImage) {
      if (coverImage.startsWith('http')) {
        return coverImage;
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
      return `${apiBase}/course-covers/file/${encodeURIComponent(coverImage)}`;
    }
    
    // 返回 SVG 占位图
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3E课程封面%3C/text%3E%3C/svg%3E';
  }
}

export const courseService = new CourseService();
export default courseService;
