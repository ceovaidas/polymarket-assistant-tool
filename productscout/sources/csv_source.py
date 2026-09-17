"""Load a demand series from CSV.

The escape hatch for paid data (Minea, PiPiADS, Helium 10, Shopify analytics
exports) and for anything scraped by hand. Two columns: ISO date, value.
"""
from __future__ import annotations

import csv
from pathlib import Path

from .base import FetchResult
from ..models import TimeSeries


def fetch(path: str | Path, source: str = "csv") -> FetchResult:
    p = Path(path)
    if not p.exists():
        return FetchResult(None, f"csv nerastas: {p}")
    pairs: list[tuple[str, float]] = []
    try:
        with p.open(newline="", encoding="utf-8") as fh:
            for row in csv.reader(fh):
                if len(row) < 2:
                    continue
                stamp, raw = row[0].strip(), row[1].strip()
                if not stamp or stamp.lower() in {"date", "week", "data"}:
                    continue
                try:
                    pairs.append((stamp, float(raw.replace(",", "."))))
                except ValueError:
                    continue
    except OSError as exc:
        return FetchResult(None, f"csv klaida: {exc}")
    if not pairs:
        return FetchResult(None, f"csv tuščias: {p}")
    return FetchResult(TimeSeries.from_pairs(source, pairs))
