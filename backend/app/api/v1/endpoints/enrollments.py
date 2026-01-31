from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db

router = APIRouter()


@router.post("")
async def create_enrollment(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
) -> Any:
    """学生提交报名（每字段一列，payload 的 key 必须与表字段一致）"""

    phone = payload.get("phone")
    if not phone:
        raise HTTPException(status_code=400, detail="phone is required")

    # 防止写入非法字段
    allowed_columns_sql = text(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'enrollment_application'
        """
    )
    cols_res = await db.execute(allowed_columns_sql)
    allowed_cols = {r[0] for r in cols_res.fetchall()}

    # 自动补 status
    payload = dict(payload)
    payload.setdefault("status", "pending")

    insert_data = {k: v for k, v in payload.items() if k in allowed_cols and k != "id"}

    if "phone" not in insert_data:
        insert_data["phone"] = phone

    if not insert_data:
        raise HTTPException(status_code=400, detail="no valid fields")

    columns = ", ".join(insert_data.keys())
    values = ", ".join([f":{k}" for k in insert_data.keys()])

    sql = text(
        f"""
        INSERT INTO enrollment_application ({columns})
        VALUES ({values})
        RETURNING id, phone, status, created_at
        """
    )

    try:
        res = await db.execute(sql, insert_data)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"failed to create enrollment: {str(e)}")

    row = res.fetchone()
    return {
        "id": row[0],
        "phone": row[1],
        "status": row[2],
        "created_at": row[3].isoformat() if row[3] else None,
    }


@router.get("/by-phone")
async def get_enrollments_by_phone(
    phone: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """按手机号查询报名记录列表（倒序）"""

    sql = text(
        """
        SELECT id, phone, status, child_first_name, child_last_name_passport, programme_interested, created_at
        FROM enrollment_application
        WHERE phone = :phone
        ORDER BY created_at DESC
        """
    )

    res = await db.execute(sql, {"phone": phone})
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

    return {"items": items, "total": len(items)}
