import random
import string
from datetime import datetime
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from pydantic import BaseModel
import pandas as pd
import hashlib

from app.db.session import get_db
from app.models.base import User, StudentProfile, TeacherProfile, Class, Major, EnrollmentOrder, Organization
from app.schemas import user as user_schemas
from app.core import security
from app.utils.import_utils import (
    parse_excel_file, generate_excel_template,
    check_duplicate_username, check_duplicate_email, check_duplicate_phone,
    check_duplicate_student_no, check_duplicate_class_name
)

def generate_random_password(length: int = 6) -> str:
    """生成包含字母、数字、大小写的随机密码"""
    # 确保至少包含一个大写字母、一个小写字母和一个数字
    uppercase = random.choice(string.ascii_uppercase)
    lowercase = random.choice(string.ascii_lowercase)
    digit = random.choice(string.digits)
    
    # 剩余字符从所有字符中随机选择
    all_chars = string.ascii_letters + string.digits
    remaining = ''.join(random.choices(all_chars, k=length - 3))
    
    # 打乱顺序
    password_list = list(uppercase + lowercase + digit + remaining)
    random.shuffle(password_list)
    
    return ''.join(password_list)

# 临时定义班级schemas
class ClassCreate(BaseModel):
    name: str
    code: Optional[str] = None
    major_id: int
    grade: Optional[str] = None

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    major_id: Optional[int] = None
    grade: Optional[str] = None

# 临时定义教师schemas
class TeacherCreate(BaseModel):
    username: Optional[str] = None  # Will be set to phone if not provided
    password: str = "12345678"  # Default password
    full_name: str
    email: str
    major_id: int
    phone: str  # Required field, will be used as username
    title: Optional[str] = None
    is_active: bool = True

class TeacherUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    major_id: Optional[int] = None
    phone: Optional[str] = None  # Optional for update, but can be set
    title: Optional[str] = None
    is_active: Optional[bool] = None

class StudentCreate(BaseModel):
    username: str
    password: str = "student123"
    full_name: str
    email: Optional[str] = None
    phone: str
    class_id: int
    student_no: str
    is_active: bool = True

router = APIRouter()

