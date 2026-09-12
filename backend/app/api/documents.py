"""Documents API: upload, list, retrieve, delete, summarize, extract actions."""

from __future__ import annotations

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    HTTPException,
    Response,
    UploadFile,
    status,
)

from app.api.deps import RepoDep, UserDep, enforce_document_limit, usage_payload
from app.core.config import settings
from app.core.security import AuthUser
from app.models.actions import ExtractActionsOut
from app.models.documents import (
    DocumentContentOut,
    DocumentListOut,
    DocumentOut,
    SpreadsheetAnalysisOut,
    SummaryOut,
)
from app.services import excel, llm, rag, storage
from app.services.documents import detect_file_type

router = APIRouter(prefix="/documents", tags=["documents"])

_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "csv": "text/csv",
}


def _process(repo, user_id: str, document_id: str, content: bytes, file_type: str) -> None:
    rag.process_document(
        repo,
        user_id=user_id,
        document_id=document_id,
        content=content,
        file_type=file_type,
    )


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    repo=RepoDep,
    user: AuthUser = UserDep,
) -> DocumentOut:
    enforce_document_limit(repo, user)

    filename = file.filename or "upload"
    try:
        file_type = detect_file_type(filename)
    except ValueError as exc:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, str(exc)) from exc

    content = await file.read()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "The uploaded file is empty.")
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds the {settings.max_file_size_mb} MB limit.",
        )

    doc = repo.create_document(
        user.id,
        {
            "filename": filename,
            "original_filename": filename,
            "file_type": file_type,
            "file_size": len(content),
        },
    )
    path = storage.put(user.id, doc["id"], filename, content)
    repo.update_document(user.id, doc["id"], {"storage_path": path})

    background.add_task(_process, repo, user.id, doc["id"], content, file_type)
    return DocumentOut.model_validate(repo.get_document(user.id, doc["id"]))


@router.get("", response_model=DocumentListOut)
def list_documents(repo=RepoDep, user: AuthUser = UserDep) -> DocumentListOut:
    docs = [DocumentOut.model_validate(d) for d in repo.list_documents(user.id)]
    return DocumentListOut(documents=docs, usage=usage_payload(repo, user))


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, repo=RepoDep, user: AuthUser = UserDep) -> DocumentOut:
    doc = repo.get_document(user.id, document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    return DocumentOut.model_validate(doc)


@router.get("/{document_id}/content", response_model=DocumentContentOut)
def get_document_content(
    document_id: str, repo=RepoDep, user: AuthUser = UserDep
) -> DocumentContentOut:
    """Page-by-page extracted text — powers the in-app document reader. Works
    for every processed document, including demo/seeded ones that have no
    original file bytes on disk."""
    doc = repo.get_document(user.id, document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    if doc["status"] != "ready":
        raise HTTPException(status.HTTP_409_CONFLICT, "Document is not ready yet.")
    pages = repo.document_pages(user.id, document_id)
    return DocumentContentOut(
        document_id=document_id,
        filename=doc["original_filename"],
        file_type=doc["file_type"],
        has_original_file=bool(doc.get("storage_path")),
        pages=pages,
    )


@router.get("/{document_id}/file")
def get_document_file(document_id: str, repo=RepoDep, user: AuthUser = UserDep) -> Response:
    """Streams the original uploaded file (inline, not as a download) for
    in-browser viewing — e.g. a native PDF preview. Not available for
    demo/seeded documents, which only have extracted text (use /content)."""
    doc = repo.get_document(user.id, document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    content = storage.get(doc.get("storage_path") or "")
    if not content:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "The original file isn't available to preview — try the reading view instead.",
        )
    media_type = _MEDIA_TYPES.get(doc["file_type"], "application/octet-stream")
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{doc["original_filename"]}"'
        },
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str, repo=RepoDep, user: AuthUser = UserDep
) -> Response:
    doc = repo.get_document(user.id, document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    if doc.get("storage_path"):
        storage.delete(doc["storage_path"])
    repo.delete_document(user.id, document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{document_id}/summarize", response_model=SummaryOut)
def summarize_document(
    document_id: str, repo=RepoDep, user: AuthUser = UserDep
) -> SummaryOut:
    doc = repo.get_document(user.id, document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    if doc["status"] != "ready":
        raise HTTPException(status.HTTP_409_CONFLICT, "Document is not ready yet.")
    text = repo.document_text(user.id, document_id)
    result = llm.summarize_document(text, doc["original_filename"])
    repo.record_event(user.id, "minutes_saved", 12)
    return SummaryOut(document_id=document_id, **result)


@router.post("/{document_id}/extract-actions", response_model=ExtractActionsOut)
def extract_actions(
    document_id: str, repo=RepoDep, user: AuthUser = UserDep
) -> ExtractActionsOut:
    doc = repo.get_document(user.id, document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    if doc["status"] != "ready":
        raise HTTPException(status.HTTP_409_CONFLICT, "Document is not ready yet.")

    text = repo.document_text(user.id, document_id)
    raw = llm.extract_actions(text, doc["original_filename"])
    by_priority: dict[str, int] = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for a in raw:
        by_priority[a.get("priority", "medium")] = (
            by_priority.get(a.get("priority", "medium"), 0) + 1
        )
    repo.record_event(user.id, "actions_extracted", len(raw))
    repo.record_event(user.id, "minutes_saved", 8 * len(raw))
    return ExtractActionsOut(
        document_id=document_id,
        count=len(raw),
        by_priority=by_priority,
        actions=raw,
    )


@router.post("/{document_id}/analyze", response_model=SpreadsheetAnalysisOut)
def analyze_stored_spreadsheet(
    document_id: str, repo=RepoDep, user: AuthUser = UserDep
) -> SpreadsheetAnalysisOut:
    doc = repo.get_document(user.id, document_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    if doc["file_type"] not in ("xlsx", "csv"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Only XLSX and CSV files can be analysed."
        )
    content = storage.get(doc.get("storage_path") or "")
    if not content:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "The original file is no longer available for analysis.",
        )
    result = excel.analyze(content, doc["file_type"], doc["original_filename"])
    return SpreadsheetAnalysisOut(document_id=document_id, **result)
