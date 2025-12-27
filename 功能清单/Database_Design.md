# 智能在线学习系统 - 数据库模型设计 (Database Schema)

## 1. 设计思路
基于“班级制”教学模式设计，核心逻辑链条为：**学生 -> 归属班级 -> 关联课程**。

*   **用户体系**：统一使用 `sys_user` 存储账号信息，通过扩展表 (`student_profile`, `teacher_profile`) 存储角色特定数据。
*   **教务核心**：
    *   `major` (专业) 是报名和缴费的实体。
    *   `sys_class` (班级) 是学生管理的实体。
    *   `class_course_relation` (班级排课) 是连接 班级、课程、教师 的核心纽带。

---

## 2. 实体关系图 (ER Diagram)

```mermaid
erDiagram
    %% 用户与角色
    SYS_USER ||--o| STUDENT_PROFILE : "1对1扩展"
    SYS_USER ||--o| TEACHER_PROFILE : "1对1扩展"
    
    %% 组织与教务
    ORGANIZATION ||--|{ MAJOR : "开设专业"
    MAJOR ||--|{ SYS_CLASS : "包含班级"
    SEMESTER ||--|{ SYS_CLASS : "归属学期"
    
    %% 核心关系：学生 -> 班级
    SYS_CLASS ||--|{ STUDENT_PROFILE : "拥有学生"
    
    %% 核心关系：班级 -> 课程 (排课)
    SYS_CLASS ||--|{ CLASS_COURSE_RELATION : "班级排课"
    COURSE ||--|{ CLASS_COURSE_RELATION : "被排课程"
    TEACHER_PROFILE ||--|{ CLASS_COURSE_RELATION : "授课老师"
    
    %% 课程资源
    COURSE ||--|{ COURSE_CHAPTER : "包含章节"
    COURSE_CHAPTER ||--|{ COURSE_RESOURCE : "包含资源"
    
    %% 报名与订单
    MAJOR ||--|{ ENROLLMENT_ORDER : "专业报名"
    STUDENT_PROFILE ||--|{ ENROLLMENT_ORDER : "发起订单"
    
    %% 学习记录
    STUDENT_PROFILE ||--|{ LEARNING_RECORD : "学习进度"
    COURSE_RESOURCE ||--|{ LEARNING_RECORD : "资源访问"

    %% 表定义
    SYS_USER {
        int id PK
        string username "账号"
        string password_hash
        string role "student/teacher/admin"
        string full_name "真实姓名"
    }

    STUDENT_PROFILE {
        int id PK
        int user_id FK
        int class_id FK "当前所在班级"
        int major_id FK "报名专业"
        string student_no "学号"
        string status "active/graduated/suspended"
    }

    MAJOR {
        int id PK
        string name "专业名称"
        decimal tuition_fee "学费标准"
    }

    SYS_CLASS {
        int id PK
        string name "班级名称 (e.g. 软件2024-1班)"
        int major_id FK
        int semester_id FK
    }

    COURSE {
        int id PK
        string title "课程名称"
        string description
        string cover_image
    }

    CLASS_COURSE_RELATION {
        int id PK
        int class_id FK
        int course_id FK
        int teacher_id FK "任课老师"
        int semester_id FK
        string schedule_desc "上课时间描述"
    }

    ENROLLMENT_ORDER {
        int id PK
        string order_no "订单号"
        int student_id FK
        int major_id FK
        decimal amount "金额"
        string status "pending/paid/cancelled"
    }
```

---

## 3. 核心表结构说明 (Core Tables)

### 3.1 基础模块
| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| `sys_user` | 系统用户 | `id`, `username`, `role` (admin, teacher, student), `avatar`, `created_at` |
| `sys_dict` | 数据字典 | `code`, `label`, `value` (用于存储静态选项如资源类型) |
| `semester` | 学期管理 | `name` (2024秋), `start_date`, `end_date`, `is_current` |

### 3.2 教务模块 (Enrollment & Class)
| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| `organization` | 学校/机构 | `name`, `parent_id` (支持树形结构) |
| `major` | 专业信息 | `org_id`, `name`, `tuition_fee` (学费), `duration` (学制) |
| `sys_class` | 班级信息 | `major_id`, `semester_id`, `head_teacher_id` (班主任) |
| `student_profile`| 学生档案 | `user_id`, `class_id`, `major_id`, `enrollment_date` |
| `enrollment_order`| 报名订单 | `student_id`, `major_id`, `total_amount`, `pay_status`, `pay_time` |

### 3.3 教学模块 (Teaching & Course)
| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| `course` | 课程基础 | `title`, `code`, `credits` (学分), `intro` |
| **`class_course_relation`** | **班级排课(核心)** | **`class_id`, `course_id`, `teacher_id`**, `semester_id` |
| `course_chapter` | 课程章节 | `course_id`, `title`, `sort_order`, `parent_id` (支持子章节) |
| `course_resource` | 课程资源 | `chapter_id`, `type` (video/ppt/doc), `file_url`, `duration` |

### 3.4 学习与互动 (Learning)
| 表名 | 说明 | 关键字段 |
| :--- | :--- | :--- |
| `learning_record` | 学习记录 | `student_id`, `resource_id`, `progress` (进度%), `last_position` (秒) |
| `course_qa` | 课程问答 | `course_id`, `student_id`, `title`, `content`, `reply_count` |
| `homework_submission` | 作业提交 | `assignment_id`, `student_id`, `content`, `score`, `teacher_comment` |

---

## 4. 关键业务查询逻辑示例

**Q: 学生登录后，如何获取“我的课程”列表？**

```sql
SELECT 
    c.title, c.cover_image, t.full_name as teacher_name
FROM 
    student_profile s
JOIN 
    class_course_relation ccr ON s.class_id = ccr.class_id  -- 1. 找到学生所在班级的排课记录
JOIN 
    course c ON ccr.course_id = c.id                        -- 2. 关联课程详情
JOIN 
    sys_user t ON ccr.teacher_id = t.id                     -- 3. 关联任课老师
WHERE 
    s.user_id = :current_user_id;
```

