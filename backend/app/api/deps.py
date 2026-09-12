"""Shared FastAPI dependencies: repository handle and demo usage limits."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status

from app.core.config import settings
from app.core.security import AuthUser, get_current_user
from app.db.queries import get_repository


def get_repo():
    return get_repository()


RepoDep = Depends(get_repo)
UserDep = Depends(get_current_user)


def enforce_document_limit(repo, user: AuthUser) -> None:
    usage = repo.usage_today(user.id)
    if usage["documents"] >= settings.max_documents_per_user:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Demo limit reached: {settings.max_documents_per_user} documents "
                "per workspace. Delete one to upload another."
            ),
        )


def enforce_chat_limit(repo, user: AuthUser) -> None:
    usage = repo.usage_today(user.id)
    if usage["chat"] >= settings.max_chat_requests_per_day:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Demo limit reached: {settings.max_chat_requests_per_day} AI "
                "questions per day."
            ),
        )


def enforce_report_limit(repo, user: AuthUser) -> None:
    usage = repo.usage_today(user.id)
    if usage["reports"] >= settings.max_reports_per_day:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Demo limit reached: {settings.max_reports_per_day} reports per day."
            ),
        )


def usage_payload(repo, user: AuthUser) -> dict:
    usage = repo.usage_today(user.id)
    return {
        "documents_used": usage["documents"],
        "documents_limit": settings.max_documents_per_user,
        "chat_used": usage["chat"],
        "chat_limit": settings.max_chat_requests_per_day,
        "reports_used": usage["reports"],
        "reports_limit": settings.max_reports_per_day,
    }
