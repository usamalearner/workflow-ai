"""Report generation orchestration."""

from __future__ import annotations

from app.services import llm

REPORT_TITLES = {
    "executive_summary": "Executive Summary",
    "technical_report": "Technical Report",
    "management_brief": "Management Brief",
    "risk_assessment": "Risk Assessment",
    "meeting_summary": "Meeting Summary",
    "document_comparison": "Document Comparison",
}


def build_report(
    repo,
    *,
    user_id: str,
    report_type: str,
    document_ids: list[str],
    title: str | None = None,
) -> dict:
    docs: list[dict] = []
    filenames: list[str] = []
    for doc_id in document_ids:
        doc = repo.get_document(user_id, doc_id)
        if not doc:
            continue
        filenames.append(doc["original_filename"])
        text = repo.document_text(user_id, doc_id)
        docs.append({"filename": doc["original_filename"], "text": text})

    if not docs:
        raise ValueError("None of the selected documents were found in your workspace.")

    content = llm.generate_report(report_type, docs)
    resolved_title = (
        title
        or f"{REPORT_TITLES.get(report_type, 'Report')} — {', '.join(filenames)[:80]}"
    )
    return {
        "title": resolved_title,
        "report_type": report_type,
        "content": content,
        "source_documents": [d for d in document_ids if repo.get_document(user_id, d)],
        "source_filenames": filenames,
    }
