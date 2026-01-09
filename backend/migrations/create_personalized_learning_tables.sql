-- 个性化学习内容表
CREATE TABLE IF NOT EXISTS personalized_learning_content (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES teaching_resource(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    assessment_id INTEGER REFERENCES student_learning_assessment(id),
    llm_config_id INTEGER REFERENCES llm_config(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_resource_version UNIQUE(student_id, resource_id, created_at)
);

CREATE INDEX idx_personalized_content_student ON personalized_learning_content(student_id);
CREATE INDEX idx_personalized_content_resource ON personalized_learning_content(resource_id);
CREATE INDEX idx_personalized_content_created ON personalized_learning_content(created_at DESC);

COMMENT ON TABLE personalized_learning_content IS '个性化学习内容表';
COMMENT ON COLUMN personalized_learning_content.student_id IS '学生ID';
COMMENT ON COLUMN personalized_learning_content.resource_id IS '教学资源ID';
COMMENT ON COLUMN personalized_learning_content.content IS '个性化学习内容（Markdown格式）';
COMMENT ON COLUMN personalized_learning_content.assessment_id IS '关联的学习偏好测评ID';
COMMENT ON COLUMN personalized_learning_content.llm_config_id IS '使用的大模型配置ID';

-- AI测评记录表
CREATE TABLE IF NOT EXISTS ai_quiz_record (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    resource_id INTEGER NOT NULL REFERENCES teaching_resource(id) ON DELETE CASCADE,
    assessment_id INTEGER REFERENCES student_learning_assessment(id),
    questions JSONB NOT NULL,
    user_answers JSONB,
    score DECIMAL(5,2),
    total_score INTEGER DEFAULT 100,
    is_submitted BOOLEAN DEFAULT FALSE,
    llm_config_id INTEGER REFERENCES llm_config(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP
);

CREATE INDEX idx_quiz_student ON ai_quiz_record(student_id);
CREATE INDEX idx_quiz_resource ON ai_quiz_record(resource_id);
CREATE INDEX idx_quiz_created ON ai_quiz_record(created_at DESC);

COMMENT ON TABLE ai_quiz_record IS 'AI测评记录表';
COMMENT ON COLUMN ai_quiz_record.student_id IS '学生ID';
COMMENT ON COLUMN ai_quiz_record.resource_id IS '教学资源ID';
COMMENT ON COLUMN ai_quiz_record.assessment_id IS '关联的学习偏好测评ID';
COMMENT ON COLUMN ai_quiz_record.questions IS '测评题目（JSON格式）';
COMMENT ON COLUMN ai_quiz_record.user_answers IS '学生答案（JSON格式）';
COMMENT ON COLUMN ai_quiz_record.score IS '得分';
COMMENT ON COLUMN ai_quiz_record.total_score IS '总分';
COMMENT ON COLUMN ai_quiz_record.is_submitted IS '是否已提交';
COMMENT ON COLUMN ai_quiz_record.llm_config_id IS '使用的大模型配置ID';
COMMENT ON COLUMN ai_quiz_record.submitted_at IS '提交时间';
