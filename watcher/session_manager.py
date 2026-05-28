import os
from pathlib import Path

SESSIONS_DIR = Path("sessions")
SESSIONS_DIR.mkdir(exist_ok=True)


def get_session_path(name: str = "primary") -> str:
    return str(SESSIONS_DIR / f"{name}.session")
