"""
课程问答服务层
处理课程问答相关的业务逻辑
"""
import logging
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_
from sqlalchemy.orm import selectinload, joinedload

from app.models.course_qa import CourseQASession, CourseQAMessage
from app.models.base import Course, User, StudentProfile, ClassCourseRelation, TeacherProfile
from app.models.llm_config import LLMConfig
from app.api.v1.endpoints.ai_creation import call_openai_compatible, call_aliyun_qwen
from app.utils.llm_call_logger import log_llm_call
import httpx

logger = logging.getLogger(__name__)


async def get_course_teachers(
    db: AsyncSession,
    course_id: int,
    student_id: int
) -> List[Dict[str, Any]]:
    """
    获取课程相关教师列表
    包括：主讲教师 + 学生所在班级的授课教师
    
    Args:
        db: 数据库会话
        course_id: 课程ID
        student_id: 学生ID
    
    Returns:
        教师列表，每个教师包含 id, name, username
    """
    teachers = []
    teacher_ids = set()
    
    # 1. 获取课程的主讲教师
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalars().first()
    
    if course and course.main_teacher_id:
        main_teacher_result = await db.execute(
            select(User).where(User.id == course.main_teacher_id)
        )
        main_teacher = main_teacher_result.scalars().first()
        if main_teacher and main_teacher.id not in teacher_ids:
            teacher_ids.add(main_teacher.id)
            teachers.append({
                "id": main_teacher.id,
                "name": main_teacher.full_name or main_teacher.username,
                "username": main_teacher.username
            })
    
    # 2. 获取学生所在班级的授课教师
    student_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == student_id)
    )
    student_profile = student_profile_result.scalars().first()
    
    if student_profile and student_profile.class_id:
        # 查找该班级该课程的授课教师
        class_course_result = await db.execute(
            select(ClassCourseRelation)
            .where(
                and_(
                    ClassCourseRelation.class_id == student_profile.class_id,
                    ClassCourseRelation.course_id == course_id
                )
            )
        )
        class_courses = class_course_result.scalars().all()
        
        for relation in class_courses:
            if relation.teacher_id:
                # 通过teacher_id查找TeacherProfile
                teacher_profile_result = await db.execute(
                    select(TeacherProfile).where(TeacherProfile.id == relation.teacher_id)
                )
                teacher_profile = teacher_profile_result.scalars().first()
                
                if teacher_profile and teacher_profile.user_id:
                    teacher_user_result = await db.execute(
                        select(User).where(User.id == teacher_profile.user_id)
                    )
                    teacher_user = teacher_user_result.scalars().first()
                    if teacher_user and teacher_user.id not in teacher_ids:
                        teacher_ids.add(teacher_user.id)
                        teachers.append({
                            "id": teacher_user.id,
                            "name": teacher_user.full_name or teacher_user.username,
                            "username": teacher_user.username
                        })
    
    return teachers


