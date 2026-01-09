import apiClient from '@/lib/api-client';

export interface ExamPaper {
  id: number;
  teacher_id: number;
  teacher_name: string;
  paper_name: string;
  duration_minutes: number;
  min_submit_minutes: number;
  composition_mode: string; // manual, auto
  total_score: number;
  question_order: string; // fixed, random
  option_order: string; // fixed, random
  knowledge_point: string; // 关联的知识点名称
  question_count?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamPaperQuestion {
  id: number;
  question_id: number;
  question_type: string;
  title: string;
  title_image?: string;
  knowledge_point?: string;
  answer?: string;
  answer_image?: string;
  explanation?: string;
  explanation_image?: string;
  difficulty: number;
  score: number;
  sort_order: number;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: number;
  option_text: string;
  option_image?: string;
  is_correct: boolean;
}

export interface ExamPaperDetail extends ExamPaper {
  questions: ExamPaperQuestion[];
}

export interface ExamPaperCreate {
  paper_name: string;
  duration_minutes: number;
  min_submit_minutes: number;
  composition_mode: string;
  total_score: number;
  question_order: string;
  option_order: string;
  knowledge_point: string; // 关联的知识点名称(必填)
}

export interface ExamPaperUpdate {
  paper_name?: string;
  duration_minutes?: number;
  min_submit_minutes?: number;
  composition_mode?: string;
  total_score?: number;
  question_order?: string;
  option_order?: string;
  knowledge_point?: string;
}

export interface ExamPaperQuestionAdd {
  question_id: number;
  score: number;
}

export interface ExamPaperQuestionUpdate {
  score?: number;
  sort_order?: number;
}

export interface AutoCompositionConfig {
  question_type: string;
  count: number;
  score_per_question: number;
}

export interface QuestionTypeConfig {
  question_type: string;
  count: number;
  score_per_question: number;
}

export interface AIAssembleConfig {
  question_configs: QuestionTypeConfig[];
}

export interface AIAssembleQuestionItem {
  question_id: number;
  score: number;
}

export interface AIAssembleConfirm {
  questions: AIAssembleQuestionItem[];
}

export interface AIAssembleResult {
  message: string;
  questions: ExamPaperQuestion[];
  total_score: number;
}

class ExamPaperService {
  /**
   * 获取试卷列表
   */
  async getAll(
    teacherId: number,
    skip: number = 0,
    limit: number = 100,
    search?: string
  ): Promise<ExamPaper[]> {
    const params: any = { teacher_id: teacherId, skip, limit };
    if (search) params.search = search;
    
    const response = await apiClient.get<ExamPaper[]>('/teacher/exam-papers/', { params });
    return response.data;
  }

  /**
   * 获取试卷详情
   */
  async getById(paperId: number, teacherId: number): Promise<ExamPaperDetail> {
    const response = await apiClient.get<ExamPaperDetail>(
      `/teacher/exam-papers/${paperId}?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * 创建试卷
   */
  async create(teacherId: number, data: ExamPaperCreate): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exam-papers/?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 更新试卷
   */
  async update(paperId: number, teacherId: number, data: ExamPaperUpdate): Promise<any> {
    const response = await apiClient.put(
      `/teacher/exam-papers/${paperId}?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 删除试卷
   */
  async delete(paperId: number, teacherId: number): Promise<void> {
    await apiClient.delete(`/teacher/exam-papers/${paperId}?teacher_id=${teacherId}`);
  }

  /**
   * 添加题目到试卷（手工组卷）
   */
  async addQuestion(
    paperId: number,
    teacherId: number,
    data: ExamPaperQuestionAdd
  ): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exam-papers/${paperId}/questions?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 更新试卷中的题目
   */
  async updateQuestion(
    paperId: number,
    epqId: number,
    teacherId: number,
    data: ExamPaperQuestionUpdate
  ): Promise<any> {
    const response = await apiClient.put(
      `/teacher/exam-papers/${paperId}/questions/${epqId}?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 从试卷中移除题目
   */
  async removeQuestion(paperId: number, epqId: number, teacherId: number): Promise<void> {
    await apiClient.delete(
      `/teacher/exam-papers/${paperId}/questions/${epqId}?teacher_id=${teacherId}`
    );
  }

  /**
   * 智能组卷
   */
  async autoCompose(
    paperId: number,
    teacherId: number,
    configs: AutoCompositionConfig[]
  ): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exam-papers/${paperId}/auto-compose?teacher_id=${teacherId}`,
      configs
    );
    return response.data;
  }

  /**
   * 清空试卷所有试题
   */
  async clearAllQuestions(paperId: number, teacherId: number): Promise<any> {
    const response = await apiClient.delete(
      `/teacher/exam-papers/${paperId}/questions/clear?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * AI一键组卷(预览)
   */
  async aiAssemble(
    paperId: number,
    teacherId: number,
    config: AIAssembleConfig
  ): Promise<AIAssembleResult> {
    const response = await apiClient.post<AIAssembleResult>(
      `/teacher/exam-papers/${paperId}/ai-assemble?teacher_id=${teacherId}`,
      config
    );
    return response.data;
  }

  /**
   * 确认AI组卷结果并添加到试卷
   */
  async confirmAIAssemble(
    paperId: number,
    teacherId: number,
    confirmData: AIAssembleConfirm
  ): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exam-papers/${paperId}/ai-assemble/confirm?teacher_id=${teacherId}`,
      confirmData
    );
    return response.data;
  }
}

export const examPaperService = new ExamPaperService();
export default examPaperService;

