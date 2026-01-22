'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Modal from '@/components/common/Modal';
import { llmCallLogService } from '@/services/llmCallLog.service';
import {
  LLMCallLogListItem,
  LLMCallLogDetail,
  FUNCTION_TYPE_NAMES,
} from '@/types/llmCallLog';

export default function LLMCallLogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LLMCallLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    function_type: '',
    user_id: '',
    start_date: '',
    end_date: '',
  });
  
  // 详情模态框
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LLMCallLogDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // 展开/折叠状态
  const [expandedPrompts, setExpandedPrompts] = useState<Set<number>>(new Set());
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadLogs();
  }, [skip, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        skip,
        limit,
      };
      
      if (filters.function_type) {
        params.function_type = filters.function_type;
      }
      if (filters.user_id) {
        params.user_id = parseInt(filters.user_id);
      }
      if (filters.start_date) {
        params.start_date = filters.start_date;
      }
      if (filters.end_date) {
        params.end_date = filters.end_date;
      }
      
      const response = await llmCallLogService.getLLMCallLogs(params);
      setLogs(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load LLM call logs:', error);
      alert('加载记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setSkip(0); // 重置到第一页
  };

  const handleResetFilters = () => {
    setFilters({
      function_type: '',
      user_id: '',
      start_date: '',
      end_date: '',
    });
    setSkip(0);
  };

  const handleViewDetail = async (logId: number) => {
    try {
      setLoadingDetail(true);
      const detail = await llmCallLogService.getLLMCallLogDetail(logId);
      setSelectedLog(detail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load log detail:', error);
      alert('加载详情失败');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('复制失败');
    }
  };

  const toggleExpand = (id: number, type: 'prompt' | 'result') => {
    if (type === 'prompt') {
      const newSet = new Set(expandedPrompts);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setExpandedPrompts(newSet);
    } else {
      const newSet = new Set(expandedResults);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setExpandedResults(newSet);
    }
  };

  const formatExecutionTime = (ms: number | null): string => {
    if (!ms) return '-';
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">LLM调用记录</h1>
          <p className="text-sm text-slate-500 mt-1">查看和管理所有LLM调用记录</p>
        </div>

        {/* Filters */}
        <div className="mb-4 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                功能类型
              </label>
              <select
                value={filters.function_type}
                onChange={(e) => handleFilterChange('function_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部</option>
                {Object.entries(FUNCTION_TYPE_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                用户ID
              </label>
              <input
                type="number"
                value={filters.user_id}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
                placeholder="输入用户ID"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              重置筛选
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    调用时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    功能类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    用户
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    LLM配置
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    结果摘要
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    执行时长
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleViewDetail(log.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {FUNCTION_TYPE_NAMES[log.function_type] || log.function_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <div>{log.user_name || `用户${log.user_id}`}</div>
                      <div className="text-xs text-slate-500">{log.user_role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {log.llm_config_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs">
                      <div className="truncate">
                        {log.result_summary || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {formatExecutionTime(log.execution_time_ms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(log.id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {logs.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                {t.common.noData}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              共 {total} 条记录，第 {currentPage} / {totalPages} 页
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSkip(Math.max(0, skip - limit))}
                disabled={skip === 0}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setSkip(skip + limit)}
                disabled={skip + limit >= total}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
          setExpandedPrompts(new Set());
          setExpandedResults(new Set());
        }}
        title="LLM调用记录详情"
        size="xl"
      >
        {loadingDetail ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-500">加载中...</p>
          </div>
        ) : selectedLog ? (
          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  调用时间
                </label>
                <div className="text-sm text-slate-900">
                  {formatDate(selectedLog.created_at)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  功能类型
                </label>
                <div className="text-sm text-slate-900">
                  {FUNCTION_TYPE_NAMES[selectedLog.function_type] || selectedLog.function_type}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  用户
                </label>
                <div className="text-sm text-slate-900">
                  {selectedLog.user_name || `用户${selectedLog.user_id}`} ({selectedLog.user_role})
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  LLM配置
                </label>
                <div className="text-sm text-slate-900">
                  {selectedLog.llm_config_name || '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  执行时长
                </label>
                <div className="text-sm text-slate-900">
                  {formatExecutionTime(selectedLog.execution_time_ms)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  状态
                </label>
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedLog.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selectedLog.status === 'success' ? '成功' : '失败'}
                </span>
              </div>
            </div>

            {/* 提示词 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  提示词
                </label>
                <button
                  onClick={() => handleCopy(selectedLog.prompt)}
                  className="text-xs text-blue-600 hover:text-blue-900"
                >
                  复制
                </button>
              </div>
              <div className="relative">
                <pre className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  {expandedPrompts.has(selectedLog.id) || selectedLog.prompt.length <= 500
                    ? selectedLog.prompt
                    : `${selectedLog.prompt.substring(0, 500)}...`}
                </pre>
                {selectedLog.prompt.length > 500 && (
                  <button
                    onClick={() => toggleExpand(selectedLog.id, 'prompt')}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-900"
                  >
                    {expandedPrompts.has(selectedLog.id) ? '收起' : '展开'}
                  </button>
                )}
              </div>
            </div>

            {/* 返回结果 */}
            {selectedLog.result && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    返回结果
                  </label>
                  <button
                    onClick={() => handleCopy(selectedLog.result || '')}
                    className="text-xs text-blue-600 hover:text-blue-900"
                  >
                    复制
                  </button>
                </div>
                <div className="relative">
                  <pre className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {expandedResults.has(selectedLog.id) || (selectedLog.result && selectedLog.result.length <= 500)
                      ? selectedLog.result
                      : `${selectedLog.result?.substring(0, 500)}...`}
                  </pre>
                  {selectedLog.result && selectedLog.result.length > 500 && (
                    <button
                      onClick={() => toggleExpand(selectedLog.id, 'result')}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-900"
                    >
                      {expandedResults.has(selectedLog.id) ? '收起' : '展开'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {selectedLog.error_message && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  错误信息
                </label>
                <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-800">
                  {selectedLog.error_message}
                </div>
              </div>
            )}

            {/* 关联信息 */}
            {(selectedLog.related_id || selectedLog.related_type) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  关联信息
                </label>
                <div className="text-sm text-slate-900">
                  {selectedLog.related_type && (
                    <span className="mr-4">类型: {selectedLog.related_type}</span>
                  )}
                  {selectedLog.related_id && (
                    <span>ID: {selectedLog.related_id}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
