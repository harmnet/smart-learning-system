import { redirect } from 'next/navigation';

export default function TeacherHomeworkRedirectPage() {
  redirect('/teacher/grading');
}
