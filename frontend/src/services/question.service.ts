import apiClient from '@/lib/api-client';

export interface QuestionOption {
  id?: number;
  option_label: string;
  option_text: string;
  option_image?: string;
  is_correct: boolean;
  sort_order?: number;
}

export interface Question {
  id: number;
  teacher_id: number;
  question_type: string;
  title: string;
  title_image?: string;
  knowledge_point?: string;
  answer?: string;
  answer_image?: string;
  explanation?: string;
  explanation_image?: string;
  difficulty: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

export interface QuestionStats {
  total: number;
  by_type: {
    single_choice: number;
    multiple_choice: number;
    true_false: number;
    fill_blank: number;
    qa: number;
    short_answer: number;
  };
}

export interface QuestionCreate {
  question_type: string;
  title: string;
  knowledge_point?: string;
  answer?: string;
  explanation?: string;
  difficulty?: number;
  options?: QuestionOption[];
}

class QuestionService {
  /**
   * 获取题库统计
   */
  async getStats(teacherId: number): Promise<QuestionStats> {
    const response = await apiClient.get<QuestionStats>(`/teacher/questions/stats?teacher_id=${teacherId}`);
    return response.data;
  }

  /**
   * 获取题目列表（支持分页）
   */
  async getAll(
    teacherId: number,
    skip: number = 0,
    limit: number = 20,
    questionType?: string,
    knowledgePoint?: string,
    search?: string
  ): Promise<{ questions: Question[]; total: number }> {
    const params: any = { teacher_id: teacherId, skip, limit };
    if (questionType) params.question_type = questionType;
    if (knowledgePoint) params.knowledge_point = knowledgePoint;
    if (search) params.search = search;
    
    const response = await apiClient.get<{ questions: Question[]; total: number }>('/teacher/questions/', { params });
    return response.data;
  }

  /**
   * 获取单个题目
   */
  async getOne(questionId: number, teacherId: number): Promise<Question> {
    const response = await apiClient.get<Question>(`/teacher/questions/${questionId}?teacher_id=${teacherId}`);
    return response.data;
  }

  /**
   * 创建题目
   */
  async create(
    teacherId: number,
    data: QuestionCreate,
    titleImage?: File,
    answerImage?: File,
    explanationImage?: File
  ): Promise<any> {
    const formData = new FormData();
    formData.append('teacher_id', teacherId.toString());
    formData.append('question_type', data.question_type);
    formData.append('title', data.title);
    
    // 可选字段
    if (data.knowledge_point) {
      formData.append('knowledge_point', data.knowledge_point);
    }
    if (data.answer) {
      formData.append('answer', data.answer);
    }
    if (data.explanation) {
      formData.append('explanation', data.explanation);
    }
    if (data.difficulty !== undefined) {
      formData.append('difficulty', data.difficulty.toString());
    } else {
      formData.append('difficulty', '1'); // 默认值
    }
    
    // 处理选项（单选和多选）
    if (data.options && data.options.length > 0) {
      formData.append('options', JSON.stringify(data.options));
    }
    
    // 图片文件
    if (titleImage) formData.append('title_image', titleImage);
    if (answerImage) formData.append('answer_image', answerImage);
    if (explanationImage) formData.append('explanation_image', explanationImage);
    
    // 调试：打印FormData内容
    console.log('📤 [创建题目] 发送的数据:');
    console.log('  teacher_id:', teacherId);
    console.log('  question_type:', data.question_type);
    console.log('  title:', data.title);
    console.log('  knowledge_point:', data.knowledge_point);
    console.log('  answer:', data.answer);
    console.log('  explanation:', data.explanation);
    console.log('  difficulty:', data.difficulty);
    console.log('  options:', data.options);
    
    const response = await apiClient.post('/teacher/questions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * 更新题目
   */
  async update(
    questionId: number,
    teacherId: number,
    data: Partial<QuestionCreate>,
    titleImage?: File,
    answerImage?: File,
    explanationImage?: File
  ): Promise<any> {
    const formData = new FormData();
    formData.append('teacher_id', teacherId.toString());
    if (data.question_type) formData.append('question_type', data.question_type);
    if (data.title) formData.append('title', data.title);
    if (data.knowledge_point !== undefined) formData.append('knowledge_point', data.knowledge_point || '');
    if (data.answer !== undefined) formData.append('answer', data.answer || '');
    if (data.explanation !== undefined) formData.append('explanation', data.explanation || '');
    if (data.difficulty !== undefined) formData.append('difficulty', data.difficulty.toString());
    
    if (data.options && data.options.length > 0) {
      formData.append('options', JSON.stringify(data.options));
    }
    
    if (titleImage) formData.append('title_image', titleImage);
    if (answerImage) formData.append('answer_image', answerImage);
    if (explanationImage) formData.append('explanation_image', explanationImage);
    
    const response = await apiClient.put(`/teacher/questions/${questionId}`, formData);
    return response.data;
  }

  /**
   * 删除题目
   */
  async delete(questionId: number, teacherId: number): Promise<void> {
    await apiClient.delete(`/teacher/questions/${questionId}?teacher_id=${teacherId}`);
  }

  /**
   * 上传题目图片
   */
  async uploadImage(
    teacherId: number,
    file: File,
    imageType: 'title' | 'answer' | 'explanation' | 'option'
  ): Promise<{ image_path: string; image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacher_id', teacherId.toString());
    formData.append('image_type', imageType);
    
    const response = await apiClient.post('/teacher/questions/upload-image', formData);
    return response.data;
  }

  /**
   * 获取图片URL
   */
  getImageUrl(filename: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
    return `${apiBase}/teacher/questions/image/${filename}`;
  }

  /**
   * 导出所有题目
   */
  async exportQuestions(teacherId: number): Promise<Blob> {
    const response = await apiClient.get('/teacher/questions/export', {
      params: { teacher_id: teacherId },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * 下载导入模板
   */
  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/teacher/questions/template', {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * 批量导入题目
   */
  async importQuestions(teacherId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacher_id', teacherId.toString());
    
    const response = await apiClient.post('/teacher/questions/import', formData);
    return response.data;
  }

  /**
   * AI生成题目
   */
  async aiGenerateQuestion(
    knowledgePoint: string,
    questionType: string,
    additionalPrompt?: string,
    resourceId?: number
  ): Promise<{ success: boolean; question?: any; error?: string }> {
    const response = await apiClient.post('/teacher/questions/ai-generate', {
      knowledge_point: knowledgePoint,
      question_type: questionType,
      additional_prompt: additionalPrompt || '',
      resource_id: resourceId || null,
    });
    return response.data;
  }
}

export const questionService = new QuestionService();
export default questionService;

