"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { courseService } from '@/services/course.service';
import { courseCoverService } from '@/services/courseCover.service';
import { adminService } from '@/services/admin.service';
import { teacherService } from '@/services/teacher.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import { useToast } from '@/hooks/useToast';

interface Teacher {
  id: number;
  name: string;
  full_name: string;
  username: string;
  phone?: string;
}

export default function NewCoursePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const toast = useToast();
  
  // Form states
  const [courseName, setCourseName] = useState('');
  const [courseCredits, setCourseCredits] = useState<number>(2);
  const [courseType, setCourseType] = useState<'required' | 'elective'>('required');
  const [courseCategory, setCourseCategory] = useState<'general' | 'professional_basic' | 'professional_core' | 'expansion' | 'elective_course'>('general');
  const [enrollmentType, setEnrollmentType] = useState<'required' | 'elective' | 'retake'>('required');
  const [courseHours, setCourseHours] = useState<number>(0);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [majorName, setMajorName] = useState<string>('');
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [mainTeacherId, setMainTeacherId] = useState<number | null>(null);
  const [introduction, setIntroduction] = useState('');
  const [objectives, setObjectives] = useState('');
  
  // UI states
  const [availableCovers, setAvailableCovers] = useState<any[]>([]);
  const [loadingCovers, setLoadingCovers] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showCoverGallery, setShowCoverGallery] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 预览弹窗状态
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewImageName, setPreviewImageName] = useState<string>('');
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadAvailableCovers();
    loadTeachers();
    loadTeacherInfo();
  }, []);

  const loadTeacherInfo = async () => {
    try {
      const teacherInfo = await teacherService.getCurrentTeacher();
      setMajorName(teacherInfo.major_name || '');
      // 如果没有设置主讲教师，默认使用当前登录教师
      if (!mainTeacherId) {
        setMainTeacherId(teacherInfo.id);
      }
    } catch (error: any) {
      console.error('Failed to load teacher info:', error);
    }
  };

  const loadAvailableCovers = async () => {
    try {
      setLoadingCovers(true);
      // 传递 includeUsed=true 以获取所有封面（包括已使用的）
      const covers = await courseCoverService.getAll(0, 100, true);
      console.log('Loaded covers:', covers);
      // 使用返回的image_url（可能是OSS URL或API URL）
      setAvailableCovers(covers);
    } catch (error: any) {
      console.error('Failed to load covers:', error);
      toast.error('加载封面失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingCovers(false);
    }
  };

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const data = await adminService.getTeachers({ status: 'active' });
      setTeachers(data);
    } catch (error: any) {
      console.error('Failed to load teachers:', error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.warning('只能上传图片文件');
      return;
    }
    
    // 检查文件大小（50MB）
    if (file.size > 50 * 1024 * 1024) {
      toast.warning('文件大小不能超过50MB');
      return;
    }
    
    try {
      setUploadingCover(true);
      const result = await courseCoverService.uploadImage(file);
      setCoverImageId(result.id);
      // 使用返回的image_url（可能是OSS URL或API URL）
      setCoverPreview(result.image_url || courseCoverService.getImageUrl(result.id));
      await loadAvailableCovers(); // 刷新图库列表
      setShowCoverGallery(false);
      setErrors({ ...errors, coverImage: '' });
    } catch (error: any) {
      console.error('Failed to upload cover:', error);
      toast.error('封面上传失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverSelect = (coverId: number) => {
    setCoverImageId(coverId);
    // 从availableCovers中查找对应的封面，使用其image_url（可能是OSS URL）
    const selectedCover = availableCovers.find(c => c.id === coverId);
    const imageUrl = selectedCover?.image_url || courseCoverService.getImageUrl(coverId);
    console.log('Selected cover ID:', coverId, 'URL:', imageUrl);
    setCoverPreview(imageUrl);
    setShowCoverGallery(false);
    setErrors({ ...errors, coverImage: '' });
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setMainTeacherId(teacher.id);
    setTeacherSearchTerm(teacher.full_name || teacher.name);
    setShowTeacherDropdown(false);
    setErrors({ ...errors, mainTeacherId: '' });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!courseName.trim()) {
      newErrors.courseName = t.teacher.courseManagement?.courseNameRequired || '课程名称不能为空';
    }
    
    if (!courseType) {
      newErrors.courseType = t.teacher.courseManagement?.courseTypeRequired || '请选择课程类型';
    }
    
    if (!courseHours || courseHours <= 0) {
      newErrors.courseHours = t.teacher.courseManagement?.courseHoursRequired || '课程学时必须大于0';
    }
    
    if (!coverImageId) {
      newErrors.coverImage = t.teacher.courseManagement?.coverImageRequired || '请选择课程封面';
    }
    
    if (!mainTeacherId) {
      newErrors.mainTeacherId = t.teacher.courseManagement?.mainTeacherRequired || '请选择课程讲师';
    }
    
    if (!introduction.trim()) {
      newErrors.introduction = t.teacher.courseManagement?.introductionRequired || '请输入课程简介';
    } else if (introduction.length > 500) {
      newErrors.introduction = t.teacher.courseManagement?.introductionMaxLength || '课程简介不能超过500字';
    }
    
    if (!objectives.trim()) {
      newErrors.objectives = t.teacher.courseManagement?.objectivesRequired || '请输入授课目标';
    } else if (objectives.length > 500) {
      newErrors.objectives = t.teacher.courseManagement?.objectivesMaxLength || '授课目标不能超过500字';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      await courseService.create({
        name: courseName,
        credits: courseCredits,
        course_type: courseType,
        course_category: courseCategory,
        enrollment_type: enrollmentType,
        hours: courseHours,
        is_public: isPublic,
        cover_id: coverImageId!,
        main_teacher_id: mainTeacherId!,
        introduction: introduction,
        objectives: objectives,
      });
      
      toast.success(t.teacher.courseManagement?.createSuccess || '课程创建成功');
      router.push('/teacher/courses');
    } catch (error: any) {
      console.error('Failed to create course:', error);
      toast.error('创建失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher => 
    (teacher.full_name || teacher.name || '').toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
    (teacher.username || '').toLowerCase().includes(teacherSearchTerm.toLowerCase())
  );

  const selectedTeacher = teachers.find(t => t.id === mainTeacherId);

  return (
    <TeacherLayout>
      <toast.ToastContainer />
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
                {t.teacher.courseManagement?.createTitle || '新建课程'}
              </h1>
              <p className="text-sm text-slate-500">
                {t.teacher.courseManagement?.createSubtitle || '创建新课程'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              {/* 课程名称 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.teacher.courseManagement?.courseName || '课程名称'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => {
                    setCourseName(e.target.value);
                    setErrors({ ...errors, courseName: '' });
                  }}
                  placeholder={t.teacher.courseManagement?.courseNamePlaceholder || '请输入课程名称'}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.courseName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.courseName && (
                  <p className="mt-1 text-sm text-red-500">{errors.courseName}</p>
                )}
              </div>

              {/* 课程类型 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  课程类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={courseCategory}
                  onChange={(e) => {
                    setCourseCategory(e.target.value as any);
                    setErrors({ ...errors, courseCategory: '' });
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">通识课</option>
                  <option value="professional_basic">专业基础课</option>
                  <option value="professional_core">专业核心课</option>
                  <option value="expansion">拓展课</option>
                  <option value="elective_course">选修课</option>
                </select>
                {errors.courseCategory && (
                  <p className="mt-1 text-sm text-red-500">{errors.courseCategory}</p>
                )}
              </div>

              {/* 选课类型 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选课类型 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="required"
                      checked={enrollmentType === 'required'}
                      onChange={(e) => {
                        setEnrollmentType(e.target.value as any);
                        setErrors({ ...errors, enrollmentType: '' });
                      }}
                      className="mr-2"
                    />
                    <span>必修课</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="elective"
                      checked={enrollmentType === 'elective'}
                      onChange={(e) => {
                        setEnrollmentType(e.target.value as any);
                        setErrors({ ...errors, enrollmentType: '' });
                      }}
                      className="mr-2"
                    />
                    <span>选修课</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="retake"
                      checked={enrollmentType === 'retake'}
                      onChange={(e) => {
                        setEnrollmentType(e.target.value as any);
                        setErrors({ ...errors, enrollmentType: '' });
                      }}
                      className="mr-2"
                    />
                    <span>重修课</span>
                  </label>
                </div>
                {errors.enrollmentType && (
                  <p className="mt-1 text-sm text-red-500">{errors.enrollmentType}</p>
                )}
              </div>

              {/* 课程学分 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  课程学分 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={courseCredits || ''}
                  onChange={(e) => {
                    setCourseCredits(parseInt(e.target.value) || 0);
                    setErrors({ ...errors, courseCredits: '' });
                  }}
                  min="1"
                  max="10"
                  placeholder="请输入课程学分"
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.courseCredits ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.courseCredits && (
                  <p className="mt-1 text-sm text-red-500">{errors.courseCredits}</p>
                )}
              </div>

              {/* 课程学时 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.teacher.courseManagement?.courseHours || '课程学时'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={courseHours || ''}
                  onChange={(e) => {
                    setCourseHours(parseInt(e.target.value) || 0);
                    setErrors({ ...errors, courseHours: '' });
                  }}
                  min="1"
                  placeholder={t.teacher.courseManagement?.courseHoursPlaceholder || '请输入课程学时'}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.courseHours ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.courseHours && (
                  <p className="mt-1 text-sm text-red-500">{errors.courseHours}</p>
                )}
              </div>

              {/* 是否公开课 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.teacher.courseManagement?.isPublic || '是否公开课'}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="false"
                      checked={!isPublic}
                      onChange={() => {
                        setIsPublic(false);
                      }}
                      className="mr-2"
                    />
                    <span>{t.teacher.courseManagement?.no || '否'}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="true"
                      checked={isPublic}
                      onChange={() => {
                        setIsPublic(true);
                      }}
                      className="mr-2"
                    />
                    <span>{t.teacher.courseManagement?.yes || '是'}</span>
                  </label>
                </div>
              </div>

              {/* 所属专业（只读） */}
              {majorName && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t.teacher.courseManagement?.major || '所属专业'}
                  </label>
                  <div className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-700">
                    {majorName}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.teacher.courseManagement?.majorReadOnly || '此字段从您的专业信息自动获取，不可编辑'}
                  </p>
                </div>
              )}

              {/* 课程封面 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.teacher.courseManagement?.coverImage || '课程封面'} <span className="text-red-500">*</span>
                </label>
                
                {/* 封面上传 */}
                <div className="mb-4">
                  <label className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                    </svg>
                    {uploadingCover ? t.teacher.courseManagement?.uploading || '上传中...' : t.teacher.courseManagement?.uploadCover || '上传封面'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={uploadingCover}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCoverGallery(!showCoverGallery)}
                    className="ml-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {t.teacher.courseManagement?.selectFromGallery || '从图库选择'}
                  </button>
                </div>

                {/* 封面预览（16:9比例） */}
                {coverPreview && (
                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">{t.teacher.courseManagement?.selectedCover || '已选择封面'}：</p>
                    <div className="relative w-full" style={{ aspectRatio: '16/9', maxWidth: '600px' }}>
                      <img
                        src={coverPreview}
                        alt="封面预览"
                        className="w-full h-full object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setPreviewImageUrl(coverPreview);
                          setPreviewImageName(availableCovers.find(c => c.id === coverImageId)?.filename || '封面预览');
                          setPreviewModalOpen(true);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImageId(null);
                          setCoverPreview('');
                          setErrors({ ...errors, coverImage: '' });
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
                          setPreviewImageUrl(coverPreview);
                          setPreviewImageName(availableCovers.find(c => c.id === coverImageId)?.filename || '封面预览');
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
                {showCoverGallery && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                    {loadingCovers ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                        {availableCovers.map((cover) => (
                          <div
                            key={cover.id}
                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${
                              coverImageId === cover.id
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                            style={{ aspectRatio: '16/9' }}
                          >
                            <img
                              src={cover.image_url}
                              alt={cover.filename}
                              className="w-full h-full object-cover"
                              onClick={() => handleCoverSelect(cover.id)}
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
                            {coverImageId === cover.id && (
                              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                        {availableCovers.length === 0 && (
                          <p className="col-span-4 text-center text-slate-500 text-sm py-4">
                            {t.teacher.courseManagement?.noCovers || '暂无可用封面'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {errors.coverImage && (
                  <p className="mt-1 text-sm text-red-500">{errors.coverImage}</p>
                )}
              </div>

              {/* 课程讲师 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.teacher.courseManagement?.mainTeacher || '课程讲师'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={teacherSearchTerm}
                    onChange={(e) => {
                      setTeacherSearchTerm(e.target.value);
                      setShowTeacherDropdown(true);
                      setErrors({ ...errors, mainTeacherId: '' });
                    }}
                    onFocus={() => setShowTeacherDropdown(true)}
                    placeholder={t.teacher.courseManagement?.selectTeacher || '请选择课程讲师'}
                    className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.mainTeacherId ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  {showTeacherDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.map((teacher) => (
                          <div
                            key={teacher.id}
                            onClick={() => handleTeacherSelect(teacher)}
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
                {selectedTeacher && (
                  <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <span className="text-sm text-blue-700">
                      {t.teacher.courseManagement?.selectedTeacher || '已选择'}：{selectedTeacher.full_name || selectedTeacher.name}
                    </span>
                  </div>
                )}
                {errors.mainTeacherId && (
                  <p className="mt-1 text-sm text-red-500">{errors.mainTeacherId}</p>
                )}
              </div>

              {/* 课程简介 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.teacher.courseManagement?.introduction || '课程简介'} <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal ml-2">
                    ({introduction.length}/500)
                  </span>
                </label>
                <textarea
                  value={introduction}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setIntroduction(e.target.value);
                      setErrors({ ...errors, introduction: '' });
                    }
                  }}
                  rows={6}
                  placeholder={t.teacher.courseManagement?.introductionPlaceholder || '请输入课程简介（最多500字）'}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.introduction ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.introduction && (
                  <p className="mt-1 text-sm text-red-500">{errors.introduction}</p>
                )}
              </div>

              {/* 授课目标 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t.teacher.courseManagement?.objectives || '授课目标'} <span className="text-red-500">*</span>
                  <span className="text-slate-500 font-normal ml-2">
                    ({objectives.length}/500)
                  </span>
                </label>
                <textarea
                  value={objectives}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setObjectives(e.target.value);
                      setErrors({ ...errors, objectives: '' });
                    }
                  }}
                  rows={6}
                  placeholder={t.teacher.courseManagement?.objectivesPlaceholder || '请输入授课目标（最多500字）'}
                  className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.objectives ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {errors.objectives && (
                  <p className="mt-1 text-sm text-red-500">{errors.objectives}</p>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => router.push('/teacher/courses')}
                  className="px-6 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (t.common.saving || '保存中...') : (t.common.create || '创建')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

