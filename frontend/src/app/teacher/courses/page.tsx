"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { courseService, Course } from '@/services/course.service';
import { adminService, Class, Teacher } from '@/services/admin.service';
import { courseCoverService } from '@/services/courseCover.service';
import { teacherService } from '@/services/teacher.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import ImagePreviewModal from '@/components/admin/ImagePreviewModal';
import { useToast } from '@/hooks/useToast';

export default function CoursesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const toast = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 编辑课程相关状态
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    code: '',
    credits: 2,
    course_type: 'required' as 'required' | 'elective',
    course_category: 'general' as 'general' | 'professional_basic' | 'professional_core' | 'expansion' | 'elective_course',
    enrollment_type: 'required' as 'required' | 'elective' | 'retake',
    hours: 0,
    introduction: '',
    objectives: '',
    is_public: false,
    cover_id: null as number | null,
    main_teacher_id: null as number | null,
  });
  
  // 编辑弹窗的UI状态
  const [editCoverPreview, setEditCoverPreview] = useState<string>('');
  const [editShowCoverGallery, setEditShowCoverGallery] = useState(false);
  const [editAvailableCovers, setEditAvailableCovers] = useState<any[]>([]);
  const [editLoadingCovers, setEditLoadingCovers] = useState(false);
  const [editUploadingCover, setEditUploadingCover] = useState(false);
  
  // 预览弹窗状态
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewImageName, setPreviewImageName] = useState<string>('');
  const [editTeachers, setEditTeachers] = useState<Teacher[]>([]);
  const [editLoadingTeachers, setEditLoadingTeachers] = useState(false);
  const [editTeacherSearchTerm, setEditTeacherSearchTerm] = useState('');
  const [editShowTeacherDropdown, setEditShowTeacherDropdown] = useState(false);
  const [editSelectedTeacher, setEditSelectedTeacher] = useState<Teacher | null>(null);
  const [editMajorName, setEditMajorName] = useState<string>('');
  
  // 关联班级相关状态
  const [linkingCourse, setLinkingCourse] = useState<Course | null>(null);
  const [linkClassesModalOpen, setLinkClassesModalOpen] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
  const [linkedClassIds, setLinkedClassIds] = useState<number[]>([]);
  
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

  useEffect(() => {
    loadCourses();
  }, [searchTerm]);
  
  // 监听路由变化，当从新建页面返回时重新加载
  useEffect(() => {
    const handleFocus = () => {
      loadCourses();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const currentTeacherId = getTeacherId();
      const data = await courseService.getAll(
        0,
        100,
        searchTerm || undefined,
        currentTeacherId
      );
      setCourses(data);
    } catch (error: any) {
      console.error('Failed to load courses:', error);
      const errorMessage = error.response?.data?.detail || error.message || '加载课程失败';
      toast.error(`错误: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (course: Course) => {
    try {
      const courseDetail = await courseService.getById(course.id);
      setEditingCourse(course);
      
      // 加载封面预览
      if (courseDetail.cover_id) {
        setEditCoverPreview(courseService.getCoverUrl(courseDetail.cover_image, courseDetail.cover_id));
      } else {
        setEditCoverPreview('');
      }
      
      // 加载教师信息
      const teacherId = getTeacherId();
      if (teacherId) {
        const teachersData = await adminService.getTeachers({ status: 'active' });
        setEditTeachers(teachersData);
        
        // 设置选中的教师
        if (courseDetail.main_teacher_id) {
          const mainTeacher = teachersData.find(t => t.id === courseDetail.main_teacher_id);
          if (mainTeacher) {
            setEditSelectedTeacher(mainTeacher);
            setEditTeacherSearchTerm(mainTeacher.full_name || mainTeacher.name || mainTeacher.username);
          }
        }
      }
      
      // 加载教师专业信息
      try {
        const teacherInfo = await teacherService.getCurrentTeacher();
        setEditMajorName(teacherInfo.major_name || '');
      } catch (e) {
        console.error('Failed to load teacher info:', e);
      }
      
      setEditForm({
        name: courseDetail.name || courseDetail.title || '',
        code: courseDetail.code || '',
        credits: courseDetail.credits || 2,
        course_type: (courseDetail.course_type as 'required' | 'elective') || 'required',
        course_category: (courseDetail.course_category as any) || 'general',
        enrollment_type: (courseDetail.enrollment_type as any) || 'required',
        hours: courseDetail.hours || 0,
        introduction: courseDetail.introduction || '',
        objectives: courseDetail.objectives || '',
        is_public: courseDetail.is_public || false,
        cover_id: courseDetail.cover_id || null,
        main_teacher_id: courseDetail.main_teacher_id || null,
      });
      
      // 加载可用封面
      loadEditAvailableCovers();
      
      setEditModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load course detail:', error);
      toast.error('加载课程详情失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const loadEditAvailableCovers = async () => {
    try {
      setEditLoadingCovers(true);
      const covers = await courseCoverService.getAll(0, 100, true);
      // 使用返回的image_url（可能是OSS URL或API URL）
      setEditAvailableCovers(covers);
    } catch (error: any) {
      console.error('Failed to load covers:', error);
    } finally {
      setEditLoadingCovers(false);
    }
  };

  const handleEditCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.warning('只能上传图片文件');
      return;
    }
    
    // 检查文件大小（2MB，与后端一致）
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('文件大小不能超过2MB');
      return;
    }
    
    try {
      setEditUploadingCover(true);
      const result = await courseCoverService.uploadImage(file);
      setEditForm({ ...editForm, cover_id: result.id });
      // 使用返回的image_url（可能是OSS URL或API URL）
      setEditCoverPreview(result.image_url || courseCoverService.getImageUrl(result.id));
      await loadEditAvailableCovers();
    } catch (error: any) {
      console.error('Failed to upload cover:', error);
      toast.error('封面上传失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setEditUploadingCover(false);
    }
  };

  const handleEditCoverSelect = (cover: any) => {
    setEditForm({ ...editForm, cover_id: cover.id });
    // 使用返回的image_url（可能是OSS URL或API URL）
    setEditCoverPreview(cover.image_url || courseCoverService.getImageUrl(cover.id));
    setEditShowCoverGallery(false);
  };

  const handleEditTeacherSelect = (teacher: Teacher) => {
    setEditSelectedTeacher(teacher);
    setEditForm({ ...editForm, main_teacher_id: teacher.id });
    setEditTeacherSearchTerm(teacher.full_name || teacher.name || teacher.username);
    setEditShowTeacherDropdown(false);
  };

  const editFilteredTeachers = editTeachers.filter(teacher => 
    (teacher.full_name || teacher.name || '').toLowerCase().includes(editTeacherSearchTerm.toLowerCase()) ||
    (teacher.username || '').toLowerCase().includes(editTeacherSearchTerm.toLowerCase())
  );

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    
    // 验证必填字段
    if (!editForm.name.trim()) {
      toast.warning(t.teacher.courseManagement?.courseNameRequired || '请输入课程名称');
      return;
    }
    if (!editForm.hours || editForm.hours <= 0) {
      toast.warning(t.teacher.courseManagement?.courseHoursRequired || '课程学时必须大于0');
      return;
    }
    if (!editForm.cover_id) {
      toast.warning(t.teacher.courseManagement?.coverImageRequired || '请选择课程封面');
      return;
    }
    if (!editForm.main_teacher_id) {
      toast.warning(t.teacher.courseManagement?.mainTeacherRequired || '请选择课程讲师');
      return;
    }
    if (!editForm.introduction.trim()) {
      toast.warning(t.teacher.courseManagement?.introductionRequired || '请输入课程简介');
      return;
    }
    if (!editForm.objectives.trim()) {
      toast.warning(t.teacher.courseManagement?.objectivesRequired || '请输入授课目标');
      return;
    }
    
    try {
      await courseService.update(editingCourse.id, {
        name: editForm.name,
        code: editForm.code,
        credits: editForm.credits,
        course_type: editForm.course_type,
        course_category: editForm.course_category,
        enrollment_type: editForm.enrollment_type,
        hours: editForm.hours,
        introduction: editForm.introduction,
        objectives: editForm.objectives,
        is_public: editForm.is_public,
        cover_id: editForm.cover_id,
        main_teacher_id: editForm.main_teacher_id,
      });
      toast.success(t.teacher.courseManagement?.updateSuccess || '课程更新成功');
      setEditModalOpen(false);
      setEditingCourse(null);
      setEditCoverPreview('');
      setEditShowCoverGallery(false);
      setEditTeacherSearchTerm('');
      setEditShowTeacherDropdown(false);
      setEditSelectedTeacher(null);
      loadCourses();
    } catch (error: any) {
      console.error('Failed to update course:', error);
      toast.error('更新失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleLinkClassesClick = async (course: Course) => {
    try {
      setLinkingCourse(course);
      
      // 重新获取课程详情，确保获取最新的专业信息
      const courseDetail = await courseService.getById(course.id);
      
      // 获取课程关联的班级
      const linkedClasses = await courseService.getCourseClasses(course.id);
      setLinkedClassIds(linkedClasses.map((c: any) => c.id));
      setSelectedClassIds(linkedClasses.map((c: any) => c.id));
      
      // 获取与课程专业相同的所有班级
      if (courseDetail.major_id) {
        const classesData = await adminService.getClasses({ major_id: courseDetail.major_id, limit: 1000 });
        setAvailableClasses(classesData.items || []);
        // 更新课程对象，确保使用最新的专业信息
        setLinkingCourse({ ...course, major_id: courseDetail.major_id });
      } else {
        toast.warning(t.teacher.courseManagement?.courseNotLinkedMajor || '课程未关联专业，无法关联班级');
        return;
      }
      
      setLinkClassesModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load classes:', error);
      toast.error('加载班级列表失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleLinkClassesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingCourse) return;
    
    try {
      await courseService.linkClasses(linkingCourse.id, selectedClassIds);
      toast.success(t.teacher.courseManagement?.linkClassesSuccess || '关联班级成功');
      setLinkClassesModalOpen(false);
      setLinkingCourse(null);
      loadCourses();
    } catch (error: any) {
      console.error('Failed to link classes:', error);
      toast.error('关联失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleOutlineClick = (course: Course) => {
    router.push(`/teacher/courses/${course.id}/outline`);
  };

  const handleViewCourse = (course: Course) => {
    router.push(`/teacher/courses/${course.id}/view`);
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`确定要删除课程"${course.name || course.title}"吗？`)) {
      return;
    }

    try {
      await courseService.delete(course.id);
      toast.success('课程已删除');
      loadCourses();
    } catch (error: any) {
      console.error('Failed to delete course:', error);
      toast.error('删除课程失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRestoreCourse = async (course: Course) => {
    try {
      await courseService.restore(course.id);
      toast.success('课程已恢复');
      loadCourses();
    } catch (error: any) {
      console.error('Failed to restore course:', error);
      toast.error('恢复课程失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <TeacherLayout>
      <toast.ToastContainer />
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">
                {t.teacher.courseManagement?.title || '课程管理'}
              </h1>
              <p className="text-sm text-slate-500">
                {t.teacher.courseManagement?.subtitle || '管理和查看课程'}
              </p>
            </div>
            <button
              onClick={() => router.push('/teacher/courses/new')}
              className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {t.teacher.courseManagement?.create || '新建课程'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-8 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.teacher.courseManagement?.searchPlaceholder || '搜索课程名称...'}
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-slate-500">{t.teacher.courseManagement?.noCourses || '暂无课程'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all overflow-hidden relative"
                >
                  {/* 悬停操作按钮 */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCourse(course);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-indigo-50 text-indigo-600 transition-colors"
                      title="查看课程"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(course);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-blue-50 text-blue-600 transition-colors"
                      title="编辑课程"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLinkClassesClick(course);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-green-50 text-green-600 transition-colors"
                      title={t.teacher.courseManagement?.linkClasses || '关联班级'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOutlineClick(course);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-purple-50 text-purple-600 transition-colors"
                      title="编辑大纲"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </button>
                    {course.is_deleted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreCourse(course);
                        }}
                        className="p-2 bg-white rounded-lg shadow-md hover:bg-green-50 text-green-600 transition-colors"
                        title="恢复课程"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course);
                        }}
                        className="p-2 bg-white rounded-lg shadow-md hover:bg-red-50 text-red-600 transition-colors"
                        title="删除课程"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 课程封面 */}
                  <div className="relative w-full h-48 bg-slate-200 overflow-hidden">
                    {course.cover_image || course.cover_id ? (
                      <img
                        src={courseService.getCoverUrl(course.cover_image, course.cover_id)}
                        alt={course.name || course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect width="400" height="225" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3E课程封面%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 课程信息 */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                      {course.name || course.title}
                    </h3>
                    
                    {course.code && (
                      <p className="text-sm text-slate-500 mb-3">
                        {t.teacher.courseManagement?.courseCode || '课程代码'}：{course.code}
                      </p>
                    )}

                    {/* 授课教师 */}
                    {course.teachers && course.teachers.length > 0 ? (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {t.teacher.courseManagement?.teachers || '授课教师'}：
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto">
                            {course.teachers.map((teacher, index) => (
                              <span
                                key={teacher.id || index}
                                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                                  index === 0 
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {index === 0 && (
                                  <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className="truncate">{teacher.name || teacher.username}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <p className="text-xs text-slate-400 italic">
                          {t.teacher.courseManagement?.noTeacher || '暂无授课教师'}
                        </p>
                      </div>
                    )}

                    {/* 学分 */}
                    {course.credits && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{course.credits} {t.teacher.courseManagement?.credits || '学分'}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 编辑课程弹窗 */}
      {editModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">编辑课程</h2>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-6">
                {/* 课程名称 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.courseName || '课程名称'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* 课程代码 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.courseCode || '课程代码'}
                  </label>
                  <input
                    type="text"
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 课程类型 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    课程类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.course_category}
                    onChange={(e) => setEditForm({ ...editForm, course_category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">通识课</option>
                    <option value="professional_basic">专业基础课</option>
                    <option value="professional_core">专业核心课</option>
                    <option value="expansion">拓展课</option>
                    <option value="elective_course">选修课</option>
                  </select>
                </div>

                {/* 选课类型 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选课类型 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="required"
                        checked={editForm.enrollment_type === 'required'}
                        onChange={(e) => setEditForm({ ...editForm, enrollment_type: e.target.value as any })}
                        className="mr-2"
                      />
                      <span>必修课</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="elective"
                        checked={editForm.enrollment_type === 'elective'}
                        onChange={(e) => setEditForm({ ...editForm, enrollment_type: e.target.value as any })}
                        className="mr-2"
                      />
                      <span>选修课</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="retake"
                        checked={editForm.enrollment_type === 'retake'}
                        onChange={(e) => setEditForm({ ...editForm, enrollment_type: e.target.value as any })}
                        className="mr-2"
                      />
                      <span>重修课</span>
                    </label>
                  </div>
                </div>

                {/* 课程学分 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    课程学分 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editForm.credits}
                    onChange={(e) => setEditForm({ ...editForm, credits: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="10"
                    required
                  />
                </div>

                {/* 课程学时 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.courseHours || '课程学时'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editForm.hours}
                    onChange={(e) => setEditForm({ ...editForm, hours: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    required
                  />
                </div>

                {/* 是否公开课 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.isPublic || '是否公开课'}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!editForm.is_public}
                        onChange={() => setEditForm({ ...editForm, is_public: false })}
                        className="mr-2"
                      />
                      <span>{t.teacher.courseManagement?.no || '否'}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={editForm.is_public}
                        onChange={() => setEditForm({ ...editForm, is_public: true })}
                        className="mr-2"
                      />
                      <span>{t.teacher.courseManagement?.yes || '是'}</span>
                    </label>
                  </div>
                </div>

                {/* 所属专业（只读） */}
                {editMajorName && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t.teacher.courseManagement?.major || '所属专业'}
                    </label>
                    <div className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700">
                      {editMajorName}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.teacher.courseManagement?.majorReadOnly || '此字段从您的专业信息自动获取，不可编辑'}
                    </p>
                  </div>
                )}

                {/* 课程封面 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.coverImage || '课程封面'} <span className="text-red-500">*</span>
                  </label>
                  
                  {/* 封面上传 */}
                  <div className="mb-4">
                    <label className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                      </svg>
                      {editUploadingCover ? t.teacher.courseManagement?.uploading || '上传中...' : t.teacher.courseManagement?.uploadCover || '上传封面'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditCoverUpload}
                        disabled={editUploadingCover}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditShowCoverGallery(!editShowCoverGallery)}
                      className="ml-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      {t.teacher.courseManagement?.selectFromGallery || '从图库选择'}
                    </button>
                  </div>

                  {/* 封面预览（16:9比例） */}
                  {editCoverPreview && (
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 mb-2">{t.teacher.courseManagement?.selectedCover || '已选择封面'}：</p>
                      <div className="relative w-full" style={{ aspectRatio: '16/9', maxWidth: '600px' }}>
                        <img
                          src={editCoverPreview}
                          alt="封面预览"
                          className="w-full h-full object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setPreviewImageUrl(editCoverPreview);
                            const selectedCover = editAvailableCovers.find(c => c.id === editForm.cover_id);
                            setPreviewImageName(selectedCover?.filename || '封面预览');
                            setPreviewModalOpen(true);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditForm({ ...editForm, cover_id: null });
                            setEditCoverPreview('');
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImageUrl(editCoverPreview);
                            const selectedCover = editAvailableCovers.find(c => c.id === editForm.cover_id);
                            setPreviewImageName(selectedCover?.filename || '封面预览');
                            setPreviewModalOpen(true);
                          }}
                          className="absolute top-2 left-2 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                          title="预览"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 图库选择 */}
                  {editShowCoverGallery && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      {editLoadingCovers ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                          {editAvailableCovers.length === 0 ? (
                            <div className="col-span-4 text-center py-8 text-slate-500">
                              {t.teacher.courseManagement?.noCoversAvailable || '暂无可用封面'}
                            </div>
                          ) : (
                            editAvailableCovers.map((cover) => (
                              <div
                                key={cover.id}
                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${
                                  editForm.cover_id === cover.id
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-slate-200 hover:border-blue-300'
                                }`}
                                style={{ aspectRatio: '16/9' }}
                              >
                                <img
                                  src={cover.image_url}
                                  alt={cover.filename}
                                  className="w-full h-full object-cover"
                                  onClick={() => handleEditCoverSelect(cover)}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '';
                                  }}
                                />
                                {/* 预览按钮 */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImageUrl(cover.image_url);
                                    setPreviewImageName(cover.filename);
                                    setPreviewModalOpen(true);
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                  title="预览"
                                >
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                  </svg>
                                </button>
                                {editForm.cover_id === cover.id && (
                                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 课程讲师 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.mainTeacher || '课程讲师'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editTeacherSearchTerm}
                      onChange={(e) => {
                        setEditTeacherSearchTerm(e.target.value);
                        setEditShowTeacherDropdown(true);
                      }}
                      onFocus={() => setEditShowTeacherDropdown(true)}
                      placeholder={t.teacher.courseManagement?.selectTeacher || '请选择课程讲师'}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {editShowTeacherDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {editFilteredTeachers.length > 0 ? (
                          editFilteredTeachers.map((teacher) => (
                            <div
                              key={teacher.id}
                              onClick={() => handleEditTeacherSelect(teacher)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                            >
                              <div className="font-medium text-slate-900">{teacher.full_name || teacher.name}</div>
                              <div className="text-sm text-slate-500">{teacher.username}</div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-slate-500 text-sm">
                            {t.teacher.courseManagement?.noTeachersFound || '未找到教师'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {editSelectedTeacher && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-700">
                        {t.teacher.courseManagement?.selectedTeacher || '已选择'}：{editSelectedTeacher.full_name || editSelectedTeacher.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* 课程简介 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.introduction || '课程简介'} <span className="text-red-500">*</span>
                    <span className="text-slate-500 font-normal ml-2">
                      ({editForm.introduction.length}/500)
                    </span>
                  </label>
                  <textarea
                    value={editForm.introduction}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setEditForm({ ...editForm, introduction: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                    maxLength={500}
                    placeholder={t.teacher.courseManagement?.introductionPlaceholder || '请输入课程简介（最多500字）'}
                  />
                </div>

                {/* 授课目标 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.objectives || '授课目标'} <span className="text-red-500">*</span>
                    <span className="text-slate-500 font-normal ml-2">
                      ({editForm.objectives.length}/500)
                    </span>
                  </label>
                  <textarea
                    value={editForm.objectives}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setEditForm({ ...editForm, objectives: e.target.value });
                      }
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={6}
                    maxLength={500}
                    placeholder={t.teacher.courseManagement?.objectivesPlaceholder || '请输入授课目标（最多500字）'}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingCourse(null);
                    setEditCoverPreview('');
                    setEditShowCoverGallery(false);
                    setEditTeacherSearchTerm('');
                    setEditShowTeacherDropdown(false);
                    setEditSelectedTeacher(null);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel || '取消'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t.common.save || '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 关联班级弹窗 */}
      {linkClassesModalOpen && linkingCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">{t.teacher.courseManagement?.linkClassesTitle || '关联班级'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.teacher.courseManagement?.courseName || '课程'}：{linkingCourse.name || linkingCourse.title}</p>
            </div>
            <form onSubmit={handleLinkClassesSubmit} className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availableClasses.map((classItem) => (
                  <label key={classItem.id} className="flex items-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(classItem.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedClassIds([...selectedClassIds, classItem.id]);
                        } else {
                          setSelectedClassIds(selectedClassIds.filter(id => id !== classItem.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-slate-900">{classItem.name}</div>
                      <div className="text-sm text-slate-500">{classItem.code} · {classItem.grade}</div>
                    </div>
                  </label>
                ))}
                {availableClasses.length === 0 && (
                  <p className="text-center text-slate-500 py-8">{t.teacher.courseManagement?.noClassesAvailable || '暂无可用班级'}</p>
                )}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setLinkClassesModalOpen(false);
                    setLinkingCourse(null);
                    setSelectedClassIds([]);
                  }}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  {t.common.cancel || '取消'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {t.common.save || '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
