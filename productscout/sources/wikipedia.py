"""Wikipedia pageviews as a demand proxy.

Free, no API key, no rate-limit theatre, and it moves before retail search does
for genuinely new product categories. Useless for brand-less commodity terms
with no article, which is why it is one signal among several.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

from .base import FetchResult, weekly_from_daily

ENDPOINT = (
    "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
    "{project}/all-access/all-agents/{article}/daily/{start}/{end}"
)
USER_AGENT = "productscout/0.1 (product research; contact via repo)"


def fetch(article: str, days: int = 540, project: str = "en.wikipedia",
          timeout: int = 20) -> FetchResult:
    end = date.today()
    start = end - timedelta(days=days)
    url = ENDPOINT.format(
        project=project,
        article=urllib.parse.quote(article.replace(" ", "_"), safe=""),
        start=start.strftime("%Y%m%d"),
        end=end.strftime("%Y%m%d"),
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            return FetchResult(None, f"wikipedia: nėra straipsnio '{article}'")
        return FetchResult(None, f"wikipedia HTTP {exc.code}")
    except Exception as exc:  # network, TLS, malformed payload
        return FetchResult(None, f"wikipedia neprieinama: {type(exc).__name__}")

    daily = []
    for item in payload.get("items", []):
        stamp = item.get("timestamp", "")[:8]
        try:
            daily.append((date(int(stamp[:4]), int(stamp[4:6]), int(stamp[6:8])),
                          float(item.get("views", 0))))
        except (ValueError, IndexError):
            continue
    if not daily:
        return FetchResult(None, "wikipedia: tuščias atsakymas")
    return FetchResult(weekly_from_daily("wikipedia", daily))
