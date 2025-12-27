"use client";

import { useState, useEffect } from 'react';
import { adminService, Order, FinanceStats } from '@/services/admin.service';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminFinancePage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'refunded'>('all');
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, statsData] = await Promise.all([
        adminService.getOrders(),
        adminService.getFinanceStats()
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
      case 'paid':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">{t.admin.finance.status.paid}</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">{t.admin.finance.status.pending}</span>;
      case 'refunded':
        return <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-bold border border-rose-100">{t.admin.finance.status.refunded}</span>;
      default:
        return <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold border border-slate-100">{status}</span>;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.finance.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.finance.subtitle}</p>
        </div>
        <button className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-full font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          {t.common.export}
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-50 rounded-3xl p-6 border border-transparent animate-pulse h-32"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform">
            <div className="text-blue-100 text-sm font-bold mb-1">{t.admin.finance.stats.revenue}</div>
            <div className="text-3xl font-black mb-2">¥{(stats?.paid_amount || 0).toLocaleString()}</div>
            <div className="text-xs font-bold text-blue-200 bg-white/10 inline-block px-2 py-1 rounded-lg">+12% vs last month</div>
          </div>
          
          {[
            { label: t.admin.finance.stats.pending, value: `¥${(stats?.pending_amount || 0).toLocaleString()}`, sub: `${stats?.pending_orders || 0} orders`, color: 'amber' },
            { label: t.admin.finance.stats.paidOrders, value: stats?.paid_orders || 0, sub: 'Completed', color: 'emerald' },
            { label: t.admin.finance.stats.totalOrders, value: stats?.total_orders || 0, sub: 'All time', color: 'slate' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-transparent hover:bg-blue-50/50 transition-colors group">
              <div className={`text-sm font-bold text-${stat.color}-600 uppercase tracking-wider mb-1`}>{stat.label}</div>
              <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400">{stat.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { label: t.common.all, value: 'all' as const },
          { label: t.admin.finance.status.paid, value: 'completed' as const },
          { label: t.admin.finance.status.pending, value: 'pending' as const },
          { label: t.admin.finance.status.refunded, value: 'refunded' as const },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
              filter === tab.value
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-500/20'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                {[
                  t.admin.finance.columns.orderNo,
                  t.admin.finance.columns.student,
                  t.admin.finance.columns.major,
                  t.admin.finance.columns.type,
                  t.admin.finance.columns.amount,
                  t.admin.finance.columns.method,
                  t.admin.finance.columns.date,
                  t.admin.finance.columns.status,
                  t.common.actions
                ].map((header, i) => (
                  <th key={i} className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400">{t.common.loading}</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400">{t.common.noData}</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 text-sm font-mono text-slate-400 font-bold">{order.order_number}</td>
                    <td className="px-8 py-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{order.student_name}</div>
                        <div className="text-xs font-bold text-slate-400">ID: {order.student_id}</div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-slate-600">{order.major_name}</td>
                    <td className="px-8 py-4 text-sm font-bold text-slate-400 uppercase tracking-wider text-xs">Tuition</td>
                    <td className="px-8 py-4 text-sm font-black text-slate-900">¥{order.amount.toLocaleString()}</td>
                    <td className="px-8 py-4 text-sm text-slate-500 font-medium">{order.payment_method || '-'}</td>
                    <td className="px-8 py-4 text-sm text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-8 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-8 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title={t.common.view}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
