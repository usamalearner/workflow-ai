"""Data-access layer.

Two interchangeable implementations sit behind :func:`get_repository`:

* :class:`MemoryRepository` — a complete in-process store that powers demo mode
  and requires no external services.
* :class:`SupabaseRepository` — the production path backed by Supabase Postgres +
  pgvector. Row Level Security in the database is the real isolation boundary;
  every method here still scopes by ``user_id`` as defence in depth.
"""

from __future__ import annotations

import math
import uuid
from collections import defaultdict
from datetime import date, datetime, timezone
from functools import lru_cache
from typing import Any, Iterable

from app.core.config import settings
from app.db.supabase import get_supabase


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid() -> str:
    return str(uuid.uuid4())


def _group_pages(ordered_chunks: list[dict]) -> list[dict]:
    """Reconstruct page-level text from chunks already ordered by
    (page_number, chunk_number)."""
    pages: dict[int, list[str]] = defaultdict(list)
    for c in ordered_chunks:
        pages[c.get("page_number", 1)].append(c["content"])
    return [
        {"page_number": p, "content": "\n\n".join(parts)}
        for p, parts in sorted(pages.items())
    ]


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


# ══════════════════════════════════════════════════════════════════════════
#  In-memory repository (demo mode)
# ══════════════════════════════════════════════════════════════════════════
class MemoryRepository:
    def __init__(self) -> None:
        self._documents: dict[str, dict] = {}
        self._chunks: dict[str, dict] = {}
        self._conversations: dict[str, dict] = {}
        self._messages: dict[str, dict] = {}
        self._actions: dict[str, dict] = {}
        self._reports: dict[str, dict] = {}
        self._events: list[dict] = []
        self._seeded: set[str] = set()

    # ── profiles ──────────────────────────────────────────────────────
    def ensure_profile(self, user_id: str, email: str, full_name: str) -> None:
        return None

    # ── documents ─────────────────────────────────────────────────────
    def list_documents(self, user_id: str) -> list[dict]:
        rows = [d for d in self._documents.values() if d["user_id"] == user_id]
        return sorted(rows, key=lambda d: d["created_at"], reverse=True)

    def get_document(self, user_id: str, document_id: str) -> dict | None:
        doc = self._documents.get(document_id)
        if doc and doc["user_id"] == user_id:
            return doc
        return None

    def create_document(self, user_id: str, data: dict) -> dict:
        doc = {
            "id": _uid(),
            "user_id": user_id,
            "status": "uploading",
            "page_count": 0,
            "chunk_count": 0,
            "error": None,
            "is_demo": False,
            "storage_path": None,
            "created_at": _now(),
            "updated_at": _now(),
            **data,
        }
        self._documents[doc["id"]] = doc
        return doc

    def update_document(self, user_id: str, document_id: str, patch: dict) -> dict | None:
        doc = self.get_document(user_id, document_id)
        if not doc:
            return None
        doc.update(patch)
        doc["updated_at"] = _now()
        return doc

    def delete_document(self, user_id: str, document_id: str) -> bool:
        doc = self.get_document(user_id, document_id)
        if not doc:
            return False
        del self._documents[document_id]
        for cid in [c for c, v in self._chunks.items() if v["document_id"] == document_id]:
            del self._chunks[cid]
        return True

    # ── chunks / vector search ────────────────────────────────────────
    def add_chunks(self, chunks: Iterable[dict]) -> int:
        n = 0
        for ch in chunks:
            cid = ch.get("id") or _uid()
            self._chunks[cid] = {"id": cid, "created_at": _now(), **ch}
            n += 1
        return n

    def document_text(self, user_id: str, document_id: str) -> str:
        rows = [
            c
            for c in self._chunks.values()
            if c["document_id"] == document_id and c["user_id"] == user_id
        ]
        rows.sort(key=lambda c: (c.get("page_number", 0), c.get("chunk_number", 0)))
        return "\n\n".join(c["content"] for c in rows)

    def document_pages(self, user_id: str, document_id: str) -> list[dict]:
        rows = [
            c
            for c in self._chunks.values()
            if c["document_id"] == document_id and c["user_id"] == user_id
        ]
        rows.sort(key=lambda c: (c.get("page_number", 0), c.get("chunk_number", 0)))
        return _group_pages(rows)

    def search_chunks(
        self,
        user_id: str,
        query_embedding: list[float],
        document_ids: list[str] | None = None,
        top_k: int = 6,
    ) -> list[dict]:
        pool = [
            c
            for c in self._chunks.values()
            if c["user_id"] == user_id
            and (not document_ids or c["document_id"] in document_ids)
        ]
        scored = [
            {**c, "score": _cosine(query_embedding, c.get("embedding") or [])}
            for c in pool
        ]
        scored.sort(key=lambda c: c["score"], reverse=True)
        return scored[:top_k]

    # ── conversations / messages ──────────────────────────────────────
    def list_conversations(self, user_id: str) -> list[dict]:
        rows = [c for c in self._conversations.values() if c["user_id"] == user_id]
        # Return copies with a computed message_count — never mutate the
        # stored dict, or a later get_conversation() would inherit a stale
        # message_count key and collide with the one the API sets explicitly.
        out = [
            {
                **r,
                "message_count": sum(
                    1 for m in self._messages.values() if m["conversation_id"] == r["id"]
                ),
            }
            for r in rows
        ]
        return sorted(out, key=lambda c: c["updated_at"], reverse=True)

    def create_conversation(self, user_id: str, title: str) -> dict:
        conv = {
            "id": _uid(),
            "user_id": user_id,
            "title": title[:120] or "New conversation",
            "created_at": _now(),
            "updated_at": _now(),
        }
        self._conversations[conv["id"]] = conv
        return conv

    def get_conversation(self, user_id: str, conversation_id: str) -> dict | None:
        conv = self._conversations.get(conversation_id)
        if conv and conv["user_id"] == user_id:
            return conv
        return None

    def list_messages(self, conversation_id: str) -> list[dict]:
        rows = [m for m in self._messages.values() if m["conversation_id"] == conversation_id]
        return sorted(rows, key=lambda m: m["created_at"])

    def add_message(
        self,
        user_id: str,
        conversation_id: str,
        role: str,
        content: str,
        sources: list[dict] | None = None,
    ) -> dict:
        msg = {
            "id": _uid(),
            "conversation_id": conversation_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "sources": sources or [],
            "created_at": _now(),
        }
        self._messages[msg["id"]] = msg
        conv = self._conversations.get(conversation_id)
        if conv:
            conv["updated_at"] = _now()
        return msg

    # ── actions ───────────────────────────────────────────────────────
    def list_actions(self, user_id: str) -> list[dict]:
        rows = [a for a in self._actions.values() if a["user_id"] == user_id]
        for a in rows:
            a["source_filename"] = self._filename_for(user_id, a.get("source_document_id"))
        return sorted(rows, key=lambda a: a["created_at"], reverse=True)

    def get_action(self, user_id: str, action_id: str) -> dict | None:
        a = self._actions.get(action_id)
        if a and a["user_id"] == user_id:
            a["source_filename"] = self._filename_for(user_id, a.get("source_document_id"))
            return a
        return None

    def create_action(self, user_id: str, data: dict) -> dict:
        action = {
            "id": _uid(),
            "user_id": user_id,
            "source_document_id": None,
            "description": "",
            "owner": "",
            "deadline": None,
            "priority": "medium",
            "status": "pending",
            "is_demo": False,
            "created_at": _now(),
            "updated_at": _now(),
            **data,
        }
        self._actions[action["id"]] = action
        action["source_filename"] = self._filename_for(
            user_id, action.get("source_document_id")
        )
        return action

    def bulk_create_actions(self, user_id: str, items: list[dict]) -> list[dict]:
        return [self.create_action(user_id, it) for it in items]

    def update_action(self, user_id: str, action_id: str, patch: dict) -> dict | None:
        a = self.get_action(user_id, action_id)
        if not a:
            return None
        a.update({k: v for k, v in patch.items() if v is not None})
        a["updated_at"] = _now()
        return a

    def _filename_for(self, user_id: str, document_id: str | None) -> str | None:
        if not document_id:
            return None
        doc = self._documents.get(document_id)
        return doc["original_filename"] if doc else None

    # ── reports ───────────────────────────────────────────────────────
    def list_reports(self, user_id: str) -> list[dict]:
        rows = [r for r in self._reports.values() if r["user_id"] == user_id]
        return sorted(rows, key=lambda r: r["created_at"], reverse=True)

    def create_report(self, user_id: str, data: dict) -> dict:
        report = {
            "id": _uid(),
            "user_id": user_id,
            "source_documents": [],
            "source_filenames": [],
            "is_demo": False,
            "created_at": _now(),
            **data,
        }
        self._reports[report["id"]] = report
        return report

    def get_report(self, user_id: str, report_id: str) -> dict | None:
        r = self._reports.get(report_id)
        return r if r and r["user_id"] == user_id else None

    # ── analytics / usage ─────────────────────────────────────────────
    def record_event(self, user_id: str, kind: str, value: int = 1) -> None:
        self._events.append(
            {"user_id": user_id, "kind": kind, "value": value, "created_at": _now()}
        )

    def _events_for(self, user_id: str) -> list[dict]:
        return [e for e in self._events if e["user_id"] == user_id]

    def usage_today(self, user_id: str) -> dict[str, int]:
        today = _now().date()
        buckets: dict[str, int] = defaultdict(int)
        for e in self._events_for(user_id):
            if e["created_at"].date() == today:
                buckets[e["kind"]] += e["value"]
        return {
            "documents": sum(
                1 for d in self._documents.values() if d["user_id"] == user_id
            ),
            "chat": buckets.get("questions_answered", 0),
            "reports": buckets.get("reports_generated", 0),
        }

    def analytics(self, user_id: str) -> dict[str, Any]:
        events = self._events_for(user_id)
        totals: dict[str, int] = defaultdict(int)
        for e in events:
            totals[e["kind"]] += e["value"]

        by_day: dict[str, int] = defaultdict(int)
        for e in events:
            if e["kind"] == "documents_processed":
                by_day[e["created_at"].strftime("%b %d")] += e["value"]
        docs_over_time = [
            {"label": k, "value": float(v)} for k, v in list(by_day.items())[-7:]
        ] or _fallback_trend()

        prio_counts: dict[str, int] = defaultdict(int)
        for a in self._actions.values():
            if a["user_id"] == user_id:
                prio_counts[a["priority"]] += 1
        actions_by_priority = [
            {"label": p.capitalize(), "value": float(prio_counts.get(p, 0))}
            for p in ("low", "medium", "high", "critical")
        ]

        saved_by_day: dict[str, int] = defaultdict(int)
        for e in events:
            if e["kind"] == "minutes_saved":
                saved_by_day[e["created_at"].strftime("%b %d")] += e["value"]
        time_saved_over_time = [
            {"label": k, "value": round(v / 60, 1)}
            for k, v in list(saved_by_day.items())[-7:]
        ] or _fallback_trend(scale=2.0)

        return {
            "documents_processed": totals.get("documents_processed", 0),
            "questions_answered": totals.get("questions_answered", 0),
            "actions_extracted": totals.get("actions_extracted", 0),
            "reports_generated": totals.get("reports_generated", 0),
            "estimated_minutes_saved": totals.get("minutes_saved", 0),
            "documents_over_time": docs_over_time,
            "actions_by_priority": actions_by_priority,
            "time_saved_over_time": time_saved_over_time,
        }

    # ── demo seeding ──────────────────────────────────────────────────
    def is_seeded(self, user_id: str) -> bool:
        return user_id in self._seeded

    def mark_seeded(self, user_id: str) -> None:
        self._seeded.add(user_id)

    def reset_workspace(self, user_id: str) -> None:
        for store in (
            self._documents,
            self._chunks,
            self._conversations,
            self._messages,
            self._actions,
            self._reports,
        ):
            for k in [k for k, v in store.items() if v["user_id"] == user_id]:
                del store[k]
        self._events = [e for e in self._events if e["user_id"] != user_id]
        self._seeded.discard(user_id)


