"""Groq LLM client.

All model access goes through this module — nothing else in the codebase talks
to Groq directly. Groq's API is OpenAI-compatible (chat completions + JSON
mode), so this mirrors the familiar `/chat/completions` shape.

Whenever ``settings.llm_configured`` is false (no ``GROQ_API_KEY``) — or a live
call fails — every function falls back to a deterministic, content-grounded
response so the product stays fully demoable without external calls. Fallbacks
synthesise from the supplied context only; they never invent citations. This is
independent of Supabase/storage demo mode: Groq can be "live" even while
documents are still stored in-memory.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings

logger = logging.getLogger("workflow.llm")

SYSTEM_ANSWER = (
    "You are WorkFlow AI, a workplace intelligence copilot. Answer strictly from "
    "the provided context passages. Cite sources inline as [1], [2] matching the "
    "passage numbers. If the context is insufficient, say you could not find "
    "enough information in the workspace. Be concise and professional."
)


class LLMError(RuntimeError):
    pass


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8), reraise=True)
def _post(payload: dict[str, Any]) -> dict[str, Any]:
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=settings.groq_timeout_seconds) as client:
        resp = client.post(
            f"{settings.groq_base_url}/chat/completions", headers=headers, json=payload
        )
    if resp.status_code >= 400:
        logger.warning("Groq error %s: %s", resp.status_code, resp.text[:300])
        raise LLMError(f"Groq request failed ({resp.status_code}).")
    return resp.json()


def _chat(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.2,
    json_mode: bool = False,
) -> str:
    payload: dict[str, Any] = {
        "model": settings.groq_model,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    data = _post(payload)
    try:
        return data["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError) as exc:  # noqa: BLE001
        raise LLMError("Unexpected response shape from Groq.") from exc


def _loads(raw: str) -> Any:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-z]*\n?|\n?```$", "", raw).strip()
    return json.loads(raw)


# ══════════════════════════════════════════════════════════════════════════
#  Public API
# ══════════════════════════════════════════════════════════════════════════
def generate_answer(question: str, passages: list[dict]) -> tuple[str, bool]:
    """Return (answer_markdown, grounded)."""
    if not passages:
        return (
            "I couldn't find enough information in your workspace to answer this "
            "question confidently. Try uploading a relevant document or rephrasing.",
            False,
        )

    context = "\n\n".join(
        f"[{p['index']}] ({p['filename']} · Page {p['page_number']})\n{p['snippet']}"
        for p in passages
    )

    if not settings.llm_configured:
        return _demo_answer(question, passages), True

    try:
        answer = _chat(
            [
                {"role": "system", "content": SYSTEM_ANSWER},
                {
                    "role": "user",
                    "content": f"Context passages:\n{context}\n\nQuestion: {question}",
                },
            ]
        )
        return answer, True
    except LLMError:
        return _demo_answer(question, passages), True


def summarize_document(text: str, filename: str) -> dict[str, Any]:
    if not settings.llm_configured:
        return _demo_summary(text, filename)
    try:
        raw = _chat(
            [
                {
                    "role": "system",
                    "content": "Summarise the document. Return JSON: "
                    '{"summary": str, "key_points": [str, ...]}. 5-7 key points.',
                },
                {"role": "user", "content": text[:16000]},
            ],
            json_mode=True,
        )
        data = _loads(raw)
        return {
            "summary": data.get("summary", ""),
            "key_points": data.get("key_points", [])[:8],
        }
    except (LLMError, json.JSONDecodeError):
        return _demo_summary(text, filename)


def extract_actions(text: str, filename: str) -> list[dict[str, Any]]:
    if not settings.llm_configured:
        return _demo_actions(text, filename)
    try:
        raw = _chat(
            [
                {
                    "role": "system",
                    "content": "Extract concrete action items from the document. "
                    'Return JSON {"actions": [{"title", "description", "owner", '
                    '"deadline" (YYYY-MM-DD or null), "priority" '
                    '(low|medium|high|critical)}]}. Only real, actionable items.',
                },
                {"role": "user", "content": text[:16000]},
            ],
            json_mode=True,
        )
        actions = _loads(raw).get("actions", [])
        for a in actions:
            a["source_filename"] = filename
            a.setdefault("status", "pending")
        return actions[:12]
    except (LLMError, json.JSONDecodeError):
        return _demo_actions(text, filename)


def generate_report(report_type: str, docs: list[dict]) -> str:
    if not settings.llm_configured:
        return _demo_report(report_type, docs)
    corpus = "\n\n".join(f"### {d['filename']}\n{d['text'][:6000]}" for d in docs)
    label = report_type.replace("_", " ").title()
    try:
        return _chat(
            [
                {
                    "role": "system",
                    "content": f"Write a professional {label} in Markdown with "
                    "clear numbered sections: Overview, Key Findings, Critical "
                    "Issues, Risks, Recommended Actions, Sources. Ground every "
                    "statement in the provided documents.",
                },
                {"role": "user", "content": corpus},
            ],
            temperature=0.3,
        )
    except LLMError:
        return _demo_report(report_type, docs)


def generate_communication(channel: str, action: dict) -> dict[str, str]:
    if not settings.llm_configured:
        return _demo_comm(channel, action)
    try:
        raw = _chat(
            [
                {
                    "role": "system",
                    "content": f"Draft a professional {channel} message for this "
                    f"workplace action. Return JSON "
                    f'{{"subject": str|null, "to": str, "body": str}}. '
                    f"{'No subject for whatsapp; keep it short.' if channel == 'whatsapp' else ''}",
                },
                {"role": "user", "content": json.dumps(action, default=str)},
            ],
            json_mode=True,
            temperature=0.4,
        )
        data = _loads(raw)
        return {
            "subject": data.get("subject"),
            "to": data.get("to") or action.get("owner") or "Team",
            "body": data.get("body", ""),
        }
    except (LLMError, json.JSONDecodeError):
        return _demo_comm(channel, action)


def explain_spreadsheet(filename: str, overview: dict, sample: list[dict]) -> list[str]:
    if not settings.llm_configured:
        return _demo_spreadsheet_insights(overview)
    try:
        raw = _chat(
            [
                {
                    "role": "system",
                    "content": "You are a data analyst. The numeric facts below were "
                    "computed with pandas and are correct — do not recompute. "
                    'Return JSON {"insights": [str, ...]} with 4-6 plain-language '
                    "observations about trends, anomalies and notable values.",
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {"file": filename, "overview": overview, "sample": sample[:20]},
                        default=str,
                    ),
                },
            ],
            json_mode=True,
        )
        return _loads(raw).get("insights", [])[:6]
    except (LLMError, json.JSONDecodeError):
        return _demo_spreadsheet_insights(overview)


# ══════════════════════════════════════════════════════════════════════════
#  Deterministic fallbacks (used when Groq isn't configured, or on error)
# ══════════════════════════════════════════════════════════════════════════
def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]


def _demo_answer(question: str, passages: list[dict]) -> str:
    keywords = {w for w in re.findall(r"[a-z]{4,}", question.lower())}

    def overlap(text: str) -> int:
        low = text.lower()
        return sum(1 for k in keywords if k[:-1] in low or k in low)

    # Rank sentences across all passages by keyword overlap, keep their citation.
    scored: list[tuple[int, str, int]] = []
    for p in passages:
        for sent in _sentences(p["snippet"]):
            scored.append((overlap(sent), sent, p["index"]))
    scored.sort(key=lambda t: t[0], reverse=True)
    top = [s for s in scored if s[0] > 0][:3] or scored[:2]

    lead = passages[0]
    lines = " ".join(f"{sent} [{idx}]" for _, sent, idx in top)
    return (
        f"{lines}\n\n"
        f"Answer grounded in **{lead['filename']}** (page {lead['page_number']}) "
        f"and {len(passages)} passage(s) retrieved from your workspace."
    )


def _demo_summary(text: str, filename: str) -> dict[str, Any]:
    sents = _sentences(text)
    return {
        "summary": (
            f"{filename} covers "
            + (sents[0][:220] if sents else "the uploaded material.")
        ),
        "key_points": [s[:160] for s in sents[1:7]] or ["Document processed and indexed."],
    }


_DEADLINE_RE = re.compile(r"\b(\d{1,2}\s+\w+\s+20\d{2}|20\d{2}-\d{2}-\d{2})\b")
_OWNER_RE = re.compile(r"\b([A-Z][a-z]+ (?:Team|Department|Group|Lead|Manager))\b")


def _demo_actions(text: str, filename: str) -> list[dict[str, Any]]:
    verbs = (
        "inspect", "review", "resolve", "replace", "schedule", "update",
        "investigate", "approve", "complete", "follow up", "escalate", "repair",
        "verify", "recalibrat", "calibrat", "replenish", "submit", "top up",
        "restore", "pressure-test", "record", "circulat", "confirm", "assign",
        "must ", "should ", "needs to", "required to", "action", "due for",
    )
    out: list[dict[str, Any]] = []
    for sent in _sentences(text):
        low = sent.lower()
        if not any(v in low for v in verbs):
            continue
        priority = "medium"
        if any(w in low for w in ("critical", "urgent", "immediate", "alarm", "safety")):
            priority = "critical"
        elif any(w in low for w in ("high", "priority", "abnormal", "vibration", "leak")):
            priority = "high"
        elif any(w in low for w in ("routine", "monthly", "when convenient")):
            priority = "low"
        owner_m = _OWNER_RE.search(sent)
        deadline_m = _DEADLINE_RE.search(sent)
        out.append(
            {
                "title": sent[:180].rstrip("."),
                "description": sent[:400],
                "owner": owner_m.group(1) if owner_m else "",
                "deadline": _normalise_date(deadline_m.group(1)) if deadline_m else None,
                "priority": priority,
                "status": "pending",
                "source_filename": filename,
            }
        )
        if len(out) >= 8:
            break
    if not out:
        out.append(
            {
                "title": f"Review {filename} and assign follow-up owners",
                "description": f"No explicit action items detected in {filename}. "
                "A manual review is recommended.",
                "owner": "",
                "deadline": None,
                "priority": "medium",
                "status": "pending",
                "source_filename": filename,
            }
        )
    return out


def _normalise_date(raw: str) -> str | None:
    from datetime import datetime

    for fmt in ("%d %B %Y", "%d %b %Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _demo_report(report_type: str, docs: list[dict]) -> str:
    label = report_type.replace("_", " ").title()
    names = ", ".join(d["filename"] for d in docs)
    findings, issues = [], []
    for d in docs:
        for s in _sentences(d["text"])[:3]:
            findings.append(f"- {s[:180]} *(source: {d['filename']})*")
        for s in _sentences(d["text"]):
            if any(w in s.lower() for w in ("risk", "critical", "fail", "alarm", "delay")):
                issues.append(f"- {s[:180]} *(source: {d['filename']})*")
    issues = issues[:5] or ["- No critical issues explicitly flagged in the source documents."]
    return f"""# {label}

