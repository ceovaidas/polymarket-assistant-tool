"""Google Trends via pytrends.

Unofficial and rate limited: from a datacentre IP it returns 429 almost
immediately, so run scans from a residential connection and keep terms batched.
"""
from __future__ import annotations

from .base import FetchResult
from ..models import TimeSeries


def fetch(term: str, geo: str = "", timeframe: str = "today 12-m") -> FetchResult:
    try:
        from pytrends.request import TrendReq
    except ImportError:
        return FetchResult(None, "pytrends neįdiegtas (pip install pytrends)")

    try:
        client = TrendReq(hl="en-US", tz=0, retries=2, backoff_factor=0.5)
        client.build_payload([term], timeframe=timeframe, geo=geo)
        frame = client.interest_over_time()
    except Exception as exc:
        return FetchResult(None, f"google trends: {type(exc).__name__}")

    if frame is None or frame.empty or term not in frame:
        return FetchResult(None, f"google trends: nėra duomenų '{term}'")

    frame = frame[frame.get("isPartial", False) == False] if "isPartial" in frame else frame
    pairs = [(idx.date().isoformat(), float(val)) for idx, val in frame[term].items()]
    if not pairs:
        return FetchResult(None, "google trends: tuščia serija")
    return FetchResult(TimeSeries.from_pairs("google_trends", pairs))
