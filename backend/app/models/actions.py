"""Pydantic schemas for the Action Center."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

Priority = Literal["low", "medium", "high", "critical"]
ActionStatus = Literal["pending", "in_progress", "completed"]
CommChannel = Literal["email", "whatsapp"]


class ActionBase(BaseModel):
    title: str = Field(min_length=1, max_length=280)
    description: str = ""
    owner: str = ""
    deadline: date | None = None
    priority: Priority = "medium"
    status: ActionStatus = "pending"


class ActionCreate(ActionBase):
    source_document_id: str | None = None


class ActionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    owner: str | None = None
    deadline: date | None = None
    priority: Priority | None = None
    status: ActionStatus | None = None


class ActionOut(ActionBase):
    id: str
    source_document_id: str | None = None
    source_filename: str | None = None
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime


class ExtractedAction(ActionBase):
    source_filename: str | None = None


class ExtractActionsOut(BaseModel):
    document_id: str
    count: int
    by_priority: dict[str, int]
    actions: list[ExtractedAction]


class GenerateCommRequest(BaseModel):
    channel: CommChannel


class GeneratedComm(BaseModel):
    channel: CommChannel
    subject: str | None = None
    to: str
    body: str
