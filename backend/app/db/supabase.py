"""Supabase client factory (service-role, server-side only).

Returns ``None`` when Supabase is not configured so callers can fall back to the
in-memory demo store.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings

try:  # pragma: no cover - import guard
    from supabase import Client, create_client
except Exception:  # noqa: BLE001
    Client = object  # type: ignore
    create_client = None  # type: ignore


@lru_cache
def get_supabase() -> "Client | None":
    if settings.is_demo or not settings.supabase_configured or create_client is None:
        return None
    return create_client(settings.supabase_url, settings.supabase_secret_key)
