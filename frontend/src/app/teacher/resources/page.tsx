"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { teachingResourceService, TeachingResource } from '@/services/teachingResource.service';
import { resourceFolderService, FolderTreeNode } from '@/services/resourceFolder.service';
import { knowledgeGraphService, KnowledgeGraph, GraphTree, KnowledgeNode } from '@/services/knowledgeGraph.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';
import Toast from '@/components/common/Toast';

export default function TeachingResourcesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  // 基础状态
  const [resources, setResources] = useState<TeachingResource[]>([]);
  const [displayedResources, setDisplayedResources] = useState<TeachingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'folder' | 'knowledge'>('folder');
  
  // 文件夹相关状态
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<number>>(new Set());
  
  // 知识图谱相关状态
  const [knowledgeGraphs, setKnowledgeGraphs] = useState<KnowledgeGraph[]>([]);
  const [selectedGraphId, setSelectedGraphId] = useState<number | null>(null);
  const [graphTree, setGraphTree] = useState<GraphTree | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<number>>(new Set());
  
  // 排序状态
  const [sortBy, setSortBy] = useState<'created_at' | 'resource_name'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 筛选和分页状态
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Modal和表单状态
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<TeachingResource | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [resourceName, setResourceName] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState<string>('');
  const [resourceFolderId, setResourceFolderId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Toast状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // 获取当前教师ID
  const getTeacherId = (): number | undefined => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.id;
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
    return undefined;
  };

  // 获取文件夹完整路径
  const getFolderPath = (folderId: number | null): string => {
    if (!folderId) return t.teacher.teachingResources.folder.noFolder;
    
    const findPath = (nodes: FolderTreeNode[], targetId: number, path: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return [...path, node.folder_name];
        }
        if (node.children && node.children.length > 0) {
          const result = findPath(node.children, targetId, [...path, node.folder_name]);
          if (result) return result;
        }
      }
      return null;
    };
    
    const pathArray = findPath(folderTree, folderId);
    return pathArray ? pathArray.join(' / ') : `#${folderId}`;
  };

  // 获取知识点完整路径
  const getKnowledgePointPath = (knowledgePoint: string | null): string => {
    if (!knowledgePoint) return '-';
    
    // 如果graphTree存在，尝试查找完整路径
    if (graphTree && graphTree.tree) {
      const findPath = (nodes: KnowledgeNode[], targetName: string, path: string[] = []): string[] | null => {
        for (const node of nodes) {
          if (node.node_name === targetName) {
            return [...path, node.node_name];
          }
          if (node.children && node.children.length > 0) {
            const result = findPath(node.children, targetName, [...path, node.node_name]);
            if (result) return result;
          }
        }
        return null;
      };
      
      const pathArray = findPath(graphTree.tree, knowledgePoint);
      if (pathArray) return pathArray.join(' / ');
    }
    
    // 如果找不到，直接返回知识点名称
    return knowledgePoint;
  };
  
  // 渲染文件类型标签
  const renderTypeLabel = (type: string) => {
    const typeMap: { [key: string]: { label: string; color: string } } = {
      'pdf': { label: 'PDF', color: 'bg-red-100 text-red-700' },
      'word': { label: 'Word', color: 'bg-blue-100 text-blue-700' },
      'excel': { label: 'Excel', color: 'bg-green-100 text-green-700' },
      'ppt': { label: 'PPT', color: 'bg-orange-100 text-orange-700' },
      'video': { label: 'MP4', color: 'bg-purple-100 text-purple-700' },
      'markdown': { label: 'MD', color: 'bg-gray-100 text-gray-700' },
      'image': { label: 'IMG', color: 'bg-pink-100 text-pink-700' },
      'zip': { label: 'ZIP', color: 'bg-yellow-100 text-yellow-700' },
      'txt': { label: 'TXT', color: 'bg-gray-100 text-gray-600' },
      'question': { label: '试题', color: 'bg-indigo-100 text-indigo-700' },
    };
    
    const typeInfo = typeMap[type.toLowerCase()] || { label: type.toUpperCase(), color: 'bg-gray-100 text-gray-500' };
    
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    );
  };

  // 初始化加载
  useEffect(() => {
    const teacherId = getTeacherId();
    if (teacherId) {
      if (viewMode === 'folder') {
        loadFolderTree(teacherId);
      } else {
        loadKnowledgeGraphs(teacherId);
      }
    }
  }, [viewMode]);

  // 防止浏览器默认拖拽行为
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  // 加载文件夹树
  const loadFolderTree = async (teacherId: number) => {
    try {
      setLoading(true);
      const tree = await resourceFolderService.getFolderTree(teacherId);
      setFolderTree(tree);
      
      // 默认展开所有根文件夹
      if (tree && tree.length > 0) {
        const rootFolderIds = new Set<number>();
        tree.forEach(folder => {
          rootFolderIds.add(folder.id);
        });
        setExpandedFolderIds(rootFolderIds);
      }
    } catch (error: any) {
      console.error('Failed to load folder tree:', error);
      setToast({ message: '加载文件夹树失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 加载知识图谱列表
  const loadKnowledgeGraphs = async (teacherId: number) => {
    try {
      setLoading(true);
      const graphs = await knowledgeGraphService.getAll(teacherId);
      setKnowledgeGraphs(graphs);
      if (graphs.length > 0 && !selectedGraphId) {
        // 默认选择第一个图谱
        setSelectedGraphId(graphs[0].id);
        loadGraphTree(graphs[0].id, teacherId);
      }
    } catch (error: any) {
      console.error('Failed to load knowledge graphs:', error);
      setToast({ message: '加载知识图谱失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 加载图谱树
  const loadGraphTree = async (graphId: number, teacherId: number) => {
    try {
      const tree = await knowledgeGraphService.getTree(graphId, teacherId);
      setGraphTree(tree);
      
      // 默认展开所有根节点
      if (tree && tree.tree) {
        const rootNodeIds = new Set<number>();
        tree.tree.forEach((node: KnowledgeNode) => {
          rootNodeIds.add(node.id);
        });
        setExpandedNodeIds(rootNodeIds);
      }
    } catch (error: any) {
      console.error('Failed to load graph tree:', error);
      setToast({ message: '加载知识图谱树失败', type: 'error' });
    }
  };

  // 点击文件夹，加载该文件夹及子文件夹的资源
  const handleFolderClick = async (folderId: number) => {
    const teacherId = getTeacherId();
    if (!teacherId) return;
    
    try {
      setLoading(true);
      setSelectedFolderId(folderId);
      const result = await resourceFolderService.getFolderResourcesRecursive(folderId, teacherId);
      setResources(result.resources || []);
    } catch (error: any) {
      console.error('Failed to load folder resources:', error);
      setToast({ message: '加载资源失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 点击知识图谱节点，加载该节点及子节点的资源
  const handleNodeClick = async (nodeId: number) => {
    const teacherId = getTeacherId();
    if (!teacherId || !selectedGraphId) return;
    
    try {
      setLoading(true);
      setSelectedNodeId(nodeId);
      const result = await knowledgeGraphService.getNodeResourcesRecursive(selectedGraphId, nodeId, teacherId);
      setResources(result.resources || []);
    } catch (error: any) {
      console.error('Failed to load node resources:', error);
      setToast({ message: '加载资源失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 切换文件夹展开/折叠
  const toggleFolderExpand = (folderId: number) => {
    const newExpanded = new Set(expandedFolderIds);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolderIds(newExpanded);
  };

  // 切换节点展开/折叠
  const toggleNodeExpand = (nodeId: number) => {
    const newExpanded = new Set(expandedNodeIds);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodeIds(newExpanded);
  };

  // 排序、筛选和分页资源
  useEffect(() => {
    // 筛选
    let filtered = resources;
    if (filterType !== 'all') {
      filtered = resources.filter(r => r.resource_type.toLowerCase() === filterType.toLowerCase());
    }
    
    // 排序
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        compareValue = dateA - dateB;
      } else if (sortBy === 'resource_name') {
        compareValue = a.resource_name.localeCompare(b.resource_name);
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    setDisplayedResources(sorted);
    setCurrentPage(1); // 重置到第一页
  }, [resources, sortBy, sortOrder, filterType]);
  
  // 计算分页数据
  const totalPages = Math.ceil(displayedResources.length / pageSize);
  const paginatedResources = displayedResources.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 切换排序
  const handleSort = (field: 'created_at' | 'resource_name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'created_at' ? 'desc' : 'asc');
    }
  };

  // 打开编辑Modal
  const handleEditResource = (resource: TeachingResource) => {
    setEditingResource(resource);
    setResourceName(resource.resource_name);
    setKnowledgePoint(resource.knowledge_point || '');
    setResourceFolderId(resource.folder_id ?? null);
    setEditModalOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingResource) return;
    
    // 验证必填项
    if (!resourceName.trim()) {
      setToast({ message: t.teacher.teachingResources.resourceNamePlaceholder, type: 'warning' });
      return;
    }
    
    if (!resourceFolderId) {
      setToast({ message: '请选择文件夹', type: 'warning' });
      return;
    }
    
    if (!knowledgePoint.trim()) {
      setToast({ message: '请输入知识点', type: 'warning' });
      return;
    }
    
    try {
      const teacherId = getTeacherId();
      if (!teacherId) {
        setToast({ message: '无法获取教师ID', type: 'error' });
        return;
      }
      
      await teachingResourceService.updateResource(editingResource.id, {
        resource_name: resourceName,
        knowledge_point: knowledgePoint,
        folder_id: resourceFolderId ?? undefined,
      });
      
      setToast({ message: t.teacher.teachingResources.updateSuccess, type: 'success' });
      setEditModalOpen(false);
      setEditingResource(null);
      setResourceName('');
      setKnowledgePoint('');
      setResourceFolderId(null);
      
      // 重新加载资源列表
      if (viewMode === 'folder' && selectedFolderId) {
        await handleFolderClick(selectedFolderId);
      } else if (viewMode === 'knowledge' && selectedNodeId) {
        await handleNodeClick(selectedNodeId);
      }
    } catch (error: any) {
      console.error('Failed to update resource:', error);
      setToast({ message: error.response?.data?.detail || t.teacher.teachingResources.updateError, type: 'error' });
    }
  };

  // 上传资源
  const handleUploadResource = async () => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      setToast({ message: '无法获取教师信息', type: 'error' });
      return;
    }
    if (!uploadFile) {
      setToast({ message: '请选择文件', type: 'warning' });
      return;
    }
    
    // 验证必填项
    if (!resourceName.trim()) {
      setToast({ message: '请输入资源名称', type: 'warning' });
      return;
    }
    
    if (!resourceFolderId) {
      setToast({ message: '请选择文件夹', type: 'warning' });
      return;
    }
    
    if (!knowledgePoint.trim()) {
      setToast({ message: '请输入知识点', type: 'warning' });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await teachingResourceService.uploadResource(
        uploadFile,
        {
          resource_name: resourceName,
          knowledge_point: knowledgePoint,
          folder_id: resourceFolderId,
        },
        teacherId,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      setUploadProgress(100);
      setToast({ message: '上传成功', type: 'success' });
      
      setTimeout(() => {
        setUploadModalOpen(false);
        resetUploadForm();
        setIsUploading(false);
        setUploadProgress(0);
        
        // 重新加载资源
        if (viewMode === 'folder' && selectedFolderId) {
          handleFolderClick(selectedFolderId);
        } else if (viewMode === 'knowledge' && selectedNodeId) {
          handleNodeClick(selectedNodeId);
        }
      }, 500);
    } catch (error: any) {
      console.error('Failed to upload resource:', error);
      setToast({ message: '上传失败: ' + (error.response?.data?.detail || error.message), type: 'error' });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setResourceName('');
    setKnowledgePoint('');
    setResourceFolderId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!resourceName) {
        setResourceName(file.name);
      }
    }
  };

  // 拖拽上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadFile(file);
      if (!resourceName) {
        setResourceName(file.name);
      }
    }
  };

  // WebOffice预览
  const handleWebOfficePreview = async (resource: TeachingResource) => {
    const supportedTypes = ['word', 'excel', 'ppt', 'pdf'];
    if (!supportedTypes.includes(resource.resource_type.toLowerCase())) {
      setToast({ message: '该文件类型不支持在线预览', type: 'warning' });
      return;
    }
    
    try {
      setToast({ message: '正在生成预览链接...', type: 'info' });
      
      const result = await teachingResourceService.getWebOfficePreviewUrl(resource.id, {
        expires: 3600,
        allow_export: true,
        allow_print: true,
        watermark: '内部资料'
      });
      
      if (result.success && result.preview_url) {
        window.open(result.preview_url, '_blank');
        setToast({ message: '预览链接已生成', type: 'success' });
      } else {
        setToast({ message: '生成预览链接失败', type: 'error' });
      }
    } catch (error: any) {
      console.error('Failed to get WebOffice preview URL:', error);
      const errorMsg = error.response?.data?.detail || error.message || '生成预览链接失败';
      setToast({ message: errorMsg, type: 'error' });
    }
  };

  // 渲染文件夹下拉选项（带缩进）
  const renderFolderOptions = (node: FolderTreeNode, level: number = 0): JSX.Element[] => {
    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(level); // 使用空格缩进
    const options: JSX.Element[] = [
      <option key={node.id} value={node.id}>
        {indent}{level > 0 ? '├─ ' : ''}{node.folder_name}
      </option>
    ];
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        options.push(...renderFolderOptions(child, level + 1));
      });
    }
    
    return options;
  };

  // 渲染知识点下拉选项（带缩进）
  const renderKnowledgeOptions = (node: KnowledgeNode, level: number = 0): JSX.Element[] => {
    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(level); // 使用空格缩进
    const options: JSX.Element[] = [
      <option key={node.id} value={node.node_name}>
        {indent}{level > 0 ? '├─ ' : ''}{node.node_name}
      </option>
    ];
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        options.push(...renderKnowledgeOptions(child, level + 1));
      });
    }
    
    return options;
  };

  // 渲染文件夹树节点
  const renderFolderTreeNode = (node: FolderTreeNode, level: number = 0) => {
    const isExpanded = expandedFolderIds.has(node.id);
    const isSelected = selectedFolderId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="folder-node">
        <div
          className={`folder-item flex items-center gap-2 py-2.5 px-3 cursor-pointer rounded-lg transition-all duration-200 ${
            isSelected 
              ? 'bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-l-4 border-[#2563EB] text-[#2563EB] font-semibold shadow-sm' 
              : 'hover:bg-[#F8FAFC] text-[#1E293B]'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => handleFolderClick(node.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpand(node.id);
              }}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${isSelected ? 'text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#2563EB]'}`}
            >
              ▶
            </button>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="flex-1 text-sm">{node.folder_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
            {node.resource_count}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div className="children mt-1">
            {node.children.map(child => renderFolderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 渲染知识图谱树节点
  const renderGraphTreeNode = (node: KnowledgeNode, level: number = 0) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="node-item">
        <div
          className={`flex items-center gap-2 py-2.5 px-3 cursor-pointer rounded-lg transition-all duration-200 ${
            isSelected 
              ? 'bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] border-l-4 border-[#2563EB] text-[#2563EB] font-semibold shadow-sm' 
              : 'hover:bg-[#F8FAFC] text-[#1E293B]'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => handleNodeClick(node.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpand(node.id);
              }}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${isSelected ? 'text-[#2563EB]' : 'text-[#94A3B8] hover:text-[#2563EB]'}`}
            >
              ▶
            </button>
          )}
          {!hasChildren && <span className="w-4" />}
          <span className="flex-1 text-sm">{node.node_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#2563EB] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
            {node.total_resource_count || 0}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div className="children mt-1">
            {node.children?.map((child: KnowledgeNode) => renderGraphTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{t.teacher.teachingResources.title}</h1>
                <p className="text-sm text-slate-600 mt-0.5">管理和查看教学资源</p>
              </div>
              <div className="view-mode-switch flex gap-2">
                <button
                  onClick={() => setViewMode('folder')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    viewMode === 'folder' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span>{t.teacher.teachingResources.viewMode.folder}</span>
                </button>
                <button
                  onClick={() => setViewMode('knowledge')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    viewMode === 'knowledge' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                  <span>{t.teacher.teachingResources.viewMode.knowledge}</span>
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/teacher/ai-creation')}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>AI创作</span>
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>{t.teacher.teachingResources.upload}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="main-content flex gap-6">
          {/* 左侧：树形结构 */}
          <div className="tree-panel w-1/5 bg-white rounded-xl border border-[#E2E8F0] p-4 max-h-[calc(100vh-180px)] overflow-y-auto text-sm shadow-sm hover:shadow-md transition-shadow duration-300">
            {viewMode === 'folder' ? (
              <div className="folder-tree">
                <h3 className="text-lg font-bold text-[#1E293B] mb-4 pb-3 border-b border-[#E2E8F0]" style={{ fontFamily: "'Poppins', sans-serif" }}>文件夹结构</h3>
                {loading ? (
                  <div className="text-center py-8 text-[#64748B]">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
                    <p className="mt-2">加载中...</p>
                  </div>
                ) : folderTree.length > 0 ? (
                  folderTree.map(node => renderFolderTreeNode(node))
                ) : (
                  <div className="text-center text-[#94A3B8] py-8">暂无文件夹</div>
                )}
              </div>
            ) : (
              <div className="knowledge-tree">
                <h3 className="text-lg font-bold text-[#1E293B] mb-4 pb-3 border-b border-[#E2E8F0]" style={{ fontFamily: "'Poppins', sans-serif" }}>知识图谱</h3>
                {/* 图谱选择 */}
                {knowledgeGraphs.length > 0 && (
                  <select
                    value={selectedGraphId || ''}
                    onChange={(e) => {
                      const graphId = parseInt(e.target.value);
                      setSelectedGraphId(graphId);
                      const teacherId = getTeacherId();
                      if (teacherId) {
                        loadGraphTree(graphId, teacherId);
                      }
                    }}
                    className="w-full mb-4 p-3 border-2 border-[#E2E8F0] rounded-lg focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] bg-white hover:border-[#CBD5E1]"
                  >
                    {knowledgeGraphs.map(graph => (
                      <option key={graph.id} value={graph.id}>{graph.graph_name}</option>
                    ))}
                  </select>
                )}
                {loading ? (
                  <div className="text-center py-8 text-[#64748B]">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
                    <p className="mt-2">加载中...</p>
                  </div>
                ) : graphTree && graphTree.tree && graphTree.tree.length > 0 ? (
                  graphTree.tree.map((node: KnowledgeNode) => renderGraphTreeNode(node))
                ) : (
                  <div className="text-center text-[#94A3B8] py-8">暂无节点</div>
                )}
              </div>
            )}
          </div>

          {/* 右侧：资源列表 */}
          <div className="resource-panel flex-1 bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            {/* 固定显示的筛选和排序区域 */}
            <div className="resource-list-header flex items-center justify-between mb-4 pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {t.teacher.teachingResources.table.name} 
                  <span className="text-sm text-[#64748B] font-normal ml-3">({displayedResources.length})</span>
                </h3>
                {/* 类型筛选 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B] font-medium">{t.teacher.teachingResources.filter.type}:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2 text-xs border-2 border-[#E2E8F0] rounded-lg bg-white hover:border-[#CBD5E1] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200"
                  >
                    <option value="all">{t.teacher.teachingResources.types.all}</option>
                    <option value="pdf">{t.teacher.teachingResources.types.pdf}</option>
                    <option value="word">{t.teacher.teachingResources.types.word}</option>
                    <option value="excel">{t.teacher.teachingResources.types.excel}</option>
                    <option value="ppt">{t.teacher.teachingResources.types.ppt}</option>
                    <option value="video">{t.teacher.teachingResources.types.video}</option>
                    <option value="markdown">{t.teacher.teachingResources.types.markdown}</option>
                    <option value="zip">{t.teacher.teachingResources.types.zip}</option>
                    <option value="txt">{t.teacher.teachingResources.types.txt}</option>
                    <option value="question">{t.teacher.teachingResources.types.question}</option>
                  </select>
                </div>
              </div>
              <div className="sorting-controls flex items-center gap-2">
                <span className="text-xs text-[#64748B] font-medium">{t.teacher.teachingResources.sort.name}:</span>
                <button
                  onClick={() => handleSort('created_at')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    sortBy === 'created_at' 
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-[#2563EB]/30' 
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] border border-[#E2E8F0]'
                  }`}
                >
                  {t.teacher.teachingResources.sort.time} {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('resource_name')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    sortBy === 'resource_name' 
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-lg shadow-[#2563EB]/30' 
                      : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#2563EB] border border-[#E2E8F0]'
                  }`}
                >
                  {t.teacher.teachingResources.sort.name} {sortBy === 'resource_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            {/* 表格形式的资源列表 */}
            {loading ? (
              <div className="text-center py-16 text-sm text-[#64748B]">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
                <p className="mt-4">{t.common.loading}</p>
              </div>
            ) : displayedResources.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-[#1E293B]">{t.teacher.teachingResources.table.name}</th>
                        <th className="px-4 py-3 text-left w-20 font-semibold text-[#1E293B]">{t.teacher.teachingResources.table.type}</th>
                        <th className="px-4 py-3 text-left font-semibold text-[#1E293B]">{t.teacher.teachingResources.table.folder}</th>
                        <th className="px-4 py-3 text-left font-semibold text-[#1E293B]">{t.teacher.teachingResources.table.size}</th>
                        <th className="px-4 py-3 text-left font-semibold text-[#1E293B]">{t.teacher.teachingResources.table.knowledgePoint}</th>
                        <th className="px-4 py-3 text-left font-semibold text-[#1E293B]">{t.teacher.teachingResources.table.uploadTime}</th>
                        <th className="px-4 py-3 text-center w-24 font-semibold text-[#1E293B]">{t.teacher.teachingResources.table.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResources.map((resource) => (
                        <tr key={resource.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors duration-150">
                          <td className="px-4 py-3 text-[#1E293B] font-medium">{resource.resource_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center">
                              {renderTypeLabel(resource.resource_type)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#64748B]">
                            <span className="text-xs" title={getFolderPath(resource.folder_id ?? null)}>
                              {getFolderPath(resource.folder_id ?? null)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#64748B]">
                            {(resource.file_size / 1024).toFixed(1)} KB
                          </td>
                          <td className="px-4 py-3 text-[#64748B]">
                            <span className="text-xs" title={getKnowledgePointPath(resource.knowledge_point ?? null)}>
                              {getKnowledgePointPath(resource.knowledge_point ?? null)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#64748B]">
                            {new Date(resource.created_at).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditResource(resource)}
                                className="px-3 py-2 bg-[#10B981] text-white rounded-lg text-xs hover:bg-[#059669] transition-all duration-200 inline-flex items-center gap-1 shadow-sm hover:shadow-md"
                                title={t.common.edit}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleWebOfficePreview(resource)}
                                className="px-3 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-lg text-xs hover:from-[#1E40AF] hover:to-[#2563EB] transition-all duration-200 inline-flex items-center gap-1 shadow-sm hover:shadow-md"
                                title={t.teacher.teachingResources.preview}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页组件 - 始终显示 */}
                <div className="pagination mt-4 flex items-center justify-between text-xs border-t pt-3">
                  <div className="text-gray-600">
                    {t.teacher.teachingResources.pagination.total} {displayedResources.length} {t.teacher.teachingResources.pagination.items}
                    {totalPages > 1 && (
                      <span className="ml-2 text-gray-500">
                        ({t.teacher.teachingResources.pagination.page} {currentPage}/{totalPages})
                      </span>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-xs"
                      >
                        {t.common.previous}
                      </button>
                      <span className="text-gray-600 px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-xs"
                      >
                        {t.common.next}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8 text-sm">
                {t.teacher.teachingResources.table.selectFolderOrNode}
              </div>
            )}
          </div>
        </div>

        {/* 上传Modal */}
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => {
            if (!isUploading) {
              setUploadModalOpen(false);
              resetUploadForm();
            }
          }}
          title="上传教学资源"
        >
          <div className="upload-form space-y-4">
            {/* 文件选择区域 */}
            <div
              className={`upload-area border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <svg className="w-16 h-16 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div className="text-gray-600">
                {uploadFile ? uploadFile.name : '点击或拖拽文件到这里上传'}
              </div>
            </div>

            {/* 资源名称 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                资源名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="输入资源名称"
                className="w-full p-2 border rounded"
                disabled={isUploading}
              />
            </div>

            {/* 所属文件夹 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                所属文件夹 <span className="text-red-500">*</span>
              </label>
              <select
                value={resourceFolderId ?? ''}
                onChange={(e) => setResourceFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded"
                disabled={isUploading}
              >
                <option value="">请选择文件夹</option>
                {folderTree.map(folder => renderFolderOptions(folder, 0))}
              </select>
            </div>

            {/* 知识点 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                知识点 <span className="text-red-500">*</span>
              </label>
              <select
                value={knowledgePoint}
                onChange={(e) => setKnowledgePoint(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isUploading}
              >
                <option value="">请选择知识点</option>
                {graphTree && graphTree.tree && graphTree.tree.map(node => renderKnowledgeOptions(node, 0))}
              </select>
            </div>

            {/* 上传进度 */}
            {isUploading && (
              <div className="upload-progress">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">上传中...</span>
                  <span className="text-sm font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 按钮 */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  resetUploadForm();
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                disabled={isUploading}
              >
                取消
              </button>
              <button
                onClick={handleUploadResource}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                disabled={!uploadFile || isUploading}
              >
                上传
              </button>
            </div>
          </div>
        </Modal>

        {/* 编辑资源Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingResource(null);
            setResourceName('');
            setKnowledgePoint('');
            setResourceFolderId(null);
          }}
          title="编辑资源信息"
        >
          <div className="edit-form space-y-4">
            {/* 资源名称 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                资源名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="输入资源名称"
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 所属文件夹 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                所属文件夹 <span className="text-red-500">*</span>
              </label>
              <select
                value={resourceFolderId ?? ''}
                onChange={(e) => setResourceFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="">请选择文件夹</option>
                {folderTree.map(folder => renderFolderOptions(folder, 0))}
              </select>
            </div>

            {/* 知识点 */}
            <div>
              <label className="block text-sm font-medium mb-1">
                知识点 <span className="text-red-500">*</span>
              </label>
              <select
                value={knowledgePoint}
                onChange={(e) => setKnowledgePoint(e.target.value)}
                className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="">请选择知识点</option>
                {graphTree && graphTree.tree && graphTree.tree.map(node => renderKnowledgeOptions(node, 0))}
              </select>
            </div>

            {/* 按钮 */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingResource(null);
                  setResourceName('');
                  setKnowledgePoint('');
                  setResourceFolderId(null);
                }}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                保存
              </button>
            </div>
          </div>
        </Modal>

        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </TeacherLayout>
  );
}

