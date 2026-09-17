"""Command line entry point."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import filters, loader, report
from .discovery import mine, to_candidates
from .discovery import reddit
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


def _cmd_discover(args: argparse.Namespace) -> int:
    posts, errors = [], []
    if args.dump:
        outcome = reddit.load_dump(args.dump)
        posts, errors = outcome.posts, outcome.errors
    else:
        communities = [c.strip() for c in (args.communities or "").split(",") if c.strip()]
        for community in communities or [""]:
            label = community or "visas Reddit"
            print(f"Ieškoma: {label}...", file=sys.stderr)
            outcome = reddit.search(subreddit=community, period=args.period)
            posts.extend(outcome.posts)
            errors.extend(f"{label}: {e}" for e in outcome.errors)

    for error in errors:
        print(f"  {error}", file=sys.stderr)
    if not posts:
        print("Įrašų nerasta. Naudok --dump su išsaugotu JSON, jei Reddit blokuoja.",
              file=sys.stderr)
        return 1

    print(f"Išanalizuota {len(posts)} įrašų.", file=sys.stderr)
    hypotheses = mine(posts, min_mentions=args.min_mentions)
    if not hypotheses:
        print("Paklausos išraiškų nerasta.", file=sys.stderr)
        return 1

    width = 36
    print(f"{'HIPOTEZĖ':<{width}} {'BALAS':>6} {'PAM':>4} {'UNMET':>6}  BENDRUOMENĖS")
    print("-" * (width + 40))
    for h in hypotheses[: args.top]:
        print(f"{h.term[:width - 1]:<{width}} {h.score:>6.3f} {h.mentions:>4d} "
              f"{h.unmet_share * 100:>5.0f}%  {', '.join(h.communities[:3])}")

    if args.out:
        payload = to_candidates(hypotheses, limit=args.limit)
        try:
            import yaml
            text = yaml.safe_dump(payload, allow_unicode=True, sort_keys=False, width=120)
        except ImportError:
            text = json.dumps(payload, ensure_ascii=False, indent=2)
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"\nKandidatai įrašyti: {args.out}", file=sys.stderr)
        print("Užpildyk 'competition' skaičius, tada: "
              f"python -m productscout scan -i {args.out} --fetch", file=sys.stderr)
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

    disc = sub.add_parser("discover", help="rasti produktų hipotezes iš neišpildytos paklausos")
    disc.add_argument("--communities", "-c", default="",
                      help="kableliais atskirti subredditai, pvz. BuyItForLife,pets")
    disc.add_argument("--dump", help="vietinis JSON failas vietoj gyvo Reddit")
    disc.add_argument("--period", default="year", choices=["month", "year", "all"])
    disc.add_argument("--min-mentions", type=int, default=1)
    disc.add_argument("--top", type=int, default=25, help="kiek rodyti ekrane")
    disc.add_argument("--limit", type=int, default=25, help="kiek rašyti į failą")
    disc.add_argument("--out", "-o", help="rašyti candidates.yaml")
    disc.set_defaults(func=_cmd_discover)

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