# ============= 学生管理 =============
@router.get("/students/stats")
async def get_students_stats(
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Get total students count（只统计有效的）
    total_result = await db.execute(select(func.count(User.id)).where(and_(User.role == "student", User.is_active == True)))
    total_students = total_result.scalar()
    
    # Get active students count（与总数相同，因为只统计有效的）
    active_students = total_students
    
    # Calculate covered majors: get distinct major_ids from student profiles through their classes
    # Join StudentProfile -> Class -> Major to get unique majors
    covered_majors_query = select(func.count(func.distinct(Class.major_id))).select_from(StudentProfile).join(
        Class, StudentProfile.class_id == Class.id
    ).where(StudentProfile.class_id.isnot(None))
    
    covered_majors_result = await db.execute(covered_majors_query)
    covered_majors = covered_majors_result.scalar() or 0
    
    # Get major distribution
    major_distribution_query = select(
        Major.name,
        func.count(StudentProfile.id).label('count')
    ).select_from(StudentProfile).join(
        Class, StudentProfile.class_id == Class.id
    ).join(
        Major, Class.major_id == Major.id
    ).where(StudentProfile.class_id.isnot(None)).group_by(Major.id, Major.name)
    
    major_distribution_result = await db.execute(major_distribution_query)
    major_distribution = major_distribution_result.fetchall()
    
    by_major = [{"major": row[0], "count": row[1]} for row in major_distribution]
    
    return {
        "total": total_students,
        "active": active_students,
        "inactive": total_students - active_students,
        "majors": covered_majors,
        "by_major": by_major
    }

@router.get("/students")
async def get_students(
    skip: int = 0,
    limit: int = 20,
    name: Optional[str] = None,
    student_no: Optional[str] = None,
    phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Build query conditions（只查询有效的学生）
    conditions = [User.role == "student", User.is_active == True]
    
    # Search by name (full_name or username)
    if name:
        conditions.append(
            (User.full_name.ilike(f"%{name}%")) | (User.username.ilike(f"%{name}%"))
        )
    
    # Search by phone
    if phone:
        conditions.append(User.phone.ilike(f"%{phone}%"))
    
    # Get total count
    count_query = select(func.count(User.id)).where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Execute query with pagination and ordering by updated_at DESC
    query = select(User).where(and_(*conditions)).order_by(User.updated_at.desc().nullslast(), User.created_at.desc().nullslast()).offset(skip).limit(limit)
    result = await db.execute(query)
    students = result.scalars().all()
    
    # Build response with student profile info
    student_list = []
    for s in students:
        # Fetch student profile
        profile_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == s.id))
        profile = profile_res.scalars().first()
        
        # Filter by student_no if provided
        if student_no and profile:
            if not profile.student_no or student_no not in profile.student_no:
                continue
        elif student_no and not profile:
            continue
        
        # Get class name, organization name, major name, and grade
        class_name = "-"
        organization_name = "-"
        major_name = None
        grade = None
        if profile and profile.class_id:
            # Join Class -> Major -> Organization to get organization name
            from app.models.base import Organization
            class_query = select(Class, Major, Organization).join(
                Major, Class.major_id == Major.id
            ).join(
                Organization, Major.organization_id == Organization.id
            ).where(Class.id == profile.class_id)
            class_result = await db.execute(class_query)
            class_row = class_result.first()
            if class_row:
                class_obj, major_obj, org_obj = class_row
                class_name = class_obj.name
                grade = class_obj.grade  # Get grade from class
                if major_obj:
                    major_name = major_obj.name  # Get major name
                if org_obj:
                    organization_name = org_obj.name
        
        student_list.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name,
            "email": s.email,
            "phone": s.phone,
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "student_no": profile.student_no if profile else None,
            "class_name": class_name,
            "class_id": profile.class_id if profile else None,
            "organization_name": organization_name,
            "major_name": major_name,  # Add major_name
            "grade": grade  # Add grade
        })
    
    return {
        "items": student_list,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/students")
async def create_student(
    *,
    db: AsyncSession = Depends(get_db),
    student_in: StudentCreate,
) -> Any:
    # Check username
    result = await db.execute(select(User).where(User.username == student_in.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check student_no
    if student_in.student_no:
        result = await db.execute(select(StudentProfile).where(StudentProfile.student_no == student_in.student_no))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Student number already exists")

    # Get class to determine major_id (只检查有效的班级)
    class_res = await db.execute(select(Class).where(and_(Class.id == student_in.class_id, Class.is_active == True)))
    class_obj = class_res.scalars().first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")

    # Create User
    user = User(
        username=student_in.username,
        hashed_password=security.get_password_hash(student_in.password),
        full_name=student_in.full_name,
        email=student_in.email if student_in.email else None,
        phone=student_in.phone,
        role="student",
        is_active=student_in.is_active
    )
    db.add(user)
    try:
        await db.commit()
        await db.refresh(user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    # Create Profile
    profile = StudentProfile(
        user_id=user.id,
        major_id=class_obj.major_id,
        class_id=student_in.class_id,
        student_no=student_in.student_no
    )
    db.add(profile)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create student profile: {str(e)}")

    return {"id": user.id, "message": "Student created successfully"}

@router.get("/students/{student_id}", response_model=user_schemas.User)
async def get_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).where(and_(User.id == student_id, User.role == "student", User.is_active == True)))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.put("/students/{student_id}", response_model=user_schemas.User)
async def update_student(
    *,
    db: AsyncSession = Depends(get_db),
    student_id: int,
    request_body: Dict[str, Any] = Body(...),
) -> Any:
    result = await db.execute(select(User).where(and_(User.id == student_id, User.role == "student", User.is_active == True)))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Extract User fields from request body
    user_fields = ["username", "email", "full_name", "role", "password", "phone", "is_active"]
    update_data = {k: v for k, v in request_body.items() if k in user_fields}
    
    # Handle empty string email - convert to None
    if "email" in update_data and update_data["email"] == "":
        update_data["email"] = None
    
    # Handle password hashing if provided
    if "password" in update_data:
        update_data["hashed_password"] = security.get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        if hasattr(student, field):
            setattr(student, field, value)
    
    # Update updated_at timestamp
    from datetime import datetime
    student.updated_at = datetime.utcnow()
    
    # Update StudentProfile if class_id or student_no is provided in request body
    profile_result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == student_id))
    profile = profile_result.scalars().first()
    
    # Extract class_id and student_no from request body
    class_id = request_body.get("class_id")
    student_no = request_body.get("student_no")
    
    # If profile doesn't exist, create one if class_id or student_no is provided
    if not profile and (class_id or student_no):
        profile = StudentProfile(user_id=student_id)
        db.add(profile)
    
    if profile:
        profile_updated = False
        
        if class_id is not None and class_id != 0:
            # Validate class exists
            class_res = await db.execute(select(Class).where(and_(Class.id == class_id, Class.is_active == True)))
            class_obj = class_res.scalars().first()
            if not class_obj:
                raise HTTPException(status_code=404, detail="Class not found")
            
            profile.class_id = class_id
            profile.major_id = class_obj.major_id  # Update major_id based on class
            profile_updated = True
        
        if student_no is not None and student_no != "":
            # Check if student_no already exists (excluding current student)
            existing_profile = await db.execute(
                select(StudentProfile).where(
                    StudentProfile.student_no == student_no,
                    StudentProfile.user_id != student_id
                )
            )
            if existing_profile.scalars().first():
                raise HTTPException(status_code=400, detail="Student number already exists")
            
            profile.student_no = student_no
            profile_updated = True
        
        if profile_updated:
            profile.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(student)
    return student

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).where(and_(User.id == student_id, User.role == "student", User.is_active == True)))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # 逻辑删除：设置 is_active = False
    await db.execute(select(StudentProfile).where(StudentProfile.user_id == student_id))
    # ... simplify: cascade delete handle or manual delete
    
    # 逻辑删除：设置 is_active = False
    student.is_active = False
    student.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Student deleted successfully"}

