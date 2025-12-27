"use client";

import { useState, useEffect, useRef } from 'react';
import { teachingResourceService, TeachingResource } from '@/services/teachingResource.service';
import { resourceFolderService, ResourceFolder } from '@/services/resourceFolder.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';
import ResourcePreviewModal from '@/components/teacher/ResourcePreviewModal';
import KnowledgeGraphTreeSelect from '@/components/common/KnowledgeGraphTreeSelect';

export default function TeachingResourcesPage() {
  const { t } = useLanguage();
  const [resources, setResources] = useState<TeachingResource[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<ResourceFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'folder' | 'knowledge'>('folder'); // 查看维度：文件夹或知识点
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<string | null>(null); // 选中的知识点
  
  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editResourceModalOpen, setEditResourceModalOpen] = useState(false);
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<TeachingResource | null>(null);
  
  // Edit folder form states
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  
  // Form states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [resourceName, setResourceName] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [selectedResource, setSelectedResource] = useState<TeachingResource | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ResourceFolder | null>(null);
  const [moveItem, setMoveItem] = useState<{type: 'resource' | 'folder', id: number} | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);
  
  // Edit resource states
  const [editingResource, setEditingResource] = useState<TeachingResource | null>(null);
  const [editResourceName, setEditResourceName] = useState('');
  const [editKnowledgePoint, setEditKnowledgePoint] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  useEffect(() => {
    const teacherId = getTeacherId();
    if (teacherId) {
      if (viewMode === 'folder') {
        loadFolders(teacherId);
      }
      loadResources(teacherId);
    }
  }, [currentFolderId, selectedType, searchTerm, viewMode, selectedKnowledgePoint]);

  const loadFolders = async (teacherId: number) => {
    try {
      const data = await resourceFolderService.getFolders(teacherId, currentFolderId || undefined);
      setFolders(data);
    } catch (error: any) {
      console.error('Failed to load folders:', error);
      const errorMessage = error.response?.data?.detail || error.message || '加载文件夹失败';
      console.error(`错误: ${errorMessage}`);
    }
  };

  const loadResources = async (teacherId: number) => {
    try {
      setLoading(true);
      // 在知识点模式下，如果选中了知识点，使用知识点作为搜索条件
      const searchKeyword = viewMode === 'knowledge' && selectedKnowledgePoint 
        ? selectedKnowledgePoint 
        : searchTerm || undefined;
      
      const data = await teachingResourceService.getAll(
        teacherId,
        0, 
        1000, // 增加数量以支持分组显示
        selectedType || undefined, 
        searchKeyword,
        viewMode === 'folder' ? (currentFolderId === null ? undefined : currentFolderId) : undefined
      );
      setResources(data);
    } catch (error: any) {
      console.error('Failed to load resources:', error);
      const errorMessage = error.response?.data?.detail || error.message || '加载教学资源失败';
      alert(`错误: ${errorMessage}\n\n请检查：\n1. 后端服务是否运行在 http://localhost:8000\n2. 网络连接是否正常`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      alert('无法获取教师信息');
      return;
    }
    if (!folderName.trim()) {
      alert(t.teacher.teachingResources.folder.folderNamePlaceholder);
      return;
    }
    try {
      await resourceFolderService.createFolder(teacherId, {
        folder_name: folderName,
        parent_id: currentFolderId || undefined,
        description: folderDescription || undefined,
      });
      alert(t.teacher.teachingResources.folder.createSuccess);
      setFolderModalOpen(false);
      setFolderName('');
      setFolderDescription('');
      const teacherIdForReload = getTeacherId();
      if (teacherIdForReload) {
        loadFolders(teacherIdForReload);
      }
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      alert(t.teacher.teachingResources.folder.createError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUploadResource = async () => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      alert('无法获取教师信息');
      return;
    }
    if (!uploadFile) {
      alert(t.teacher.teachingResources.pleaseSelectFile);
      return;
    }
    try {
      await teachingResourceService.uploadResource(uploadFile, {
        resource_name: resourceName || uploadFile.name,
        knowledge_point: knowledgePoint || undefined,
        folder_id: currentFolderId || undefined,
      }, teacherId);
      alert(t.teacher.teachingResources.uploadSuccess);
      setUploadModalOpen(false);
      resetUploadForm();
      const teacherIdForReload = getTeacherId();
      if (teacherIdForReload) {
        loadResources(teacherIdForReload);
      }
    } catch (error: any) {
      console.error('Failed to upload resource:', error);
      alert(t.teacher.teachingResources.uploadError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditFolderClick = (folder: ResourceFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.folder_name);
    setEditFolderDescription(folder.description || '');
    setEditFolderModalOpen(true);
  };

  const handleUpdateFolder = async () => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      alert('无法获取教师信息');
      return;
    }
    if (!editingFolder || !editFolderName.trim()) {
      alert(t.teacher.teachingResources.folder.folderNamePlaceholder);
      return;
    }
    try {
      await resourceFolderService.updateFolder(editingFolder.id, teacherId, {
        folder_name: editFolderName,
        description: editFolderDescription || undefined,
      });
      alert(t.teacher.teachingResources.folder.updateSuccess);
      setEditFolderModalOpen(false);
      setEditingFolder(null);
      setEditFolderName('');
      setEditFolderDescription('');
      const teacherIdForReload = getTeacherId();
      if (teacherIdForReload) {
        loadFolders(teacherIdForReload);
      }
    } catch (error: any) {
      console.error('Failed to update folder:', error);
      alert(t.teacher.teachingResources.folder.updateError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePreviewResource = (resource: TeachingResource) => {
    setPreviewResource(resource);
    setPreviewModalOpen(true);
  };

  const handleDeleteFolder = async (folder: ResourceFolder) => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      alert('无法获取教师信息');
      return;
    }
    if (!confirm(t.teacher.teachingResources.folder.deleteConfirm)) return;
    try {
      await resourceFolderService.deleteFolder(folder.id, teacherId);
      alert(t.teacher.teachingResources.folder.deleteSuccess);
      const teacherIdForReload = getTeacherId();
      if (teacherIdForReload) {
        loadFolders(teacherIdForReload);
      }
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      alert(t.teacher.teachingResources.folder.deleteError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditResource = (resource: TeachingResource) => {
    setEditingResource(resource);
    setEditResourceName(resource.resource_name);
    setEditKnowledgePoint(resource.knowledge_point || null);
    setEditResourceModalOpen(true);
  };

  const handleUpdateResource = async () => {
    if (!editingResource || !editResourceName.trim()) {
      alert(t.teacher.teachingResources.resourceNamePlaceholder);
      return;
    }
    try {
      await teachingResourceService.updateResource(editingResource.id, {
        resource_name: editResourceName,
        knowledge_point: editKnowledgePoint || undefined,
      });
      alert(t.teacher.teachingResources.updateSuccess);
      setEditResourceModalOpen(false);
      setEditingResource(null);
      setEditResourceName('');
      setEditKnowledgePoint(null);
      const teacherIdForReload = getTeacherId();
      if (teacherIdForReload) {
        loadResources(teacherIdForReload);
      }
    } catch (error: any) {
      console.error('Failed to update resource:', error);
      alert(t.teacher.teachingResources.updateError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteResource = async (resource: TeachingResource) => {
    if (!confirm(t.teacher.teachingResources.deleteConfirm)) return;
    try {
      await teachingResourceService.deleteResource(resource.id);
      alert(t.teacher.teachingResources.deleteSuccess);
      const teacherIdForReload = getTeacherId();
      if (teacherIdForReload) {
        loadResources(teacherIdForReload);
      }
    } catch (error: any) {
      console.error('Failed to delete resource:', error);
      alert(t.teacher.teachingResources.deleteError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMove = async () => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      alert('无法获取教师信息');
      return;
    }
    if (!moveItem) return;
    try {
      if (moveItem.type === 'folder') {
        await resourceFolderService.moveFolder(moveItem.id, teacherId, targetFolderId || undefined);
      } else {
        await resourceFolderService.moveResource(moveItem.id, teacherId, targetFolderId || undefined);
      }
      alert(t.teacher.teachingResources.folder.moveSuccess);
      setMoveModalOpen(false);
      setMoveItem(null);
      setTargetFolderId(null);
      const teacherIdForReload = getTeacherId();
      if (teacherIdForReload) {
        loadFolders(teacherIdForReload);
        loadResources(teacherIdForReload);
      }
    } catch (error: any) {
      console.error('Failed to move:', error);
      alert(t.teacher.teachingResources.folder.moveError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleFolderClick = (folder: ResourceFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, folder]);
  };

  const handleBackToParent = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setResourceName('');
    setKnowledgePoint(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileTypeIcon = (type: string) => {
    const typeMap: { [key: string]: { label: string; bgColor: string; textColor: string } } = {
      'video': { label: 'VIDEO', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
      'ppt': { label: 'PPT', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
      'pdf': { label: 'PDF', bgColor: 'bg-red-50', textColor: 'text-red-600' },
      'word': { label: 'WORD', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
      'excel': { label: 'EXCEL', bgColor: 'bg-green-50', textColor: 'text-green-600' },
      'markdown': { label: 'MD', bgColor: 'bg-slate-50', textColor: 'text-slate-600' },
      'image': { label: 'IMG', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    };
    return typeMap[type.toLowerCase()] || { label: 'FILE', bgColor: 'bg-slate-50', textColor: 'text-slate-600' };
  };

  const getFolderNameById = (folderId: number | null): string => {
    if (!folderId) return t.teacher.teachingResources.folder.rootFolder;
    // 如果是当前文件夹路径中的
    const folder = folderPath.find(f => f.id === folderId);
    if (folder) return folder.folder_name;
    // 如果是子文件夹
    const subfolder = folders.find(f => f.id === folderId);
    if (subfolder) return subfolder.folder_name;
    return t.teacher.teachingResources.folder.rootFolder;
  };

  // 按知识点分组资源
  const groupResourcesByKnowledgePoint = (resources: TeachingResource[]) => {
    const grouped: { [key: string]: TeachingResource[] } = {
      '未分类': []
    };
    
    resources.forEach(resource => {
      const key = resource.knowledge_point || '未分类';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(resource);
    });
    
    return grouped;
  };

  // 过滤资源（支持搜索）
  const filterResources = (resources: TeachingResource[]) => {
    if (!searchTerm && !selectedKnowledgePoint) {
      return resources;
    }
    
    return resources.filter(resource => {
      // 知识点模式下，如果选中了知识点，只显示该知识点的资源
      if (viewMode === 'knowledge' && selectedKnowledgePoint) {
        if (resource.knowledge_point !== selectedKnowledgePoint) {
          return false;
        }
      }
      
      // 搜索功能：搜索资源名称、知识点、文件夹名称
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = resource.resource_name.toLowerCase().includes(searchLower);
        const matchesKnowledge = resource.knowledge_point?.toLowerCase().includes(searchLower) || false;
        const folderName = getFolderNameById(resource.folder_id || null).toLowerCase();
        const matchesFolder = folderName.includes(searchLower);
        
        // 只要有一个字段匹配就显示
        if (!matchesName && !matchesKnowledge && !matchesFolder) {
          return false;
        }
      }
      
      return true;
    });
  };

  // 资源卡片组件
  const renderResourceCard = (resource: TeachingResource) => (
    <div key={resource.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        {(() => {
          const icon = getFileTypeIcon(resource.resource_type);
          return (
            <div className={`px-3 py-2 ${icon.bgColor} rounded-lg flex items-center justify-center`}>
              <span className={`text-xs font-bold ${icon.textColor}`}>{icon.label}</span>
            </div>
          );
        })()}
        <div className="flex gap-1">
          <button
            onClick={() => handleEditResource(resource)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="编辑资源"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button
            onClick={() => {
              setMoveItem({type: 'resource', id: resource.id});
              setMoveModalOpen(true);
            }}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="移动资源"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </button>
          <button
            onClick={() => handleDeleteResource(resource)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="删除资源"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
      <h3 className="font-bold text-slate-900 mb-1 truncate">{resource.resource_name}</h3>
      {viewMode === 'folder' && (
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
          </svg>
          <span className="text-xs text-slate-500 truncate">{getFolderNameById(resource.folder_id || null)}</span>
        </div>
      )}
      {resource.knowledge_point && (
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
          </svg>
          <span className="text-xs text-purple-600 truncate">{resource.knowledge_point}</span>
        </div>
      )}
      <p className="text-xs text-slate-500 mb-3">{formatFileSize(resource.file_size)}</p>
      <div className="flex gap-2">
        <button
          onClick={() => handlePreviewResource(resource)}
          className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {t.teacher.teachingResources.preview}
        </button>
        <button
          onClick={() => window.open(teachingResourceService.getDownloadUrl(resource.id), '_blank')}
          className="flex-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
        >
          {t.teacher.teachingResources.download}
        </button>
      </div>
    </div>
  );

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t.teacher.teachingResources.title}</h1>
              <p className="text-sm text-slate-500">{t.teacher.teachingResources.subtitle}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFolderModalOpen(true)}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                </svg>
                {t.teacher.teachingResources.folder.create}
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                {t.teacher.teachingResources.upload}
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        {viewMode === 'folder' && folderPath.length > 0 && (
          <div className="px-8 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentFolderId(null);
                setFolderPath([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t.teacher.teachingResources.folder.rootFolder}
            </button>
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <span className="text-slate-400">/</span>
                <button
                  onClick={() => {
                    const newPath = folderPath.slice(0, index + 1);
                    setFolderPath(newPath);
                    setCurrentFolderId(folder.id);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {folder.folder_name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search and View Mode */}
        <div className="px-8 py-4 bg-white border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode('folder');
                  setSelectedKnowledgePoint(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'folder'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                  </svg>
                  {t.teacher.teachingResources.viewMode.folder}
                </span>
              </button>
              <button
                onClick={() => {
                  setViewMode('knowledge');
                  setCurrentFolderId(null);
                  setFolderPath([]);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'knowledge'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                  {t.teacher.teachingResources.viewMode.knowledge}
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.teacher.teachingResources.searchPlaceholder}
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t.teacher.teachingResources.types.all}</option>
              <option value="video">{t.teacher.teachingResources.types.video}</option>
              <option value="ppt">{t.teacher.teachingResources.types.ppt}</option>
              <option value="pdf">{t.teacher.teachingResources.types.pdf}</option>
              <option value="word">{t.teacher.teachingResources.types.word}</option>
              <option value="excel">{t.teacher.teachingResources.types.excel}</option>
              <option value="markdown">{t.teacher.teachingResources.types.markdown}</option>
              <option value="image">{t.teacher.teachingResources.types.image}</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {/* Folders - 只在文件夹模式下显示 */}
          {viewMode === 'folder' && folders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t.teacher.teachingResources.folder.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 text-2xl">
                        📁
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditFolderClick(folder);
                          }}
                          title={t.teacher.teachingResources.folder.edit}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveItem({type: 'folder', id: folder.id});
                            setMoveModalOpen(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFolder(folder);
                          }}
                          title={t.teacher.teachingResources.folder.delete}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1 truncate">{folder.folder_name}</h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{folder.description || '-'}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{folder.resource_count} {t.teacher.teachingResources.folder.resourceCount}</span>
                      <span>{folder.subfolder_count} {t.teacher.teachingResources.folder.subfolderCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {viewMode === 'folder' ? t.teacher.teachingResources.title : t.teacher.teachingResources.knowledgeView.title}
            </h2>
            {loading ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
              </div>
            ) : (() => {
              const filteredResources = filterResources(resources);
              
              if (filteredResources.length === 0) {
                return (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                    <p className="text-slate-500">{t.teacher.teachingResources.noResources}</p>
                  </div>
                );
              }

              // 知识点模式下按知识点分组显示
              if (viewMode === 'knowledge') {
                const grouped = groupResourcesByKnowledgePoint(filteredResources);
                const knowledgePoints = Object.keys(grouped).sort();
                
                return (
                  <div className="space-y-6">
                    {knowledgePoints.map((knowledgePoint) => (
                      <div key={knowledgePoint} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                            📚
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{knowledgePoint}</h3>
                            <p className="text-sm text-slate-500">{grouped[knowledgePoint].length} {t.teacher.teachingResources.knowledgeView.resourcesCount}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedKnowledgePoint(selectedKnowledgePoint === knowledgePoint ? null : knowledgePoint);
                            }}
                            className="ml-auto px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {selectedKnowledgePoint === knowledgePoint ? t.teacher.teachingResources.knowledgeView.cancelFilter : t.teacher.teachingResources.knowledgeView.filterOnly}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {grouped[knowledgePoint].map((resource) => renderResourceCard(resource))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              // 文件夹模式下正常显示
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredResources.map((resource) => renderResourceCard(resource))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>


      {/* Create Folder Modal */}
      <Modal isOpen={folderModalOpen} onClose={() => setFolderModalOpen(false)} title={t.teacher.teachingResources.folder.createTitle}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.folder.folderName}
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={t.teacher.teachingResources.folder.folderNamePlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.folder.description}
            </label>
            <textarea
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder={t.teacher.teachingResources.folder.descriptionPlaceholder}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setFolderModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreateFolder}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Folder Modal */}
      <Modal isOpen={editFolderModalOpen} onClose={() => setEditFolderModalOpen(false)} title={t.teacher.teachingResources.folder.editTitle}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.folder.folderName}
            </label>
            <input
              type="text"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              placeholder={t.teacher.teachingResources.folder.folderNamePlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.folder.description}
            </label>
            <textarea
              value={editFolderDescription}
              onChange={(e) => setEditFolderDescription(e.target.value)}
              placeholder={t.teacher.teachingResources.folder.descriptionPlaceholder}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditFolderModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdateFolder}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Resource Modal */}
      <Modal 
        isOpen={editResourceModalOpen} 
        onClose={() => {
          setEditResourceModalOpen(false);
          setEditingResource(null);
          setEditResourceName('');
          setEditKnowledgePoint(null);
        }} 
        title={t.teacher.teachingResources.editTitle}
        size="xl"
        maxHeight="90vh"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.resourceName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editResourceName}
              onChange={(e) => setEditResourceName(e.target.value)}
              placeholder="请输入资源名称"
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.knowledgePoint}
            </label>
            <KnowledgeGraphTreeSelect
              teacherId={getTeacherId() || 0}
              value={editKnowledgePoint || undefined}
              onChange={(nodeName) => setEditKnowledgePoint(nodeName)}
              placeholder={t.teacher.teachingResources.knowledgePointPlaceholder}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditResourceModalOpen(false);
                setEditingResource(null);
                setEditResourceName('');
                setEditKnowledgePoint(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdateResource}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Resource Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title={t.teacher.teachingResources.uploadTitle}>
        <div className="p-6">
          {/* 显示当前文件夹 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              <span className="text-slate-600 font-medium">上传到：</span>
              <span className="text-blue-600 font-bold">
                {currentFolderId ? folderPath[folderPath.length - 1]?.folder_name : t.teacher.teachingResources.folder.rootFolder}
              </span>
            </div>
          </div>
          
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadFile(file);
                  setResourceName(file.name.split('.').slice(0, -1).join('.'));
                }
              }}
              className="hidden"
            />
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="mt-2 text-sm text-slate-600">
              {uploadFile ? uploadFile.name : t.teacher.teachingResources.dragDrop}
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.resourceName}
            </label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder={t.teacher.teachingResources.resourceNamePlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.teachingResources.knowledgePoint}
            </label>
            <KnowledgeGraphTreeSelect
              teacherId={getTeacherId() || 0}
              value={knowledgePoint || undefined}
              onChange={(nodeName) => setKnowledgePoint(nodeName)}
              placeholder={t.teacher.teachingResources.knowledgePointPlaceholder}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUploadResource}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.upload}
            </button>
          </div>
        </div>
      </Modal>

      {/* Move Modal */}
      <Modal isOpen={moveModalOpen} onClose={() => setMoveModalOpen(false)} title={t.teacher.teachingResources.folder.moveTo}>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            {t.teacher.teachingResources.folder.selectFolder}
          </p>
          <select
            value={targetFolderId || ''}
            onChange={(e) => setTargetFolderId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            <option value="">{t.teacher.teachingResources.folder.rootFolder}</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.folder_name}</option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setMoveModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleMove}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.teacher.teachingResources.folder.move}
            </button>
          </div>
        </div>
      </Modal>

      {/* Resource Preview Modal */}
      <ResourcePreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewResource(null);
        }}
        resource={previewResource}
        previewUrl={previewResource ? teachingResourceService.getPreviewUrl(previewResource.id) : ''}
      />
    </TeacherLayout>
  );
}