async def get_or_create_session(
    db: AsyncSession,
    student_id: int,
    course_id: int
) -> CourseQASession:
    """
    获取或创建课程问答会话
    
    Args:
        db: 数据库会话
        student_id: 学生ID
        course_id: 课程ID
    
    Returns:
        会话对象
    """
    # 查找现有会话
    result = await db.execute(
        select(CourseQASession).where(
            and_(
                CourseQASession.student_id == student_id,
                CourseQASession.course_id == course_id,
                CourseQASession.status == 'active'
            )
        )
    )
    session = result.scalars().first()
    
    if session:
        return session
    
    # 创建新会话
    # 获取课程信息用于生成标题
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalars().first()
    
    title = f"关于《{course.title if course else '课程'}》的问答" if course else "课程问答"
    
    session = CourseQASession(
        student_id=student_id,
        course_id=course_id,
        title=title,
        status='active'
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    return session


async def generate_ai_response(
    db: AsyncSession,
    course_id: int,
    student_question: str,
    conversation_history: List[Dict[str, str]] = None
) -> str:
    """
    生成AI回答
    
    Args:
        db: 数据库会话
        course_id: 课程ID
        student_question: 学生问题
        conversation_history: 对话历史（可选）
    
    Returns:
        AI回答内容
    """
    # 获取课程信息
    course_result = await db.execute(
        select(Course).where(Course.id == course_id)
    )
    course = course_result.scalars().first()
    
    if not course:
        raise ValueError("课程不存在")
    
    # 构建提示词
    prompt_parts = [
        "你是一位专业的在线学习助手，负责回答学生关于课程的问题。",
        f"\n课程信息：",
        f"- 课程名称：{course.title}",
    ]
    
    if course.introduction:
        prompt_parts.append(f"- 课程简介：{course.introduction}")
    
    if course.objectives:
        prompt_parts.append(f"- 授课目标：{course.objectives}")
    
    if course.description:
        prompt_parts.append(f"- 课程描述：{course.description}")
    
    prompt_parts.append("\n请基于以上课程信息，回答学生的问题。回答要准确、有帮助，并且与课程内容相关。")
    
    # 如果有对话历史，添加到提示词中
    if conversation_history:
        prompt_parts.append("\n对话历史：")
        for msg in conversation_history[-5:]:  # 只取最近5条
            role_name = "学生" if msg["role"] == "student" else "AI助手"
            prompt_parts.append(f"{role_name}：{msg['content']}")
    
    prompt_parts.append(f"\n学生问题：{student_question}")
    prompt_parts.append("\n请回答：")
    
    prompt = "\n".join(prompt_parts)
    
    # 获取激活的LLM配置
    llm_result = await db.execute(
        select(LLMConfig).where(LLMConfig.is_active == True)
    )
    llm_config = llm_result.scalars().first()
    
    if not llm_config:
        raise ValueError("系统未配置大模型服务，请联系管理员")
    
    # 调用LLM API
    try:
        # 使用log_llm_call记录调用日志（如果表不存在会失败，但不影响主流程）
        # 注意：user_role必须是'teacher', 'student', 'admin'之一
        # 对于课程问答，使用学生的角色来记录AI调用
        try:
            # 获取学生用户信息（通过course_id查找会话中的学生）
            session_result = await db.execute(
                select(CourseQASession).where(CourseQASession.course_id == course_id).limit(1)
            )
            session = session_result.scalars().first()
            if session:
                student_result = await db.execute(select(User).where(User.id == session.student_id))
                student = student_result.scalars().first()
                if student:
                    log_user_id = student.id
                    log_user_role = student.role  # 使用学生的角色
                else:
                    # 如果找不到学生，使用默认值
                    log_user_id = 1
                    log_user_role = "admin"
            else:
                log_user_id = 1
                log_user_role = "admin"
        except:
            log_user_id = 1
            log_user_role = "admin"
        
        async with log_llm_call(
            db=db,
            function_type="course_qa_ai_response",
            user_id=log_user_id,  # 使用学生的用户ID
            user_role=log_user_role,  # 使用学生的角色（student）
            llm_config_id=llm_config.id,
            prompt=prompt,
            related_id=course_id,
            related_type="course"
        ) as log_context:
            provider_key = llm_config.provider_key
            
            if provider_key == "aliyun_qwen":
                response_text = await call_aliyun_qwen(llm_config, prompt)
            elif provider_key in ["deepseek", "kimi", "volcengine_doubao", "siliconflow"]:
                response_text = await call_openai_compatible(llm_config, prompt)
            elif provider_key == "wenxin":
                # 调用文心一言API
                token_url = "https://aip.baidubce.com/oauth/2.0/token"
                token_params = {
                    "grant_type": "client_credentials",
                    "client_id": llm_config.api_key,
                    "client_secret": llm_config.api_secret
                }
                async with httpx.AsyncClient(timeout=60.0) as client:
                    token_response = await client.post(token_url, params=token_params)
                    token_response.raise_for_status()
                    access_token = token_response.json()["access_token"]
                    
                    endpoint = llm_config.endpoint_url.rstrip('/') if llm_config.endpoint_url else ""
                    chat_url = f"{endpoint}/wenxinworkshop/chat/completions"
                    
                    data = {
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_output_tokens": 2000
                    }
                    
                    chat_response = await client.post(
                        chat_url,
                        json=data,
                        headers={"Content-Type": "application/json"},
                        params={"access_token": access_token}
                    )
                    chat_response.raise_for_status()
                    result = chat_response.json()
                    if "result" in result:
                        response_text = result["result"]
                    else:
                        raise Exception("文心一言响应格式错误")
            else:
                error_msg = f"不支持的LLM提供商: {provider_key}"
                log_context.set_result(None, status='failed', error_message=error_msg)
                raise ValueError(error_msg)
            
            log_context.set_result(response_text, status='success')
            return response_text
    
    except Exception as e:
        logger.error(f"生成AI回答失败: {e}", exc_info=True)
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"AI回答生成详细错误: {error_traceback}")
        # 不抛出异常，让调用者决定如何处理
        raise Exception(f"AI回答生成失败: {str(e)}")


