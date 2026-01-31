"use client";

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminService, EnrollmentDetail, EnrollmentListItem, EnrollmentStatus } from '@/services/admin.service';

type ActionType = 'approve' | 'reject' | 'view' | null;

export default function AdminEnrollmentsPage() {
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState<EnrollmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    phone: '',
    status: '',
    date_from: '',
    date_to: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<EnrollmentDetail | null>(null);

  const statusMap = useMemo(() => ({
    pending: {
      label: t.admin.enrollments.status.pending,
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    approved: {
      label: t.admin.enrollments.status.approved,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    rejected: {
      label: t.admin.enrollments.status.rejected,
      className: 'bg-rose-50 text-rose-700 border-rose-200'
    }
  }), [t]);

  const getAdminId = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.id || user.user_id || user.admin_id || null;
    } catch {
      return null;
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const getStatusLabel = (status?: EnrollmentStatus | string | null) => {
    if (!status) return '-';
    return statusMap[status as EnrollmentStatus]?.label || status;
  };

  const loadData = async (params = filters, page = pagination.current) => {
    try {
      setLoading(true);
      const skip = (page - 1) * pagination.pageSize;
      const response = await adminService.getEnrollments({
        skip,
        limit: pagination.pageSize,
        phone: params.phone || undefined,
        status: params.status || undefined,
        date_from: params.date_from || undefined,
        date_to: params.date_to || undefined
      });
      setEnrollments(response.items || []);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: response.total || 0
      }));
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData(filters, 1);
  };

  const handleReset = () => {
    const nextFilters = {
      phone: '',
      status: '',
      date_from: '',
      date_to: ''
    };
    setFilters(nextFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    loadData(nextFilters, 1);
  };

  const handleApprove = async (item: EnrollmentListItem) => {
    const adminId = getAdminId();
    if (!adminId) {
      alert(t.admin.enrollments.errors.adminIdMissing);
      return;
    }
    const confirmed = window.confirm(t.admin.enrollments.confirmations.approve);
    if (!confirmed) return;
    try {
      setActionLoadingId(item.id);
      setActionType('approve');
      const response = await adminService.approveEnrollment(item.id, adminId);
      setEnrollments((prev) => prev.map((current) => current.id === item.id ? { ...current, status: response.status } : current));
    } catch {
      alert(t.admin.enrollments.errors.actionFailed);
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const handleReject = async (item: EnrollmentListItem) => {
    const adminId = getAdminId();
    if (!adminId) {
      alert(t.admin.enrollments.errors.adminIdMissing);
      return;
    }
    const reason = window.prompt(t.admin.enrollments.confirmations.rejectReason);
    if (reason === null) return;
    try {
      setActionLoadingId(item.id);
      setActionType('reject');
      const response = await adminService.rejectEnrollment(item.id, adminId, reason || undefined);
      setEnrollments((prev) => prev.map((current) => current.id === item.id ? { ...current, status: response.status } : current));
    } catch {
      alert(t.admin.enrollments.errors.actionFailed);
    } finally {
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const handleView = async (item: EnrollmentListItem) => {
    try {
      setActionLoadingId(item.id);
      setActionType('view');
      setDetailOpen(true);
      setDetailLoading(true);
      setDetail(null);
      const data = await adminService.getEnrollmentDetail(item.id);
      setDetail(data);
    } catch {
      alert(t.admin.enrollments.errors.loadFailed);
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
      setActionLoadingId(null);
      setActionType(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.enrollments.title}</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.enrollments.subtitle}</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.enrollments.filters.phone}</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t.admin.enrollments.filters.phone}
              value={filters.phone}
              onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.enrollments.filters.status}</label>
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">{t.common.all}</option>
              <option value="pending">{t.admin.enrollments.status.pending}</option>
              <option value="approved">{t.admin.enrollments.status.approved}</option>
              <option value="rejected">{t.admin.enrollments.status.rejected}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.enrollments.filters.dateFrom}</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.enrollments.filters.dateTo}</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95"
            >
              {t.common.search}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-95"
            >
              {t.common.reset}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.enrollments.columns.id}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.enrollments.columns.phone}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.enrollments.columns.childName}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.enrollments.columns.programme}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.enrollments.columns.createdAt}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.enrollments.columns.status}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && enrollments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2a4 4 0 00-4-4H4a2 2 0 00-2 2v2m18 0v-2a4 4 0 00-4-4h-1a2 2 0 00-2 2v2m-5 4h8m-4-8a4 4 0 110-8 4 4 0 010 8z"></path>
                      </svg>
                      <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                    </div>
                  </td>
                </tr>
              )}
              {enrollments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{item.id}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-600">{item.phone}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-600">{item.child_name || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-600">{item.programme_interested || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(item.created_at)}</td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusMap[item.status]?.className || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleView(item)}
                        disabled={actionLoadingId === item.id && actionType === 'view'}
                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-60"
                      >
                        {t.admin.enrollments.actions.view}
                      </button>
                      <button
                        onClick={() => handleApprove(item)}
                        disabled={item.status === 'approved' || (actionLoadingId === item.id && actionType === 'approve')}
                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
                      >
                        {t.admin.enrollments.actions.approve}
                      </button>
                      <button
                        onClick={() => handleReject(item)}
                        disabled={item.status === 'rejected' || (actionLoadingId === item.id && actionType === 'reject')}
                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-60"
                      >
                        {t.admin.enrollments.actions.reject}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 text-sm text-slate-600">
          <div>
            {t.common.totalRecords} {pagination.total} {t.common.records}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              disabled={pagination.current <= 1}
              onClick={() => loadData(filters, pagination.current - 1)}
            >
              {t.common.previous}
            </button>
            <span className="px-3 py-1 text-xs font-bold text-slate-500">
              {pagination.current} / {totalPages}
            </span>
            <button
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              disabled={pagination.current >= totalPages}
              onClick={() => loadData(filters, pagination.current + 1)}
            >
              {t.common.next}
            </button>
          </div>
        </div>
      </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{t.admin.enrollments.detail.title}</h2>
              <button
                onClick={() => setDetailOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                {t.common.close}
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {detailLoading && (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
                </div>
              )}
              {!detailLoading && !detail && (
                <div className="text-center py-10 text-slate-500">{t.admin.enrollments.detail.empty}</div>
              )}
              {!detailLoading && detail && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.columns.id}</div>
                      <div className="text-sm font-semibold text-slate-900">{detail.id ?? '-'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.columns.phone}</div>
                      <div className="text-sm font-semibold text-slate-900">{detail.phone ?? '-'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.columns.childName}</div>
                      <div className="text-sm font-semibold text-slate-900">
                        {(detail.child_last_name_passport || '') + (detail.child_first_name || '') || detail.child_name || '-'}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.columns.programme}</div>
                      <div className="text-sm font-semibold text-slate-900">{detail.programme_interested || '-'}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.columns.createdAt}</div>
                      <div className="text-sm font-semibold text-slate-900">{formatDate(detail.created_at)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.columns.status}</div>
                      <div className="text-sm font-semibold text-slate-900">{getStatusLabel(detail.status)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.fields.approvedAt}</div>
                      <div className="text-sm font-semibold text-slate-900">{formatDate(detail.approved_at)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.fields.rejectedAt}</div>
                      <div className="text-sm font-semibold text-slate-900">{formatDate(detail.rejected_at)}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 md:col-span-2">
                      <div className="text-xs text-slate-400">{t.admin.enrollments.fields.rejectReason}</div>
                      <div className="text-sm font-semibold text-slate-900">{detail.reject_reason || '-'}</div>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs overflow-auto">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(detail, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
