"use client";

import { useState, useEffect } from 'react';
import { majorService, Major, MajorCreate, MajorUpdate, MajorStats } from '@/services/major.service';
import { organizationService, Organization } from '@/services/organization.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Tooltip from '@/components/common/Tooltip';
import BulkImportModal from '@/components/admin/BulkImportModal';

export default function AdminMajorsPage() {
  const { t } = useLanguage();
  const [majors, setMajors] = useState<Major[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<MajorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [viewingMajor, setViewingMajor] = useState<Major | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [addForm, setAddForm] = useState<MajorCreate>({
    name: '',
    description: '',
    tuition_fee: 0,
    duration_years: 4,
    organization_id: 0
  });

  const [editForm, setEditForm] = useState<MajorUpdate>({
    name: '',
    description: '',
    tuition_fee: 0,
    duration_years: 4
  });

  const [searchForm, setSearchForm] = useState({
    name: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  useEffect(() => {
    loadMajors();
    loadOrganizations();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await majorService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadOrganizations = async () => {
    try {
      const data = await organizationService.getTree();
      setOrganizations(data.tree || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const getAllOrganizationsFlat = (nodes: Organization[]): Organization[] => {
    let result: Organization[] = [];
    const traverse = (items: Organization[], level: number = 0) => {
      items.forEach(item => {
        result.push({ ...item, level });
        if (item.children && item.children.length > 0) {
          traverse(item.children, level + 1);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  const loadMajors = async (params?: any, page?: number) => {
    try {
      setLoading(true);
      const searchParams = params || searchForm;
      const currentPage = page || pagination.current;
      const skip = (currentPage - 1) * pagination.pageSize;
      
      const data = await majorService.getAll({
        ...searchParams,
        skip,
        limit: pagination.pageSize
      });
      
      if (data && Array.isArray(data.items)) {
        setMajors(data.items);
        setPagination({
          ...pagination,
          current: currentPage,
          total: data.total || 0
        });
      } else {
        setMajors([]);
        setPagination({
          ...pagination,
          current: 1,
          total: 0
        });
      }
    } catch (error) {
      console.error('Failed to load majors:', error);
      setMajors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, current: 1 });
    loadMajors(searchForm, 1);
  };

  const handleReset = () => {
    const emptyParams = { name: '' };
    setSearchForm(emptyParams);
    setPagination({ ...pagination, current: 1 });
    loadMajors(emptyParams, 1);
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, current: page });
    loadMajors(searchForm, page);
  };

  const handleView = (major: Major) => {
    setViewingMajor(major);
    setViewModalOpen(true);
  };

  const handleEdit = (major: Major) => {
    setEditingMajor(major);
    setEditForm({
      name: major.name,
      description: major.description || '',
      tuition_fee: major.tuition_fee,
      duration_years: major.duration_years,
      organization_id: major.organization_id
    });
    setEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await majorService.createMajor(addForm);
      setAddModalOpen(false);
      setAddForm({
        name: '',
        description: '',
        tuition_fee: 0,
        duration_years: 4,
        organization_id: 0
      });
      loadMajors();
      loadStats();
    } catch (err: any) {
      console.error('Failed to create major:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMajor) return;
    
    try {
      await majorService.updateMajor(editingMajor.id, editForm);
      setEditModalOpen(false);
      setEditingMajor(null);
      loadMajors();
      loadStats();
    } catch (err: any) {
      console.error('Failed to update major:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (majorId: number) => {
    if (!confirm(t.common.confirm + '?')) return;
    
    try {
      await majorService.deleteMajor(majorId);
      loadMajors();
      loadStats();
      alert(t.common.success);
    } catch (err: any) {
      console.error('Failed to delete major:', err);
      const errorMessage = err.response?.data?.detail || err.message || t.common.error;
      
      // 检查是否是有关联班级的错误
      if (errorMessage.includes('class') || errorMessage.includes('班级') || (errorMessage.includes('associated') && errorMessage.includes('class'))) {
        alert(t.admin.majors.deleteError.hasClasses);
      } 
      // 检查是否是有关联教师的错误
      else if (errorMessage.includes('teacher') || errorMessage.includes('教师') || (errorMessage.includes('associated') && errorMessage.includes('teacher'))) {
        alert(t.admin.majors.deleteError.hasTeachers);
      } 
      else {
        alert(t.common.error + ': ' + errorMessage);
      }
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";
  const selectStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none transition-all shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right:0.5rem_center] bg-no-repeat pr-10 cursor-pointer hover:border-blue-300";

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.majors.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.majors.subtitle}</p>
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
            {t.admin.majors.addTitle}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.name}</label>
            <input 
              type="text" 
              className={inputStyle} 
              placeholder={t.common.search + '...'}
              value={searchForm.name}
              onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
            />
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: t.admin.majors.stats.total, value: stats?.total ?? pagination.total, color: 'blue' },
          { label: t.admin.majors.stats.avgTuition, value: stats?.avg_tuition ? `¥${Math.round(stats.avg_tuition)}` : (majors.length > 0 ? `¥${Math.round(majors.reduce((sum, m) => sum + Number(m.tuition_fee), 0) / majors.length)}` : '¥0'), color: 'emerald' },
          { label: t.admin.majors.stats.avgDuration, value: stats?.avg_duration ? Math.round(stats.avg_duration * 10) / 10 : (majors.length > 0 ? Math.round(majors.reduce((sum, m) => sum + m.duration_years, 0) / majors.length * 10) / 10 : 4), color: 'violet' },
          { label: t.admin.majors.stats.departments, value: stats?.departments ?? 0, color: 'slate' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-transparent hover:bg-blue-50/50 transition-colors group">
            <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
            <div className={`text-sm font-bold text-${stat.color}-600 uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Majors Table */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.name}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.description}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.organization}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.tuition}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.duration}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && Array.isArray(majors) && majors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.205 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.795 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                      <p className="text-sm">点击右上角"添加新专业"按钮创建专业</p>
                    </div>
                  </td>
                </tr>
              )}
              {Array.isArray(majors) && majors.map((major) => (
                <tr key={major.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{major.name}</div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-sm text-slate-500 line-clamp-2 max-w-md">{major.description || '-'}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-700">{major.organization_name || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-900">¥{Number(major.tuition_fee).toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-700">{major.duration_years} 年</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content={t.common.view}>
                        <button onClick={() => handleView(major)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.common.edit}>
                        <button onClick={() => handleEdit(major)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.common.delete}>
                        <button onClick={() => handleDelete(major.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
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

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-white">
            <div className="text-sm text-slate-500">
              显示 {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                上一页
              </button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
                  const pages = [];
                  const showPages = 5;
                  let startPage = Math.max(1, pagination.current - Math.floor(showPages / 2));
                  let endPage = Math.min(totalPages, startPage + showPages - 1);
                  
                  if (endPage - startPage < showPages - 1) {
                    startPage = Math.max(1, endPage - showPages + 1);
                  }
                  
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => handlePageChange(1)}
                        className="w-10 h-10 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="ellipsis1" className="px-2 text-slate-400">...</span>);
                    }
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`w-10 h-10 text-sm font-bold rounded-full transition-colors ${
                          i === pagination.current
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="ellipsis2" className="px-2 text-slate-400">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className="w-10 h-10 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                      >
                        {totalPages}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Major Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.majors.addTitle}</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.name}</label>
                <input type="text" className={inputStyle} value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.description}</label>
                <textarea className={inputStyle} rows={3} value={addForm.description} onChange={(e) => setAddForm({...addForm, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.organization} *</label>
                <select 
                  className={selectStyle}
                  value={addForm.organization_id ? addForm.organization_id.toString() : ''}
                  onChange={(e) => setAddForm({...addForm, organization_id: e.target.value ? parseInt(e.target.value) : 0})}
                  required
                >
                  <option value="">{t.common.select}</option>
                  {getAllOrganizationsFlat(organizations).map((org) => (
                    <option key={org.id} value={org.id}>
                      {'  '.repeat(org.level || 0)}{org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.tuition}</label>
                  <input type="number" className={inputStyle} value={addForm.tuition_fee} onChange={(e) => setAddForm({...addForm, tuition_fee: parseFloat(e.target.value)})} required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.duration}</label>
                  <select className={selectStyle} value={addForm.duration_years} onChange={(e) => setAddForm({...addForm, duration_years: parseInt(e.target.value)})}>
                    <option value="2">2 年</option>
                    <option value="3">3 年</option>
                    <option value="4">4 年</option>
                    <option value="5">5 年</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Major Modal */}
      {editModalOpen && editingMajor && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.majors.editTitle}</h2>
              <button onClick={() => setEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.name}</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.description}</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={3} className={inputStyle}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.organization} *</label>
                <select 
                  className={selectStyle}
                  value={editForm.organization_id ? editForm.organization_id.toString() : ''}
                  onChange={(e) => setEditForm({...editForm, organization_id: e.target.value ? parseInt(e.target.value) : undefined})}
                  required
                >
                  <option value="">{t.common.select}</option>
                  {getAllOrganizationsFlat(organizations).map((org) => (
                    <option key={org.id} value={org.id}>
                      {'  '.repeat(org.level || 0)}{org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.tuition}</label>
                  <input type="number" value={editForm.tuition_fee} onChange={(e) => setEditForm({...editForm, tuition_fee: parseFloat(e.target.value)})} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.duration}</label>
                  <input type="number" value={editForm.duration_years} onChange={(e) => setEditForm({...editForm, duration_years: parseInt(e.target.value)})} className={inputStyle} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Major Modal */}
      {viewModalOpen && viewingMajor && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{viewingMajor.name}</h2>
              <button onClick={() => setViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.majors.columns.description}</label>
                <p className="text-slate-700 leading-relaxed">{viewingMajor.description || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.majors.columns.tuition}</label>
                  <p className="text-2xl font-black text-slate-900">¥{Number(viewingMajor.tuition_fee).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.majors.columns.duration}</label>
                  <p className="text-2xl font-black text-slate-900">{viewingMajor.duration_years} 年</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.majors.columns.totalTuition}</label>
                <p className="text-2xl font-black text-blue-600">¥{(Number(viewingMajor.tuition_fee) * viewingMajor.duration_years).toLocaleString()}</p>
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
          loadMajors();
        }}
        onImport={async (file) => {
          const result = await majorService.importMajors(file);
          return result;
        }}
        templateUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/majors/template`}
        title={t.admin.bulkImport.title + ' - ' + t.admin.majors.title}
        description={t.admin.majors.subtitle}
      />
    </div>
  );
}
