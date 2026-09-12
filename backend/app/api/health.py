"""Health and capability probe."""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "demo_mode": settings.is_demo,
        "groq_configured": settings.llm_configured,
        "supabase_configured": settings.supabase_configured,
    }
