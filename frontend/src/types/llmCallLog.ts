// LLM调用记录相关类型定义

// 功能类型枚举
export type LLMCallLogFunctionType =
  | 'ai_grade_homework'
  | 'ai_generate_knowledge_graph'
  | 'ai_create_resource'
  | 'ai_generate_question'
  | 'learning_profile_assessment'
  | 'personalized_learning'
  | 'ai_quiz';

// 状态枚举
export type LLMCallLogStatus = 'success' | 'failed';

// 列表项类型
export interface LLMCallLogListItem {
  id: number;
  function_type: LLMCallLogFunctionType;
  user_id: number;
  user_name: string | null;
  user_role: string;
  llm_config_id: number | null;
  llm_config_name: string | null;
  result_summary: string | null;
  execution_time_ms: number | null;
  status: LLMCallLogStatus;
  created_at: string;
}

// 详情类型
export interface LLMCallLogDetail {
  id: number;
  function_type: LLMCallLogFunctionType;
  user_id: number;
  user_name: string | null;
  user_role: string;
  llm_config_id: number | null;
  llm_config_name: string | null;
  prompt: string;
  result: string | null;
  execution_time_ms: number | null;
  status: LLMCallLogStatus;
  error_message: string | null;
  related_id: number | null;
  related_type: string | null;
  created_at: string;
}

// 列表响应类型
export interface LLMCallLogListResponse {
  items: LLMCallLogListItem[];
  total: number;
  skip: number;
  limit: number;
}

// 功能类型显示名称映射
export const FUNCTION_TYPE_NAMES: Record<LLMCallLogFunctionType, string> = {
  ai_grade_homework: 'AI批改作业',
  ai_generate_knowledge_graph: 'AI生成知识图谱',
  ai_create_resource: 'AI创作教学资源',
  ai_generate_question: 'AI出题',
  learning_profile_assessment: '学习偏好测评',
  personalized_learning: '个性化学习',
  ai_quiz: 'AI测评',
};
