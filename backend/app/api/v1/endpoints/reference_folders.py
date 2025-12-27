from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.base import User
from app.models.reference_folder import ReferenceFolder
from app.models.reference_material import ReferenceMaterial

router = APIRouter()

class FolderCreate(BaseModel):
    folder_name: str
    parent_id: Optional[int] = None
    description: Optional[str] = None

class FolderUpdate(BaseModel):
    folder_name: Optional[str] = None
    description: Optional[str] = None

@router.post("/")
async def create_folder(
    folder_data: FolderCreate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建参考资料文件夹"""
    # 检查父文件夹是否存在
    if folder_data.parent_id:
        parent_result = await db.execute(
            select(ReferenceFolder).where(
                and_(
                    ReferenceFolder.id == folder_data.parent_id,
                    ReferenceFolder.teacher_id == teacher_id,
                    ReferenceFolder.is_active == True
                )
            )
        )
        if not parent_result.scalars().first():
            raise HTTPException(status_code=404, detail="父文件夹不存在")
    
    # 创建文件夹
    folder = ReferenceFolder(
        teacher_id=teacher_id,
        folder_name=folder_data.folder_name,
        parent_id=folder_data.parent_id,
        description=folder_data.description,
        is_active=True
    )
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    
    return {
        "message": "文件夹创建成功",
        "id": folder.id,
        "folder_name": folder.folder_name
    }

@router.get("/")
async def get_folders(
    teacher_id: int,
    parent_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
) -> List[Any]:
    """获取参考资料文件夹列表"""
    query = select(ReferenceFolder).where(
        and_(
            ReferenceFolder.teacher_id == teacher_id,
            ReferenceFolder.is_active == True
        )
    )
    
    if parent_id is None:
        query = query.where(ReferenceFolder.parent_id.is_(None))
    else:
        query = query.where(ReferenceFolder.parent_id == parent_id)
    
    query = query.order_by(ReferenceFolder.folder_name)
    
    result = await db.execute(query)
    folders = result.scalars().all()
    
    # 获取每个文件夹的资料数量和子文件夹数量
    folder_list = []
    for folder in folders:
        # 资料数量
        material_count_result = await db.execute(
            select(func.count(ReferenceMaterial.id)).where(
                and_(
                    ReferenceMaterial.folder_id == folder.id,
                    ReferenceMaterial.is_active == True
                )
            )
        )
        material_count = material_count_result.scalar() or 0
        
        # 子文件夹数量
        subfolder_count_result = await db.execute(
            select(func.count(ReferenceFolder.id)).where(
                and_(
                    ReferenceFolder.parent_id == folder.id,
                    ReferenceFolder.is_active == True
                )
            )
        )
        subfolder_count = subfolder_count_result.scalar() or 0
        
        folder_list.append({
            "id": folder.id,
            "teacher_id": folder.teacher_id,
            "folder_name": folder.folder_name,
            "parent_id": folder.parent_id,
            "description": folder.description,
            "resource_count": material_count,
            "subfolder_count": subfolder_count,
            "is_active": folder.is_active,
            "created_at": folder.created_at.isoformat() if folder.created_at else None,
            "updated_at": folder.updated_at.isoformat() if folder.updated_at else None,
        })
    
    return folder_list

@router.put("/{folder_id}")
async def update_folder(
    folder_id: int,
    folder_data: FolderUpdate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新参考资料文件夹信息"""
    result = await db.execute(
        select(ReferenceFolder).where(
            and_(
                ReferenceFolder.id == folder_id,
                ReferenceFolder.teacher_id == teacher_id,
                ReferenceFolder.is_active == True
            )
        )
    )
    folder = result.scalars().first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    if folder_data.folder_name is not None:
        folder.folder_name = folder_data.folder_name
    if folder_data.description is not None:
        folder.description = folder_data.description
    
    folder.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "文件夹更新成功"}

