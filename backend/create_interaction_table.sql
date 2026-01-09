-- 创建师生互动表
CREATE TABLE IF NOT EXISTS teacher_student_interaction (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES course(id) ON DELETE SET NULL,
    interaction_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_interaction_student ON teacher_student_interaction(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_teacher ON teacher_student_interaction(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_course ON teacher_student_interaction(course_id);
CREATE INDEX IF NOT EXISTS idx_interaction_is_read ON teacher_student_interaction(student_id, is_read);

-- 添加注释
COMMENT ON TABLE teacher_student_interaction IS '师生互动记录表';
COMMENT ON COLUMN teacher_student_interaction.interaction_type IS '互动类型：comment(评论)、message(消息)、feedback(反馈)';
COMMENT ON COLUMN teacher_student_interaction.is_read IS '学生是否已读';

