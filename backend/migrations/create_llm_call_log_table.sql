-- LLM调用记录表
-- 创建时间: 2026-01-22

CREATE TABLE IF NOT EXISTS llm_call_log (
    id SERIAL PRIMARY KEY,
    function_type VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('teacher', 'student', 'admin')),
    llm_config_id INTEGER REFERENCES llm_config(id),
    prompt TEXT NOT NULL,
    result TEXT,
    execution_time_ms INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    related_id INTEGER,
    related_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_llm_call_log_function_type ON llm_call_log(function_type);
CREATE INDEX IF NOT EXISTS idx_llm_call_log_user_id ON llm_call_log(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_call_log_created_at ON llm_call_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_call_log_llm_config_id ON llm_call_log(llm_config_id);
CREATE INDEX IF NOT EXISTS idx_llm_call_log_status ON llm_call_log(status);

-- 添加注释
COMMENT ON TABLE llm_call_log IS 'LLM调用记录表';
COMMENT ON COLUMN llm_call_log.function_type IS '调用功能类型：ai_grade_homework, ai_generate_knowledge_graph, ai_create_resource, ai_generate_question, learning_profile_assessment, personalized_learning, ai_quiz';
COMMENT ON COLUMN llm_call_log.user_id IS '调用用户ID';
COMMENT ON COLUMN llm_call_log.user_role IS '用户角色：teacher/student/admin';
COMMENT ON COLUMN llm_call_log.llm_config_id IS '使用的大模型配置ID';
COMMENT ON COLUMN llm_call_log.prompt IS '提示词';
COMMENT ON COLUMN llm_call_log.result IS '返回结果';
COMMENT ON COLUMN llm_call_log.execution_time_ms IS '执行时长（毫秒）';
COMMENT ON COLUMN llm_call_log.status IS '调用状态：success/failed';
COMMENT ON COLUMN llm_call_log.error_message IS '错误信息';
COMMENT ON COLUMN llm_call_log.related_id IS '关联的业务ID';
COMMENT ON COLUMN llm_call_log.related_type IS '关联的业务类型';
