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
    # Authenticate via token query param
    user_id = decode_token(token)
    if user_id is None:
        await websocket.close(code=4003)
        return

    # Verify user exists
    async with get_db() as db:
        async with db.execute(
            "SELECT id FROM users WHERE id = ?", (user_id,)
        ) as cursor:
            user_row = await cursor.fetchone()

    if user_row is None:
        await websocket.close(code=4003)
        return

    await manager.connect(websocket)

    try:
        # Send last 20 signals as init payload
        async with get_db() as db:
            async with db.execute(
                """
                SELECT
                    s.id, s.channel_id, s.pair, s.direction,
                    s.entry_price, s.stop_loss, s.tp1, s.tp2, s.tp3,
                    s.signal_type, s.parse_confidence, s.posted_at,
                    s.raw_text,
                    o.status as outcome_status,
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

        # Keep alive — wait for client messages or disconnect
        while True:
            data = await websocket.receive_text()
            # Optionally handle ping/pong or subscription messages here
            if data == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
