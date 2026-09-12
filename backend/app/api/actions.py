"""Action Center API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.api.deps import RepoDep, UserDep
from app.core.security import AuthUser
from app.models.actions import (
    ActionCreate,
    ActionOut,
    ActionUpdate,
    GeneratedComm,
    GenerateCommRequest,
)
from app.services import llm

router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("", response_model=list[ActionOut])
def list_actions(repo=RepoDep, user: AuthUser = UserDep) -> list[ActionOut]:
    return [ActionOut.model_validate(a) for a in repo.list_actions(user.id)]


@router.post("", response_model=ActionOut, status_code=status.HTTP_201_CREATED)
def create_action(
    body: ActionCreate, repo=RepoDep, user: AuthUser = UserDep
) -> ActionOut:
    if body.source_document_id and not repo.get_document(
        user.id, body.source_document_id
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Source document not found.")
    data = body.model_dump(mode="json")
    action = repo.create_action(user.id, data)
    return ActionOut.model_validate(action)


@router.post("/bulk", response_model=list[ActionOut], status_code=status.HTTP_201_CREATED)
def create_actions_bulk(
    body: list[ActionCreate], repo=RepoDep, user: AuthUser = UserDep
) -> list[ActionOut]:
    items = [a.model_dump(mode="json") for a in body]
    created = repo.bulk_create_actions(user.id, items)
    return [ActionOut.model_validate(a) for a in created]


@router.patch("/{action_id}", response_model=ActionOut)
def update_action(
    action_id: str, body: ActionUpdate, repo=RepoDep, user: AuthUser = UserDep
) -> ActionOut:
    updated = repo.update_action(
        user.id, action_id, body.model_dump(mode="json", exclude_unset=True)
    )
    if not updated:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Action not found.")
    return ActionOut.model_validate(updated)


@router.post("/{action_id}/communication", response_model=GeneratedComm)
def generate_communication(
    action_id: str,
    body: GenerateCommRequest,
    repo=RepoDep,
    user: AuthUser = UserDep,
) -> GeneratedComm:
    action = repo.get_action(user.id, action_id)
    if not action:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Action not found.")
    result = llm.generate_communication(body.channel, action)
    repo.record_event(user.id, "minutes_saved", 6)
    return GeneratedComm(channel=body.channel, **result)
