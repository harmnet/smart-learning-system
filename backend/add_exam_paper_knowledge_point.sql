-- 添加知识点字段到试卷表
ALTER TABLE exam_paper ADD COLUMN IF NOT EXISTS knowledge_point VARCHAR(255);

-- 设为必填项(对已有数据暂时允许为NULL,新数据必填)
UPDATE exam_paper SET knowledge_point = '未分类' WHERE knowledge_point IS NULL;

-- 添加注释
COMMENT ON COLUMN exam_paper.knowledge_point IS '关联的知识点名称';

