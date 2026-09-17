"""Core data structures for product opportunity scouting."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Iterable


@dataclass(frozen=True)
class SeriesPoint:
    at: date
    value: float


@dataclass
class TimeSeries:
    """A weekly interest series from one source, oldest point first."""

    source: str
    points: list[SeriesPoint] = field(default_factory=list)

    @classmethod
    def from_pairs(cls, source: str, pairs: Iterable[tuple[str, float]]) -> "TimeSeries":
        pts = [SeriesPoint(date.fromisoformat(d), float(v)) for d, v in pairs]
        pts.sort(key=lambda p: p.at)
        return cls(source=source, points=pts)

    @property
    def values(self) -> list[float]:
        return [p.value for p in self.points]

    def __len__(self) -> int:
        return len(self.points)

    def tail(self, n: int) -> list[float]:
        return self.values[-n:] if n else []

    def window(self, start: int, end: int) -> list[float]:
        """Values in [start, end) counted backwards from the newest point.

        window(0, 4) is the most recent 4 points; window(4, 16) the 12 before those.
        """
        vals = self.values
        if start < 0 or end <= start:
            return []
        lo = max(0, len(vals) - end)
        hi = len(vals) - start
        return vals[lo:hi] if hi > lo else []


@dataclass
class CompetitionInputs:
    """Raw supply-side counts. Any field may be None when a source was unavailable."""

    aliexpress_listings: int | None = None
    amazon_results: int | None = None
    shopify_stores: int | None = None
    active_ads: int | None = None

    def available(self) -> dict[str, int]:
        return {k: v for k, v in vars(self).items() if v is not None}


@dataclass
class Economics:
    """Per-unit money facts, all in the same currency."""

    supplier_cost: float
    inbound_shipping: float = 0.0
    target_price: float | None = None
    payment_pct: float = 0.029
    payment_flat: float = 0.30
    return_rate: float = 0.05
    weight_grams: int | None = None


@dataclass
class Candidate:
    """One product hypothesis to evaluate."""

    term: str
    category: str = ""
    economics: Economics | None = None
    competition: CompetitionInputs = field(default_factory=CompetitionInputs)
    series: list[TimeSeries] = field(default_factory=list)
    attributes: set[str] = field(default_factory=set)
    notes: str = ""

    def series_by_source(self, source: str) -> TimeSeries | None:
        for s in self.series:
            if s.source == source:
                return s
        return None
