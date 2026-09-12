"""Document file storage.

Production: a PRIVATE Supabase Storage bucket, objects keyed by
``{user_id}/{document_id}/{filename}``. Access is via short-lived signed URLs.
Demo mode: files are held in memory only for the lifetime of the process (the
raw bytes are needed just long enough to parse + embed).
"""

from __future__ import annotations

from app.core.config import settings
from app.db.supabase import get_supabase

_memory_blobs: dict[str, bytes] = {}


def object_path(user_id: str, document_id: str, filename: str) -> str:
    safe = filename.replace("/", "_").replace("\\", "_")
    return f"{user_id}/{document_id}/{safe}"


def put(user_id: str, document_id: str, filename: str, content: bytes) -> str:
    path = object_path(user_id, document_id, filename)
    client = get_supabase()
    if client is None:
        _memory_blobs[path] = content
        return path
    client.storage.from_(settings.supabase_storage_bucket).upload(
        path, content, {"upsert": "true"}
    )
    return path


def get(path: str) -> bytes | None:
    client = get_supabase()
    if client is None:
        return _memory_blobs.get(path)
    return client.storage.from_(settings.supabase_storage_bucket).download(path)


def signed_url(path: str, expires_in: int = 300) -> str | None:
    client = get_supabase()
    if client is None:
        return None
    res = client.storage.from_(settings.supabase_storage_bucket).create_signed_url(
        path, expires_in
    )
    return res.get("signedURL") or res.get("signed_url")


def delete(path: str) -> None:
    client = get_supabase()
    if client is None:
        _memory_blobs.pop(path, None)
        return
    client.storage.from_(settings.supabase_storage_bucket).remove([path])