@router.get("/students/template")
async def download_student_template():
    """下载学生导入模板"""
    headers = ["姓名", "学号", "用户名", "手机号", "邮箱（可选）", "所属班级ID"]
    sample_data = [
        {"姓名": "张三", "学号": "2024001", "用户名": "zhangsan", "手机号": "13800138001", "邮箱（可选）": "zhangsan@example.com", "所属班级ID": "1"},
        {"姓名": "李四", "学号": "2024002", "用户名": "lisi", "手机号": "13800138002", "邮箱（可选）": "", "所属班级ID": "1"},
    ]
    
    template_bytes = generate_excel_template(headers, sample_data)
    
    return Response(
        content=template_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=student_import_template.xlsx"}
    )

@router.post("/students/import")
async def import_students(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量导入学生"""
    try:
        # 解析Excel文件
        df = parse_excel_file(file)
        
        # 验证必需的列
        required_columns = ["姓名", "学号", "用户名", "手机号", "所属班级ID"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"缺少必需的列: {', '.join(missing_columns)}"
            )
        
        # 验证数据
        errors = []
        students_to_create = []
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # Excel行号
            
            # 获取姓名
            full_name = str(row["姓名"]).strip() if pd.notna(row["姓名"]) else None
            if not full_name:
                errors.append(f"第{row_num}行: 姓名不能为空")
                continue
            
            # 获取学号
            student_no = str(row["学号"]).strip() if pd.notna(row["学号"]) else None
            if not student_no:
                errors.append(f"第{row_num}行: 学号不能为空")
                continue
            
            # 检查学号重复
            if await check_duplicate_student_no(db, student_no):
                errors.append(f"第{row_num}行: 学号 '{student_no}' 已存在")
                continue
            
            # 获取用户名
            username = str(row["用户名"]).strip() if pd.notna(row["用户名"]) else None
            if not username:
                errors.append(f"第{row_num}行: 用户名不能为空")
                continue
            
            # 检查用户名重复
            if await check_duplicate_username(db, username):
                errors.append(f"第{row_num}行: 用户名 '{username}' 已存在")
                continue
            
            # 获取手机号
            phone = str(row["手机号"]).strip() if pd.notna(row["手机号"]) else None
            if not phone:
                errors.append(f"第{row_num}行: 手机号不能为空")
                continue
            
            # 检查手机号重复
            if await check_duplicate_phone(db, phone):
                errors.append(f"第{row_num}行: 手机号 '{phone}' 已存在")
                continue
            
            # 获取邮箱（可选）
            email = None
            if "邮箱（可选）" in df.columns and pd.notna(row["邮箱（可选）"]):
                email_str = str(row["邮箱（可选）"]).strip()
                if email_str:
                    # 简单验证邮箱格式
                    if "@" not in email_str:
                        errors.append(f"第{row_num}行: 邮箱格式错误")
                        continue
                    email = email_str
                    # 检查邮箱重复
                    if await check_duplicate_email(db, email):
                        errors.append(f"第{row_num}行: 邮箱 '{email}' 已存在")
                        continue
            
            # 获取所属班级ID
            try:
                class_id = int(row["所属班级ID"])
                # 验证班级是否存在
                class_result = await db.execute(
                    select(Class).where(and_(Class.id == class_id, Class.is_active == True))
                )
                class_obj = class_result.scalars().first()
                if not class_obj:
                    errors.append(f"第{row_num}行: 所属班级ID {class_id} 不存在")
                    continue
                
                # 获取专业ID（从班级关联）
                major_id = class_obj.major_id
            except (ValueError, TypeError):
                errors.append(f"第{row_num}行: 所属班级ID格式错误")
                continue
            
            students_to_create.append({
                "full_name": full_name,
                "username": username,
                "student_no": student_no,
                "phone": phone,
                "email": email,
                "class_id": class_id,
                "major_id": major_id
            })
        
        # 如果有错误，返回错误信息
        if errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "数据验证失败",
                    "errors": errors
                }
            )
        
        # 如果没有任何数据，返回错误
        if not students_to_create:
            raise HTTPException(
                status_code=400,
                detail="没有有效的数据可以导入"
            )
        
        # 开始事务，批量创建学生
        created_count = 0
        try:
            for student_data in students_to_create:
                # 创建用户（默认密码：12345678）
                password_hash = security.get_password_hash("12345678")
                user = User(
                    username=student_data["username"],
                    hashed_password=password_hash,
                    full_name=student_data["full_name"],
                    email=student_data["email"],
                    phone=student_data["phone"],
                    role="student",
                    is_active=True
                )
                db.add(user)
                await db.flush()  # 获取user.id
                
                # 创建学生档案
                profile = StudentProfile(
                    user_id=user.id,
                    student_no=student_data["student_no"],
                    class_id=student_data["class_id"],
                    major_id=student_data["major_id"],
                    status="active"
                )
                db.add(profile)
                created_count += 1
            
            await db.commit()
            
            return {
                "message": f"成功导入 {created_count} 条学生数据",
                "imported_count": created_count,
                "total_count": len(students_to_create)
            }
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"导入失败: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"导入过程中发生错误: {str(e)}"
        )

# ============= 教师管理 =============
@router.get("/teachers/stats")
async def get_teachers_stats(
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 只统计有效的教师
    total_result = await db.execute(select(func.count(User.id)).where(and_(User.role == "teacher", User.is_active == True)))
    total_teachers = total_result.scalar()
    
    active_teachers = total_teachers  # 与总数相同，因为只统计有效的
    
    return {
        "total": total_teachers,
        "active": active_teachers,
        "inactive": total_teachers - active_teachers
    }

@router.get("/teachers")
async def get_teachers(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Build query conditions（默认只查询有效的教师）
    conditions = [User.role == "teacher"]
    
    # Search by name (full_name or username)
    if name:
        conditions.append(
            (User.full_name.ilike(f"%{name}%")) | (User.username.ilike(f"%{name}%"))
        )
    
    # Search by status（如果指定了status，按status过滤；否则默认只查询有效的）
    if status:
        if status == "active":
            conditions.append(User.is_active == True)
        elif status == "inactive":
            conditions.append(User.is_active == False)
    else:
        # 默认只查询有效的教师
        conditions.append(User.is_active == True)
    
    # Execute query with ordering by updated_at DESC
    query = select(User).where(and_(*conditions)).order_by(User.updated_at.desc().nullslast(), User.created_at.desc().nullslast()).offset(skip).limit(limit)
    result = await db.execute(query)
    teachers = result.scalars().all()
    
    teacher_list = []
    for t in teachers:
        # Try to fetch profile
        profile_res = await db.execute(select(TeacherProfile).where(TeacherProfile.user_id == t.id))
        profile = profile_res.scalars().first()
        
        # Get phone from User table (not from profile.title)
        teacher_phone = t.phone
        
        # Search by phone (if phone filter is provided)
        if phone and teacher_phone:
            if phone not in teacher_phone:
                continue
        elif phone and not teacher_phone:
            continue
        
        major_name = "-"
        organization_name = "-"
        if profile and profile.major_id:
            # Join Major -> Organization to get organization name
            from app.models.base import Organization
            major_query = select(Major, Organization).join(
                Organization, Major.organization_id == Organization.id
            ).where(Major.id == profile.major_id)
            major_result = await db.execute(major_query)
            major_row = major_result.first()
            if major_row:
                major_obj, org_obj = major_row
                major_name = major_obj.name
                if org_obj:
                    organization_name = org_obj.name
        
        teacher_list.append({
            "id": t.id,
            "name": t.full_name or t.username,
            "full_name": t.full_name, # Ensure full_name is available
            "username": t.username,
            "email": t.email,
            "phone": teacher_phone, 
            "major": major_name,
            "organization": organization_name,
            "courses": 0, 
            "students": 0, 
            "status": "active" if t.is_active else "inactive",
            "is_active": t.is_active
        })
        
    return teacher_list

@router.post("/teachers")
async def create_teacher(
    *,
    db: AsyncSession = Depends(get_db),
    teacher_in: TeacherCreate,
) -> Any:
    # Use phone as username if not provided
    username = teacher_in.username if teacher_in.username else teacher_in.phone
    
    # Check if username (phone) already exists
    result = await db.execute(select(User).where(User.username == username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Phone number already exists as username")
    
    # Check if phone already exists in User table
    result = await db.execute(select(User).where(User.phone == teacher_in.phone))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Phone number already exists")

    # Use default password if not provided
    password = teacher_in.password if teacher_in.password else "12345678"

    # Create User with teacher role
    user = User(
        username=username,  # Use phone as username
        hashed_password=security.get_password_hash(password),
        full_name=teacher_in.full_name,
        email=teacher_in.email,
        phone=teacher_in.phone,
        role="teacher",
        is_active=teacher_in.is_active
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create Profile
    profile = TeacherProfile(
        user_id=user.id,
        major_id=teacher_in.major_id,
        title=teacher_in.title
    )
    db.add(profile)
    await db.commit()

    return {"id": user.id, "message": "Teacher created successfully", "username": user.username}

@router.put("/teachers/{teacher_id}")
async def update_teacher(
    *,
    db: AsyncSession = Depends(get_db),
    teacher_id: int,
    teacher_in: TeacherUpdate,
) -> Any:
    result = await db.execute(select(User).where(and_(User.id == teacher_id, User.role == "teacher", User.is_active == True)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Update User fields
    if teacher_in.full_name is not None:
        user.full_name = teacher_in.full_name
    if teacher_in.email is not None:
        user.email = teacher_in.email
    if teacher_in.phone is not None:
        user.phone = teacher_in.phone
    if teacher_in.is_active is not None:
        user.is_active = teacher_in.is_active
        
    # Update Profile fields
    profile_res = await db.execute(select(TeacherProfile).where(TeacherProfile.user_id == teacher_id))
    profile = profile_res.scalars().first()
    
    if not profile:
        # Auto create if missing
        profile = TeacherProfile(user_id=teacher_id)
        db.add(profile)
        
    if teacher_in.major_id is not None:
        profile.major_id = teacher_in.major_id
    if teacher_in.title is not None:
        profile.title = teacher_in.title
    
    # Update updated_at timestamp
    from datetime import datetime
    user.updated_at = datetime.utcnow()
        
    await db.commit()
    return {"message": "Teacher updated successfully"}

@router.post("/teachers/{teacher_id}/reset-password")
async def reset_teacher_password(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """重置教师密码为6位随机密码"""
    result = await db.execute(select(User).where(User.id == teacher_id, User.role == "teacher"))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # 生成6位随机密码（包含字母、数字、大小写）
    new_password = generate_random_password(6)
    
    # 更新密码
    user.hashed_password = security.get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    return {
        "message": "Password reset successfully",
        "new_password": new_password,
        "username": user.username
    }

@router.delete("/teachers/{teacher_id}")
async def delete_teacher(
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).where(User.id == teacher_id, User.role == "teacher"))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Delete Profile first
    await db.execute(
        select(TeacherProfile).where(TeacherProfile.user_id == teacher_id)
    )
    # Using raw delete for profile to ensure it's gone
    from sqlalchemy import delete
    await db.execute(delete(TeacherProfile).where(TeacherProfile.user_id == teacher_id))
    
    # 逻辑删除：设置 is_active = False
    user.is_active = False
    user.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Teacher deleted successfully"}

@router.get("/teachers/template")
async def download_teacher_template():
    """下载教师导入模板"""
    headers = ["姓名", "手机号", "邮箱（可选）", "所属专业ID", "职称（可选）"]
    sample_data = [
        {"姓名": "王老师", "手机号": "13900139001", "邮箱（可选）": "wang@example.com", "所属专业ID": "1", "职称（可选）": "教授"},
        {"姓名": "赵老师", "手机号": "13900139002", "邮箱（可选）": "", "所属专业ID": "1", "职称（可选）": ""},
    ]
    
    template_bytes = generate_excel_template(headers, sample_data)
    
    return Response(
        content=template_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=teacher_import_template.xlsx"}
    )

@router.post("/teachers/import")
async def import_teachers(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量导入教师"""
    try:
        # 解析Excel文件
        df = parse_excel_file(file)
        
        # 验证必需的列
        required_columns = ["姓名", "手机号", "所属专业ID"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"缺少必需的列: {', '.join(missing_columns)}"
            )
        
        # 验证数据
        errors = []
        teachers_to_create = []
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # Excel行号
            
            # 获取姓名
            full_name = str(row["姓名"]).strip() if pd.notna(row["姓名"]) else None
            if not full_name:
                errors.append(f"第{row_num}行: 姓名不能为空")
                continue
            
            # 获取手机号
            phone = str(row["手机号"]).strip() if pd.notna(row["手机号"]) else None
            if not phone:
                errors.append(f"第{row_num}行: 手机号不能为空")
                continue
            
            # 检查手机号重复
            if await check_duplicate_phone(db, phone):
                errors.append(f"第{row_num}行: 手机号 '{phone}' 已存在")
                continue
            
            # 用户名使用手机号
            username = phone
            
            # 检查用户名重复
            if await check_duplicate_username(db, username):
                errors.append(f"第{row_num}行: 手机号 '{phone}' 对应的用户名已存在")
                continue
            
            # 获取邮箱（可选）
            email = None
            if "邮箱（可选）" in df.columns and pd.notna(row["邮箱（可选）"]):
                email_str = str(row["邮箱（可选）"]).strip()
                if email_str:
                    # 简单验证邮箱格式
                    if "@" not in email_str:
                        errors.append(f"第{row_num}行: 邮箱格式错误")
                        continue
                    email = email_str
                    # 检查邮箱重复
                    if await check_duplicate_email(db, email):
                        errors.append(f"第{row_num}行: 邮箱 '{email}' 已存在")
                        continue
            
            # 获取所属专业ID
            try:
                major_id = int(row["所属专业ID"])
                # 验证专业是否存在
                major_result = await db.execute(
                    select(Major).where(and_(Major.id == major_id, Major.is_active == True))
                )
                if not major_result.scalars().first():
                    errors.append(f"第{row_num}行: 所属专业ID {major_id} 不存在")
                    continue
            except (ValueError, TypeError):
                errors.append(f"第{row_num}行: 所属专业ID格式错误")
                continue
            
            # 获取职称（可选）
            title = None
            if "职称（可选）" in df.columns and pd.notna(row["职称（可选）"]):
                title = str(row["职称（可选）"]).strip()
            
            teachers_to_create.append({
                "full_name": full_name,
                "username": username,
                "phone": phone,
                "email": email,
                "major_id": major_id,
                "title": title
            })
        
        # 如果有错误，返回错误信息
        if errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "数据验证失败",
                    "errors": errors
                }
            )
        
        # 如果没有任何数据，返回错误
        if not teachers_to_create:
            raise HTTPException(
                status_code=400,
                detail="没有有效的数据可以导入"
            )
        
        # 开始事务，批量创建教师
        created_count = 0
        try:
            for teacher_data in teachers_to_create:
                # 创建用户（默认密码：12345678）
                password_hash = security.get_password_hash("12345678")
                user = User(
                    username=teacher_data["username"],
                    hashed_password=password_hash,
                    full_name=teacher_data["full_name"],
                    email=teacher_data["email"],
                    phone=teacher_data["phone"],
                    role="teacher",
                    is_active=True
                )
                db.add(user)
                await db.flush()  # 获取user.id
                
                # 创建教师档案
                profile = TeacherProfile(
                    user_id=user.id,
                    major_id=teacher_data["major_id"],
                    title=teacher_data["title"]
                )
                db.add(profile)
                created_count += 1
            
            await db.commit()
            
            return {
                "message": f"成功导入 {created_count} 条教师数据",
                "imported_count": created_count,
                "total_count": len(teachers_to_create)
            }
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"导入失败: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"导入过程中发生错误: {str(e)}"
        )

