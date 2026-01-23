/**
 * 课程问答相关类型定义
 */

export interface CourseQASession {
  id: number;
  student_id: number;
  course_id: number;
  title: string;
  status: 'active' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CourseQAMessage {
  id: number;
  session_id: number;
  sender_id: number | null;  // AI 消息的 sender_id 为 null
  sender_type: 'student' | 'ai' | 'teacher';
  content: string;
  message_type: 'text' | 'system';
  is_sent_to_teacher: boolean;
  teacher_ids?: number[];
  ai_response_id?: number | null;
  parent_message_id?: number | null;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

export interface Teacher {
  id: number;
  name: string;
  username: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendToTeacherRequest {
  teacher_ids: number[];
}

export interface TeacherReplyRequest {
  content: string;
}

export interface TeacherQASession {
  student_id: number;
  student_no: string;
  student_name: string;
  session_id: number;
  latest_message_content: string;
  latest_message_time: string;
  unread_count: number;
  total_messages: number;
}

export interface TeacherQACourseGroup {
  course_id: number;
  course_name: string;
  students: TeacherQASession[];
}

export interface SessionMessagesResponse {
  session_id: number;
  course_id: number;
  course_name: string;
  student_id: number;
  student_name: string;
  student_no: string;
  messages: CourseQAMessage[];
}
