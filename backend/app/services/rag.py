"""Retrieval-Augmented Generation pipeline.

    upload → parse → chunk → embed → store
    question → embed query → vector search → retrieve passages → Groq → answer + sources
"""

from __future__ import annotations

import logging

from app.services import documents as docsvc
from app.services import llm
from app.services.embeddings import embed_text, embed_texts

logger = logging.getLogger("workflow.rag")

_MIN_SCORE = 0.03


def process_document(
    repo,
    *,
    user_id: str,
    document_id: str,
    content: bytes,
    file_type: str,
) -> dict:
    """Parse, chunk, embed and persist. Updates document status in place."""
    repo.update_document(user_id, document_id, {"status": "processing"})
    try:
        parsed = docsvc.parse(content, file_type)
        chunks = docsvc.chunk_document(
            parsed, document_id=document_id, user_id=user_id
        )
        embeddings = embed_texts([c.content for c in chunks])
        repo.add_chunks(
            [
                {
                    "document_id": c.document_id,
                    "user_id": c.user_id,
                    "content": c.content,
                    "page_number": c.page_number,
                    "chunk_number": c.chunk_number,
                    "embedding": emb,
                }
                for c, emb in zip(chunks, embeddings)
            ]
        )
        doc = repo.update_document(
            user_id,
            document_id,
            {
                "status": "ready",
                "page_count": parsed.page_count,
                "chunk_count": len(chunks),
            },
        )
        repo.record_event(user_id, "documents_processed", 1)
        repo.record_event(user_id, "minutes_saved", 20)
        return doc
    except (docsvc.UnsupportedFileType, docsvc.CorruptFile) as exc:
        return repo.update_document(
            user_id, document_id, {"status": "failed", "error": str(exc)}
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("processing failed for %s", document_id)
        return repo.update_document(
            user_id,
            document_id,
            {"status": "failed", "error": f"Processing error: {exc}"},
        )


def retrieve(
    repo,
    *,
    user_id: str,
    query: str,
    document_ids: list[str] | None = None,
    top_k: int = 6,
) -> list[dict]:
    q_emb = embed_text(query)
    rows = repo.search_chunks(user_id, q_emb, document_ids, top_k)
    passages: list[dict] = []
    for i, r in enumerate(rows, start=1):
        if r.get("score", 0) < _MIN_SCORE:
            continue
        doc = repo.get_document(user_id, r["document_id"])
        passages.append(
            {
                "index": len(passages) + 1,
                "document_id": r["document_id"],
                "filename": doc["original_filename"] if doc else "Document",
                "page_number": r.get("page_number", 1),
                "chunk_number": r.get("chunk_number", i),
                "snippet": r["content"],
                "score": round(float(r.get("score", 0)), 4),
            }
        )
    return passages


def answer_question(
    repo,
    *,
    user_id: str,
    query: str,
    document_ids: list[str] | None = None,
) -> tuple[str, list[dict], bool]:
    passages = retrieve(repo, user_id=user_id, query=query, document_ids=document_ids)
    answer, grounded = llm.generate_answer(query, passages)
    return answer, passages, grounded
