from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
import pandas as pd

from app.db.session import get_db
from app.models.base import Major, Organization, Class, TeacherProfile, User
from app.schemas import major as major_schemas
from app.utils.import_utils import parse_excel_file, generate_excel_template, check_duplicate_major_name

router = APIRouter()

@router.get("/stats")
async def get_majors_stats(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取专业统计数据"""
    # Get total majors count
    total_result = await db.execute(select(func.count(Major.id)))
    total_majors = total_result.scalar()
    
    # Calculate average tuition
    avg_tuition_result = await db.execute(select(func.avg(Major.tuition_fee)))
    avg_tuition = avg_tuition_result.scalar() or 0
    
    # Calculate average duration
    avg_duration_result = await db.execute(select(func.avg(Major.duration_years)))
    avg_duration = avg_duration_result.scalar() or 4
    
    # Calculate unique organizations count (distinct organization_id from majors)
    unique_orgs_result = await db.execute(
        select(func.count(func.distinct(Major.organization_id))).where(Major.organization_id.isnot(None))
    )
    unique_organizations = unique_orgs_result.scalar() or 0
    
    return {
        "total": total_majors,
        "avg_tuition": float(avg_tuition),
        "avg_duration": float(avg_duration) if avg_duration else 4.0,
        "departments": unique_organizations
    }

@router.get("/")
async def read_majors(
    skip: int = 0,
    limit: int = 20,
    name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Build query conditions
    conditions = [Major.is_active == True]  # 只查询有效的专业
    
    # Search by name
    if name:
        conditions.append(Major.name.ilike(f"%{name}%"))
    
    # Get total count
    count_query = select(func.count(Major.id)).where(and_(*conditions))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Execute query with pagination and ordering by updated_at DESC
    query = select(Major, Organization).join(Organization, Major.organization_id == Organization.id, isouter=True).where(and_(*conditions)).order_by(Major.updated_at.desc().nullslast(), Major.created_at.desc().nullslast()).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()
    
    # Build response with organization name
    items = []
    for major, org in rows:
        major_dict = major_schemas.Major.from_orm(major).dict()
        major_dict["organization_name"] = org.name if org else None
        items.append(major_dict)
    
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/{major_id}", response_model=major_schemas.Major)
async def get_major(
    major_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取专业详情"""
    result = await db.execute(select(Major).where(and_(Major.id == major_id, Major.is_active == True)))
    major = result.scalars().first()
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    return major

@router.post("/", response_model=major_schemas.Major)
async def create_major(
    *,
    db: AsyncSession = Depends(get_db),
    major_in: major_schemas.MajorCreate,
) -> Any:
    """创建专业"""
    # 验证组织是否存在（只检查有效的）
    if major_in.organization_id:
        org_check = await db.execute(select(Organization).where(and_(Organization.id == major_in.organization_id, Organization.is_active == True)))
        if not org_check.scalars().first():
            raise HTTPException(status_code=404, detail="Organization not found")
    
    major = Major(
        name=major_in.name,
        description=major_in.description,
        tuition_fee=major_in.tuition_fee,
        duration_years=major_in.duration_years,
        organization_id=major_in.organization_id
    )
    db.add(major)
    await db.commit()
    await db.refresh(major)
    return major

@router.put("/{major_id}", response_model=major_schemas.Major)
async def update_major(
    *,
    db: AsyncSession = Depends(get_db),
    major_id: int,
    major_in: major_schemas.MajorUpdate,
) -> Any:
    """更新专业（只更新有效的）"""
    result = await db.execute(select(Major).where(and_(Major.id == major_id, Major.is_active == True)))
    major = result.scalars().first()
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    
    update_data = major_in.dict(exclude_unset=True)
    
    # 如果更新了 organization_id，验证组织是否存在（只检查有效的）
    if "organization_id" in update_data and update_data["organization_id"]:
        org_check = await db.execute(select(Organization).where(and_(Organization.id == update_data["organization_id"], Organization.is_active == True)))
        if not org_check.scalars().first():
            raise HTTPException(status_code=404, detail="Organization not found")
    
    for field, value in update_data.items():
        setattr(major, field, value)
    
    # Update updated_at timestamp
    major.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(major)
    return major

@router.delete("/{major_id}")
async def delete_major(
    major_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除专业（逻辑删除）"""
    result = await db.execute(select(Major).where(and_(Major.id == major_id, Major.is_active == True)))
    major = result.scalars().first()
    if not major:
        raise HTTPException(status_code=404, detail="Major not found")
    
    # 检查是否有有效班级关联
    classes_result = await db.execute(
        select(func.count(Class.id)).where(and_(Class.major_id == major_id, Class.is_active == True))
    )
    class_count = classes_result.scalar() or 0
    
    if class_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete major: There are {class_count} class(es) associated with this major. Please delete or reassign the classes first.",
            headers={"X-Error-Code": "MAJOR_HAS_CLASSES"}
        )
    
    # 检查是否有有效的教师关联
    teachers_result = await db.execute(
        select(func.count(TeacherProfile.id))
        .join(User, TeacherProfile.user_id == User.id)
        .where(
            and_(
                TeacherProfile.major_id == major_id,
                User.is_active == True
            )
        )
    )
    teacher_count = teachers_result.scalar() or 0
    
    if teacher_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete major: There are {teacher_count} active teacher(s) associated with this major. Please delete or reassign the teachers first.",
            headers={"X-Error-Code": "MAJOR_HAS_TEACHERS"}
        )
    
    # 逻辑删除：设置 is_active = False
    major.is_active = False
    major.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Major deleted successfully"}

@router.get("/template")
async def download_major_template():
    """下载专业导入模板"""
    headers = ["专业名称", "所属组织ID", "学费", "学制（年）", "专业描述（可选）"]
    sample_data = [
        {"专业名称": "计算机科学与技术", "所属组织ID": "1", "学费": "5000.00", "学制（年）": "4", "专业描述（可选）": "计算机相关专业"},
        {"专业名称": "软件工程", "所属组织ID": "1", "学费": "5500.00", "学制（年）": "4", "专业描述（可选）": ""},
    ]
    
    template_bytes = generate_excel_template(headers, sample_data)
    
    return Response(
        content=template_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=major_import_template.xlsx"}
    )

@router.post("/import")
async def import_majors(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量导入专业"""
    try:
        # 解析Excel文件
        df = parse_excel_file(file)
        
        # 验证必需的列
        required_columns = ["专业名称", "所属组织ID", "学费", "学制（年）"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"缺少必需的列: {', '.join(missing_columns)}"
            )
        
        # 验证数据
        errors = []
        majors_to_create = []
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # Excel行号
            
            # 获取专业名称
            name = str(row["专业名称"]).strip() if pd.notna(row["专业名称"]) else None
            if not name:
                errors.append(f"第{row_num}行: 专业名称不能为空")
                continue
            
            # 检查重复
            if await check_duplicate_major_name(db, name):
                errors.append(f"第{row_num}行: 专业名称 '{name}' 已存在")
                continue
            
            # 获取所属组织ID
            try:
                organization_id = int(row["所属组织ID"])
                # 验证组织是否存在
                org_result = await db.execute(
                    select(Organization).where(and_(Organization.id == organization_id, Organization.is_active == True))
                )
                if not org_result.scalars().first():
                    errors.append(f"第{row_num}行: 所属组织ID {organization_id} 不存在")
                    continue
            except (ValueError, TypeError):
                errors.append(f"第{row_num}行: 所属组织ID格式错误")
                continue
            
            # 获取学费
            try:
                tuition_fee = float(row["学费"])
                if tuition_fee < 0:
                    errors.append(f"第{row_num}行: 学费不能为负数")
                    continue
            except (ValueError, TypeError):
                errors.append(f"第{row_num}行: 学费格式错误")
                continue
            
            # 获取学制
            try:
                duration_years = int(row["学制（年）"])
                if duration_years <= 0:
                    errors.append(f"第{row_num}行: 学制必须大于0")
                    continue
            except (ValueError, TypeError):
                errors.append(f"第{row_num}行: 学制格式错误")
                continue
            
            # 获取专业描述（可选）
            description = None
            if "专业描述（可选）" in df.columns and pd.notna(row["专业描述（可选）"]):
                description = str(row["专业描述（可选）"]).strip()
            
            majors_to_create.append({
                "name": name,
                "organization_id": organization_id,
                "tuition_fee": tuition_fee,
                "duration_years": duration_years,
                "description": description
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
        if not majors_to_create:
            raise HTTPException(
                status_code=400,
                detail="没有有效的数据可以导入"
            )
        
        # 开始事务，批量创建专业
        created_count = 0
        try:
            for major_data in majors_to_create:
                major = Major(
                    name=major_data["name"],
                    organization_id=major_data["organization_id"],
                    tuition_fee=major_data["tuition_fee"],
                    duration_years=major_data["duration_years"],
                    description=major_data["description"]
                )
                db.add(major)
                created_count += 1
            
            await db.commit()
            
            return {
                "message": f"成功导入 {created_count} 条专业数据",
                "imported_count": created_count,
                "total_count": len(majors_to_create)
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

