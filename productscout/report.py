"""Render ranked results for a terminal or a markdown file."""
from __future__ import annotations

import json

from .scoring import Scored

VERDICT_ORDER = ["TAIKINYS", "STEBĖTI", "PRALEISTI", "NEGYVAS", "ATMESTA"]


def _bar(value: float, width: int = 10) -> str:
    filled = int(round(value * width))
    return "#" * filled + "." * (width - filled)


def table(results: list[Scored], width: int = 30) -> str:
    header = f"{'PRODUKTAS':<{width}} {'BALAS':>6} {'PATIK':>6}  {'GRAFIKAS':<10} VERDIKTAS"
    lines = [header, "-" * (len(header) + 6)]
    for r in results:
        term = r.term[: width - 1]
        lines.append(
            f"{term:<{width}} {r.opportunity:>6.3f} {r.confidence:>6.2f}  "
            f"{_bar(r.opportunity):<10} {r.verdict()}"
        )
    return "\n".join(lines)


def detail(result: Scored) -> str:
    out = [f"### {result.term}  [{result.verdict()}]  balas {result.opportunity:.3f} "
           f"(patikimumas {result.confidence:.2f})"]
    if result.candidate.category:
        out.append(f"kategorija: {result.candidate.category}")
    if result.flags:
        out.append("žymos: " + ", ".join(result.flags))
    out += [f"  - {line}" for line in result.explain()]
    if result.candidate.notes:
        out.append(f"  pastaba: {result.candidate.notes}")
    return "\n".join(out)


def markdown(results: list[Scored]) -> str:
    out = ["# Produktų galimybių ataskaita", "",
           "| Produktas | Balas | Patikimumas | Verdiktas | Marža | Konkurencija |",
           "|---|---|---|---|---|---|"]
    for r in results:
        margin = f"{r.economics.gross_margin * 100:.0f}%" if r.economics else "-"
        out.append(
            f"| {r.term} | {r.opportunity:.3f} | {r.confidence:.2f} | {r.verdict()} "
            f"| {margin} | {r.saturation.score:.2f} |"
        )
    out += ["", "## Detaliai", ""]
    for r in results:
        out += [detail(r), ""]
    return "\n".join(out)


def as_json(results: list[Scored]) -> str:
    payload = []
    for r in results:
        payload.append({
            "term": r.term,
            "category": r.candidate.category,
            "opportunity": r.opportunity,
            "confidence": r.confidence,
            "verdict": r.verdict(),
            "flags": r.flags,
            "momentum": vars(r.momentum) if r.momentum else None,
            "saturation": {"score": r.saturation.score,
                           "confidence": r.saturation.confidence,
                           "per_channel": r.saturation.per_channel},
            "economics": vars(r.economics) if r.economics else None,
            "blocks": r.feasibility.blocks,
            "warnings": r.feasibility.warnings,
            "explain": r.explain(),
        })
    return json.dumps(payload, ensure_ascii=False, indent=2)
