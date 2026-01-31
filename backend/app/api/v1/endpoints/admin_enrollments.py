from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db

router = APIRouter()


@router.get("")
async def list_enrollments(
    skip: int = 0,
    limit: int = 20,
    phone: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    where = ["1=1"]
    params: Dict[str, Any] = {"skip": skip, "limit": limit}

    if phone:
        where.append("phone ILIKE :phone")
        params["phone"] = f"%{phone}%"

    if status:
        where.append("status = :status")
        params["status"] = status

    if date_from:
        where.append("created_at >= :date_from")
        params["date_from"] = date_from

    if date_to:
        where.append("created_at <= :date_to")
        params["date_to"] = date_to

    where_sql = " AND ".join(where)

    count_sql = text(f"SELECT COUNT(*) FROM enrollment_application WHERE {where_sql}")
    total_res = await db.execute(count_sql, params)
    total = total_res.scalar() or 0

    list_sql = text(
        f"""
        SELECT id, phone, status,
               child_first_name, child_last_name_passport,
               programme_interested, created_at
        FROM enrollment_application
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :skip
        """
    )

    res = await db.execute(list_sql, params)
    rows = res.fetchall()

    items = []
    for r in rows:
        child_name = ""
        if r[4] or r[3]:
            child_name = f"{r[4] or ''}{r[3] or ''}".strip()
        items.append(
            {
                "id": r[0],
                "phone": r[1],
                "status": r[2],
                "child_name": child_name,
                "programme_interested": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
            }
        )

    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/{enrollment_id}")
async def get_enrollment_detail(
    enrollment_id: int,
    db: AsyncSession = Depends(get_db),
) -> Any:
    sql = text("SELECT * FROM enrollment_application WHERE id = :id")
    res = await db.execute(sql, {"id": enrollment_id})
    row = res.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    # 转 dict 返回
    data = dict(row)
    # datetime/ date 转字符串
    for k, v in list(data.items()):
        if hasattr(v, "isoformat"):
            data[k] = v.isoformat()
    return data


@router.post("/{enrollment_id}/approve")
async def approve_enrollment(
    enrollment_id: int,
    body: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    admin_id = body.get("admin_id")
    if not admin_id:
        raise HTTPException(status_code=400, detail="admin_id is required")

    sql = text(
        """
        UPDATE enrollment_application
        SET status = 'approved',
            approved_at = NOW(),
            approved_by = :admin_id,
            updated_at = NOW(),
            rejected_at = NULL,
            rejected_by = NULL,
            reject_reason = NULL
        WHERE id = :id
        RETURNING id, status, approved_at, approved_by
        """
    )

    res = await db.execute(sql, {"id": enrollment_id, "admin_id": admin_id})
    row = res.fetchone()
    if not row:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Enrollment not found")

    await db.commit()
    return {
        "id": row[0],
        "status": row[1],
        "approved_at": row[2].isoformat() if row[2] else None,
        "approved_by": row[3],
    }


@router.post("/{enrollment_id}/reject")
async def reject_enrollment(
    enrollment_id: int,
    body: Dict[str, Any] = Body(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    admin_id = body.get("admin_id")
    if not admin_id:
        raise HTTPException(status_code=400, detail="admin_id is required")

    reason = body.get("reason")

    sql = text(
        """
        UPDATE enrollment_application
        SET status = 'rejected',
            rejected_at = NOW(),
            rejected_by = :admin_id,
            reject_reason = :reason,
            updated_at = NOW(),
            approved_at = NULL,
            approved_by = NULL
        WHERE id = :id
        RETURNING id, status, rejected_at, rejected_by, reject_reason
        """
    )

    res = await db.execute(sql, {"id": enrollment_id, "admin_id": admin_id, "reason": reason})
    row = res.fetchone()
    if not row:
        await db.rollback()
        raise HTTPException(status_code=404, detail="Enrollment not found")

    await db.commit()
    return {
        "id": row[0],
        "status": row[1],
        "rejected_at": row[2].isoformat() if row[2] else None,
        "rejected_by": row[3],
        "reject_reason": row[4],
    }
