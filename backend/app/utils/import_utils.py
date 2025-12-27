"""
批量导入工具函数
"""
import pandas as pd
import io
from typing import List, Dict, Any, Optional, Tuple
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_


async def parse_excel_file(file: UploadFile) -> pd.DataFrame:
    """解析Excel文件"""
    # 读取文件内容
    file_content = await file.read()
    
    # 检查文件扩展名
    filename = file.filename or ""
    if filename.endswith('.xlsx'):
        df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
    elif filename.endswith('.xls'):
        df = pd.read_excel(io.BytesIO(file_content), engine='xlrd')
    elif filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8-sig')
    else:
        raise HTTPException(
            status_code=400,
            detail="不支持的文件格式。仅支持 .xlsx, .xls, .csv 格式"
        )
    
    # 清理数据：去除空行
    df = df.dropna(how='all')
    
    # 清理列名：去除前后空格
    df.columns = df.columns.str.strip()
    
    return df


def generate_excel_template(headers: List[str], sample_data: Optional[List[Dict[str, Any]]] = None) -> bytes:
    """生成Excel模板文件"""
    # 创建DataFrame
    if sample_data:
        df = pd.DataFrame(sample_data)
    else:
        df = pd.DataFrame(columns=headers)
    
    # 确保列顺序正确
    df = df.reindex(columns=headers, fill_value='')
    
    # 转换为Excel字节流
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Sheet1')
    
    output.seek(0)
    return output.getvalue()


async def check_duplicate_username(db: AsyncSession, username: str, exclude_id: Optional[int] = None) -> bool:
    """检查用户名是否重复"""
    from app.models.base import User
    
    query = select(User).where(User.username == username)
    if exclude_id:
        query = query.where(User.id != exclude_id)
    
    result = await db.execute(query)
    return result.scalars().first() is not None


async def check_duplicate_email(db: AsyncSession, email: str, exclude_id: Optional[int] = None) -> bool:
    """检查邮箱是否重复"""
    from app.models.base import User
    
    if not email or pd.isna(email):
        return False
    
    query = select(User).where(User.email == email)
    if exclude_id:
        query = query.where(User.id != exclude_id)
    
    result = await db.execute(query)
    return result.scalars().first() is not None


async def check_duplicate_phone(db: AsyncSession, phone: str, exclude_id: Optional[int] = None) -> bool:
    """检查手机号是否重复"""
    from app.models.base import User
    
    if not phone:
        return False
    
    # 处理pandas的NaN值
    try:
        if pd.isna(phone):
            return False
    except:
        pass
    
    query = select(User).where(User.phone == phone)
    if exclude_id:
        query = query.where(User.id != exclude_id)
    
    result = await db.execute(query)
    return result.scalars().first() is not None


async def check_duplicate_student_no(db: AsyncSession, student_no: str, exclude_id: Optional[int] = None) -> bool:
    """检查学号是否重复"""
    from app.models.base import StudentProfile
    
    if not student_no or pd.isna(student_no):
        return False
    
    query = select(StudentProfile).where(StudentProfile.student_no == student_no)
    if exclude_id:
        query = query.join(User, StudentProfile.user_id == User.id).where(User.id != exclude_id)
    
    result = await db.execute(query)
    return result.scalars().first() is not None


async def check_duplicate_organization_name(db: AsyncSession, name: str, exclude_id: Optional[int] = None) -> bool:
    """检查组织名称是否重复"""
    from app.models.base import Organization
    
    query = select(Organization).where(and_(Organization.name == name, Organization.is_active == True))
    if exclude_id:
        query = query.where(Organization.id != exclude_id)
    
    result = await db.execute(query)
    return result.scalars().first() is not None


async def check_duplicate_major_name(db: AsyncSession, name: str, exclude_id: Optional[int] = None) -> bool:
    """检查专业名称是否重复"""
    from app.models.base import Major
    
    query = select(Major).where(and_(Major.name == name, Major.is_active == True))
    if exclude_id:
        query = query.where(Major.id != exclude_id)
    
    result = await db.execute(query)
    return result.scalars().first() is not None


async def check_duplicate_class_name(db: AsyncSession, name: str, exclude_id: Optional[int] = None) -> bool:
    """检查班级名称是否重复"""
    from app.models.base import Class
    
    query = select(Class).where(and_(Class.name == name, Class.is_active == True))
    if exclude_id:
        query = query.where(Class.id != exclude_id)
    
    result = await db.execute(query)
    return result.scalars().first() is not None

