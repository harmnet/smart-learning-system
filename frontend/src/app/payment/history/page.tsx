"use client";

import { useState } from 'react';
import Link from 'next/link';

interface PaymentRecord {
  id: string;
  major: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  method: string;
  date: string;
}

export default function PaymentHistoryPage() {
  const [records] = useState<PaymentRecord[]>([
    { id: 'ORD202411270001', major: '计算机科学与技术', amount: 20800, status: 'success', method: '微信支付', date: '2024-11-27' },
    { id: 'ORD202410150001', major: '计算机科学与技术', amount: 5200, status: 'success', method: '支付宝', date: '2024-10-15' },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">支付成功</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold">处理中</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">支付失败</span>;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Smart Learning</span>
            </Link>

            <Link href="/dashboard" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30">
              返回学习
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">缴费记录</h1>
          <p className="text-neutral-600">查看你的所有缴费记录和订单状态</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="text-sm mb-2 text-blue-100">累计缴费</div>
            <div className="text-3xl font-bold">¥{records.reduce((sum, r) => r.status === 'success' ? sum + r.amount : sum, 0).toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <div className="text-sm mb-2 text-neutral-600">成功订单</div>
            <div className="text-3xl font-bold text-neutral-900">{records.filter(r => r.status === 'success').length}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <div className="text-sm mb-2 text-neutral-600">最近缴费</div>
            <div className="text-lg font-bold text-neutral-900">{records[0]?.date || '-'}</div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">订单号</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">专业</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">金额</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">支付方式</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">状态</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">日期</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-neutral-600">{record.id}</td>
                    <td className="px-6 py-4 text-sm text-neutral-900">{record.major}</td>
                    <td className="px-6 py-4 text-sm font-bold text-neutral-900">¥{record.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{record.method}</td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600">{record.date}</td>
                    <td className="px-6 py-4">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

