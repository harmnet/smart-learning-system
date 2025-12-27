"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { courseService } from '@/services/course.service';
import { courseOutlineService, Chapter, Section } from '@/services/courseOutline.service';
import { teachingResourceService, TeachingResource } from '@/services/teachingResource.service';
import { referenceMaterialService, ReferenceMaterial } from '@/services/referenceMaterial.service';
import { examPaperService, ExamPaper } from '@/services/examPaper.service';
import { knowledgeGraphService, KnowledgeGraph, KnowledgeNode } from '@/services/knowledgeGraph.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';

export default function CourseOutlinePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);
  
  const [course, setCourse] = useState<any>(null);
  const [outline, setOutline] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  
  // 弹窗状态
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showExamPaperModal, setShowExamPaperModal] = useState(false);
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showImportFromGraphModal, setShowImportFromGraphModal] = useState(false);
  
  // 知识图谱导入相关状态
  const [knowledgeGraphs, setKnowledgeGraphs] = useState<KnowledgeGraph[]>([]);
  const [selectedGraphId, setSelectedGraphId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  
  // 编辑状态
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingHomework, setEditingHomework] = useState<any>(null);
  const [parentChapterId, setParentChapterId] = useState<number | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
  
  // 表单数据
  const [chapterForm, setChapterForm] = useState({ title: '', sort_order: 0 });
  const [sectionForm, setSectionForm] = useState({ title: '', sort_order: 0 });
  const [homeworkForm, setHomeworkForm] = useState({ title: '', description: '', deadline: '' });
  
  // 资源数据
  const [teachingResources, setTeachingResources] = useState<TeachingResource[]>([]);
  const [referenceMaterials, setReferenceMaterials] = useState<ReferenceMaterial[]>([]);
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [selectedResourceType, setSelectedResourceType] = useState<'teaching_resource' | 'reference_material'>('teaching_resource');
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [selectedExamPaperId, setSelectedExamPaperId] = useState<number | null>(null);

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
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const teacherId = getTeacherId();
      if (!teacherId) {
        alert('无法获取教师信息');
        return;
      }

      console.log('开始加载数据，教师ID:', teacherId, '课程ID:', courseId);

      // 使用当前登录用户的ID加载资源（因为教师是在为自己的课程大纲添加资源）
      // 优先使用当前登录用户的资源，而不是课程主讲教师的资源
      const resourceTeacherId = teacherId;
      console.log('使用当前登录用户ID加载资源:', resourceTeacherId);

      // 使用 Promise.allSettled 来避免一个请求失败导致所有请求失败
      const results = await Promise.allSettled([
        courseService.getById(courseId),
        courseOutlineService.getOutline(courseId),
        teachingResourceService.getAll(resourceTeacherId, 0, 1000),
        referenceMaterialService.getAll(resourceTeacherId, 0, 1000),
        examPaperService.getAll(resourceTeacherId, 0, 1000)
      ]);
      
      console.log('所有请求完成，结果:', results.map((r, i) => ({
        index: i,
        status: r.status,
        hasValue: r.status === 'fulfilled' ? !!r.value : false,
        valueType: r.status === 'fulfilled' ? (Array.isArray(r.value) ? 'array' : typeof r.value) : 'error'
      })));
      
      // 处理课程数据
      let courseMainTeacherId: number | undefined = undefined;
      if (results[0].status === 'fulfilled') {
        setCourse(results[0].value);
        courseMainTeacherId = results[0].value.main_teacher_id;
        console.log('课程主讲教师ID:', courseMainTeacherId);
      } else {
        console.error('Failed to load course:', results[0].reason);
        throw new Error('加载课程信息失败: ' + (results[0].reason?.response?.data?.detail || results[0].reason?.message || '未知错误'));
      }
      
      // 处理大纲数据
      if (results[1].status === 'fulfilled') {
        const outlineData = results[1].value.outline || [];
        console.log('大纲数据加载成功:', outlineData.length, '个章节');
        console.log('大纲数据详情:', JSON.stringify(outlineData, null, 2));
        setOutline(outlineData);
        // 默认展开所有章
        const chapterIds = outlineData.map((ch: Chapter) => ch.id);
        setExpandedChapters(new Set(chapterIds));
      } else {
        console.error('Failed to load outline:', results[1].reason);
        console.error('错误详情:', results[1].reason?.response?.data || results[1].reason?.message);
        // 大纲加载失败不影响其他数据，只设置空数组
        setOutline([]);
        setExpandedChapters(new Set());
      }
      
      // 处理教学资源 - 使用当前登录用户的资源
      console.log('加载教学资源，使用教师ID:', resourceTeacherId, '(当前登录用户:', teacherId, ')');
      if (results[2].status === 'fulfilled') {
        // 后端返回的是数组，不是 {items: [...]} 格式
        const teachingResourcesData = Array.isArray(results[2].value) 
          ? results[2].value 
          : (results[2].value.items || []);
        console.log('教学资源加载成功:', teachingResourcesData.length, '个资源');
        console.log('教学资源数据:', teachingResourcesData);
        setTeachingResources(teachingResourcesData);
      } else {
        console.error('Failed to load teaching resources:', results[2].reason);
        setTeachingResources([]);
      }
      
      // 处理参考资料 - 使用课程主讲教师ID，如果没有则使用当前登录用户ID
      console.log('加载参考资料，使用教师ID:', resourceTeacherId);
      if (results[3].status === 'fulfilled') {
        // 后端返回的是数组，不是 {items: [...]} 格式
        const referenceMaterialsData = Array.isArray(results[3].value) 
          ? results[3].value 
          : (results[3].value.items || []);
        console.log('参考资料加载成功:', referenceMaterialsData.length, '个资源');
        console.log('参考资料数据:', referenceMaterialsData);
        setReferenceMaterials(referenceMaterialsData);
      } else {
        console.error('Failed to load reference materials:', results[3].reason);
        setReferenceMaterials([]);
      }
      
      // 处理试卷
      if (results[4].status === 'fulfilled') {
        setExamPapers(results[4].value || []);
      } else {
        console.error('Failed to load exam papers:', results[4].reason);
        setExamPapers([]);
      }
      
    } catch (error: any) {
      console.error('Failed to load data:', error);
      // 只在关键错误时提示，避免重复弹窗
      if (error.message && !error.message.includes('加载')) {
        alert('加载失败: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  // 从知识图谱导入
  const handleImportFromGraph = async () => {
    const teacherId = getTeacherId();
    if (!teacherId) {
      alert('无法获取教师信息');
      return;
    }
    
    try {
      const graphs = await knowledgeGraphService.getAll(teacherId);
      setKnowledgeGraphs(graphs);
      setSelectedGraphId(null);
      setShowImportFromGraphModal(true);
    } catch (error: any) {
      console.error('Failed to load knowledge graphs:', error);
      alert('加载知识图谱失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 执行导入
  const handleExecuteImport = async () => {
    if (!selectedGraphId) {
      alert('请选择知识图谱');
      return;
    }

    const teacherId = getTeacherId();
    if (!teacherId) {
      alert('无法获取教师信息');
      return;
    }

    setImporting(true);
    try {
      // 获取知识图谱的树状结构
      const graphTree = await knowledgeGraphService.getTree(selectedGraphId, teacherId);
      
      if (!graphTree.tree || graphTree.tree.length === 0) {
        alert('该知识图谱没有节点数据');
        setImporting(false);
        return;
      }

      // 导入前两层：根节点作为章，第一层子节点作为小节
      let chapterSortOrder = outline.length;
      
      for (const rootNode of graphTree.tree) {
        // 创建章（根节点）
        const chapter = await courseOutlineService.createChapter(courseId, {
          title: rootNode.node_name,
          sort_order: chapterSortOrder++,
        });

        // 如果有子节点，创建小节
        if (rootNode.children && rootNode.children.length > 0) {
          let sectionSortOrder = 0;
          for (const childNode of rootNode.children) {
            await courseOutlineService.createChapter(courseId, {
              title: childNode.node_name,
              sort_order: sectionSortOrder++,
              parent_id: chapter.id,
            });
          }
        }
      }

      alert('导入成功！');
      setShowImportFromGraphModal(false);
      setSelectedGraphId(null);
      await loadData(); // 重新加载大纲数据
    } catch (error: any) {
      console.error('Failed to import from knowledge graph:', error);
      alert('导入失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setImporting(false);
    }
  };

  // 添加章
  const handleAddChapter = () => {
    setEditingChapter(null);
    // 确保清空所有字段，包括可能的id字段
    setChapterForm({ title: '', sort_order: outline.length });
    setShowChapterModal(true);
  };

  // 编辑章
  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterForm({ title: chapter.title, sort_order: chapter.sort_order });
    setShowChapterModal(true);
  };

  // 保存章
  const handleSaveChapter = async () => {
    if (!chapterForm.title.trim()) {
      alert(t.teacher.courseManagement?.chapterTitleRequired || '请输入章标题');
      return;
    }
    
    try {
      if (editingChapter) {
        await courseOutlineService.updateChapter(editingChapter.id, chapterForm);
        alert(t.common.success || '章更新成功');
      } else {
        // 创建章节时，只发送必要的字段，不包含id
        // 从chapterForm中提取，确保不包含任何id字段
        const { title, sort_order } = chapterForm;
        const createData: { title: string; sort_order: number; parent_id?: number } = {
          title: title.trim(),
          sort_order: sort_order || 0,
        };
        // 不设置parent_id，除非明确需要
        console.log('开始创建章节，课程ID:', courseId, '章节数据:', createData);
        console.log('原始chapterForm:', chapterForm);
        const newChapter = await courseOutlineService.createChapter(courseId, createData);
        console.log('创建章节成功，返回数据:', newChapter);
        alert(t.common.success || '章创建成功');
      }
      setShowChapterModal(false);
      setChapterForm({ title: '', sort_order: 0 });
      setEditingChapter(null);
      // 重新加载数据以确保数据同步
      console.log('开始重新加载数据...');
      await loadData();
      console.log('数据重新加载完成');
    } catch (error: any) {
      console.error('Failed to save chapter:', error);
      alert('保存失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 删除章
  const handleDeleteChapter = async (chapterId: number) => {
    if (!confirm('确定要删除这个章吗？删除后该章下的所有小节、资源、试卷和作业都会被删除。')) {
      return;
    }
    
    try {
      await courseOutlineService.deleteChapter(chapterId);
      alert('章删除成功');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete chapter:', error);
      alert('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 添加小节
  const handleAddSection = (chapterId: number) => {
    setParentChapterId(chapterId);
    setEditingSection(null);
    const chapter = outline.find(ch => ch.id === chapterId);
    setSectionForm({ title: '', sort_order: chapter?.sections?.length || 0 });
    setShowSectionModal(true);
  };

  // 编辑小节
  const handleEditSection = (section: Section, chapterId: number) => {
    setParentChapterId(chapterId);
    setEditingSection(section);
    setSectionForm({ title: section.title, sort_order: section.sort_order });
    setShowSectionModal(true);
  };

  // 保存小节
  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      alert(t.teacher.courseManagement?.sectionTitleRequired || '请输入小节标题');
      return;
    }
    
    if (!parentChapterId) {
      alert('缺少父章信息');
      return;
    }
    
    try {
      if (editingSection) {
        await courseOutlineService.updateChapter(editingSection.id, sectionForm);
        alert('小节更新成功');
      } else {
        await courseOutlineService.createChapter(courseId, {
          ...sectionForm,
          parent_id: parentChapterId
        });
        alert('小节创建成功');
      }
      setShowSectionModal(false);
      setParentChapterId(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to save section:', error);
      alert('保存失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 删除小节
  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('确定要删除这个小节吗？删除后该小节下的所有资源、试卷和作业都会被删除。')) {
      return;
    }
    
    try {
      await courseOutlineService.deleteChapter(sectionId);
      alert('小节删除成功');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete section:', error);
      alert('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 添加资源
  const handleAddResource = (sectionId: number) => {
    setTargetSectionId(sectionId);
    setSelectedResourceType('teaching_resource');
    setSelectedResourceId(null);
    setShowResourceModal(true);
  };

  // 保存资源
  const handleSaveResource = async () => {
    if (!targetSectionId || !selectedResourceId) {
      alert('请选择资源');
      return;
    }
    
    try {
      await courseOutlineService.addSectionResource(targetSectionId, {
        resource_type: selectedResourceType,
        resource_id: selectedResourceId,
        sort_order: 0
      });
      alert('资源添加成功');
      setShowResourceModal(false);
      setTargetSectionId(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to add resource:', error);
      alert('添加失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 删除资源
  const handleDeleteResource = async (sectionId: number, resourceId: number) => {
    if (!confirm('确定要移除这个资源吗？')) {
      return;
    }
    
    try {
      await courseOutlineService.removeSectionResource(sectionId, resourceId);
      alert('资源移除成功');
      loadData();
    } catch (error: any) {
      console.error('Failed to remove resource:', error);
      alert('移除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 关联试卷
  const handleLinkExamPaper = (chapterId: number) => {
    setTargetSectionId(chapterId);
    setSelectedExamPaperId(null);
    setShowExamPaperModal(true);
  };

  // 保存试卷关联
  const handleSaveExamPaperLink = async () => {
    if (!targetSectionId || !selectedExamPaperId) {
      alert('请选择试卷');
      return;
    }
    
    try {
      await courseOutlineService.linkExamPaper(targetSectionId, selectedExamPaperId);
      alert('试卷关联成功');
      setShowExamPaperModal(false);
      setTargetSectionId(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to link exam paper:', error);
      alert('关联失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 取消关联试卷
  const handleUnlinkExamPaper = async (chapterId: number, examPaperId: number) => {
    if (!confirm('确定要取消关联这个试卷吗？')) {
      return;
    }
    
    try {
      await courseOutlineService.unlinkExamPaper(chapterId, examPaperId);
      alert('取消关联成功');
      loadData();
    } catch (error: any) {
      console.error('Failed to unlink exam paper:', error);
      alert('取消关联失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 添加作业
  const handleAddHomework = (sectionId: number) => {
    setTargetSectionId(sectionId);
    setEditingHomework(null);
    setHomeworkForm({ title: '', description: '', deadline: '' });
    setShowHomeworkModal(true);
  };

  // 编辑作业
  const handleEditHomework = (homework: any, sectionId: number) => {
    setTargetSectionId(sectionId);
    setEditingHomework(homework);
    setHomeworkForm({
      title: homework.title,
      description: homework.description || '',
      deadline: homework.deadline ? new Date(homework.deadline).toISOString().slice(0, 16) : ''
    });
    setShowHomeworkModal(true);
  };

  // 保存作业
  const handleSaveHomework = async () => {
    if (!homeworkForm.title.trim()) {
      alert('请输入作业标题');
      return;
    }
    
    if (!targetSectionId) {
      alert('缺少小节信息');
      return;
    }
    
    try {
      const homeworkData: any = {
        title: homeworkForm.title,
        description: homeworkForm.description || undefined,
        sort_order: 0
      };
      
      if (homeworkForm.deadline) {
        homeworkData.deadline = new Date(homeworkForm.deadline).toISOString();
      }
      
      if (editingHomework) {
        await courseOutlineService.updateHomework(editingHomework.id, homeworkData);
        alert('作业更新成功');
      } else {
        await courseOutlineService.createHomework(targetSectionId, homeworkData);
        alert('作业创建成功');
      }
      setShowHomeworkModal(false);
      setTargetSectionId(null);
      loadData();
    } catch (error: any) {
      console.error('Failed to save homework:', error);
      alert('保存失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 删除作业
  const handleDeleteHomework = async (homeworkId: number) => {
    if (!confirm('确定要删除这个作业吗？')) {
      return;
    }
    
    try {
      await courseOutlineService.deleteHomework(homeworkId);
      alert('作业删除成功');
      loadData();
    } catch (error: any) {
      console.error('Failed to delete homework:', error);
      alert('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-500">加载中...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/teacher/courses')}
                className="mb-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                返回课程列表
              </button>
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                {t.teacher.courseManagement?.outlineTitle || '课程大纲'}：{course?.name || course?.title}
              </h1>
              <p className="text-sm text-slate-500">
                {t.teacher.courseManagement?.manageOutline || '管理课程的章、小节、资源和作业'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleImportFromGraph}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                从知识图谱导入
              </button>
              <button
                onClick={handleAddChapter}
                className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {t.teacher.courseManagement?.addChapter || '添加新章'}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {outline.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-slate-500 mb-4">{t.teacher.courseManagement?.noOutline || '暂无课程大纲'}</p>
              <button
                onClick={handleAddChapter}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t.teacher.courseManagement?.addChapter || '添加新章'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {outline.map((chapter, chapterIndex) => (
                <div key={chapter.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {/* 章标题 */}
                  <div
                    className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-5 h-5 text-blue-600 transition-transform ${expandedChapters.has(chapter.id) ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        <span className="text-lg font-bold text-slate-900">
                          第{chapterIndex + 1}章：{chapter.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {chapter.exam_papers && chapter.exam_papers.length > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            试卷 {chapter.exam_papers.length}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditChapter(chapter);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title={t.teacher.courseManagement?.editChapter || '编辑章'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title={t.teacher.courseManagement?.deleteChapter || '删除章'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddSection(chapter.id);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title={t.teacher.courseManagement?.addSection || '添加小节'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLinkExamPaper(chapter.id);
                          }}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                          title="关联试卷"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 小节列表 */}
                  {expandedChapters.has(chapter.id) && (
                    <div className="p-4 space-y-3">
                      {chapter.sections && chapter.sections.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">暂无小节</p>
                      ) : (
                        chapter.sections?.map((section, sectionIndex) => (
                          <div key={section.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-slate-900">
                                {chapterIndex + 1}.{sectionIndex + 1} {section.title}
                              </h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditSection(section, chapter.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title={t.teacher.courseManagement?.editSection || '编辑小节'}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteSection(section.id)}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  title={t.teacher.courseManagement?.deleteSection || '删除小节'}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleAddResource(section.id)}
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title={t.teacher.courseManagement?.addResource || '添加资源'}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleLinkExamPaper(section.id)}
                                  className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                                  title="关联试卷"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleAddHomework(section.id)}
                                  className="p-1 text-amber-600 hover:bg-amber-100 rounded"
                                  title={t.teacher.courseManagement?.addHomework || '添加作业'}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* 资源列表 */}
                            {section.resources && section.resources.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-slate-500 mb-2">资源：</p>
                                <div className="flex flex-wrap gap-2">
                                  {section.resources.map((resource) => {
                                    const resourceName = resource.resource_type === 'teaching_resource'
                                      ? teachingResources.find(r => r.id === resource.resource_id)?.resource_name
                                      : referenceMaterials.find(r => r.id === resource.resource_id)?.resource_name;
                                    
                                    return (
                                      <span
                                        key={resource.id}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"
                                      >
                                        {resource.resource_type === 'teaching_resource' ? '教学资源' : '参考资料'}：{resourceName || `#${resource.resource_id}`}
                                        <button
                                          onClick={() => handleDeleteResource(section.id, resource.id)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 试卷 */}
                            {section.exam_papers && section.exam_papers.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-slate-500 mb-2">试卷：</p>
                                <div className="flex flex-wrap gap-2">
                                  {section.exam_papers.map((ep) => {
                                    const paper = examPapers.find(p => p.id === ep.id);
                                    return (
                                      <span
                                        key={ep.id}
                                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded flex items-center gap-1"
                                      >
                                        {paper?.paper_name || `试卷 #${ep.id}`}
                                        <button
                                          onClick={() => handleUnlinkExamPaper(section.id, ep.id)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 作业 */}
                            {section.homeworks && section.homeworks.length > 0 && (
                              <div>
                                <p className="text-xs text-slate-500 mb-2">作业：</p>
                                <div className="space-y-2">
                                  {section.homeworks.map((hw) => (
                                    <div key={hw.id} className="bg-white p-3 rounded border border-slate-200 flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{hw.title}</div>
                                        {hw.description && (
                                          <div className="text-xs text-slate-500 mt-1">{hw.description}</div>
                                        )}
                                        {hw.deadline && (
                                          <div className="text-xs text-slate-400 mt-1">
                                            截止：{new Date(hw.deadline).toLocaleString('zh-CN')}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={() => handleEditHomework(hw, section.id)}
                                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                          title={t.teacher.courseManagement?.editHomework || '编辑作业'}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteHomework(hw.id)}
                                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                                          title={t.teacher.courseManagement?.deleteHomework || '删除作业'}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑章弹窗 */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">{editingChapter ? (t.teacher.courseManagement?.editChapter || '编辑章') : (t.teacher.courseManagement?.addChapter || '添加新章')}</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.teacher.courseManagement?.chapterTitle || '章标题'} *</label>
                <input
                  type="text"
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t.teacher.courseManagement?.chapterTitlePlaceholder || '请输入章标题'}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">排序</label>
                <input
                  type="number"
                  value={chapterForm.sort_order}
                  onChange={(e) => setChapterForm({ ...chapterForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowChapterModal(false);
                    setEditingChapter(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel || '取消'}
                </button>
                <button
                  onClick={handleSaveChapter}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t.common.save || '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加/编辑小节弹窗 */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">{editingSection ? (t.teacher.courseManagement?.editSection || '编辑小节') : (t.teacher.courseManagement?.addSection || '添加小节')}</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.teacher.courseManagement?.sectionTitle || '小节标题'} *</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t.teacher.courseManagement?.sectionTitlePlaceholder || '请输入小节标题'}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">排序</label>
                <input
                  type="number"
                  value={sectionForm.sort_order}
                  onChange={(e) => setSectionForm({ ...sectionForm, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowSectionModal(false);
                    setEditingSection(null);
                    setParentChapterId(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel || '取消'}
                </button>
                <button
                  onClick={handleSaveSection}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t.common.save || '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加资源弹窗 */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">添加资源</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.teacher.courseManagement?.resourceType || '资源类型'}</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="teaching_resource"
                      checked={selectedResourceType === 'teaching_resource'}
                      onChange={(e) => {
                        setSelectedResourceType(e.target.value as 'teaching_resource');
                        setSelectedResourceId(null);
                      }}
                      className="mr-2"
                    />
                    <span>{t.teacher.courseManagement?.teachingResource || '教学资源'}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reference_material"
                      checked={selectedResourceType === 'reference_material'}
                      onChange={(e) => {
                        setSelectedResourceType(e.target.value as 'reference_material');
                        setSelectedResourceId(null);
                      }}
                      className="mr-2"
                    />
                    <span>{t.teacher.courseManagement?.referenceMaterial || '参考资料'}</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.teacher.courseManagement?.selectResource || '选择资源'} *</label>
                <div className="max-h-64 overflow-y-auto border border-slate-300 rounded-lg">
                  {(() => {
                    const resources = selectedResourceType === 'teaching_resource' ? teachingResources : referenceMaterials;
                    const activeResources = resources.filter(r => r.is_active !== false);
                    console.log(`显示${selectedResourceType === 'teaching_resource' ? '教学资源' : '参考资料'}:`, {
                      total: resources.length,
                      active: activeResources.length,
                      resources: activeResources
                    });
                    
                    if (activeResources.length === 0) {
                      return (
                        <div className="p-4 text-center text-slate-500">
                          {t.teacher.courseManagement?.noResources || '暂无资源'}
                        </div>
                      );
                    }
                    
                    return activeResources.map((resource) => (
                      <label
                        key={resource.id}
                        className="flex items-center p-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="resource"
                          checked={selectedResourceId === resource.id}
                          onChange={() => setSelectedResourceId(resource.id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium">{resource.resource_name}</div>
                          <div className="text-xs text-slate-500">{resource.resource_type}</div>
                        </div>
                      </label>
                    ));
                  })()}
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowResourceModal(false);
                    setTargetSectionId(null);
                    setSelectedResourceId(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveResource}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 关联试卷弹窗 */}
      {showExamPaperModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">关联试卷</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">选择试卷 *</label>
                <div className="max-h-64 overflow-y-auto border border-slate-300 rounded-lg">
                  {examPapers.filter(p => p.is_active).map((paper) => (
                    <label
                      key={paper.id}
                      className="flex items-center p-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="examPaper"
                        checked={selectedExamPaperId === paper.id}
                        onChange={() => setSelectedExamPaperId(paper.id)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{paper.paper_name}</div>
                        <div className="text-xs text-slate-500">
                          时长：{paper.duration_minutes}分钟 | 总分：{paper.total_score}分
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowExamPaperModal(false);
                    setTargetSectionId(null);
                    setSelectedExamPaperId(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveExamPaperLink}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  关联
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加/编辑作业弹窗 */}
      {showHomeworkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">{editingHomework ? (t.teacher.courseManagement?.editHomework || '编辑作业') : (t.teacher.courseManagement?.addHomework || '添加作业')}</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.teacher.courseManagement?.homework || '作业'} {t.common.required || '必填'} *</label>
                <input
                  type="text"
                  value={homeworkForm.title}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t.teacher.courseManagement?.homeworkTitlePlaceholder || '请输入作业标题'}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">{t.teacher.courseManagement?.homework || '作业'} {t.common.description || '描述'}</label>
                <textarea
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder={t.teacher.courseManagement?.homeworkDescriptionPlaceholder || '请输入作业描述'}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">截止时间</label>
                <input
                  type="datetime-local"
                  value={homeworkForm.deadline}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowHomeworkModal(false);
                    setEditingHomework(null);
                    setTargetSectionId(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel || '取消'}
                </button>
                <button
                  onClick={handleSaveHomework}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  {t.common.save || '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 从知识图谱导入弹窗 */}
        <Modal
          isOpen={showImportFromGraphModal}
          onClose={() => !importing && setShowImportFromGraphModal(false)}
          title="从知识图谱导入"
          size="lg"
        >
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择知识图谱
              </label>
              {knowledgeGraphs.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500">
                  暂无知识图谱，请先创建知识图谱
                </div>
              ) : (
                <select
                  value={selectedGraphId || ''}
                  onChange={(e) => setSelectedGraphId(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={importing}
                >
                  <option value="">请选择知识图谱</option>
                  {knowledgeGraphs.map((graph) => (
                    <option key={graph.id} value={graph.id}>
                      {graph.graph_name} ({graph.node_count} 个节点)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>说明：</strong>将知识图谱的前两层导入为课程大纲：
              </p>
              <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                <li>第一层（根节点）→ 章</li>
                <li>第二层（第一层子节点）→ 小节</li>
              </ul>
            </div>

            {importing && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                <p className="text-sm text-blue-600">正在导入，请稍候...</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowImportFromGraphModal(false)}
                disabled={importing}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={importing || !selectedGraphId}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    导入中...
                  </>
                ) : (
                  '开始导入'
                )}
              </button>
            </div>
          </div>
        </Modal>
    </TeacherLayout>
  );
}
