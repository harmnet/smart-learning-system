"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminService, Student as StudentType, StudentStats, StudentCreate, Class } from '@/services/admin.service';
import { majorService, Major } from '@/services/major.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Tooltip from '@/components/common/Tooltip';
import BulkImportModal from '@/components/admin/BulkImportModal';

export default function AdminStudentsPage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<StudentType[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [classSelectModalOpen, setClassSelectModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentType | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [addForm, setAddForm] = useState<StudentCreate>({
    username: '',
    password: 'student123',
    full_name: '',
    email: '',
    phone: '',
    class_id: 0,
    student_no: '',
    is_active: true
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    class_id: 0,
    student_no: '',
    is_active: true
  });

  const [searchForm, setSearchForm] = useState({
    name: '',
    student_no: '',
    phone: ''
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  const [classFilter, setClassFilter] = useState({
    major_id: 0,
    grade: ''
  });

  useEffect(() => {
    loadData();
    loadMajors();
  }, []);

  const loadData = async (params?: any, page?: number) => {
    try {
      setLoading(true);
      setError(null);
      const searchParams = params || searchForm;
      const currentPage = page || pagination.current;
      const skip = (currentPage - 1) * pagination.pageSize;
      
      console.log('📡 Loading student data with params:', { searchParams, skip, limit: pagination.pageSize });
      
      const [studentsData, statsData] = await Promise.all([
        adminService.getStudents({
          ...searchParams,
          skip,
          limit: pagination.pageSize
        }),
        adminService.getStudentStats()
      ]);
      
      console.log('📦 Received student data:', studentsData);
      
      // Ensure studentsData has the correct structure
      if (studentsData && Array.isArray(studentsData.items)) {
        console.log('✅ Setting students:', studentsData.items);
        setStudents(studentsData.items);
        setPagination({
          ...pagination,
          current: currentPage,
          total: studentsData.total || 0
        });
      } else {
        console.error('❌ Invalid students data format:', studentsData);
        setStudents([]);
        setPagination({
          ...pagination,
          current: 1,
          total: 0
        });
      }
      
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || t.common.error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMajors = async () => {
    try {
      const majorsData = await majorService.getAll({ limit: 1000 });
      if (majorsData && Array.isArray(majorsData.items)) {
        setMajors(majorsData.items);
      } else {
        setMajors([]);
      }
    } catch (err: any) {
      console.error('Failed to load majors:', err);
      setMajors([]);
    }
  };

  const loadClasses = async (filters?: any) => {
    try {
      const requestParams = {
        ...filters,
        limit: 1000,
        skip: 0
      };
      const classesData = await adminService.getClasses(requestParams);
      if (classesData && Array.isArray(classesData.items)) {
        setClasses(classesData.items);
      } else {
        setClasses([]);
      }
    } catch (err: any) {
      console.error('Failed to load classes:', err);
      setClasses([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, current: 1 });
    loadData(searchForm, 1);
  };

  const handleReset = () => {
    const emptyParams = { name: '', student_no: '', phone: '' };
    setSearchForm(emptyParams);
    setPagination({ ...pagination, current: 1 });
    loadData(emptyParams, 1);
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, current: page });
    loadData(searchForm, page);
  };

  const handleOpenClassSelect = () => {
    setClassSelectModalOpen(true);
    loadClasses();
  };

  const handleClassFilterChange = () => {
    const filters: any = {};
    if (classFilter.major_id) filters.major_id = classFilter.major_id;
    if (classFilter.grade) filters.grade = classFilter.grade;
    loadClasses(filters);
  };

  const handleSelectClass = (classId: number) => {
    if (editModalOpen && editingStudent) {
      setEditForm({ ...editForm, class_id: classId });
    } else {
      setAddForm({ ...addForm, class_id: classId });
    }
    setClassSelectModalOpen(false);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!addForm.student_no) {
      alert(t.admin.students.columns.studentNo + ' ' + t.common.required);
      return;
    }
    if (!addForm.username) {
      alert(t.admin.students.columns.username + ' ' + t.common.required);
      return;
    }
    if (!addForm.phone) {
      alert(t.admin.students.columns.phone + ' ' + t.common.required);
      return;
    }
    if (!addForm.class_id) {
      alert(t.admin.students.columns.class + ' ' + t.common.required);
      return;
    }
    
    try {
      await adminService.createStudent(addForm);
      setAddModalOpen(false);
      setAddForm({
        username: '',
        password: 'student123',
        full_name: '',
        email: '',
        phone: '',
        class_id: 0,
        student_no: '',
        is_active: true
      });
      loadData();
    } catch (err: any) {
      console.error('Failed to create student:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (student: StudentType) => {
    setEditingStudent(student);
    setEditForm({
      full_name: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      class_id: student.class_id || 0,
      student_no: student.student_no || '',
      is_active: student.is_active
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    
    try {
      console.log('🔄 Updating student:', editingStudent.id, 'with data:', editForm);
      const result = await adminService.updateStudent(editingStudent.id, editForm);
      console.log('✅ Update result:', result);
      setEditModalOpen(false);
      setEditingStudent(null);
      console.log('🔄 Reloading student data...');
      await loadData();
      console.log('✅ Student data reloaded');
    } catch (err: any) {
      console.error('❌ Failed to update student:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (studentId: number) => {
    if (!confirm(t.common.confirm + '?')) return;
    
    try {
      await adminService.deleteStudent(studentId);
      loadData();
    } catch (err: any) {
      console.error('Failed to delete student:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";
  const selectStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none transition-all shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right:0.5rem_center] bg-no-repeat pr-10 cursor-pointer hover:border-blue-300";

  const selectedClass = Array.isArray(classes) ? classes.find(c => c.id === addForm.class_id) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.admin.students.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {t.admin.students.subtitle}
          </p>
          </div>
          <Link 
            href="/admin/students/heatmap" 
            target="_blank"
            className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            热力图
          </Link>
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
            {t.admin.students.addTitle}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-8">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.name}</label>
            <input 
              type="text" 
              className={inputStyle} 
              placeholder={t.common.search + '...'}
              value={searchForm.name}
              onChange={(e) => setSearchForm({...searchForm, name: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.studentNo}</label>
            <input 
              type="text" 
              className={inputStyle} 
              placeholder={t.admin.students.columns.studentNo}
              value={searchForm.student_no}
              onChange={(e) => setSearchForm({...searchForm, student_no: e.target.value})}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.phone}</label>
            <input 
              type="text" 
              className={inputStyle} 
              placeholder={t.admin.students.columns.phone}
              value={searchForm.phone}
              onChange={(e) => setSearchForm({...searchForm, phone: e.target.value})}
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
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: t.admin.students.stats.total, value: stats.total, color: 'blue' },
            { label: t.admin.students.stats.active, value: stats.active, color: 'emerald' },
            { label: t.admin.students.stats.inactive, value: stats.inactive, color: 'slate' },
            { label: t.admin.students.stats.majors, value: stats.majors || 0, color: 'violet' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-transparent hover:bg-blue-50/50 transition-colors group">
              <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
              <div className={`text-sm font-bold text-${stat.color}-600 uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity`}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Students Table */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.students.columns.studentNo}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.students.columns.name}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.students.columns.username}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.students.columns.email}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.students.columns.phone}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.students.columns.class}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.students.columns.organization}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.status}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && Array.isArray(students) && students.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                      <p className="text-sm">点击右上角"添加新学生"按钮创建学生</p>
                    </div>
                  </td>
                </tr>
              )}
              {Array.isArray(students) && students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-bold text-slate-700">{student.student_no || '-'}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-sm font-bold text-emerald-600 shadow-sm">
                        {student.full_name ? student.full_name.charAt(0).toUpperCase() : student.username.charAt(0).toUpperCase()}
                      </div>
                        <div className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{student.full_name || student.username}</div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600 font-mono">{student.username}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-500">{student.email}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-500">{student.phone || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-slate-700">{student.class_name || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-600">{student.organization_name || '-'}</td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    {student.is_active ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/50 text-emerald-600">{t.common.active}</span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">{t.common.inactive}</span>
                    )}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip content={t.common.edit}>
                        <button onClick={() => handleEdit(student)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.common.delete}>
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
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
              {t.common.show} {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} {t.common.records}, {t.common.total} {pagination.total} {t.common.records}
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

      {/* Add Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.students.addTitle}</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.studentNo} *</label>
                <input type="text" className={inputStyle} value={addForm.student_no} onChange={(e) => setAddForm({...addForm, student_no: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.username} *</label>
                <input type="text" className={inputStyle} value={addForm.username} onChange={(e) => setAddForm({...addForm, username: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.name} *</label>
                <input type="text" className={inputStyle} value={addForm.full_name} onChange={(e) => setAddForm({...addForm, full_name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.email}</label>
                <input type="email" className={inputStyle} value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.phone} *</label>
                <input type="text" className={inputStyle} value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.class} *</label>
                <div 
                  onClick={handleOpenClassSelect}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 cursor-pointer hover:bg-white hover:border-blue-200 transition-all flex items-center justify-between"
                >
                  <span className={selectedClass ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                    {selectedClass ? selectedClass.name : t.admin.students.selectClass}
                  </span>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
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

      {/* Edit Student Modal */}
      {editModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.students.editTitle}</h2>
              <button onClick={() => setEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.studentNo}</label>
                <input type="text" className={inputStyle} value={editForm.student_no} onChange={(e) => setEditForm({...editForm, student_no: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.name}</label>
                <input type="text" className={inputStyle} value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.email}</label>
                <input type="email" className={inputStyle} value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.phone}</label>
                <input type="text" className={inputStyle} value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.columns.class}</label>
                <div 
                  onClick={() => {
                    setClassSelectModalOpen(true);
                    loadClasses();
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 cursor-pointer hover:bg-white hover:border-blue-200 transition-all flex items-center justify-between"
                >
                  <span className={Array.isArray(classes) && classes.find(c => c.id === editForm.class_id) ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                    {Array.isArray(classes) && classes.find(c => c.id === editForm.class_id)?.name || t.admin.students.selectClass}
                  </span>
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </div>
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

      {/* Class Selection Modal */}
      {classSelectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t.admin.students.classFilter.title}</h2>
                <p className="text-slate-500 mt-1">{t.admin.students.selectClass}</p>
              </div>
              <button onClick={() => setClassSelectModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* Filter Section */}
            <div className="p-6 bg-slate-50 border-b border-slate-100">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.classFilter.major}</label>
                  <select 
                    className={selectStyle}
                    value={classFilter.major_id}
                    onChange={(e) => setClassFilter({...classFilter, major_id: parseInt(e.target.value)})}
                  >
                    <option value="0">{t.common.all}</option>
                    {Array.isArray(majors) && majors.map((major) => (
                      <option key={major.id} value={major.id}>{major.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.students.classFilter.grade}</label>
                  <input 
                    type="text"
                    className={inputStyle}
                    placeholder={t.admin.students.classFilter.grade}
                    value={classFilter.grade}
                    onChange={(e) => setClassFilter({...classFilter, grade: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="button"
                    onClick={handleClassFilterChange}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                  >
                    {t.common.filter}
                  </button>
                </div>
              </div>
            </div>

            {/* Classes List */}
            <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
              <div className="grid gap-3">
                {Array.isArray(classes) && classes.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => handleSelectClass(cls.id)}
                    className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-200 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{cls.name}</h3>
                          {cls.grade && <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">{cls.grade}</span>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="font-medium text-slate-700">{cls.major_name || '-'}</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                    </div>
                  </button>
                ))}
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
          const result = await adminService.importStudents(file);
          return result;
        }}
        templateUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/students/template`}
        title={t.admin.bulkImport.title + ' - ' + t.admin.students.title}
        description={t.admin.students.subtitle}
      />
    </div>
  );
}
