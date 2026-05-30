from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # user_id -> list of active WebSocket connections for that user
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        conns = self._connections.get(user_id, [])
        self._connections[user_id] = [ws for ws in conns if ws is not websocket]
        if not self._connections[user_id]:
            self._connections.pop(user_id, None)

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections belonging to a specific user."""
        dead = []
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, user_id)

    async def broadcast(self, message: dict, user_id: str):
        """Broadcast to a specific user's connections (call with user_id always)."""
        await self.send_to_user(user_id, message)


manager = ConnectionManager()
