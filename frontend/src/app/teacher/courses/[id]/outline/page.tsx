"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import courseOutlineService, { CourseOutline, OutlineChapter, OutlineSection, LearningRule, KnowledgeGraphLink, Homework, HomeworkCreate, HomeworkUpdate, HomeworkAttachment } from '@/services/courseOutline.service';
import { uploadService } from '@/services/upload.service';
import { courseService } from '@/services/course.service';
import { knowledgeGraphService, KnowledgeGraph } from '@/services/knowledgeGraph.service';
import { examService, Exam } from '@/services/exam.service';
import { teachingResourceService, TeachingResource } from '@/services/teachingResource.service';
import { useToast } from '@/hooks/useToast';

interface ChapterNode {
  id: number;
  title: string;
  sort_order: number;
  parent_id?: number | null;
  sections?: ChapterNode[];
  isExpanded?: boolean;
}

export default function CourseOutlinePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const toast = useToast();
  
  const [courseName, setCourseName] = useState<string>('');
  const [chapters, setChapters] = useState<ChapterNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ChapterNode | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 添加/编辑章节
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterNode | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [isSection, setIsSection] = useState(false);
  const [parentChapterId, setParentChapterId] = useState<number | null>(null);
  
  // 资源数据
  const [knowledgeGraphs, setKnowledgeGraphs] = useState<KnowledgeGraph[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [teachingResources, setTeachingResources] = useState<TeachingResource[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  // 学习规则
  const [learningRule, setLearningRule] = useState<LearningRule>({ rule_type: 'none' });
  const [editingLearningRule, setEditingLearningRule] = useState(false);
  
  // 资源关联
  const [linkedKnowledgeGraph, setLinkedKnowledgeGraph] = useState<any>(null);
  const [linkedExams, setLinkedExams] = useState<number[]>([]);
  const [linkedResources, setLinkedResources] = useState<any[]>([]);
  
  // 父章节的知识图谱（用于小节选择子节点）
  const [parentChapterKnowledgeGraph, setParentChapterKnowledgeGraph] = useState<any>(null);
  const [availableKnowledgeNodes, setAvailableKnowledgeNodes] = useState<any[]>([]);
  
  // 章选择知识图谱后，显示该图谱的所有节点
  const [selectedGraphForChapter, setSelectedGraphForChapter] = useState<number | null>(null);
  const [chapterKnowledgeNodes, setChapterKnowledgeNodes] = useState<any[]>([]);

  // 课后作业相关状态
  const [linkedHomeworks, setLinkedHomeworks] = useState<Homework[]>([]);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDescription, setHomeworkDescription] = useState('');
  const [homeworkAttachments, setHomeworkAttachments] = useState<HomeworkAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // 预览相关状态
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');

  useEffect(() => {
    loadCourseInfo();
    loadOutline();
    loadTeacherData();
  }, [courseId]);

  useEffect(() => {
    if (selectedNode) {
      // 重置知识图谱选择状态
      setSelectedGraphForChapter(null);
      setChapterKnowledgeNodes([]);
      loadNodeDetails(selectedNode.id);
    }
  }, [selectedNode]);

  const loadCourseInfo = async () => {
    try {
      const course = await courseService.getById(courseId);
      setCourseName(course.name || course.title || '');
    } catch (error) {
      console.error('Failed to load course info:', error);
    }
  };

  const loadTeacherData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      setTeacherId(user.id);

      // 加载教师的知识图谱、考试、教学资源
      const [graphs, examsList, resources] = await Promise.all([
        knowledgeGraphService.getAll(user.id),
        examService.getAll(user.id, 0, 200),
        teachingResourceService.getAll(user.id, 0, 200)
      ]);

      setKnowledgeGraphs(graphs);
      setExams(examsList);
      setTeachingResources(resources);
    } catch (error) {
      console.error('Failed to load teacher data:', error);
    }
  };

  const loadNodeDetails = async (nodeId: number) => {
    try {
      // 加载学习规则
      try {
        const rule = await courseOutlineService.getLearningRule(nodeId);
        setLearningRule(rule);
      } catch (error) {
        setLearningRule({ rule_type: 'none' });
      }

      // 加载关联的知识图谱
      try {
        const kg = await courseOutlineService.getChapterKnowledgeGraph(nodeId);
        setLinkedKnowledgeGraph(kg);
      } catch (error) {
        setLinkedKnowledgeGraph(null);
      }
      
      // 如果是小节，加载父章节的知识图谱信息
      if (selectedNode?.parent_id) {
        try {
          const parentKg = await courseOutlineService.getChapterKnowledgeGraph(selectedNode.parent_id);
          console.log('父章节知识图谱信息:', parentKg);
          setParentChapterKnowledgeGraph(parentKg);
          
          // 如果父章节有关联知识图谱，获取可选的子节点
          if (parentKg && parentKg.knowledge_graph_id && teacherId) {
            try {
              // 使用knowledgeGraphService获取树形结构
              const treeData = await knowledgeGraphService.getTree(parentKg.knowledge_graph_id, teacherId);
              console.log('树形结构数据:', treeData);
              console.log('tree数组:', treeData.tree);
              
              // 如果父章节关联的是根节点（knowledge_node_id为null），小节选择第一层节点
              if (!parentKg.knowledge_node_id) {
                // 第一层节点就是tree数组中的节点
                console.log('父章节关联根节点，第一层节点:', treeData.tree);
                setAvailableKnowledgeNodes(treeData.tree || []);
      } else {
                // 如果父章节关联了具体节点，小节选择该节点的子节点
                // 需要找到对应的节点并获取其children
                const findNodeById = (nodes: any[], nodeId: number): any => {
                  for (const node of nodes) {
                    if (node.id === nodeId) return node;
                    if (node.children && node.children.length > 0) {
                      const found = findNodeById(node.children, nodeId);
                      if (found) return found;
    }
                  }
                  return null;
  };

                const parentNode = findNodeById(treeData.tree || [], parentKg.knowledge_node_id);
                console.log('找到的父节点:', parentNode);
                console.log('父节点的子节点:', parentNode?.children);
                setAvailableKnowledgeNodes(parentNode?.children || []);
              }
            } catch (error) {
              console.error('获取知识图谱树形结构失败:', error);
              setAvailableKnowledgeNodes([]);
            }
    } else {
            console.log('父章节没有关联知识图谱');
            setAvailableKnowledgeNodes([]);
          }
        } catch (error) {
          console.error('Failed to load parent chapter knowledge graph:', error);
          setParentChapterKnowledgeGraph(null);
          setAvailableKnowledgeNodes([]);
        }
      } else {
        setParentChapterKnowledgeGraph(null);
        setAvailableKnowledgeNodes([]);
      }

      // 从大纲数据中获取关联的考试、资源和作业
      const outline = await courseOutlineService.getOutline(courseId);
      let examIds: number[] = [];
      let resourceList: any[] = [];
      let homeworkList: Homework[] = [];

      outline.outline.forEach((chapter: OutlineChapter) => {
        if (chapter.id === nodeId) {
          examIds = chapter.exam_papers.map((e: any) => e.id);
        }
        chapter.sections.forEach((section: OutlineSection) => {
          if (section.id === nodeId) {
            examIds = section.exam_papers.map((e: any) => e.id);
            resourceList = section.resources;
            homeworkList = section.homeworks || [];
          }
        });
      });

      setLinkedExams(examIds);
      setLinkedResources(resourceList);
      setLinkedHomeworks(homeworkList);
    } catch (error) {
      console.error('Failed to load node details:', error);
    }
  };

  const loadOutline = async () => {
    try {
      setLoading(true);
      const data = await courseOutlineService.getOutline(courseId);
      
      // 转换为树形结构
      const tree: ChapterNode[] = data.outline.map((chapter: OutlineChapter) => ({
        id: chapter.id,
        title: chapter.title,
        sort_order: chapter.sort_order,
        parent_id: null,
        isExpanded: true,
        sections: chapter.sections.map((section: OutlineSection) => ({
          id: section.id,
          title: section.title,
          sort_order: section.sort_order,
              parent_id: chapter.id,
        }))
      }));
      
      setChapters(tree);
    } catch (error: any) {
      console.error('Failed to load outline:', error);
      toast.error('加载大纲失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = () => {
    setEditingChapter(null);
    setChapterTitle('');
    setIsSection(false);
    setParentChapterId(null);
    setShowAddModal(true);
  };

  const handleAddSection = (chapter: ChapterNode) => {
    setEditingChapter(null);
    setChapterTitle('');
    setIsSection(true);
    setParentChapterId(chapter.id);
    setShowAddModal(true);
  };

  const handleEditChapter = (node: ChapterNode) => {
    setEditingChapter(node);
    setChapterTitle(node.title);
    setIsSection(!!node.parent_id);
    setParentChapterId(node.parent_id || null);
    setShowAddModal(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterTitle.trim()) {
      toast.warning('请输入标题');
      return;
    }
    
    try {
      if (editingChapter) {
        // 更新
        await courseOutlineService.updateChapter(editingChapter.id, {
          title: chapterTitle
        });
        toast.success('更新成功');
      } else {
        // 创建
        const sortOrder = isSection && parentChapterId 
          ? (chapters.find(c => c.id === parentChapterId)?.sections?.length || 0)
          : chapters.length;

        await courseOutlineService.createChapter(courseId, {
          title: chapterTitle,
          parent_id: isSection ? parentChapterId : null,
          sort_order: sortOrder
        });
        toast.success('创建成功');
      }

      setShowAddModal(false);
      loadOutline();
    } catch (error: any) {
      console.error('Failed to save chapter:', error);
      toast.error('保存失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteChapter = async (node: ChapterNode) => {
    if (!confirm(`确定要删除"${node.title}"吗？${!node.parent_id ? '（包括所有小节）' : ''}`)) {
      return;
    }
    
    try {
      await courseOutlineService.deleteChapter(node.id);
      toast.success('删除成功');
      loadOutline();
      if (selectedNode?.id === node.id) {
        setSelectedNode(null);
      }
    } catch (error: any) {
      console.error('Failed to delete chapter:', error);
      toast.error('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleChapterExpand = (chapterId: number) => {
    setChapters(chapters.map(chapter => 
      chapter.id === chapterId 
        ? { ...chapter, isExpanded: !chapter.isExpanded }
        : chapter
    ));
  };

  // ========== 学习规则操作 ==========

  const handleSaveLearningRule = async () => {
    if (!selectedNode) return;
    
    try {
      await courseOutlineService.setLearningRule(selectedNode.id, learningRule);
      toast.success('学习规则保存成功');
      setEditingLearningRule(false);
    } catch (error: any) {
      console.error('Failed to save learning rule:', error);
      toast.error('保存失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ========== 知识图谱关联操作 ==========

  // 加载知识图谱的所有节点（用于章选择节点）
  const loadKnowledgeGraphNodes = async (graphId: number) => {
    try {
      if (!teacherId) return [];
      
      // 使用knowledgeGraphService获取树形结构
      const treeData = await knowledgeGraphService.getTree(graphId, teacherId);
      const allNodes: any[] = [];
      const extractNodes = (nodes: any[]) => {
        nodes.forEach(node => {
          allNodes.push({
            id: node.id,
            node_name: node.node_name,
            parent_id: node.parent_id
          });
          if (node.children && node.children.length > 0) {
            extractNodes(node.children);
          }
        });
      };
      if (treeData.tree) {
        extractNodes(treeData.tree);
      }
      return allNodes;
    } catch (error) {
      console.error('Failed to load knowledge nodes:', error);
      return [];
    }
  };

  const handleLinkKnowledgeGraph = async (graphId: number, nodeId?: number) => {
    if (!selectedNode) return;
    
    try {
      await courseOutlineService.linkKnowledgeGraph(selectedNode.id, {
        knowledge_graph_id: graphId,
        knowledge_node_id: nodeId || null
      });
      toast.success('关联成功');
      setSelectedGraphForChapter(null);
      setChapterKnowledgeNodes([]);
      loadNodeDetails(selectedNode.id);
    } catch (error: any) {
      console.error('Failed to link knowledge graph:', error);
      toast.error('关联失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 章选择知识图谱后，加载该图谱的节点
  const handleChapterSelectGraph = async (graphId: number) => {
    setSelectedGraphForChapter(graphId);
    const nodes = await loadKnowledgeGraphNodes(graphId);
    setChapterKnowledgeNodes(nodes);
  };

  const handleUnlinkKnowledgeGraph = async () => {
    if (!selectedNode) return;

    if (!confirm('确定取消关联知识图谱吗？')) return;
    
    try {
      await courseOutlineService.unlinkKnowledgeGraph(selectedNode.id);
      toast.success('取消关联成功');
      setLinkedKnowledgeGraph(null);
    } catch (error: any) {
      console.error('Failed to unlink knowledge graph:', error);
      toast.error('操作失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ========== 考试关联操作 ==========

  const handleLinkExam = async (examPaperId: number) => {
    if (!selectedNode) return;
    if (linkedExams.includes(examPaperId)) {
      toast.warning('该考试已关联');
      return;
    }
    
    try {
      await courseOutlineService.linkExam(selectedNode.id, examPaperId);
      toast.success('关联成功');
      loadNodeDetails(selectedNode.id);
    } catch (error: any) {
      console.error('Failed to link exam:', error);
      toast.error('关联失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUnlinkExam = async (examPaperId: number) => {
    if (!selectedNode) return;

    if (!confirm('确定取消关联该考试吗？')) return;
    
    try {
      await courseOutlineService.unlinkExam(selectedNode.id, examPaperId);
      toast.success('取消关联成功');
      loadNodeDetails(selectedNode.id);
    } catch (error: any) {
      console.error('Failed to unlink exam:', error);
      toast.error('操作失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ========== 教学资源关联操作 ==========

  const handleLinkResource = async (resourceId: number) => {
    if (!selectedNode || !selectedNode.parent_id) {
      toast.warning('只有小节可以关联教学资源');
      return;
    }
    
    if (linkedResources.find(r => r.resource_id === resourceId)) {
      toast.warning('该资源已关联');
      return;
    }
    
    try {
      await courseOutlineService.linkResources(selectedNode.id, 'teaching_resource', resourceId, linkedResources.length);
      toast.success('关联成功');
      loadNodeDetails(selectedNode.id);
    } catch (error: any) {
      console.error('Failed to link resource:', error);
      toast.error('关联失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUnlinkResource = async (resourceId: number) => {
    if (!selectedNode) return;

    if (!confirm('确定取消关联该资源吗？')) return;

    try {
      await courseOutlineService.unlinkResource(selectedNode.id, resourceId);
      toast.success('取消关联成功');
      loadNodeDetails(selectedNode.id);
    } catch (error: any) {
      console.error('Failed to unlink resource:', error);
      toast.error('操作失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // ========== 课后作业操作 ==========

  const handleAddHomework = () => {
    setEditingHomework(null);
    setHomeworkTitle('');
    setHomeworkDescription('');
    setHomeworkAttachments([]);
    setShowHomeworkModal(true);
  };

  const handleEditHomework = (homework: Homework) => {
    setEditingHomework(homework);
    setHomeworkTitle(homework.title);
    setHomeworkDescription(homework.description || '');
    setHomeworkAttachments(homework.attachments || []);
    setShowHomeworkModal(true);
  };

  const handleSaveHomework = async () => {
    if (!selectedNode || !selectedNode.parent_id) {
      toast.warning('只有小节可以添加作业');
      return;
    }

    if (!homeworkTitle.trim()) {
      toast.warning('请输入作业标题');
      return;
    }

    try {
      if (editingHomework) {
        // 更新作业
        const updateData: HomeworkUpdate = {
          title: homeworkTitle,
          description: homeworkDescription || undefined,
          attachments: homeworkAttachments.length > 0 ? homeworkAttachments : undefined,
        };
        await courseOutlineService.updateHomework(editingHomework.id, updateData);
        toast.success('作业更新成功');
      } else {
        // 创建作业
        const createData: HomeworkCreate = {
          title: homeworkTitle,
          description: homeworkDescription || undefined,
          sort_order: linkedHomeworks.length,
          attachments: homeworkAttachments.length > 0 ? homeworkAttachments : undefined,
        };
        await courseOutlineService.createHomework(selectedNode.id, createData);
        toast.success('作业创建成功');
      }

      setShowHomeworkModal(false);
      loadNodeDetails(selectedNode.id);
    } catch (error: any) {
      console.error('Failed to save homework:', error);
      toast.error('保存失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteHomework = async (homeworkId: number) => {
    if (!confirm('确定要删除这个作业吗？')) return;

    try {
      await courseOutlineService.deleteHomework(homeworkId);
      toast.success('作业删除成功');
      if (selectedNode) {
        loadNodeDetails(selectedNode.id);
      }
    } catch (error: any) {
      console.error('Failed to delete homework:', error);
      toast.error('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadService.uploadFile(file, 'homework');

        const newAttachment: HomeworkAttachment = {
          file_name: file.name,
          file_url: result.url,
          file_size: file.size,
          file_type: file.type,
        };
        setHomeworkAttachments(prev => [...prev, newAttachment]);
      }
      toast.success('文件上传成功');
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      toast.error('文件上传失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingFile(false);
      // 清空input
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setHomeworkAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

    return (
      <TeacherLayout>
      <toast.ToastContainer />
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-900 mb-2 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                返回
              </button>
              <h1 className="text-3xl font-bold text-slate-900">{courseName} - 课程大纲</h1>
              <p className="text-slate-600 mt-2">编辑课程的章节结构和关联资源</p>
            </div>
              <button
                onClick={handleAddChapter}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
              添加章
              </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Tree Structure */}
          <div className="w-1/3 border-r border-slate-200 bg-white overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">章节结构</h2>
              
              {loading ? (
                <div className="text-center py-8 text-slate-500">加载中...</div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>暂无章节</p>
                  <p className="text-sm mt-2">点击右上角"添加章"开始创建</p>
            </div>
          ) : (
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Chapter */}
                  <div
                        onClick={() => setSelectedNode(chapter)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          selectedNode?.id === chapter.id 
                            ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                              toggleChapterExpand(chapter.id);
                          }}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <svg className={`w-4 h-4 transition-transform ${chapter.isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                          </svg>
                          <span className="font-medium text-slate-900">{chapter.title}</span>
                        </div>
                        <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                              handleAddSection(chapter);
                          }}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            title="添加小节"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                              handleEditChapter(chapter);
                          }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600"
                            title="编辑"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                              handleDeleteChapter(chapter);
                          }}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                    </div>
                  </div>

                      {/* Sections */}
                      {chapter.isExpanded && chapter.sections && chapter.sections.length > 0 && (
                        <div className="bg-slate-50">
                          {chapter.sections.map((section) => (
                            <div
                              key={section.id}
                              onClick={() => setSelectedNode(section)}
                              className={`p-3 pl-12 flex items-center justify-between cursor-pointer transition-colors border-t border-slate-200 ${
                                selectedNode?.id === section.id 
                                  ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                                  : 'hover:bg-slate-100'
                              }`}
                                >
                              <div className="flex items-center gap-2 flex-1">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                <span className="text-slate-700">{section.title}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                        <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditChapter(section);
                                  }}
                                  className="p-1 hover:bg-slate-200 rounded text-slate-600"
                                  title="编辑"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                          </svg>
                                        </button>
                                        <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteChapter(section);
                                  }}
                                  className="p-1 hover:bg-red-100 rounded text-red-600"
                                  title="删除"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

          {/* Right Panel - Details */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
            {selectedNode ? (
              <div className="max-w-4xl space-y-6">
                {/* 基本信息 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedNode.title}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700">类型</label>
                      <p className="text-slate-900">{selectedNode.parent_id ? '小节' : '章'}</p>
            </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">排序</label>
                      <p className="text-slate-900">第 {selectedNode.sort_order + 1} {selectedNode.parent_id ? '节' : '章'}</p>
              </div>
              </div>
                </div>

                {/* 学习规则 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">学习规则</h3>
                    {!editingLearningRule && (
                <button
                        onClick={() => setEditingLearningRule(true)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                        编辑
                </button>
                    )}
                  </div>

                  {editingLearningRule ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">规则类型</label>
                        <select
                          value={learningRule.rule_type}
                          onChange={(e) => setLearningRule({ ...learningRule, rule_type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="none">无条件</option>
                          <option value="completion">完成度要求</option>
                          <option value="exam">通过测验</option>
                        </select>
            </div>

                      {learningRule.rule_type === 'completion' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">完成度要求（%）</label>
                <input
                  type="number"
                            min="0"
                            max="100"
                            value={learningRule.completion_percentage || ''}
                            onChange={(e) => setLearningRule({ ...learningRule, completion_percentage: parseInt(e.target.value) || null })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="输入0-100的数字"
                />
              </div>
                      )}

                      {learningRule.rule_type !== 'none' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">目标章节（上一章/节）</label>
                          <select
                            value={learningRule.target_chapter_id || ''}
                            onChange={(e) => setLearningRule({ ...learningRule, target_chapter_id: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">请选择</option>
                            {chapters.map(chapter => (
                              <>
                                <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                                {chapter.sections?.map(section => (
                                  <option key={section.id} value={section.id}>&nbsp;&nbsp;{section.title}</option>
                                ))}
                              </>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2">
                <button
                          onClick={() => setEditingLearningRule(false)}
                          className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                          取消
                </button>
                <button
                          onClick={handleSaveLearningRule}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                          保存
                </button>
              </div>
            </div>
                  ) : (
                    <div className="text-slate-600">
                      <p>
                        规则类型：
                        {learningRule.rule_type === 'none' && '无条件'}
                        {learningRule.rule_type === 'completion' && `完成度要求 ${learningRule.completion_percentage}%`}
                        {learningRule.rule_type === 'exam' && '通过测验'}
                      </p>
                      {learningRule.target_chapter_id && (
                        <p className="text-sm mt-1">
                          目标章节ID: {learningRule.target_chapter_id}
                        </p>
                      )}
        </div>
      )}
                </div>

                {/* 知识图谱关联 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">知识图谱关联</h3>
                  
                  {linkedKnowledgeGraph ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-slate-900">
                          {linkedKnowledgeGraph.knowledge_graph_name}
                          {linkedKnowledgeGraph.knowledge_node_name && ` - ${linkedKnowledgeGraph.knowledge_node_name}`}
                        </span>
                        <button
                          onClick={handleUnlinkKnowledgeGraph}
                          className="text-red-600 hover:text-red-700"
                        >
                          取消关联
                        </button>
            </div>
                    </div>
                  ) : (
                    <div>
                      {/* 章：选择知识图谱和节点 */}
                      {!selectedNode.parent_id ? (
                        <div className="space-y-3">
                          {/* 第一步：选择知识图谱 */}
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              1. 选择知识图谱
                  </label>
                            <select
                              value={selectedGraphForChapter || ''}
                      onChange={(e) => {
                                const graphId = parseInt(e.target.value);
                                if (graphId) {
                                  handleChapterSelectGraph(graphId);
                                } else {
                                  setSelectedGraphForChapter(null);
                                  setChapterKnowledgeNodes([]);
                                }
                      }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">请选择知识图谱</option>
                              {knowledgeGraphs.map(kg => (
                                <option key={kg.id} value={kg.id}>{kg.graph_name}</option>
                              ))}
                            </select>
                </div>

                          {/* 第二步：选择具体节点 */}
                          {selectedGraphForChapter && (
                        <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                2. 选择节点（可选）
                      </label>
                              {chapterKnowledgeNodes.length > 0 ? (
                                <select
                                  onChange={(e) => {
                                    const nodeId = e.target.value ? parseInt(e.target.value) : undefined;
                                    if (selectedGraphForChapter) {
                                      handleLinkKnowledgeGraph(selectedGraphForChapter, nodeId);
                                    }
                  }}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  defaultValue=""
                                >
                                  <option value="">选择节点（留空则关联根节点）</option>
                                  {chapterKnowledgeNodes.map(node => (
                                    <option key={node.id} value={node.id}>
                                      {node.node_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-sm text-slate-500 p-3 bg-slate-50 rounded">
                                  该知识图谱暂无节点
                                </div>
                              )}
                <button
                                onClick={() => handleLinkKnowledgeGraph(selectedGraphForChapter)}
                                className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                                关联根节点（不选择具体节点）
                </button>
        </div>
      )}

                          <p className="text-xs text-slate-500">
                            章可以关联知识图谱的根节点或具体节点
                          </p>
            </div>
                      ) : (
                        /* 小节：选择父章节知识图谱的子节点 */
                        parentChapterKnowledgeGraph ? (
                          <>
                            <div className="mb-3 p-2 bg-slate-50 rounded text-sm text-slate-600">
                              父章节已关联：{parentChapterKnowledgeGraph.knowledge_graph_name}
                        </div>
                            {availableKnowledgeNodes.length > 0 ? (
                              <>
                                <select
                                  onChange={(e) => {
                                    const nodeId = parseInt(e.target.value);
                                    if (nodeId && parentChapterKnowledgeGraph.knowledge_graph_id) {
                                      handleLinkKnowledgeGraph(
                                        parentChapterKnowledgeGraph.knowledge_graph_id,
                                        nodeId
                                      );
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  defaultValue=""
                                >
                                  <option value="">选择子节点</option>
                                  {availableKnowledgeNodes.map(node => (
                                    <option key={node.id} value={node.id}>
                                      {node.node_name}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                  小节只能关联父章节知识图谱的子节点
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">父章节的知识图谱暂无子节点</p>
                            )}
                          </>
                        ) : (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              请先在父章节"{chapters.find(c => c.id === selectedNode.parent_id)?.title}"关联知识图谱
                            </p>
                </div>
                        )
                      )}
              </div>
                  )}
                </div>

                {/* 考试关联 */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">考试关联</h3>
                  
                  <div className="space-y-3">
                    {linkedExams.length > 0 && (
                      <div className="space-y-2">
                        {linkedExams.map(examId => {
                          const exam = exams.find(e => e.id === examId);
                          return exam ? (
                            <div key={examId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div>
                                <div className="text-slate-900 font-medium">{exam.exam_name}</div>
                                <div className="text-sm text-slate-500">
                                  {exam.start_time ? new Date(exam.start_time).toLocaleString('zh-CN') : '未设置时间'}
                                </div>
                              </div>
                <button
                                onClick={() => handleUnlinkExam(examId)}
                                className="text-red-600 hover:text-red-700 text-sm"
                >
                  取消
                </button>
              </div>
                          ) : null;
                        })}
        </div>
      )}

                    <select
                      onChange={(e) => {
                        const examId = parseInt(e.target.value);
                        if (examId) {
                          handleLinkExam(examId);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="">添加考试</option>
                      {exams.filter(e => !linkedExams.includes(e.id)).map(exam => (
                        <option key={exam.id} value={exam.id}>
                          {exam.exam_name} ({exam.start_time ? new Date(exam.start_time).toLocaleDateString('zh-CN') : '未设置日期'})
                        </option>
                      ))}
                    </select>
            </div>
              </div>

                {/* 教学资源关联（仅小节） */}
                {selectedNode.parent_id && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">教学资源关联</h3>
                    
                    <div className="space-y-3">
                      {linkedResources.length > 0 && (
                        <div className="space-y-2">
                          {linkedResources.map(res => {
                            const resource = teachingResources.find(r => r.id === res.resource_id);
                            return resource ? (
                              <div key={res.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <div>
                                  <span className="text-slate-900">{resource.resource_name}</span>
                                  <span className="text-xs text-slate-500 ml-2">({resource.resource_type})</span>
              </div>
                <button
                                  onClick={() => handleUnlinkResource(res.resource_id)}
                                  className="text-red-600 hover:text-red-700 text-sm"
                >
                                  取消
                </button>
              </div>
                            ) : null;
                          })}
        </div>
      )}

                <select
                        onChange={(e) => {
                          const resourceId = parseInt(e.target.value);
                          if (resourceId) {
                            handleLinkResource(resourceId);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                >
                        <option value="">添加教学资源</option>
                        {teachingResources
                          .filter(r => !linkedResources.find(lr => lr.resource_id === r.id))
                          .map(resource => (
                            <option key={resource.id} value={resource.id}>
                              {resource.resource_name} ({resource.resource_type})
                    </option>
                  ))}
                </select>
                    </div>
                  </div>
              )}

                {/* 课后作业（仅小节） */}
                {selectedNode.parent_id && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900">课后作业</h3>
                      <button
                        onClick={handleAddHomework}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        添加作业
                      </button>
                    </div>

                    <div className="space-y-3">
                      {linkedHomeworks.length > 0 ? (
                        <div className="space-y-3">
                          {linkedHomeworks.map((homework) => (
                            <div key={homework.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-slate-900">{homework.title}</h4>
                                  {homework.description && (
                                    <div
                                      className="text-sm text-slate-600 mt-1 prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{ __html: homework.description }}
                                    />
                                  )}
                                  {homework.attachments && homework.attachments.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-slate-500 mb-1">附件：</p>
                                      <div className="flex flex-wrap gap-2">
                                        {homework.attachments.map((att, idx) => (
                                          <div key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-xs border border-slate-200">
                                            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                            </svg>
                                            <span className="text-slate-700">{att.file_name}</span>
                                            {uploadService.isPreviewable(att.file_name) && (
                                              <button
                                                onClick={async (e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  try {
                                                    const result = await uploadService.getPreviewUrl(att.file_url);
                                                    setPreviewUrl(result.preview_url);
                                                    setPreviewFileName(att.file_name);
                                                    setShowPreviewModal(true);
                                                  } catch (error: any) {
                                                    console.error('预览失败:', error);
                                                    toast.error('预览失败: ' + (error.response?.data?.detail || error.message));
                                                  }
                                                }}
                                                className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                                                title="在线预览"
                                              >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                              </button>
                                            )}
                                            <a
                                              href={att.file_url}
                                              download
                                              className="ml-1 text-slate-500 hover:text-slate-700"
                                              title="下载"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                              </svg>
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <button
                                    onClick={() => handleEditHomework(homework)}
                                    className="p-1 hover:bg-blue-200 rounded text-slate-600"
                                    title="编辑"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteHomework(homework.id)}
                                    className="p-1 hover:bg-red-100 rounded text-red-600"
                                    title="删除"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-500">
                          <svg className="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                          </svg>
                          <p className="text-sm">暂无作业</p>
                          <p className="text-xs mt-1">点击上方"添加作业"按钮创建课后作业</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-slate-500 text-lg">请选择一个章节或小节</p>
                  <p className="text-slate-400 text-sm mt-2">在左侧点击章节查看详情并设置学习规则和资源关联</p>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full m-4 p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {editingChapter ? '编辑' : '添加'}{isSection ? '小节' : '章'}
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`请输入${isSection ? '小节' : '章'}标题`}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveChapter}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 课后作业编辑弹窗 */}
      {showHomeworkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingHomework ? '编辑作业' : '添加作业'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* 作业标题 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  作业标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={homeworkTitle}
                  onChange={(e) => setHomeworkTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入作业标题"
                />
              </div>

              {/* 作业要求（富文本） */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  作业要求
                </label>
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('homework-description') as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const selectedText = text.substring(start, end);
                        const newText = text.substring(0, start) + '<strong>' + selectedText + '</strong>' + text.substring(end);
                        setHomeworkDescription(newText);
                      }}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                      title="加粗"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 12h8a4 4 0 100-8H6v8zm0 0h9a4 4 0 110 8H6v-8z"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('homework-description') as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const selectedText = text.substring(start, end);
                        const newText = text.substring(0, start) + '<em>' + selectedText + '</em>' + text.substring(end);
                        setHomeworkDescription(newText);
                      }}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                      title="斜体"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l-4 4 4 4M6 16l4-4-4-4"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHomeworkDescription(prev => prev + '<ul><li>项目1</li><li>项目2</li></ul>');
                      }}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                      title="无序列表"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHomeworkDescription(prev => prev + '<ol><li>步骤1</li><li>步骤2</li></ol>');
                      }}
                      className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                      title="有序列表"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                      </svg>
                    </button>
                  </div>
                  <textarea
                    id="homework-description"
                    value={homeworkDescription}
                    onChange={(e) => setHomeworkDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border-0 focus:ring-0 resize-none"
                    placeholder="请输入作业要求，支持HTML格式..."
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">支持HTML格式，如 &lt;strong&gt;加粗&lt;/strong&gt;、&lt;ul&gt;&lt;li&gt;列表&lt;/li&gt;&lt;/ul&gt;</p>
              </div>

              {/* 附件上传 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  附件
                </label>

                {/* 已上传的附件列表 */}
                {homeworkAttachments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {homeworkAttachments.map((att, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                          </svg>
                          <span className="text-sm text-slate-700">{att.file_name}</span>
                          {att.file_size && (
                            <span className="text-xs text-slate-500">({formatFileSize(att.file_size)})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {uploadService.isPreviewable(att.file_name) && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                try {
                                  const result = await uploadService.getPreviewUrl(att.file_url);
                                  setPreviewUrl(result.preview_url);
                                  setPreviewFileName(att.file_name);
                                  setShowPreviewModal(true);
                                } catch (error: any) {
                                  console.error('预览失败:', error);
                                  toast.error('预览失败: ' + (error.response?.data?.detail || error.message));
                                }
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600 cursor-pointer"
                              title="在线预览"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(index)}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
                            title="删除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 上传按钮 */}
                <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                  />
                  {uploadingFile ? (
                    <>
                      <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-slate-500">上传中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                      <span className="text-slate-500">点击上传附件</span>
                    </>
                  )}
                </label>
                <p className="text-xs text-slate-500 mt-1">支持 PDF、Office文档、图片、压缩包等格式，单个文件不超过100MB</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowHomeworkModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveHomework}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文档预览模态框 */}
      {showPreviewModal && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[95vw] h-[95vh] flex flex-col">
            {/* 预览头部 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                文档预览 - {previewFileName}
              </h3>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPreviewUrl(null);
                  setPreviewFileName('');
                }}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* 预览内容 */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="文档预览"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
              />
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
