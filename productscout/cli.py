"""Command line entry point."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import filters, loader, report
from .scoring import rank
from .sources import csv_source, trends, wikipedia


def _cmd_scan(args: argparse.Namespace) -> int:
    candidates = loader.load(args.input)

    if args.fetch:
        print(f"Traukiami duomenys {len(candidates)} kandidatams...", file=sys.stderr)
        for cand in candidates:
            for name, result in (
                ("google_trends", trends.fetch(cand.term, geo=args.geo)),
                ("wikipedia", wikipedia.fetch(args.wiki_term or cand.term)),
            ):
                if result.ok:
                    cand.series = [s for s in cand.series if s.source != name]
                    cand.series.append(result.series)
                    print(f"  {cand.term}: {name} +{len(result.series)} sav.", file=sys.stderr)
                else:
                    print(f"  {cand.term}: {result.error}", file=sys.stderr)

    results = rank(candidates)
    if args.min_score:
        results = [r for r in results if r.opportunity >= args.min_score]

    if args.format == "json":
        out = report.as_json(results)
    elif args.format == "markdown":
        out = report.markdown(results)
    else:
        out = report.table(results)
        if args.verbose:
            out += "\n\n" + "\n\n".join(report.detail(r) for r in results)

    if args.output:
        Path(args.output).write_text(out + "\n", encoding="utf-8")
        print(f"Įrašyta: {args.output}", file=sys.stderr)
    else:
        print(out)
    return 0


def _cmd_tags(_: argparse.Namespace) -> int:
    print("Žinomos žymos (naudok kandidatų faile 'attributes'):\n")
    for rule in filters.RULES:
        marker = "BLOKAS" if rule.severity == filters.BLOCK else "įspėj."
        print(f"  {rule.tag:<26} [{marker}] {rule.reason}")
    return 0


def _cmd_import(args: argparse.Namespace) -> int:
    result = csv_source.fetch(args.csv, source=args.source)
    if not result.ok:
        print(result.error, file=sys.stderr)
        return 1
    payload = {
        "source": result.series.source,
        "points": [[p.at.isoformat(), p.value] for p in result.series.points],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="productscout",
        description="Randa produktus, kurių paklausa kyla, o pardavėjų dar mažai.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    scan = sub.add_parser("scan", help="įvertinti ir surikiuoti kandidatus")
    scan.add_argument("--input", "-i", required=True, help="candidates.yaml arba .json")
    scan.add_argument("--fetch", action="store_true",
                      help="traukti gyvus duomenis (reikia interneto)")
    scan.add_argument("--geo", default="", help="Google Trends regionas, pvz. LT")
    scan.add_argument("--wiki-term", default="", help="Wikipedia straipsnio pavadinimas")
    scan.add_argument("--format", "-f", choices=["table", "markdown", "json"],
                      default="table")
    scan.add_argument("--output", "-o", help="rašyti į failą")
    scan.add_argument("--min-score", type=float, default=0.0)
    scan.add_argument("--verbose", "-v", action="store_true")
    scan.set_defaults(func=_cmd_scan)

    tags = sub.add_parser("tags", help="parodyti atitikties žymas")
    tags.set_defaults(func=_cmd_tags)

    imp = sub.add_parser("import-csv", help="konvertuoti CSV į serijos JSON")
    imp.add_argument("csv")
    imp.add_argument("--source", default="csv")
    imp.set_defaults(func=_cmd_import)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)
