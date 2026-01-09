-- 创建学习偏好测评相关表
-- 作者: AI Assistant
-- 日期: 2026-01-09

-- 1. 创建学习偏好测评记录表 (先创建，因为profile表依赖它)
CREATE TABLE IF NOT EXISTS student_learning_assessment (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    open_response TEXT,
    ai_evaluation TEXT NOT NULL,
    llm_config_id INTEGER REFERENCES llm_config(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 为测评记录表创建索引
CREATE INDEX IF NOT EXISTS idx_assessment_student ON student_learning_assessment(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_created ON student_learning_assessment(created_at DESC);

COMMENT ON TABLE student_learning_assessment IS '学生学习偏好测评记录表';
COMMENT ON COLUMN student_learning_assessment.answers IS 'JSON格式存储所有问题的答案';
COMMENT ON COLUMN student_learning_assessment.open_response IS '开放题的文本回答';
COMMENT ON COLUMN student_learning_assessment.ai_evaluation IS 'LLM生成的个性化评价';
COMMENT ON COLUMN student_learning_assessment.llm_config_id IS '使用的大模型配置ID';

-- 2. 创建学习偏好档案表
CREATE TABLE IF NOT EXISTS student_learning_profile (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    latest_assessment_id INTEGER REFERENCES student_learning_assessment(id),
    total_assessments INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_profile UNIQUE(student_id)
);

COMMENT ON TABLE student_learning_profile IS '学生学习偏好档案表';
COMMENT ON COLUMN student_learning_profile.latest_assessment_id IS '最新的测评记录ID';
COMMENT ON COLUMN student_learning_profile.total_assessments IS '总测评次数';

-- 显示创建结果
SELECT 'student_learning_assessment表创建成功' AS message
UNION ALL
SELECT 'student_learning_profile表创建成功' AS message;
