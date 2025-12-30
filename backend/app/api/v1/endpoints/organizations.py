from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_
from pydantic import BaseModel
import pandas as pd
import io

from app.db.session import get_db
from app.models.base import Organization, Major, Class, StudentProfile, User
from app.utils.import_utils import parse_excel_file, generate_excel_template, check_duplicate_organization_name
from app.core.config import settings
from datetime import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# 获取当前用户
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """从token获取当前用户"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

# 辅助函数：获取用户名称
async def get_user_name(user_id: Optional[int], db: AsyncSession) -> Optional[str]:
    """根据用户ID获取用户名称"""
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    return user.full_name or user.username if user else None

class OrganizationCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None

def get_all_descendant_ids(org_id: int, org_dict: dict) -> set:
    """递归获取所有子节点ID（包括子节点的子节点）"""
    descendant_ids = {org_id}
    for child_id, child_data in org_dict.items():
        if child_data["parent_id"] == org_id:
            descendant_ids.add(child_id)
            # 递归获取子节点的子节点
            descendant_ids.update(get_all_descendant_ids(child_id, org_dict))
    return descendant_ids

async def calculate_org_stats(org_id: int, all_descendant_ids: set, db: AsyncSession) -> dict:
    """计算组织及其所有子节点的统计数据"""
    # 统计有效专业数量（包含子节点）
    majors_query = select(func.count(Major.id)).where(and_(Major.organization_id.in_(all_descendant_ids), Major.is_active == True))
    majors_result = await db.execute(majors_query)
    majors_count = majors_result.scalar() or 0
    
    # 统计有效班级数量（包含子节点）- 通过专业关联
    classes_query = select(func.count(func.distinct(Class.id))).select_from(Class).join(
        Major, Class.major_id == Major.id
    ).where(and_(Major.organization_id.in_(all_descendant_ids), Major.is_active == True, Class.is_active == True))
    classes_result = await db.execute(classes_query)
    classes_count = classes_result.scalar() or 0
    
    # 统计有效学生人数（包含子节点）- 通过班级 -> 专业 -> 组织关联
    from app.models.base import User
    students_query = select(func.count(StudentProfile.id)).select_from(StudentProfile).join(
        Class, StudentProfile.class_id == Class.id
    ).join(
        Major, Class.major_id == Major.id
    ).join(
        User, StudentProfile.user_id == User.id
    ).where(and_(Major.organization_id.in_(all_descendant_ids), Major.is_active == True, Class.is_active == True, User.is_active == True))
    students_result = await db.execute(students_query)
    students_count = students_result.scalar() or 0
    
    return {
        "majors_count": majors_count,
        "classes_count": classes_count,
        "students_count": students_count
    }

@router.get("/")
async def get_organizations(
    include_inactive: bool = False,  # 默认不包含已删除的
    skip: int = 0,
    limit: int = 1000,
    search: Optional[str] = None,  # 搜索组织名称
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取所有组织（树状结构）"""
    # Get all organizations ordered by updated_at DESC
    # 过滤已删除的组织
    query = select(Organization)
    if not include_inactive:
        query = query.where(Organization.is_active == True)
    # 如果提供了搜索参数，按组织名称筛选
    if search:
        query = query.where(Organization.name.ilike(f"%{search}%"))
    query = query.order_by(Organization.updated_at.desc().nullslast(), Organization.created_at.desc().nullslast())
    result = await db.execute(query)
    all_orgs = result.scalars().all()
    
    # Build tree structure
    org_dict = {org.id: {
        "id": org.id,
        "name": org.name,
        "parent_id": org.parent_id,
        "created_by": org.created_by,
        "updated_by": org.updated_by,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "updated_at": org.updated_at.isoformat() if org.updated_at else None,
        "children": []
    } for org in all_orgs}
    
    # 当有搜索条件时，需要包含所有匹配节点及其父节点路径
    if search and all_orgs:
        # 获取所有匹配节点的ID
        matched_ids = {org.id for org in all_orgs}
        
        # 查找所有匹配节点的父节点路径
        async def get_parent_path(org_id: int, existing_dict: dict) -> list:
            """递归获取节点的所有父节点ID"""
            path = []
            current_id = org_id
            # 从已有的字典中查找
            if current_id in existing_dict:
                parent_id = existing_dict[current_id]["parent_id"]
                while parent_id is not None:
                    path.append(parent_id)
                    if parent_id in existing_dict:
                        parent_id = existing_dict[parent_id]["parent_id"]
                    else:
                        # 从数据库查询父节点
                        parent_result = await db.execute(
                            select(Organization).where(and_(Organization.id == parent_id, Organization.is_active == True))
                        )
                        parent_org = parent_result.scalars().first()
                        if parent_org:
                            existing_dict[parent_org.id] = {
                                "id": parent_org.id,
                                "name": parent_org.name,
                                "parent_id": parent_org.parent_id,
                                "created_by": parent_org.created_by,
                                "updated_by": parent_org.updated_by,
                                "created_at": parent_org.created_at.isoformat() if parent_org.created_at else None,
                                "updated_at": parent_org.updated_at.isoformat() if parent_org.updated_at else None,
                                "children": []
                            }
                            parent_id = parent_org.parent_id
                        else:
                            break
            return path
        
        # 收集所有需要的父节点
        all_needed_ids = set(matched_ids)
        for org_id in matched_ids:
            parent_path = await get_parent_path(org_id, org_dict)
            all_needed_ids.update(parent_path)
        
        # 补充缺失的父节点
        missing_ids = all_needed_ids - set(org_dict.keys())
        if missing_ids:
            missing_result = await db.execute(
                select(Organization).where(and_(Organization.id.in_(missing_ids), Organization.is_active == True))
            )
            missing_orgs = missing_result.scalars().all()
            for org in missing_orgs:
                org_dict[org.id] = {
                    "id": org.id,
                    "name": org.name,
                    "parent_id": org.parent_id,
                    "created_by": org.created_by,
                    "updated_by": org.updated_by,
                    "created_at": org.created_at.isoformat() if org.created_at else None,
                    "updated_at": org.updated_at.isoformat() if org.updated_at else None,
                    "children": []
                }
    
    root_nodes = []
    for org_id, org_data in org_dict.items():
        if org_data["parent_id"] is None:
            root_nodes.append(org_data)
        else:
            parent = org_dict.get(org_data["parent_id"])
            if parent:
                parent["children"].append(org_data)
    
    # 为每个节点计算统计数据（包含子节点）并获取用户名称
    async def add_stats_to_tree(nodes):
        for node in nodes:
            # 获取该节点及其所有子节点的ID
            all_descendant_ids = get_all_descendant_ids(node["id"], org_dict)
            # 计算统计数据
            stats = await calculate_org_stats(node["id"], all_descendant_ids, db)
            node.update(stats)
            
            # 获取创建者和更新者名称
            node["creator_name"] = await get_user_name(node.get("created_by"), db)
            node["updater_name"] = await get_user_name(node.get("updated_by"), db)
            
            # 递归处理子节点
            if node["children"]:
                await add_stats_to_tree(node["children"])
    
    await add_stats_to_tree(root_nodes)
    
    # Flatten tree for pagination (depth-first traversal)
    def flatten_tree(nodes, result_list):
        for node in nodes:
            result_list.append({
                "id": node["id"],
                "name": node["name"],
                "parent_id": node["parent_id"],
                "level": 0,  # Will be calculated
                "majors_count": node.get("majors_count", 0),
                "classes_count": node.get("classes_count", 0),
                "students_count": node.get("students_count", 0),
                "created_by": node.get("created_by"),
                "updated_by": node.get("updated_by"),
                "creator_name": node.get("creator_name"),
                "updater_name": node.get("updater_name"),
                "created_at": node.get("created_at"),
                "updated_at": node.get("updated_at")
            })
            if node["children"]:
                flatten_tree(node["children"], result_list)
    
    flattened = []
    flatten_tree(root_nodes, flattened)
    
    # Calculate levels
    level_map = {}
    for item in flattened:
        if item["parent_id"] is None:
            level_map[item["id"]] = 0
        else:
            level_map[item["id"]] = level_map.get(item["parent_id"], 0) + 1
        item["level"] = level_map[item["id"]]
    
    total = len(flattened)
    paginated_items = flattened[skip:skip + limit]
    
    return {
        "items": paginated_items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "tree": root_nodes  # Full tree structure with stats
    }

