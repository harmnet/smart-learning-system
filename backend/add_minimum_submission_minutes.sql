-- 添加最早交卷时间字段到考试表
ALTER TABLE exam ADD COLUMN IF NOT EXISTS minimum_submission_minutes INTEGER DEFAULT 15 NOT NULL;

-- 为已有数据设置默认值
UPDATE exam SET minimum_submission_minutes = 15 WHERE minimum_submission_minutes IS NULL;

-- 添加注释
COMMENT ON COLUMN exam.minimum_submission_minutes IS '最早交卷时间（分钟）';

