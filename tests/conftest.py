"""Test bootstrap — must run before any backend import so the module-level
DB path resolves to a throwaway location instead of the dev database."""
import os
import tempfile

_tmp = tempfile.mkdtemp(prefix="tapwire-test-")
os.environ["DATABASE_PATH"] = os.path.join(_tmp, "test.db")
os.environ["MEDIA_DIR"] = os.path.join(_tmp, "media")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests")

import pytest


@pytest.fixture(autouse=True)
def reset_auth_rate_limiter():
    """Tests register many users from one fake client IP — clear the limiter."""
    from backend.routers.auth import _attempts
    _attempts.clear()
    yield
