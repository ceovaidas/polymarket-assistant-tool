"""Demand-side maths: is interest actually rising, or is this noise?

Every function here is pure and deterministic so the scoring can be unit tested
without touching the network.
"""
from __future__ import annotations

import math
import statistics
from dataclasses import dataclass

from .models import TimeSeries

RECENT_WEEKS = 4
BASELINE_WEEKS = 12
SLOPE_WEEKS = 12
# Tuned so ~8%/week compounding growth maps to roughly 0.6 on the slope term.
SLOPE_GAIN = 8.0


def linreg_slope(values: list[float]) -> float:
    """Least-squares slope per step. Returns 0.0 for degenerate input."""
    n = len(values)
    if n < 2:
        return 0.0
    mean_x = (n - 1) / 2.0
    mean_y = sum(values) / n
    num = sum((i - mean_x) * (v - mean_y) for i, v in enumerate(values))
    den = sum((i - mean_x) ** 2 for i in range(n))
    return num / den if den else 0.0


def growth_ratio(series: TimeSeries, recent: int = RECENT_WEEKS,
                 baseline: int = BASELINE_WEEKS) -> float | None:
    """Mean of the recent window over the mean of the window before it."""
    head = series.window(0, recent)
    base = series.window(recent, recent + baseline)
    if len(head) < max(2, recent // 2) or len(base) < max(2, baseline // 2):
        return None
    base_mean = sum(base) / len(base)
    head_mean = sum(head) / len(head)
    if base_mean <= 0:
        return None if head_mean <= 0 else 10.0
    return head_mean / base_mean


def log_slope(series: TimeSeries, weeks: int = SLOPE_WEEKS) -> float:
    """Slope of log1p(values) over the last `weeks` points: a growth rate."""
    vals = series.tail(weeks)
    if len(vals) < 4:
        return 0.0
    return linreg_slope([math.log1p(max(0.0, v)) for v in vals])


def spike_penalty(series: TimeSeries, recent: int = RECENT_WEEKS,
                  baseline: int = BASELINE_WEEKS) -> float:
    """0..1. High when a single week carries all the growth (news pop, not a trend)."""
    head = series.window(0, recent)
    base = series.window(recent, recent + baseline)
    if len(head) < 3 or len(base) < 3:
        return 0.0
    base_mean = sum(base) / len(base)
    if base_mean <= 0:
        return 0.0
    elevated = [v for v in head if v > base_mean * 1.3]
    if not elevated:
        return 0.0
    # One elevated week out of four is a spike; all four is a trend.
    concentration = 1.0 - (len(elevated) - 1) / max(1, len(head) - 1)
    peak = max(head)
    others = sorted(head)[:-1]
    dominance = 0.0
    if others and sum(others) > 0:
        other_mean = sum(others) / len(others)
        if other_mean > 0:
            dominance = min(1.0, max(0.0, (peak / other_mean - 1.5) / 3.0))
    return round(min(1.0, concentration * dominance), 4)


def sustained_fraction(series: TimeSeries, recent: int = RECENT_WEEKS,
                       baseline: int = BASELINE_WEEKS) -> float:
    """Share of recent weeks sitting above the baseline mean."""
    head = series.window(0, recent)
    base = series.window(recent, recent + baseline)
    if not head or not base:
        return 0.0
    base_mean = sum(base) / len(base)
    if base_mean <= 0:
        return 1.0 if any(v > 0 for v in head) else 0.0
    return sum(1 for v in head if v > base_mean) / len(head)


def seasonality_risk(series: TimeSeries, recent: int = RECENT_WEEKS) -> float | None:
    """0..1. High when the same lift happened at this point last year.

    Needs at least ~14 months of weekly data; returns None otherwise.
    """
    vals = series.values
    if len(vals) < 56:
        return None
    this_year = series.window(0, recent)
    last_year = series.window(52, 52 + recent)
    prior_base = series.window(52 + recent, 52 + recent + BASELINE_WEEKS)
    if not this_year or not last_year or len(prior_base) < 4:
        return None
    prior_mean = sum(prior_base) / len(prior_base)
    if prior_mean <= 0:
        return None
    last_year_lift = (sum(last_year) / len(last_year)) / prior_mean
    if last_year_lift <= 1.15:
        return 0.0
    # A repeat of last year's lift means the rise is calendar-driven, not new demand.
    return round(min(1.0, (last_year_lift - 1.15) / 1.35), 4)


def deceleration(series: TimeSeries, half: int = 6) -> float:
    """0..1. High when the rise has already flattened out.

    Growth ratio and slope both look backwards over a window that can still
    contain the original ramp, so a product that peaked two months ago reads as
    rising. Comparing the latest half-window against the one before it is what
    catches the plateau - which is exactly when a product is too late to enter.
    """
    vals = series.tail(half * 2)
    if len(vals) < half * 2:
        return 0.0
    logs = [math.log1p(max(0.0, v)) for v in vals]
    earlier = linreg_slope(logs[:half])
    recent = linreg_slope(logs[half:])
    if earlier <= 0.01:
        return 0.0  # nothing was accelerating, nothing to decelerate from
    return round(max(0.0, min(1.0, 1.0 - recent / earlier)), 4)


@dataclass
class Momentum:
    score: float
    growth: float | None
    slope: float
    sustained: float
    spike: float
    decel: float
    seasonal: float | None
    weeks: int

    def explain(self) -> list[str]:
        out: list[str] = []
        if self.growth is not None:
            out.append(f"paklausa {self.growth:.2f}x prieš 12 sav. bazę")
        out.append(f"log-nuolydis {self.slope:+.3f}/sav.")
        out.append(f"augimas išsilaikė {self.sustained * 100:.0f}% savaičių")
        if self.spike > 0.15:
            out.append(f"vienkartinio šuolio rizika {self.spike:.2f}")
        if self.decel > 0.25:
            out.append(f"augimas lėtėja ({self.decel:.2f}) - langas gali būti praėjęs")
        if self.seasonal:
            out.append(f"sezoniškumo rizika {self.seasonal:.2f}")
        return out


def momentum(series: TimeSeries) -> Momentum:
    """Combine the demand signals into a single 0..1 score."""
    g = growth_ratio(series)
    slope = log_slope(series)
    sustained = sustained_fraction(series)
    spike = spike_penalty(series)
    decel = deceleration(series)
    seasonal = seasonality_risk(series)

    # growth 1x -> 0.0, 2x -> 0.5, 4x -> 0.75; below baseline scores nothing.
    g_term = 0.0 if g is None or g <= 1.0 else 1.0 - 1.0 / g
    slope_term = max(0.0, math.tanh(slope * SLOPE_GAIN))

    raw = 0.55 * g_term + 0.45 * slope_term
    # A rise nobody held on to is worth little; one bad week shouldn't zero it out.
    raw *= 0.4 + 0.6 * sustained
    raw *= 1.0 - 0.7 * spike
    # A rise that already flattened is a window that already closed.
    raw *= 1.0 - 0.6 * decel
    if seasonal:
        raw *= 1.0 - 0.6 * seasonal

    return Momentum(
        score=round(max(0.0, min(1.0, raw)), 4),
        growth=round(g, 4) if g is not None else None,
        slope=round(slope, 4),
        sustained=round(sustained, 4),
        spike=spike,
        decel=decel,
        seasonal=seasonal,
        weeks=len(series),
    )
