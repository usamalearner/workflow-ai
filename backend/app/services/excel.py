"""Spreadsheet intelligence.

Numeric facts (counts, means, min/max, totals, missing values, deltas) are
computed with pandas — never delegated to the LLM. Groq is only asked to explain
the already-computed results in natural language.
"""

from __future__ import annotations

import io

import numpy as np
import pandas as pd

from app.services import llm


def _read(content: bytes, file_type: str) -> pd.DataFrame:
    if file_type == "csv":
        return pd.read_csv(io.BytesIO(content))
    return pd.read_excel(io.BytesIO(content))


def analyze(content: bytes, file_type: str, filename: str) -> dict:
    df = _read(content, file_type)
    rows, cols = df.shape
    missing_total = int(df.isna().sum().sum())

    column_stats = []
    for name in df.columns:
        col = df[name]
        stat = {
            "name": str(name),
            "dtype": str(col.dtype),
            "missing": int(col.isna().sum()),
            "mean": None,
            "minimum": None,
            "maximum": None,
            "total": None,
        }
        if pd.api.types.is_numeric_dtype(col) and col.notna().any():
            stat["mean"] = round(float(col.mean()), 4)
            stat["minimum"] = round(float(col.min()), 4)
            stat["maximum"] = round(float(col.max()), 4)
            stat["total"] = round(float(col.sum()), 4)
        column_stats.append(stat)

    overview = {
        "rows": int(rows),
        "columns": int(cols),
        "missing_values": missing_total,
        "column_stats": column_stats,
    }

    charts = _build_charts(df)
    sample = df.head(20).replace({np.nan: None}).to_dict(orient="records")
    insights = llm.explain_spreadsheet(filename, overview, sample)
    insights += _numeric_anomalies(df)

    return {
        "filename": filename,
        "overview": overview,
        "insights": insights[:8],
        "charts": charts,
    }


def _build_charts(df: pd.DataFrame) -> list[dict]:
    charts: list[dict] = []
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    if not numeric_cols:
        return charts

    # Trend of the first numeric column over row index (down-sampled)
    first = numeric_cols[0]
    series = df[first].dropna()
    step = max(1, len(series) // 40)
    charts.append(
        {
            "label": f"{first} over rows",
            "points": [
                {"label": str(i), "value": round(float(v), 4)}
                for i, v in list(series.items())[::step][:40]
            ],
        }
    )

    # Column averages comparison
    charts.append(
        {
            "label": "Average by column",
            "points": [
                {"label": str(c), "value": round(float(df[c].mean()), 4)}
                for c in numeric_cols[:8]
            ],
        }
    )
    return charts


def _numeric_anomalies(df: pd.DataFrame) -> list[str]:
    out: list[str] = []
    for c in df.columns:
        col = df[c]
        if not pd.api.types.is_numeric_dtype(col) or col.notna().sum() < 8:
            continue
        mean, std = col.mean(), col.std()
        if std and std > 0:
            outliers = col[(col - mean).abs() > 3 * std]
            if len(outliers):
                out.append(
                    f"{len(outliers)} value(s) in '{c}' fall more than 3 standard "
                    f"deviations from the mean — potential anomalies."
                )
        first_val, last_val = col.dropna().iloc[0], col.dropna().iloc[-1]
        if first_val:
            pct = (last_val - first_val) / abs(first_val) * 100
            if abs(pct) >= 5:
                direction = "increased" if pct > 0 else "decreased"
                out.append(
                    f"'{c}' {direction} by {abs(pct):.1f}% from the first to the "
                    f"last row."
                )
    return out
