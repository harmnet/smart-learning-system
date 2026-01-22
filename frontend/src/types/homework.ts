// 作业相关类型定义

// 教师附件
export interface HomeworkAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
}

// 学生附件
export interface StudentAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
}

// 学生提交记录
export interface StudentSubmission {
  id: number;
  content: string | null;
  status: 'draft' | 'submitted' | 'graded';
  score: number | null;
  teacher_comment: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  attachments: StudentAttachment[];
}

// 作业详情（API返回）
export interface HomeworkDetail {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  attachments: HomeworkAttachment[];
  submission: StudentSubmission | null;
}

// 大纲中的作业项（简要信息）
export interface HomeworkItem {
  id: number;
  title: string;
  description: string | null;
  deadline: string | null;
  sort_order: number;
  submission_status: 'not_started' | 'draft' | 'submitted' | 'graded';
  score: number | null;
  submitted_at: string | null;
  has_submission: boolean;
}

// 提交作业请求
export interface HomeworkSubmitRequest {
  content: string | null;
  is_final: boolean;
}

// 添加附件请求
export interface AddAttachmentRequest {
  homework_id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
}

// 提交作业响应
export interface HomeworkSubmitResponse {
  id: number;
  status: string;
  submitted_at: string | null;
  message: string;
}

// 添加附件响应
export interface AddAttachmentResponse {
  id: number;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  message: string;
}

export interface TeacherCourseOption {
  id: number;
  title: string;
}

export interface TeacherHomeworkSubmissionItem {
  id: number;
  homework_id: number;
  homework_title: string;
  course_id: number;
  course_title: string;
  chapter_title: string | null;
  parent_chapter_title: string | null;
  student_id: number;
  student_name: string;
  student_no: string | null;
  submitted_at: string | null;
  status: 'submitted' | 'graded';
  score: number | null;
}

export interface TeacherHomeworkSubmissionListResponse {
  items: TeacherHomeworkSubmissionItem[];
  total: number;
}

export interface TeacherHomeworkSubmissionDetail {
  id: number;
  content: string | null;
  status: 'submitted' | 'graded';
  score: number | null;
  teacher_comment: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  student: {
    id: number;
    name: string | null;
    student_no: string | null;
  };
  course: {
    id: number;
    title: string | null;
  };
  chapter: {
    id: number;
    title: string | null;
    parent_title: string | null;
  };
  homework: {
    id: number;
    title: string | null;
    description: string | null;
    deadline: string | null;
  };
  attachments: StudentAttachment[];
  homework_attachments: HomeworkAttachment[];
}

export interface TeacherHomeworkGradeRequest {
  score: number;
  teacher_comment?: string | null;
}

export interface TeacherHomeworkGradeHistoryItem {
  id: number;
  score: number | null;
  teacher_comment: string | null;
  graded_at: string | null;
  teacher_id: number;
  teacher_name: string;
}

export interface TeacherHomeworkGradeHistoryResponse {
  total: number;
  items: TeacherHomeworkGradeHistoryItem[];
}

export interface TeacherHomeworkAIGradeResponse {
  score: number | null;
  feedback: string | null;
  raw_result: string | null;
  log_id?: number;
}
