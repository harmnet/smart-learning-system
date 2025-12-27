"use client";

import { useState, useEffect, useRef } from 'react';
import { referenceMaterialService, ReferenceMaterial } from '@/services/referenceMaterial.service';
import { referenceFolderService, ReferenceFolder } from '@/services/referenceFolder.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';
import ResourcePreviewModal from '@/components/teacher/ResourcePreviewModal';
import KnowledgeGraphTreeSelect from '@/components/common/KnowledgeGraphTreeSelect';

export default function ReferenceMaterialsPage() {
  const { t } = useLanguage();
  const [materials, setMaterials] = useState<ReferenceMaterial[]>([]);
  const [folders, setFolders] = useState<ReferenceFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<ReferenceFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'folder' | 'knowledge'>('folder'); // 查看维度：文件夹或知识点
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<string | null>(null); // 选中的知识点
  
  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editMaterialModalOpen, setEditMaterialModalOpen] = useState(false);
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<ReferenceMaterial | null>(null);
  
  // Edit folder form states
  const [editingFolder, setEditingFolder] = useState<ReferenceFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  
  // Form states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [resourceName, setResourceName] = useState('');
  const [knowledgePoint, setKnowledgePoint] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<ReferenceMaterial | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<ReferenceFolder | null>(null);
  const [moveItem, setMoveItem] = useState<{type: 'material' | 'folder', id: number} | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<number | null>(null);
  
  // Edit material states
  const [editingMaterial, setEditingMaterial] = useState<ReferenceMaterial | null>(null);
  const [editMaterialName, setEditMaterialName] = useState('');
  const [editKnowledgePoint, setEditKnowledgePoint] = useState<string | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teacherId = 1; // TODO: Get from auth context

  useEffect(() => {
    if (viewMode === 'folder') {
      loadFolders();
    }
    loadMaterials();
  }, [currentFolderId, selectedType, searchTerm, viewMode, selectedKnowledgePoint]);

  const loadFolders = async () => {
    try {
      const data = await referenceFolderService.getFolders(teacherId, currentFolderId || undefined);
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);
      // 在知识点模式下，如果选中了知识点，使用知识点作为搜索条件
      const searchKeyword = viewMode === 'knowledge' && selectedKnowledgePoint 
        ? selectedKnowledgePoint 
        : searchTerm || undefined;
      
      const data = await referenceMaterialService.getAll(
        teacherId,
        0, 
        1000, // 增加数量以支持分组显示
        selectedType || undefined, 
        searchKeyword,
        viewMode === 'folder' ? (currentFolderId === null ? undefined : currentFolderId) : undefined
      );
      setMaterials(data);
    } catch (error: any) {
      console.error('Failed to load materials:', error);
      const errorMessage = error.response?.data?.detail || error.message || '加载参考资料失败';
      alert(`错误: ${errorMessage}\n\n请检查：\n1. 后端服务是否运行在 http://localhost:8000\n2. 网络连接是否正常`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      alert(t.teacher.referenceMaterials.folder.folderNamePlaceholder);
      return;
    }
    try {
      await referenceFolderService.createFolder(teacherId, {
        folder_name: folderName,
        parent_id: currentFolderId || undefined,
        description: folderDescription || undefined,
      });
      alert(t.teacher.referenceMaterials.folder.createSuccess);
      setFolderModalOpen(false);
      setFolderName('');
      setFolderDescription('');
      loadFolders();
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      alert(t.teacher.referenceMaterials.folder.createError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUploadResource = async () => {
    if (!uploadFile) {
      alert(t.teacher.referenceMaterials.pleaseSelectFile);
      return;
    }
    try {
      await referenceMaterialService.uploadMaterial(uploadFile, {
        resource_name: resourceName || uploadFile.name,
        knowledge_point: knowledgePoint || undefined,
        folder_id: currentFolderId || undefined,
      }, teacherId);
      alert(t.teacher.referenceMaterials.uploadSuccess);
      setUploadModalOpen(false);
      resetUploadForm();
      loadMaterials();
    } catch (error: any) {
      console.error('Failed to upload material:', error);
      alert(t.teacher.referenceMaterials.uploadError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCreateLink = async () => {
    if (!resourceName.trim() || !linkUrl.trim()) {
      alert('请输入资料名称和链接地址');
      return;
    }
    if (!linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
      alert(t.teacher.referenceMaterials.linkUrlError);
      return;
    }
    try {
      await referenceMaterialService.createLink({
        resource_name: resourceName,
        link_url: linkUrl,
        knowledge_point: knowledgePoint || undefined,
        folder_id: currentFolderId || undefined,
      }, teacherId);
      alert(t.teacher.referenceMaterials.linkCreateSuccess);
      setLinkModalOpen(false);
      resetUploadForm();
      loadMaterials();
    } catch (error: any) {
      console.error('Failed to create link:', error);
      alert(t.teacher.referenceMaterials.linkCreateError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditFolderClick = (folder: ReferenceFolder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.folder_name);
    setEditFolderDescription(folder.description || '');
    setEditFolderModalOpen(true);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) {
      alert(t.teacher.referenceMaterials.folder.folderNamePlaceholder);
      return;
    }
    try {
      await referenceFolderService.updateFolder(editingFolder.id, teacherId, {
        folder_name: editFolderName,
        description: editFolderDescription || undefined,
      });
      alert(t.teacher.referenceMaterials.folder.updateSuccess);
      setEditFolderModalOpen(false);
      setEditingFolder(null);
      setEditFolderName('');
      setEditFolderDescription('');
      loadFolders();
    } catch (error: any) {
      console.error('Failed to update folder:', error);
      alert(t.teacher.referenceMaterials.folder.updateError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handlePreviewResource = (material: ReferenceMaterial) => {
    setPreviewMaterial(material);
    setPreviewModalOpen(true);
  };

  const handleDeleteFolder = async (folder: ReferenceFolder) => {
    if (!confirm(t.teacher.referenceMaterials.folder.deleteConfirm)) return;
    try {
      await referenceFolderService.deleteFolder(folder.id, teacherId);
      alert(t.teacher.referenceMaterials.folder.deleteSuccess);
      loadFolders();
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      alert(t.teacher.referenceMaterials.folder.deleteError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditMaterial = (material: ReferenceMaterial) => {
    setEditingMaterial(material);
    setEditMaterialName(material.resource_name);
    setEditKnowledgePoint(material.knowledge_point || null);
    setEditLinkUrl(material.link_url || '');
    setEditMaterialModalOpen(true);
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !editMaterialName.trim()) {
      alert('请输入资源名称');
      return;
    }
    if (editingMaterial.resource_type === 'link' && !editLinkUrl.trim()) {
      alert('请输入链接地址');
      return;
    }
    if (editingMaterial.resource_type === 'link' && !editLinkUrl.startsWith('http://') && !editLinkUrl.startsWith('https://')) {
      alert(t.teacher.referenceMaterials.linkUrlError);
      return;
    }
    try {
      await referenceMaterialService.updateMaterial(editingMaterial.id, teacherId, {
        resource_name: editMaterialName,
        knowledge_point: editKnowledgePoint || undefined,
        link_url: editingMaterial.resource_type === 'link' ? editLinkUrl : undefined,
      });
      alert(t.teacher.referenceMaterials.updateSuccess || '更新成功');
      setEditMaterialModalOpen(false);
      setEditingMaterial(null);
      setEditMaterialName('');
      setEditKnowledgePoint(null);
      setEditLinkUrl('');
      loadMaterials();
    } catch (error: any) {
      console.error('Failed to update material:', error);
      alert((t.teacher.referenceMaterials.updateError || '更新失败') + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteResource = async (material: ReferenceMaterial) => {
    if (!confirm(t.teacher.referenceMaterials.deleteConfirm)) return;
    try {
      await referenceMaterialService.deleteMaterial(material.id, teacherId);
      alert(t.teacher.referenceMaterials.deleteSuccess);
      loadMaterials();
    } catch (error: any) {
      console.error('Failed to delete material:', error);
      alert(t.teacher.referenceMaterials.deleteError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMove = async () => {
    if (!moveItem) return;
    try {
      if (moveItem.type === 'folder') {
        await referenceFolderService.moveFolder(moveItem.id, teacherId, targetFolderId || undefined);
      } else {
        await referenceFolderService.moveMaterial(moveItem.id, teacherId, targetFolderId || undefined);
      }
      alert(t.teacher.referenceMaterials.folder.moveSuccess);
      setMoveModalOpen(false);
      setMoveItem(null);
      setTargetFolderId(null);
      loadFolders();
      loadMaterials();
    } catch (error: any) {
      console.error('Failed to move:', error);
      alert(t.teacher.referenceMaterials.folder.moveError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleFolderClick = (folder: ReferenceFolder) => {
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
    setLinkUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 按知识点分组资源
  const groupMaterialsByKnowledgePoint = (materials: ReferenceMaterial[]) => {
    const grouped: { [key: string]: ReferenceMaterial[] } = {
      '未分类': []
    };
    
    materials.forEach(material => {
      const key = material.knowledge_point || '未分类';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(material);
    });
    
    return grouped;
  };

  // 过滤资源（支持搜索）
  const filterMaterials = (materials: ReferenceMaterial[]) => {
    if (!searchTerm && !selectedKnowledgePoint) {
      return materials;
    }
    
    return materials.filter(material => {
      // 知识点模式下，如果选中了知识点，只显示该知识点的资源
      if (viewMode === 'knowledge' && selectedKnowledgePoint) {
        if (material.knowledge_point !== selectedKnowledgePoint) {
          return false;
        }
      }
      
      // 搜索功能：搜索资源名称、知识点、文件夹名称
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = material.resource_name.toLowerCase().includes(searchLower);
        const matchesKnowledge = material.knowledge_point?.toLowerCase().includes(searchLower) || false;
        const folderName = getFolderNameById(material.folder_id || null).toLowerCase();
        const matchesFolder = folderName.includes(searchLower);
        
        // 只要有一个字段匹配就显示
        if (!matchesName && !matchesKnowledge && !matchesFolder) {
          return false;
        }
      }
      
      return true;
    });
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
      'archive': { label: 'ZIP', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
      'link': { label: 'LINK', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
    };
    return typeMap[type.toLowerCase()] || { label: 'FILE', bgColor: 'bg-slate-50', textColor: 'text-slate-600' };
  };

  const getFolderNameById = (folderId: number | null): string => {
    if (!folderId) return t.teacher.referenceMaterials.folder.rootFolder;
    // 如果是当前文件夹路径中的
    const folder = folderPath.find(f => f.id === folderId);
    if (folder) return folder.folder_name;
    // 如果是子文件夹
    const subfolder = folders.find(f => f.id === folderId);
    if (subfolder) return subfolder.folder_name;
    return t.teacher.referenceMaterials.folder.rootFolder;
  };

  // 资源卡片组件
  const MaterialCard = ({ material }: { material: ReferenceMaterial }) => {
    const icon = getFileTypeIcon(material.resource_type);
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
        <div className="flex items-start justify-between mb-3">
          <div className={`px-3 py-2 ${icon.bgColor} rounded-lg flex items-center justify-center`}>
            <span className={`text-xs font-bold ${icon.textColor}`}>{icon.label}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEditMaterial(material)}
              title={t.teacher.referenceMaterials.edit || '编辑'}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            <button
              onClick={() => {
                setMoveItem({type: 'material', id: material.id});
                setMoveModalOpen(true);
              }}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
            </button>
            <button
              onClick={() => handleDeleteResource(material)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        <h3 className="font-bold text-slate-900 mb-1 truncate">{material.resource_name}</h3>
        {viewMode === 'folder' && (
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
            </svg>
            <span className="text-xs text-slate-500 truncate">{getFolderNameById(material.folder_id || null)}</span>
          </div>
        )}
        {material.knowledge_point && (
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span className="text-xs text-blue-600 truncate">{material.knowledge_point}</span>
          </div>
        )}
        {material.resource_type !== 'link' && (
          <p className="text-xs text-slate-500 mb-3">{formatFileSize(material.file_size || 0)}</p>
        )}
        <div className="flex gap-2">
          {material.resource_type !== 'link' && material.resource_type !== 'archive' && (
            <button
              onClick={() => handlePreviewResource(material)}
              className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {t.teacher.referenceMaterials.preview}
            </button>
          )}
          {material.resource_type !== 'link' && (
            <button
              onClick={() => window.open(referenceMaterialService.getDownloadUrl(material.id), '_blank')}
              className="flex-1 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              {t.teacher.referenceMaterials.download}
            </button>
          )}
          {material.resource_type === 'link' && (
            <button
              onClick={() => window.open(material.link_url, '_blank')}
              className="flex-1 px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              {t.teacher.referenceMaterials.openLink || '打开链接'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t.teacher.referenceMaterials.title}</h1>
              <p className="text-sm text-slate-500">{t.teacher.referenceMaterials.subtitle}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setFolderModalOpen(true)}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                </svg>
                {t.teacher.referenceMaterials.folder.create}
              </button>
              <button
                onClick={() => setLinkModalOpen(true)}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                {t.teacher.referenceMaterials.addLink}
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                {t.teacher.referenceMaterials.upload}
              </button>
            </div>
          </div>
        </div>

        {/* Search and View Mode */}
        <div className="px-8 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.teacher.referenceMaterials.searchPlaceholder || '搜索资源名称、知识点、文件夹...'}
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
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
                {t.teacher.referenceMaterials.viewMode?.folderView || '文件夹'}
              </button>
              <button
                onClick={() => {
                  setViewMode('knowledge');
                  setSelectedKnowledgePoint(null);
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'knowledge'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.teacher.referenceMaterials.viewMode?.knowledgePointView || '知识点'}
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
              {t.teacher.referenceMaterials.folder.rootFolder}
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
        
        {/* Knowledge Point Filter */}
        {viewMode === 'knowledge' && selectedKnowledgePoint && (
          <div className="px-8 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">当前筛选：</span>
              <span className="text-sm font-medium text-blue-600">{selectedKnowledgePoint}</span>
            </div>
            <button
              onClick={() => setSelectedKnowledgePoint(null)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {t.teacher.referenceMaterials.clearFilter || '清除筛选'}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {/* Folders */}
          {folders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{t.teacher.referenceMaterials.folder.title}</h2>
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
                          title={t.teacher.referenceMaterials.folder.edit}
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
                          title={t.teacher.referenceMaterials.folder.delete}
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
                      <span>{folder.resource_count} {t.teacher.referenceMaterials.folder.resourceCount}</span>
                      <span>{folder.subfolder_count} {t.teacher.referenceMaterials.folder.subfolderCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">{t.teacher.referenceMaterials.title}</h2>
            {loading ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
              </div>
            ) : (() => {
              const filteredMaterials = filterMaterials(materials);
              
              if (filteredMaterials.length === 0) {
                return (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                    <p className="text-slate-500">{t.teacher.referenceMaterials.noMaterials}</p>
                  </div>
                );
              }
              
              // 按知识点分组显示
              if (viewMode === 'knowledge') {
                const grouped = groupMaterialsByKnowledgePoint(filteredMaterials);
                const knowledgePoints = Object.keys(grouped).sort();
                
                return (
                  <div className="space-y-6">
                    {knowledgePoints.map((kp) => {
                      const kpMaterials = grouped[kp];
                      if (kpMaterials.length === 0) return null;
                      
                      return (
                        <div key={kp} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-900">{kp}</h3>
                              <span className="text-sm text-slate-500">({kpMaterials.length} 个资源)</span>
                            </div>
                            {!selectedKnowledgePoint && (
                              <button
                                onClick={() => setSelectedKnowledgePoint(kp)}
                                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                {t.teacher.referenceMaterials.filterByKnowledgePoint || '仅看此项'}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {kpMaterials.map((material) => (
                              <MaterialCard key={material.id} material={material} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }
              
              // 文件夹模式：正常显示
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredMaterials.map((material) => (
                    <MaterialCard key={material.id} material={material} />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      <Modal isOpen={folderModalOpen} onClose={() => setFolderModalOpen(false)} title={t.teacher.referenceMaterials.folder.createTitle}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.folder.folderName}
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={t.teacher.referenceMaterials.folder.folderNamePlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.folder.description}
            </label>
            <textarea
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder={t.teacher.referenceMaterials.folder.descriptionPlaceholder}
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
      <Modal isOpen={editFolderModalOpen} onClose={() => setEditFolderModalOpen(false)} title={t.teacher.referenceMaterials.folder.editTitle}>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.folder.folderName}
            </label>
            <input
              type="text"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              placeholder={t.teacher.referenceMaterials.folder.folderNamePlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.folder.description}
            </label>
            <textarea
              value={editFolderDescription}
              onChange={(e) => setEditFolderDescription(e.target.value)}
              placeholder={t.teacher.referenceMaterials.folder.descriptionPlaceholder}
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

      {/* Add Link Modal */}
      <Modal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} title={t.teacher.referenceMaterials.addLinkTitle}>
        <div className="p-6">
          {/* 显示当前文件夹 */}
          <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              <span className="text-slate-600 font-medium">添加到：</span>
              <span className="text-purple-600 font-bold">
                {currentFolderId ? folderPath[folderPath.length - 1]?.folder_name : t.teacher.referenceMaterials.folder.rootFolder}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.resourceName}
            </label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder={t.teacher.referenceMaterials.resourceNamePlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.linkUrl}
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={t.teacher.referenceMaterials.linkUrlPlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.knowledgePoint}
            </label>
            <KnowledgeGraphTreeSelect
              teacherId={teacherId}
              value={knowledgePoint || undefined}
              onChange={(nodeName) => setKnowledgePoint(nodeName)}
              placeholder={t.teacher.referenceMaterials.knowledgePointPlaceholder}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setLinkModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreateLink}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Resource Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title={t.teacher.referenceMaterials.uploadTitle}>
        <div className="p-6">
          {/* 显示当前文件夹 */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
              </svg>
              <span className="text-slate-600 font-medium">上传到：</span>
              <span className="text-blue-600 font-bold">
                {currentFolderId ? folderPath[folderPath.length - 1]?.folder_name : t.teacher.referenceMaterials.folder.rootFolder}
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
              {uploadFile ? uploadFile.name : t.teacher.referenceMaterials.dragDrop}
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.resourceName}
            </label>
            <input
              type="text"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              placeholder={t.teacher.referenceMaterials.resourceNamePlaceholder}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.knowledgePoint}
            </label>
            <KnowledgeGraphTreeSelect
              teacherId={teacherId}
              value={knowledgePoint || undefined}
              onChange={(nodeName) => setKnowledgePoint(nodeName)}
              placeholder={t.teacher.referenceMaterials.knowledgePointPlaceholder}
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

      {/* Edit Material Modal */}
      <Modal 
        isOpen={editMaterialModalOpen} 
        onClose={() => {
          setEditMaterialModalOpen(false);
          setEditingMaterial(null);
          setEditMaterialName('');
          setEditKnowledgePoint(null);
          setEditLinkUrl('');
        }} 
        title={t.teacher.referenceMaterials.editTitle || '编辑参考资料'}
        size="xl"
        maxHeight="90vh"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.resourceName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editMaterialName}
              onChange={(e) => setEditMaterialName(e.target.value)}
              placeholder="请输入资源名称"
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {editingMaterial?.resource_type === 'link' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.teacher.referenceMaterials.linkUrl} <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={editLinkUrl}
                onChange={(e) => setEditLinkUrl(e.target.value)}
                placeholder={t.teacher.referenceMaterials.linkUrlPlaceholder}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.teacher.referenceMaterials.knowledgePoint}
            </label>
            <KnowledgeGraphTreeSelect
              teacherId={teacherId}
              value={editKnowledgePoint || undefined}
              onChange={(nodeName) => setEditKnowledgePoint(nodeName)}
              placeholder={t.teacher.referenceMaterials.knowledgePointPlaceholder}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditMaterialModalOpen(false);
                setEditingMaterial(null);
                setEditMaterialName('');
                setEditKnowledgePoint(null);
                setEditLinkUrl('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdateMaterial}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* Move Modal */}
      <Modal isOpen={moveModalOpen} onClose={() => setMoveModalOpen(false)} title={t.teacher.referenceMaterials.folder.moveTo}>
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            {t.teacher.referenceMaterials.folder.selectFolder}
          </p>
          <select
            value={targetFolderId || ''}
            onChange={(e) => setTargetFolderId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            <option value="">{t.teacher.referenceMaterials.folder.rootFolder}</option>
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
              {t.teacher.referenceMaterials.folder.move}
            </button>
          </div>
        </div>
      </Modal>

      {/* Resource Preview Modal */}
      <ResourcePreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setPreviewMaterial(null);
        }}
        resource={previewMaterial}
        previewUrl={previewMaterial ? referenceMaterialService.getPreviewUrl(previewMaterial.id) : ''}
      />
    </TeacherLayout>
  );
}

