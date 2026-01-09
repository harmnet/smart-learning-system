-- 创建章节-考试关联表
-- 用途：将课程章节直接关联到考试，而不是通过试卷中转
-- 业务逻辑：试卷库 → 考试管理（关联试卷） → 课程章节（关联考试） → 学生查看

CREATE TABLE IF NOT EXISTS course_chapter_exam (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES course_chapter(id) ON DELETE CASCADE,
    exam_id INTEGER NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_chapter_exam UNIQUE (chapter_id, exam_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_course_chapter_exam_chapter ON course_chapter_exam(chapter_id);
CREATE INDEX IF NOT EXISTS idx_course_chapter_exam_exam ON course_chapter_exam(exam_id);

-- 添加注释
COMMENT ON TABLE course_chapter_exam IS '课程章节与考试的关联表';
COMMENT ON COLUMN course_chapter_exam.chapter_id IS '课程章节ID（章或小节）';
COMMENT ON COLUMN course_chapter_exam.exam_id IS '考试ID';
COMMENT ON COLUMN course_chapter_exam.created_at IS '创建时间';
