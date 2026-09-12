"""Pydantic schemas for AI Reports and Analytics."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ReportType = Literal[
    "executive_summary",
    "technical_report",
    "management_brief",
    "risk_assessment",
    "meeting_summary",
    "document_comparison",
]


class ReportGenerateRequest(BaseModel):
    report_type: ReportType
    document_ids: list[str] = Field(min_length=1)
    title: str | None = None


class ReportOut(BaseModel):
    id: str
    title: str
    report_type: ReportType
    content: str
    source_documents: list[str] = Field(default_factory=list)
    source_filenames: list[str] = Field(default_factory=list)
    is_demo: bool = False
    created_at: datetime


class TrendPoint(BaseModel):
    label: str
    value: float


class AnalyticsOut(BaseModel):
    documents_processed: int
    questions_answered: int
    actions_extracted: int
    reports_generated: int
    estimated_minutes_saved: int
    documents_over_time: list[TrendPoint]
    actions_by_priority: list[TrendPoint]
    time_saved_over_time: list[TrendPoint]
    avg_review_before_min: int = 45
    avg_review_after_min: int = 3
    assumptions_note: str = (
        "Estimated based on user-defined workflow assumptions, "
        "not scientifically validated measurements."
    )
