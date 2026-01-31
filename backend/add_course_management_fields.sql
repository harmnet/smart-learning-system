-- 课程管理功能数据库扩展脚本
-- 执行日期: 2026-01-06

-- 课程管理功能数据库扩展脚本
-- 执行日期: 2026-01-06

-- 1. 扩展 course 表，添加新字段
ALTER TABLE course ADD COLUMN IF NOT EXISTS course_category VARCHAR(50);
ALTER TABLE course ADD COLUMN IF NOT EXISTS enrollment_type VARCHAR(20);
ALTER TABLE course ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE course ADD COLUMN IF NOT EXISTS grade_composition JSONB;

-- 2. 创建章节学习规则表
CREATE TABLE IF NOT EXISTS course_chapter_learning_rule (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES course_chapter(id) ON DELETE CASCADE UNIQUE,
    rule_type VARCHAR(20) NOT NULL DEFAULT 'none',
    completion_percentage INTEGER,
    target_chapter_id INTEGER REFERENCES course_chapter(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建章节知识图谱关联表
CREATE TABLE IF NOT EXISTS course_chapter_knowledge_graph (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES course_chapter(id) ON DELETE CASCADE,
    knowledge_graph_id INTEGER NOT NULL REFERENCES knowledge_graph(id) ON DELETE CASCADE,
    knowledge_node_id INTEGER REFERENCES knowledge_node(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_chapter_knowledge_graph UNIQUE (chapter_id)
);

-- 4. 为新字段添加注释
COMMENT ON COLUMN course.course_category IS '课程类型：general（通识课）、professional_basic（专业基础课）、professional_core（专业核心课）、expansion（拓展课）、elective_course（选修课）';
COMMENT ON COLUMN course.enrollment_type IS '选课类型：required（必修课）、elective（选修课）、retake（重修课）';
COMMENT ON COLUMN course.is_deleted IS '逻辑删除标记';

-- 5. 添加表和列注释
COMMENT ON TABLE course_chapter_learning_rule IS '章节学习规则表';
COMMENT ON COLUMN course_chapter_learning_rule.rule_type IS '规则类型：none（无条件）、completion（完成度）、exam（通过测验）';
COMMENT ON COLUMN course_chapter_learning_rule.completion_percentage IS '完成度百分比（当rule_type为completion时使用）';
COMMENT ON COLUMN course_chapter_learning_rule.target_chapter_id IS '目标章节ID（上一章/小节）';

COMMENT ON TABLE course_chapter_knowledge_graph IS '章节知识图谱关联表';
COMMENT ON COLUMN course_chapter_knowledge_graph.knowledge_node_id IS '关联的具体节点（可选）';

-- 6. 创建索引
CREATE INDEX IF NOT EXISTS idx_learning_rule_chapter ON course_chapter_learning_rule(chapter_id);
CREATE INDEX IF NOT EXISTS idx_learning_rule_target ON course_chapter_learning_rule(target_chapter_id);

CREATE INDEX IF NOT EXISTS idx_chapter_kg_chapter ON course_chapter_knowledge_graph(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_kg_graph ON course_chapter_knowledge_graph(knowledge_graph_id);
CREATE INDEX IF NOT EXISTS idx_chapter_kg_node ON course_chapter_knowledge_graph(knowledge_node_id);

-- 7. 为已存在的课程添加默认值
UPDATE course SET is_deleted = FALSE WHERE is_deleted IS NULL;
