"""Fetch posts from Reddit's public JSON endpoints.

Reddit throttles hard and increasingly wants OAuth, so this degrades to a
reason string rather than failing the run. `load_dump` is the reliable path:
point it at saved JSON and mining works with no network at all.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path

from .models import Post

SEARCH_URL = "https://www.reddit.com/{scope}search.json"
USER_AGENT = "productscout/0.1 (product demand research)"
# Queries that surface people failing to find a product.
DEFAULT_QUERIES = (
    '"why doesn\'t anyone make"',
    '"does anyone make"',
    '"i wish someone made"',
    '"can\'t find a"',
    '"is there a" buy',
)


@dataclass
class FetchOutcome:
    posts: list[Post]
    errors: list[str]


def _to_post(child: dict) -> Post | None:
    data = child.get("data") or {}
    if not data.get("title"):
        return None
    created: date | None = None
    if data.get("created_utc"):
        try:
            created = datetime.fromtimestamp(
                float(data["created_utc"]), tz=timezone.utc).date()
        except (ValueError, OSError):
            created = None
    return Post(
        id=str(data.get("id", "")),
        title=str(data.get("title", "")),
        text=str(data.get("selftext", ""))[:4000],
        upvotes=int(data.get("score", 0) or 0),
        comments=int(data.get("num_comments", 0) or 0),
        created=created,
        community=f"r/{data.get('subreddit', '')}" if data.get("subreddit") else "",
        url="https://reddit.com" + str(data.get("permalink", "")),
    )


def _request(url: str, params: dict, timeout: int) -> tuple[list[Post], str | None]:
    full = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(full, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        hint = " (Reddit riboja užklausas - bandyk iš namų IP)" if exc.code in (403, 429) else ""
        return [], f"reddit HTTP {exc.code}{hint}"
    except Exception as exc:
        return [], f"reddit neprieinamas: {type(exc).__name__}"

    children = (payload.get("data") or {}).get("children") or []
    posts = [p for p in (_to_post(c) for c in children) if p]
    return posts, None


def search(queries: tuple[str, ...] = DEFAULT_QUERIES, subreddit: str = "",
           limit: int = 100, period: str = "year", pause: float = 2.0,
           timeout: int = 20) -> FetchOutcome:
    """Run each demand query, optionally scoped to one subreddit."""
    scope = f"r/{subreddit.removeprefix('r/')}/" if subreddit else ""
    url = SEARCH_URL.format(scope=scope)
    seen: dict[str, Post] = {}
    errors: list[str] = []

    for index, query in enumerate(queries):
        if index:
            time.sleep(pause)  # be a good citizen; Reddit rate limits aggressively
        params = {"q": query, "sort": "new", "limit": limit, "t": period}
        if subreddit:
            params["restrict_sr"] = "1"
        posts, error = _request(url, params, timeout)
        if error:
            errors.append(f"{query}: {error}")
            continue
        for post in posts:
            seen.setdefault(post.id or post.title, post)

    return FetchOutcome(posts=list(seen.values()), errors=errors)


def load_dump(path: str | Path) -> FetchOutcome:
    """Read posts from a saved Reddit JSON listing, or a plain list of posts."""
    p = Path(path)
    if not p.exists():
        return FetchOutcome([], [f"failas nerastas: {p}"])
    try:
        payload = json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return FetchOutcome([], [f"nepavyko nuskaityti {p}: {exc}"])

    if isinstance(payload, dict) and "data" in payload:
        children = (payload.get("data") or {}).get("children") or []
        posts = [p2 for p2 in (_to_post(c) for c in children) if p2]
        return FetchOutcome(posts, [])

    posts = []
    for item in payload if isinstance(payload, list) else []:
        if not isinstance(item, dict):
            continue
        if "data" in item:
            post = _to_post(item)
        else:
            created = item.get("created")
            post = Post(
                id=str(item.get("id", "")), title=str(item.get("title", "")),
                text=str(item.get("text", "")), upvotes=int(item.get("upvotes", 0) or 0),
                comments=int(item.get("comments", 0) or 0),
                created=date.fromisoformat(created) if created else None,
                community=str(item.get("community", "")), url=str(item.get("url", "")),
            )
        if post and post.title:
            posts.append(post)
    return FetchOutcome(posts, [] if posts else ["dump'e nerasta įrašų"])
