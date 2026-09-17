"""Read candidate definitions from YAML or JSON."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import Candidate, CompetitionInputs, Economics, TimeSeries


def _load_raw(path: Path) -> Any:
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() in {".yaml", ".yml"}:
        try:
            import yaml
        except ImportError as exc:
            raise SystemExit("YAML failams reikia PyYAML (pip install pyyaml)") from exc
        return yaml.safe_load(text)
    return json.loads(text)


def _candidate(raw: dict[str, Any]) -> Candidate:
    econ_raw = raw.get("economics")
    econ = Economics(**econ_raw) if econ_raw else None

    comp_raw = raw.get("competition") or {}
    comp = CompetitionInputs(**{k: v for k, v in comp_raw.items() if v is not None})

    series: list[TimeSeries] = []
    for s in raw.get("series", []) or []:
        pts = [(p[0], p[1]) for p in s.get("points", []) if len(p) >= 2]
        if pts:
            series.append(TimeSeries.from_pairs(s.get("source", "manual"), pts))

    return Candidate(
        term=raw["term"],
        category=raw.get("category", ""),
        economics=econ,
        competition=comp,
        series=series,
        attributes=set(raw.get("attributes", []) or []),
        notes=raw.get("notes", ""),
    )


def load(path: str | Path) -> list[Candidate]:
    p = Path(path)
    if not p.exists():
        raise SystemExit(f"Failas nerastas: {p}")
    data = _load_raw(p)
    items = data.get("candidates", data) if isinstance(data, dict) else data
    if not isinstance(items, list):
        raise SystemExit("Laukiamas 'candidates' sąrašas")
    return [_candidate(item) for item in items]
