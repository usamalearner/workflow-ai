"""Report generation orchestration."""

from __future__ import annotations

from app.services import llm, rag

REPORT_TITLES = {
    "executive_summary": "Executive Summary",
    "technical_report": "Technical Report",
    "management_brief": "Management Brief",
    "risk_assessment": "Risk Assessment",
    "meeting_summary": "Meeting Summary",
    "document_comparison": "Document Comparison",
}

# What each report type should pull out of a document via vector search,
# instead of blindly sending its first N characters — so an insight buried
# deep in a long document still has a shot at making the report.
REPORT_FOCUS_QUERIES = {
    "executive_summary": "overview outcomes achievements overall summary",
    "technical_report": "technical specifications measurements methodology equipment faults",
    "management_brief": "decisions priorities budget timeline resourcing",
    "risk_assessment": "risk hazard safety issue critical failure likelihood impact",
    "meeting_summary": "decisions made action items attendees agenda discussion points",
    "document_comparison": "differences comparison discrepancy consistency",
}
_RETRIEVE_TOP_K = 12
_MAX_CHARS_PER_DOC = 12000


def build_report(
    repo,
    *,
    user_id: str,
    report_type: str,
    document_ids: list[str],
    title: str | None = None,
) -> dict:
    focus_query = REPORT_FOCUS_QUERIES.get(
        report_type, "key points issues and recommended actions"
    )
    docs: list[dict] = []
    filenames: list[str] = []
    for doc_id in document_ids:
        doc = repo.get_document(user_id, doc_id)
        if not doc:
            continue
        filenames.append(doc["original_filename"])
        passages = rag.retrieve(
            repo,
            user_id=user_id,
            query=focus_query,
            document_ids=[doc_id],
            top_k=_RETRIEVE_TOP_K,
        )
        if passages:
            text = "\n\n".join(
                f"[Page {p['page_number']}] {p['snippet']}" for p in passages
            )
        else:
            # Nothing scored above the relevance floor (e.g. a very short
            # document) — fall back to the raw text rather than an empty
            # section for that document.
            text = repo.document_text(user_id, doc_id)
        docs.append({"filename": doc["original_filename"], "text": text[:_MAX_CHARS_PER_DOC]})

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
