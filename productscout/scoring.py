"""Composite opportunity score.

A weighted *geometric* mean, deliberately: a product with no margin is not
rescued by rising demand, so a zero in one dimension must drag the whole score
down rather than be averaged away.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from . import filters, pricing, saturation as sat_mod
from .models import Candidate
from .pricing import UnitEconomics
from .saturation import Saturation
from .signals import Momentum, momentum as compute_momentum

WEIGHTS = {"momentum": 0.40, "opening": 0.30, "margin": 0.30}
# Floor keeps a single unknown from zeroing the product of terms.
TERM_FLOOR = 0.02


def _geometric(terms: dict[str, float]) -> float:
    acc = 1.0
    for name, weight in WEIGHTS.items():
        value = max(TERM_FLOOR, min(1.0, terms.get(name, 0.0)))
        acc *= value ** weight
    return acc


@dataclass
class Scored:
    candidate: Candidate
    opportunity: float
    momentum: Momentum | None
    saturation: Saturation
    economics: UnitEconomics | None
    feasibility: filters.FilterResult
    confidence: float
    flags: list[str] = field(default_factory=list)

    @property
    def term(self) -> str:
        return self.candidate.term

    def verdict(self) -> str:
        if self.feasibility.blocked:
            return "ATMESTA"
        if sat_mod.ZERO_DEMAND_TRAP in self.saturation.flags:
            return "NEGYVAS"
        if self.opportunity >= 0.55 and self.confidence >= 0.5:
            return "TAIKINYS"
        if self.opportunity >= 0.40:
            return "STEBĖTI"
        return "PRALEISTI"

    def explain(self) -> list[str]:
        lines: list[str] = []
        if self.feasibility.blocks:
            lines += [f"BLOKAS - {b}" for b in self.feasibility.blocks]
        if self.momentum:
            lines += self.momentum.explain()
        else:
            lines.append("paklausos duomenų nėra")
        lines.append("konkurencija: " + ", ".join(self.saturation.explain()))
        if self.economics:
            lines += self.economics.explain()
        lines += [f"įspėjimas - {w}" for w in self.feasibility.warnings]
        return lines


def score(candidate: Candidate) -> Scored:
    feas = filters.apply(candidate.attributes)

    moms = [compute_momentum(s) for s in candidate.series if len(s) >= 8]
    mom: Momentum | None = max(moms, key=lambda m: m.score) if moms else None
    mom_score = mom.score if mom else 0.0

    sat = sat_mod.saturation(candidate.competition, mom_score)
    econ = pricing.evaluate(candidate.economics) if candidate.economics else None

    terms = {
        "momentum": mom_score,
        "opening": 1.0 - sat.score,
        "margin": econ.margin_score if econ else 0.35,
    }
    opportunity = _geometric(terms) * feas.feasibility
    if sat_mod.ZERO_DEMAND_TRAP in sat.flags:
        # Nobody selling it AND nobody wanting it is not an opening.
        opportunity *= 0.25
    if sat_mod.CROWDED in sat.flags:
        # Arriving late is a different failure from arriving to a thin market:
        # rising demand in an already-crowded niche is someone else's win.
        opportunity *= 0.55

    # Confidence is reported next to the score, never folded into it.
    signal_conf = min(1.0, len(moms) / 2.0)
    data_conf = 0.45 * signal_conf + 0.35 * sat.confidence + 0.20 * (1.0 if econ else 0.0)

    return Scored(
        candidate=candidate,
        opportunity=round(min(1.0, opportunity), 4),
        momentum=mom,
        saturation=sat,
        economics=econ,
        feasibility=feas,
        confidence=round(data_conf, 4),
        flags=list(sat.flags),
    )


def rank(candidates: list[Candidate]) -> list[Scored]:
    return sorted(
        (score(c) for c in candidates),
        key=lambda s: (s.opportunity, s.confidence),
        reverse=True,
    )
