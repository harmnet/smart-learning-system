from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, func
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.resource_folder import ResourceFolder
from app.models.teaching_resource import TeachingResource

router = APIRouter()

class FolderCreate(BaseModel):
    folder_name: str
    parent_id: Optional[int] = None
    description: Optional[str] = None

class FolderUpdate(BaseModel):
    folder_name: Optional[str] = None
    description: Optional[str] = None

class FolderResponse(BaseModel):
    id: int
    teacher_id: int
    folder_name: str
    parent_id: Optional[int] = None
    description: Optional[str] = None
    is_active: bool
    resource_count: int = 0
    subfolder_count: int = 0
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[FolderResponse])
async def get_folders(
    teacher_id: int,
    parent_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取文件夹列表"""
    query = select(ResourceFolder).where(
        and_(
            ResourceFolder.teacher_id == teacher_id,
            ResourceFolder.is_active == True
        )
    )
    
    if parent_id is None:
        # 获取根目录文件夹
        query = query.where(ResourceFolder.parent_id.is_(None))
    else:
        # 获取指定父文件夹下的子文件夹
        query = query.where(ResourceFolder.parent_id == parent_id)
    
    query = query.order_by(ResourceFolder.created_at.desc())
    
    result = await db.execute(query)
    folders = result.scalars().all()
    
    # 为每个文件夹统计资源数和子文件夹数
    folder_list = []
    for folder in folders:
        # 统计资源数
        resource_count_result = await db.execute(
            select(func.count(TeachingResource.id)).where(
                and_(
                    TeachingResource.folder_id == folder.id,
                    TeachingResource.is_active == True
                )
            )
        )
        resource_count = resource_count_result.scalar() or 0
        
        # 统计子文件夹数
        subfolder_count_result = await db.execute(
            select(func.count(ResourceFolder.id)).where(
                and_(
                    ResourceFolder.parent_id == folder.id,
                    ResourceFolder.is_active == True
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
            "is_active": folder.is_active,
            "resource_count": resource_count,
            "subfolder_count": subfolder_count,
            "created_at": folder.created_at.isoformat() if folder.created_at else None,
            "updated_at": folder.updated_at.isoformat() if folder.updated_at else None
        })
    
    return folder_list

@router.post("/")
async def create_folder(
    folder_data: FolderCreate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """创建文件夹"""
    # 检查父文件夹是否存在（如果指定了）
    if folder_data.parent_id:
        parent_result = await db.execute(
            select(ResourceFolder).where(
                and_(
                    ResourceFolder.id == folder_data.parent_id,
                    ResourceFolder.teacher_id == teacher_id,
                    ResourceFolder.is_active == True
                )
            )
        )
        parent = parent_result.scalars().first()
        if not parent:
            raise HTTPException(status_code=404, detail="父文件夹不存在")
    
    # 创建文件夹
    folder = ResourceFolder(
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

@router.put("/{folder_id}")
async def update_folder(
    folder_id: int,
    folder_data: FolderUpdate,
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """更新文件夹信息"""
    result = await db.execute(
        select(ResourceFolder).where(
            and_(
                ResourceFolder.id == folder_id,
                ResourceFolder.teacher_id == teacher_id,
                ResourceFolder.is_active == True
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
    """删除文件夹（逻辑删除）"""
    result = await db.execute(
        select(ResourceFolder).where(
            and_(
                ResourceFolder.id == folder_id,
                ResourceFolder.teacher_id == teacher_id,
                ResourceFolder.is_active == True
            )
        )
    )
    folder = result.scalars().first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    # 检查是否有子文件夹
    subfolder_result = await db.execute(
        select(func.count(ResourceFolder.id)).where(
            and_(
                ResourceFolder.parent_id == folder_id,
                ResourceFolder.is_active == True
            )
        )
    )
    subfolder_count = subfolder_result.scalar() or 0
    
    if subfolder_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"无法删除文件夹：该文件夹下还有 {subfolder_count} 个子文件夹"
        )
    
    # 检查是否有资源
    resource_result = await db.execute(
        select(func.count(TeachingResource.id)).where(
            and_(
                TeachingResource.folder_id == folder_id,
                TeachingResource.is_active == True
            )
        )
    )
    resource_count = resource_result.scalar() or 0
    
    if resource_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"无法删除文件夹：该文件夹下还有 {resource_count} 个资源文件"
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
        select(ResourceFolder).where(
            and_(
                ResourceFolder.id == folder_id,
                ResourceFolder.teacher_id == teacher_id,
                ResourceFolder.is_active == True
            )
        )
    )
    folder = result.scalars().first()
    
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    
    # 检查目标父文件夹是否存在（如果指定了）
    if target_parent_id:
        # 不能移动到自己或自己的子文件夹
        if target_parent_id == folder_id:
            raise HTTPException(status_code=400, detail="不能将文件夹移动到自己")
        
        parent_result = await db.execute(
            select(ResourceFolder).where(
                and_(
                    ResourceFolder.id == target_parent_id,
                    ResourceFolder.teacher_id == teacher_id,
                    ResourceFolder.is_active == True
                )
            )
        )
        parent = parent_result.scalars().first()
        if not parent:
            raise HTTPException(status_code=404, detail="目标文件夹不存在")
        
        # 检查是否会形成循环引用
        current_parent_id = parent.parent_id
        while current_parent_id:
            if current_parent_id == folder_id:
                raise HTTPException(status_code=400, detail="不能将文件夹移动到其子文件夹")
            parent_result = await db.execute(
                select(ResourceFolder).where(ResourceFolder.id == current_parent_id)
            )
            current_parent = parent_result.scalars().first()
            current_parent_id = current_parent.parent_id if current_parent else None
    
    # 移动文件夹
    folder.parent_id = target_parent_id
    folder.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "文件夹移动成功"}

@router.post("/resources/{resource_id}/move")
async def move_resource(
    resource_id: int,
    target_folder_id: Optional[int],
    teacher_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """移动资源到另一个文件夹"""
    # 获取资源
    result = await db.execute(
        select(TeachingResource).where(
            and_(
                TeachingResource.id == resource_id,
                TeachingResource.teacher_id == teacher_id,
                TeachingResource.is_active == True
            )
        )
    )
    resource = result.scalars().first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    
    # 检查目标文件夹是否存在（如果指定了）
    if target_folder_id:
        folder_result = await db.execute(
            select(ResourceFolder).where(
                and_(
                    ResourceFolder.id == target_folder_id,
                    ResourceFolder.teacher_id == teacher_id,
                    ResourceFolder.is_active == True
                )
            )
        )
        folder = folder_result.scalars().first()
        if not folder:
            raise HTTPException(status_code=404, detail="目标文件夹不存在")
    
    # 移动资源
    resource.folder_id = target_folder_id
    resource.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "资源移动成功"}

