# 数据库导出说明

## 数据库信息
- 数据库名称: `smartlearning`
- 数据库类型: PostgreSQL
- 主机: localhost
- 端口: 5432
- 用户: postgres

## 如何导出数据库

### 方法1：使用 pg_dump (推荐)
```bash
pg_dump -h localhost -U postgres -d smartlearning > database_backup/smartlearning_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 方法2：使用 pgAdmin
1. 打开 pgAdmin
2. 右键点击 `smartlearning` 数据库
3. 选择 "Backup..."
4. 选择保存位置和文件名
5. 点击 "Backup"

### 方法3：使用 Docker (如果使用 Docker)
```bash
docker exec -t postgres pg_dump -U postgres smartlearning > smartlearning_backup.sql
```

## 如何导入数据库

### 方法1：使用 psql
```bash
psql -h localhost -U postgres -d smartlearning < database_backup/smartlearning_backup_YYYYMMDD_HHMMSS.sql
```

### 方法2：使用 pgAdmin
1. 打开 pgAdmin
2. 右键点击 `smartlearning` 数据库
3. 选择 "Restore..."
4. 选择备份文件
5. 点击 "Restore"

## 数据库架构说明

项目包含以下主要数据表：

### 系统管理
- `sys_user` - 用户表
- `sys_organization` - 组织表
- `major` - 专业表
- `class` - 班级表
- `student_profile` - 学生档案表
- `teacher_profile` - 教师档案表

### 课程管理
- `course` - 课程表
- `course_chapter` - 课程章节表
- `course_section_resource` - 章节资源关联表
- `teaching_resource` - 教学资源表

### 考试管理
- `exam` - 考试表
- `exam_paper` - 试卷表
- `question` - 题目表
- `exam_paper_question` - 试卷题目关联表
- `student_exam_score` - 学生考试成绩表

### 学习管理
- `student_learning_behavior` - 学生学习行为表
- `student_study_duration` - 学生学习时长表
- `student_learning_profile` - 学生学习档案表
- `student_learning_assessment` - 学习偏好测评表
- `personalized_learning_content` - 个性化学习内容表
- `ai_quiz_record` - AI测评记录表

### 知识图谱
- `knowledge_graph` - 知识图谱表
- `knowledge_point` - 知识点表
- `knowledge_point_relation` - 知识点关系表

### 互动管理
- `teacher_student_interaction` - 师生互动表

## 迁移脚本

项目中包含以下数据库迁移脚本（位于 `backend/` 目录）：
- `init.sql` - 初始化脚本
- `create_*.py` - 创建表的Python脚本
- `migrate_*.py` - 数据迁移脚本
- `migrations/*.sql` - SQL迁移脚本

## 注意事项

1. 导出数据库前请确保没有正在运行的查询
2. 建议定期备份数据库
3. 敏感数据（如密码）已经过加密存储
4. 备份文件请妥善保管，不要上传到公共代码仓库
