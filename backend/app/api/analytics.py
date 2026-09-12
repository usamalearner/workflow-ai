"""Analytics + demo workspace management."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import RepoDep, UserDep, usage_payload
from app.core.security import AuthUser
from app.models.documents import UsageOut
from app.models.reports import AnalyticsOut
from app.services.demo_seed import seed

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(repo=RepoDep, user: AuthUser = UserDep) -> AnalyticsOut:
    return AnalyticsOut.model_validate(repo.analytics(user.id))


@router.get("/usage", response_model=UsageOut)
def get_usage(repo=RepoDep, user: AuthUser = UserDep) -> UsageOut:
    return UsageOut.model_validate(usage_payload(repo, user))


@router.post("/demo/seed")
def load_demo_workspace(repo=RepoDep, user: AuthUser = UserDep) -> dict:
    seed(repo, user.id)
    return {"status": "ok", "seeded": True}


@router.post("/demo/reset")
def reset_workspace(repo=RepoDep, user: AuthUser = UserDep) -> dict:
    repo.reset_workspace(user.id)
    return {"status": "ok", "reset": True}