@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: int,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除参考资料文件夹（逻辑删除）"""
    result = await db.execute(
        select(ReferenceFolder).where(
            and_(
                ReferenceFolder.id == folder_id,
                ReferenceFolder.teacher_id == teacher_id,
                ReferenceFolder.is_active == True
            )
        )
    )
    folder = result.scalars().first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    # 检查是否有子文件夹
    subfolder_result = await db.execute(
        select(func.count(ReferenceFolder.id)).where(
            and_(
                ReferenceFolder.parent_id == folder_id,
                ReferenceFolder.is_active == True
            )
        )
    )
    subfolder_count = subfolder_result.scalar() or 0
    
    if subfolder_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"无法删除文件夹：该文件夹下还有 {subfolder_count} 个子文件夹"
        )
    
    # 检查是否有资料
    material_result = await db.execute(
        select(func.count(ReferenceMaterial.id)).where(
            and_(
                ReferenceMaterial.folder_id == folder_id,
                ReferenceMaterial.is_active == True
            )
        )
    )
    material_count = material_result.scalar() or 0
    
    if material_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"无法删除文件夹：该文件夹下还有 {material_count} 个参考资料"
        )
    
    # 逻辑删除
    folder.is_active = False
    folder.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "文件夹删除成功"}

@router.post("/{folder_id}/move")
async def move_folder(
    folder_id: int,
    target_parent_id: Optional[int],
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """移动文件夹到另一个父文件夹"""
    # 获取要移动的文件夹
    result = await db.execute(
        select(ReferenceFolder).where(
            and_(
                ReferenceFolder.id == folder_id,
                ReferenceFolder.teacher_id == teacher_id,
                ReferenceFolder.is_active == True
            )
        )
    )
    folder = result.scalars().first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    # 检查目标父文件夹
    if target_parent_id:
        # 不能移动到自己
        if target_parent_id == folder_id:
            raise HTTPException(status_code=400, detail="不能将文件夹移动到自己下面")
        
        # 检查目标父文件夹是否存在
        parent_result = await db.execute(
            select(ReferenceFolder).where(
                and_(
                    ReferenceFolder.id == target_parent_id,
                    ReferenceFolder.teacher_id == teacher_id,
                    ReferenceFolder.is_active == True
                )
            )
        )
        parent_folder = parent_result.scalars().first()
        if not parent_folder:
            raise HTTPException(status_code=404, detail="目标文件夹不存在")
        
        # 检查目标文件夹是否是当前文件夹的子文件夹（防止循环引用）
        current_parent_id = parent_folder.parent_id
        while current_parent_id:
            if current_parent_id == folder_id:
                raise HTTPException(status_code=400, detail="不能将文件夹移动到其子文件夹下")
            parent_check = await db.execute(
                select(ReferenceFolder.parent_id).where(ReferenceFolder.id == current_parent_id)
            )
            current_parent_id = parent_check.scalar()
    
    # 移动文件夹
    folder.parent_id = target_parent_id
    folder.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "文件夹移动成功"}

@router.post("/resources/{material_id}/move")
async def move_material(
    material_id: int,
    target_folder_id: Optional[int],
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """移动参考资料到另一个文件夹"""
    # 获取资料
    result = await db.execute(
        select(ReferenceMaterial).where(
            and_(
                ReferenceMaterial.id == material_id,
                ReferenceMaterial.teacher_id == teacher_id,
                ReferenceMaterial.is_active == True
            )
        )
    )
    material = result.scalars().first()
    
    if not material:
        raise HTTPException(status_code=404, detail="参考资料不存在")
    
    # 检查目标文件夹是否存在（如果指定了）
    if target_folder_id:
        folder_result = await db.execute(
            select(ReferenceFolder).where(
                and_(
                    ReferenceFolder.id == target_folder_id,
                    ReferenceFolder.teacher_id == teacher_id,
                    ReferenceFolder.is_active == True
                )
            )
        )
        folder = folder_result.scalars().first()
        if not folder:
            raise HTTPException(status_code=404, detail="目标文件夹不存在")
    
    # 移动资料
    material.folder_id = target_folder_id
    material.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "参考资料移动成功"}

