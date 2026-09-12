"""Pydantic schemas for the AI Copilot / RAG chat."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class Source(BaseModel):
    index: int
    document_id: str
    filename: str
    page_number: int
    chunk_number: int
    snippet: str
    score: float


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = None
    document_ids: list[str] | None = None


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: Role
    content: str
    sources: list[Source] = Field(default_factory=list)
    created_at: datetime


class ChatResponse(BaseModel):
    conversation_id: str
    message: MessageOut
    grounded: bool


class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationDetailOut(ConversationOut):
    messages: list[MessageOut] = Field(default_factory=list)
