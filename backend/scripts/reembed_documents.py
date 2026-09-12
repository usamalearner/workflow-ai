"""Re-embed every stored document chunk with the current embedding model.

Needed once, after switching the embedding model (e.g. the hashed-vector ->
intfloat/multilingual-e5-small migration, see
database/migrations/001_e5_384_embeddings.sql) — old vectors live in a
different, incompatible embedding space and won't score correctly against new
query embeddings.

Usage (from backend/, with the venv active):
    python -m scripts.reembed_documents

Requires Supabase to be configured (SUPABASE_URL / SUPABASE_SECRET_KEY) —
demo-mode's in-memory store lives only inside a running server process, so
there's nothing on disk for a separate script to migrate; just restart the
server and re-upload documents instead.
"""

from __future__ import annotations

import sys

from app.db.supabase import get_supabase
from app.services import documents as docsvc
from app.services import storage
from app.services.embeddings import embed_passages


def main() -> int:
    client = get_supabase()
    if client is None:
        print(
            "Supabase isn't configured (or DEMO_MODE is on) — nothing to "
            "migrate. Demo-mode documents live only in the running server's "
            "memory; restart it and re-upload instead."
        )
        return 1

    docs = client.table("documents").select("*").eq("status", "ready").execute().data or []
    print(f"Found {len(docs)} ready document(s) to re-embed.")

    failures = 0
    for doc in docs:
        doc_id, user_id, filename = doc["id"], doc["user_id"], doc["original_filename"]
        print(f"  {filename} ({doc_id}) ...", end=" ", flush=True)
        try:
            if not doc.get("storage_path"):
                raise RuntimeError("no storage_path on record")
            content = storage.get(doc["storage_path"])
            if not content:
                raise RuntimeError("could not download original file from storage")

            parsed = docsvc.parse(content, doc["file_type"])
            chunks = docsvc.chunk_document(parsed, document_id=doc_id, user_id=user_id)
            embeddings = embed_passages([c.content for c in chunks])

            client.table("document_chunks").delete().eq("document_id", doc_id).execute()
            client.table("document_chunks").insert(
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
            ).execute()
            client.table("documents").update(
                {"chunk_count": len(chunks), "page_count": parsed.page_count}
            ).eq("id", doc_id).execute()
            print(f"ok ({len(chunks)} chunks)")
        except Exception as exc:  # noqa: BLE001
            failures += 1
            print(f"FAILED: {exc}")

    print(f"Done. {len(docs) - failures}/{len(docs)} re-embedded successfully.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
