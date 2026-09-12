"""Centralised application configuration.

All settings are read from environment variables (or a local ``.env`` file).
Secrets never have defaults that would leak into source control.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # ── App ────────────────────────────────────────────────────────────
    app_name: str = "WorkFlow AI"
    api_prefix: str = "/api/v1"
    environment: str = Field(default="development")

    # ── Groq (https://console.groq.com) — server-side only ──────────────
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    groq_timeout_seconds: float = 60.0

    # ── Supabase ───────────────────────────────────────────────────────
    supabase_url: str | None = None
    supabase_secret_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_storage_bucket: str = "workflow-documents"

    # ── CORS ───────────────────────────────────────────────────────────
    cors_origins: str = "http://localhost:3000"

    # ── Demo / limits ──────────────────────────────────────────────────
    # Hard override: forces the whole app into demo (in-memory) mode even if
    # Supabase credentials are present. Leave false to auto-detect per service.
    demo_mode: bool = False
    max_file_size_mb: int = 10
    max_documents_per_user: int = 5
    max_chat_requests_per_day: int = 20
    max_reports_per_day: int = 5

    # ── Embeddings ─────────────────────────────────────────────────────
    embedding_dim: int = 512

    # ── Derived helpers ────────────────────────────────────────────────
    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_secret_key)

    @property
    def llm_configured(self) -> bool:
        return bool(self.groq_api_key)

    @property
    def is_demo(self) -> bool:
        """Controls data storage + auth: in-memory repo and a stand-in demo
        user whenever Supabase isn't fully configured (or DEMO_MODE forces it).
        This is intentionally independent of ``llm_configured`` — Groq can be
        live (real AI answers) while storage still runs in demo mode, or vice
        versa.
        """
        if self.demo_mode:
            return True
        return not self.supabase_configured

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
