-- 学生作业提交功能数据表
-- 创建时间: 2026-01-20

-- 1. 学生作业提交记录表
CREATE TABLE IF NOT EXISTS student_homework_submission (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    homework_id INTEGER NOT NULL REFERENCES course_section_homework(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES course(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES course_chapter(id) ON DELETE CASCADE,
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded')),
    score FLOAT,
    teacher_comment TEXT,
    submitted_at TIMESTAMP,
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    CONSTRAINT idx_student_homework UNIQUE (student_id, homework_id)
);

-- 创建索引
CREATE INDEX idx_student_homework_submission_student ON student_homework_submission(student_id);
CREATE INDEX idx_student_homework_submission_homework ON student_homework_submission(homework_id);
CREATE INDEX idx_student_homework_submission_course ON student_homework_submission(course_id);
CREATE INDEX idx_student_homework_submission_chapter ON student_homework_submission(chapter_id);
CREATE INDEX idx_student_homework_submission_status ON student_homework_submission(status);

-- 添加注释
COMMENT ON TABLE student_homework_submission IS '学生作业提交记录表';
COMMENT ON COLUMN student_homework_submission.student_id IS '学生ID';
COMMENT ON COLUMN student_homework_submission.homework_id IS '作业ID';
COMMENT ON COLUMN student_homework_submission.course_id IS '课程ID';
COMMENT ON COLUMN student_homework_submission.chapter_id IS '章节ID（小节）';
COMMENT ON COLUMN student_homework_submission.content IS '富文本作业内容';
COMMENT ON COLUMN student_homework_submission.status IS '状态：draft（草稿）、submitted（已提交）、graded（已评分）';
COMMENT ON COLUMN student_homework_submission.score IS '教师评分';
COMMENT ON COLUMN student_homework_submission.teacher_comment IS '教师评语';
COMMENT ON COLUMN student_homework_submission.submitted_at IS '提交时间';
COMMENT ON COLUMN student_homework_submission.graded_at IS '评分时间';

-- 2. 学生作业附件表
CREATE TABLE IF NOT EXISTS student_homework_attachment (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES student_homework_submission(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_student_homework_attachment_submission ON student_homework_attachment(submission_id);

-- 添加注释
COMMENT ON TABLE student_homework_attachment IS '学生作业附件表';
COMMENT ON COLUMN student_homework_attachment.submission_id IS '作业提交记录ID';
COMMENT ON COLUMN student_homework_attachment.file_name IS '原始文件名';
COMMENT ON COLUMN student_homework_attachment.file_url IS '文件URL（OSS地址或本地路径）';
COMMENT ON COLUMN student_homework_attachment.file_size IS '文件大小（字节）';
COMMENT ON COLUMN student_homework_attachment.file_type IS '文件类型（扩展名）';
COMMENT ON COLUMN student_homework_attachment.sort_order IS '排序';

-- 3. 学生作业评分历史表
CREATE TABLE IF NOT EXISTS student_homework_grade_history (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES student_homework_submission(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    score FLOAT,
    teacher_comment TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_homework_grade_history_submission ON student_homework_grade_history(submission_id);
CREATE INDEX idx_student_homework_grade_history_teacher ON student_homework_grade_history(teacher_id);
CREATE INDEX idx_student_homework_grade_history_graded_at ON student_homework_grade_history(graded_at DESC);

COMMENT ON TABLE student_homework_grade_history IS '学生作业评分历史表';
COMMENT ON COLUMN student_homework_grade_history.submission_id IS '作业提交记录ID';
COMMENT ON COLUMN student_homework_grade_history.teacher_id IS '评分教师ID';
COMMENT ON COLUMN student_homework_grade_history.score IS '评分';
COMMENT ON COLUMN student_homework_grade_history.teacher_comment IS '评分评语';
COMMENT ON COLUMN student_homework_grade_history.graded_at IS '评分时间';

CREATE TABLE IF NOT EXISTS student_homework_ai_grading_log (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES student_homework_submission(id) ON DELETE CASCADE,
    teacher_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    llm_config_id INTEGER REFERENCES llm_config(id),
    prompt TEXT NOT NULL,
    result TEXT NOT NULL,
    score FLOAT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_homework_ai_grading_log_submission ON student_homework_ai_grading_log(submission_id);
CREATE INDEX idx_student_homework_ai_grading_log_teacher ON student_homework_ai_grading_log(teacher_id);
CREATE INDEX idx_student_homework_ai_grading_log_created_at ON student_homework_ai_grading_log(created_at DESC);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_student_homework_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_student_homework_submission_updated_at
    BEFORE UPDATE ON student_homework_submission
    FOR EACH ROW
    EXECUTE FUNCTION update_student_homework_submission_updated_at();
