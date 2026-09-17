"""Supply-side maths: how crowded is this already?

The user-facing idea "find products nobody resells yet" is only useful as a
*ratio*. Zero competition on its own is usually a dead product, not an opening.
That distinction is made explicit here via `ZERO_DEMAND_TRAP`.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from .models import CompetitionInputs

# Count at which a channel is considered fully saturated (maps to ~1.0).
REFERENCE_SATURATED = {
    "aliexpress_listings": 20_000,
    "amazon_results": 5_000,
    "shopify_stores": 150,
    "active_ads": 300,
}

# Storefront and ad counts say far more about real competition than
# marketplace listing counts, which are inflated by duplicate SKUs.
CHANNEL_WEIGHT = {
    "aliexpress_listings": 0.8,
    "amazon_results": 1.0,
    "shopify_stores": 1.6,
    "active_ads": 1.6,
}

ZERO_DEMAND_TRAP = "zero_demand_trap"
EARLY_WINDOW = "early_window"
CROWDED = "crowded"


def channel_saturation(name: str, count: int) -> float:
    """Map a raw count to 0..1 on a log scale."""
    ref = REFERENCE_SATURATED.get(name, 1_000)
    if count <= 0:
        return 0.0
    return min(1.0, math.log10(1 + count) / math.log10(1 + ref))


@dataclass
class Saturation:
    score: float
    confidence: float
    per_channel: dict[str, float]
    flags: list[str]

    def explain(self) -> list[str]:
        out = [f"{k}: {v:.2f}" for k, v in sorted(self.per_channel.items())]
        if not out:
            out.append("konkurencijos duomenų nėra")
        return out


def saturation(inputs: CompetitionInputs, momentum_score: float) -> Saturation:
    """Blend the available competition counts, then label the demand/supply shape."""
    avail = inputs.available()
    per_channel = {k: round(channel_saturation(k, v), 4) for k, v in avail.items()}

    if per_channel:
        weights = {k: CHANNEL_WEIGHT.get(k, 1.0) for k in per_channel}
        total_w = sum(weights.values())
        score = sum(per_channel[k] * weights[k] for k in per_channel) / total_w
    else:
        # No data is not the same as no competition. Assume mid-market.
        score = 0.5

    # Confidence rises with how many independent channels reported.
    confidence = round(min(1.0, len(per_channel) / 3.0), 4) if per_channel else 0.0

    flags: list[str] = []
    if score < 0.25 and momentum_score < 0.20:
        # The trap the user's original idea walks into.
        flags.append(ZERO_DEMAND_TRAP)
    elif score < 0.45 and momentum_score >= 0.40:
        flags.append(EARLY_WINDOW)
    if score >= 0.75:
        flags.append(CROWDED)

    return Saturation(
        score=round(min(1.0, max(0.0, score)), 4),
        confidence=confidence,
        per_channel=per_channel,
        flags=flags,
    )