def _fallback_trend(scale: float = 1.0) -> list[dict]:
    base = [2, 3, 3, 5, 4, 6, 7]
    labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return [{"label": l, "value": round(v * scale, 1)} for l, v in zip(labels, base)]


# ══════════════════════════════════════════════════════════════════════════
#  Supabase repository (production)
# ══════════════════════════════════════════════════════════════════════════
class SupabaseRepository:
    """Thin mapping onto Supabase tables. RLS enforces isolation in the DB;
    the explicit ``user_id`` filters here are defence in depth."""

    def __init__(self, client: Any) -> None:
        self.c = client

    # profiles
    def ensure_profile(self, user_id: str, email: str, full_name: str) -> None:
        self.c.table("profiles").upsert(
            {"id": user_id, "email": email, "full_name": full_name}
        ).execute()

    # documents
    def list_documents(self, user_id: str) -> list[dict]:
        res = (
            self.c.table("documents")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def get_document(self, user_id: str, document_id: str) -> dict | None:
        res = (
            self.c.table("documents")
            .select("*")
            .eq("user_id", user_id)
            .eq("id", document_id)
            .limit(1)
            .execute()
        )
        return (res.data or [None])[0]

    def create_document(self, user_id: str, data: dict) -> dict:
        payload = {"user_id": user_id, "status": "uploading", **data}
        res = self.c.table("documents").insert(payload).execute()
        return res.data[0]

    def update_document(self, user_id: str, document_id: str, patch: dict) -> dict | None:
        res = (
            self.c.table("documents")
            .update({**patch, "updated_at": _now().isoformat()})
            .eq("user_id", user_id)
            .eq("id", document_id)
            .execute()
        )
        return (res.data or [None])[0]

    def delete_document(self, user_id: str, document_id: str) -> bool:
        res = (
            self.c.table("documents")
            .delete()
            .eq("user_id", user_id)
            .eq("id", document_id)
            .execute()
        )
        return bool(res.data)

    # chunks
    def add_chunks(self, chunks: Iterable[dict]) -> int:
        rows = list(chunks)
        if not rows:
            return 0
        self.c.table("document_chunks").insert(rows).execute()
        return len(rows)

    def document_text(self, user_id: str, document_id: str) -> str:
        res = (
            self.c.table("document_chunks")
            .select("content, page_number, chunk_number")
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .order("page_number")
            .order("chunk_number")
            .execute()
        )
        return "\n\n".join(r["content"] for r in (res.data or []))

    def document_pages(self, user_id: str, document_id: str) -> list[dict]:
        res = (
            self.c.table("document_chunks")
            .select("content, page_number, chunk_number")
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .order("page_number")
            .order("chunk_number")
            .execute()
        )
        return _group_pages(res.data or [])

    def search_chunks(
        self,
        user_id: str,
        query_embedding: list[float],
        document_ids: list[str] | None = None,
        top_k: int = 6,
    ) -> list[dict]:
        res = self.c.rpc(
            "match_document_chunks",
            {
                "p_user_id": user_id,
                "p_query_embedding": query_embedding,
                "p_match_count": top_k,
                "p_document_ids": document_ids,
            },
        ).execute()
        return res.data or []

    # conversations / messages
    def list_conversations(self, user_id: str) -> list[dict]:
        res = (
            self.c.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return res.data or []

    def create_conversation(self, user_id: str, title: str) -> dict:
        res = (
            self.c.table("conversations")
            .insert({"user_id": user_id, "title": title[:120] or "New conversation"})
            .execute()
        )
        return res.data[0]

    def get_conversation(self, user_id: str, conversation_id: str) -> dict | None:
        res = (
            self.c.table("conversations")
            .select("*")
            .eq("user_id", user_id)
            .eq("id", conversation_id)
            .limit(1)
            .execute()
        )
        return (res.data or [None])[0]

    def list_messages(self, conversation_id: str) -> list[dict]:
        res = (
            self.c.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at")
            .execute()
        )
        return res.data or []

    def add_message(
        self,
        user_id: str,
        conversation_id: str,
        role: str,
        content: str,
        sources: list[dict] | None = None,
    ) -> dict:
        res = (
            self.c.table("messages")
            .insert(
                {
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "role": role,
                    "content": content,
                    "sources": sources or [],
                }
            )
            .execute()
        )
        self.c.table("conversations").update(
            {"updated_at": _now().isoformat()}
        ).eq("id", conversation_id).execute()
        return res.data[0]

    # actions
    def list_actions(self, user_id: str) -> list[dict]:
        res = (
            self.c.table("actions")
            .select("*, documents(original_filename)")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        rows = res.data or []
        for r in rows:
            doc = r.pop("documents", None)
            r["source_filename"] = doc["original_filename"] if doc else None
        return rows

    def get_action(self, user_id: str, action_id: str) -> dict | None:
        res = (
            self.c.table("actions")
            .select("*")
            .eq("user_id", user_id)
            .eq("id", action_id)
            .limit(1)
            .execute()
        )
        return (res.data or [None])[0]

    def create_action(self, user_id: str, data: dict) -> dict:
        res = self.c.table("actions").insert({"user_id": user_id, **data}).execute()
        return res.data[0]

    def bulk_create_actions(self, user_id: str, items: list[dict]) -> list[dict]:
        payload = [{"user_id": user_id, **it} for it in items]
        res = self.c.table("actions").insert(payload).execute()
        return res.data or []

    def update_action(self, user_id: str, action_id: str, patch: dict) -> dict | None:
        clean = {k: v for k, v in patch.items() if v is not None}
        clean["updated_at"] = _now().isoformat()
        res = (
            self.c.table("actions")
            .update(clean)
            .eq("user_id", user_id)
            .eq("id", action_id)
            .execute()
        )
        return (res.data or [None])[0]

    # reports
    def list_reports(self, user_id: str) -> list[dict]:
        res = (
            self.c.table("reports")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def create_report(self, user_id: str, data: dict) -> dict:
        res = self.c.table("reports").insert({"user_id": user_id, **data}).execute()
        return res.data[0]

    def get_report(self, user_id: str, report_id: str) -> dict | None:
        res = (
            self.c.table("reports")
            .select("*")
            .eq("user_id", user_id)
            .eq("id", report_id)
            .limit(1)
            .execute()
        )
        return (res.data or [None])[0]

    # analytics
    def record_event(self, user_id: str, kind: str, value: int = 1) -> None:
        self.c.table("analytics").insert(
            {"user_id": user_id, "kind": kind, "value": value}
        ).execute()

    def usage_today(self, user_id: str) -> dict[str, int]:
        docs = self.c.table("documents").select("id", count="exact").eq(
            "user_id", user_id
        ).execute()
        start = _now().date().isoformat()
        events = (
            self.c.table("analytics")
            .select("kind, value")
            .eq("user_id", user_id)
            .gte("created_at", start)
            .execute()
        ).data or []
        chat = sum(e["value"] for e in events if e["kind"] == "questions_answered")
        reports = sum(e["value"] for e in events if e["kind"] == "reports_generated")
        return {"documents": docs.count or 0, "chat": chat, "reports": reports}

    def analytics(self, user_id: str) -> dict[str, Any]:
        events = (
            self.c.table("analytics").select("*").eq("user_id", user_id).execute()
        ).data or []
        totals: dict[str, int] = defaultdict(int)
        for e in events:
            totals[e["kind"]] += e["value"]
        actions = self.list_actions(user_id)
        prio_counts: dict[str, int] = defaultdict(int)
        for a in actions:
            prio_counts[a["priority"]] += 1
        return {
            "documents_processed": totals.get("documents_processed", 0),
            "questions_answered": totals.get("questions_answered", 0),
            "actions_extracted": totals.get("actions_extracted", 0),
            "reports_generated": totals.get("reports_generated", 0),
            "estimated_minutes_saved": totals.get("minutes_saved", 0),
            "documents_over_time": _fallback_trend(),
            "actions_by_priority": [
                {"label": p.capitalize(), "value": float(prio_counts.get(p, 0))}
                for p in ("low", "medium", "high", "critical")
            ],
            "time_saved_over_time": _fallback_trend(scale=2.0),
        }

    def is_seeded(self, user_id: str) -> bool:
        res = (
            self.c.table("documents")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("is_demo", True)
            .execute()
        )
        return bool(res.count)

    def mark_seeded(self, user_id: str) -> None:
        return None

    def reset_workspace(self, user_id: str) -> None:
        for table in ("reports", "actions", "messages", "conversations", "documents"):
            self.c.table(table).delete().eq("user_id", user_id).execute()


@lru_cache
def _memory_repo() -> MemoryRepository:
    return MemoryRepository()


def get_repository():
    if settings.is_demo:
        return _memory_repo()
    client = get_supabase()
    if client is None:
        return _memory_repo()
    return SupabaseRepository(client)
