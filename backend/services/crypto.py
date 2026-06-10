"""Symmetric encryption for secrets at rest (bot tokens), keyed off SECRET_KEY."""
import base64
import hashlib
import os

from cryptography.fernet import Fernet, InvalidToken


def _fernet() -> Fernet:
    secret = os.getenv("SECRET_KEY", "dev-secret-key")
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
    return Fernet(key)


def encrypt_str(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt_str(value: str) -> str:
    """Decrypt a value. Raises ValueError if the token is invalid/corrupt."""
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken as e:
        raise ValueError("could not decrypt stored secret (SECRET_KEY changed?)") from e


def mask_secret(value: str, visible: int = 4) -> str:
    if len(value) <= visible:
        return "*" * len(value)
    return "*" * 8 + value[-visible:]
