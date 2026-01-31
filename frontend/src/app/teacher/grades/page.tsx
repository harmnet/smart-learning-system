"use client";

import { useEffect, useMemo, useState } from 'react';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';
import { useToast } from '@/hooks/useToast';
import teacherGradesService, {
  CourseClassInfo,
  CourseGradeSummary,
  CourseStudentGrade,
  GradeComponent,
  PublishHistoryItem,
  PublishRequest,
} from '@/services/teacherGrades.service';

type ExamType = 'midterm' | 'final';

const formatScore = (score?: number | null) => {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return '-';
  }
  return Number(score).toFixed(2);
};

const calculateTotalScore = (components: GradeComponent[], scores: Record<string, number | null | undefined>) => {
  return components.reduce((total, component) => {
    if (!component.enabled) return total;
    const score = scores[component.key];
    if (score === null || score === undefined) return total;
    return total + (Number(score) * Number(component.weight) / 100);
  }, 0);
};

export default function TeacherGradesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState<CourseGradeSummary[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [courseFilterId, setCourseFilterId] = useState<number | 'all'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseGradeSummary | null>(null);
  const [composition, setComposition] = useState<GradeComponent[]>([]);
  const [editingComposition, setEditingComposition] = useState<GradeComponent[]>([]);
  const [compositionSaving, setCompositionSaving] = useState(false);
  const [students, setStudents] = useState<CourseStudentGrade[]>([]);
  const [classFilter, setClassFilter] = useState<number | 'all'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [publishScope, setPublishScope] = useState<'class' | 'student'>('class');
  const [publishClassId, setPublishClassId] = useState<number | ''>('');
  const [remark, setRemark] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importExamType, setImportExamType] = useState<ExamType>('midterm');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<PublishHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiLoadingIds, setAiLoadingIds] = useState<Set<number>>(new Set());

  const classOptions = useMemo(() => {
    if (!selectedCourse) return [];
    return selectedCourse.class_list || [];
  }, [selectedCourse]);

  const enabledWeightSum = useMemo(() => {
    return editingComposition.reduce((sum, item) => sum + (item.enabled ? Number(item.weight || 0) : 0), 0);
  }, [editingComposition]);

  const selectedStudents = useMemo(() => {
    return students.filter(student => selectedStudentIds.has(student.student_id));
  }, [students, selectedStudentIds]);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await teacherGradesService.listCourses();
      setCourses(data);
      if (data.length === 0) {
        setSelectedCourseId(null);
        setSelectedCourse(null);
        setStudents([]);
        setComposition([]);
        setEditingComposition([]);
        return;
      }
      const exists = data.find(item => item.id === selectedCourseId);
      const nextCourseId = exists ? selectedCourseId : data[0].id;
      setSelectedCourseId(nextCourseId || data[0].id);
    } catch (error: any) {
      toast.error('课程加载失败');
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadStudents = async (courseId: number, classId?: number) => {
    setLoadingStudents(true);
    try {
      const data = await teacherGradesService.getCourseStudents(courseId, classId ? { class_id: classId } : undefined);
      setStudents(data.students);
      setComposition(data.composition || []);
      setEditingComposition(data.composition || []);
      setSelectedStudentIds(new Set());
    } catch (error: any) {
      toast.error('学生成绩加载失败');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) {
      setSelectedCourse(null);
      return;
    }
    const course = courses.find(item => item.id === selectedCourseId) || null;
    setSelectedCourse(course);
    setClassFilter('all');
    setPublishClassId('');
    setRemark('');
  }, [selectedCourseId, courses]);

  useEffect(() => {
    if (!selectedCourseId) return;
    const classId = classFilter === 'all' ? undefined : classFilter;
    loadStudents(selectedCourseId, classId);
  }, [selectedCourseId, classFilter]);

  useEffect(() => {
    if (selectedCourseId) {
      setCourseFilterId(selectedCourseId);
    } else {
      setCourseFilterId('all');
    }
  }, [selectedCourseId]);

  const handleAddComponent = () => {
    const baseKey = 'custom';
    let index = editingComposition.length + 1;
    let nextKey = `${baseKey}_${index}`;
    const existingKeys = new Set(editingComposition.map(item => item.key));
    while (existingKeys.has(nextKey)) {
      index += 1;
      nextKey = `${baseKey}_${index}`;
    }
    setEditingComposition(prev => [
      ...prev,
      { key: nextKey, name: '自定义维度', weight: 0, enabled: true }
    ]);
  };

  const handleRemoveComponent = (key: string) => {
    setEditingComposition(prev => prev.filter(item => item.key !== key));
  };

  const handleSaveComposition = async () => {
    if (!selectedCourseId) return;
    const enabledSum = editingComposition.reduce((sum, item) => sum + (item.enabled ? Number(item.weight || 0) : 0), 0);
    if (enabledSum > 0 && Math.abs(enabledSum - 100) > 0.01) {
      toast.warning('启用项权重合计需为100');
      return;
    }
    setCompositionSaving(true);
    try {
      const payload = { components: editingComposition.map(item => ({ ...item, weight: Number(item.weight || 0) })) };
      const data = await teacherGradesService.updateComposition(selectedCourseId, payload);
      setComposition(data.components || []);
      setEditingComposition(data.components || []);
      toast.success('成绩构成已保存');
      const classId = classFilter === 'all' ? undefined : classFilter;
      await loadStudents(selectedCourseId, classId);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '保存失败');
    } finally {
      setCompositionSaving(false);
    }
  };

  const handleToggleSelectStudent = (studentId: number) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === students.length) {
      setSelectedStudentIds(new Set());
      return;
    }
    setSelectedStudentIds(new Set(students.map(item => item.student_id)));
  };

  const handleLearningAiScore = async (studentId: number) => {
    if (!selectedCourseId) return;
    setAiLoadingIds(prev => new Set(prev).add(studentId));
    try {
      const result = await teacherGradesService.calculateLearningAIScore(selectedCourseId, studentId);
      setStudents(prev => prev.map(item => {
        if (item.student_id !== studentId) return item;
        const newScores = { ...item.scores, learning: result.score };
        const total = calculateTotalScore(composition, newScores);
        return { ...item, scores: newScores, total_score: Number(total.toFixed(2)) };
      }));
      toast.success('AI评分完成');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'AI评分失败');
    } finally {
      setAiLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  const handleDownloadTemplate = async (examType: ExamType) => {
    if (!selectedCourseId) return;
    try {
      const blob = await teacherGradesService.downloadTemplate(selectedCourseId, examType);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${examType}_scores_template.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('模板已下载');
    } catch (error: any) {
      toast.error('模板下载失败');
    }
  };

  const handleImportScores = async () => {
    if (!selectedCourseId || !importFile) {
      toast.warning('请先选择文件');
      return;
    }
    try {
      const result = await teacherGradesService.importExamScores(selectedCourseId, importExamType, importFile);
      toast.success(`已更新${result.updated}条成绩`);
      setImportModalOpen(false);
      setImportFile(null);
      const classId = classFilter === 'all' ? undefined : classFilter;
      await loadStudents(selectedCourseId, classId);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '导入失败');
    }
  };

  const handlePublish = async (action: 'publish' | 'unpublish') => {
    if (!selectedCourseId) return;
    const payload: PublishRequest = {
      scope: publishScope,
      remark: remark || undefined,
    };
    if (publishScope === 'class') {
      if (!publishClassId) {
        toast.warning('请选择班级');
        return;
      }
      payload.class_id = Number(publishClassId);
    } else {
      if (selectedStudentIds.size === 0) {
        toast.warning('请选择学生');
        return;
      }
      payload.student_ids = Array.from(selectedStudentIds);
    }
    try {
      if (action === 'publish') {
        const result = await teacherGradesService.publishGrades(selectedCourseId, payload);
        toast.success(`已发布${result.updated}条成绩`);
      } else {
        const result = await teacherGradesService.unpublishGrades(selectedCourseId, payload);
        toast.success(`已取消${result.updated}条成绩`);
      }
      const classId = classFilter === 'all' ? undefined : classFilter;
      await loadStudents(selectedCourseId, classId);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || '操作失败');
    }
  };

  const openHistory = async () => {
    if (!selectedCourseId) return;
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    try {
      const data = await teacherGradesService.getPublishHistory(selectedCourseId);
      setHistoryItems(data);
    } catch (error: any) {
      toast.error('历史记录加载失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderComponentRow = (item: GradeComponent, index: number) => {
    return (
      <div key={item.key} className="flex items-center gap-2 border border-slate-100 rounded-lg px-2 py-1">
        <input
          className="w-28 px-2 py-1 border border-slate-200 rounded-md text-[11px]"
          value={item.name}
          placeholder="维度名称"
          onChange={(e) => {
            const value = e.target.value;
            setEditingComposition(prev => prev.map((comp, idx) => idx === index ? { ...comp, name: value } : comp));
          }}
        />
        <input
          className="w-14 px-2 py-1 border border-slate-200 rounded-md text-[11px] text-center"
          type="number"
          min={0}
          max={100}
          value={item.weight}
          placeholder="权重"
          onChange={(e) => {
            const value = Number(e.target.value);
            setEditingComposition(prev => prev.map((comp, idx) => idx === index ? { ...comp, weight: value } : comp));
          }}
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-[11px] text-slate-600">
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={(e) => {
                const checked = e.target.checked;
                setEditingComposition(prev => prev.map((comp, idx) => idx === index ? { ...comp, enabled: checked } : comp));
              }}
            />
            启用
          </label>
        </div>
        <button
          onClick={() => handleRemoveComponent(item.key)}
          className="px-2 py-1 text-[11px] text-red-600 border border-red-200 rounded-md hover:bg-red-50"
        >
          删除
        </button>
      </div>
    );
  };

  return (
    <TeacherLayout>
      <toast.ToastContainer />
      <div className="h-full flex flex-col bg-slate-50">
        <div className="px-5 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">成绩管理</h1>
              <p className="text-[11px] text-slate-500 mt-1">按课程管理学生成绩，支持成绩构成与发布记录</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadCourses()}
                className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                disabled={loadingCourses}
              >
                刷新课程
              </button>
              <button
                onClick={() => selectedCourseId && setImportModalOpen(true)}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={!selectedCourseId}
              >
                导入成绩
              </button>
              <button
                onClick={openHistory}
                className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                disabled={!selectedCourseId}
              >
                发布历史
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <select
              className="w-60 px-3 py-1 text-xs border border-slate-200 rounded-lg bg-white"
              value={courseFilterId}
              onChange={(e) => {
                const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setCourseFilterId(value);
                if (value !== 'all') {
                  setSelectedCourseId(Number(value));
                } else {
                  setSelectedCourseId(null);
                }
              }}
            >
              <option value="all">全部课程</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 p-3">
          <div className="space-y-3">
            {!selectedCourse && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
                请选择课程查看成绩详情
              </div>
            )}
            {selectedCourse && (
              <>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">成绩构成</h2>
                      <p className="text-[11px] text-slate-500 mt-1">启用项权重合计 {enabledWeightSum.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddComponent}
                        className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                      >
                        添加维度
                      </button>
                      <button
                        onClick={handleSaveComposition}
                        className="px-4 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        disabled={compositionSaving}
                      >
                        保存构成
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {editingComposition.map(renderComponentRow)}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">学生成绩</h2>
                      <p className="text-[11px] text-slate-500 mt-1">支持班级筛选与AI评分</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="px-3 py-1 text-xs border border-slate-200 rounded-lg"
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      >
                        <option value="all">全部班级</option>
                        {classOptions.map(item => (
                          <option key={item.id} value={item.id}>{item.name || `班级${item.id}`}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => selectedCourseId && loadStudents(selectedCourseId, classFilter === 'all' ? undefined : classFilter)}
                        className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                      >
                        刷新列表
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-2 py-1 text-left">
                            <input type="checkbox" checked={selectedStudentIds.size === students.length && students.length > 0} onChange={handleSelectAll} />
                          </th>
                          <th className="px-2 py-1 text-left">学号</th>
                          <th className="px-2 py-1 text-left">姓名</th>
                          <th className="px-2 py-1 text-left">班级</th>
                          <th className="px-2 py-1 text-center">平时测验</th>
                          <th className="px-2 py-1 text-center">学习数据</th>
                          <th className="px-2 py-1 text-center">期中</th>
                          <th className="px-2 py-1 text-center">期末</th>
                          <th className="px-2 py-1 text-center">总评</th>
                          <th className="px-2 py-1 text-center">发布状态</th>
                          <th className="px-2 py-1 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingStudents && (
                          <tr>
                            <td colSpan={11} className="px-4 py-5 text-center text-slate-500">加载中...</td>
                          </tr>
                        )}
                        {!loadingStudents && students.length === 0 && (
                          <tr>
                            <td colSpan={11} className="px-4 py-5 text-center text-slate-500">暂无学生数据</td>
                          </tr>
                        )}
                        {!loadingStudents && students.map(student => (
                          <tr key={student.student_id} className="border-t border-slate-100">
                            <td className="px-2 py-1">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.has(student.student_id)}
                                onChange={() => handleToggleSelectStudent(student.student_id)}
                              />
                            </td>
                            <td className="px-2 py-1 text-slate-700">{student.student_no || '-'}</td>
                            <td className="px-2 py-1 font-medium text-slate-900">{student.student_name}</td>
                            <td className="px-2 py-1 text-slate-600">{student.class_name || '-'}</td>
                            <td className="px-2 py-1 text-center">{formatScore(student.scores.quiz)}</td>
                            <td className="px-2 py-1 text-center">{formatScore(student.scores.learning)}</td>
                            <td className="px-2 py-1 text-center">{formatScore(student.scores.midterm)}</td>
                            <td className="px-2 py-1 text-center">{formatScore(student.scores.final)}</td>
                            <td className="px-2 py-1 text-center font-semibold text-slate-900">{formatScore(student.total_score)}</td>
                            <td className="px-2 py-1 text-center">
                              <span className={`px-2 py-0.5 text-[11px] rounded-full ${student.is_published ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                {student.is_published ? '已发布' : '未发布'}
                              </span>
                            </td>
                            <td className="px-2 py-1 text-center">
                              <button
                                onClick={() => handleLearningAiScore(student.student_id)}
                                disabled={aiLoadingIds.has(student.student_id)}
                                className="px-2.5 py-1 text-[11px] text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                              >
                                {aiLoadingIds.has(student.student_id) ? '评分中' : 'AI评分'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">发布维度</span>
                        <select
                          className="px-3 py-1 text-xs border border-slate-200 rounded-lg"
                          value={publishScope}
                          onChange={(e) => setPublishScope(e.target.value as 'class' | 'student')}
                        >
                          <option value="class">按班级</option>
                          <option value="student">按学生</option>
                        </select>
                      </div>
                      {publishScope === 'class' && (
                        <select
                          className="px-3 py-1 text-xs border border-slate-200 rounded-lg"
                          value={publishClassId}
                          onChange={(e) => setPublishClassId(e.target.value ? Number(e.target.value) : '')}
                        >
                          <option value="">选择班级</option>
                          {classOptions.map((item: CourseClassInfo) => (
                            <option key={item.id} value={item.id}>{item.name || `班级${item.id}`}</option>
                          ))}
                        </select>
                      )}
                      {publishScope === 'student' && (
                        <span className="text-[11px] text-slate-500">已选择 {selectedStudents.length} 名学生</span>
                      )}
                      <input
                        className="flex-1 min-w-[160px] px-3 py-1 text-xs border border-slate-200 rounded-lg"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="备注（可选）"
                      />
                      <button
                        onClick={() => handlePublish('publish')}
                        className="px-4 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        发布成绩
                      </button>
                      <button
                        onClick={() => handlePublish('unpublish')}
                        className="px-4 py-1 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        取消发布
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="导入考试成绩"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-600">支持导入期中/期末成绩，上传前请使用模板</div>
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
              value={importExamType}
              onChange={(e) => setImportExamType(e.target.value as ExamType)}
            >
              <option value="midterm">期中成绩</option>
              <option value="final">期末成绩</option>
            </select>
            <button
              onClick={() => handleDownloadTemplate(importExamType)}
              className="px-3 py-2 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              下载模板
            </button>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              取消
            </button>
            <button
              onClick={handleImportScores}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              导入
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="发布历史"
        size="lg"
      >
        <div className="space-y-3">
          {historyLoading && <div className="text-sm text-slate-500">加载中...</div>}
          {!historyLoading && historyItems.length === 0 && (
            <div className="text-sm text-slate-500">暂无发布记录</div>
          )}
          {!historyLoading && historyItems.map(item => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  {item.action === 'publish' ? '发布' : '取消发布'}
                </div>
                <div className="text-xs text-slate-500">{item.created_at}</div>
              </div>
              <div className="text-xs text-slate-600 mt-2 flex flex-wrap gap-4">
                <span>范围: {item.scope === 'class' ? '班级' : '学生'}</span>
                <span>班级: {item.class_name || '-'}</span>
                <span>学生: {item.student_name || '-'}</span>
                <span>操作人: {item.operator_name || '-'}</span>
                <span>备注: {item.remark || '-'}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </TeacherLayout>
  );
}
