"""
课程问答API端点
支持学生与AI对话，并可选择将消息发送给教师
"""
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import logging

from app.db.session import get_db
from app.models.base import User
from app.models.course_qa import CourseQASession, CourseQAMessage
from app.api.v1.endpoints.students import get_current_user
from app.services.course_qa_service import (
    get_or_create_session,
    get_course_teachers,
    send_student_message,
    send_to_teachers,
    teacher_reply,
    get_teacher_qa_sessions_grouped
)

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== 请求/响应模型 ====================

class SessionResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    title: str
    status: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    session_id: int
    sender_id: Optional[int] = None  # AI消息的sender_id为None
    sender_type: str
    content: str
    message_type: str
    is_sent_to_teacher: bool
    teacher_ids: Optional[List[int]] = None
    ai_response_id: Optional[int] = None
    parent_message_id: Optional[int] = None
    is_read: bool
    created_at: str
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


class SendMessageRequest(BaseModel):
    content: str


class SendToTeacherRequest(BaseModel):
    teacher_ids: List[int]


class TeacherReplyRequest(BaseModel):
    content: str


class TeachersResponse(BaseModel):
    teachers: List[dict]


class TeacherQASessionResponse(BaseModel):
    student_id: int
    student_no: str
    student_name: str
    session_id: int
    latest_message_content: str
    latest_message_time: str
    unread_count: int
    total_messages: int

    class Config:
        from_attributes = True


class TeacherQACourseGroupResponse(BaseModel):
    course_id: int
    course_name: str
    students: List[TeacherQASessionResponse]

    class Config:
        from_attributes = True


class TeacherQASessionsListResponse(BaseModel):
    courses: List[TeacherQACourseGroupResponse]

    class Config:
        from_attributes = True


# ==================== 学生端API ====================

@router.get("/courses/{course_id}/qa/session", response_model=SessionResponse)
async def get_or_create_qa_session(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取或创建课程问答会话
    """
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="只有学生可以访问此接口")
    
    try:
        session = await get_or_create_session(
            db=db,
            student_id=current_user.id,
            course_id=course_id
        )
        
        return SessionResponse(
            id=session.id,
            student_id=session.student_id,
            course_id=session.course_id,
            title=session.title or "",
            status=session.status,
            created_at=session.created_at.isoformat() if session.created_at else "",
            updated_at=session.updated_at.isoformat() if session.updated_at else ""
        )
    except Exception as e:
        logger.error(f"获取或创建会话失败: {e}", exc_info=True)
        import traceback
        error_detail = str(e)
        error_traceback = traceback.format_exc()
        logger.error(f"详细错误信息: {error_traceback}")
        # 如果是数据库表不存在的错误，提供更友好的提示
        if "does not exist" in error_detail or "relation" in error_detail.lower() or "UndefinedTableError" in error_detail or "course_qa_session" in error_detail:
            error_detail = "数据库表尚未创建。请执行迁移脚本: cd /Users/duanxiaofei/Desktop/数珩智学 && ./backend/run_migration.sh 或者执行: psql -U postgres -d smartlearning -f backend/migrations/create_course_qa_tables.sql"
        raise HTTPException(status_code=500, detail=f"获取或创建会话失败: {error_detail}")


@router.get("/courses/{course_id}/qa/messages", response_model=List[MessageResponse])
async def get_qa_messages(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取课程问答消息列表
    """
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="只有学生可以访问此接口")
    
    try:
        # 获取会话
        session = await get_or_create_session(
            db=db,
            student_id=current_user.id,
            course_id=course_id
        )
        
        # 获取消息列表
        result = await db.execute(
            select(CourseQAMessage)
            .where(CourseQAMessage.session_id == session.id)
            .order_by(CourseQAMessage.created_at)
        )
        messages = result.scalars().all()
        
        # 获取发送者信息
        sender_ids = set()
        for msg in messages:
            if msg.sender_id:  # 排除AI消息（sender_id为NULL）
                sender_ids.add(msg.sender_id)
        
        sender_map = {}
        if sender_ids:
            # 将set转换为list，确保SQLAlchemy兼容性
            users_result = await db.execute(
                select(User).where(User.id.in_(list(sender_ids)))
            )
            users = users_result.scalars().all()
            sender_map = {user.id: user.full_name or user.username for user in users}
        
        # 构建响应
        message_responses = []
        for msg in messages:
            sender_name = None
            if msg.sender_type == 'ai':
                sender_name = "AI助手"
            elif msg.sender_id in sender_map:
                sender_name = sender_map[msg.sender_id]
            
            message_responses.append(MessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                sender_id=msg.sender_id,
                sender_type=msg.sender_type,
                content=msg.content,
                message_type=msg.message_type,
                is_sent_to_teacher=msg.is_sent_to_teacher,
                teacher_ids=msg.teacher_ids,
                ai_response_id=msg.ai_response_id,
                parent_message_id=msg.parent_message_id,
                is_read=msg.is_read,
                created_at=msg.created_at.isoformat() if msg.created_at else "",
                sender_name=sender_name
            ))
        
        return message_responses
    
    except Exception as e:
        logger.error(f"获取消息列表失败: {e}", exc_info=True)
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"详细错误信息: {error_traceback}")
        # 如果是数据库表不存在的错误，提供更友好的提示
        error_detail = str(e)
        if "does not exist" in error_detail or "relation" in error_detail.lower() or "UndefinedTableError" in error_detail:
            error_detail = "数据库表尚未创建。请执行迁移脚本: cd /Users/duanxiaofei/Desktop/数珩智学 && ./backend/run_migration.sh"
        raise HTTPException(status_code=500, detail=f"获取消息列表失败: {error_detail}")


