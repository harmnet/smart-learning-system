'use client';

import React, { useEffect, useState } from 'react';
import Modal from '@/components/common/Modal';
import { examService, ExamStatistics } from '@/services/exam.service';
import { decodeUnicode } from '@/utils/unicode';

interface ExamMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number | null;
  teacherId: number;
}

export default function ExamMonitorModal({
  isOpen,
  onClose,
  examId,
  teacherId
}: ExamMonitorModalProps) {
  const [statistics, setStatistics] = useState<ExamStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [examStatus, setExamStatus] = useState<'not_started' | 'in_progress' | 'ended'>('not_started');

  // 加载统计数据
  const loadStatistics = async () => {
    if (!examId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await examService.getStatistics(examId, teacherId);
      setStatistics(data);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
      setError('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算倒计时
  const calculateCountdown = () => {
    if (!statistics) return;

    const now = new Date();
    const startTime = new Date(statistics.start_time || '');
    const endTime = new Date(statistics.end_time || '');

    if (now < startTime) {
      // 未开始
      setExamStatus('not_started');
      const diff = startTime.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setCountdown(`距离开始: ${days}天 ${hours}小时 ${minutes}分钟`);
      } else if (hours > 0) {
        setCountdown(`距离开始: ${hours}小时 ${minutes}分钟 ${seconds}秒`);
      } else {
        setCountdown(`距离开始: ${minutes}分钟 ${seconds}秒`);
      }
    } else if (now >= startTime && now <= endTime) {
      // 进行中
      setExamStatus('in_progress');
      const diff = endTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setCountdown(`剩余时间: ${hours}小时 ${minutes}分钟 ${seconds}秒`);
      } else {
        setCountdown(`剩余时间: ${minutes}分钟 ${seconds}秒`);
      }
    } else {
      // 已结束
      setExamStatus('ended');
      setCountdown('考试已结束');
    }
  };

  // 初始加载
  useEffect(() => {
    if (isOpen && examId) {
      loadStatistics();
    }
  }, [isOpen, examId]);

  // 定时刷新统计数据（每10秒）
  useEffect(() => {
    if (!isOpen || !examId) return;

    const interval = setInterval(() => {
      loadStatistics();
    }, 10000); // 10秒刷新一次

    return () => clearInterval(interval);
  }, [isOpen, examId]);

  // 倒计时更新（每秒）
  useEffect(() => {
    if (!statistics) return;

    calculateCountdown();
    const interval = setInterval(() => {
      calculateCountdown();
    }, 1000);

    return () => clearInterval(interval);
  }, [statistics]);

  // 获取状态徽章样式
  const getStatusBadgeClass = () => {
    switch (examStatus) {
      case 'not_started':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = () => {
    switch (examStatus) {
      case 'not_started':
        return '未开始';
      case 'in_progress':
        return '进行中';
      case 'ended':
        return '已结束';
      default:
        return '未知';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="考试实时监控"
      size="lg"
    >
      <div className="p-6">
        {loading && !statistics ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">加载中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadStatistics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              重试
            </button>
          </div>
        ) : statistics ? (
          <div className="space-y-6">
            {/* 基础信息 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">{decodeUnicode(statistics.exam_name)}</h3>
                <span className={`px-4 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass()}`}>
                  {getStatusText()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">关联试卷:</span>
                  <span className="ml-2 font-medium text-slate-900">{statistics.exam_paper_name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-600">考试日期:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {statistics.exam_date ? new Date(statistics.exam_date).toLocaleDateString('zh-CN') : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">开始时间:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {statistics.start_time ? new Date(statistics.start_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">结束时间:</span>
                  <span className="ml-2 font-medium text-slate-900">
                    {statistics.end_time ? new Date(statistics.end_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* 倒计时 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 text-center">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                {countdown}
              </div>
            </div>

            {/* 考生统计 */}
            <div className="grid grid-cols-4 gap-4">
              {/* 总人数 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {statistics.total_students}
                </div>
                <div className="text-sm text-slate-600">总人数</div>
              </div>

              {/* 待考试 */}
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                <div className="text-3xl font-bold text-yellow-700 mb-1">
                  {statistics.pending_count}
                </div>
                <div className="text-sm text-yellow-700">待考试</div>
              </div>

              {/* 考试中 */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200 text-center">
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {statistics.in_progress_count}
                </div>
                <div className="text-sm text-green-700">考试中</div>
              </div>

              {/* 已提交 */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-center">
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {statistics.submitted_count}
                </div>
                <div className="text-sm text-blue-700">已提交</div>
              </div>
            </div>

            {/* 考试规则 */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-sm font-medium text-slate-900 mb-3">考试规则</h4>
              <div className="grid grid-cols-3 gap-4 text-xs text-slate-600">
                <div>
                  <span className="block font-medium text-slate-700">提前登录</span>
                  <span className="text-blue-600">{statistics.early_login_minutes} 分钟</span>
                </div>
                <div>
                  <span className="block font-medium text-slate-700">禁止迟到</span>
                  <span className="text-red-600">{statistics.late_forbidden_minutes} 分钟</span>
                </div>
                <div>
                  <span className="block font-medium text-slate-700">最早交卷</span>
                  <span className="text-green-600">{statistics.minimum_submission_minutes} 分钟</span>
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>数据每10秒自动刷新</span>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

