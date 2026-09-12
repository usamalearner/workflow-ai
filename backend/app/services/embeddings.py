"""Deterministic local embeddings.

Groq does not currently expose a hosted embedding model, so WorkFlow AI ships a
self-contained embedding function: hashed character n-grams + token features
projected into a fixed-size L2-normalised vector. It is fully deterministic,
dependency-free, and produces genuinely useful cosine similarity for retrieval
over a workspace-sized corpus. The dimension matches ``pgvector`` column size.

Swap :func:`embed_texts` for a hosted model later without touching callers.
"""

from __future__ import annotations

import hashlib
import math
import re

from app.core.config import settings

_TOKEN_RE = re.compile(r"[a-z0-9]+")
DIM = settings.embedding_dim


def _hash_to_bucket(token: str) -> int:
    digest = hashlib.md5(token.encode("utf-8")).digest()  # noqa: S324 - non-crypto use
    return int.from_bytes(digest[:4], "big") % DIM


_STOP = {
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "is", "are",
    "was", "were", "be", "by", "with", "at", "as", "it", "this", "that", "from",
    "will", "must", "should", "has", "have", "had", "not", "but", "which", "we",
}


def embed_text(text: str) -> list[float]:
    vec = [0.0] * DIM
    tokens = [t for t in _TOKEN_RE.findall(text.lower()) if t not in _STOP and len(t) > 1]
    if not tokens:
        return vec
    for tok in tokens:
        vec[_hash_to_bucket(tok)] += 1.0
        # a light stem so "issues"/"issue", "inspected"/"inspect" collide
        if len(tok) > 4:
            vec[_hash_to_bucket(tok[:-1])] += 0.4
            vec[_hash_to_bucket(tok[:-2])] += 0.3
    for a, b in zip(tokens, tokens[1:]):
        vec[_hash_to_bucket(f"{a}_{b}")] += 0.7
    # L2 normalise
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [round(v / norm, 6) for v in vec]


def embed_texts(texts: list[str]) -> list[list[float]]:
    return [embed_text(t) for t in texts]
