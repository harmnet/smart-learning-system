import apiClient from '../lib/api-client';
import {
  LLMCallLogListItem,
  LLMCallLogDetail,
  LLMCallLogListResponse,
} from '../types/llmCallLog';

export interface GetLLMCallLogsParams {
  skip?: number;
  limit?: number;
  function_type?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
}

class LLMCallLogService {
  private baseUrl = '/admin/llm-call-logs';

  /**
   * 获取LLM调用记录列表
   */
  async getLLMCallLogs(params?: GetLLMCallLogsParams): Promise<LLMCallLogListResponse> {
    const response = await apiClient.get<LLMCallLogListResponse>(this.baseUrl, {
      params,
    });
    return response.data;
  }

  /**
   * 获取LLM调用记录详情
   */
  async getLLMCallLogDetail(logId: number): Promise<LLMCallLogDetail> {
    const response = await apiClient.get<LLMCallLogDetail>(`${this.baseUrl}/${logId}`);
    return response.data;
  }
}

export const llmCallLogService = new LLMCallLogService();
