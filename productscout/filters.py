"""Hard disqualifiers. Most bad product ideas die here, not in the scoring.

Tag candidates with `attributes`; each rule below turns a tag into a block or a
warning. EU rules are included because they decide what a Lithuanian seller can
legally put in a store, not just what sells.
"""
from __future__ import annotations

from dataclasses import dataclass

BLOCK = "block"
WARN = "warn"


@dataclass(frozen=True)
class Rule:
    tag: str
    severity: str
    reason: str


RULES: tuple[Rule, ...] = (
    # Legal / platform bans
    Rule("branded", BLOCK, "prekės ženklo pažeidimas - parduotuvė ir ads bus uždaryti"),
    Rule("counterfeit_risk", BLOCK, "klastotės rizika - Shopify ir mokėjimai bus nutraukti"),
    Rule("weapon", BLOCK, "ginklai/peiliai - draudžiama Meta ir TikTok"),
    Rule("vape", BLOCK, "vape/nikotinas - draudžiama reklamuoti ir riboja mokėjimus"),
    Rule("medical_claim", BLOCK, "medicininiai teiginiai - reikia sertifikavimo, ads atmes"),
    Rule("supplement", BLOCK, "maisto papildai - ES registracija + VMVT reikalavimai"),
    Rule("adult", BLOCK, "suaugusiųjų prekės - mokėjimų teikėjai riboja"),
    # EU compliance: real cost, not a formality
    Rule("electronics", WARN, "elektronika - reikia CE + WEEE registracijos ES"),
    Rule("battery", WARN, "baterijos - ribojamas oro siuntimas + ES baterijų reglamentas"),
    Rule("children", WARN, "vaikų prekės - EN 71 saugos testavimas privalomas"),
    Rule("cosmetics", WARN, "kosmetika - CPNP notifikacija ES privaloma"),
    Rule("food_contact", WARN, "sąlytis su maistu - reikia atitikties deklaracijos"),
    Rule("gpsr_responsible_person", WARN, "GPSR - reikia atsakingo asmens ES nuo 2024-12"),
    # Logistics / margin killers
    Rule("fragile", WARN, "trapu - grąžinimai ir žala suvalgys maržą"),
    Rule("oversized", WARN, "didelis gabaritas - siuntimas neapsimokės"),
    Rule("liquid", WARN, "skysčiai - oro siuntimo apribojimai"),
    Rule("sizing", WARN, "dydžiai (drabužiai/avalynė) - grąžinimų rodiklis 20-40%"),
    Rule("perishable", WARN, "greitai gendantis - netinka dropshippingui"),
)

_BY_TAG = {r.tag: r for r in RULES}


@dataclass
class FilterResult:
    blocked: bool
    blocks: list[str]
    warnings: list[str]

    @property
    def feasibility(self) -> float:
        """0..1 multiplier applied to the opportunity score."""
        if self.blocked:
            return 0.0
        # Each warning costs 12%, floored at 0.4 - warnings are costs, not vetoes.
        return round(max(0.4, 1.0 - 0.12 * len(self.warnings)), 4)


def apply(attributes: set[str]) -> FilterResult:
    blocks, warnings = [], []
    for tag in sorted(attributes):
        rule = _BY_TAG.get(tag)
        if rule is None:
            continue
        (blocks if rule.severity == BLOCK else warnings).append(f"{tag}: {rule.reason}")
    return FilterResult(blocked=bool(blocks), blocks=blocks, warnings=warnings)


def known_tags() -> list[str]:
    return sorted(_BY_TAG)
