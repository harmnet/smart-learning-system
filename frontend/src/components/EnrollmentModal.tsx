"use client";

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { enrollmentService, EnrollmentListItem } from '@/services/enrollment.service';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFormData = {
  phone: '',
  child_photo_url: '',
  child_last_name_passport: '',
  child_first_name: '',
  child_name_passport: '',
  child_gender: '',
  child_birth_date: '',
  child_birth_country: '',
  child_nationality: '',
  child_passport_no: '',
  child_second_nationality: '',
  programme_interested: '',
  enrollment_year: '',
  enrolment_period: '',
  campus: '',
  address_home_street_line1: '',
  address_home_street_line2: '',
  address_city: '',
  address_state: '',
  address_country: '',
  address_home_phone_country_code: '',
  address_home_phone_number: '',
  malaysia_address: '',
  malaysia_phone_country_code: '',
  malaysia_phone_number: '',
  contact_email: '',
  require_visa_apply: false,
  parent1_last_name_passport: '',
  parent1_first_name_passport: '',
  parent1_relationship: '',
  parent1_marital_status: '',
  parent1_title: '',
  parent1_nationality: '',
  parent1_passport_no: '',
  parent1_religion: '',
  parent1_local_street_line1: '',
  parent1_local_street_line2: '',
  parent1_local_city: '',
  parent1_local_state: '',
  parent1_local_country: '',
  parent1_local_postcode: '',
  parent1_designation_occupation: '',
  parent1_email: '',
  parent1_receive_email_notifications: false,
  parent1_company_name: '',
  parent1_company_street_line1: '',
  parent1_company_street_line2: '',
  parent1_company_state: '',
  parent1_company_city: '',
  parent1_company_country: '',
  parent1_company_postcode: '',
  parent1_company_phone_country_code: '',
  parent1_company_phone_number: '',
  parent2_last_name_passport: '',
  parent2_first_name_passport: '',
  parent2_relationship: '',
  parent2_marital_status: '',
  parent2_title: '',
  parent2_nationality: '',
  parent2_passport_no: '',
  parent2_religion: '',
  parent2_local_street_line1: '',
  parent2_local_street_line2: '',
  parent2_local_city: '',
  parent2_local_state: '',
  parent2_local_country: '',
  parent2_local_postcode: '',
  parent2_designation_occupation: '',
  parent2_email: '',
  parent2_receive_email_notifications: false,
  parent2_company_name: '',
  parent2_company_street_line1: '',
  parent2_company_street_line2: '',
  parent2_company_state: '',
  parent2_company_city: '',
  parent2_company_country: '',
  parent2_company_postcode: '',
  parent2_company_phone_country_code: '',
  parent2_company_phone_number: '',
  family_phone_country_code: '',
  family_phone_number: '',
  emergency1_relationship: '',
  emergency1_last_name: '',
  emergency1_first_name: '',
  emergency1_phone_country_code: '',
  emergency1_phone_number: '',
  prev_school1_name: '',
  prev_school1_joining_date: '',
  prev_school1_leaving_date: '',
  prev_school1_grade_level: '',
  prev_school1_reason_for_leaving: '',
  has_double_promotion: false,
  has_disciplinary_issues: false,
  co_curricular_sports: '',
  co_curricular_clubs: '',
  has_gifted_programme: false,
  has_special_education_support: false,
  has_assessed_by_psychologist: false,
  health_dietary: '',
  health_condition_asthma: false,
  health_condition_epilepsy: false,
  health_condition_fits_due_to_high_fever: false,
  health_condition_kidney_disease: false,
  health_condition_heart_problem: false,
  health_condition_diabetes_mellitus: false,
  health_condition_blood_disorder: false,
  health_condition_adhd: false,
  health_condition_psychological_disorder: false,
  health_condition_dyslexia: false,
  health_condition_learning_difficulties: false,
  health_condition_others: false,
  infection_measles: false,
  infection_chicken_pox: false,
  infection_mumps: false,
  infection_others: false,
  heard_about_us: ''
};

const programmeOptions = [
  { value: 'PYP', label: 'PYP (Primary Years Programme)' },
  { value: 'MYP', label: 'MYP (Middle Years Programme)' },
  { value: 'DP', label: 'DP (Diploma Programme)' },
];

