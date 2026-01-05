"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { knowledgeGraphService, KnowledgeGraph, GraphTree, KnowledgeNode } from '@/services/knowledgeGraph.service';
import { resourceFolderService, FolderTreeNode } from '@/services/resourceFolder.service';
import { teachingResourceService, TeachingResource } from '@/services/teachingResource.service';
import { aiCreationService } from '@/services/aiCreation.service';
import { pptCreationService } from '@/services/pptCreation.service';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Toast from '@/components/common/Toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AICreationPage() {
  const { t } = useLanguage();
  const router = useRouter();
  
  // 基础状态
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // 进度条状态
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  
  // 内容形式选择
  const [contentType, setContentType] = useState<'word' | 'ppt'>('word');
  
  // PPT相关状态
  const [pptProjectId, setPptProjectId] = useState<string | null>(null);
  const [pptIframeUrl, setPptIframeUrl] = useState<string | null>(null);
  
  // 知识图谱状态
  const [knowledgeGraphs, setKnowledgeGraphs] = useState<KnowledgeGraph[]>([]);
  const [selectedGraphId, setSelectedGraphId] = useState<number | null>(null);
  const [graphTree, setGraphTree] = useState<GraphTree | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<number>>(new Set());
  
  // 知识点资源状态
  const [knowledgePointResources, setKnowledgePointResources] = useState<TeachingResource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<number>>(new Set());
  const [loadingResources, setLoadingResources] = useState(false);
  
  // 文件夹状态
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  
  // 文件上传状态
  const [auxiliaryFiles, setAuxiliaryFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 提示词状态
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // 生成内容状态
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  
  // Toast状态
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
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
  
  const teacherId = getTeacherId();
  
  // 初始化加载
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      // 加载知识图谱
      const graphs = await knowledgeGraphService.getAll(teacherId);
      setKnowledgeGraphs(graphs);
      
      if (graphs.length > 0) {
        setSelectedGraphId(graphs[0].id);
        await loadGraphTree(graphs[0].id);
      }
      
      // 加载文件夹
      const folders = await resourceFolderService.getFolderTree(teacherId);
      setFolderTree(folders);
    } catch (error) {
      console.error('Failed to load data:', error);
      setToast({ message: '加载数据失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const loadGraphTree = async (graphId: number) => {
    if (!teacherId) return;
    
    try {
      const tree = await knowledgeGraphService.getTree(graphId, teacherId);
      setGraphTree(tree);
      
      // 默认展开所有节点
      if (tree && tree.tree) {
        const allIds = new Set<number>();
        const collectIds = (nodes: KnowledgeNode[]) => {
          nodes.forEach(node => {
            allIds.add(node.id);
            if (node.children && node.children.length > 0) {
              collectIds(node.children);
            }
          });
        };
        collectIds(tree.tree);
        setExpandedNodeIds(allIds);
      }
    } catch (error) {
      console.error('Failed to load graph tree:', error);
      setToast({ message: '加载知识图谱失败', type: 'error' });
    }
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
  
  // 加载知识点的教学资源
  const loadKnowledgePointResources = async (knowledgePoint: string) => {
    if (!teacherId) return;
    
    setLoadingResources(true);
    try {
      // 获取该知识点的所有教学资源
      const allResources = await teachingResourceService.getAll(teacherId);
      const filteredResources = allResources.filter(
        (resource) => resource.knowledge_point === knowledgePoint
      );
      setKnowledgePointResources(filteredResources);
      setSelectedResourceIds(new Set()); // 清空之前的选择
    } catch (error) {
      console.error('Failed to load knowledge point resources:', error);
      setToast({ message: '加载资源失败', type: 'error' });
    } finally {
      setLoadingResources(false);
    }
  };
  
  // 选择节点
  const handleNodeClick = (nodeName: string) => {
    setSelectedNode(nodeName);
    loadKnowledgePointResources(nodeName);
  };
  
  // 切换资源选择
  const toggleResourceSelection = (resourceId: number) => {
    const newSelected = new Set(selectedResourceIds);
    if (newSelected.has(resourceId)) {
      newSelected.delete(resourceId);
    } else {
      newSelected.add(resourceId);
    }
    setSelectedResourceIds(newSelected);
  };
  
  // 渲染知识图谱树节点
  const renderGraphTreeNode = (node: KnowledgeNode, level: number = 0) => {
    const isExpanded = expandedNodeIds.has(node.id);
    const isSelected = selectedNode === node.node_name;
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
          onClick={() => handleNodeClick(node.node_name)}
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
        </div>
        {isExpanded && hasChildren && (
          <div className="children mt-1">
            {node.children?.map((child: KnowledgeNode) => renderGraphTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // 文件上传处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '');
      });
      
      if (validFiles.length < files.length) {
        setToast({ message: '只支持PDF、Word、txt和md格式的文件', type: 'warning' });
      }
      
      setAuxiliaryFiles([...auxiliaryFiles, ...validFiles]);
    }
  };
  
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
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '');
    });
    
    if (validFiles.length < files.length) {
      setToast({ message: '只支持PDF、Word、txt和md格式的文件', type: 'warning' });
    }
    
    setAuxiliaryFiles([...auxiliaryFiles, ...validFiles]);
  };
  
  const removeFile = (index: number) => {
    setAuxiliaryFiles(auxiliaryFiles.filter((_, i) => i !== index));
  };
  
  // 进度条模拟
  const simulateProgress = () => {
    setGenerationProgress(0);
    setProgressMessage('正在准备AI创作...');
    
    const stages = [
      { progress: 5, message: '正在读取知识图谱结构...', delay: 2000 },
      { progress: 10, message: '正在加载教学资源内容...', delay: 3000 },
      { progress: 20, message: '正在构建AI提示词...', delay: 5000 },
      { progress: 35, message: 'AI正在理解知识点...', delay: 15000 },
      { progress: 50, message: 'AI正在生成内容框架...', delay: 20000 },
      { progress: 65, message: 'AI正在完善内容细节...', delay: 30000 },
      { progress: 80, message: 'AI正在优化内容质量...', delay: 40000 },
      { progress: 90, message: '正在优化格式和排版...', delay: 20000 },
      { progress: 95, message: '即将完成...', delay: 10000 },
    ];
    
    let currentStage = 0;
    let cumulativeDelay = 0;
    
    const scheduleNextStage = () => {
      if (currentStage < stages.length) {
        cumulativeDelay += stages[currentStage].delay;
        setTimeout(() => {
          if (currentStage < stages.length) {
            setGenerationProgress(stages[currentStage].progress);
            setProgressMessage(stages[currentStage].message);
            currentStage++;
            scheduleNextStage();
          }
        }, stages[currentStage].delay);
      }
    };
    
    scheduleNextStage();
    
    // 返回一个清理函数
    return () => {
      currentStage = stages.length; // 停止进度更新
    };
  };
  
  // AI生成
  const handleAIGenerate = async () => {
    if (!teacherId || !selectedGraphId || !selectedNode) {
      setToast({ message: '请先选择知识图谱和知识点', type: 'warning' });
      return;
    }
    
    // 根据内容类型调用不同的生成逻辑
    if (contentType === 'ppt') {
      return handleCreatePPT();
    } else {
      return handleCreateWord();
    }
  };
  
  // 创建Word资源
  const handleCreateWord = async () => {
    setGenerating(true);
    setGeneratedContent('');
    setEditedContent('');
    setIsEditing(false);
    setPptProjectId(null);
    setPptIframeUrl(null);
    
    // 启动进度条模拟
    const stopProgress = simulateProgress();
    
    try {
      const result = await aiCreationService.generateContent({
        knowledge_point: selectedNode!,
        graph_id: selectedGraphId!,
        teacher_id: teacherId!,
        custom_prompt: customPrompt,
        selected_resource_ids: Array.from(selectedResourceIds),
        auxiliary_files: auxiliaryFiles,
      });
      
      // 停止进度条
      stopProgress();
      
      if (result.success && result.content) {
        setGenerationProgress(100);
        setProgressMessage('创作完成！');
        setTimeout(() => {
          setGeneratedContent(result.content);
          setEditedContent(result.content);
          setToast({ message: 'AI创作完成！', type: 'success' });
        }, 500);
      } else {
        setToast({ message: result.error || 'AI生成失败', type: 'error' });
      }
    } catch (error: any) {
      stopProgress();
      console.error('AI生成失败:', error);
      setToast({ message: error.message || 'AI生成失败', type: 'error' });
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(0);
        setProgressMessage('');
      }, 1000);
    }
  };
  
  // 创建PPT课件
  const handleCreatePPT = async () => {
    setGenerating(true);
    setGeneratedContent('');
    setEditedContent('');
    setPptProjectId(null);
    setPptIframeUrl(null);
    setGenerationProgress(0);
    setProgressMessage('正在创建PPT项目...');
    
    try {
      const result = await pptCreationService.createProject({
        title: fileName || '未命名课件',
        knowledge_point: selectedNode!,
        graph_id: selectedGraphId!,
        teacher_id: teacherId!,
        custom_prompt: customPrompt,
        selected_resource_ids: Array.from(selectedResourceIds),
        template_file: auxiliaryFiles.length > 0 ? auxiliaryFiles[0] : undefined,
      });
      
      if (result.success && result.project_id && result.iframe_url) {
        setPptProjectId(result.project_id);
        setPptIframeUrl(result.iframe_url);
        setToast({ message: 'PPT项目创建成功！', type: 'success' });
      } else {
        setToast({ message: result.error || 'PPT创建失败', type: 'error' });
      }
    } catch (error: any) {
      console.error('PPT创建失败:', error);
      setToast({ message: error.message || 'PPT创建失败', type: 'error' });
    } finally {
      setGenerating(false);
      setGenerationProgress(0);
      setProgressMessage('');
    }
  };
  
  // 保存到系统
  const handleSave = async () => {
    const contentToSave = isEditing ? editedContent : generatedContent;
    
    if (!teacherId || !fileName || !contentToSave || !selectedNode) {
      setToast({ message: '请输入文件名称', type: 'warning' });
      return;
    }
    
    setSaving(true);
    try {
      const result = await aiCreationService.saveContent({
        teacher_id: teacherId,
        resource_name: fileName,
        markdown_content: contentToSave,
        knowledge_point: selectedNode,
        folder_id: selectedFolderId || undefined,
      });
      
      if (result.success) {
        setToast({ message: '保存成功！', type: 'success' });
        setTimeout(() => {
          router.push('/teacher/resources');
        }, 1500);
      } else {
        setToast({ message: result.error || '保存失败', type: 'error' });
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      setToast({ message: error.message || '保存失败', type: 'error' });
    } finally {
      setSaving(false);
    }
  };
  
  // 导出到本地
  const handleExport = async () => {
    const contentToExport = isEditing ? editedContent : generatedContent;
    
    if (!fileName || !contentToExport) {
      setToast({ message: '请输入文件名称', type: 'warning' });
      return;
    }
    
    setExporting(true);
    try {
      const blob = await aiCreationService.exportContent({
        resource_name: fileName,
        markdown_content: contentToExport,
      });
      
      // 触发下载
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setToast({ message: '导出成功！', type: 'success' });
    } catch (error: any) {
      console.error('导出失败:', error);
      setToast({ message: error.message || '导出失败', type: 'error' });
    } finally {
      setExporting(false);
    }
  };
  
  // 保存PPT到系统
  const handleSavePPT = async () => {
    if (!teacherId || !pptProjectId || !fileName) {
      setToast({ message: '请输入PPT名称', type: 'warning' });
      return;
    }
    
    setSaving(true);
    try {
      const result = await pptCreationService.saveToSystem(pptProjectId, {
        resource_name: fileName,
        folder_id: selectedFolderId || undefined,
        knowledge_point: selectedNode || undefined,
        teacher_id: teacherId,
      });
      
      if (result.success) {
        setToast({ message: 'PPT保存成功！', type: 'success' });
        setTimeout(() => {
          router.push('/teacher/resources');
        }, 1500);
      } else {
        setToast({ message: result.error || 'PPT保存失败', type: 'error' });
      }
    } catch (error: any) {
      console.error('PPT保存失败:', error);
      setToast({ message: error.message || 'PPT保存失败', type: 'error' });
    } finally {
      setSaving(false);
    }
  };
  
  // 导出PPT到本地
  const handleExportPPT = async () => {
    if (!pptProjectId || !fileName) {
      setToast({ message: '请输入PPT名称', type: 'warning' });
      return;
    }
    
    setExporting(true);
    try {
      const blob = await pptCreationService.exportPPT(pptProjectId);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setToast({ message: 'PPT导出成功！', type: 'success' });
    } catch (error: any) {
      console.error('PPT导出失败:', error);
      setToast({ message: error.message || 'PPT导出失败', type: 'error' });
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <TeacherLayout>
      <div className="h-full flex flex-col" style={{ fontFamily: "'Open Sans', sans-serif" }}>
        {/* Header */}
        <div className="px-8 py-6 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                返回
              </button>
              <div>
                <h1 className="text-3xl font-bold text-[#1E293B] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>AI智能创作</h1>
                <p className="text-sm text-[#64748B]">基于知识图谱生成教学内容</p>
              </div>
            </div>
            
            {/* 内容形式选择 - 移到标题行右对齐 */}
            <div className="flex gap-3">
              <button
                onClick={() => setContentType('word')}
                disabled={generating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  contentType === 'word'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Word资源
                </div>
              </button>
              <button
                onClick={() => setContentType('ppt')}
                disabled={generating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  contentType === 'ppt'
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-[#64748B] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  PPT课件
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex bg-[#F8FAFC]">
          {/* Left Panel: Configuration */}
          <div className="w-1/3 border-r border-[#E2E8F0] bg-white overflow-y-auto max-h-[calc(100vh-140px)]">
            
            {/* 1. AI创作按钮 - 放在最顶部 */}
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] p-6 shadow-sm z-10">
                <button
                  onClick={handleAIGenerate}
                  disabled={!selectedGraphId || !selectedNode || generating}
                  className="w-full px-6 py-4 text-base font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 text-white bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1E40AF] hover:to-[#2563EB] disabled:from-[#94A3B8] disabled:to-[#94A3B8] disabled:cursor-not-allowed shadow-lg shadow-[#2563EB]/30 hover:shadow-xl hover:shadow-[#2563EB]/40 flex items-center justify-center gap-3"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      AI创作中，请稍候...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                      🚀 AI创作
                    </>
                  )}
                </button>
                <p className="text-xs text-[#64748B] text-center mt-3">
                  配置下方参数后点击按钮开始生成
                </p>
            </div>

            {/* 配置表单区域 */}
            <div className="p-6 space-y-6">
              {/* 1. 选择知识图谱 */}
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                  1. 选择知识图谱 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedGraphId || ''}
                  onChange={(e) => {
                    const graphId = parseInt(e.target.value);
                    setSelectedGraphId(graphId);
                    loadGraphTree(graphId);
                    setSelectedNode(null);
                  }}
                  disabled={generating}
                  className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl text-sm bg-white hover:border-[#CBD5E1] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed"
                >
                  {knowledgeGraphs.map(graph => (
                    <option key={graph.id} value={graph.id}>{graph.graph_name}</option>
                  ))}
                </select>
              </div>
              
              {/* 2. 选择知识点节点 */}
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                  2. 选择知识点节点 <span className="text-red-500">*</span>
                </label>
                {selectedNode && (
                  <div className="mb-2 px-3 py-2 bg-[#EFF6FF] text-[#2563EB] rounded-lg text-sm font-medium">
                    已选择：{selectedNode}
                  </div>
                )}
                <div className="border-2 border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC] max-h-96 overflow-y-auto">
                  {graphTree && graphTree.tree && graphTree.tree.length > 0 ? (
                    graphTree.tree.map((node: KnowledgeNode) => renderGraphTreeNode(node))
                  ) : (
                    <div className="text-center text-[#94A3B8] py-4">暂无节点</div>
                  )}
                </div>
              </div>
              
              {/* 3. 选择知识点资源 */}
              {selectedNode && (
                <div>
                  <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    3. 选择知识点资源（可选）
                  </label>
                  <p className="text-xs text-[#64748B] mb-3">勾选已有资源作为AI创作的辅助材料</p>
                  
                  {loadingResources ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB]"></div>
                    </div>
                  ) : knowledgePointResources.length > 0 ? (
                    <div className="border-2 border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC] space-y-2 max-h-60 overflow-y-auto">
                      {knowledgePointResources.map((resource) => (
                        <label
                          key={resource.id}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedResourceIds.has(resource.id)
                              ? 'bg-[#EFF6FF] border-2 border-[#2563EB]'
                              : 'bg-white border-2 border-transparent hover:border-[#CBD5E1]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedResourceIds.has(resource.id)}
                            onChange={() => toggleResourceSelection(resource.id)}
                            disabled={generating}
                            className="mt-1 w-4 h-4 text-[#2563EB] border-[#CBD5E1] rounded focus:ring-[#2563EB] focus:ring-2 disabled:opacity-50"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#1E293B] truncate">{resource.resource_name}</div>
                            <div className="text-xs text-[#64748B] mt-0.5">
                              {resource.resource_type.toUpperCase()} · {(resource.file_size / 1024).toFixed(1)}KB
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-[#94A3B8] py-4 text-sm">该知识点暂无资源</div>
                  )}
                  
                  {selectedResourceIds.size > 0 && (
                    <div className="mt-2 text-xs text-[#2563EB] font-medium">
                      已选择 {selectedResourceIds.size} 个资源
                    </div>
                  )}
                </div>
              )}
              
              {/* 4. 提示词 */}
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                  4. 补充提示词（可选）
                </label>
                <p className="text-xs text-[#64748B] mb-3">告诉AI您的具体要求，例如：侧重实践案例、增加图表说明等</p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={generating}
                  placeholder="例如：请在内容中增加实际应用案例，并用表格形式总结要点..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[#E2E8F0] rounded-xl text-sm bg-white hover:border-[#CBD5E1] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] placeholder-[#94A3B8] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed resize-none"
                />
              </div>
              
              {/* 5. 上传辅助资料 */}
              <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                  5. 上传辅助资料（可选）
                </label>
                <p className="text-xs text-[#64748B] mb-3">支持PDF、Word、txt和md格式</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={handleFileSelect}
                  disabled={generating}
                  className="hidden"
                />
                
                <div
                  onClick={() => !generating && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? 'border-[#2563EB] bg-[#EFF6FF]'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
                  } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-12 h-12 mx-auto mb-3 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="text-sm text-[#64748B]">点击或拖拽文件到此处上传</p>
                </div>
                
                {auxiliaryFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {auxiliaryFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <span className="text-sm text-[#1E293B] truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={generating}
                          className="text-[#EF4444] hover:text-[#DC2626] disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Panel: Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col bg-white m-6 rounded-xl border border-[#E2E8F0] shadow-sm">
              {/* Preview Header */}
              <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-bold text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  {contentType === 'word' ? '内容预览' : 'PPT预览'}
                </h2>
                
                {/* 文件名、文件夹选择、保存和导出按钮 */}
                {((contentType === 'word' && generatedContent) || (contentType === 'ppt' && pptProjectId)) && (
                  <div className="flex items-center gap-3">
                    {/* 文件名输入 */}
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder={contentType === 'word' ? "请输入文件名称" : "请输入PPT名称"}
                      disabled={saving || exporting || generating}
                      className="w-64 px-3 py-2 border-2 border-[#E2E8F0] rounded-lg text-sm bg-white hover:border-[#CBD5E1] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] placeholder-[#94A3B8] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed"
                    />
                    
                    {/* 文件夹选择 */}
                    <select
                      value={selectedFolderId || ''}
                      onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={saving || exporting || generating}
                      className="w-48 px-3 py-2 border-2 border-[#E2E8F0] rounded-lg text-sm bg-white hover:border-[#CBD5E1] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed"
                    >
                      <option value="">选择文件夹（可选）</option>
                      {folderTree.map(folder => (
                        <option key={folder.id} value={folder.id}>{folder.folder_name}</option>
                      ))}
                    </select>
                    
                    {/* 保存和导出按钮 */}
                    <button
                      onClick={contentType === 'word' ? handleSave : handleSavePPT}
                      disabled={!fileName || saving || generating}
                      className="px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 text-white bg-[#10B981] hover:bg-[#059669] disabled:bg-[#94A3B8] disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          保存中...
                        </>
                      ) : (
                        <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        保存
                      </>
                    )}
                  </button>
                    <button
                      onClick={contentType === 'word' ? handleExport : handleExportPPT}
                      disabled={!fileName || exporting || generating}
                      className="px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 text-white bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-[#94A3B8] disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      {exporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          导出中...
                        </>
                      ) : (
                        <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                          导出
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Preview Content */}
              <div className="flex-1 overflow-hidden">
                {contentType === 'word' ? (
                  // Word预览模式
                  <div className="h-full overflow-y-auto p-6">
                    {generating ? (
                  <div className="py-16 px-8">
                    {/* 进度条 */}
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-[#2563EB] mb-4"></div>
                        <p className="text-lg font-medium text-[#1E293B] mb-2">{progressMessage || 'AI正在生成内容，请稍候...'}</p>
                        <p className="text-sm text-[#64748B]">根据内容复杂度，通常需要1-3分钟</p>
                      </div>
                      
                      {/* 进度条 */}
                      <div className="relative">
                        <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${generationProgress}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 text-center text-sm font-medium text-[#2563EB]">
                          {generationProgress}%
                        </div>
                      </div>
                      
                      {/* 提示信息 */}
                      <div className="mt-8 p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                          </svg>
                          <div className="text-sm text-[#1E40AF]">
                            <p className="font-medium mb-1">正在为您创作中...</p>
                            <p>AI正在深度理解知识点内容，生成优质教学资料</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : generatedContent ? (
                  <div>
                    {/* 编辑/预览工具栏 */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(generatedContent);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            !isEditing
                              ? 'bg-[#2563EB] text-white shadow-md'
                              : 'text-[#64748B] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            预览
                          </div>
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isEditing
                              ? 'bg-[#2563EB] text-white shadow-md'
                              : 'text-[#64748B] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            编辑
                          </div>
                        </button>
                      </div>
                      
                      <div className="text-sm text-[#64748B]">
                        {isEditing ? '编辑模式' : '预览模式'}
                      </div>
                    </div>
                    
                    {/* 内容显示区域 */}
                    <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                      {isEditing ? (
                        <div>
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full min-h-[500px] px-4 py-3 border-2 border-[#E2E8F0] rounded-xl text-sm bg-white hover:border-[#CBD5E1] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] font-mono resize-vertical"
                            placeholder="在此编辑Markdown内容..."
                          />
                          <div className="mt-2 text-xs text-[#64748B]">
                            提示：支持Markdown格式，可直接编辑标题、列表、表格等
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-slate max-w-none mb-6 px-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {editedContent || generatedContent}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                    ) : (
                      <div className="text-center py-16 text-[#94A3B8]">
                        <svg className="w-24 h-24 mx-auto mb-4 text-[#CBD5E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <p>请选择知识点并点击"AI创作"按钮开始生成内容</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // PPT预览模式
                  <div className="h-full w-full">
                    {generating ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-[#2563EB] mb-4"></div>
                          <p className="text-lg font-medium text-[#1E293B] mb-2">正在生成PPT...</p>
                          <p className="text-sm text-[#64748B]">请稍候，这可能需要几分钟时间</p>
                        </div>
                      </div>
                    ) : pptIframeUrl ? (
                      <iframe
                        src={pptIframeUrl}
                        className="w-full h-full border-0"
                        title="PPT预览"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-[#94A3B8]">
                          <svg className="w-24 h-24 mx-auto mb-4 text-[#CBD5E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                          <p className="text-lg">配置参数后点击"AI创作"按钮生成PPT</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Global drag & drop prevention */}
      <style jsx global>{`
        body {
          overflow: hidden;
        }
      `}</style>
    </TeacherLayout>
  );
}

