import apiClient from '@/lib/api-client';
import {
  CourseQASession,
  CourseQAMessage,
  Teacher,
  SendMessageRequest,
  SendToTeacherRequest,
  TeacherReplyRequest,
  TeacherQACourseGroup,
  SessionMessagesResponse,
} from '@/types/courseQA';

class CourseQAService {
  /**
   * 获取或创建课程问答会话
   */
  async getSession(courseId: number): Promise<CourseQASession> {
    const response = await apiClient.get<CourseQASession>(
      `/student/courses/${courseId}/qa/session`
    );
    return response.data;
  }

  /**
   * 获取课程问答消息列表
   */
  async getMessages(courseId: number): Promise<CourseQAMessage[]> {
    const response = await apiClient.get<CourseQAMessage[]>(
      `/student/courses/${courseId}/qa/messages`
    );
    return response.data;
  }

  /**
   * 发送学生消息（自动触发AI回复）
   */
  async sendMessage(
    courseId: number,
    content: string
  ): Promise<CourseQAMessage[]> {
    const response = await apiClient.post<CourseQAMessage[]>(
      `/student/courses/${courseId}/qa/messages`,
      { content } as SendMessageRequest
    );
    return response.data;
  }

  /**
   * 将消息发送给教师
   */
  async sendToTeacher(
    courseId: number,
    messageId: number,
    teacherIds: number[]
  ): Promise<CourseQAMessage> {
    const response = await apiClient.post<CourseQAMessage>(
      `/student/courses/${courseId}/qa/messages/${messageId}/send-to-teacher`,
      { teacher_ids: teacherIds } as SendToTeacherRequest
    );
    return response.data;
  }

  /**
   * 获取课程相关教师列表
   */
  async getTeachers(courseId: number): Promise<Teacher[]> {
    const response = await apiClient.get<{ teachers: Teacher[] }>(
      `/student/courses/${courseId}/qa/teachers`
    );
    return response.data.teachers;
  }

  /**
   * 教师获取课程的所有问答消息
   */
  async getTeacherMessages(courseId: number): Promise<CourseQAMessage[]> {
    const response = await apiClient.get<CourseQAMessage[]>(
      `/teacher/courses/${courseId}/qa/messages`
    );
    return response.data;
  }

  /**
   * 教师回复消息
   */
  async teacherReply(
    courseId: number,
    messageId: number,
    content: string
  ): Promise<CourseQAMessage> {
    const response = await apiClient.post<CourseQAMessage>(
      `/teacher/courses/${courseId}/qa/messages/${messageId}/reply`,
      { content } as TeacherReplyRequest
    );
    return response.data;
  }

  /**
   * 标记消息为已读（教师端）
   */
  async markAsRead(
    courseId: number,
    messageId: number
  ): Promise<CourseQAMessage> {
    const response = await apiClient.put<CourseQAMessage>(
      `/teacher/courses/${courseId}/qa/messages/${messageId}/read`
    );
    return response.data;
  }

  /**
   * 获取教师问答会话列表（按课程分组）
   */
  async getTeacherQASessions(): Promise<TeacherQACourseGroup[]> {
    const response = await apiClient.get<{ courses: TeacherQACourseGroup[] }>(
      `/teacher/qa/sessions`
    );
    return response.data.courses;
  }

  /**
   * 获取会话消息详情（教师端）
   */
  async getSessionMessages(sessionId: number): Promise<SessionMessagesResponse> {
    const response = await apiClient.get<SessionMessagesResponse>(
      `/teacher/qa/sessions/${sessionId}/messages`
    );
    return response.data;
  }
}

export const courseQAService = new CourseQAService();
export default courseQAService;
