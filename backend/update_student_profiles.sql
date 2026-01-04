-- 更新学生档案，给学生随机分配班级和年级

-- 首先查看现有的班级
-- SELECT id, name, major_id, grade FROM classes;

-- 为学生随机分配班级和年级
-- 假设我们有3个班级（根据之前的信息）

-- 更新前20个学生 -> 班级ID 34 (市场营销2401), 年级2024
UPDATE student_profiles 
SET class_id = 34, grade = '2024'
WHERE user_id IN (
    SELECT id FROM users 
    WHERE username LIKE 'student1%' 
    AND role = 'student'
    ORDER BY id
    LIMIT 20
);

-- 更新接下来20个学生 -> 班级ID 35 (计科2301), 年级2023
UPDATE student_profiles 
SET class_id = 35, grade = '2023'
WHERE user_id IN (
    SELECT id FROM users 
    WHERE username LIKE 'student1%' 
    AND role = 'student'
    AND id NOT IN (
        SELECT user_id FROM student_profiles WHERE grade = '2024'
    )
    ORDER BY id
    LIMIT 20
);

-- 更新接下来20个学生 -> 班级ID 36 (计科2501), 年级2025
UPDATE student_profiles 
SET class_id = 36, grade = '2025'
WHERE user_id IN (
    SELECT id FROM users 
    WHERE username LIKE 'student1%' 
    AND role = 'student'
    AND id NOT IN (
        SELECT user_id FROM student_profiles WHERE grade IN ('2024', '2023')
    )
    ORDER BY id
    LIMIT 20
);

-- 剩余学生分配到不同年级（没有班级）
UPDATE student_profiles 
SET grade = '2022', class_id = 34
WHERE user_id IN (
    SELECT id FROM users 
    WHERE username LIKE 'student1%' 
    AND role = 'student'
    AND id NOT IN (
        SELECT user_id FROM student_profiles WHERE grade IN ('2024', '2023', '2025')
    )
    ORDER BY id
    LIMIT 15
);

UPDATE student_profiles 
SET grade = '2021', class_id = 35
WHERE user_id IN (
    SELECT id FROM users 
    WHERE username LIKE 'student1%' 
    AND role = 'student'
    AND id NOT IN (
        SELECT user_id FROM student_profiles WHERE grade IN ('2024', '2023', '2025', '2022')
    )
    ORDER BY id
    LIMIT 15
);

-- 查看更新后的数据分布
SELECT grade, COUNT(*) as student_count
FROM student_profiles
WHERE grade IS NOT NULL
GROUP BY grade
ORDER BY grade;

SELECT c.name as class_name, c.grade, COUNT(sp.id) as student_count
FROM student_profiles sp
JOIN classes c ON sp.class_id = c.id
GROUP BY c.id, c.name, c.grade
ORDER BY c.grade, c.name;

