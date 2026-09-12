"""AI Reports API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import RepoDep, UserDep, enforce_report_limit
from app.core.security import AuthUser
from app.models.reports import ReportGenerateRequest, ReportOut
from app.services import reports as report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(repo=RepoDep, user: AuthUser = UserDep) -> list[ReportOut]:
    return [ReportOut.model_validate(r) for r in repo.list_reports(user.id)]


@router.post("/generate", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
def generate_report(
    body: ReportGenerateRequest, repo=RepoDep, user: AuthUser = UserDep
) -> ReportOut:
    enforce_report_limit(repo, user)
    try:
        built = report_service.build_report(
            repo,
            user_id=user.id,
            report_type=body.report_type,
            document_ids=body.document_ids,
            title=body.title,
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc

    report = repo.create_report(user.id, built)
    repo.record_event(user.id, "reports_generated", 1)
    repo.record_event(user.id, "minutes_saved", 30)
    return ReportOut.model_validate(report)
