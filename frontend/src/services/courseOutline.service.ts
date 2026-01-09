import apiClient from '@/lib/api-client';

// ========== Types ==========

export interface Chapter {
  id: number;
  title: string;
  sort_order: number;
  parent_id?: number | null;
}

export interface ChapterData {
  title: string;
  sort_order?: number;
  parent_id?: number | null;
}

export interface ChapterOrder {
  id: number;
  sort_order: number;
}

export interface LearningRule {
  rule_type: 'none' | 'completion' | 'exam';
  completion_percentage?: number | null;
  target_chapter_id?: number | null;
}

export interface KnowledgeGraphLink {
  knowledge_graph_id: number;
  knowledge_node_id?: number | null;
}

export interface CoursePreview {
  course: {
    id: number;
    title: string;
    cover_url?: string;
    course_category?: string;
    enrollment_type?: string;
    credits?: number;
    introduction?: string;
    objectives?: string;
    teacher?: {
      id: number;
      name: string;
      email: string;
    };
    major?: {
      id: number;
      name: string;
    };
  };
  outline: ChapterPreview[];
}

export interface ChapterPreview {
  id: number;
  title: string;
  sort_order: number;
  learning_rule: LearningRule;
  knowledge_graph?: {
    graph_id: number;
    graph_name?: string;
    node_id?: number;
    node_name?: string;
  } | null;
  exam_papers: Array<{
    id: number;
    exam_paper_name?: string;
  }>;
  sections: SectionPreview[];
}

export interface SectionPreview {
  id: number;
  title: string;
  sort_order: number;
  learning_rule: LearningRule;
  knowledge_graph?: {
    graph_id: number;
    graph_name?: string;
    node_id?: number;
    node_name?: string;
  } | null;
  resources: Array<{
    id: number;
    resource_type: string;
    resource_id: number;
    sort_order: number;
  }>;
  exam_papers: Array<{
    id: number;
    exam_paper_name?: string;
  }>;
}

export interface CourseOutline {
  course_id: number;
  outline: OutlineChapter[];
}

export interface OutlineChapter {
  id: number;
  title: string;
  sort_order: number;
  sections: OutlineSection[];
  exam_papers: Array<{ id: number }>;
}

export interface OutlineSection {
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

// ========== Service Class ==========

class CourseOutlineService {
  // ========== 章节管理 ==========

  /**
   * 获取课程大纲
   */
  async getOutline(courseId: number): Promise<CourseOutline> {
    const response = await apiClient.get<CourseOutline>(`/course-outline/courses/${courseId}/outline`);
    return response.data;
  }

  /**
   * 创建章或小节
   */
  async createChapter(courseId: number, data: ChapterData): Promise<Chapter> {
    const response = await apiClient.post<Chapter>(`/course-outline/courses/${courseId}/chapters`, data);
    return response.data;
  }

  /**
   * 更新章节
   */
  async updateChapter(chapterId: number, data: Partial<ChapterData>): Promise<Chapter> {
    const response = await apiClient.put<Chapter>(`/course-outline/chapters/${chapterId}`, data);
    return response.data;
  }

  /**
   * 删除章节
   */
  async deleteChapter(chapterId: number): Promise<void> {
    await apiClient.delete(`/course-outline/chapters/${chapterId}`);
  }

  /**
   * 调整章节顺序
   */
  async reorderChapters(courseId: number, orders: ChapterOrder[]): Promise<void> {
    await apiClient.put(`/course-outline/courses/${courseId}/chapters/reorder`, {
      chapters: orders
    });
  }

  // ========== 学习规则 ==========

  /**
   * 设置章节的学习规则
   */
  async setLearningRule(chapterId: number, rule: LearningRule): Promise<void> {
    await apiClient.post(`/course-outline/chapters/${chapterId}/learning-rule`, rule);
  }

  /**
   * 获取章节的学习规则
   */
  async getLearningRule(chapterId: number): Promise<LearningRule> {
    const response = await apiClient.get<LearningRule>(`/course-outline/chapters/${chapterId}/learning-rule`);
    return response.data;
  }

  // ========== 知识图谱关联 ==========

  /**
   * 关联知识图谱到章节
   */
  async linkKnowledgeGraph(chapterId: number, data: KnowledgeGraphLink): Promise<void> {
    await apiClient.post(`/course-outline/chapters/${chapterId}/knowledge-graph`, data);
  }

  /**
   * 取消章节的知识图谱关联
   */
  async unlinkKnowledgeGraph(chapterId: number): Promise<void> {
    await apiClient.delete(`/course-outline/chapters/${chapterId}/knowledge-graph`);
  }

  /**
   * 获取章节关联的知识图谱
   */
  async getChapterKnowledgeGraph(chapterId: number): Promise<any> {
    const response = await apiClient.get(`/course-outline/chapters/${chapterId}/knowledge-graph`);
    return response.data;
  }

  // ========== 考试关联 ==========

  /**
   * 关联考试到章节
   */
  async linkExam(chapterId: number, examPaperId: number): Promise<void> {
    await apiClient.post(`/course-outline/chapters/${chapterId}/exam-papers`, {
      exam_paper_id: examPaperId
    });
  }

  /**
   * 取消考试关联
   */
  async unlinkExam(chapterId: number, examPaperId: number): Promise<void> {
    await apiClient.delete(`/course-outline/chapters/${chapterId}/exam-papers/${examPaperId}`);
  }

  // ========== 教学资源关联 ==========

  /**
   * 关联教学资源到章节（小节）
   */
  async linkResources(chapterId: number, resourceType: string, resourceId: number, sortOrder: number = 0): Promise<void> {
    await apiClient.post(`/course-outline/chapters/${chapterId}/resources`, {
      resource_type: resourceType,
      resource_id: resourceId,
      sort_order: sortOrder
    });
  }

  /**
   * 取消教学资源关联
   */
  async unlinkResource(chapterId: number, resourceId: number): Promise<void> {
    await apiClient.delete(`/course-outline/chapters/${chapterId}/resources/${resourceId}`);
  }

  // ========== 课程预览 ==========

  /**
   * 获取课程预览信息
   */
  async getCoursePreview(courseId: number): Promise<CoursePreview> {
    const response = await apiClient.get<CoursePreview>(`/course-outline/courses/${courseId}/preview`);
    return response.data;
  }
}

export const courseOutlineService = new CourseOutlineService();
export default courseOutlineService;
