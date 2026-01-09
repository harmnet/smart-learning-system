"use client";

import { useState, useEffect, useRef } from 'react';
import { questionService, Question, QuestionOption } from '@/services/question.service';
import { teachingResourceService, TeachingResource } from '@/services/teachingResource.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';
import KnowledgeGraphTreeSelect from '@/components/common/KnowledgeGraphTreeSelect';

export default function QuestionBankPage() {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [knowledgePointFilter, setKnowledgePointFilter] = useState<string | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [aiGenerateModalOpen, setAiGenerateModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);
  
  // AI出题相关状态
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAdditionalPrompt, setAiAdditionalPrompt] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [availableResources, setAvailableResources] = useState<TeachingResource[]>([]);
  
  // Form states
  const [questionType, setQuestionType] = useState<string>('single_choice');
  const [title, setTitle] = useState('');
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [titleImagePreview, setTitleImagePreview] = useState<string>('');
  const [knowledgePoint, setKnowledgePoint] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerImage, setAnswerImage] = useState<File | null>(null);
  const [answerImagePreview, setAnswerImagePreview] = useState<string>('');
  const [explanation, setExplanation] = useState('');
  const [explanationImage, setExplanationImage] = useState<File | null>(null);
  const [explanationImagePreview, setExplanationImagePreview] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(1);
  const [options, setOptions] = useState<QuestionOption[]>([]);
  const [optionImagePreviews, setOptionImagePreviews] = useState<{ [key: number]: string }>({});
  
  const titleImageInputRef = useRef<HTMLInputElement>(null);
  const answerImageInputRef = useRef<HTMLInputElement>(null);
  const explanationImageInputRef = useRef<HTMLInputElement>(null);
  const optionImageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  
  // 从localStorage获取当前登录用户的ID
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

  // 筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchTerm, knowledgePointFilter]);

  useEffect(() => {
    loadQuestions();
  }, [selectedType, searchTerm, knowledgePointFilter, currentPage]);

  // 当知识点改变时，加载该知识点的教学资源
  useEffect(() => {
    if (knowledgePoint && teacherId) {
      loadResourcesForKnowledgePoint(knowledgePoint);
    } else {
      setAvailableResources([]);
      setSelectedResourceId(null);
    }
  }, [knowledgePoint]);

  const loadResourcesForKnowledgePoint = async (kp: string) => {
    try {
      const resources = await teachingResourceService.getAll(teacherId!, { knowledge_point: kp });
      setAvailableResources(resources);
    } catch (error) {
      console.error('Failed to load resources:', error);
      setAvailableResources([]);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      const data = await questionService.getAll(
        teacherId,
        skip,
        pageSize,
        selectedType || undefined,
        knowledgePointFilter || undefined,
        searchTerm || undefined
      );
      setQuestions(data.questions);
      setTotal(data.total);
    } catch (error: any) {
      console.error('Failed to load questions:', error);
      const errorMessage = error.response?.data?.detail || error.message || '加载题目失败';
      alert(`错误: ${errorMessage}\n\n请检查：\n1. 后端服务是否运行在 http://localhost:8000\n2. 网络连接是否正常`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionType('single_choice');
    setTitle('');
    setTitleImage(null);
    setTitleImagePreview('');
    setKnowledgePoint(null);
    setAnswer('');
    setAnswerImage(null);
    setAnswerImagePreview('');
    setExplanation('');
    setExplanationImage(null);
    setExplanationImagePreview('');
    setDifficulty(1);
    // 默认单选题：4个选项
    setOptions([
      { option_label: 'A', option_text: '', is_correct: false, sort_order: 0 },
      { option_label: 'B', option_text: '', is_correct: false, sort_order: 1 },
      { option_label: 'C', option_text: '', is_correct: false, sort_order: 2 },
      { option_label: 'D', option_text: '', is_correct: false, sort_order: 3 },
    ]);
    setOptionImagePreviews({});
  };

  const handleCreateQuestion = async () => {
    // 验证知识点（必填项）
    if (!knowledgePoint || !knowledgePoint.trim()) {
      alert('请选择知识点（必填项）');
      return;
    }

    if (!title.trim()) {
      alert(t.teacher.questionBank.placeholders.title);
      return;
    }

    // 验证选项（单选、多选、判断题）
    if ((questionType === 'single_choice' || questionType === 'multiple_choice' || questionType === 'true_false')) {
      if (options.length < 2) {
        alert('至少需要2个选项');
        return;
      }
      // 验证选项内容
      for (const opt of options) {
        if (!opt.option_text.trim()) {
          alert('请填写所有选项内容');
          return;
        }
      }
    }

    // 验证正确答案
    if (questionType === 'single_choice' && !options.some(opt => opt.is_correct)) {
      alert('请选择正确答案');
      return;
    }
    if (questionType === 'multiple_choice' && !options.some(opt => opt.is_correct)) {
      alert('请至少选择一个正确答案');
      return;
    }
    if (questionType === 'true_false' && !options.some(opt => opt.is_correct)) {
      alert('请选择正确答案');
      return;
    }
    if ((questionType === 'fill_blank' || questionType === 'qa' || questionType === 'short_answer') && !answer.trim()) {
      alert(t.teacher.questionBank.placeholders.answer);
      return;
    }

    if (!teacherId) {
      alert('无法获取教师ID，请重新登录');
      return;
    }

    try {
      // 对于判断题，需要将正确答案转换为answer字段
      let finalAnswer = answer;
      if (questionType === 'true_false' && options.length > 0) {
        const correctOption = options.find(opt => opt.is_correct);
        if (correctOption) {
          finalAnswer = correctOption.option_text; // 使用选项文本作为答案
        }
      }

      await questionService.create(
        teacherId,
        {
          question_type: questionType,
          title,
          knowledge_point: knowledgePoint || undefined,
          answer: finalAnswer || undefined,
          explanation: explanation || undefined,
          difficulty,
          // 只对单选和多选题传递options，判断题不需要options（后端不处理判断题的options）
          options: (questionType === 'single_choice' || questionType === 'multiple_choice') ? options : undefined,
        },
        titleImage || undefined,
        answerImage || undefined,
        explanationImage || undefined
      );
      alert(t.teacher.questionBank.createSuccess);
      setCreateModalOpen(false);
      resetForm();
      loadQuestions();
    } catch (error: any) {
      console.error('Failed to create question:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorDetail = error.response?.data?.detail;
      let errorMessage = t.teacher.questionBank.createError;
      if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMessage += ': ' + errorDetail;
        } else if (Array.isArray(errorDetail)) {
          // 打印详细的错误信息
          console.error('Detailed errors:', errorDetail);
          const errorMessages = errorDetail.map((e: any) => {
            const loc = Array.isArray(e.loc) ? e.loc.join('.') : '';
            const msg = e.msg || e.message || JSON.stringify(e);
            return `${loc}: ${msg}`;
          });
          errorMessage += ':\n' + errorMessages.join('\n');
        } else {
          errorMessage += ': ' + JSON.stringify(errorDetail);
        }
      } else {
        errorMessage += ': ' + (error.message || '未知错误');
      }
      alert(errorMessage);
    }
  };

  const getImageUrl = (imagePath: string | undefined | null): string => {
    if (!imagePath) return '';
    // 如果已经是完整URL，直接返回
    if (imagePath.startsWith('http')) return imagePath;
    // 如果是相对路径，提取文件名
    const filename = imagePath.split('/').pop() || imagePath;
    return questionService.getImageUrl(filename);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionType(question.question_type);
    setTitle(question.title);
    setTitleImagePreview(getImageUrl(question.title_image));
    setKnowledgePoint(question.knowledge_point || null);
    setAnswer(question.answer || '');
    setAnswerImagePreview(getImageUrl(question.answer_image));
    setExplanation(question.explanation || '');
    setExplanationImagePreview(getImageUrl(question.explanation_image));
    setDifficulty(question.difficulty);
    
    // 根据题型设置选项
    if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
      // 如果有选项，使用原有选项；否则设置为4个空选项
      if (question.options && question.options.length > 0) {
        setOptions(question.options);
      } else {
        setOptions([
          { option_label: 'A', option_text: '', is_correct: false, sort_order: 0 },
          { option_label: 'B', option_text: '', is_correct: false, sort_order: 1 },
          { option_label: 'C', option_text: '', is_correct: false, sort_order: 2 },
          { option_label: 'D', option_text: '', is_correct: false, sort_order: 3 },
        ]);
      }
    } else if (question.question_type === 'true_false') {
      // 判断题：2个选项（正确、错误）
      if (question.options && question.options.length >= 2) {
        setOptions(question.options);
      } else {
        setOptions([
          { option_label: 'A', option_text: t.teacher.questionBank.trueFalse.true, is_correct: false, sort_order: 0 },
          { option_label: 'B', option_text: t.teacher.questionBank.trueFalse.false, is_correct: false, sort_order: 1 },
        ]);
      }
    } else {
      setOptions([]);
    }
    
    // 加载选项图片预览
    const previews: { [key: number]: string } = {};
    if (question.options) {
      question.options.forEach((opt, index) => {
        if (opt.option_image) {
          previews[index] = getImageUrl(opt.option_image);
        }
      });
    }
    setOptionImagePreviews(previews);
    
    setEditModalOpen(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    // 验证知识点（必填项）
    if (!knowledgePoint || !knowledgePoint.trim()) {
      alert('请选择知识点（必填项）');
      return;
    }

    if (!title.trim()) {
      alert(t.teacher.questionBank.placeholders.title);
      return;
    }

    // 验证选项（单选、多选、判断题）
    if ((questionType === 'single_choice' || questionType === 'multiple_choice' || questionType === 'true_false')) {
      if (options.length < 2) {
        alert('至少需要2个选项');
        return;
      }
      // 验证选项内容
      for (const opt of options) {
        if (!opt.option_text.trim()) {
          alert('请填写所有选项内容');
          return;
        }
      }
    }

    // 验证正确答案
    if (questionType === 'single_choice' && !options.some(opt => opt.is_correct)) {
      alert('请选择正确答案');
      return;
    }
    if (questionType === 'multiple_choice' && !options.some(opt => opt.is_correct)) {
      alert('请至少选择一个正确答案');
      return;
    }
    if (questionType === 'true_false' && !options.some(opt => opt.is_correct)) {
      alert('请选择正确答案');
      return;
    }
    if ((questionType === 'fill_blank' || questionType === 'qa' || questionType === 'short_answer') && !answer.trim()) {
      alert(t.teacher.questionBank.placeholders.answer);
      return;
    }

    try {
      await questionService.update(
        editingQuestion.id,
        teacherId,
        {
          question_type: questionType,
          title,
          knowledge_point: knowledgePoint || undefined,
          answer: answer || undefined,
          explanation: explanation || undefined,
          difficulty,
          options: (questionType === 'single_choice' || questionType === 'multiple_choice' || questionType === 'true_false') ? options : undefined,
        },
        titleImage || undefined,
        answerImage || undefined,
        explanationImage || undefined
      );
      alert(t.teacher.questionBank.updateSuccess);
      setEditModalOpen(false);
      setEditingQuestion(null);
      resetForm();
      loadQuestions();
    } catch (error: any) {
      console.error('Failed to update question:', error);
      alert(t.teacher.questionBank.updateError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!confirm(t.teacher.questionBank.deleteConfirm)) return;
    
    try {
      await questionService.delete(question.id, teacherId);
      alert(t.teacher.questionBank.deleteSuccess);
      loadQuestions();
    } catch (error: any) {
      console.error('Failed to delete question:', error);
      alert(t.teacher.questionBank.deleteError + ': ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleImageUpload = async (file: File, type: 'title' | 'answer' | 'explanation') => {
    try {
      const result = await questionService.uploadImage(teacherId, file, type);
      if (type === 'title') {
        setTitleImagePreview(result.image_url);
      } else if (type === 'answer') {
        setAnswerImagePreview(result.image_url);
      } else if (type === 'explanation') {
        setExplanationImagePreview(result.image_url);
      }
      return result.image_path;
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('图片上传失败');
      return null;
    }
  };

  const handleTitleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTitleImage(file);
      await handleImageUpload(file, 'title');
    }
  };

  const handleAnswerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnswerImage(file);
      await handleImageUpload(file, 'answer');
    }
  };

  const handleExplanationImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExplanationImage(file);
      await handleImageUpload(file, 'explanation');
    }
  };

  const handleOptionImageChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await questionService.uploadImage(teacherId, file, 'option');
        const newPreviews = { ...optionImagePreviews };
        newPreviews[index] = result.image_url;
        setOptionImagePreviews(newPreviews);
        
        // 更新选项的图片路径
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], option_image: result.image_path };
        setOptions(newOptions);
      } catch (error) {
        console.error('Failed to upload option image:', error);
        alert('选项图片上传失败');
      }
    }
  };

  const addOption = () => {
    const label = String.fromCharCode(65 + options.length); // A, B, C, D...
    setOptions([...options, {
      option_label: label,
      option_text: '',
      is_correct: false,
      sort_order: options.length,
    }]);
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index).map((opt, i) => ({
      ...opt,
      option_label: String.fromCharCode(65 + i),
      sort_order: i,
    })));
  };

  const handleExportQuestions = async () => {
    try {
      const blob = await questionService.exportQuestions(teacherId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `题目导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('导出成功！');
    } catch (error: any) {
      console.error('Failed to export questions:', error);
      alert('导出失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await questionService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '题目导入模板.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download template:', error);
      alert('模板下载失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleImportQuestions = async () => {
    if (!importFile) {
      alert('请先选择文件');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const result = await questionService.importQuestions(teacherId, importFile);
      setImportResult(result);
      if (result.success) {
        alert(result.message);
        setImportModalOpen(false);
        setImportFile(null);
        loadQuestions();
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      console.error('Failed to import questions:', error);
      setImportResult({
        success: false,
        message: '导入失败: ' + (error.response?.data?.detail || error.message),
        errors: []
      });
    } finally {
      setImporting(false);
    }
  };

  const handleAIGenerateQuestion = async () => {
    if (!knowledgePoint || !knowledgePoint.trim()) {
      alert('请先选择知识点');
      return;
    }

    if (!questionType) {
      alert('请先选择题型');
      return;
    }

    setAiGenerating(true);

    try {
      const result = await questionService.aiGenerateQuestion(
        knowledgePoint,
        questionType,
        aiAdditionalPrompt,
        selectedResourceId || undefined
      );

      if (result.success && result.question) {
        // 填充表单数据
        setTitle(result.question.title || '');
        setAnswer(result.question.answer || '');
        setExplanation(result.question.explanation || '');
        setDifficulty(result.question.difficulty || 1);
        
        // 处理选项
        if (result.question.options && result.question.options.length > 0) {
          setOptions(result.question.options.map((opt: any, index: number) => ({
            option_label: opt.option_label || String.fromCharCode(65 + index),
            option_text: opt.option_text || '',
            is_correct: opt.is_correct || false,
            sort_order: index,
          })));
        }
        
        // 关闭AI出题弹窗，打开创建题目弹窗
        setAiGenerateModalOpen(false);
        setCreateModalOpen(true);
        setAiAdditionalPrompt(''); // 清空补充提示词
        alert('AI出题成功，请检查并完善题目内容');
      } else {
        alert('AI出题失败: ' + (result.error || '未知错误'));
      }
    } catch (error: any) {
      console.error('Failed to generate question with AI:', error);
      alert('AI出题失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAiGenerating(false);
    }
  };

  const renderQuestionForm = () => (
    <div className={aiGenerating ? 'pointer-events-none opacity-60' : ''}>
      {/* 知识点（必填项） */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700">
            {t.teacher.questionBank.knowledgePoint} <span className="text-red-500">*</span>
          </label>
          {knowledgePoint && questionType && (
            <button
              onClick={async () => {
                if (!knowledgePoint || !questionType) {
                  alert('请先选择知识点和题型');
                  return;
                }
                setAiGenerating(true);
                try {
                  const result = await questionService.aiGenerateQuestion(
                    knowledgePoint,
                    questionType,
                    '',
                    selectedResourceId || undefined
                  );
                  if (result.success && result.question) {
                    // 填充表单数据
                    setTitle(result.question.title || '');
                    setAnswer(result.question.answer || '');
                    setExplanation(result.question.explanation || '');
                    setDifficulty(result.question.difficulty || 1);
                    
                    // 处理选项
                    if (result.question.options && result.question.options.length > 0) {
                      setOptions(result.question.options.map((opt: any, index: number) => ({
                        option_label: opt.option_label || String.fromCharCode(65 + index),
                        option_text: opt.option_text || '',
                        is_correct: opt.is_correct || false,
                        sort_order: index,
                      })));
                    }
                    alert('AI出题成功，请检查并完善题目内容');
                  } else {
                    alert('AI出题失败: ' + (result.error || '未知错误'));
                  }
                } catch (error: any) {
                  console.error('Failed to generate question with AI:', error);
                  alert('AI出题失败: ' + (error.response?.data?.detail || error.message));
                } finally {
                  setAiGenerating(false);
                }
              }}
              disabled={aiGenerating}
              className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {aiGenerating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                  AI出题
                </>
              )}
            </button>
          )}
        </div>
        <div className={aiGenerating ? 'pointer-events-none opacity-50' : ''}>
          <KnowledgeGraphTreeSelect
            teacherId={teacherId}
            value={knowledgePoint || undefined}
            onChange={(nodeName) => setKnowledgePoint(nodeName)}
            placeholder={t.teacher.questionBank.placeholders.knowledgePoint}
          />
        </div>
      </div>
      
      {/* 教学资源选择（用于快速AI出题） */}
      {knowledgePoint && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            教学资源（可选，用于AI出题）
          </label>
          <select
            value={selectedResourceId || ''}
            onChange={(e) => setSelectedResourceId(e.target.value ? Number(e.target.value) : null)}
            disabled={aiGenerating || availableResources.length === 0}
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
          >
            <option value="">不选择资源</option>
            {availableResources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.resource_name} ({resource.resource_type})
              </option>
            ))}
          </select>
          {availableResources.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">该知识点下暂无教学资源</p>
          )}
          {availableResources.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">选择教学资源后，AI将结合资源内容进行出题</p>
          )}
        </div>
      )}

      {/* 题型 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t.teacher.questionBank.questionType} <span className="text-red-500">*</span>
        </label>
        <select
          value={questionType}
          onChange={(e) => {
            const newType = e.target.value;
            setQuestionType(newType);
            
            // 根据题型自动设置选项
            if (newType === 'single_choice' || newType === 'multiple_choice') {
              // 单选题和多选题：4个选项
              setOptions([
                { option_label: 'A', option_text: '', is_correct: false, sort_order: 0 },
                { option_label: 'B', option_text: '', is_correct: false, sort_order: 1 },
                { option_label: 'C', option_text: '', is_correct: false, sort_order: 2 },
                { option_label: 'D', option_text: '', is_correct: false, sort_order: 3 },
              ]);
            } else if (newType === 'true_false') {
              // 判断题：2个选项（正确、错误）
              setOptions([
                { option_label: 'A', option_text: t.teacher.questionBank.trueFalse.true, is_correct: false, sort_order: 0 },
                { option_label: 'B', option_text: t.teacher.questionBank.trueFalse.false, is_correct: false, sort_order: 1 },
              ]);
            } else {
              // 其他题型：清空选项
              setOptions([]);
            }
          }}
          disabled={aiGenerating}
          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          {Object.entries(t.teacher.questionBank.types).map(([key, label]) => {
            if (key === 'all') return null;
            return (
              <option key={key} value={key}>{label}</option>
            );
          })}
        </select>
      </div>

      {/* 题干 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t.teacher.questionBank.questionTitle} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.teacher.questionBank.placeholders.title}
          rows={3}
          disabled={aiGenerating}
          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
        />
        <div className="mt-2">
          <input
            type="file"
            ref={titleImageInputRef}
            onChange={handleTitleImageChange}
            accept="image/*"
            className="hidden"
            disabled={aiGenerating}
          />
          <button
            onClick={() => titleImageInputRef.current?.click()}
            disabled={aiGenerating}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.teacher.questionBank.titleImage}
          </button>
          {titleImagePreview && (
            <img src={titleImagePreview} alt="Title" className="mt-2 max-w-xs rounded" />
          )}
        </div>
      </div>

      {/* 选项（单选、多选、判断题） */}
      {(questionType === 'single_choice' || questionType === 'multiple_choice' || questionType === 'true_false') && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-700">
              {t.teacher.questionBank.options}
            </label>
            {(questionType === 'single_choice' || questionType === 'multiple_choice') && (
              <button
                onClick={addOption}
                className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                {t.teacher.questionBank.addOption}
              </button>
            )}
          </div>
          {options.map((option, index) => (
            <div key={index} className="mb-3 p-3 border border-slate-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{option.option_label}.</span>
                <input
                  type="text"
                  value={option.option_text}
                  onChange={(e) => updateOption(index, 'option_text', e.target.value)}
                  placeholder={t.teacher.questionBank.placeholders.optionText}
                  className="flex-1 px-3 py-1 border border-slate-300 rounded-md text-sm"
                  disabled={questionType === 'true_false'} // 判断题选项不可编辑
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type={questionType === 'single_choice' || questionType === 'true_false' ? 'radio' : 'checkbox'}
                    checked={option.is_correct}
                    onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                    name={questionType === 'single_choice' || questionType === 'true_false' ? 'correct-option' : undefined}
                  />
                  {t.teacher.questionBank.isCorrect}
                </label>
                {(questionType === 'single_choice' || questionType === 'multiple_choice') && options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    {t.common.delete}
                  </button>
                )}
              </div>
              <div className="mt-2">
                <input
                  type="file"
                  ref={(el) => { optionImageInputRefs.current[index] = el; }}
                  onChange={(e) => handleOptionImageChange(index, e)}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => optionImageInputRefs.current[index]?.click()}
                  className="px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  {t.teacher.questionBank.optionImage}
                </button>
                {(optionImagePreviews[index] || option.option_image) && (
                  <img 
                    src={optionImagePreviews[index] || getImageUrl(option.option_image)} 
                    alt={`Option ${option.option_label}`} 
                    className="mt-2 max-w-xs rounded" 
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 难度 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t.teacher.questionBank.difficulty}
        </label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>{t.teacher.questionBank.difficultyEasy}</option>
          <option value={2}>{t.teacher.questionBank.difficultyMedium}</option>
          <option value={3}>{t.teacher.questionBank.difficultyHard}</option>
        </select>
      </div>

      {/* 正确答案（填空题、问答题、简答题） */}
      {questionType !== 'single_choice' && questionType !== 'multiple_choice' && questionType !== 'true_false' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.teacher.questionBank.answer} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t.teacher.questionBank.placeholders.answer}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="mt-2">
            <input
              type="file"
              ref={answerImageInputRef}
              onChange={handleAnswerImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => answerImageInputRef.current?.click()}
              className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              {t.teacher.questionBank.answerImage}
            </button>
            {answerImagePreview && (
              <img src={answerImagePreview} alt="Answer" className="mt-2 max-w-xs rounded" />
            )}
          </div>
        </div>
      )}

      {/* 解析 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t.teacher.questionBank.explanation}
        </label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder={t.teacher.questionBank.placeholders.explanation}
          rows={3}
          className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="mt-2">
          <input
            type="file"
            ref={explanationImageInputRef}
            onChange={handleExplanationImageChange}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => explanationImageInputRef.current?.click()}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            {t.teacher.questionBank.explanationImage}
          </button>
          {explanationImagePreview && (
            <img src={explanationImagePreview} alt="Explanation" className="mt-2 max-w-xs rounded" />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.teacher.questionBank.title}</h1>
              <p className="text-sm text-slate-600 mt-0.5">{t.teacher.questionBank.subtitle}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportQuestions}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                导出全部
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(true);
                  setImportResult(null);
                  setImportFile(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                批量导入
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setCreateModalOpen(true);
                }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                {t.teacher.questionBank.addQuestion}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-8 py-4 bg-white/60 backdrop-blur-sm border-b border-slate-200/60">
          <div className="flex gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all bg-white"
            >
              <option value="">{t.teacher.questionBank.types.all}</option>
              {Object.entries(t.teacher.questionBank.types).map(([key, label]) => {
                if (key === 'all') return null;
                return (
                  <option key={key} value={key}>{label}</option>
                );
              })}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索题干或知识点"
              className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
            <div className="w-64">
              <KnowledgeGraphTreeSelect
                teacherId={teacherId}
                value={knowledgePointFilter || undefined}
                onChange={(nodeName) => setKnowledgePointFilter(nodeName)}
                placeholder="筛选知识点"
              />
            </div>
            {knowledgePointFilter && (
              <button
                onClick={() => setKnowledgePointFilter(null)}
                className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all duration-200 border border-red-200"
                title="清除筛选"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-slate-300 border-t-slate-900 mb-4"></div>
                <p className="text-sm text-slate-600">{t.common.loading}</p>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-slate-500">{t.teacher.questionBank.noQuestions}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-medium">
                            {t.teacher.questionBank.types[question.question_type as keyof typeof t.teacher.questionBank.types]}
                          </span>
                          <span className="text-xs text-slate-500">
                            难度: {question.difficulty === 1 ? t.teacher.questionBank.difficultyEasy : question.difficulty === 2 ? t.teacher.questionBank.difficultyMedium : t.teacher.questionBank.difficultyHard}
                          </span>
                          {question.updated_at && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              更新: {new Date(question.updated_at).toLocaleString('zh-CN', { 
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">{question.title}</h3>
                        {question.title_image && (
                          <img src={getImageUrl(question.title_image)} alt="Title" className="max-w-md rounded mb-2" />
                        )}
                        {question.knowledge_point && (
                          <p className="text-sm text-slate-600 mb-2">知识点: {question.knowledge_point}</p>
                        )}
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {question.options.map((opt) => (
                              <div key={opt.id} className="text-sm">
                                <span className={opt.is_correct ? 'text-green-600 font-bold' : 'text-slate-600'}>
                                  {opt.option_label}. {opt.option_text}
                                  {opt.is_correct && ' ✓'}
                                </span>
                                {opt.option_image && (
                                  <img src={getImageUrl(opt.option_image)} alt={`Option ${opt.option_label}`} className="mt-1 max-w-xs rounded" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.answer && (
                          <div className="mt-2">
                            <p className="text-sm text-green-600 font-medium">答案: {question.answer}</p>
                            {question.answer_image && (
                              <img src={getImageUrl(question.answer_image)} alt="Answer" className="mt-1 max-w-md rounded" />
                            )}
                          </div>
                        )}
                        {question.explanation && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm font-medium text-slate-700 mb-1">解析:</p>
                            <p className="text-sm text-slate-600">{question.explanation}</p>
                            {question.explanation_image && (
                              <img src={getImageUrl(question.explanation_image)} alt="Explanation" className="mt-2 max-w-md rounded" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          {t.common.edit}
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question)}
                          className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 分页组件 */}
              {total > pageSize && (
                <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-lg border border-slate-200">
                  <div className="text-sm text-slate-600">
                    显示 {Math.min((currentPage - 1) * pageSize + 1, total)} - {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (currentPage > 1) {
                          setCurrentPage(currentPage - 1);
                        }
                      }}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    
                    {/* 页码按钮 */}
                    {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                      .filter((page) => {
                        // 只显示当前页附近的页码
                        if (Math.ceil(total / pageSize) <= 7) return true;
                        if (page === 1 || page === Math.ceil(total / pageSize)) return true;
                        if (Math.abs(page - currentPage) <= 1) return true;
                        return false;
                      })
                      .map((page, index, array) => {
                        // 添加省略号
                        if (index > 0 && page - array[index - 1] > 1) {
                          return [
                            <span key={`ellipsis-${page}`} className="px-2 text-slate-400">...</span>,
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {page}
                            </button>
                          ];
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    
                    <button
                      onClick={() => {
                        if (currentPage < Math.ceil(total / pageSize)) {
                          setCurrentPage(currentPage + 1);
                        }
                      }}
                      disabled={currentPage >= Math.ceil(total / pageSize)}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => !aiGenerating && setCreateModalOpen(false)} title={t.teacher.questionBank.createTitle} size="xl">
        <div className="p-6">
          {renderQuestionForm()}
          {/* AI生成状态提示 */}
          {aiGenerating && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
              <p className="text-sm text-slate-600">AI正在生成题目，请稍候...</p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setCreateModalOpen(false)}
              disabled={aiGenerating}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreateQuestion}
              disabled={aiGenerating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </Modal>

      {/* AI出题 Modal */}
      <Modal isOpen={aiGenerateModalOpen} onClose={() => !aiGenerating && setAiGenerateModalOpen(false)} title="AI出题" size="lg">
        <div className="p-6">
          {/* 显示知识点和题型信息 */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-slate-700">知识点：</span>
                <span className="text-sm text-slate-900 ml-2">{knowledgePoint || '未选择'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700">题型：</span>
                <span className="text-sm text-slate-900 ml-2">
                  {questionType ? t.teacher.questionBank.types[questionType as keyof typeof t.teacher.questionBank.types] : '未选择'}
                </span>
              </div>
            </div>
          </div>

          {/* 知识点选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              知识点 <span className="text-red-500">*</span>
            </label>
            <div className={aiGenerating ? 'pointer-events-none opacity-50' : ''}>
              <KnowledgeGraphTreeSelect
                teacherId={teacherId}
                value={knowledgePoint || undefined}
                onChange={(nodeName) => setKnowledgePoint(nodeName)}
                placeholder="请选择知识点"
              />
            </div>
          </div>

          {/* 题型选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              题型 <span className="text-red-500">*</span>
            </label>
            <select
              value={questionType}
              onChange={(e) => {
                setQuestionType(e.target.value);
                // 根据题型自动设置选项
                if (e.target.value === 'single_choice' || e.target.value === 'multiple_choice') {
                  setOptions([
                    { option_label: 'A', option_text: '', is_correct: false, sort_order: 0 },
                    { option_label: 'B', option_text: '', is_correct: false, sort_order: 1 },
                    { option_label: 'C', option_text: '', is_correct: false, sort_order: 2 },
                    { option_label: 'D', option_text: '', is_correct: false, sort_order: 3 },
                  ]);
                } else if (e.target.value === 'true_false') {
                  setOptions([
                    { option_label: 'A', option_text: t.teacher.questionBank.trueFalse.true, is_correct: false, sort_order: 0 },
                    { option_label: 'B', option_text: t.teacher.questionBank.trueFalse.false, is_correct: false, sort_order: 1 },
                  ]);
                } else {
                  setOptions([]);
                }
              }}
              disabled={aiGenerating}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {Object.entries(t.teacher.questionBank.types).map(([key, label]) => {
                if (key === 'all') return null;
                return (
                  <option key={key} value={key}>{label}</option>
                );
              })}
            </select>
          </div>

          {/* 教学资源选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              教学资源（可选）
            </label>
            <select
              value={selectedResourceId || ''}
              onChange={(e) => setSelectedResourceId(e.target.value ? Number(e.target.value) : null)}
              disabled={aiGenerating || !knowledgePoint || availableResources.length === 0}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              <option value="">不选择资源</option>
              {availableResources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.resource_name} ({resource.resource_type})
                </option>
              ))}
            </select>
            {!knowledgePoint && (
              <p className="mt-1 text-xs text-amber-600">请先选择知识点，才能选择教学资源</p>
            )}
            {knowledgePoint && availableResources.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">该知识点下暂无教学资源</p>
            )}
            {knowledgePoint && availableResources.length > 0 && (
              <p className="mt-1 text-xs text-slate-500">选择教学资源后，AI将结合资源内容进行出题</p>
            )}
          </div>

          {/* 补充提示词 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              补充提示词（可选）
            </label>
            <textarea
              value={aiAdditionalPrompt}
              onChange={(e) => setAiAdditionalPrompt(e.target.value)}
              placeholder="例如：题目难度适中，考察基础概念，选项要具有迷惑性..."
              rows={4}
              disabled={aiGenerating}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <p className="mt-1 text-xs text-slate-500">可以补充对题目的具体要求，帮助AI生成更符合需求的题目</p>
          </div>

          {/* 加载状态 */}
          {aiGenerating && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
              <p className="text-sm text-slate-600">AI正在生成题目，请稍候...</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                if (!aiGenerating) {
                  setAiGenerateModalOpen(false);
                  setAiAdditionalPrompt('');
                }
              }}
              disabled={aiGenerating}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleAIGenerateQuestion}
              disabled={aiGenerating || !knowledgePoint || !questionType}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {aiGenerating ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                  出题
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={t.teacher.questionBank.editTitle} size="xl">
        <div className="p-6">
          {renderQuestionForm()}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingQuestion(null);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdateQuestion}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {t.common.update}
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="批量导入题目" size="lg">
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-4">
              请下载模板文件，按照模板格式填写题目信息后上传。
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              下载导入模板
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择文件（Excel或CSV）
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImportFile(file || null);
                setImportResult(null);
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm"
            />
            {importFile && (
              <p className="mt-2 text-sm text-slate-600">
                已选择: {importFile.name}
              </p>
            )}
          </div>

          {importResult && (
            <div className={`mb-4 p-4 rounded-lg ${
              importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.message}
              </p>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-red-700 mb-1">错误详情:</p>
                  <ul className="text-xs text-red-600 list-disc list-inside">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>...还有{importResult.errors.length - 10}条错误</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setImportModalOpen(false);
                setImportFile(null);
                setImportResult(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleImportQuestions}
              disabled={!importFile || importing}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {importing ? '导入中...' : '开始导入'}
            </button>
          </div>
        </div>
      </Modal>
    </TeacherLayout>
  );
}