export default function EnrollmentModal({ isOpen, onClose }: EnrollmentModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [queryPhone, setQueryPhone] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [queryResults, setQueryResults] = useState<EnrollmentListItem[]>([]);
  const [paymentHint, setPaymentHint] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setSubmitting(false);
      setSubmitError('');
      setSubmitSuccess('');
      setQueryPhone('');
      setQueryLoading(false);
      setQueryError('');
      setQueryResults([]);
      setPaymentHint('');
    }
  }, [isOpen]);

  const updateField = (key: keyof typeof initialFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleQuery = async () => {
    if (!queryPhone) {
      setQueryError('请输入手机号');
      return;
    }
    setQueryLoading(true);
    setQueryError('');
    setQueryResults([]);
    setPaymentHint('');
    try {
      const data = await enrollmentService.getByPhone(queryPhone);
      setQueryResults(data.items || []);
      if (!data.items?.length) {
        setQueryError('未找到报名记录');
      }
    } catch (error: any) {
      setQueryError(error.response?.data?.detail || '查询失败，请稍后重试');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      setSubmitError('请填写学生手机号');
      return;
    }
    if (!formData.child_first_name || !formData.child_last_name_passport) {
      setSubmitError('请填写学生姓名信息');
      return;
    }
    if (!formData.programme_interested) {
      setSubmitError('请选择意向项目');
      return;
    }
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);
    try {
      await enrollmentService.create(formData);
      setSubmitSuccess('报名已提交，请等待审批');
      setFormData(initialFormData);
    } catch (error: any) {
      setSubmitError(error.response?.data?.detail || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status: string) => {
    if (status === 'approved') return '已通过';
    if (status === 'rejected') return '已拒绝';
    return '待审批';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <Dialog.Title as="h3" className="text-2xl font-bold">
                        在线报名
                      </Dialog.Title>
                      <p className="text-sm text-blue-100 mt-1">
                        参照 OpenApply 报名流程，请完整填写信息
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-blue-100 hover:text-white"
                      onClick={onClose}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-6 bg-white/10 rounded-2xl p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                      <input
                        value={queryPhone}
                        onChange={(e) => setQueryPhone(e.target.value)}
                        placeholder="输入学生手机号查询审批结果"
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-blue-200 bg-white/10 border border-white/20 focus:border-white/60 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleQuery}
                        disabled={queryLoading}
                        className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 disabled:opacity-60"
                      >
                        {queryLoading ? '查询中...' : '查询'}
                      </button>
                    </div>
                    {queryError && (
                      <p className="text-sm text-rose-100 mt-2">{queryError}</p>
                    )}
                    {paymentHint && (
                      <p className="text-sm text-emerald-100 mt-2">{paymentHint}</p>
                    )}
                    {queryResults.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {queryResults.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/15 rounded-xl px-4 py-3"
                          >
                            <div className="text-sm">
                              <div className="font-semibold">{item.child_name || '未填写姓名'}</div>
                              <div className="text-blue-100">
                                {item.programme_interested || '未填写项目'} · {formatStatus(item.status)}
                              </div>
                              <div className="text-blue-200 text-xs">{item.created_at || ''}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPaymentHint('缴费功能即将上线')}
                              disabled={item.status !== 'approved'}
                              className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-400 text-white disabled:bg-white/30 disabled:text-white/60"
                            >
                              去缴费
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900">Step 1 学生信息</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">学生手机号 *</label>
                          <input
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">学生照片URL</label>
                          <input
                            value={formData.child_photo_url}
                            onChange={(e) => updateField('child_photo_url', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">护照姓 *</label>
                          <input
                            value={formData.child_last_name_passport}
                            onChange={(e) => updateField('child_last_name_passport', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">护照名 *</label>
                          <input
                            value={formData.child_first_name}
                            onChange={(e) => updateField('child_first_name', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">护照姓名</label>
                          <input
                            value={formData.child_name_passport}
                            onChange={(e) => updateField('child_name_passport', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">性别</label>
                          <select
                            value={formData.child_gender}
                            onChange={(e) => updateField('child_gender', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-white"
                          >
                            <option value="">请选择</option>
                            <option value="male">男</option>
                            <option value="female">女</option>
                            <option value="other">其他</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">出生日期</label>
                          <input
                            type="date"
                            value={formData.child_birth_date}
                            onChange={(e) => updateField('child_birth_date', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">出生国家</label>
                          <input
                            value={formData.child_birth_country}
                            onChange={(e) => updateField('child_birth_country', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">国籍</label>
                          <input
                            value={formData.child_nationality}
                            onChange={(e) => updateField('child_nationality', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">第二国籍</label>
                          <input
                            value={formData.child_second_nationality}
                            onChange={(e) => updateField('child_second_nationality', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">护照号码</label>
                          <input
                            value={formData.child_passport_no}
                            onChange={(e) => updateField('child_passport_no', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">意向项目 *</label>
                          <select
                            value={formData.programme_interested}
                            onChange={(e) => updateField('programme_interested', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none bg-white"
                          >
                            <option value="">请选择</option>
                            {programmeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">入学学年</label>
                          <input
                            value={formData.enrollment_year}
                            onChange={(e) => updateField('enrollment_year', e.target.value)}
                            placeholder="例如 2026/2027"
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">入学学期</label>
                          <input
                            value={formData.enrolment_period}
                            onChange={(e) => updateField('enrolment_period', e.target.value)}
                            placeholder="例如 秋季"
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">校区</label>
                          <input
                            value={formData.campus}
                            onChange={(e) => updateField('campus', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900">联系方式与地址</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">家庭住址</label>
                          <input
                            value={formData.address_home_street_line1}
                            onChange={(e) => updateField('address_home_street_line1', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">家庭住址补充</label>
                          <input
                            value={formData.address_home_street_line2}
                            onChange={(e) => updateField('address_home_street_line2', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">城市</label>
                          <input
                            value={formData.address_city}
                            onChange={(e) => updateField('address_city', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">州/省</label>
                          <input
                            value={formData.address_state}
                            onChange={(e) => updateField('address_state', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">国家</label>
                          <input
                            value={formData.address_country}
                            onChange={(e) => updateField('address_country', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">家庭电话国家码</label>
                          <input
                            value={formData.address_home_phone_country_code}
                            onChange={(e) => updateField('address_home_phone_country_code', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">家庭电话</label>
                          <input
                            value={formData.address_home_phone_number}
                            onChange={(e) => updateField('address_home_phone_number', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">马来西亚地址</label>
                          <input
                            value={formData.malaysia_address}
                            onChange={(e) => updateField('malaysia_address', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">马来西亚电话国家码</label>
                          <input
                            value={formData.malaysia_phone_country_code}
                            onChange={(e) => updateField('malaysia_phone_country_code', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">马来西亚电话</label>
                          <input
                            value={formData.malaysia_phone_number}
                            onChange={(e) => updateField('malaysia_phone_number', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">联系邮箱</label>
                          <input
                            value={formData.contact_email}
                            onChange={(e) => updateField('contact_email', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                          <input
                            type="checkbox"
                            checked={formData.require_visa_apply}
                            onChange={(e) => updateField('require_visa_apply', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm text-slate-600">需要办理签证</span>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900">Step 2 家庭信息</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">家长1 护照姓</label>
                          <input
                            value={formData.parent1_last_name_passport}
                            onChange={(e) => updateField('parent1_last_name_passport', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">家长1 护照名</label>
                          <input
                            value={formData.parent1_first_name_passport}
                            onChange={(e) => updateField('parent1_first_name_passport', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">关系</label>
                          <input
                            value={formData.parent1_relationship}
                            onChange={(e) => updateField('parent1_relationship', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">称谓</label>
                          <input
                            value={formData.parent1_title}
                            onChange={(e) => updateField('parent1_title', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">国籍</label>
                          <input
                            value={formData.parent1_nationality}
                            onChange={(e) => updateField('parent1_nationality', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">邮箱</label>
                          <input
                            value={formData.parent1_email}
                            onChange={(e) => updateField('parent1_email', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">护照号码</label>
                          <input
                            value={formData.parent1_passport_no}
                            onChange={(e) => updateField('parent1_passport_no', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-6">
                          <input
                            type="checkbox"
                            checked={formData.parent1_receive_email_notifications}
                            onChange={(e) => updateField('parent1_receive_email_notifications', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm text-slate-600">接收邮件通知</span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">家长2 护照姓</label>
                          <input
                            value={formData.parent2_last_name_passport}
                            onChange={(e) => updateField('parent2_last_name_passport', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">家长2 护照名</label>
                          <input
                            value={formData.parent2_first_name_passport}
                            onChange={(e) => updateField('parent2_first_name_passport', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">关系</label>
                          <input
                            value={formData.parent2_relationship}
                            onChange={(e) => updateField('parent2_relationship', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">邮箱</label>
                          <input
                            value={formData.parent2_email}
                            onChange={(e) => updateField('parent2_email', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">家庭联系电话国家码</label>
                          <input
                            value={formData.family_phone_country_code}
                            onChange={(e) => updateField('family_phone_country_code', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">家庭联系电话</label>
                          <input
                            value={formData.family_phone_number}
                            onChange={(e) => updateField('family_phone_number', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900">Step 3 账单与紧急联系人</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">紧急联系人关系</label>
                          <input
                            value={formData.emergency1_relationship}
                            onChange={(e) => updateField('emergency1_relationship', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">紧急联系人姓</label>
                          <input
                            value={formData.emergency1_last_name}
                            onChange={(e) => updateField('emergency1_last_name', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">紧急联系人名</label>
                          <input
                            value={formData.emergency1_first_name}
                            onChange={(e) => updateField('emergency1_first_name', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">紧急联系人国家码</label>
                          <input
                            value={formData.emergency1_phone_country_code}
                            onChange={(e) => updateField('emergency1_phone_country_code', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">紧急联系人电话</label>
                          <input
                            value={formData.emergency1_phone_number}
                            onChange={(e) => updateField('emergency1_phone_number', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-lg font-bold text-slate-900">Step 4 其他信息</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">上一所学校</label>
                          <input
                            value={formData.prev_school1_name}
                            onChange={(e) => updateField('prev_school1_name', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">入学日期</label>
                          <input
                            type="date"
                            value={formData.prev_school1_joining_date}
                            onChange={(e) => updateField('prev_school1_joining_date', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">离校日期</label>
                          <input
                            type="date"
                            value={formData.prev_school1_leaving_date}
                            onChange={(e) => updateField('prev_school1_leaving_date', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">年级</label>
                          <input
                            value={formData.prev_school1_grade_level}
                            onChange={(e) => updateField('prev_school1_grade_level', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">体育活动</label>
                          <input
                            value={formData.co_curricular_sports}
                            onChange={(e) => updateField('co_curricular_sports', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">社团活动</label>
                          <input
                            value={formData.co_curricular_clubs}
                            onChange={(e) => updateField('co_curricular_clubs', e.target.value)}
                            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.has_double_promotion}
                            onChange={(e) => updateField('has_double_promotion', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          是否跳级
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.has_disciplinary_issues}
                            onChange={(e) => updateField('has_disciplinary_issues', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          是否有纪律处分
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.has_special_education_support}
                            onChange={(e) => updateField('has_special_education_support', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          是否需要特殊教育支持
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.has_gifted_programme}
                            onChange={(e) => updateField('has_gifted_programme', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          是否有资优课程
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.has_assessed_by_psychologist}
                            onChange={(e) => updateField('has_assessed_by_psychologist', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          是否有心理评估
                        </label>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.health_condition_asthma}
                            onChange={(e) => updateField('health_condition_asthma', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          哮喘
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.health_condition_epilepsy}
                            onChange={(e) => updateField('health_condition_epilepsy', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          癫痫
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.health_condition_adhd}
                            onChange={(e) => updateField('health_condition_adhd', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          注意力缺陷
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.health_condition_dyslexia}
                            onChange={(e) => updateField('health_condition_dyslexia', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          阅读障碍
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.infection_measles}
                            onChange={(e) => updateField('infection_measles', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          麻疹史
                        </label>
                        <label className="flex items-center gap-3 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={formData.infection_chicken_pox}
                            onChange={(e) => updateField('infection_chicken_pox', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                          />
                          水痘史
                        </label>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">过敏/饮食注意</label>
                        <input
                          value={formData.health_dietary}
                          onChange={(e) => updateField('health_dietary', e.target.value)}
                          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">获知渠道</label>
                        <input
                          value={formData.heard_about_us}
                          onChange={(e) => updateField('heard_about_us', e.target.value)}
                          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </section>
                  </div>

                  {submitError && <p className="text-sm text-rose-600 mt-4">{submitError}</p>}
                  {submitSuccess && <p className="text-sm text-emerald-600 mt-4">{submitSuccess}</p>}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600"
                    >
                      关闭
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-60"
                    >
                      {submitting ? '提交中...' : '提交报名'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
