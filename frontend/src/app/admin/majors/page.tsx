"use client";

import { useState, useEffect } from 'react';
import { majorService, Major, MajorCreate, MajorUpdate, Teacher } from '@/services/major.service';
import { organizationService, Organization } from '@/services/organization.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Tooltip from '@/components/common/Tooltip';
import BulkImportModal from '@/components/admin/BulkImportModal';

export default function AdminMajorsPage() {
  const { t } = useLanguage();
  const [majors, setMajors] = useState<Major[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [viewingMajor, setViewingMajor] = useState<Major | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [addForm, setAddForm] = useState<MajorCreate>({
    name: '',
    code: '',
    description: '',
    tuition_fee: 0,
    duration_years: 4,
    organization_id: 0,
    teacher_id: null
  });

  const [editForm, setEditForm] = useState<MajorUpdate>({
    name: '',
    code: '',
    description: '',
    tuition_fee: 0,
    duration_years: 4,
    teacher_id: null
  });

  const [searchKeyword, setSearchKeyword] = useState('');

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 实时搜索 - 防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }));
      loadMajors(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 教师搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTeachers();
    }, 300);
    return () => clearTimeout(timer);
  }, [teacherSearch]);

  useEffect(() => {
    loadOrganizations();
    loadTeachers();
  }, []);

  const loadOrganizations = async () => {
    try {
      const data = await organizationService.getTree();
      setOrganizations(data.tree || []);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await majorService.searchTeachers(teacherSearch || undefined);
      setTeachers(data);
    } catch (error) {
      console.error('Failed to load teachers:', error);
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

  const loadMajors = async (page?: number) => {
    try {
      setLoading(true);
      const currentPage = page || pagination.current;
      const skip = (currentPage - 1) * pagination.pageSize;
      
      const data = await majorService.getAll({
        name: searchKeyword || undefined,
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

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, current: page });
    loadMajors(page);
  };

  const handleView = (major: Major) => {
    setViewingMajor(major);
    setViewModalOpen(true);
  };

  const handleEdit = (major: Major) => {
    setEditingMajor(major);
    setEditForm({
      name: major.name,
      code: major.code || '',
      description: major.description || '',
      tuition_fee: major.tuition_fee,
      duration_years: major.duration_years,
      organization_id: major.organization_id,
      teacher_id: major.teacher_id || null
    });
    setTeacherSearch(major.teacher_name || '');
    setEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await majorService.createMajor(addForm);
      setAddModalOpen(false);
      setAddForm({
        name: '',
        code: '',
        description: '',
        tuition_fee: 0,
        duration_years: 4,
        organization_id: 0,
        teacher_id: null
      });
      setTeacherSearch('');
      loadMajors(1);
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
      setTeacherSearch('');
      loadMajors();
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
  
  // 不带箭头的select样式
  const selectStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm cursor-pointer hover:border-blue-300";
  
  // 强制隐藏浏览器原生下拉箭头的内联样式
  const selectInlineStyle = {
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    appearance: 'none' as const,
    backgroundImage: 'none' as const
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.majors.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.majors.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 实时搜索输入框 */}
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t.common.search + ' ' + t.admin.majors.columns.name}
              className="px-6 py-3 pl-12 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all w-64"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
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
            onClick={() => {
              // 重置表单和教师搜索框
              setAddForm({
                name: '',
                description: '',
                tuition_fee: 0,
                duration_years: 4,
                organization_id: 0,
                teacher_id: null
              });
              setTeacherSearch('');
              setAddModalOpen(true);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            {t.admin.majors.addTitle}
          </button>
        </div>
      </div>

      {/* Majors Table */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.name}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">专业代码</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.description}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.organization}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.majors.columns.duration}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">班级数量</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">学生数量</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">专业负责人</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && Array.isArray(majors) && majors.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.205 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.795 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                    </div>
                  </td>
                </tr>
              )}
              {Array.isArray(majors) && majors.map((major) => (
                <tr key={major.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{major.name}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">{major.code || '-'}</span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-sm text-slate-500 line-clamp-2 max-w-md">{major.description || '-'}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-700">{major.organization_name || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-700">{major.duration_years} 年</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-blue-600">{major.classes_count || 0}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-emerald-600">{major.students_count || 0}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-700">{major.teacher_name || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
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
              {t.common.show} {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} {t.common.records}，{t.common.total} {pagination.total} {t.common.records}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                {t.common.previous}
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
                {t.common.next}
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
              <button onClick={() => {
                setAddModalOpen(false);
                setTeacherSearch('');
              }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.majors.columns.name}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input type="text" className={inputStyle} value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">专业代码</label>
                <input 
                  type="text" 
                  className={inputStyle} 
                  value={addForm.code || ''} 
                  onChange={(e) => setAddForm({...addForm, code: e.target.value})} 
                  placeholder="请输入专业代码（可选）"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.description}</label>
                <textarea className={inputStyle} rows={3} value={addForm.description} onChange={(e) => setAddForm({...addForm, description: e.target.value})}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.majors.columns.organization}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  className={selectStyle}
                  value={addForm.organization_id ? addForm.organization_id.toString() : ''}
                  onChange={(e) => setAddForm({...addForm, organization_id: e.target.value ? parseInt(e.target.value) : 0})}
                  required
                  style={selectInlineStyle}
                >
                  <option value="">{t.common.select}</option>
                  {getAllOrganizationsFlat(organizations).map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.level === 0 ? '🏢 ' : '\u00A0\u00A0\u00A0'.repeat(org.level || 0) + '└─ '}{org.name}
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
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    {t.admin.majors.columns.duration}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select 
                    className={selectStyle} 
                    value={addForm.duration_years} 
                    onChange={(e) => setAddForm({...addForm, duration_years: parseInt(e.target.value)})}
                    style={selectInlineStyle}
                    required
                  >
                    <option value="2">2 年</option>
                    <option value="3">3 年</option>
                    <option value="4">4 年</option>
                    <option value="5">5 年</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  专业负责人
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={inputStyle}
                    placeholder="搜索教师姓名或手机号..."
                    value={teacherSearch}
                    onChange={(e) => {
                      setTeacherSearch(e.target.value);
                      setShowTeacherDropdown(true);
                    }}
                    onFocus={() => {
                      setShowTeacherDropdown(true);
                      if (!teacherSearch) {
                        loadTeachers();
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
                  />
                  {showTeacherDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-60 overflow-auto">
                      {teachers.length > 0 ? (
                        teachers.map((teacher) => (
                          <button
                            key={teacher.id}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                            onClick={() => {
                              setAddForm({...addForm, teacher_id: teacher.id});
                              setTeacherSearch(teacher.username);
                              setShowTeacherDropdown(false);
                            }}
                          >
                            <div className="font-medium text-slate-900">{teacher.username}</div>
                            {teacher.phone && (
                              <div className="text-xs text-slate-500 mt-0.5">{teacher.phone}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">
                          未找到匹配的教师
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {addForm.teacher_id && teacherSearch && !showTeacherDropdown && (
                  <div className="mt-2 text-sm text-slate-500">
                    已选择: {teacherSearch}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => {
                  setAddModalOpen(false);
                  setTeacherSearch('');
                }} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
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
              <button onClick={() => {
                setEditModalOpen(false);
                setTeacherSearch('');
              }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.majors.columns.name}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className={inputStyle} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">专业代码</label>
                <input 
                  type="text" 
                  className={inputStyle} 
                  value={editForm.code || ''} 
                  onChange={(e) => setEditForm({...editForm, code: e.target.value})} 
                  placeholder="请输入专业代码（可选）"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.majors.columns.description}</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={3} className={inputStyle}></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.majors.columns.organization}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  className={selectStyle}
                  value={editForm.organization_id ? editForm.organization_id.toString() : ''}
                  onChange={(e) => setEditForm({...editForm, organization_id: e.target.value ? parseInt(e.target.value) : undefined})}
                  required
                  style={selectInlineStyle}
                >
                  <option value="">{t.common.select}</option>
                  {getAllOrganizationsFlat(organizations).map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.level === 0 ? '🏢 ' : '\u00A0\u00A0\u00A0'.repeat(org.level || 0) + '└─ '}{org.name}
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
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    {t.admin.majors.columns.duration}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select 
                    className={selectStyle} 
                    value={editForm.duration_years} 
                    onChange={(e) => setEditForm({...editForm, duration_years: parseInt(e.target.value)})}
                    style={selectInlineStyle}
                    required
                  >
                    <option value="2">2 年</option>
                    <option value="3">3 年</option>
                    <option value="4">4 年</option>
                    <option value="5">5 年</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  专业负责人
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className={inputStyle}
                    placeholder="搜索教师姓名或手机号..."
                    value={teacherSearch}
                    onChange={(e) => {
                      setTeacherSearch(e.target.value);
                      setShowTeacherDropdown(true);
                    }}
                    onFocus={() => {
                      setShowTeacherDropdown(true);
                      if (!teacherSearch) {
                        loadTeachers();
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowTeacherDropdown(false), 200)}
                  />
                  {showTeacherDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-60 overflow-auto">
                      {teachers.length > 0 ? (
                        teachers.map((teacher) => (
                          <button
                            key={teacher.id}
                            type="button"
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                            onClick={() => {
                              setEditForm({...editForm, teacher_id: teacher.id});
                              setTeacherSearch(teacher.username);
                              setShowTeacherDropdown(false);
                            }}
                          >
                            <div className="font-medium text-slate-900">{teacher.username}</div>
                            {teacher.phone && (
                              <div className="text-xs text-slate-500 mt-0.5">{teacher.phone}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">
                          未找到匹配的教师
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {editForm.teacher_id && teacherSearch && !showTeacherDropdown && (
                  <div className="mt-2 text-sm text-slate-500">
                    已选择: {teacherSearch}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => {
                  setEditModalOpen(false);
                  setTeacherSearch('');
                }} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Major Modal */}
      {viewModalOpen && viewingMajor && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">专业详情</h2>
              <button onClick={() => setViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="space-y-6">
              {/* 名称 */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">名称</label>
                <p className="text-lg font-bold text-slate-900">{viewingMajor.name}</p>
              </div>
              
              {/* 专业代码 */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">专业代码</label>
                <p className="text-lg font-bold text-blue-600">{viewingMajor.code || '-'}</p>
              </div>
              
              {/* 描述 */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">描述</label>
                <p className="text-slate-700 leading-relaxed">{viewingMajor.description || '-'}</p>
              </div>
              
              {/* 学制 */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">学制</label>
                <p className="text-lg font-bold text-slate-900">{viewingMajor.duration_years} 年</p>
              </div>
              
              {/* 班级数量和学生数量 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">班级数量</label>
                  <p className="text-2xl font-black text-blue-600">{viewingMajor.classes_count || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">学生数量</label>
                  <p className="text-2xl font-black text-emerald-600">{viewingMajor.students_count || 0}</p>
                </div>
              </div>
              
              {/* 学费标准和总学费 */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">学费标准</label>
                  <p className="text-xl font-black text-slate-900">¥{Number(viewingMajor.tuition_fee).toLocaleString()}/年</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">总学费</label>
                  <p className="text-xl font-black text-violet-600">¥{(viewingMajor.total_tuition || Number(viewingMajor.tuition_fee) * viewingMajor.duration_years).toLocaleString()}</p>
                </div>
              </div>
              
              {/* 专业负责人 */}
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">专业负责人</label>
                <p className="text-lg font-bold text-slate-900">{viewingMajor.teacher_name || '-'}</p>
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
