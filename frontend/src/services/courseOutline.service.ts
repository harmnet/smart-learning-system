import apiClient from '@/lib/api-client';

export interface Chapter {
  id: number;
  title: string;
  sort_order: number;
  parent_id?: number;
  sections?: Section[];
  exam_papers?: Array<{ id: number }>;
}

export interface Section {
  id: number;
  title: string;
  sort_order: number;
  resources: Array<{
    id: number;
    resource_type: string;
    resource_id: number;
    sort_order: number;
  }>;
  exam_papers: Array<{ id: number }>;
  homeworks: Array<{
    id: number;
    title: string;
    description?: string;
    deadline?: string;
    sort_order: number;
  }>;
}

export interface CourseOutline {
  course_id: number;
  outline: Chapter[];
}

class CourseOutlineService {
  /**
   * 获取课程大纲
   */
  async getOutline(courseId: number): Promise<CourseOutline> {
    const response = await apiClient.get<CourseOutline>(`/teacher/courses/${courseId}/outline`);
    return response.data;
  }

  /**
   * 创建章或小节
   */
  async createChapter(
    courseId: number,
    data: { title: string; sort_order?: number; parent_id?: number }
  ): Promise<Chapter> {
    // 确保只发送必要的字段，移除任何可能的id字段
    const cleanData: { title: string; sort_order?: number; parent_id?: number } = {
      title: data.title,
    };
    if (data.sort_order !== undefined) {
      cleanData.sort_order = data.sort_order;
    }
    if (data.parent_id !== undefined && data.parent_id !== null) {
      cleanData.parent_id = data.parent_id;
    }
    const response = await apiClient.post<Chapter>(`/teacher/courses/${courseId}/chapters`, cleanData);
    return response.data;
  }

  /**
   * 更新章或小节
   */
  async updateChapter(chapterId: number, data: { title?: string; sort_order?: number }): Promise<Chapter> {
    const response = await apiClient.put<Chapter>(`/teacher/chapters/${chapterId}`, data);
    return response.data;
  }

  /**
   * 删除章或小节
   */
  async deleteChapter(chapterId: number): Promise<void> {
    await apiClient.delete(`/teacher/chapters/${chapterId}`);
  }

  /**
   * 为小节添加资源
   */
  async addSectionResource(
    chapterId: number,
    data: { resource_type: string; resource_id: number; sort_order?: number }
  ): Promise<any> {
    const response = await apiClient.post(`/teacher/chapters/${chapterId}/resources`, data);
    return response.data;
  }

  /**
   * 移除小节资源
   */
  async removeSectionResource(chapterId: number, resourceId: number): Promise<void> {
    await apiClient.delete(`/teacher/chapters/${chapterId}/resources/${resourceId}`);
  }

  /**
   * 关联试卷到章或小节
   */
  async linkExamPaper(chapterId: number, examPaperId: number): Promise<any> {
    const response = await apiClient.post(`/teacher/chapters/${chapterId}/exam-papers`, {
      exam_paper_id: examPaperId
    });
    return response.data;
  }

  /**
   * 取消关联试卷
   */
  async unlinkExamPaper(chapterId: number, examPaperId: number): Promise<void> {
    await apiClient.delete(`/teacher/chapters/${chapterId}/exam-papers/${examPaperId}`);
  }

  /**
   * 创建作业
   */
  async createHomework(
    chapterId: number,
    data: { title: string; description?: string; deadline?: string; sort_order?: number }
  ): Promise<any> {
    const response = await apiClient.post(`/teacher/chapters/${chapterId}/homeworks`, data);
    return response.data;
  }

  /**
   * 更新作业
   */
  async updateHomework(
    homeworkId: number,
    data: { title?: string; description?: string; deadline?: string; sort_order?: number }
  ): Promise<any> {
    const response = await apiClient.put(`/teacher/homeworks/${homeworkId}`, data);
    return response.data;
  }

  /**
   * 删除作业
   */
  async deleteHomework(homeworkId: number): Promise<void> {
    await apiClient.delete(`/teacher/homeworks/${homeworkId}`);
  }
}

export const courseOutlineService = new CourseOutlineService();
export default courseOutlineService;

