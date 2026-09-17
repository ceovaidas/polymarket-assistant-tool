"""Turn raw posts into ranked product hypotheses.

The signal that matters is *repetition across independent people*. One person
ranting about a missing product is an anecdote; nine people in four different
communities asking for the same thing over six months is a market.
"""
from __future__ import annotations

import math
from datetime import date

from .models import Hypothesis, Post
from .phrases import extract

# Engagement at which a hypothesis is considered to have full attention.
ENGAGEMENT_REFERENCE = 400
# Demand expressed longer ago than this has probably already been served.
HALF_LIFE_DAYS = 240


def _recency(newest: date | None, today: date) -> float:
    if newest is None:
        return 0.75  # unknown date: neither fresh nor stale
    age = max(0, (today - newest).days)
    return round(0.5 ** (age / HALF_LIFE_DAYS), 4)


def mine(posts: list[Post], today: date | None = None,
         min_mentions: int = 1) -> list[Hypothesis]:
    today = today or date.today()
    buckets: dict[str, dict] = {}

    for post in posts:
        seen_in_post: set[str] = set()
        for found in extract(post.body):
            if found.term in seen_in_post:
                continue  # one vote per post, however often they repeat it
            seen_in_post.add(found.term)
            b = buckets.setdefault(found.term, {
                "strengths": [], "kinds": {}, "communities": set(),
                "engagement": 0, "newest": None, "examples": [],
            })
            b["strengths"].append(found.strength)
            b["kinds"][found.kind] = b["kinds"].get(found.kind, 0) + 1
            if post.community:
                b["communities"].add(post.community)
            b["engagement"] += post.engagement
            if post.created and (b["newest"] is None or post.created > b["newest"]):
                b["newest"] = post.created
            if len(b["examples"]) < 3:
                b["examples"].append(post.title.strip())

    results: list[Hypothesis] = []
    for term, b in buckets.items():
        mentions = len(b["strengths"])
        if mentions < min_mentions:
            continue
        mean_strength = sum(b["strengths"]) / mentions

        # Repetition: 1 mention 0.00, 3 -> 0.50, 9 -> 0.79, 20 -> 0.95
        repetition = 1.0 - 1.0 / math.sqrt(mentions) if mentions > 1 else 0.0
        engagement = min(1.0, math.log1p(b["engagement"]) / math.log1p(ENGAGEMENT_REFERENCE))
        breadth = 1.0 - 1.0 / (1 + len(b["communities"]))

        # The 0.10 floor keeps a lone but strongly worded need distinguishable
        # from noise: weak evidence is not the same as no evidence.
        raw = mean_strength * (0.10 + 0.40 * repetition + 0.27 * engagement
                               + 0.23 * breadth)
        raw *= _recency(b["newest"], today)

        results.append(Hypothesis(
            term=term,
            score=round(min(1.0, raw), 4),
            mentions=mentions,
            mean_strength=round(mean_strength, 3),
            kinds=dict(b["kinds"]),
            communities=sorted(b["communities"]),
            engagement=b["engagement"],
            newest=b["newest"],
            examples=b["examples"],
        ))

    return sorted(results, key=lambda h: (h.score, h.mentions), reverse=True)


def to_candidates(hypotheses: list[Hypothesis], limit: int = 25) -> dict:
    """Emit a candidates file skeleton ready for `scan --fetch`."""
    out = []
    for h in hypotheses[:limit]:
        out.append({
            "term": h.term,
            "category": "",
            "attributes": [],
            "competition": {
                "aliexpress_listings": None,
                "shopify_stores": None,
                "active_ads": None,
            },
            "notes": (f"{h.mentions} paminėjimų, {h.unmet_share * 100:.0f}% 'niekas negamina', "
                      f"bendruomenės: {', '.join(h.communities) or 'n/a'}"),
        })
    return {"candidates": out}