# ============= 班级管理 =============
# ... (保持不变) ...
@router.get("/classes/stats")
async def get_classes_stats(
    db: AsyncSession = Depends(get_db),
) -> Any:
    from sqlalchemy import text
    from app.models.base import StudentProfile
    
    total_result = await db.execute(text("SELECT COUNT(*) FROM sys_class"))
    total_classes = total_result.scalar()
    
    # 只统计有班级关联且有效的学生（class_id 不为 NULL 且 is_active = True）
    student_count_query = select(func.count(StudentProfile.id)).select_from(
        StudentProfile
    ).join(
        User, StudentProfile.user_id == User.id
    ).where(
        and_(
            StudentProfile.class_id.isnot(None),
            User.is_active == True
        )
    )
    student_count_result = await db.execute(student_count_query)
    total_students = student_count_result.scalar() or 0
    
    return {
        "total": total_classes,
        "active": total_classes,
        "inactive": 0,
        "total_students": total_students
    }

@router.get("/classes")
async def get_classes(
    skip: int = 0,
    limit: int = 20,
    name: Optional[str] = None,
    major_id: Optional[int] = None,
    organization_id: Optional[int] = None,
    grade: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    from sqlalchemy import text
    
    # Build query with filters - join with major and organization
    query = """
        SELECT c.*, m.name as major_name, o.name as organization_name, o.id as organization_id
        FROM sys_class c 
        LEFT JOIN major m ON c.major_id = m.id 
        LEFT JOIN organization o ON m.organization_id = o.id 
        WHERE c.is_active = TRUE
    """
    params = {"limit": limit, "skip": skip}
    
    if name:
        query += " AND c.name ILIKE :name"
        params["name"] = f"%{name}%"
    
    if major_id:
        query += " AND c.major_id = :major_id"
        params["major_id"] = major_id
    
    if organization_id:
        query += " AND m.organization_id = :organization_id"
        params["organization_id"] = organization_id
    
    if grade:
        query += " AND c.grade = :grade"
        params["grade"] = grade
    
    # Get total count
    count_query = """
        SELECT COUNT(DISTINCT c.id)
        FROM sys_class c 
        LEFT JOIN major m ON c.major_id = m.id 
        LEFT JOIN organization o ON m.organization_id = o.id 
        WHERE c.is_active = TRUE
    """
    count_params = {}
    if name:
        count_query += " AND c.name ILIKE :name"
        count_params["name"] = f"%{name}%"
    if major_id:
        count_query += " AND c.major_id = :major_id"
        count_params["major_id"] = major_id
    if organization_id:
        count_query += " AND m.organization_id = :organization_id"
        count_params["organization_id"] = organization_id
    if grade:
        count_query += " AND c.grade = :grade"
        count_params["grade"] = grade
    
    count_result = await db.execute(text(count_query), count_params)
    total = count_result.scalar()
    
    query += " ORDER BY c.updated_at DESC NULLS LAST, c.created_at DESC NULLS LAST LIMIT :limit OFFSET :skip"
    
    result = await db.execute(text(query), params)
    classes = result.fetchall()
    
    # Get student counts for all classes in this batch (only active students)
    class_ids = [cls[0] for cls in classes]
    student_counts = {}
    if class_ids:
        from app.models.base import StudentProfile
        # Only count active students (is_active = True)
        student_count_query = select(
            StudentProfile.class_id,
            func.count(StudentProfile.id).label('count')
        ).select_from(
            StudentProfile
        ).join(
            User, StudentProfile.user_id == User.id
        ).where(
            and_(
                StudentProfile.class_id.in_(class_ids),
                User.is_active == True
            )
        ).group_by(StudentProfile.class_id)
        
        student_count_result = await db.execute(student_count_query)
        for row in student_count_result.fetchall():
            student_counts[row[0]] = row[1]
    
    classes_list = []
    for cls in classes:
        class_id = cls[0]
        classes_list.append({
            "id": class_id,
            "name": cls[1],
            "code": cls[5],
            "major_id": cls[2],
            "grade": cls[4],
            "major_name": cls[9] if len(cls) > 9 else None,
            "organization_name": cls[10] if len(cls) > 10 else None,
            "organization_id": cls[11] if len(cls) > 11 else None,
            "is_active": True,
            "student_count": student_counts.get(class_id, 0),  # Get actual student count
            "created_at": cls[7].isoformat() if cls[7] else None,
            "updated_at": cls[8].isoformat() if cls[8] else None
        })
    return {
        "items": classes_list,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.post("/classes")
async def create_class(
    *,
    db: AsyncSession = Depends(get_db),
    class_in: ClassCreate,
) -> Any:
    from sqlalchemy import text
    
    # Validate major_id exists（只检查有效的专业）
    major_check = await db.execute(text("SELECT id FROM major WHERE id = :major_id AND is_active = TRUE"), {"major_id": class_in.major_id})
    if not major_check.fetchone():
        raise HTTPException(status_code=404, detail="Major not found")
    
    result = await db.execute(
        text("""
            INSERT INTO sys_class (name, code, major_id, grade, is_active, created_at, updated_at)
            VALUES (:name, :code, :major_id, :grade, TRUE, NOW(), NOW())
            RETURNING id, name, code, major_id, grade, created_at, updated_at
        """),
        {
            "name": class_in.name,
            "code": class_in.code if class_in.code else None,
            "major_id": class_in.major_id,
            "grade": class_in.grade if class_in.grade else None
        }
    )
    await db.commit()
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create class")
    return {
        "id": row[0],
        "name": row[1],
        "code": row[2],
        "major_id": row[3],
        "grade": row[4],
        "is_active": True,
        "student_count": 0,
        "created_at": row[5].isoformat() if row[5] else None,
        "updated_at": row[6].isoformat() if row[6] else None
    }

@router.put("/classes/{class_id}")
async def update_class(
    *,
    db: AsyncSession = Depends(get_db),
    class_id: int,
    class_in: ClassUpdate,
) -> Any:
    from sqlalchemy import text
    
    # 检查班级是否存在（只检查有效的）
    class_check = await db.execute(text("SELECT id FROM sys_class WHERE id = :class_id AND is_active = TRUE"), {"class_id": class_id})
    if not class_check.fetchone():
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Validate major_id exists if provided（只检查有效的专业）
    if class_in.major_id is not None:
        major_check = await db.execute(text("SELECT id FROM major WHERE id = :major_id AND is_active = TRUE"), {"major_id": class_in.major_id})
        if not major_check.fetchone():
            raise HTTPException(status_code=404, detail="Major not found")
    
    update_fields = []
    params = {"class_id": class_id}
    if class_in.name is not None:
        update_fields.append("name = :name")
        params["name"] = class_in.name
    if class_in.code is not None:
        update_fields.append("code = :code")
        params["code"] = class_in.code
    if class_in.major_id is not None:
        update_fields.append("major_id = :major_id")
        params["major_id"] = class_in.major_id
    if class_in.grade is not None:
        update_fields.append("grade = :grade")
        params["grade"] = class_in.grade
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields.append("updated_at = NOW()")
    
    result = await db.execute(
        text(f"""
            UPDATE sys_class 
            SET {', '.join(update_fields)}
            WHERE id = :class_id AND is_active = TRUE
            RETURNING id, name, code, major_id, grade, created_at, updated_at
        """),
        params
    )
    await db.commit()
    row = result.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Class not found")
    return {
        "id": row[0],
        "name": row[1],
        "code": row[2],
        "major_id": row[3],
        "grade": row[4],
        "is_active": True,
        "student_count": 0,
        "created_at": row[5].isoformat() if row[5] else None,
        "updated_at": row[6].isoformat() if row[6] else None
    }

@router.delete("/classes/{class_id}")
async def delete_class(
    class_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # 检查班级是否存在
    class_result = await db.execute(select(Class).where(Class.id == class_id))
    class_obj = class_result.scalars().first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # 检查是否有有效的学生关联
    students_result = await db.execute(
        select(func.count(StudentProfile.id))
        .join(User, StudentProfile.user_id == User.id)
        .where(
            and_(
                StudentProfile.class_id == class_id,
                User.is_active == True
            )
        )
    )
    student_count = students_result.scalar() or 0
    
    if student_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete class: There are {student_count} active student(s) in this class. Please delete or reassign the students first.",
            headers={"X-Error-Code": "CLASS_HAS_STUDENTS"}
        )
    
    # 逻辑删除：设置 is_active = False
    class_obj.is_active = False
    class_obj.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Class deleted successfully"}

@router.get("/classes/template")
async def download_class_template():
    """下载班级导入模板"""
    headers = ["班级名称", "所属专业ID", "年级", "班级代码（可选）"]
    sample_data = [
        {"班级名称": "2024级计算机1班", "所属专业ID": "1", "年级": "2024", "班级代码（可选）": "CS202401"},
        {"班级名称": "2024级软件1班", "所属专业ID": "2", "年级": "2024", "班级代码（可选）": ""},
    ]
    
    template_bytes = generate_excel_template(headers, sample_data)
    
    return Response(
        content=template_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=class_import_template.xlsx"}
    )

@router.post("/classes/import")
async def import_classes(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量导入班级"""
    try:
        # 解析Excel文件
        df = parse_excel_file(file)
        
        # 验证必需的列
        required_columns = ["班级名称", "所属专业ID", "年级"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"缺少必需的列: {', '.join(missing_columns)}"
            )
        
        # 验证数据
        errors = []
        classes_to_create = []
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # Excel行号
            
            # 获取班级名称
            name = str(row["班级名称"]).strip() if pd.notna(row["班级名称"]) else None
            if not name:
                errors.append(f"第{row_num}行: 班级名称不能为空")
                continue
            
            # 检查重复
            if await check_duplicate_class_name(db, name):
                errors.append(f"第{row_num}行: 班级名称 '{name}' 已存在")
                continue
            
            # 获取所属专业ID
            try:
                major_id = int(row["所属专业ID"])
                # 验证专业是否存在
                major_result = await db.execute(
                    select(Major).where(and_(Major.id == major_id, Major.is_active == True))
                )
                if not major_result.scalars().first():
                    errors.append(f"第{row_num}行: 所属专业ID {major_id} 不存在")
                    continue
            except (ValueError, TypeError):
                errors.append(f"第{row_num}行: 所属专业ID格式错误")
                continue
            
            # 获取年级
            grade = str(row["年级"]).strip() if pd.notna(row["年级"]) else None
            if not grade:
                errors.append(f"第{row_num}行: 年级不能为空")
                continue
            
            # 获取班级代码（可选）
            code = None
            if "班级代码（可选）" in df.columns and pd.notna(row["班级代码（可选）"]):
                code = str(row["班级代码（可选）"]).strip()
            
            classes_to_create.append({
                "name": name,
                "major_id": major_id,
                "grade": grade,
                "code": code
            })
        
        # 如果有错误，返回错误信息
        if errors:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "数据验证失败",
                    "errors": errors
                }
            )
        
        # 如果没有任何数据，返回错误
        if not classes_to_create:
            raise HTTPException(
                status_code=400,
                detail="没有有效的数据可以导入"
            )
        
        # 开始事务，批量创建班级
        created_count = 0
        try:
            for class_data in classes_to_create:
                class_obj = Class(
                    name=class_data["name"],
                    major_id=class_data["major_id"],
                    grade=class_data["grade"],
                    code=class_data["code"]
                )
                db.add(class_obj)
                created_count += 1
            
            await db.commit()
            
            return {
                "message": f"成功导入 {created_count} 条班级数据",
                "imported_count": created_count,
                "total_count": len(classes_to_create)
            }
        except Exception as e:
            await db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"导入失败: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"导入过程中发生错误: {str(e)}"
        )

@router.get("/classes/{class_id}/students")
async def get_class_students(
    class_id: int,
    skip: int = 0,
    limit: int = 25,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取指定班级的学生列表（只返回有效学生）"""
    # 检查班级是否存在
    class_result = await db.execute(select(Class).where(Class.id == class_id))
    class_obj = class_result.scalars().first()
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # 查询该班级的有效学生
    conditions = [
        User.role == "student",
        User.is_active == True,
        StudentProfile.class_id == class_id
    ]
    
    # 获取总数
    count_query = select(func.count(User.id)).select_from(
        User
    ).join(
        StudentProfile, User.id == StudentProfile.user_id
    ).where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # 获取分页数据
    query = select(User).select_from(
        User
    ).join(
        StudentProfile, User.id == StudentProfile.user_id
    ).where(and_(*conditions)).order_by(
        User.updated_at.desc().nullslast(), 
        User.created_at.desc().nullslast()
    ).offset(skip).limit(limit)
    
    result = await db.execute(query)
    students = result.scalars().all()
    
    student_list = []
    for s in students:
        profile_res = await db.execute(select(StudentProfile).where(StudentProfile.user_id == s.id))
        profile = profile_res.scalars().first()
        
        student_list.append({
            "id": s.id,
            "username": s.username,
            "full_name": s.full_name,
            "email": s.email,
            "phone": s.phone,
            "is_active": s.is_active,
            "student_no": profile.student_no if profile else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    
    return {
        "items": student_list,
        "total": total,
        "skip": skip,
        "limit": limit,
        "class_id": class_id,
        "class_name": class_obj.name
    }

# ============= 财务管理 =============
@router.get("/finance/orders")
async def get_orders(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    return []

@router.get("/finance/stats")
async def get_finance_stats(
    db: AsyncSession = Depends(get_db),
) -> Any:
    return {
        "total_orders": 0,
        "paid_orders": 0,
        "pending_orders": 0,
        "paid_amount": 0,
        "pending_amount": 0,
        "total_amount": 0
    }

# 用户管理
@router.get("/users")
async def get_all_users(
    name: Optional[str] = None,
    username: Optional[str] = None,
    phone: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取所有用户（包括管理员、教师、学生）"""
    query = select(User)
    
    # 应用筛选条件
    filters = []
    if name:
        filters.append(User.full_name.ilike(f"%{name}%"))
    if username:
        filters.append(User.username.ilike(f"%{username}%"))
    if phone:
        filters.append(User.phone.ilike(f"%{phone}%"))
    
    if filters:
        query = query.where(and_(*filters))
    
    # 执行查询
    result = await db.execute(query)
    users = result.scalars().all()
    
    # 返回结果
    return {
        "items": [
            {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "is_active": user.is_active
            }
            for user in users
        ],
        "total": len(users)
    }

@router.post("/users/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """重置用户密码为111111"""
    # 查询用户
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 重置密码为111111
    new_password = "111111"
    user.hashed_password = security.get_password_hash(new_password)
    
    await db.commit()
    
    return {
        "message": "Password reset successfully",
        "new_password": new_password
    }
