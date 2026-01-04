"use client";

import { useState, useEffect } from 'react';
import { adminService, Class as ClassType, ClassCreate, ClassUpdate, Student } from '@/services/admin.service';
import { dictionaryService, DictionaryItem } from '@/services/dictionary.service';
import { majorService, Major } from '@/services/major.service';
import { organizationService, Organization } from '@/services/organization.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Tooltip from '@/components/common/Tooltip';
import BulkImportModal from '@/components/admin/BulkImportModal';

export default function AdminClassesPage() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [viewingClass, setViewingClass] = useState<ClassType | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [studentsPagination, setStudentsPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [gradeOptions, setGradeOptions] = useState<DictionaryItem[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [addForm, setAddForm] = useState<ClassCreate>({
    name: '',
    code: '',
    major_id: 0,
    grade: ''
  });

  const [editForm, setEditForm] = useState<ClassUpdate>({
    name: '',
    code: '',
    major_id: 0,
    grade: ''
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchForm, setSearchForm] = useState({
    name: '',
    major_id: '',
    organization_id: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // 实时搜索 - 防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current: 1 }));
      loadData({ ...searchForm, name: searchKeyword }, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  useEffect(() => {
    loadData();
    loadDictionaryData();
    loadMajors();
    loadOrganizations();
  }, []);

  const loadData = async (params?: any, page?: number) => {
    try {
      setLoading(true);
      const searchParams = params || searchForm;
      const currentPage = page || pagination.current;
      const skip = (currentPage - 1) * pagination.pageSize;
      
      const requestParams: any = {
        skip,
        limit: pagination.pageSize
      };
      
      if (searchParams.name) {
        requestParams.name = searchParams.name;
      }
      if (searchParams.major_id) {
        requestParams.major_id = parseInt(searchParams.major_id);
      }
      if (searchParams.organization_id) {
        requestParams.organization_id = parseInt(searchParams.organization_id);
      }
      
      const classesData = await adminService.getClasses(requestParams);
      
      if (classesData && Array.isArray(classesData.items)) {
        setClasses(classesData.items);
        setPagination({
          ...pagination,
          current: currentPage,
          total: classesData.total || 0
        });
      } else {
        setClasses([]);
        setPagination({
          ...pagination,
          current: 1,
          total: 0
        });
      }
    } catch (err: any) {
      console.error('Failed to load classes:', err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDictionaryData = async () => {
    try {
      const grades = await dictionaryService.getItemsByTypeCode('grade');
      setGradeOptions(grades);
    } catch (err: any) {
      console.error('Failed to load dictionary:', err);
    }
  };

  const loadMajors = async () => {
    try {
      const majorsData = await majorService.getAll();
      if (majorsData && Array.isArray(majorsData.items)) {
        setMajors(majorsData.items);
      }
    } catch (err: any) {
      console.error('Failed to load majors:', err);
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

  const loadClassStudents = async (classId: number, page: number) => {
    try {
      setStudentsLoading(true);
      const skip = (page - 1) * studentsPagination.pageSize;
      const data = await adminService.getClassStudents(classId, {
        skip,
        limit: studentsPagination.pageSize
      });
      setStudents(Array.isArray(data.items) ? data.items : []);
      setStudentsPagination({
        ...studentsPagination,
        current: page,
        total: data.total || 0
      });
    } catch (error) {
      console.error('Failed to load class students:', error);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStudentsPageChange = (page: number) => {
    if (viewingClass) {
      loadClassStudents(viewingClass.id, page);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, current: page });
    loadData(searchForm, page);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.major_id) {
      alert(t.common.required);
      return;
    }
    try {
      await adminService.createClass(addForm);
      setAddModalOpen(false);
      setAddForm({ name: '', code: '', major_id: 0, grade: '' });
      loadData();
    } catch (err: any) {
      console.error('Failed to create class:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditClick = (classItem: ClassType) => {
    setSelectedClass(classItem);
    setEditForm({
      name: classItem.name,
      code: classItem.code || '',
      major_id: classItem.major_id,
      grade: classItem.grade || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      await adminService.updateClass(selectedClass.id, editForm);
      setEditModalOpen(false);
      setSelectedClass(null);
      loadData();
    } catch (err: any) {
      console.error('Failed to update class:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.common.confirm + '?')) return;
    try {
      await adminService.deleteClass(id);
      loadData();
      alert(t.common.success);
    } catch (err: any) {
      console.error('Failed to delete class:', err);
      const errorMessage = err.response?.data?.detail || err.message || t.common.error;
      
      // 检查是否是有关联学生的错误
      if (errorMessage.includes('student') || errorMessage.includes('学生') || (errorMessage.includes('associated') && errorMessage.includes('student'))) {
        alert(t.admin.classes.deleteError.hasStudents);
      } else {
        alert(t.common.error + ': ' + errorMessage);
      }
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";
  const selectStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none transition-all shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right:0.5rem_center] bg-no-repeat pr-10 cursor-pointer hover:border-blue-300";

  // Filter majors by selected organization
  const filteredMajors = searchForm.organization_id 
    ? majors.filter(m => m.organization_id === parseInt(searchForm.organization_id))
    : majors;

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.classes.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.classes.subtitle}</p>
          </div>
          <button
            onClick={() => window.open('/admin/classes/overview', '_blank')}
            className="px-6 py-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-full font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            班级一览
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t.common.search + ' ' + t.admin.classes.columns.name}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-64 px-5 py-3 bg-white border-2 border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm hover:border-slate-300"
          />
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
            {t.admin.classes.addTitle}
          </button>
        </div>
      </div>

      {/* Filter Form */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.classes.columns.organization}</label>
            <div className="relative">
            <select 
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
              value={searchForm.organization_id}
                onChange={(e) => {
                  const newSearchForm = {...searchForm, organization_id: e.target.value, major_id: ''};
                  setSearchForm(newSearchForm);
                  setPagination(prev => ({ ...prev, current: 1 }));
                  loadData(newSearchForm, 1);
                }}
            >
                <option value="" className="py-2">{t.common.all}</option>
              {getAllOrganizationsFlat(organizations).map((org) => (
                  <option key={org.id} value={org.id} className="py-2">
                    {org.level === 0 ? '[根] ' : `[L${org.level}] ${'　'.repeat(org.level)}├─ `}{org.name}
                </option>
              ))}
            </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.classes.columns.major}</label>
            <select 
              className={selectStyle}
              value={searchForm.major_id}
              onChange={(e) => {
                const newSearchForm = {...searchForm, major_id: e.target.value};
                setSearchForm(newSearchForm);
                setPagination(prev => ({ ...prev, current: 1 }));
                loadData(newSearchForm, 1);
              }}
            >
              <option value="">{t.common.all}</option>
              {filteredMajors.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          </div>
      </div>

      {/* Classes Table */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.classes.columns.name}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.classes.columns.code}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.classes.columns.organization}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.classes.columns.major}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.classes.columns.grade}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.classes.columns.studentCount}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && Array.isArray(classes) && classes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                    </div>
                  </td>
                </tr>
              )}
              {Array.isArray(classes) && classes.map((classItem) => (
                <tr key={classItem.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{classItem.name}</div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{classItem.code || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{classItem.organization_name || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{classItem.major_name || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{classItem.grade || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setViewingClass(classItem);
                        setStudentsModalOpen(true);
                        loadClassStudents(classItem.id, 1);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      {classItem.student_count || 0}
                    </button>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip content={t.admin.classes.viewStudents || '查看班级学生'}>
                        <button 
                          onClick={() => {
                            setViewingClass(classItem);
                            setStudentsModalOpen(true);
                            loadClassStudents(classItem.id, 1);
                          }} 
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                          </svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.common.edit}>
                        <button onClick={() => handleEditClick(classItem)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.common.delete}>
                        <button onClick={() => handleDelete(classItem.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
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

      {/* Add Class Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.classes.addTitle}</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.classes.columns.name}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input type="text" className={inputStyle} value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.classes.columns.code}</label>
                <input type="text" className={inputStyle} value={addForm.code} onChange={(e) => setAddForm({...addForm, code: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.classes.columns.major}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  className={selectStyle}
                  value={addForm.major_id || ''}
                  onChange={(e) => setAddForm({...addForm, major_id: e.target.value ? parseInt(e.target.value) : 0})}
                  required
                >
                  <option value="">{t.common.pleaseSelect}</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.classes.columns.grade}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  className={selectStyle}
                  value={addForm.grade || ''}
                  onChange={(e) => setAddForm({...addForm, grade: e.target.value})}
                  required
                >
                  <option value="">{t.common.pleaseSelect}</option>
                  {gradeOptions.map((g) => (
                    <option key={g.id} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.classes.editTitle}</h2>
              <button onClick={() => { setEditModalOpen(false); setSelectedClass(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.classes.columns.name}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className={inputStyle} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.classes.columns.code}</label>
                <input type="text" value={editForm.code} onChange={(e) => setEditForm({...editForm, code: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.classes.columns.major}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  className={selectStyle}
                  value={editForm.major_id || ''}
                  onChange={(e) => setEditForm({...editForm, major_id: e.target.value ? parseInt(e.target.value) : undefined})}
                  required
                >
                  <option value="">{t.common.pleaseSelect}</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.classes.columns.grade}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  className={selectStyle}
                  value={editForm.grade || ''}
                  onChange={(e) => setEditForm({...editForm, grade: e.target.value})}
                  required
                >
                  <option value="">{t.common.pleaseSelect}</option>
                  {gradeOptions.map((g) => (
                    <option key={g.id} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setEditModalOpen(false); setSelectedClass(null); }} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students List Modal */}
      {studentsModalOpen && viewingClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900">{viewingClass.name} - {t.admin.classes.students}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {t.common.total}: {studentsPagination.total} {t.admin.classes.students}
                </p>
              </div>
              <button
                onClick={() => {
                  setStudentsModalOpen(false);
                  setViewingClass(null);
                  setStudents([]);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Students List with Scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {studentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-slate-400">{t.common.loading}</div>
                </div>
              ) : students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  <p className="text-lg font-bold text-slate-600">{t.common.noData}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {student.full_name?.[0] || student.username?.[0] || 'S'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">{student.full_name || student.username}</span>
                          {student.student_no && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {student.student_no}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {student.phone && <span className="mr-3">{t.admin.students.columns.phone}: {student.phone}</span>}
                          {student.email && <span>{t.admin.students.columns.email}: {student.email}</span>}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        student.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {student.is_active ? t.common.active : t.common.inactive}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {studentsPagination.total > 0 && (
              <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
                <div className="text-sm text-slate-500">
                  {t.common.show} {((studentsPagination.current - 1) * studentsPagination.pageSize) + 1} - {Math.min(studentsPagination.current * studentsPagination.pageSize, studentsPagination.total)} {t.common.totalRecords}, {t.common.total} {studentsPagination.total} {t.common.records}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStudentsPageChange(studentsPagination.current - 1)}
                    disabled={studentsPagination.current === 1}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t.common.previous}
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {(() => {
                      const totalPages = Math.ceil(studentsPagination.total / studentsPagination.pageSize);
                      const pages = [];
                      const showPages = 5;
                      let startPage = Math.max(1, studentsPagination.current - Math.floor(showPages / 2));
                      let endPage = Math.min(totalPages, startPage + showPages - 1);
                      
                      if (endPage - startPage < showPages - 1) {
                        startPage = Math.max(1, endPage - showPages + 1);
                      }
                      
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => handleStudentsPageChange(1)}
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
                            onClick={() => handleStudentsPageChange(i)}
                            className={`w-10 h-10 text-sm font-bold rounded-full transition-colors ${
                              studentsPagination.current === i
                                ? 'bg-blue-600 text-white'
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
                            onClick={() => handleStudentsPageChange(totalPages)}
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
                    onClick={() => handleStudentsPageChange(studentsPagination.current + 1)}
                    disabled={studentsPagination.current >= Math.ceil(studentsPagination.total / studentsPagination.pageSize)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t.common.next}
                  </button>
                </div>
              </div>
            )}
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
          const result = await adminService.importClasses(file);
          return result;
        }}
        templateUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/classes/template`}
        title={t.admin.bulkImport.title + ' - ' + t.admin.classes.title}
        description={t.admin.classes.subtitle}
      />
    </div>
  );
}
