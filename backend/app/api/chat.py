"""AI Copilot API: RAG chat and conversation history."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import RepoDep, UserDep, enforce_chat_limit
from app.core.security import AuthUser
from app.models.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetailOut,
    ConversationOut,
    MessageOut,
)
from app.services import rag

router = APIRouter(tags=["copilot"])


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatRequest, repo=RepoDep, user: AuthUser = UserDep) -> ChatResponse:
    enforce_chat_limit(repo, user)

    conversation = (
        repo.get_conversation(user.id, body.conversation_id)
        if body.conversation_id
        else None
    )
    if body.conversation_id and not conversation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found.")
    if not conversation:
        conversation = repo.create_conversation(user.id, body.message)

    repo.add_message(user.id, conversation["id"], "user", body.message)

    answer, sources, grounded = rag.answer_question(
        repo,
        user_id=user.id,
        query=body.message,
        document_ids=body.document_ids,
    )
    msg = repo.add_message(
        user.id, conversation["id"], "assistant", answer, sources=sources
    )
    repo.record_event(user.id, "questions_answered", 1)
    repo.record_event(user.id, "minutes_saved", 12)

    return ChatResponse(
        conversation_id=conversation["id"],
        message=MessageOut.model_validate(msg),
        grounded=grounded,
    )


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(repo=RepoDep, user: AuthUser = UserDep) -> list[ConversationOut]:
    return [ConversationOut.model_validate(c) for c in repo.list_conversations(user.id)]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailOut)
def get_conversation(
    conversation_id: str, repo=RepoDep, user: AuthUser = UserDep
) -> ConversationDetailOut:
    conv = repo.get_conversation(user.id, conversation_id)
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Conversation not found.")
    messages = [MessageOut.model_validate(m) for m in repo.list_messages(conversation_id)]
    # Build explicitly rather than **conv — never trust the repo dict's exact
    # shape (e.g. it may already carry a stale message_count from elsewhere).
    return ConversationDetailOut(
        id=conv["id"],
        title=conv["title"],
        created_at=conv["created_at"],
        updated_at=conv["updated_at"],
        message_count=len(messages),
        messages=messages,
    )
