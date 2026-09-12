"""Ad-hoc file analysis (spreadsheet intelligence without persisting the file)."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.api.deps import UserDep
from app.core.config import settings
from app.core.security import AuthUser
from app.models.documents import SpreadsheetAnalysisOut
from app.services import excel
from app.services.documents import detect_file_type

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/analyze", response_model=SpreadsheetAnalysisOut)
async def analyze_file(
    file: UploadFile = File(...), user: AuthUser = UserDep
) -> SpreadsheetAnalysisOut:
    filename = file.filename or "upload"
    try:
        file_type = detect_file_type(filename)
    except ValueError as exc:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, str(exc)) from exc
    if file_type not in ("xlsx", "csv"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Only XLSX and CSV files can be analysed."
        )

    content = await file.read()
    if len(content) > settings.max_file_size_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds the {settings.max_file_size_mb} MB limit.",
        )
    try:
        result = excel.analyze(content, file_type, filename)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Could not analyse the spreadsheet: {exc}",
        ) from exc
    return SpreadsheetAnalysisOut(**result)
