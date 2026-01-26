"""
数据库查询工具
提供统一的查询条件构建和分页功能
"""
from typing import List, Tuple, Type, Optional, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, asc, desc
from sqlalchemy.sql import Select


class QueryBuilder:
    """动态查询条件构建器"""
    
    def __init__(self, model: Type):
        """
        初始化查询构建器
        
        Args:
            model: SQLAlchemy模型类
        """
        self.model = model
        self.conditions = []
    
    def add_search(self, fields: List[str], keyword: str) -> 'QueryBuilder':
        """
        添加模糊搜索条件（多字段OR查询）
        
        Args:
            fields: 要搜索的字段列表
            keyword: 搜索关键词
        
        Returns:
            self（支持链式调用）
        """
        if keyword and keyword.strip():
            search_conditions = [
                getattr(self.model, field).ilike(f"%{keyword.strip()}%")
                for field in fields
                if hasattr(self.model, field)
            ]
            if search_conditions:
                self.conditions.append(or_(*search_conditions))
        return self
    
    def add_filter(
        self, 
        field: str, 
        value: Any, 
        operator: str = 'eq'
    ) -> 'QueryBuilder':
        """
        添加精确筛选条件
        
        Args:
            field: 字段名
            value: 筛选值
            operator: 操作符 ('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'like', 'is_null')
        
        Returns:
            self（支持链式调用）
        """
        if value is None and operator not in ('is_null', 'is_not_null'):
            return self
        
        if not hasattr(self.model, field):
            return self
        
        field_obj = getattr(self.model, field)
        
        if operator == 'eq':
            self.conditions.append(field_obj == value)
        elif operator == 'ne':
            self.conditions.append(field_obj != value)
        elif operator == 'gt':
            self.conditions.append(field_obj > value)
        elif operator == 'gte':
            self.conditions.append(field_obj >= value)
        elif operator == 'lt':
            self.conditions.append(field_obj < value)
        elif operator == 'lte':
            self.conditions.append(field_obj <= value)
        elif operator == 'in':
            if isinstance(value, (list, tuple)) and len(value) > 0:
                self.conditions.append(field_obj.in_(value))
        elif operator == 'not_in':
            if isinstance(value, (list, tuple)) and len(value) > 0:
                self.conditions.append(~field_obj.in_(value))
        elif operator == 'like':
            self.conditions.append(field_obj.ilike(f"%{value}%"))
        elif operator == 'is_null':
            self.conditions.append(field_obj.is_(None))
        elif operator == 'is_not_null':
            self.conditions.append(field_obj.isnot(None))
        
        return self
    
    def add_date_range(
        self, 
        field: str, 
        start_date: Optional[Any] = None, 
        end_date: Optional[Any] = None
    ) -> 'QueryBuilder':
        """
        添加日期范围筛选
        
        Args:
            field: 日期字段名
            start_date: 开始日期
            end_date: 结束日期
        
        Returns:
            self（支持链式调用）
        """
        if not hasattr(self.model, field):
            return self
        
        field_obj = getattr(self.model, field)
        
        if start_date:
            self.conditions.append(field_obj >= start_date)
        if end_date:
            self.conditions.append(field_obj <= end_date)
        
        return self
    
    def add_condition(self, condition: Any) -> 'QueryBuilder':
        """
        添加自定义条件
        
        Args:
            condition: SQLAlchemy条件表达式
        
        Returns:
            self（支持链式调用）
        """
        if condition is not None:
            self.conditions.append(condition)
        return self
    
    def build(self) -> Any:
        """
        构建最终查询条件
        
        Returns:
            SQLAlchemy条件表达式（可用于where子句）
        """
        if not self.conditions:
            return True  # 无条件时返回True（所有记录）
        if len(self.conditions) == 1:
            return self.conditions[0]
        return and_(*self.conditions)


async def paginate_query(
    db: AsyncSession,
    query: Select,
    skip: int = 0,
    limit: int = 20,
    order_by: Optional[Union[str, List[str]]] = None,
    order_desc: bool = True
) -> Tuple[List[Any], int]:
    """
    统一分页查询
    
    Args:
        db: 数据库会话
        query: SQLAlchemy查询对象
        skip: 跳过的记录数
        limit: 每页记录数
        order_by: 排序字段（单个字段名或字段名列表）
        order_desc: 是否降序（默认True）
    
    Returns:
        (items, total): 查询结果列表和总记录数
    """
    # 获取总数（使用子查询避免重复查询）
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 应用排序
    if order_by:
        order_fields = [order_by] if isinstance(order_by, str) else order_by
        for field in order_fields:
            if order_desc:
                query = query.order_by(desc(field))
            else:
                query = query.order_by(asc(field))
    
    # 应用分页
    query = query.offset(skip).limit(limit)
    
    # 执行查询
    result = await db.execute(query)
    items = result.scalars().all()
    
    return items, total


async def exists(
    db: AsyncSession,
    model: Type,
    conditions: Any
) -> bool:
    """
    检查记录是否存在
    
    Args:
        db: 数据库会话
        model: 模型类
        conditions: 查询条件
    
    Returns:
        bool: 是否存在
    """
    query = select(func.count(model.id)).where(conditions)
    result = await db.execute(query)
    count = result.scalar() or 0
    return count > 0


async def get_or_404(
    db: AsyncSession,
    model: Type,
    record_id: int,
    error_message: str = "记录不存在"
):
    """
    获取记录或抛出404错误
    
    Args:
        db: 数据库会话
        model: 模型类
        record_id: 记录ID
        error_message: 错误消息
    
    Returns:
        模型实例
    
    Raises:
        HTTPException: 记录不存在时抛出404
    """
    from fastapi import HTTPException
    
    result = await db.execute(
        select(model).where(model.id == record_id)
    )
    record = result.scalars().first()
    
    if not record:
        raise HTTPException(status_code=404, detail=error_message)
    
    return record


async def bulk_create(
    db: AsyncSession,
    model: Type,
    data_list: List[dict]
) -> List[Any]:
    """
    批量创建记录
    
    Args:
        db: 数据库会话
        model: 模型类
        data_list: 数据字典列表
    
    Returns:
        创建的记录列表
    """
    records = [model(**data) for data in data_list]
    db.add_all(records)
    await db.commit()
    
    # 刷新所有记录以获取生成的ID
    for record in records:
        await db.refresh(record)
    
    return records


async def bulk_update(
    db: AsyncSession,
    model: Type,
    updates: List[dict]
) -> int:
    """
    批量更新记录
    
    Args:
        db: 数据库会话
        model: 模型类
        updates: 更新数据列表，每个字典必须包含'id'字段
    
    Returns:
        更新的记录数
    """
    from sqlalchemy import update
    
    count = 0
    for data in updates:
        record_id = data.pop('id', None)
        if record_id:
            stmt = update(model).where(model.id == record_id).values(**data)
            result = await db.execute(stmt)
            count += result.rowcount
    
    await db.commit()
    return count


# 使用示例
"""
# 基本使用
builder = QueryBuilder(Course)
builder.add_search(['title', 'description'], '数学')
builder.add_filter('is_active', True)
builder.add_date_range('created_at', start_date, end_date)

query = select(Course).where(builder.build())
items, total = await paginate_query(db, query, skip=0, limit=20, order_by='created_at')

# 高级使用
builder = QueryBuilder(Student)
builder.add_filter('grade', [1, 2, 3], operator='in')
builder.add_filter('score', 60, operator='gte')
builder.add_condition(Student.class_id == 1)

query = select(Student).where(builder.build())
students, total = await paginate_query(db, query, skip=0, limit=50)
"""
