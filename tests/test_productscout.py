"""Tests for the scoring engine.

The point of these is calibration, not coverage: each test pins down a
judgement the tool must get right for its output to be trustworthy.
"""
from __future__ import annotations

import datetime as dt

import pytest

from productscout import filters
from productscout.models import (Candidate, CompetitionInputs, Economics,
                                 TimeSeries)
from productscout.pricing import evaluate, suggested_price
from productscout.saturation import CROWDED, EARLY_WINDOW, ZERO_DEMAND_TRAP, saturation
from productscout.scoring import rank, score
from productscout.signals import (deceleration, linreg_slope, momentum,
                                  spike_penalty)

START = dt.date(2025, 1, 6)


def mk(values: list[float], source: str = "google_trends") -> TimeSeries:
    return TimeSeries.from_pairs(
        source,
        [((START + dt.timedelta(weeks=i)).isoformat(), v) for i, v in enumerate(values)],
    )


def grow(n: int, base: float, rate: float) -> list[float]:
    return [base * rate ** i for i in range(n)]


# --- signals -----------------------------------------------------------------

def test_linreg_slope_matches_known_line():
    assert linreg_slope([1, 3, 5, 7]) == pytest.approx(2.0)


def test_linreg_slope_handles_degenerate_input():
    assert linreg_slope([]) == 0.0
    assert linreg_slope([5.0]) == 0.0


def test_flat_demand_scores_zero():
    assert momentum(mk([20] * 20)).score == 0.0


def test_declining_demand_scores_zero():
    assert momentum(mk(grow(20, 60, 0.92))).score == 0.0


def test_growth_beats_flat():
    assert momentum(mk(grow(20, 10, 1.08))).score > momentum(mk([20] * 20)).score


def test_single_week_spike_is_not_a_trend():
    """A news pop shows a 2.5x growth ratio; the score must not reward it."""
    spike = momentum(mk([20] * 19 + [140]))
    steady = momentum(mk(grow(20, 10, 1.08)))
    assert spike.growth > steady.growth      # naive metric prefers the spike
    assert spike.score < steady.score / 3    # the real score does not
    assert spike_penalty(mk([20] * 19 + [140])) > 0.8


def test_plateau_after_rise_scores_low():
    """Already peaked is not the same as rising."""
    series = mk([10, 12, 15, 19, 24, 30, 38, 47, 58, 70, 72, 71, 73, 70, 72, 71, 70, 72])
    assert momentum(series).score < 0.2


def test_deceleration_catches_a_closed_window():
    """Constant growth is not decelerating; a rise that flattened is."""
    assert deceleration(mk(grow(20, 10, 1.08))) < 0.2
    assert deceleration(mk([10, 14, 20, 28, 39, 55, 70, 71, 70, 72, 71, 70])) > 0.7


def test_seasonal_repeat_is_discounted():
    """Q4 lift that also happened last year is the calendar, not new demand."""
    repeat = mk([20] * 48 + [60, 65, 70, 68] + [20] * 48 + [62, 66, 72, 70])
    novel = mk([20] * 52 + [20] * 44 + [22, 26, 33, 42, 55, 70, 88, 110])
    assert repeat.values[-1] > 0 and momentum(repeat).seasonal == pytest.approx(1.0)
    assert momentum(novel).seasonal == 0.0
    assert momentum(repeat).score < momentum(novel).score


def test_short_series_yields_no_growth_ratio():
    assert momentum(mk([10, 12, 14])).growth is None


# --- saturation --------------------------------------------------------------

def test_no_demand_and_no_sellers_is_a_trap_not_an_opening():
    """The core correction to 'find products nobody resells'."""
    s = saturation(CompetitionInputs(aliexpress_listings=2, shopify_stores=0,
                                     active_ads=0), momentum_score=0.05)
    assert ZERO_DEMAND_TRAP in s.flags
    assert EARLY_WINDOW not in s.flags


def test_rising_demand_with_few_sellers_is_the_early_window():
    s = saturation(CompetitionInputs(aliexpress_listings=120, shopify_stores=4,
                                     active_ads=6), momentum_score=0.62)
    assert EARLY_WINDOW in s.flags


def test_crowded_market_is_flagged():
    s = saturation(CompetitionInputs(aliexpress_listings=18000, shopify_stores=140,
                                     active_ads=260), momentum_score=0.55)
    assert CROWDED in s.flags
    assert s.score > 0.75


def test_missing_competition_data_assumes_mid_market_with_zero_confidence():
    s = saturation(CompetitionInputs(), momentum_score=0.5)
    assert s.score == 0.5
    assert s.confidence == 0.0


def test_saturation_confidence_grows_with_channel_count():
    one = saturation(CompetitionInputs(shopify_stores=5), 0.5)
    three = saturation(CompetitionInputs(shopify_stores=5, active_ads=3,
                                         amazon_results=40), 0.5)
    assert three.confidence > one.confidence


# --- pricing -----------------------------------------------------------------

def test_suggested_price_clears_the_target_margin():
    econ = Economics(supplier_cost=3.2, inbound_shipping=2.1)
    result = evaluate(Economics(supplier_cost=3.2, inbound_shipping=2.1,
                                target_price=suggested_price(econ)))
    assert result.gross_margin >= 0.60


