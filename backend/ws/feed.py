from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from backend.auth.auth import decode_token
from backend.db.database import get_db
from backend.ws.manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/feed")
async def websocket_feed(
    websocket: WebSocket,
    token: str = Query(...),
):
    user_id = decode_token(token)
    if user_id is None:
        await websocket.close(code=4003)
        return

    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM users WHERE id = ?", (user_id,)
        ) as cursor:
            user_row = await cursor.fetchone()

    if user_row is None:
        await websocket.close(code=4003)
        return

    await manager.connect(websocket, user_id)

    try:
        async with get_db() as db:
            async with db.execute(
                """
                SELECT
                    s.id, s.channel_id, s.pair, s.direction,
                    s.entry_price, s.stop_loss, s.tp1, s.tp2, s.tp3,
                    s.signal_type, s.parse_confidence, s.posted_at,
                    s.raw_text,
                    o.status as status,
                    o.pips_result, o.rr_result,
                    c.title as channel_title,
                    c.username as channel_username
                FROM signals s
                JOIN channels c ON s.channel_id = c.id
                LEFT JOIN outcomes o ON s.id = o.signal_id
                WHERE c.user_id = ?
                ORDER BY s.posted_at DESC
                LIMIT 20
                """,
                (user_id,),
            ) as cursor:
                rows = await cursor.fetchall()

        init_signals = [dict(r) for r in rows]
        await websocket.send_json({"type": "init", "signals": init_signals})

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)
