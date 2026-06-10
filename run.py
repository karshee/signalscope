import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    reload = os.getenv("RELOAD", "true").lower() in ("true", "1", "yes")
    port = int(os.getenv("PORT_BACKEND", "8000"))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=reload, log_level=log_level)
