-- 添加考试状态字段到考生表
ALTER TABLE exam_student ADD COLUMN IF NOT EXISTS exam_status VARCHAR(50) DEFAULT 'pending';
-- exam_status 取值: 'pending' (待考试), 'in_progress' (考试中), 'submitted' (已提交)

-- 添加开始时间和提交时间
ALTER TABLE exam_student ADD COLUMN IF NOT EXISTS start_time TIMESTAMP NULL;
ALTER TABLE exam_student ADD COLUMN IF NOT EXISTS submit_time TIMESTAMP NULL;

-- 添加注释
COMMENT ON COLUMN exam_student.exam_status IS '考试状态: pending-待考试, in_progress-考试中, submitted-已提交';
COMMENT ON COLUMN exam_student.start_time IS '开始考试时间';
COMMENT ON COLUMN exam_student.submit_time IS '提交考试时间';

