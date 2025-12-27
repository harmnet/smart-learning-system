-- 创建数据字典表
CREATE TABLE IF NOT EXISTS dictionary_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    description VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS dictionary_item (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES dictionary_type(id) ON DELETE CASCADE,
    code VARCHAR NOT NULL,
    label VARCHAR NOT NULL,
    value VARCHAR NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    remark VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 插入年级字典类型
INSERT INTO dictionary_type (code, name, description) VALUES ('grade', '年级', '学生年级分类');

-- 插入年级字典项
INSERT INTO dictionary_item (type_id, code, label, value, sort_order) VALUES
    ((SELECT id FROM dictionary_type WHERE code = 'grade'), '2024', '2024级', '2024', 1),
    ((SELECT id FROM dictionary_type WHERE code = 'grade'), '2023', '2023级', '2023', 2),
    ((SELECT id FROM dictionary_type WHERE code = 'grade'), '2022', '2022级', '2022', 3),
    ((SELECT id FROM dictionary_type WHERE code = 'grade'), '2021', '2021级', '2021', 4),
    ((SELECT id FROM dictionary_type WHERE code = 'grade'), '2020', '2020级', '2020', 5);

-- 插入学期字典类型
INSERT INTO dictionary_type (code, name, description) VALUES ('semester', '学期', '学期分类');

-- 插入学期字典项
INSERT INTO dictionary_item (type_id, code, label, value, sort_order) VALUES
    ((SELECT id FROM dictionary_type WHERE code = 'semester'), '2024_fall', '2024秋季', '2024秋季', 1),
    ((SELECT id FROM dictionary_type WHERE code = 'semester'), '2024_spring', '2024春季', '2024春季', 2),
    ((SELECT id FROM dictionary_type WHERE code = 'semester'), '2023_fall', '2023秋季', '2023秋季', 3),
    ((SELECT id FROM dictionary_type WHERE code = 'semester'), '2023_spring', '2023春季', '2023春季', 4);

-- 插入学生状态字典类型
INSERT INTO dictionary_type (code, name, description) VALUES ('student_status', '学生状态', '学生学籍状态');

-- 插入学生状态字典项
INSERT INTO dictionary_item (type_id, code, label, value, sort_order) VALUES
    ((SELECT id FROM dictionary_type WHERE code = 'student_status'), 'active', '在读', 'active', 1),
    ((SELECT id FROM dictionary_type WHERE code = 'student_status'), 'graduated', '已毕业', 'graduated', 2),
    ((SELECT id FROM dictionary_type WHERE code = 'student_status'), 'suspended', '休学', 'suspended', 3),
    ((SELECT id FROM dictionary_type WHERE code = 'student_status'), 'expelled', '退学', 'expelled', 4);

