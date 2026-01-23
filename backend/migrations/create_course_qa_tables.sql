-- 创建课程问答沟通相关表
-- 作者: AI Assistant
-- 日期: 2026-01-23

-- 1. 创建课程问答会话表
CREATE TABLE IF NOT EXISTS course_qa_session (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    title VARCHAR(255),  -- 会话标题（自动生成或手动设置）
    status VARCHAR(20) DEFAULT 'active',  -- active, resolved, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_course_session UNIQUE(student_id, course_id)  -- 每个学生每门课程只有一个活跃会话
);

-- 为会话表创建索引
CREATE INDEX IF NOT EXISTS idx_qa_session_student ON course_qa_session(student_id);
CREATE INDEX IF NOT EXISTS idx_qa_session_course ON course_qa_session(course_id);
CREATE INDEX IF NOT EXISTS idx_qa_session_status ON course_qa_session(status);
CREATE INDEX IF NOT EXISTS idx_qa_session_created ON course_qa_session(created_at DESC);

COMMENT ON TABLE course_qa_session IS '课程问答会话表';
COMMENT ON COLUMN course_qa_session.student_id IS '学生ID';
COMMENT ON COLUMN course_qa_session.course_id IS '课程ID';
COMMENT ON COLUMN course_qa_session.title IS '会话标题';
COMMENT ON COLUMN course_qa_session.status IS '会话状态：active（活跃）、resolved（已解决）、closed（已关闭）';

-- 2. 创建课程问答消息表
CREATE TABLE IF NOT EXISTS course_qa_message (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES course_qa_session(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES sys_user(id) ON DELETE CASCADE,  -- 发送者ID（学生或教师，AI消息时为NULL）
    sender_type VARCHAR(20) NOT NULL,  -- 'student', 'ai', 'teacher'
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',  -- 'text', 'system'
    is_sent_to_teacher BOOLEAN DEFAULT FALSE,  -- 是否已发送给教师
    teacher_ids INTEGER[],  -- 接收消息的教师ID数组
    ai_response_id INTEGER REFERENCES course_qa_message(id),  -- 关联的AI回复ID（如果是学生问题）
    parent_message_id INTEGER REFERENCES course_qa_message(id),  -- 父消息ID（用于回复链）
    is_read BOOLEAN DEFAULT FALSE,  -- 是否已读（针对教师）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为消息表创建索引
CREATE INDEX IF NOT EXISTS idx_qa_message_session ON course_qa_message(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_message_sender ON course_qa_message(sender_id);
CREATE INDEX IF NOT EXISTS idx_qa_message_sender_type ON course_qa_message(sender_type);
CREATE INDEX IF NOT EXISTS idx_qa_message_created ON course_qa_message(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_message_parent ON course_qa_message(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_qa_message_ai_response ON course_qa_message(ai_response_id);

COMMENT ON TABLE course_qa_message IS '课程问答消息表';
COMMENT ON COLUMN course_qa_message.session_id IS '所属会话ID';
COMMENT ON COLUMN course_qa_message.sender_id IS '发送者ID（学生或教师，AI消息时可为0）';
COMMENT ON COLUMN course_qa_message.sender_type IS '发送者类型：student（学生）、ai（AI）、teacher（教师）';
COMMENT ON COLUMN course_qa_message.content IS '消息内容';
COMMENT ON COLUMN course_qa_message.message_type IS '消息类型：text（文本）、system（系统消息）';
COMMENT ON COLUMN course_qa_message.is_sent_to_teacher IS '是否已发送给教师';
COMMENT ON COLUMN course_qa_message.teacher_ids IS '接收消息的教师ID数组';
COMMENT ON COLUMN course_qa_message.ai_response_id IS '关联的AI回复ID（如果是学生问题）';
COMMENT ON COLUMN course_qa_message.parent_message_id IS '父消息ID（用于回复链）';
COMMENT ON COLUMN course_qa_message.is_read IS '是否已读（针对教师）';

-- 显示创建结果
SELECT 'course_qa_session表创建成功' AS message
UNION ALL
SELECT 'course_qa_message表创建成功' AS message;