def test_thin_margin_is_warned_and_scores_zero():
    result = evaluate(Economics(supplier_cost=14.0, inbound_shipping=6.0,
                                target_price=29.99))
    assert result.margin_score == 0.0
    assert any("marža" in w for w in result.warnings)


def test_sub_fifteen_price_is_flagged_for_paid_acquisition():
    result = evaluate(Economics(supplier_cost=1.0, inbound_shipping=0.5,
                                target_price=9.99))
    assert any("reklamai" in w for w in result.warnings)


def test_breakeven_roas_is_reciprocal_of_margin():
    result = evaluate(Economics(supplier_cost=3.0, inbound_shipping=2.0,
                                target_price=30.0))
    assert result.breakeven_roas == pytest.approx(1 / result.gross_margin, rel=1e-2)


def test_heavy_items_are_warned():
    result = evaluate(Economics(supplier_cost=20.0, inbound_shipping=12.0,
                                target_price=79.0, weight_grams=3500))
    assert any("svoris" in w for w in result.warnings)


# --- filters -----------------------------------------------------------------

def test_branded_products_are_blocked_outright():
    result = filters.apply({"branded"})
    assert result.blocked and result.feasibility == 0.0


def test_warnings_reduce_but_never_zero_feasibility():
    result = filters.apply({"electronics", "battery", "fragile", "liquid", "sizing"})
    assert not result.blocked
    assert 0.4 <= result.feasibility < 1.0


def test_unknown_tags_are_ignored():
    assert filters.apply({"totally_made_up"}).feasibility == 1.0


# --- composite ---------------------------------------------------------------

def _candidate(term, values, comp, econ, attrs=()):
    return Candidate(term=term, series=[mk(values)], competition=comp,
                     economics=econ, attributes=set(attrs))


def test_blocked_candidate_scores_zero_despite_perfect_demand():
    c = _candidate("nike dupe", grow(30, 30, 1.12),
                   CompetitionInputs(shopify_stores=4, active_ads=2),
                   Economics(supplier_cost=5, inbound_shipping=2, target_price=59),
                   attrs=["branded"])
    result = score(c)
    assert result.opportunity == 0.0
    assert result.verdict() == "ATMESTA"


def test_early_window_outranks_crowded_market_at_equal_demand():
    values = grow(30, 12, 1.08)
    econ = Economics(supplier_cost=3.0, inbound_shipping=2.0, target_price=29.99)
    early = score(_candidate("early", values,
                             CompetitionInputs(aliexpress_listings=150,
                                               shopify_stores=4, active_ads=6), econ))
    late = score(_candidate("late", values,
                            CompetitionInputs(aliexpress_listings=20000,
                                              shopify_stores=160, active_ads=300), econ))
    assert early.opportunity > late.opportunity * 2


def test_dead_product_ranks_below_everything_alive():
    econ = Economics(supplier_cost=3.0, inbound_shipping=2.0, target_price=29.99)
    dead = score(_candidate("dead", [3] * 30,
                            CompetitionInputs(aliexpress_listings=2, shopify_stores=0,
                                              active_ads=0), econ))
    alive = score(_candidate("alive", grow(30, 12, 1.08),
                             CompetitionInputs(aliexpress_listings=150,
                                               shopify_stores=4, active_ads=6), econ))
    assert dead.verdict() == "NEGYVAS"
    assert alive.opportunity > dead.opportunity


def test_confidence_is_reported_separately_from_score():
    """A thin-data candidate may score well but must not claim confidence."""
    econ = Economics(supplier_cost=3.0, inbound_shipping=2.0, target_price=29.99)
    thin = score(Candidate(term="thin", series=[mk(grow(30, 12, 1.10))],
                           competition=CompetitionInputs(), economics=econ))
    assert thin.opportunity > 0.2
    assert thin.confidence < 0.7


def test_two_sources_beat_one_for_confidence():
    values = grow(30, 12, 1.08)
    econ = Economics(supplier_cost=3.0, inbound_shipping=2.0, target_price=29.99)
    comp = CompetitionInputs(aliexpress_listings=150, shopify_stores=4, active_ads=6)
    one = score(Candidate(term="one", series=[mk(values)], competition=comp, economics=econ))
    two = score(Candidate(term="two", series=[mk(values), mk(values, "wikipedia")],
                          competition=comp, economics=econ))
    assert two.confidence > one.confidence
    assert two.opportunity == one.opportunity  # more sources, same verdict strength


def test_rank_orders_by_opportunity():
    econ = Economics(supplier_cost=3.0, inbound_shipping=2.0, target_price=29.99)
    comp = CompetitionInputs(aliexpress_listings=150, shopify_stores=4, active_ads=6)
    results = rank([
        _candidate("flat", [20] * 30, comp, econ),
        _candidate("rising", grow(30, 12, 1.10), comp, econ),
    ])
    assert [r.term for r in results] == ["rising", "flat"]


def test_scored_explain_is_human_readable():
    econ = Economics(supplier_cost=3.0, inbound_shipping=2.0, target_price=29.99)
    result = score(_candidate("x", grow(30, 12, 1.08),
                              CompetitionInputs(shopify_stores=4), econ,
                              attrs=["electronics"]))
    text = "\n".join(result.explain())
    assert "paklausa" in text and "CE" in text
