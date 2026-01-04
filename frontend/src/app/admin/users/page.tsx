'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminService } from '@/services/admin.service';

// 定义用户接口
interface User {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role: string;
  is_active: boolean;
}

// Tooltip组件
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      {content}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-slate-900"></div>
      </div>
    </div>
  </div>
);

export default function UsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: '',
    username: '',
    phone: ''
  });
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true);
      // 使用admin服务获取所有用户
      const response = await adminService.getAllUsers(filters);
      setUsers(response.items || []);
    } catch (error) {
      console.error('加载用户失败:', error);
      alert(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 搜索
  const handleSearch = () => {
    loadUsers();
  };

  // 重置筛选
  const handleReset = () => {
    setFilters({
      name: '',
      username: '',
      phone: ''
    });
    setTimeout(() => loadUsers(), 0);
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      await adminService.resetUserPassword(selectedUser.id);
      alert(t.admin.users.resetPassword.successMessage);
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('重置密码失败:', error);
      alert(t.admin.users.resetPassword.error);
    }
  };

  // 获取角色显示文本
  const getRoleText = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'admin': t.admin.users.roles.admin,
      'teacher': t.admin.users.roles.teacher,
      'student': t.admin.users.roles.student
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.users.title}</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.users.subtitle}</p>
      </div>

      {/* 搜索筛选 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.users.filters.name}</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t.admin.users.filters.name}
              value={filters.name}
              onChange={(e) => setFilters({...filters, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.users.filters.username}</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t.admin.users.filters.username}
              value={filters.username}
              onChange={(e) => setFilters({...filters, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.users.filters.phone}</label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t.admin.users.filters.phone}
              value={filters.phone}
              onChange={(e) => setFilters({...filters, phone: e.target.value})}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95"
            >
              {t.admin.users.filters.search}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-95"
            >
              {t.admin.users.filters.reset}
            </button>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">{t.admin.users.columns.name}</th>
                <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">{t.admin.users.columns.username}</th>
                <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">{t.admin.users.columns.phone}</th>
                <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">{t.admin.users.columns.email}</th>
                <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">{t.admin.users.columns.role}</th>
                <th className="px-8 py-4 text-left text-sm font-bold text-slate-700 tracking-wide">{t.admin.users.columns.status}</th>
                <th className="px-8 py-4 text-right text-sm font-bold text-slate-700 tracking-wide">{t.admin.users.columns.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-slate-600 text-lg font-medium">{t.common.noData}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {(user.full_name || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{user.full_name || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm text-slate-600">{user.username}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm text-slate-600">{user.phone || '-'}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm text-slate-600">{user.email || '-'}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.is_active ? t.common.active : t.common.inactive}
                      </span>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Tooltip content={t.admin.users.actions.resetPassword}>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowResetPasswordModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 重置密码确认弹窗 */}
      {showResetPasswordModal && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowResetPasswordModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{t.admin.users.resetPassword.warning}</h3>
                <p className="text-sm text-slate-600">
                  {t.admin.users.resetPassword.confirmMessage}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="flex-1 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all active:scale-95"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleResetPassword}
                  className="flex-1 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all active:scale-95"
                >
                  {t.admin.users.resetPassword.confirm}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

