"use client";

import { useState, useEffect } from 'react';
import { adminService, Teacher as TeacherType, TeacherStats, TeacherCreate, TeacherUpdate } from '@/services/admin.service';
import { majorService, Major } from '@/services/major.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Tooltip from '@/components/common/Tooltip';
import BulkImportModal from '@/components/admin/BulkImportModal';

// Mock Data
const MOCK_TEACHER_COURSES = [
  { id: 101, title: '计算机科学导论 (CS101)', code: 'CS101', semester: '2024-秋季', students: 45 },
  { id: 102, title: '数据结构 (CS201)', code: 'CS201', semester: '2024-秋季', students: 32 },
  { id: 103, title: '算法分析 (CS202)', code: 'CS202', semester: '2025-春季', students: 38 },
];

const MOCK_TEACHER_CLASSES = [
  { id: 201, name: '计科2401班', grade: '大一', students: 45, major: '计算机科学' },
  { id: 202, name: '软工2302班', grade: '大二', students: 32, major: '软件工程' },
  { id: 203, name: '计科2201班', grade: '大三', students: 38, major: '计算机科学' },
];

export default function AdminTeachersPage() {
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState<TeacherType[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [coursesModalOpen, setCoursesModalOpen] = useState(false);
  const [classesModalOpen, setClassesModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [editingTeacher, setEditingTeacher] = useState<TeacherType | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<TeacherType | null>(null);
  const [resettingTeacher, setResettingTeacher] = useState<TeacherType | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  
  const [addForm, setAddForm] = useState<TeacherCreate>({
    username: '', 
    full_name: '',
    email: '',
    phone: '',
    major_id: 0,
    is_active: true
  });

  const [editForm, setEditForm] = useState<TeacherUpdate>({
    full_name: '',
    email: '',
    phone: '',
    major_id: 0,
    is_active: true
  });

  const [searchForm, setSearchForm] = useState({
    name: '',
    phone: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (params?: any) => {
    try {
      setLoading(true);
      setError(null);
      const searchParams = params || searchForm;
      const [teachersData, statsData, majorsData] = await Promise.all([
        adminService.getTeachers(searchParams),
        adminService.getTeacherStats(),
        majorService.getAll({ limit: 1000 })
      ]);
      setTeachers(teachersData);
      setStats(statsData);
      if (majorsData && Array.isArray(majorsData.items)) {
        setMajors(majorsData.items);
      } else {
        setMajors([]);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleReset = () => {
    const emptyParams = { name: '', phone: '', status: '' };
    setSearchForm(emptyParams);
    loadData(emptyParams);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.createTeacher(addForm);
      setAddModalOpen(false);
      setAddForm({ username: '', full_name: '', email: '', phone: '', major_id: 0, is_active: true });
      loadData();
    } catch (err: any) {
      console.error('Failed to create teacher:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditClick = (teacher: TeacherType) => {
    const major = Array.isArray(majors) ? majors.find(m => m.name === teacher.major) : null;
    setEditingTeacher(teacher);
    setEditForm({
      full_name: teacher.full_name || teacher.username,
      email: teacher.email || '',
      phone: teacher.phone || '',
      major_id: major ? major.id : 0,
      is_active: teacher.is_active
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      await adminService.updateTeacher(editingTeacher.id, editForm);
      setEditModalOpen(false);
      setEditingTeacher(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to update teacher:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.common.confirm + '?')) return;
    try {
      await adminService.deleteTeacher(id);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete teacher:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleResetPasswordClick = (teacher: TeacherType) => {
    setResettingTeacher(teacher);
    setResetPasswordConfirmOpen(true);
  };

  const handleResetPasswordConfirm = async () => {
    if (!resettingTeacher) return;
    
    try {
      const result = await adminService.resetTeacherPassword(resettingTeacher.id);
      setNewPassword(result.new_password);
      setResetPasswordConfirmOpen(false);
      setResetPasswordModalOpen(true);
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
      setResetPasswordConfirmOpen(false);
      setResettingTeacher(null);
    }
  };

  const handleViewCourses = (teacher: TeacherType) => {
    setViewingTeacher(teacher);
    setCoursesModalOpen(true);
  };

  const handleViewClasses = (teacher: TeacherType) => {
    setViewingTeacher(teacher);
    setClassesModalOpen(true);
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";
  const selectStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none transition-all shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right:0.5rem_center] bg-no-repeat pr-10 cursor-pointer hover:border-blue-300";

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.admin.teachers.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t.admin.teachers.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setImportModalOpen(true)}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            {t.admin.bulkImport.title}
          </button>
          <button 
            onClick={() => setAddModalOpen(true)} 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            {t.admin.teachers.addTitle}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.name}</label>
            <input 
              type="text" 
              className={inputStyle} 
              placeholder={t.common.search + '...'}
              value={searchForm.name}
              onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.phone}</label>
            <input 
              type="text" 
              className={inputStyle} 
              placeholder={t.admin.teachers.columns.phone}
              value={searchForm.phone}
              onChange={(e) => setSearchForm({...searchForm, phone: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.common.status}</label>
            <select 
              className={selectStyle}
              value={searchForm.status}
              onChange={(e) => setSearchForm({...searchForm, status: e.target.value})}
            >
              <option value="">{t.common.all}</option>
              <option value="active">{t.common.active}</option>
              <option value="inactive">{t.common.inactive}</option>
            </select>
          </div>
          <div className="flex gap-2 pb-1">
            <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              {t.common.search}
            </button>
            <button type="button" onClick={handleReset} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full font-bold text-sm transition-all active:scale-95">
              {t.common.reset}
            </button>
          </div>
        </form>
      </div>

      {/* Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: t.admin.teachers.stats.active, value: stats.active, color: 'blue' },
            { label: t.admin.teachers.stats.courses, value: 0, color: 'violet' },
            { label: t.admin.teachers.stats.students, value: 0, color: 'emerald' },
            { label: t.admin.teachers.stats.avgCourses, value: 0, color: 'slate' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-transparent hover:bg-blue-50/50 transition-colors group">
              <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
              <div className={`text-sm font-bold text-${stat.color}-600 uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity`}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Teachers Table */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.teachers.columns.name}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.teachers.columns.email}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.teachers.columns.phone}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.teachers.columns.organization}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.teachers.columns.major}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.status}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 shadow-sm">
                        {teacher.full_name ? teacher.full_name.charAt(0).toUpperCase() : teacher.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{teacher.full_name || teacher.username}</div>
                        <div className="text-xs text-slate-400 font-mono">@{teacher.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-500">{teacher.email}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-500">{teacher.phone || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-600">{teacher.organization || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{teacher.major || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    {teacher.is_active ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/50 text-emerald-600">{t.common.active}</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">{t.common.inactive}</span>
                    )}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip content={t.admin.teachers.actions.viewCourses}>
                        <button onClick={() => handleViewCourses(teacher)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.205 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.795 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.admin.teachers.actions.viewClasses}>
                        <button onClick={() => handleViewClasses(teacher)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </button>
                      </Tooltip>
                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                      <Tooltip content={t.admin.teachers.actions.edit}>
                        <button onClick={() => handleEditClick(teacher)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.admin.teachers.actions.resetPassword}>
                        <button onClick={() => handleResetPasswordClick(teacher)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.admin.teachers.actions.delete}>
                        <button onClick={() => handleDelete(teacher.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.teachers.addTitle}</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.username}</label>
                <div className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  {addForm.phone ? `${t.admin.teachers.usernameHint}: ${addForm.phone}` : t.admin.teachers.usernameHintEmpty}
                </div>
                <p className="text-xs text-slate-500 mt-1 ml-1">{t.admin.teachers.passwordHint}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.name}</label>
                <input type="text" className={inputStyle} value={addForm.full_name} onChange={(e) => setAddForm({...addForm, full_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.email}</label>
                <input type="email" className={inputStyle} value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.phone} *</label>
                <input type="tel" className={inputStyle} value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.major}</label>
                <select className={selectStyle} value={addForm.major_id} onChange={(e) => setAddForm({...addForm, major_id: parseInt(e.target.value)})} required>
                  <option value="">{t.common.pleaseSelect}</option>
                  {Array.isArray(majors) && majors.map((major) => (
                    <option key={major.id} value={major.id}>{major.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:border-blue-200 transition-all" onClick={() => setAddForm({ ...addForm, is_active: !addForm.is_active })}>
                <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${addForm.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${addForm.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className={`font-bold select-none ${addForm.is_active ? 'text-blue-700' : 'text-slate-500'}`}>{addForm.is_active ? t.common.active : t.common.inactive}</span>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.submit}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editModalOpen && editingTeacher && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.teachers.editTitle}</h2>
              <button onClick={() => setEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.name}</label>
                <input type="text" className={inputStyle} value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.email}</label>
                <input type="email" className={inputStyle} value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.phone} *</label>
                <input type="tel" className={inputStyle} value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.teachers.columns.major}</label>
                <select className={selectStyle} value={editForm.major_id} onChange={(e) => setEditForm({...editForm, major_id: parseInt(e.target.value)})}>
                  <option value="">{t.common.pleaseSelect}</option>
                  {Array.isArray(majors) && majors.map((major) => (
                    <option key={major.id} value={major.id}>{major.name}</option>
                  ))}
                </select>
              </div>
              {/* Optimized Toggle Switch for Edit */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:border-blue-200 transition-all" onClick={() => setEditForm({ ...editForm, is_active: !editForm.is_active })}>
                <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${editForm.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${editForm.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className={`font-bold select-none ${editForm.is_active ? 'text-blue-700' : 'text-slate-500'}`}>{editForm.is_active ? t.common.active : t.common.inactive}</span>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teaching Courses Modal */}
      {coursesModalOpen && viewingTeacher && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t.admin.teachers.coursesModal.title}</h2>
                <p className="text-slate-500 mt-1">{t.admin.teachers.coursesModal.subtitle}: <span className="font-bold text-slate-700">{viewingTeacher.full_name}</span></p>
              </div>
              <button onClick={() => setCoursesModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
              <div className="grid gap-4">
                {MOCK_TEACHER_COURSES.map((course) => (
                  <Link href={`/admin/courses/${course.id}`} key={course.id} target="_blank" className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 transition-all group">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg text-xs font-bold font-mono">{course.code}</span>
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> {course.semester}</span>
                          <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> {course.students} {t.admin.teachers.coursesModal.columns.students}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teaching Classes Modal */}
      {classesModalOpen && viewingTeacher && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t.admin.teachers.classesModal.title}</h2>
                <p className="text-slate-500 mt-1">{t.admin.teachers.classesModal.subtitle}: <span className="font-bold text-slate-700">{viewingTeacher.full_name}</span></p>
              </div>
              <button onClick={() => setClassesModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
              <div className="grid gap-4">
                {MOCK_TEACHER_CLASSES.map((cls) => (
                  <Link href={`/admin/classes/${cls.id}`} key={cls.id} target="_blank" className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:shadow-amber-500/5 hover:border-amber-200 transition-all group">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">{cls.name}</h3>
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold">{cls.grade}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">{cls.major}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> {cls.students} {t.admin.teachers.classesModal.columns.students}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-amber-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirm Modal */}
      {resetPasswordConfirmOpen && resettingTeacher && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{t.admin.teachers.resetPassword.title}</h2>
              <button 
                onClick={() => {
                  setResetPasswordConfirmOpen(false);
                  setResettingTeacher(null);
                }} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-amber-900 mb-1">{t.admin.teachers.resetPassword.warning}</p>
                    <p className="text-sm text-amber-700">{t.admin.teachers.resetPassword.confirmMessage}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="text-sm text-slate-600 mb-1">{t.admin.teachers.columns.name}</div>
                <div className="font-bold text-slate-900">{resettingTeacher.full_name}</div>
                <div className="text-sm text-slate-500 mt-1 font-mono">@{resettingTeacher.username}</div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => {
                    setResetPasswordConfirmOpen(false);
                    setResettingTeacher(null);
                  }} 
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button 
                  onClick={handleResetPasswordConfirm} 
                  className="px-8 py-3 text-sm font-bold text-white bg-amber-600 rounded-full hover:bg-amber-700 shadow-lg shadow-amber-500/20 transition-colors active:scale-95"
                >
                  {t.admin.teachers.resetPassword.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Success Modal */}
      {resetPasswordModalOpen && resettingTeacher && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">{t.admin.teachers.resetPassword.successTitle}</h2>
              <button 
                onClick={() => {
                  setResetPasswordModalOpen(false);
                  setResettingTeacher(null);
                  setNewPassword('');
                }} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-emerald-900 mb-1">{t.admin.teachers.resetPassword.successMessage}</p>
                    <p className="text-sm text-emerald-700">{t.admin.teachers.resetPassword.savePassword}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="text-sm text-slate-600 mb-2">{t.admin.teachers.columns.name}</div>
                <div className="font-bold text-slate-900 mb-4">{resettingTeacher.full_name}</div>
                <div className="text-sm text-slate-600 mb-2">{t.admin.teachers.resetPassword.newPassword}</div>
                <div className="bg-white border-2 border-blue-200 rounded-xl p-4 font-mono text-lg font-bold text-blue-600 text-center tracking-wider select-all">
                  {newPassword}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newPassword);
                    alert(t.admin.teachers.resetPassword.copied);
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-bold transition-colors"
                >
                  {t.admin.teachers.resetPassword.copyPassword}
                </button>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => {
                    setResetPasswordModalOpen(false);
                    setResettingTeacher(null);
                    setNewPassword('');
                  }} 
                  className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95"
                >
                  {t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          loadData();
        }}
        onImport={async (file) => {
          const result = await adminService.importTeachers(file);
          return result;
        }}
        templateUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/teachers/template`}
        title={t.admin.bulkImport.title + ' - ' + t.admin.teachers.title}
        description={t.admin.teachers.subtitle}
      />
    </div>
  );
}