@router.post("/courses/{course_id}/qa/messages", response_model=List[MessageResponse])
async def send_message(
    course_id: int,
    request: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    发送学生消息（自动触发AI回复）
    """
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="只有学生可以访问此接口")
    
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="消息内容不能为空")
    
    try:
        # 获取或创建会话
        session = await get_or_create_session(
            db=db,
            student_id=current_user.id,
            course_id=course_id
        )
        
        # 发送消息并生成AI回复
        student_msg, ai_msg = await send_student_message(
            db=db,
            session_id=session.id,
            student_id=current_user.id,
            content=request.content.strip()
        )
        
        # 返回学生消息和AI回复
        responses = []
        
        # 学生消息
        responses.append(MessageResponse(
            id=student_msg.id,
            session_id=student_msg.session_id,
            sender_id=student_msg.sender_id,
            sender_type=student_msg.sender_type,
            content=student_msg.content,
            message_type=student_msg.message_type,
            is_sent_to_teacher=student_msg.is_sent_to_teacher,
            teacher_ids=student_msg.teacher_ids,
            ai_response_id=student_msg.ai_response_id,
            parent_message_id=student_msg.parent_message_id,
            is_read=student_msg.is_read,
            created_at=student_msg.created_at.isoformat() if student_msg.created_at else "",
            sender_name=current_user.full_name or current_user.username
        ))
        
        # AI回复（如果生成成功）
        if ai_msg:
            responses.append(MessageResponse(
                id=ai_msg.id,
                session_id=ai_msg.session_id,
                sender_id=ai_msg.sender_id,
                sender_type=ai_msg.sender_type,
                content=ai_msg.content,
                message_type=ai_msg.message_type,
                is_sent_to_teacher=ai_msg.is_sent_to_teacher,
                teacher_ids=ai_msg.teacher_ids,
                ai_response_id=ai_msg.ai_response_id,
                parent_message_id=ai_msg.parent_message_id,
                is_read=ai_msg.is_read,
                created_at=ai_msg.created_at.isoformat() if ai_msg.created_at else "",
                sender_name="AI助手"
            ))
        else:
            # 如果AI回复失败，记录警告但不影响学生消息的发送
            logger.warning("AI回复生成失败，但学生消息已保存")
        
        return responses
    
    except Exception as e:
        logger.error(f"发送消息失败: {e}", exc_info=True)
        import traceback
        error_detail = str(e)
        error_traceback = traceback.format_exc()
        logger.error(f"详细错误信息: {error_traceback}")
        # 如果是数据库表不存在的错误，提供更友好的提示
        if "does not exist" in error_detail or "relation" in error_detail.lower() or "UndefinedTableError" in error_detail:
            error_detail = f"数据库表可能不存在或LLM配置有问题。错误详情: {error_detail}"
        raise HTTPException(status_code=500, detail=f"发送消息失败: {error_detail}")


@router.post("/courses/{course_id}/qa/messages/{message_id}/send-to-teacher", response_model=MessageResponse)
async def send_message_to_teacher(
    course_id: int,
    message_id: int,
    request: SendToTeacherRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    将消息发送给教师
    """
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="只有学生可以访问此接口")
    
    if not request.teacher_ids:
        raise HTTPException(status_code=400, detail="请选择至少一位教师")
    
    try:
        # 验证消息属于当前学生的会话
        session_result = await db.execute(
            select(CourseQASession).where(
                CourseQASession.course_id == course_id,
                CourseQASession.student_id == current_user.id
            )
        )
        session = session_result.scalars().first()
        
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")
        
        message_result = await db.execute(
            select(CourseQAMessage).where(
                CourseQAMessage.id == message_id,
                CourseQAMessage.session_id == session.id
            )
        )
        message = message_result.scalars().first()
        
        if not message:
            raise HTTPException(status_code=404, detail="消息不存在")
        
        # 发送给教师
        updated_message = await send_to_teachers(
            db=db,
            message_id=message_id,
            teacher_ids=request.teacher_ids
        )
        
        return MessageResponse(
            id=updated_message.id,
            session_id=updated_message.session_id,
            sender_id=updated_message.sender_id,
            sender_type=updated_message.sender_type,
            content=updated_message.content,
            message_type=updated_message.message_type,
            is_sent_to_teacher=updated_message.is_sent_to_teacher,
            teacher_ids=updated_message.teacher_ids,
            ai_response_id=updated_message.ai_response_id,
            parent_message_id=updated_message.parent_message_id,
            is_read=updated_message.is_read,
            created_at=updated_message.created_at.isoformat() if updated_message.created_at else "",
            sender_name=current_user.full_name or current_user.username
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"发送消息给教师失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}/qa/teachers", response_model=TeachersResponse)
async def get_course_qa_teachers(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取课程相关教师列表
    """
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="只有学生可以访问此接口")
    
    try:
        teachers = await get_course_teachers(
            db=db,
            course_id=course_id,
            student_id=current_user.id
        )
        
        return TeachersResponse(teachers=teachers)
    
    except Exception as e:
        logger.error(f"获取教师列表失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 教师端API ====================

@router.get("/qa/sessions", response_model=TeacherQASessionsListResponse)
async def get_teacher_qa_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取教师的所有问答会话，按课程分组
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="只有教师可以访问此接口")
    
    try:
        sessions_grouped = await get_teacher_qa_sessions_grouped(
            db=db,
            teacher_id=current_user.id
        )
        
        # 转换为响应模型
        courses = []
        for course_data in sessions_grouped:
            students = [
                TeacherQASessionResponse(
                    student_id=s['student_id'],
                    student_no=s['student_no'],
                    student_name=s['student_name'],
                    session_id=s['session_id'],
                    latest_message_content=s['latest_message_content'],
                    latest_message_time=s['latest_message_time'],
                    unread_count=s['unread_count'],
                    total_messages=s['total_messages']
                )
                for s in course_data['students']
            ]
            courses.append(TeacherQACourseGroupResponse(
                course_id=course_data['course_id'],
                course_name=course_data['course_name'],
                students=students
            ))
        
        return TeacherQASessionsListResponse(courses=courses)
    
    except Exception as e:
        logger.error(f"获取教师问答会话列表失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class SessionMessagesResponse(BaseModel):
    session_id: int
    course_id: int
    course_name: str
    student_id: int
    student_name: str
    student_no: str
    messages: List[MessageResponse]

    class Config:
        from_attributes = True


@router.get("/qa/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
async def get_teacher_session_messages(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    获取指定会话的所有消息（用于查看对话详情）
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="只有教师可以访问此接口")
    
    try:
        # 验证会话是否存在且消息已发送给该教师
        session_result = await db.execute(
            select(CourseQASession)
            .options(selectinload(CourseQASession.course), selectinload(CourseQASession.student))
            .where(CourseQASession.id == session_id)
        )
        session = session_result.scalars().first()
        
        if not session:
            raise HTTPException(status_code=404, detail="会话不存在")
        
        # 检查是否有消息发送给该教师
        messages_result = await db.execute(
            select(CourseQAMessage)
            .where(
                CourseQAMessage.session_id == session_id,
                CourseQAMessage.is_sent_to_teacher == True,
                CourseQAMessage.teacher_ids.contains([current_user.id])
            )
        )
        teacher_messages = messages_result.scalars().all()
        
        if not teacher_messages:
            raise HTTPException(status_code=403, detail="无权访问此会话")
        
        # 获取该会话的所有消息（包括学生消息、AI消息和教师消息）
        all_messages_result = await db.execute(
            select(CourseQAMessage)
            .where(CourseQAMessage.session_id == session_id)
            .order_by(CourseQAMessage.created_at)
        )
        messages = all_messages_result.scalars().all()
        
        # 获取发送者信息
        sender_ids = set()
        for msg in messages:
            if msg.sender_id:
                sender_ids.add(msg.sender_id)
        
        sender_map = {}
        if sender_ids:
            users_result = await db.execute(
                select(User).where(User.id.in_(list(sender_ids)))
            )
            users = users_result.scalars().all()
            sender_map = {user.id: user.full_name or user.username for user in users}
        
        # 获取学生学号
        from app.models.base import StudentProfile
        student_profile_result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == session.student_id)
        )
        student_profile = student_profile_result.scalars().first()
        student_no = student_profile.student_no if student_profile else ""
        
        # 构建响应
        message_responses = []
        for msg in messages:
            sender_name = None
            if msg.sender_type == 'ai':
                sender_name = "AI助手"
            elif msg.sender_id in sender_map:
                sender_name = sender_map[msg.sender_id]
            
            message_responses.append(MessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                sender_id=msg.sender_id,
                sender_type=msg.sender_type,
                content=msg.content,
                message_type=msg.message_type,
                is_sent_to_teacher=msg.is_sent_to_teacher,
                teacher_ids=msg.teacher_ids,
                ai_response_id=msg.ai_response_id,
                parent_message_id=msg.parent_message_id,
                is_read=msg.is_read,
                created_at=msg.created_at.isoformat() if msg.created_at else "",
                sender_name=sender_name
            ))
        
        # 获取课程和学生信息
        course_name = session.course.title if session.course else ""
        student_name = session.student.full_name or session.student.username if session.student else ""
        
        return SessionMessagesResponse(
            session_id=session.id,
            course_id=session.course_id,
            course_name=course_name,
            student_id=session.student_id,
            student_name=student_name,
            student_no=student_no,
            messages=message_responses
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取会话消息失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/courses/{course_id}/qa/messages", response_model=List[MessageResponse])
async def get_teacher_qa_messages(
    course_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    教师获取课程的所有问答消息（已发送给该教师的）
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="只有教师可以访问此接口")
    
    try:
        # 查找所有包含该教师ID的消息
        result = await db.execute(
            select(CourseQAMessage)
            .join(CourseQASession)
            .where(
                CourseQASession.course_id == course_id,
                CourseQAMessage.is_sent_to_teacher == True,
                CourseQAMessage.teacher_ids.contains([current_user.id])
            )
            .order_by(desc(CourseQAMessage.created_at))
        )
        messages = result.scalars().all()
        
        # 获取发送者信息
        sender_ids = set()
        for msg in messages:
            if msg.sender_id:  # 排除AI消息（sender_id为NULL）
                sender_ids.add(msg.sender_id)
        
        sender_map = {}
        if sender_ids:
            # 将set转换为list，确保SQLAlchemy兼容性
            users_result = await db.execute(
                select(User).where(User.id.in_(list(sender_ids)))
            )
            users = users_result.scalars().all()
            sender_map = {user.id: user.full_name or user.username for user in users}
        
        # 构建响应
        message_responses = []
        for msg in messages:
            sender_name = None
            if msg.sender_type == 'ai':
                sender_name = "AI助手"
            elif msg.sender_id in sender_map:
                sender_name = sender_map[msg.sender_id]
            
            message_responses.append(MessageResponse(
                id=msg.id,
                session_id=msg.session_id,
                sender_id=msg.sender_id,
                sender_type=msg.sender_type,
                content=msg.content,
                message_type=msg.message_type,
                is_sent_to_teacher=msg.is_sent_to_teacher,
                teacher_ids=msg.teacher_ids,
                ai_response_id=msg.ai_response_id,
                parent_message_id=msg.parent_message_id,
                is_read=msg.is_read,
                created_at=msg.created_at.isoformat() if msg.created_at else "",
                sender_name=sender_name
            ))
        
        return message_responses
    
    except Exception as e:
        logger.error(f"获取教师消息列表失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/courses/{course_id}/qa/messages/{message_id}/reply", response_model=MessageResponse)
async def teacher_reply_message(
    course_id: int,
    message_id: int,
    request: TeacherReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    教师回复消息
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="只有教师可以访问此接口")
    
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="回复内容不能为空")
    
    try:
        # 验证消息是否发送给了该教师
        message_result = await db.execute(
            select(CourseQAMessage)
            .join(CourseQASession)
            .where(
                CourseQAMessage.id == message_id,
                CourseQASession.course_id == course_id,
                CourseQAMessage.is_sent_to_teacher == True,
                CourseQAMessage.teacher_ids.contains([current_user.id])
            )
        )
        original_message = message_result.scalars().first()
        
        if not original_message:
            raise HTTPException(status_code=404, detail="消息不存在或无权访问")
        
        # 发送回复
        reply_message = await teacher_reply(
            db=db,
            message_id=message_id,
            teacher_id=current_user.id,
            content=request.content.strip()
        )
        
        return MessageResponse(
            id=reply_message.id,
            session_id=reply_message.session_id,
            sender_id=reply_message.sender_id,
            sender_type=reply_message.sender_type,
            content=reply_message.content,
            message_type=reply_message.message_type,
            is_sent_to_teacher=reply_message.is_sent_to_teacher,
            teacher_ids=reply_message.teacher_ids,
            ai_response_id=reply_message.ai_response_id,
            parent_message_id=reply_message.parent_message_id,
            is_read=reply_message.is_read,
            created_at=reply_message.created_at.isoformat() if reply_message.created_at else "",
            sender_name=current_user.full_name or current_user.username
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"教师回复失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/courses/{course_id}/qa/messages/{message_id}/read", response_model=MessageResponse)
async def mark_message_as_read(
    course_id: int,
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    标记消息为已读
    """
    if current_user.role != 'teacher':
        raise HTTPException(status_code=403, detail="只有教师可以访问此接口")
    
    try:
        # 验证消息是否发送给了该教师
        message_result = await db.execute(
            select(CourseQAMessage)
            .join(CourseQASession)
            .where(
                CourseQAMessage.id == message_id,
                CourseQASession.course_id == course_id,
                CourseQAMessage.is_sent_to_teacher == True,
                CourseQAMessage.teacher_ids.contains([current_user.id])
            )
        )
        message = message_result.scalars().first()
        
        if not message:
            raise HTTPException(status_code=404, detail="消息不存在或无权访问")
        
        message.is_read = True
        await db.commit()
        await db.refresh(message)
        
        return MessageResponse(
            id=message.id,
            session_id=message.session_id,
            sender_id=message.sender_id,
            sender_type=message.sender_type,
            content=message.content,
            message_type=message.message_type,
            is_sent_to_teacher=message.is_sent_to_teacher,
            teacher_ids=message.teacher_ids,
            ai_response_id=message.ai_response_id,
            parent_message_id=message.parent_message_id,
            is_read=message.is_read,
            created_at=message.created_at.isoformat() if message.created_at else "",
            sender_name=None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"标记消息已读失败: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
