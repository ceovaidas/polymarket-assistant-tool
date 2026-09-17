"""Unit economics: what has to be true for this product to make money."""
from __future__ import annotations

from dataclasses import dataclass

from .models import Economics

# Below this retail price paid acquisition maths almost never closes.
MIN_VIABLE_PRICE = 15.0
# A healthy dropship/print-on-demand target.
TARGET_GROSS_MARGIN = 0.65


@dataclass
class UnitEconomics:
    price: float
    landed_cost: float
    gross_profit: float
    gross_margin: float
    breakeven_cac: float
    breakeven_roas: float
    margin_score: float
    warnings: list[str]

    def explain(self) -> list[str]:
        out = [
            f"kaina {self.price:.2f} - savikaina {self.landed_cost:.2f} "
            f"= {self.gross_profit:.2f} ({self.gross_margin * 100:.0f}%)",
            f"lūžio CAC {self.breakeven_cac:.2f}, reikalingas ROAS {self.breakeven_roas:.2f}",
        ]
        return out + self.warnings


def suggested_price(econ: Economics, target_margin: float = TARGET_GROSS_MARGIN) -> float:
    """Cheapest price that still clears the target margin after fees and returns."""
    variable = econ.supplier_cost + econ.inbound_shipping
    variable *= 1.0 + econ.return_rate
    # price*(1 - pct) - flat - variable = margin*price  ->  solve for price
    denom = 1.0 - econ.payment_pct - target_margin
    if denom <= 0:
        return round(variable * 4, 2)
    return round((variable + econ.payment_flat) / denom, 2)


def evaluate(econ: Economics) -> UnitEconomics:
    price = econ.target_price or suggested_price(econ)
    goods = (econ.supplier_cost + econ.inbound_shipping) * (1.0 + econ.return_rate)
    fees = price * econ.payment_pct + econ.payment_flat
    landed = goods + fees
    profit = price - landed
    margin = profit / price if price > 0 else 0.0

    warnings: list[str] = []
    if price < MIN_VIABLE_PRICE:
        warnings.append(
            f"kaina {price:.2f} < {MIN_VIABLE_PRICE:.0f} - mokamai reklamai per maža"
        )
    if margin < 0.45:
        warnings.append(f"marža {margin * 100:.0f}% - per plona dropshippingui")
    if econ.weight_grams and econ.weight_grams > 2000:
        warnings.append(f"svoris {econ.weight_grams}g - siuntimas suvalgys maržą")

    # Margin below 45% scores 0, at or above 75% scores 1.
    margin_score = max(0.0, min(1.0, (margin - 0.45) / 0.30))
    if price < MIN_VIABLE_PRICE:
        margin_score *= 0.5

    return UnitEconomics(
        price=round(price, 2),
        landed_cost=round(landed, 2),
        gross_profit=round(profit, 2),
        gross_margin=round(margin, 4),
        breakeven_cac=round(profit, 2),
        breakeven_roas=round(price / profit, 2) if profit > 0 else float("inf"),
        margin_score=round(margin_score, 4),
        warnings=warnings,
    )