@router.get("/tree")
async def get_organization_tree(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取完整的组织树结构（包含统计数据）"""
    result = await db.execute(select(Organization).where(Organization.is_active == True).order_by(Organization.id))
    all_orgs = result.scalars().all()
    
    org_dict = {org.id: {
        "id": org.id,
        "name": org.name,
        "parent_id": org.parent_id,
        "children": []
    } for org in all_orgs}
    
    root_nodes = []
    for org_id, org_data in org_dict.items():
        if org_data["parent_id"] is None:
            root_nodes.append(org_data)
        else:
            parent = org_dict.get(org_data["parent_id"])
            if parent:
                parent["children"].append(org_data)
    
    # 为每个节点计算统计数据（包含子节点）
    async def add_stats_to_tree(nodes):
        for node in nodes:
            # 获取该节点及其所有子节点的ID
            all_descendant_ids = get_all_descendant_ids(node["id"], org_dict)
            # 计算统计数据
            stats = await calculate_org_stats(node["id"], all_descendant_ids, db)
            node.update(stats)
            # 递归处理子节点
            if node["children"]:
                await add_stats_to_tree(node["children"])
    
    await add_stats_to_tree(root_nodes)
    
    return {"tree": root_nodes}

@router.get("/template")
async def download_organization_template():
    """下载组织导入模板"""
    headers = ["组织名称", "上级组织ID（可选）"]
    sample_data = [
        {"组织名称": "示例组织1", "上级组织ID（可选）": ""},
        {"组织名称": "示例组织2", "上级组织ID（可选）": "1"},
    ]
    
    template_bytes = generate_excel_template(headers, sample_data)
    
    return Response(
        content=template_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=organization_import_template.xlsx"}
    )

@router.post("/import")
async def import_organizations(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """批量导入组织"""
    try:
        # 解析Excel文件（注意：parse_excel_file是异步函数）
        df = await parse_excel_file(file)
        
        # 验证必需的列
        required_columns = ["组织名称"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"缺少必需的列: {', '.join(missing_columns)}"
            )
        
        # 验证数据
        errors = []
        organizations_to_create = []
        
        for idx, row in df.iterrows():
            row_num = idx + 2  # Excel行号（从2开始，第1行是标题）
            
            # 获取组织名称
            name = str(row["组织名称"]).strip() if pd.notna(row["组织名称"]) else None
            
            if not name:
                errors.append(f"第{row_num}行: 组织名称不能为空")
                continue
            
            # 检查重复
            if await check_duplicate_organization_name(db, name):
                errors.append(f"第{row_num}行: 组织名称 '{name}' 已存在")
                continue
            
            # 获取上级组织ID
            parent_id = None
            if "上级组织ID（可选）" in df.columns and pd.notna(row["上级组织ID（可选）"]):
                try:
                    parent_id = int(row["上级组织ID（可选）"])
                    # 验证上级组织是否存在
                    parent_result = await db.execute(
                        select(Organization).where(and_(Organization.id == parent_id, Organization.is_active == True))
                    )
                    if not parent_result.scalars().first():
                        errors.append(f"第{row_num}行: 上级组织ID {parent_id} 不存在")
                        continue
                except (ValueError, TypeError):
                    errors.append(f"第{row_num}行: 上级组织ID格式错误")
                    continue
            
            organizations_to_create.append({
                "name": name,
                "parent_id": parent_id
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
        if not organizations_to_create:
            raise HTTPException(
                status_code=400,
                detail="没有有效的数据可以导入"
            )
        
        # 检查根节点约束（只能有一个根节点）
        existing_root = await db.execute(
            select(Organization).where(and_(Organization.parent_id.is_(None), Organization.is_active == True))
        )
        if existing_root.scalars().first():
            # 检查要导入的数据中是否有根节点
            root_count = sum(1 for org in organizations_to_create if org["parent_id"] is None)
            if root_count > 0:
                raise HTTPException(
                    status_code=400,
                    detail="系统中已存在根节点，不能导入新的根节点"
                )
        
        # 开始事务，批量创建组织
        created_count = 0
        try:
            for org_data in organizations_to_create:
                org = Organization(
                    name=org_data["name"],
                    parent_id=org_data["parent_id"],
                    created_by=1,  # 批量导入默认使用管理员ID
                    updated_by=1
                )
                db.add(org)
                created_count += 1
            
            await db.commit()
            
            return {
                "message": f"成功导入 {created_count} 条组织数据",
                "imported_count": created_count,
                "total_count": len(organizations_to_create)
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

@router.get("/{org_id}")
async def get_organization(
    org_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取组织详情（只返回有效的）"""
    result = await db.execute(select(Organization).where(and_(Organization.id == org_id, Organization.is_active == True)))
    org = result.scalars().first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # 获取统计数据
    org_dict = {org.id: {"id": org.id, "parent_id": org.parent_id}}
    all_descendant_ids = get_all_descendant_ids(org.id, org_dict)
    stats = await calculate_org_stats(org.id, all_descendant_ids, db)
    
    return {
        "id": org.id,
        "name": org.name,
        "parent_id": org.parent_id,
        "majors_count": stats["majors_count"],
        "classes_count": stats["classes_count"],
        "students_count": stats["students_count"],
        "created_by": org.created_by,
        "updated_by": org.updated_by,
        "creator_name": await get_user_name(org.created_by, db),
        "updater_name": await get_user_name(org.updated_by, db),
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "updated_at": org.updated_at.isoformat() if org.updated_at else None
    }

@router.post("/")
async def create_organization(
    *,
    db: AsyncSession = Depends(get_db),
    org_in: OrganizationCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """创建组织"""
    # Check if parent exists (if parent_id is provided，只检查有效的)
    if org_in.parent_id:
        parent_result = await db.execute(select(Organization).where(and_(Organization.id == org_in.parent_id, Organization.is_active == True)))
        parent = parent_result.scalars().first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent organization not found")
    
    # Check if root already exists (if creating root，只检查有效的)
    if org_in.parent_id is None:
        root_result = await db.execute(select(Organization).where(and_(Organization.parent_id.is_(None), Organization.is_active == True)))
        existing_root = root_result.scalars().first()
        if existing_root:
            raise HTTPException(status_code=400, detail="Root organization already exists. Only one root node is allowed.")
    
    org = Organization(
        name=org_in.name,
        parent_id=org_in.parent_id,
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    
    return {
        "id": org.id,
        "name": org.name,
        "parent_id": org.parent_id
    }

@router.put("/{org_id}")
async def update_organization(
    *,
    db: AsyncSession = Depends(get_db),
    org_id: int,
    org_in: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """更新组织（只更新有效的）"""
    result = await db.execute(select(Organization).where(and_(Organization.id == org_id, Organization.is_active == True)))
    org = result.scalars().first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Prevent circular reference
    if org_in.parent_id == org_id:
        raise HTTPException(status_code=400, detail="Cannot set parent to itself")
    
    # Check if parent exists (if parent_id is being updated，只检查有效的)
    if org_in.parent_id is not None:
        parent_result = await db.execute(select(Organization).where(and_(Organization.id == org_in.parent_id, Organization.is_active == True)))
        parent = parent_result.scalars().first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent organization not found")
        
        # Check if this would create a cycle（只检查有效的组织）
        current_parent_id = org_in.parent_id
        visited = {org_id}
        while current_parent_id:
            if current_parent_id in visited:
                raise HTTPException(status_code=400, detail="Cannot create circular reference")
            visited.add(current_parent_id)
            parent_result = await db.execute(select(Organization).where(and_(Organization.id == current_parent_id, Organization.is_active == True)))
            parent = parent_result.scalars().first()
            if not parent:
                break
            current_parent_id = parent.parent_id
    
    # Check root constraint (only if parent_id is being explicitly updated to None)
    # Use hasattr to check if parent_id was actually provided in the request
    if hasattr(org_in, '__fields_set__') and 'parent_id' in org_in.__fields_set__:
        if org_in.parent_id is None and org.parent_id is not None:
            # Moving to root - check if root already exists
            root_result = await db.execute(select(Organization).where(and_(Organization.parent_id.is_(None), Organization.id != org_id, Organization.is_active == True)))
            existing_root = root_result.scalars().first()
            if existing_root:
                raise HTTPException(status_code=400, detail="Root organization already exists. Only one root node is allowed.")
    
    if org_in.name is not None:
        org.name = org_in.name
    # Only update parent_id if it was explicitly provided
    if hasattr(org_in, '__fields_set__') and 'parent_id' in org_in.__fields_set__:
        if org_in.parent_id is not None:
            org.parent_id = org_in.parent_id
        elif org_in.parent_id is None:
            org.parent_id = None
    
    # Update updated_by and updated_at
    org.updated_by = current_user.id
    org.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(org)
    
    return {
        "id": org.id,
        "name": org.name,
        "parent_id": org.parent_id
    }

@router.delete("/{org_id}")
async def delete_organization(
    org_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除组织（逻辑删除）"""
    result = await db.execute(select(Organization).where(and_(Organization.id == org_id, Organization.is_active == True)))
    org = result.scalars().first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check if has children (只检查有效的子组织)
    children_result = await db.execute(select(Organization).where(and_(Organization.parent_id == org_id, Organization.is_active == True)))
    children = children_result.scalars().all()
    if children:
        raise HTTPException(status_code=400, detail="Cannot delete organization with children. Please delete or move children first.")
    
    # 检查是否有有效的专业关联（包括子组织的专业）
    from app.models.base import Major
    
    # 获取所有子组织ID（包括当前组织）
    def get_all_descendant_ids(org_id: int, org_dict: dict) -> set:
        """递归获取所有子组织ID"""
        ids = {org_id}
        for child_id, parent_id in org_dict.items():
            if parent_id == org_id:
                ids.update(get_all_descendant_ids(child_id, org_dict))
        return ids
    
    # 获取所有有效组织及其父子关系
    all_orgs_result = await db.execute(select(Organization).where(Organization.is_active == True))
    all_orgs = all_orgs_result.scalars().all()
    org_dict = {org.id: org.parent_id for org in all_orgs if org.parent_id}
    
    # 获取所有相关组织ID（包括当前组织和所有子组织）
    related_org_ids = get_all_descendant_ids(org_id, org_dict)
    
    # 检查这些组织下是否有有效专业
    majors_result = await db.execute(
        select(func.count(Major.id)).where(and_(Major.organization_id.in_(related_org_ids), Major.is_active == True))
    )
    major_count = majors_result.scalar() or 0
    
    if major_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete organization: There are {major_count} major(s) associated with this organization or its children. Please delete or reassign the majors first.",
            headers={"X-Error-Code": "ORG_HAS_MAJORS"}
        )
    
    # 逻辑删除：设置 is_active = False
    org.is_active = False
    org.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Organization deleted successfully"}