async def send_student_message(
    db: AsyncSession,
    session_id: int,
    student_id: int,
    content: str
) -> Tuple[CourseQAMessage, Optional[CourseQAMessage]]:
    """
    发送学生消息并自动生成AI回复
    
    Args:
        db: 数据库会话
        session_id: 会话ID
        student_id: 学生ID
        content: 消息内容
    
    Returns:
        (学生消息对象, AI回复消息对象)
    """
    # 创建学生消息
    student_message = CourseQAMessage(
        session_id=session_id,
        sender_id=student_id,
        sender_type='student',
        content=content,
        message_type='text'
    )
    db.add(student_message)
    await db.flush()  # 获取ID
    
    # 获取会话信息
    session_result = await db.execute(
        select(CourseQASession).where(CourseQASession.id == session_id)
    )
    session = session_result.scalars().first()
    
    if not session:
        raise ValueError("会话不存在")
    
    # 获取对话历史
    history_result = await db.execute(
        select(CourseQAMessage)
        .where(CourseQAMessage.session_id == session_id)
        .order_by(CourseQAMessage.created_at)
    )
    history_messages = history_result.scalars().all()
    
    conversation_history = []
    for msg in history_messages:
        if msg.sender_type == 'student':
            conversation_history.append({
                "role": "student",
                "content": msg.content
            })
        elif msg.sender_type == 'ai':
            conversation_history.append({
                "role": "ai",
                "content": msg.content
            })
    
    # 先提交学生消息以获取ID
    await db.commit()
    await db.refresh(student_message)
    
    # 生成AI回复
    ai_message = None
    try:
        ai_response_content = await generate_ai_response(
            db=db,
            course_id=session.course_id,
            student_question=content,
            conversation_history=conversation_history
        )
        
        # 创建AI回复消息
        ai_message = CourseQAMessage(
            session_id=session_id,
            sender_id=None,  # AI消息使用NULL作为sender_id
            sender_type='ai',
            content=ai_response_content,
            message_type='text'
        )
        db.add(ai_message)
        await db.commit()
        await db.refresh(ai_message)
        
        # 更新学生消息，关联到AI回复
        student_message.ai_response_id = ai_message.id
        await db.commit()
        await db.refresh(student_message)
        
    except Exception as e:
        logger.error(f"生成AI回复失败: {e}")
        # 即使AI回复失败，也保存学生消息
        ai_message = None
    
    return student_message, ai_message


async def send_to_teachers(
    db: AsyncSession,
    message_id: int,
    teacher_ids: List[int]
) -> CourseQAMessage:
    """
    将消息发送给教师
    
    Args:
        db: 数据库会话
        message_id: 消息ID
        teacher_ids: 教师ID列表
    
    Returns:
        更新后的消息对象
    """
    result = await db.execute(
        select(CourseQAMessage).where(CourseQAMessage.id == message_id)
    )
    message = result.scalars().first()
    
    if not message:
        raise ValueError("消息不存在")
    
    message.is_sent_to_teacher = True
    message.teacher_ids = teacher_ids
    
    await db.commit()
    await db.refresh(message)
    
    return message


async def teacher_reply(
    db: AsyncSession,
    message_id: int,
    teacher_id: int,
    content: str
) -> CourseQAMessage:
    """
    教师回复消息
    
    Args:
        db: 数据库会话
        message_id: 原消息ID（学生消息或AI消息）
        teacher_id: 教师ID
        content: 回复内容
    
    Returns:
        教师回复消息对象
    """
    # 获取原消息
    original_result = await db.execute(
        select(CourseQAMessage).where(CourseQAMessage.id == message_id)
    )
    original_message = original_result.scalars().first()
    
    if not original_message:
        raise ValueError("原消息不存在")
    
    # 创建教师回复消息
    teacher_message = CourseQAMessage(
        session_id=original_message.session_id,
        sender_id=teacher_id,
        sender_type='teacher',
        content=content,
        message_type='text',
        parent_message_id=message_id
    )
    
    db.add(teacher_message)
    await db.commit()
    await db.refresh(teacher_message)
    
    return teacher_message


