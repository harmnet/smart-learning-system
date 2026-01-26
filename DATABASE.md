# 数据库说明

本文档说明数珩智学系统的数据库结构和数据管理。

## 数据库概览

- **数据库类型**：PostgreSQL 14+
- **数据库名称**：smartlearning
- **字符集**：UTF8
- **时区**：UTC

---

## 数据库结构

### 核心表

| 表名 | 说明 | 记录数 |
|-----|------|--------|
| users | 用户表（学生、教师、管理员） | - |
| classes | 班级表 | - |
| majors | 专业表 | - |
| courses | 课程表 | - |
| course_covers | 课程封面表 | - |
| course_chapters | 课程章节表 | - |

### 学习相关表

| 表名 | 说明 |
|-----|------|
| learning_records | 学习记录表 |
| learning_progress | 学习进度表 |
| learning_goals | 学习目标表 |
| learning_paths | 学习路径表 |
| learning_recommendations | 学习推荐表 |

### 考试相关表

| 表名 | 说明 |
|-----|------|
| exam_papers | 试卷表 |
| exam_questions | 试题表 |
| exam_records | 考试记录表 |
| exam_answers | 答题记录表 |
| exam_students | 学生考试关联表 |

### 题库相关表

| 表名 | 说明 |
|-----|------|
| questions | 题库表 |
| question_options | 选项表 |
| question_tags | 题目标签表 |
| question_knowledge_points | 题目知识点关联表 |

### 知识图谱相关表

| 表名 | 说明 |
|-----|------|
| knowledge_graphs | 知识图谱表 |
| knowledge_nodes | 知识节点表 |
| knowledge_edges | 知识边表 |

### 作业相关表

| 表名 | 说明 |
|-----|------|
| student_homework | 学生作业表 |
| student_homework_submissions | 作业提交表 |

### 课程大纲相关表

| 表名 | 说明 |
|-----|------|
| course_outlines | 课程大纲表 |
| course_outline_items | 大纲项目表 |

### 课程问答相关表

| 表名 | 说明 |
|-----|------|
| course_qa_questions | 课程问题表 |
| course_qa_answers | 课程答案表 |

---

## 数据库初始化

### 方式 1: 使用初始化脚本

```bash
cd backend
psql -U postgres -d smartlearning -f init.sql
```

### 方式 2: 使用 Python 迁移脚本

按顺序执行以下脚本：

```bash
# 1. 创建基础表（用户、课程、班级等）
python create_learning_tables.py

# 2. 创建考试相关表
python create_exam_tables.py
python create_exam_paper_tables.py

# 3. 创建题库表
python create_question_tables.py

# 4. 创建知识图谱表
python create_knowledge_graph_tables.py

# 5. 创建课程大纲表
python create_course_outline_tables.py

# 6. 运行额外的迁移
python -c "from app.db.session import engine; exec(open('migrations/create_personalized_learning_tables.sql').read())"
```

### 方式 3: 使用备份文件恢复

如果有完整的数据库备份：

```bash
# 恢复最新备份
psql -U postgres -d smartlearning -f database_backup/smartlearning_backup_20260109_201451.sql
```

---

## 数据库备份

### 创建备份

```bash
cd backend
./backup_database.sh
```

备份文件保存在 `backend/database_backup/` 目录。

### 手动备份

```bash
# 仅备份结构
pg_dump -U postgres -d smartlearning --schema-only > schema.sql

# 备份结构和数据
pg_dump -U postgres -d smartlearning > full_backup.sql

# 备份特定表
pg_dump -U postgres -d smartlearning -t users -t courses > specific_tables.sql
```

---

## 数据迁移

### 添加新字段

示例脚本：`backend/add_missing_columns.py`

```python
# 检查并添加缺失的字段
python add_missing_columns.py
```

### 数据迁移脚本

项目包含多个迁移脚本：

- `migrate_course_management.py` - 课程管理字段迁移
- `migrate_interaction_table.py` - 交互表迁移
- `migrate_learning_profile.py` - 学习档案迁移
- `migrate_personalized_learning.py` - 个性化学习迁移
- `migrate_chapter_exam_data.py` - 章节考试数据迁移

### 运行迁移

```bash
cd backend

# 运行特定迁移
python migrate_course_management.py

# 或使用统一脚本
./run_migration.sh
```

---

## 示例数据

### 插入测试数据

```bash
# 插入测试学习数据
python insert_test_learning_data.py

# 插入测试题目
python insert_questions.sql
python insert_50_questions.sql

# 更新学生数据
python update_student_data.py
python update_students_via_api.py
```

### 测试数据说明

测试数据包括：
- 示例用户（学生、教师、管理员）
- 示例课程和章节
- 示例题库和试卷
- 示例学习记录

⚠️ **注意**：生产环境不要使用测试数据！

---

## 数据安全

### 1. 敏感数据脱敏

导出数据库时，应脱敏以下字段：
- 用户密码（users.password_hash）
- 手机号（users.phone）
- 邮箱（users.email）
- 身份证号（如有）

### 2. 备份加密

```bash
# 加密备份文件
gpg --encrypt --recipient your@email.com backup.sql

# 解密备份文件
gpg --decrypt backup.sql.gpg > backup.sql
```

### 3. 访问控制

- 限制数据库用户权限
- 使用强密码
- 启用 SSL 连接
- 定期更换密码

---

## 性能优化

### 索引优化

常用索引：

```sql
-- 用户表
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- 课程表
CREATE INDEX idx_courses_main_teacher ON courses(main_teacher_id);
CREATE INDEX idx_courses_created_at ON courses(created_at);

-- 学习记录
CREATE INDEX idx_learning_records_student ON learning_records(student_id);
CREATE INDEX idx_learning_records_course ON learning_records(course_id);

-- 考试记录
CREATE INDEX idx_exam_records_student ON exam_records(student_id);
CREATE INDEX idx_exam_records_paper ON exam_records(paper_id);
```

### 查询优化

- 使用 `EXPLAIN ANALYZE` 分析慢查询
- 避免 N+1 查询（使用 `selectinload`）
- 合理使用分页
- 定期 VACUUM 和 ANALYZE

---

## 数据库监控

### 查看连接数

```sql
SELECT count(*) FROM pg_stat_activity;
```

### 查看表大小

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 查看慢查询

```sql
SELECT
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## 故障恢复

### 恢复到特定时间点

```bash
# 1. 停止应用
# 2. 恢复备份
psql -U postgres -d smartlearning -f backup.sql

# 3. 应用增量日志（如有）
# 4. 重启应用
```

### 数据一致性检查

```bash
# 检查表结构
python check_tables.py

# 验证外键约束
SELECT * FROM pg_constraint WHERE contype = 'f';
```

---

## 数据库架构图

完整的数据库设计文档请查看：
- [功能清单/Database_Design.md](功能清单/Database_Design.md)

---

## 常见问题

### Q1: 数据库连接池耗尽

增加连接池大小或检查连接泄露。

### Q2: 磁盘空间不足

清理旧日志和临时文件，或扩容磁盘。

### Q3: 查询速度慢

检查索引、优化查询、升级硬件。

---

## 联系支持

如有数据库相关问题，请查看：
- 详细的数据库设计：[功能清单/Database_Design.md](功能清单/Database_Design.md)
- 技术栈文档：[功能清单/Technical_Stack.md](功能清单/Technical_Stack.md)
