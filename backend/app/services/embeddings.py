"""Semantic embeddings via a local sentence-transformers model.

Groq does not expose a hosted embedding endpoint, so WorkFlow AI runs
``intfloat/multilingual-e5-small`` locally inside the FastAPI process: it's
MIT-licensed, ~118M parameters (practical on CPU), 384-dimensional, and
multilingual — so retrieval keeps working across languages, not just exact
English keyword overlap. The dimension matches the ``pgvector`` column size.

E5 models are trained with explicit instruction prefixes and score noticeably
worse without them: stored chunks must be embedded as ``"passage: ..."`` and
queries as ``"query: ..."``. Use :func:`embed_passages` / :func:`embed_query`
rather than calling the model directly so callers never mix these up.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import settings

MODEL_NAME = "intfloat/multilingual-e5-small"
DIM = settings.embedding_dim  # 384, must match database/schema.sql's vector(384)


@lru_cache
def _model():
    # Imported lazily: sentence-transformers/torch are heavy, and tests or
    # tooling that never touch embeddings shouldn't pay the import cost.
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(MODEL_NAME)


def _encode(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    vectors = _model().encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )
    return [v.tolist() for v in vectors]


def embed_query(text: str) -> list[float]:
    """Embed a user question for vector search."""
    return _encode([f"query: {text}"])[0]


def embed_passages(texts: list[str]) -> list[list[float]]:
    """Embed document chunks for storage."""
    return _encode([f"passage: {t}" for t in texts])
