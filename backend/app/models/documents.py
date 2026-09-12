"""Pydantic schemas for documents and spreadsheet analysis."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

DocumentStatus = Literal["uploading", "processing", "ready", "failed"]
FileType = Literal["pdf", "docx", "xlsx", "csv"]


class DocumentOut(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: FileType
    file_size: int
    status: DocumentStatus
    page_count: int = 0
    chunk_count: int = 0
    is_demo: bool = False
    error: str | None = None
    created_at: datetime
    updated_at: datetime


class DocumentListOut(BaseModel):
    documents: list[DocumentOut]
    usage: "UsageOut"


class UsageOut(BaseModel):
    documents_used: int
    documents_limit: int
    chat_used: int
    chat_limit: int
    reports_used: int
    reports_limit: int


class SummaryOut(BaseModel):
    document_id: str
    summary: str
    key_points: list[str] = Field(default_factory=list)


class DocumentPage(BaseModel):
    page_number: int
    content: str


class DocumentContentOut(BaseModel):
    document_id: str
    filename: str
    file_type: FileType
    has_original_file: bool
    pages: list[DocumentPage] = Field(default_factory=list)


class ColumnStat(BaseModel):
    name: str
    dtype: str
    missing: int
    mean: float | None = None
    minimum: float | None = None
    maximum: float | None = None
    total: float | None = None


class SpreadsheetOverview(BaseModel):
    rows: int
    columns: int
    missing_values: int
    column_stats: list[ColumnStat]


class ChartSeries(BaseModel):
    label: str
    points: list[dict]


class SpreadsheetAnalysisOut(BaseModel):
    document_id: str | None = None
    filename: str
    overview: SpreadsheetOverview
    insights: list[str]
    charts: list[ChartSeries] = Field(default_factory=list)


DocumentListOut.model_rebuild()
