'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClassData {
  class_name: string;
  major_name: string;
  grade: string;
  student_count: number;
}

export default function StudentsHeatmapPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [majors, setMajors] = useState<string[]>([]);
  const [grades, setGrades] = useState<string[]>([]);
  const [maxCount, setMaxCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // 获取所有学生数据
      const response = await adminService.getStudents({ skip: 0, limit: 1000 });
      const students = response.items;

      // 按班级分组统计
      const classMap: Record<string, ClassData> = {};
      const majorSet = new Set<string>();
      const gradeSet = new Set<string>();

      students.forEach((student: any) => {
        const className = student.class_name || '未分配班级';
        const majorName = student.major_name || '未分配专业';
        const grade = student.grade || '未分配年级';
        
        majorSet.add(majorName);
        gradeSet.add(grade);

        const key = `${majorName}-${grade}-${className}`;
        if (!classMap[key]) {
          classMap[key] = {
            class_name: className,
            major_name: majorName,
            grade,
            student_count: 0
          };
        }
        classMap[key].student_count += 1;
      });

      // 转换为数组格式
      const classData = Object.values(classMap);
      const max = Math.max(...classData.map(c => c.student_count), 0);

      setData(classData);
      setMajors(Array.from(majorSet).sort());
      setGrades(Array.from(gradeSet).sort());
      setMaxCount(max);
    } catch (err) {
      console.error('Failed to load heatmap data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-50';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.2) return 'bg-blue-100';
    if (intensity <= 0.4) return 'bg-blue-200';
    if (intensity <= 0.6) return 'bg-blue-300';
    if (intensity <= 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getTextColor = (count: number) => {
    if (count === 0) return 'text-slate-400';
    const intensity = Math.min(count / maxCount, 1);
    return intensity > 0.6 ? 'text-white' : 'text-slate-700';
  };

  const getClassesForCell = (major: string, grade: string) => {
    return data.filter(d => d.major_name === major && d.grade === grade);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const totalClasses = data.length;
  const totalStudents = data.reduce((sum, d) => sum + d.student_count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.admin.classes.heatmap.title}</h1>
          <p className="text-slate-600">{t.admin.classes.heatmap.subtitle}</p>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold text-slate-700">{t.admin.classes.heatmap.legend}：</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded"></div>
                <span className="text-sm text-slate-600">0 {t.admin.classes.heatmap.students}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded"></div>
                <span className="text-sm text-slate-600">1-{Math.ceil(maxCount * 0.2)} {t.admin.classes.heatmap.students}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-200 rounded"></div>
                <span className="text-sm text-slate-600">{Math.ceil(maxCount * 0.2 + 1)}-{Math.ceil(maxCount * 0.4)} {t.admin.classes.heatmap.students}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-300 rounded"></div>
                <span className="text-sm text-slate-600">{Math.ceil(maxCount * 0.4 + 1)}-{Math.ceil(maxCount * 0.6)} {t.admin.classes.heatmap.students}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-400 rounded"></div>
                <span className="text-sm text-slate-600">{Math.ceil(maxCount * 0.6 + 1)}-{Math.ceil(maxCount * 0.8)} {t.admin.classes.heatmap.students}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded"></div>
                <span className="text-sm text-slate-600 font-bold">{Math.ceil(maxCount * 0.8 + 1)}+ {t.admin.classes.heatmap.students}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 overflow-x-auto">
          {majors.length === 0 || grades.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <p className="text-slate-600 text-lg font-medium">{t.admin.classes.overview.noData}</p>
              <p className="text-slate-400 text-sm mt-2">{t.admin.classes.overview.noDataHint}</p>
            </div>
          ) : (
            <div className="min-w-max">
              <div className="grid gap-3" style={{ gridTemplateColumns: `180px repeat(${grades.length}, minmax(150px, 1fr))` }}>
                {/* Header row */}
                <div className="font-bold text-slate-700 text-sm px-4 py-3"></div>
                {grades.map(grade => (
                  <div key={grade} className="font-bold text-slate-700 text-center text-sm px-4 py-3 bg-slate-50 rounded-lg">
                    {grade}
                  </div>
                ))}

                {/* Data rows */}
                {majors.map(major => (
                  <>
                    <div key={`${major}-label`} className="font-bold text-slate-700 text-sm px-4 py-3 bg-slate-50 rounded-lg flex items-center">
                      {major}
                    </div>
                    {grades.map(grade => {
                      const classes = getClassesForCell(major, grade);
                      return (
                        <div key={`${major}-${grade}`} className="space-y-2">
                          {classes.length === 0 ? (
                            <div className="bg-slate-50 text-slate-400 rounded-lg px-3 py-4 text-center text-sm border border-slate-200">
                              {t.admin.classes.heatmap.noClass}
                            </div>
                          ) : (
                            classes.map((classItem, idx) => (
                              <div
                                key={idx}
                                className={`group relative ${getColor(classItem.student_count)} ${getTextColor(classItem.student_count)} rounded-lg px-3 py-4 text-center font-medium text-sm transition-all hover:scale-105 hover:shadow-lg cursor-pointer border border-slate-100`}
                              >
                                {classItem.class_name}
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                  <div className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-xl min-w-[200px] text-left">
                                    <div className="text-xs font-bold mb-2 text-blue-300">{t.admin.classes.heatmap.classDetails}</div>
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">{t.admin.classes.heatmap.className}:</span>
                                        <span className="font-medium">{classItem.class_name}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">{t.admin.classes.heatmap.major}:</span>
                                        <span className="font-medium">{classItem.major_name}</span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-slate-300">{t.admin.classes.heatmap.grade}:</span>
                                        <span className="font-medium">{classItem.grade}</span>
                                      </div>
                                      <div className="flex justify-between text-xs border-t border-slate-700 pt-1.5 mt-1.5">
                                        <span className="text-slate-300">{t.admin.classes.heatmap.studentCount}:</span>
                                        <span className="font-bold text-blue-300">{classItem.student_count} {t.admin.classes.heatmap.students}</span>
                                      </div>
                                    </div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                      <div className="border-4 border-transparent border-t-slate-900"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="text-3xl font-bold text-blue-600 mb-2">{majors.length}</div>
            <div className="text-slate-600 text-sm font-medium">{t.admin.classes.heatmap.stats.majors}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="text-3xl font-bold text-emerald-600 mb-2">{totalClasses}</div>
            <div className="text-slate-600 text-sm font-medium">{t.admin.classes.heatmap.stats.classes}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="text-3xl font-bold text-purple-600 mb-2">{totalStudents}</div>
            <div className="text-slate-600 text-sm font-medium">{t.admin.classes.heatmap.stats.students}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
