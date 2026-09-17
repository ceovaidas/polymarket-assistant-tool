from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from ..models import TimeSeries


class SourceError(Exception):
    pass


@dataclass
class FetchResult:
    series: TimeSeries | None
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.series is not None and len(self.series) > 0


def weekly_from_daily(source: str, daily: list[tuple[date, float]]) -> TimeSeries:
    """Aggregate daily points into ISO weeks, keyed by each week's Monday."""
    buckets: dict[date, float] = {}
    for day, value in daily:
        monday = day - timedelta(days=day.weekday())
        buckets[monday] = buckets.get(monday, 0.0) + value
    pairs = [(d.isoformat(), v) for d, v in sorted(buckets.items())]
    # Drop the trailing partial week so it doesn't read as a sudden collapse.
    if len(pairs) > 1:
        last_monday = date.fromisoformat(pairs[-1][0])
        if date.today() - last_monday < timedelta(days=7):
            pairs = pairs[:-1]
    return TimeSeries.from_pairs(source, pairs)
