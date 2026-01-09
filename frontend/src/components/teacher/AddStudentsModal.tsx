"use client";

import { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Toast from '@/components/common/Toast';
import { examStudentService, Major, ClassInfo, Student, ExamStudent } from '@/services/examStudent.service';
import { Exam } from '@/services/exam.service';
import { decodeUnicode } from '@/utils/unicode';

interface AddStudentsModalProps {
  isOpen: boolean;
  exam: Exam | null;
  teacherId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStudentsModal({ isOpen, exam, teacherId, onClose, onSuccess }: AddStudentsModalProps) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examStudents, setExamStudents] = useState<ExamStudent[]>([]);
  
  const [selectedMajorId, setSelectedMajorId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedExamStudentIds, setSelectedExamStudentIds] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  
  useEffect(() => {
    if (isOpen && exam) {
      loadMajors();
      loadExamStudents();
    }
  }, [isOpen, exam]);
  
  useEffect(() => {
    if (selectedMajorId) {
      loadClasses(selectedMajorId);
      setSelectedClassId(null);
      setStudents([]);
    }
  }, [selectedMajorId]);
  
  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);
  
  const loadMajors = async () => {
    try {
      const data = await examStudentService.getTeacherMajors(teacherId);
      setMajors(data);
    } catch (error) {
      console.error('Failed to load majors:', error);
      setToast({ message: '加载专业失败', type: 'error' });
    }
  };
  
  const loadClasses = async (majorId: number) => {
    try {
      const data = await examStudentService.getMajorClasses(majorId);
      setClasses(data);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setToast({ message: '加载班级失败', type: 'error' });
    }
  };
  
  const loadStudents = async (classId: number) => {
    try {
      const data = await examStudentService.getClassStudents(classId);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
      setToast({ message: '加载学生失败', type: 'error' });
    }
  };
  
  const loadExamStudents = async () => {
    if (!exam) return;
    try {
      const data = await examStudentService.getExamStudents(exam.id, teacherId);
      setExamStudents(data);
    } catch (error) {
      console.error('Failed to load exam students:', error);
    }
  };
  
  const handleAddSelectedStudents = async () => {
    if (!exam || selectedStudentIds.length === 0) return;
    
    try {
      setLoading(true);
      await examStudentService.addStudentsBatch(exam.id, teacherId, selectedStudentIds);
      setToast({ message: `成功添加 ${selectedStudentIds.length} 名考生`, type: 'success' });
      setSelectedStudentIds([]);
      await loadExamStudents();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to add students:', error);
      setToast({ message: '添加考生失败: ' + (error.response?.data?.detail || error.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddWholeClass = async () => {
    if (!exam || !selectedClassId) return;
    
    if (!confirm('确定要添加整个班级的所有学生吗？')) return;
    
    try {
      setLoading(true);
      await examStudentService.addClassStudents(exam.id, teacherId, selectedClassId);
      setToast({ message: '成功添加整个班级的学生', type: 'success' });
      await loadExamStudents();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to add class students:', error);
      setToast({ message: '添加班级失败: ' + (error.response?.data?.detail || error.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveSelectedStudents = async () => {
    if (!exam || selectedExamStudentIds.length === 0) return;
    
    if (!confirm(`确定要移除选中的 ${selectedExamStudentIds.length} 名考生吗？`)) return;
    
    try {
      setLoading(true);
      await examStudentService.removeStudentsBatch(exam.id, teacherId, selectedExamStudentIds);
      setToast({ message: `成功移除 ${selectedExamStudentIds.length} 名考生`, type: 'success' });
      setSelectedExamStudentIds([]);
      await loadExamStudents();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to remove students:', error);
      setToast({ message: '移除考生失败: ' + (error.response?.data?.detail || error.message), type: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  const toggleExamStudentSelection = (examStudentId: number) => {
    setSelectedExamStudentIds(prev => 
      prev.includes(examStudentId) 
        ? prev.filter(id => id !== examStudentId)
        : [...prev, examStudentId]
    );
  };
  
  const selectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };
  
  const selectAllExamStudents = () => {
    if (selectedExamStudentIds.length === examStudents.length) {
      setSelectedExamStudentIds([]);
    } else {
      setSelectedExamStudentIds(examStudents.map(es => es.id));
    }
  };
  
  // 过滤出尚未添加到考试的学生
  const availableStudents = students.filter(
    student => !examStudents.some(es => es.student_id === student.id)
  );
  
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={exam ? `添加考生 - ${decodeUnicode(exam.exam_name)}` : '添加考生'}
        size="xl"
      >
        <div className="p-6">
          {/* 三栏布局 */}
          <div className="grid grid-cols-3 gap-6" style={{ height: '600px' }}>
            {/* 左栏：专业列表 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="font-medium text-slate-900">专业列表</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 min-h-0">
                {majors.map(major => (
                  <button
                    key={major.id}
                    onClick={() => setSelectedMajorId(major.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                      selectedMajorId === major.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {major.name}
                  </button>
                ))}
                {majors.length === 0 && (
                  <p className="text-center text-slate-500 py-8">暂无专业</p>
                )}
              </div>
            </div>
            
            {/* 中栏：班级列表 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">班级列表</h3>
                {selectedClassId && (
                  <button
                    onClick={handleAddWholeClass}
                    disabled={loading}
                    className="text-xs px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    添加整班
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 min-h-0">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                      selectedClassId === cls.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>{cls.name}</div>
                    <div className="text-xs text-slate-500 mt-1">学生数: {cls.student_count}</div>
                  </button>
                ))}
                {classes.length === 0 && selectedMajorId && (
                  <p className="text-center text-slate-500 py-8">暂无班级</p>
                )}
                {!selectedMajorId && (
                  <p className="text-center text-slate-500 py-8">请先选择专业</p>
                )}
              </div>
            </div>
            
            {/* 右栏：学生列表和已添加考生 */}
            <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col" style={{ height: '600px' }}>
              {/* 上半部分：待添加学生 */}
              <div className="flex flex-col border-b border-slate-200" style={{ height: '50%' }}>
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">待添加学生</h3>
                    {availableStudents.length > 0 && (
                      <span className="text-xs text-slate-500">({selectedStudentIds.length}/{availableStudents.length})</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {availableStudents.length > 0 && (
                      <button
                        onClick={selectAllStudents}
                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        {selectedStudentIds.length === availableStudents.length ? '取消全选' : '全选'}
                      </button>
                    )}
                    {selectedStudentIds.length > 0 && (
                      <button
                        onClick={handleAddSelectedStudents}
                        disabled={loading}
                        className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        添加 ({selectedStudentIds.length})
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 min-h-0">
                  {availableStudents.map(student => (
                    <div
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`cursor-pointer px-4 py-3 rounded-lg mb-1 transition-colors ${
                        selectedStudentIds.includes(student.id)
                          ? 'bg-green-50 border border-green-300'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{student.student_name}</div>
                          <div className="text-xs text-slate-500">{student.student_no}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  ))}
                  {availableStudents.length === 0 && selectedClassId && (
                    <p className="text-center text-slate-500 py-8">该班级所有学生已添加</p>
                  )}
                  {!selectedClassId && (
                    <p className="text-center text-slate-500 py-8">请先选择班级</p>
                  )}
                </div>
              </div>
              
              {/* 下半部分：已添加考生 */}
              <div className="flex flex-col" style={{ height: '50%' }}>
                <div className="bg-green-50 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-green-900">已添加考生</h3>
                    <span className="text-xs text-green-700">({examStudents.length})</span>
                  </div>
                  {selectedExamStudentIds.length > 0 && (
                    <button
                      onClick={handleRemoveSelectedStudents}
                      disabled={loading}
                      className="text-xs px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      移除 ({selectedExamStudentIds.length})
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 min-h-0">
                  {examStudents.map(examStudent => (
                    <div
                      key={examStudent.id}
                      onClick={() => toggleExamStudentSelection(examStudent.id)}
                      className={`cursor-pointer px-4 py-3 rounded-lg mb-1 transition-colors ${
                        selectedExamStudentIds.includes(examStudent.id)
                          ? 'bg-red-50 border border-red-300'
                          : 'hover:bg-green-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{examStudent.student_name}</div>
                          <div className="text-xs text-slate-500">{examStudent.student_no}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedExamStudentIds.includes(examStudent.id)}
                          onChange={() => toggleExamStudentSelection(examStudent.id)}
                          className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  ))}
                  {examStudents.length === 0 && (
                    <p className="text-center text-slate-500 py-8">暂无考生</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 底部按钮 */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              关闭
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
    </>
  );
}

