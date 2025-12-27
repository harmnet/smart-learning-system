"use client";

import { useState, useEffect } from 'react';
import { organizationService, Organization, OrganizationCreate, OrganizationUpdate } from '@/services/organization.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Tooltip from '@/components/common/Tooltip';
import BulkImportModal from '@/components/admin/BulkImportModal';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminOrganizationsPage() {
  const { t } = useLanguage();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [treeData, setTreeData] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [addForm, setAddForm] = useState<OrganizationCreate>({
    name: '',
    parent_id: null
  });

  const [editForm, setEditForm] = useState<OrganizationUpdate>({
    name: '',
    parent_id: null
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async (page?: number) => {
    try {
      setLoading(true);
      const currentPage = page || pagination.current;
      const skip = (currentPage - 1) * pagination.pageSize;
      
      const data = await organizationService.getAll({
        skip,
        limit: pagination.pageSize
      });
      
      if (data && Array.isArray(data.items)) {
        setOrganizations(data.items);
        setTreeData(data.tree || []);
        setPagination({
          ...pagination,
          current: currentPage,
          total: data.total || 0
        });
      } else {
        setOrganizations([]);
        setTreeData([]);
        setPagination({
          ...pagination,
          current: 1,
          total: 0
        });
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
      setOrganizations([]);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, current: page });
    loadOrganizations(page);
  };

  const handleView = (org: Organization) => {
    setViewingOrg(org);
    setViewModalOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setEditForm({
      name: org.name,
      parent_id: org.parent_id
    });
    setEditModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await organizationService.create(addForm);
      setAddModalOpen(false);
      setAddForm({
        name: '',
        parent_id: null
      });
      loadOrganizations();
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    
    try {
      await organizationService.update(editingOrg.id, editForm);
      setEditModalOpen(false);
      setEditingOrg(null);
      loadOrganizations();
    } catch (err: any) {
      console.error('Failed to update organization:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (orgId: number) => {
    if (!confirm(t.common.confirm + '?')) return;
    
    try {
      await organizationService.delete(orgId);
      loadOrganizations();
      alert(t.common.success);
    } catch (err: any) {
      console.error('Failed to delete organization:', err);
      const errorMessage = err.response?.data?.detail || err.message || t.common.error;
      
      // 检查是否是有关联专业的错误
      if (errorMessage.includes('major') || errorMessage.includes('专业') || (errorMessage.includes('associated') && errorMessage.includes('major'))) {
        alert(t.admin.organizations.deleteError.hasMajors);
      }
      // 检查是否是有关联子组织的错误
      else if (errorMessage.includes('children') || errorMessage.includes('子组织')) {
        alert(t.admin.organizations.deleteError.hasChildren);
      }
      else {
        alert(t.common.error + ': ' + errorMessage);
      }
    }
  };

  const getParentName = (parentId: number | null): string => {
    if (!parentId) return t.admin.organizations.rootNode;
    const parent = organizations.find(o => o.id === parentId);
    return parent ? parent.name : '-';
  };

  const getAllOrganizationsFlat = (nodes: Organization[]): Organization[] => {
    let result: Organization[] = [];
    const traverse = (items: Organization[]) => {
      items.forEach(item => {
        result.push(item);
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";
  const selectStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none transition-all shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right:0.5rem_center] bg-no-repeat pr-10 cursor-pointer hover:border-blue-300";

  const allOrgsFlat = getAllOrganizationsFlat(treeData);
  const maxDepth = organizations.length > 0 ? Math.max(...organizations.map(o => o.level || 0)) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.organizations.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.organizations.subtitle}</p>
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
            {t.admin.organizations.addTitle}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: t.admin.organizations.stats.total, value: pagination.total, color: 'blue' },
          { label: t.admin.organizations.stats.root, value: treeData.length, color: 'emerald' },
          { label: t.admin.organizations.stats.depth, value: maxDepth + 1, color: 'violet' },
          { label: t.admin.organizations.stats.nodes, value: allOrgsFlat.length, color: 'slate' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-transparent hover:bg-blue-50/50 transition-colors group">
            <div className="text-3xl font-black text-slate-900 mb-1 tracking-tight">{stat.value}</div>
            <div className={`text-sm font-bold text-${stat.color}-600 uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity`}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Organizations Table */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-white sticky top-0 z-10">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.name}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.parent}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.level}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.majors}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.classes}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.students}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && Array.isArray(organizations) && organizations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                      <p className="text-sm">点击右上角"添加组织"按钮创建组织</p>
                    </div>
                  </td>
                </tr>
              )}
              {Array.isArray(organizations) && organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${(org.level || 0) * 24}px` }}>
                        {org.level && org.level > 0 && (
                          <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        )}
                        <div className="text-sm font-bold text-slate-900">{org.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{getParentName(org.parent_id)}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">L{org.level || 0}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-slate-900">{org.majors_count || 0}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-slate-900">{org.classes_count || 0}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-bold text-slate-900">{org.students_count || 0}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content={t.common.view}>
                        <button onClick={() => handleView(org)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.common.edit}>
                        <button onClick={() => handleEdit(org)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.common.delete}>
                        <button onClick={() => handleDelete(org.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
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

      {/* Add Organization Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.organizations.addTitle}</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.organizations.columns.name} *</label>
                <input type="text" className={inputStyle} value={addForm.name} onChange={(e) => setAddForm({...addForm, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.organizations.columns.parent}</label>
                <select 
                  className={selectStyle}
                  value={addForm.parent_id || ''}
                  onChange={(e) => setAddForm({...addForm, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">{t.admin.organizations.noParent}</option>
                  {allOrgsFlat.map((org) => (
                    <option key={org.id} value={org.id}>
                      {'  '.repeat(org.level || 0)}{org.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  {treeData.length > 0 && addForm.parent_id === null 
                    ? t.admin.organizations.rootExists 
                    : '选择上级组织，留空则创建根节点'}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Organization Modal */}
      {editModalOpen && editingOrg && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.organizations.editTitle}</h2>
              <button onClick={() => setEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.organizations.columns.name}</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.organizations.columns.parent}</label>
                <select 
                  className={selectStyle}
                  value={editForm.parent_id || ''}
                  onChange={(e) => setEditForm({...editForm, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                >
                  <option value="">{t.admin.organizations.noParent}</option>
                  {allOrgsFlat.filter(o => o.id !== editingOrg.id).map((org) => (
                    <option key={org.id} value={org.id}>
                      {'  '.repeat(org.level || 0)}{org.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  {treeData.length > 0 && editForm.parent_id === null && editingOrg.parent_id !== null
                    ? t.admin.organizations.rootExists 
                    : '选择上级组织，留空则设为根节点'}
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button type="submit" className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Organization Modal */}
      {viewModalOpen && viewingOrg && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{viewingOrg.name}</h2>
              <button onClick={() => setViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.name}</label>
                <p className="text-lg font-bold text-slate-900">{viewingOrg.name}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.parent}</label>
                <p className="text-lg text-slate-700">{getParentName(viewingOrg.parent_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.level}</label>
                <p className="text-lg text-slate-700">L{viewingOrg.level || 0}</p>
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
          loadOrganizations();
        }}
        onImport={async (file) => {
          const result = await organizationService.importOrganizations(file);
          return result;
        }}
        templateUrl={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/organizations/template`}
        title={t.admin.bulkImport.title + ' - ' + t.admin.organizations.title}
        description={t.admin.organizations.subtitle}
      />
    </div>
  );
}

