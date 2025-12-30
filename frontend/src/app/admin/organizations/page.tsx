"use client";

import { useState, useEffect } from 'react';
import { organizationService, Organization, OrganizationCreate, OrganizationUpdate } from '@/services/organization.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Tooltip from '@/components/common/Tooltip';
import Toast from '@/components/common/Toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
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

  const [searchKeyword, setSearchKeyword] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list'); // 视图模式：列表或树形
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set()); // 展开的节点ID集合

  // 当搜索关键词变化时，重置到第一页并重新加载
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrganizations(1);
    }, 300); // 防抖：300ms延迟
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const loadOrganizations = async (page?: number) => {
    try {
      setLoading(true);
      const currentPage = page || pagination.current;
      const skip = (currentPage - 1) * pagination.pageSize;
      
      const data = await organizationService.getAll({
        skip,
        limit: pagination.pageSize,
        search: searchKeyword || undefined
      });
      
      if (data && Array.isArray(data.items)) {
        setOrganizations(data.items);
        setTreeData(data.tree || []);
        setPagination(prev => ({
          ...prev,
          current: currentPage,
          total: data.total || 0
        }));
      } else {
        setOrganizations([]);
        setTreeData([]);
        setPagination(prev => ({
          ...prev,
          current: 1,
          total: 0
        }));
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

  const handleAddChild = (parentOrg: Organization) => {
    setAddForm({
      name: '',
      parent_id: parentOrg.id
    });
    setAddModalOpen(true);
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
      setToast({ message: t.common.success, type: 'success' });
      loadOrganizations();
    } catch (err: any) {
      console.error('Failed to create organization:', err);
      setToast({ message: t.common.error + ': ' + (err.response?.data?.detail || err.message), type: 'error' });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;
    
    try {
      await organizationService.update(editingOrg.id, editForm);
      setEditModalOpen(false);
      setEditingOrg(null);
      setToast({ message: t.common.success, type: 'success' });
      loadOrganizations();
    } catch (err: any) {
      console.error('Failed to update organization:', err);
      setToast({ message: t.common.error + ': ' + (err.response?.data?.detail || err.message), type: 'error' });
    }
  };

  const handleDelete = async (orgId: number) => {
    setConfirmDialog({
      title: t.admin.organizations.deleteConfirm.title || t.common.confirm,
      message: t.admin.organizations.deleteConfirm.message || t.common.confirm + '?',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await organizationService.delete(orgId);
          setToast({ message: t.common.deleteSuccess || t.common.success, type: 'success' });
          loadOrganizations();
        } catch (err: any) {
          console.error('Failed to delete organization:', err);
          const errorMessage = err.response?.data?.detail || err.message || t.common.error;
          
          // 检查是否是有关联专业的错误
          if (errorMessage.includes('major') || errorMessage.includes('专业') || (errorMessage.includes('associated') && errorMessage.includes('major'))) {
            setToast({ message: t.admin.organizations.deleteError.hasMajors, type: 'error' });
          }
          // 检查是否是有关联子组织的错误
          else if (errorMessage.includes('children') || errorMessage.includes('子组织')) {
            setToast({ message: t.admin.organizations.deleteError.hasChildren, type: 'error' });
          }
          else {
            setToast({ message: t.common.error + ': ' + errorMessage, type: 'error' });
          }
        }
      }
    });
  };

  const getParentName = (parentId: number | null): string => {
    if (!parentId) return t.admin.organizations.rootNode;
    const parent = organizations.find(o => o.id === parentId);
    return parent ? parent.name : '-';
  };

  const getAllOrganizationsFlat = (nodes: Organization[], currentLevel: number = 0): Organization[] => {
    let result: Organization[] = [];
    const traverse = (items: Organization[], level: number) => {
      items.forEach(item => {
        result.push({ ...item, level });
        if (item.children && item.children.length > 0) {
          traverse(item.children, level + 1);
        }
      });
    };
    traverse(nodes, currentLevel);
    return result;
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";
  const selectStyle = "w-full px-4 py-3 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right:0.5rem_center] bg-no-repeat pr-10 cursor-pointer hover:border-blue-300";
  const selectInlineStyle = {
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    appearance: 'none' as const
  };

  const allOrgsFlat = getAllOrganizationsFlat(treeData);
  const maxDepth = organizations.length > 0 ? Math.max(...organizations.map(o => o.level || 0)) : 0;

  // Toggle node expansion
  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Initialize default expanded nodes (L0 and L1)
  useEffect(() => {
    if (treeData.length > 0 && expandedNodes.size === 0) {
      const initialExpanded = new Set<number>();
      treeData.forEach(node => {
        initialExpanded.add(node.id); // L0
        if (node.children) {
          node.children.forEach(child => initialExpanded.add(child.id)); // L1
        }
      });
      setExpandedNodes(initialExpanded);
    }
  }, [treeData]);

  // Render tree nodes recursively
  // 渲染单个组织卡片
  const renderOrgCard = (node: Organization, level: number) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    const levelGradients = [
      'from-blue-500 to-blue-600',  // Level 0
      'from-emerald-500 to-emerald-600',  // Level 1
      'from-violet-500 to-violet-600',  // Level 2
      'from-amber-500 to-amber-600',  // Level 3
      'from-rose-500 to-rose-600',  // Level 4+
    ];
    const gradientClass = levelGradients[Math.min(level, levelGradients.length - 1)];

    return (
      <div className="inline-block">
        <div className={`bg-gradient-to-br ${gradientClass} rounded-2xl p-1 shadow-lg hover:shadow-xl transition-all`}>
          <div className="bg-white rounded-xl p-4 min-w-[220px] max-w-[260px]">
            {/* 图标和标题 */}
            <div className="flex items-start gap-2 mb-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 flex-1 line-clamp-2 leading-tight">{node.name}</h3>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
              <div className="text-center p-1 bg-slate-50 rounded">
                <div className="font-bold text-slate-900">{node.majors_count || 0}</div>
                <div className="text-slate-500 text-[10px]">专业</div>
              </div>
              <div className="text-center p-1 bg-slate-50 rounded">
                <div className="font-bold text-slate-900">{node.classes_count || 0}</div>
                <div className="text-slate-500 text-[10px]">班级</div>
              </div>
              <div className="text-center p-1 bg-slate-50 rounded">
                <div className="font-bold text-slate-900">{node.students_count || 0}</div>
                <div className="text-slate-500 text-[10px]">学生</div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-center gap-1 pt-2 border-t border-slate-100">
              <button onClick={() => handleView(node)} className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors" title="查看">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
              </button>
              <button onClick={() => handleAddChild(node)} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="添加下级">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
              <button onClick={() => handleEdit(node)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="编辑">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </button>
              <button onClick={() => handleDelete(node.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="删除">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>

          {/* 展开/收起按钮 */}
          {hasChildren && (
            <div className="flex justify-center -mb-3 mt-1">
              <button
                onClick={() => toggleNode(node.id)}
                className="w-6 h-6 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10 relative"
              >
                <svg
                  className={`w-3.5 h-3.5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染组织树（从上到下，像屋顶一样展开）
  const renderTreeNodes = (nodes: Organization[], level: number): JSX.Element[] => {
    if (!nodes || nodes.length === 0) return [];

    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);

      const levelColors = [
        'bg-blue-50 border-blue-400',  // Level 0
        'bg-emerald-50 border-emerald-400',  // Level 1
        'bg-violet-50 border-violet-400',  // Level 2
        'bg-amber-50 border-amber-400',  // Level 3
        'bg-rose-50 border-rose-400',  // Level 4+
      ];
      const colorClass = levelColors[Math.min(level, levelColors.length - 1)];

      return (
        <div key={node.id} className="flex flex-col items-center mb-4">
          {/* 节点卡片 */}
          {renderOrgCard(node, level)}

          {/* 子节点区域 */}
          {hasChildren && isExpanded && (
            <div className="relative mt-6">
              {/* 连接线：从父节点向下 */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-0.5 h-6 bg-gradient-to-b from-slate-300 to-slate-400"></div>
              
              {/* 子节点横向排列 */}
              <div className="flex gap-6 items-start justify-center">
                {renderTreeNodes(node.children!, level + 1)}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.organizations.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.organizations.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 搜索输入框 */}
          <div className="relative">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t.common.search + ' ' + t.admin.organizations.columns.name}
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
            onClick={() => setViewMode(viewMode === 'list' ? 'tree' : 'list')}
            className="px-6 py-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-full font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
          >
            {viewMode === 'list' ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                </svg>
                {t.admin.organizations.viewMode.switchToTree}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                </svg>
                {t.admin.organizations.viewMode.switchToList}
              </>
            )}
          </button>
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

      {/* Organizations Table or Tree View */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
        {viewMode === 'tree' ? (
          /* Tree View */
          <div className="overflow-x-auto overflow-y-auto flex-1 p-8">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : treeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                <p className="text-sm">{t.admin.organizations.emptyHint}</p>
              </div>
            ) : (
              <div className="min-w-full p-8 flex justify-center">
                {/* Render Tree */}
                <div className="inline-flex flex-col items-center">
                  {renderTreeNodes(treeData, 0)}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List View - Table */
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full" style={{ minWidth: '1100px' }}>
            <thead className="bg-white sticky top-0 z-[5]">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100" style={{ minWidth: '200px' }}>{t.admin.organizations.columns.name}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100" style={{ minWidth: '150px' }}>{t.admin.organizations.columns.parent}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.level}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.majors}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.classes}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.organizations.columns.students}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100" style={{ minWidth: '120px' }}>{t.admin.organizations.columns.updater}</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100" style={{ minWidth: '140px' }}>{t.admin.organizations.columns.updatedAt}</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 sticky right-0 bg-white z-[10]">{t.admin.organizations.columns.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {!loading && Array.isArray(organizations) && organizations.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                      <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                      <p className="text-sm">{t.admin.organizations.emptyHint}</p>
                    </div>
                  </td>
                </tr>
              )}
              {Array.isArray(organizations) && organizations.map((org) => {
                // 根据层级定义颜色
                const levelColors = [
                  'bg-blue-50 border-l-4 border-blue-500',  // Level 0 - 根节点
                  'bg-emerald-50 border-l-4 border-emerald-400',  // Level 1
                  'bg-violet-50 border-l-4 border-violet-400',  // Level 2
                  'bg-amber-50 border-l-4 border-amber-400',  // Level 3
                  'bg-rose-50 border-l-4 border-rose-400',  // Level 4+
                ];
                const levelColor = levelColors[Math.min(org.level || 0, levelColors.length - 1)];
                
                return (
                <tr key={org.id} className={`hover:bg-slate-100 transition-all group ${levelColor}`}>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${(org.level || 0) * 32}px` }}>
                        {(org.level || 0) > 0 && (
                          <div className="flex items-center gap-1">
                            {/* 层级连接线 */}
                            <div className="w-6 h-px bg-slate-300"></div>
                            {/* 层级图标 */}
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </div>
                        )}
                        {org.level === 0 && (
                          <svg className="w-5 h-5 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                          </svg>
                        )}
                        <div className={`text-sm font-bold ${org.level === 0 ? 'text-blue-900' : 'text-slate-900'}`}>{org.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{getParentName(org.parent_id)}</span>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    {org.level === 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                        {t.admin.organizations.rootNode}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">L{org.level}</span>
                    )}
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
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{org.updater_name || '-'}</span>
                  </td>
                  <td className="px-8 py-4">
                    {org.updated_at ? (
                      <div className="text-sm text-slate-600">
                        <div className="font-medium">{new Date(org.updated_at).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-500">{new Date(org.updated_at).toLocaleTimeString()}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-600">-</span>
                    )}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap text-right sticky right-0 bg-white z-[10]">
                    <div className="flex items-center justify-end gap-2">
                      <Tooltip content={t.common.view}>
                        <button onClick={() => handleView(org)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                      </Tooltip>
                      <Tooltip content={t.admin.organizations.addChild}>
                        <button onClick={() => handleAddChild(org)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
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
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination - Only show in list mode */}
        {viewMode === 'list' && pagination.total > 0 && (
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
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
                    style={selectInlineStyle}
                    value={addForm.parent_id || ''}
                    onChange={(e) => setAddForm({...addForm, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="" className="py-2">{t.admin.organizations.noParent}</option>
                    {allOrgsFlat.map((org) => (
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
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  {treeData.length > 0 && addForm.parent_id === null 
                    ? t.admin.organizations.rootExists 
                    : t.admin.organizations.selectParentHint}
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
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm hover:border-slate-300 cursor-pointer"
                    style={selectInlineStyle}
                    value={editForm.parent_id || ''}
                    onChange={(e) => setEditForm({...editForm, parent_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="" className="py-2">{t.admin.organizations.noParent}</option>
                    {allOrgsFlat.filter(o => o.id !== editingOrg.id).map((org) => (
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
                <p className="text-xs text-slate-500 mt-2 ml-1">
                  {treeData.length > 0 && editForm.parent_id === null && editingOrg.parent_id !== null
                    ? t.admin.organizations.rootExists 
                    : t.admin.organizations.selectParentHint}
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
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{viewingOrg.name}</h2>
              <button onClick={() => setViewModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.name}</label>
                <p className="text-base font-semibold text-slate-900">{viewingOrg.name}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.parent}</label>
                <p className="text-base text-slate-700">{getParentName(viewingOrg.parent_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.level}</label>
                <p className="text-base text-slate-700">L{viewingOrg.level || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.majors}</label>
                <p className="text-base text-slate-700">{viewingOrg.majors_count || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.classes}</label>
                <p className="text-base text-slate-700">{viewingOrg.classes_count || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.students}</label>
                <p className="text-base text-slate-700">{viewingOrg.students_count || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.creator}</label>
                <p className="text-base text-slate-700">{viewingOrg.creator_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.createdAt}</label>
                <p className="text-base text-slate-700">
                  {viewingOrg.created_at ? new Date(viewingOrg.created_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.updater}</label>
                <p className="text-base text-slate-700">{viewingOrg.updater_name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">{t.admin.organizations.columns.updatedAt}</label>
                <p className="text-base text-slate-700">
                  {viewingOrg.updated_at ? new Date(viewingOrg.updated_at).toLocaleString() : '-'}
                </p>
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={t.common.confirm}
          cancelText={t.common.cancel}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          type="danger"
        />
      )}
    </div>
  );
}

