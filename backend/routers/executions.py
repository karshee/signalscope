import json
import time
from typing import Optional

from fastapi import APIRouter, Depends, Query

from backend.auth.auth import get_current_user
from backend.db.database import get_db

router = APIRouter(prefix="/api/executions", tags=["executions"])


@router.get("/")
async def list_executions(
    rule_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    where = ["r.user_id = ?"]
    params: list = [current_user["id"]]
    if rule_id:
        where.append("e.rule_id = ?")
        params.append(rule_id)
    if status:
        where.append("e.status = ?")
        params.append(status)
    params.extend([limit, offset])

    async with get_db() as db:
        async with db.execute(
            f"""SELECT e.*, r.name AS rule_name
                FROM rule_executions e
                JOIN automation_rules r ON e.rule_id = r.id
                WHERE {' AND '.join(where)}
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?""",
            params,
        ) as cursor:
            rows = await cursor.fetchall()

    out = []
    for r in rows:
        d = dict(r)
        try:
            d["detail"] = json.loads(d["detail"]) if d.get("detail") else None
        except json.JSONDecodeError:
            pass
        out.append(d)
    return out


@router.get("/stats")
async def execution_stats(current_user: dict = Depends(get_current_user)):
    """Counts powering the dashboard cards."""
    now = time.time()
    async with get_db() as db:
        async with db.execute(
            """SELECT
                 COUNT(*) AS total_24h,
                 SUM(CASE WHEN e.status = 'success' THEN 1 ELSE 0 END) AS success_24h,
                 SUM(CASE WHEN e.status = 'error' THEN 1 ELSE 0 END) AS errors_24h
               FROM rule_executions e
               JOIN automation_rules r ON e.rule_id = r.id
               WHERE r.user_id = ? AND e.created_at > ?""",
            (current_user["id"], now - 86400),
        ) as cursor:
            day = dict(await cursor.fetchone())

        async with db.execute(
            """SELECT COUNT(*) AS active_rules FROM automation_rules
               WHERE user_id = ? AND is_enabled = 1""",
            (current_user["id"],),
        ) as cursor:
            rules = dict(await cursor.fetchone())

        async with db.execute(
            "SELECT COUNT(*) AS sent_7d FROM sent_messages WHERE user_id = ? AND created_at > ?",
            (current_user["id"], now - 7 * 86400),
        ) as cursor:
            sent = dict(await cursor.fetchone())

    return {**day, **rules, **sent}
