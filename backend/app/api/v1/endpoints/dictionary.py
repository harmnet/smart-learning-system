from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.dictionary import DictionaryType, DictionaryItem
from app.schemas import dictionary as dict_schemas

router = APIRouter()

# ============= 字典类型 =============
@router.get("/types", response_model=List[dict_schemas.DictionaryType])
async def get_dictionary_types(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取字典类型列表（只返回有效的）"""
    result = await db.execute(
        select(DictionaryType)
        .options(selectinload(DictionaryType.items))
        .where(DictionaryType.is_active == True)
        .offset(skip)
        .limit(limit)
    )
    types = result.scalars().all()
    return types

@router.get("/types/{type_id}", response_model=dict_schemas.DictionaryType)
async def get_dictionary_type(
    type_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """获取字典类型详情（只返回有效的）"""
    result = await db.execute(
        select(DictionaryType)
        .options(selectinload(DictionaryType.items))
        .where(and_(DictionaryType.id == type_id, DictionaryType.is_active == True))
    )
    dict_type = result.scalars().first()
    if not dict_type:
        raise HTTPException(status_code=404, detail="Dictionary type not found")
    return dict_type

@router.post("/types", response_model=dict_schemas.DictionaryType)
async def create_dictionary_type(
    *,
    db: AsyncSession = Depends(get_db),
    type_in: dict_schemas.DictionaryTypeCreate,
) -> Any:
    """创建字典类型"""
    # 检查code是否已存在（只检查有效的）
    result = await db.execute(
        select(DictionaryType).where(and_(DictionaryType.code == type_in.code, DictionaryType.is_active == True))
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Dictionary type code already exists")
    
    dict_type = DictionaryType(**type_in.dict())
    db.add(dict_type)
    await db.commit()
    await db.refresh(dict_type)
    
    # 重新查询以加载 items 关系（确保返回完整的对象）
    result = await db.execute(
        select(DictionaryType)
        .options(selectinload(DictionaryType.items))
        .where(and_(DictionaryType.id == dict_type.id, DictionaryType.is_active == True))
    )
    dict_type = result.scalars().first()
    
    return dict_type

@router.put("/types/{type_id}", response_model=dict_schemas.DictionaryType)
async def update_dictionary_type(
    *,
    db: AsyncSession = Depends(get_db),
    type_id: int,
    type_in: dict_schemas.DictionaryTypeUpdate,
) -> Any:
    """更新字典类型（只更新有效的）"""
    result = await db.execute(
        select(DictionaryType)
        .options(selectinload(DictionaryType.items))
        .where(and_(DictionaryType.id == type_id, DictionaryType.is_active == True))
    )
    dict_type = result.scalars().first()
    if not dict_type:
        raise HTTPException(status_code=404, detail="Dictionary type not found")
    
    update_data = type_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dict_type, field, value)
    
    await db.commit()
    await db.refresh(dict_type)
    
    # 重新查询以加载 items 关系
    result = await db.execute(
        select(DictionaryType)
        .options(selectinload(DictionaryType.items))
        .where(and_(DictionaryType.id == type_id, DictionaryType.is_active == True))
    )
    dict_type = result.scalars().first()
    
    return dict_type

@router.delete("/types/{type_id}")
async def delete_dictionary_type(
    type_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除字典类型（逻辑删除）"""
    result = await db.execute(
        select(DictionaryType).where(and_(DictionaryType.id == type_id, DictionaryType.is_active == True))
    )
    dict_type = result.scalars().first()
    if not dict_type:
        raise HTTPException(status_code=404, detail="Dictionary type not found")
    
    # 逻辑删除：设置 is_active = False
    dict_type.is_active = False
    from datetime import datetime
    dict_type.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Dictionary type deleted successfully"}

# ============= 字典项 =============
@router.get("/items/by-type/{type_code}", response_model=List[dict_schemas.DictionaryItem])
async def get_dictionary_items_by_type_code(
    type_code: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """根据类型编码获取字典项列表"""
    result = await db.execute(
        select(DictionaryItem)
        .join(DictionaryType)
        .where(DictionaryType.code == type_code)
        .where(DictionaryItem.is_active == True)
        .order_by(DictionaryItem.sort_order)
    )
    items = result.scalars().all()
    return items

@router.post("/items", response_model=dict_schemas.DictionaryItem)
async def create_dictionary_item(
    *,
    db: AsyncSession = Depends(get_db),
    item_in: dict_schemas.DictionaryItemCreate,
) -> Any:
    """创建字典项"""
    dict_item = DictionaryItem(**item_in.dict())
    db.add(dict_item)
    await db.commit()
    await db.refresh(dict_item)
    return dict_item

@router.put("/items/{item_id}", response_model=dict_schemas.DictionaryItem)
async def update_dictionary_item(
    *,
    db: AsyncSession = Depends(get_db),
    item_id: int,
    item_in: dict_schemas.DictionaryItemUpdate,
) -> Any:
    """更新字典项"""
    result = await db.execute(
        select(DictionaryItem).where(DictionaryItem.id == item_id)
    )
    dict_item = result.scalars().first()
    if not dict_item:
        raise HTTPException(status_code=404, detail="Dictionary item not found")
    
    update_data = item_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dict_item, field, value)
    
    await db.commit()
    await db.refresh(dict_item)
    return dict_item

@router.delete("/items/{item_id}")
async def delete_dictionary_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """删除字典项（逻辑删除）"""
    result = await db.execute(
        select(DictionaryItem).where(and_(DictionaryItem.id == item_id, DictionaryItem.is_active == True))
    )
    dict_item = result.scalars().first()
    if not dict_item:
        raise HTTPException(status_code=404, detail="Dictionary item not found")
    
    # 逻辑删除：设置 is_active = False
    dict_item.is_active = False
    from datetime import datetime
    dict_item.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Dictionary item deleted successfully"}

