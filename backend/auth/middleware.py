from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from backend.auth.auth import decode_token


class AuthMiddleware(BaseHTTPMiddleware):
    """Reads Authorization: Bearer <token> and attaches user_id to request.state."""

    SKIP_PREFIXES = ("/api/auth/", "/", "/static", "/ws/", "/api/health")

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        skip = path == "/" or any(
            path.startswith(prefix) for prefix in ("/api/auth/", "/static", "/ws/", "/docs", "/openapi", "/redoc")
        )

        if not skip:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.removeprefix("Bearer ").strip()
                user_id = decode_token(token)
                request.state.user_id = user_id
            else:
                request.state.user_id = None
        else:
            request.state.user_id = None

        return await call_next(request)