async def get_teacher_qa_sessions_grouped(
    db: AsyncSession,
    teacher_id: int
) -> List[Dict[str, Any]]:
    """
    获取教师的所有问答会话，按课程分组
    
    Args:
        db: 数据库会话
        teacher_id: 教师ID
    
    Returns:
        按课程分组的会话列表，格式：
        [
            {
                "course_id": int,
                "course_name": str,
                "students": [
                    {
                        "student_id": int,
                        "student_no": str,
                        "student_name": str,
                        "session_id": int,
                        "latest_message_content": str,
                        "latest_message_time": str,
                        "unread_count": int,
                        "total_messages": int
                    }
                ]
            }
        ]
    """
    from sqlalchemy import func, desc
    from datetime import datetime
    
    # 查询所有已发送给该教师的消息
    # 对于 PostgreSQL ARRAY，使用 @> 操作符检查数组是否包含值
    from sqlalchemy.dialects.postgresql import ARRAY
    messages_result = await db.execute(
        select(CourseQAMessage)
        .join(CourseQASession)
        .where(
            CourseQAMessage.is_sent_to_teacher == True,
            CourseQAMessage.teacher_ids.contains([teacher_id])
        )
        .order_by(desc(CourseQAMessage.created_at))
    )
    messages = messages_result.scalars().all()
    
    if not messages:
        return []
    
    # 获取所有相关的session_id
    session_ids = list(set([msg.session_id for msg in messages]))
    
    # 批量加载会话信息
    sessions_result = await db.execute(
        select(CourseQASession)
        .where(CourseQASession.id.in_(session_ids))
        .options(selectinload(CourseQASession.student), selectinload(CourseQASession.course))
    )
    sessions = sessions_result.scalars().all()
    sessions_map = {s.id: s for s in sessions}
    
    # 获取所有学生ID和课程ID
    student_ids = list(set([s.student_id for s in sessions]))
    course_ids = list(set([s.course_id for s in sessions]))
    
    # 批量加载学生信息
    students_result = await db.execute(
        select(User).where(User.id.in_(student_ids))
    )
    students = students_result.scalars().all()
    students_map = {s.id: s for s in students}
    
    # 批量加载学生档案（获取学号）
    profiles_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id.in_(student_ids))
    )
    profiles = profiles_result.scalars().all()
    profiles_map = {p.user_id: p for p in profiles}
    
    # 批量加载课程信息
    courses_result = await db.execute(
        select(Course).where(Course.id.in_(course_ids))
    )
    courses = courses_result.scalars().all()
    courses_map = {c.id: c for c in courses}
    
    # 按课程分组，统计每个学生的消息
    course_students_map = {}  # {course_id: {student_id: {session_id, messages, latest_time}}}
    
    for msg in messages:
        session = sessions_map.get(msg.session_id)
        if not session:
            continue
        
        course_id = session.course_id
        student_id = session.student_id
        
        if course_id not in course_students_map:
            course_students_map[course_id] = {}
        
        if student_id not in course_students_map[course_id]:
            course_students_map[course_id][student_id] = {
                'session_id': session.id,
                'messages': [],
                'unread_messages': []
            }
        
        student_data = course_students_map[course_id][student_id]
        student_data['messages'].append(msg)
        
        # 统计未读消息
        if not msg.is_read:
            student_data['unread_messages'].append(msg)
    
    # 构建返回数据
    result = []
    for course_id, students_data in course_students_map.items():
        course = courses_map.get(course_id)
        if not course:
            continue
        
        students_list = []
        for student_id, data in students_data.items():
            student = students_map.get(student_id)
            if not student:
                continue
            
            profile = profiles_map.get(student_id)
            student_no = profile.student_no if profile else ""
            student_name = student.full_name or student.username
            
            # 获取最新消息
            messages_list = data['messages']
            if not messages_list:
                continue
            
            latest_message = max(messages_list, key=lambda m: m.created_at if m.created_at else datetime.min)
            latest_content = latest_message.content[:100] if latest_message.content else ""
            latest_time = latest_message.created_at.isoformat() if latest_message.created_at else ""
            
            # 统计未读消息数
            unread_count = len(data['unread_messages'])
            
            students_list.append({
                "student_id": student_id,
                "student_no": student_no,
                "student_name": student_name,
                "session_id": data['session_id'],
                "latest_message_content": latest_content,
                "latest_message_time": latest_time,
                "unread_count": unread_count,
                "total_messages": len(messages_list)
            })
        
        # 按最新消息时间排序学生列表
        students_list.sort(key=lambda x: x['latest_message_time'], reverse=True)
        
        if students_list:
            result.append({
                "course_id": course_id,
                "course_name": course.title,
                "students": students_list
            })
    
    # 按课程名称排序
    result.sort(key=lambda x: x['course_name'])
    
    return result