## 1. Overview
This {label.lower()} synthesises {len(docs)} document(s) from your workspace: {names}.

## 2. Key Findings
{chr(10).join(findings[:8])}

## 3. Critical Issues
{chr(10).join(issues)}

## 4. Risks
- Operational risk where flagged issues above are not actioned before their deadlines.
- Knowledge risk if document owners are not assigned follow-up tasks.

## 5. Recommended Actions
- Convert the findings above into tracked actions in the Action Center.
- Assign an owner and deadline to each critical issue.
- Re-generate this report after the next document upload to track movement.

## 6. Sources
{chr(10).join(f'- {d["filename"]}' for d in docs)}
"""


def _demo_comm(channel: str, action: dict) -> dict[str, str]:
    title = action.get("title", "Workplace action")
    owner = action.get("owner") or "Team"
    deadline = action.get("deadline")
    src = action.get("source_filename")
    prio = (action.get("priority") or "medium").upper()
    when = f" by {deadline}" if deadline else ""
    src_line = f"\nReference: {src}" if src else ""
    if channel == "whatsapp":
        return {
            "subject": None,
            "to": owner,
            "body": (
                f"*{prio} — {title}*\n\n"
                f"Hi {owner}, please action the following{when}. "
                f"{action.get('description', '')}".strip()
                + src_line
                + "\n\nReply here once done. Thanks."
            ),
        }
    return {
        "subject": f"[{prio}] {title}",
        "to": owner,
        "body": (
            f"Hi {owner},\n\n"
            f"Following a review of workplace information in WorkFlow AI, the "
            f"following action requires your attention{when}:\n\n"
            f"{title}\n{action.get('description', '')}".rstrip()
            + src_line
            + "\n\nPlease confirm ownership and expected completion date.\n\n"
            "Best regards,\nWorkFlow AI"
        ),
    }


def _demo_spreadsheet_insights(overview: dict) -> list[str]:
    stats = overview.get("column_stats", [])
    out = [
        f"The dataset contains {overview.get('rows', 0):,} rows across "
        f"{overview.get('columns', 0)} columns with "
        f"{overview.get('missing_values', 0)} missing values.",
    ]
    numeric = [s for s in stats if s.get("mean") is not None]
    for s in numeric[:3]:
        out.append(
            f"'{s['name']}' ranges from {s['minimum']:.2f} to {s['maximum']:.2f} "
            f"with an average of {s['mean']:.2f}."
        )
    if numeric:
        top = max(numeric, key=lambda s: (s["maximum"] or 0))
        out.append(
            f"The largest single value observed is in '{top['name']}' "
            f"({top['maximum']:.2f}) — worth checking for an anomaly or a genuine peak."
        )
    return out
