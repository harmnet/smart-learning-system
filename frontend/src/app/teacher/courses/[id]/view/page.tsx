"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { courseService } from '@/services/course.service';
import { courseOutlineService, Chapter, Section } from '@/services/courseOutline.service';
import { teachingResourceService, TeachingResource } from '@/services/teachingResource.service';
import { referenceMaterialService, ReferenceMaterial } from '@/services/referenceMaterial.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import ResourcePreviewModal from '@/components/teacher/ResourcePreviewModal';

export default function CourseViewPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);
  
  const [course, setCourse] = useState<any>(null);
  const [outline, setOutline] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  
  // 资源预览相关状态
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewResource, setPreviewResource] = useState<TeachingResource | ReferenceMaterial | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // 资源映射（用于快速查找资源详情）
  const [resourceMap, setResourceMap] = useState<Map<number, { type: string; resource: TeachingResource | ReferenceMaterial }>>(new Map());

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
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
      if (!teacherId) {
        alert('无法获取教师信息');
        return;
      }
      
      // 加载课程信息和大纲
      const [courseData, outlineData] = await Promise.all([
        courseService.getById(courseId),
        courseOutlineService.getOutline(courseId)
      ]);
      
      setCourse(courseData);
      setOutline(outlineData.outline || []);
      
      // 默认展开所有章
      const chapterIds = (outlineData.outline || []).map((ch: Chapter) => ch.id);
      setExpandedChapters(new Set(chapterIds));
      
      // 收集所有资源ID并加载资源详情
      const resourceIds: { type: string; id: number }[] = [];
      (outlineData.outline || []).forEach((chapter: Chapter) => {
        chapter.sections?.forEach((section: Section) => {
          section.resources?.forEach((resource) => {
            resourceIds.push({
              type: resource.resource_type,
              id: resource.resource_id
            });
          });
        });
      });
      
      // 加载资源详情
      if (resourceIds.length > 0) {
        const resourceMap = new Map();
        const teachingResourceIds = resourceIds.filter(r => r.type === 'teaching_resource').map(r => r.id);
        const referenceMaterialIds = resourceIds.filter(r => r.type === 'reference_material').map(r => r.id);
        
        const [teachingResources, referenceMaterials] = await Promise.all([
          teachingResourceIds.length > 0 
            ? teachingResourceService.getAll(teacherId, 0, 1000)
            : Promise.resolve([]),
          referenceMaterialIds.length > 0
            ? referenceMaterialService.getAll(teacherId, 0, 1000)
            : Promise.resolve([])
        ]);
        
        // 构建资源映射
        teachingResources.forEach((resource: TeachingResource) => {
          resourceMap.set(resource.id, { type: 'teaching_resource', resource });
        });
        referenceMaterials.forEach((material: ReferenceMaterial) => {
          resourceMap.set(material.id, { type: 'reference_material', resource: material });
        });
        
        setResourceMap(resourceMap);
      }
    } catch (error: any) {
      console.error('Failed to load course data:', error);
      alert('加载课程信息失败: ' + (error.response?.data?.detail || error.message));
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

  const getResourceTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'teaching_resource': '教学资源',
      'reference_material': '参考资料',
      'video': '视频',
      'ppt': '课件',
      'pdf': 'PDF',
      'word': 'Word',
      'excel': 'Excel',
      'md': 'Markdown',
      'image': '图片',
      'hyperlink': '超链接',
      'archive': '压缩包'
    };
    return typeMap[type] || type;
  };

  const handleResourceClick = (resourceType: string, resourceId: number) => {
    const resourceInfo = resourceMap.get(resourceId);
    if (!resourceInfo) {
      alert(t.teacher.courseManagement?.resourceNotFound || '资源信息未找到');
      return;
    }
    
    const resource = resourceInfo.resource;
    setPreviewResource(resource);
    
    // 根据资源类型生成预览URL
    if (resourceType === 'teaching_resource') {
      setPreviewUrl(teachingResourceService.getPreviewUrl(resourceId));
    } else if (resourceType === 'reference_material') {
      // 超链接和压缩包不支持预览
      if (resource.resource_type === 'hyperlink') {
        if ((resource as ReferenceMaterial).link_url) {
          window.open((resource as ReferenceMaterial).link_url, '_blank');
          return;
        }
      } else if (resource.resource_type === 'archive') {
        alert(t.teacher.courseManagement?.archiveNeedDownload || '压缩包需要下载后查看');
        return;
      } else {
        setPreviewUrl(referenceMaterialService.getPreviewUrl(resourceId));
      }
    }
    
    setPreviewModalOpen(true);
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (!course) {
    return (
      <TeacherLayout>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
            <p className="text-slate-500">{t.teacher.courseManagement?.courseNotFound || '课程不存在'}</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 返回按钮 */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            <span>{t.teacher.courseManagement?.backToCourseList || '返回课程列表'}</span>
          </button>

          {/* 课程基本信息卡片 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* 课程封面 */}
            <div className="relative w-full h-64 bg-slate-200">
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
                  <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
              )}
            </div>

            {/* 课程信息 */}
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    {course.name || course.title}
                  </h1>
                  {course.code && (
                    <p className="text-slate-500 mb-4">
                      {t.teacher.courseManagement?.courseCode || '课程代码'}：{course.code}
                    </p>
                  )}
                </div>
                {course.course_type && (
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    course.course_type === 'required' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {course.course_type === 'required' 
                      ? (t.teacher.courseManagement?.requiredCourse || '必修课')
                      : (t.teacher.courseManagement?.electiveCourse || '选修课')}
                  </span>
                )}
              </div>

              {/* 课程详细信息网格 */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {course.hours && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{t.teacher.courseManagement?.courseHours || '课程学时'}</p>
                      <p className="text-lg font-semibold text-slate-900">{course.hours} {t.teacher.courseManagement?.hours || '学时'}</p>
                    </div>
                  </div>
                )}

                {course.credits && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{t.teacher.courseManagement?.credits || '学分'}</p>
                      <p className="text-lg font-semibold text-slate-900">{course.credits} {t.teacher.courseManagement?.credits || '学分'}</p>
                    </div>
                  </div>
                )}

                {course.main_teacher_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{t.teacher.courseManagement?.mainTeacher || '主讲教师'}</p>
                      <p className="text-lg font-semibold text-slate-900">{course.main_teacher_name}</p>
                    </div>
                  </div>
                )}

                {course.major_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{t.teacher.courseManagement?.major || '所属专业'}</p>
                      <p className="text-lg font-semibold text-slate-900">{course.major_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 课程简介 */}
              {course.introduction && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{t.teacher.courseManagement?.courseIntroduction || '课程简介'}</h3>
                  <div className="prose max-w-none text-slate-700 bg-slate-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{course.introduction}</p>
                  </div>
                </div>
              )}

              {/* 授课目标 */}
              {course.objectives && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">{t.teacher.courseManagement?.teachingObjectives || '授课目标'}</h3>
                  <div className="prose max-w-none text-slate-700 bg-slate-50 rounded-lg p-4">
                    <p className="whitespace-pre-wrap">{course.objectives}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 课程大纲 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t.teacher.courseManagement?.outlineTitle || '课程大纲'}</h2>
            
            {outline.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>{t.teacher.courseManagement?.noOutline || '暂无课程大纲'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outline.map((chapter) => (
                  <div key={chapter.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* 章标题 */}
                    <div
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                      onClick={() => toggleChapter(chapter.id)}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-5 h-5 text-slate-500 transition-transform ${
                            expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        <h3 className="text-lg font-semibold text-slate-900">{chapter.title}</h3>
                      </div>
                      {chapter.sections && chapter.sections.length > 0 && (
                        <span className="text-sm text-slate-500">
                          {chapter.sections.length} {t.teacher.courseManagement?.sections || '个小节'}
                        </span>
                      )}
                    </div>

                    {/* 小节列表 */}
                    {expandedChapters.has(chapter.id) && chapter.sections && chapter.sections.length > 0 && (
                      <div className="border-t border-slate-200">
                        {chapter.sections.map((section) => (
                          <div key={section.id} className="p-4 border-b border-slate-100 last:border-b-0">
                            <h4 className="text-base font-medium text-slate-800 mb-3">{section.title}</h4>
                            
                            {/* 资源列表 */}
                            {section.resources && section.resources.length > 0 && (
                              <div className="ml-6 mb-3">
                                <p className="text-sm font-medium text-slate-600 mb-2">{t.teacher.courseManagement?.linkedResources || '关联资源'}：</p>
                                <div className="flex flex-wrap gap-2">
                                  {section.resources.map((resource, idx) => {
                                    const resourceInfo = resourceMap.get(resource.resource_id);
                                    const resourceName = resourceInfo?.resource?.resource_name || `资源 #${resource.resource_id}`;
                                    const canPreview = resourceInfo && 
                                      resourceInfo.resource.resource_type !== 'hyperlink' && 
                                      resourceInfo.resource.resource_type !== 'archive';
                                    
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handleResourceClick(resource.resource_type, resource.resource_id)}
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                                          canPreview
                                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                                            : 'bg-slate-50 text-slate-600 cursor-default'
                                        }`}
                                        title={resourceName}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <span className="max-w-[150px] truncate">{resourceName}</span>
                                        {canPreview && (
                                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                          </svg>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 试卷列表 */}
                            {section.exam_papers && section.exam_papers.length > 0 && (
                              <div className="ml-6 mb-3">
                                <p className="text-sm font-medium text-slate-600 mb-2">{t.teacher.courseManagement?.linkedExamPapers || '关联试卷'}：</p>
                                <div className="flex flex-wrap gap-2">
                                  {section.exam_papers.map((paper, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                      试卷 #{paper.id}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 作业列表 */}
                            {section.homeworks && section.homeworks.length > 0 && (
                              <div className="ml-6">
                                <p className="text-sm font-medium text-slate-600 mb-2">{t.teacher.courseManagement?.homework || '作业'}：</p>
                                <div className="space-y-2">
                                  {section.homeworks.map((homework) => (
                                    <div
                                      key={homework.id}
                                      className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg"
                                    >
                                      <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800">{homework.title}</p>
                                        {homework.description && (
                                          <p className="text-xs text-slate-600 mt-1">{homework.description}</p>
                                        )}
                                        {homework.deadline && (
                                          <p className="text-xs text-slate-500 mt-1">
                                            截止时间：{new Date(homework.deadline).toLocaleString('zh-CN')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 如果小节没有任何内容 */}
                            {(!section.resources || section.resources.length === 0) &&
                             (!section.exam_papers || section.exam_papers.length === 0) &&
                             (!section.homeworks || section.homeworks.length === 0) && (
                              <div className="ml-6 text-sm text-slate-400 italic">
                                {t.teacher.courseManagement?.noLinkedContent || '暂无关联内容'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 章关联的试卷 */}
                    {expandedChapters.has(chapter.id) && chapter.exam_papers && chapter.exam_papers.length > 0 && (
                      <div className="p-4 border-t border-slate-200 bg-purple-50">
                        <p className="text-sm font-medium text-purple-700 mb-2">{t.teacher.courseManagement?.chapterLinkedExamPapers || '章关联试卷'}：</p>
                        <div className="flex flex-wrap gap-2">
                          {chapter.exam_papers.map((paper, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              试卷 #{paper.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 资源预览弹窗 */}
      {previewResource && (
        <ResourcePreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setPreviewResource(null);
            setPreviewUrl('');
          }}
          resource={previewResource}
          previewUrl={previewUrl}
        />
      )}
    </TeacherLayout>
  );
}

