"""Tests for candidate generation from unmet-demand signals."""
from __future__ import annotations

import datetime as dt

import pytest

from productscout.discovery import mine, to_candidates
from productscout.discovery.models import Post
from productscout.discovery.phrases import extract
from productscout.discovery.reddit import load_dump

TODAY = dt.date(2026, 9, 17)


def post(pid, title, up=100, com=40, days_ago=30, community="r/test"):
    return Post(id=pid, title=title, upvotes=up, comments=com,
                created=TODAY - dt.timedelta(days=days_ago), community=community)


# --- phrase extraction -------------------------------------------------------

def test_unmet_supply_outranks_plain_shopping():
    unmet = extract("Why doesn't anyone make a silicone dish rack for bar sinks")
    shopping = extract("recommendations for running shoes")
    assert unmet[0].kind == "unmet" and unmet[0].strength == 1.0
    assert shopping[0].kind == "shopping"
    assert unmet[0].strength > shopping[0].strength


def test_product_phrase_stops_before_a_relative_clause():
    found = extract("Does anyone make heated socks that actually last a winter")
    assert found[0].term == "heated socks"


def test_leading_articles_are_stripped():
    assert extract("Can't find a collapsible watering can")[0].term == "collapsible watering can"


def test_trailing_filler_is_trimmed_so_mentions_do_not_fragment():
    """'rack' and 'rack anywhere' must bucket together or repetition is lost."""
    a = extract("Can't find a silicone dish drying rack anywhere in the EU")
    b = extract("Does anyone make a silicone dish drying rack for small kitchens")
    assert a[0].term == b[0].term == "silicone dish drying rack"


def test_generic_advice_phrases_are_rejected():
    assert extract("Does anyone make recommendations here") == []
    assert extract("Looking for some advice") == []


def test_ordinary_chatter_yields_nothing():
    assert extract("Just wanted to say thanks, great community") == []


def test_one_word_and_overlong_phrases_are_rejected():
    assert extract("Can't find shoes") == []
    long_tail = extract("Does anyone make a really very extremely unusually specific thing here")
    assert all(len(e.term.split()) <= 5 for e in long_tail)


# --- mining ------------------------------------------------------------------

def test_repeated_need_outranks_a_louder_one_off():
    """Nine people asking beats one viral rant - that is the whole thesis."""
    posts = [
        post("1", "Does anyone make a silicone dish rack", up=40, com=10),
        post("2", "Can't find a silicone dish rack", up=30, com=8, community="r/b"),
        post("3", "I wish someone sold a silicone dish rack", up=25, com=5, community="r/c"),
        post("4", "Why doesn't anyone make a heated mouse pad", up=900, com=400),
    ]
    results = {h.term: h for h in mine(posts, today=TODAY)}
    assert results["silicone dish rack"].score > results["heated mouse pad"].score


def test_breadth_across_communities_raises_the_score():
    narrow = [post(str(i), "Does anyone make a cat water fountain", community="r/cats")
              for i in range(3)]
    broad = [post(str(i), "Does anyone make a cat water fountain",
                  community=f"r/c{i}") for i in range(3)]
    assert mine(broad, today=TODAY)[0].score > mine(narrow, today=TODAY)[0].score


def test_stale_demand_is_discounted():
    fresh = [post("1", "Does anyone make a magnetic organizer", days_ago=20),
             post("2", "Can't find a magnetic organizer", days_ago=40, community="r/b")]
    stale = [post("1", "Does anyone make a magnetic organizer", days_ago=900),
             post("2", "Can't find a magnetic organizer", days_ago=950, community="r/b")]
    assert mine(fresh, today=TODAY)[0].score > 3 * mine(stale, today=TODAY)[0].score


def test_repeating_yourself_in_one_post_counts_once():
    once = [post("1", "Does anyone make a cat water fountain")]
    twice = [post("1", "Does anyone make a cat water fountain. "
                       "Seriously, does anyone make a cat water fountain")]
    assert mine(once, today=TODAY)[0].mentions == mine(twice, today=TODAY)[0].mentions == 1


def test_unmet_share_separates_missing_supply_from_shopping():
    posts = [post("1", "Does anyone make a cat water fountain"),
             post("2", "recommendations for running shoes")]
    results = {h.term: h for h in mine(posts, today=TODAY)}
    assert results["cat water fountain"].unmet_share == 1.0
    assert results["running shoes"].unmet_share == 0.0


def test_min_mentions_filters_one_offs():
    posts = [post("1", "Does anyone make a cat water fountain"),
             post("2", "Can't find a cat water fountain", community="r/b"),
             post("3", "Does anyone make a heated mouse pad")]
    terms = [h.term for h in mine(posts, today=TODAY, min_mentions=2)]
    assert terms == ["cat water fountain"]


def test_missing_dates_do_not_crash_mining():
    posts = [Post(id="1", title="Does anyone make a cat water fountain")]
    assert mine(posts, today=TODAY)[0].score > 0


def test_empty_input_returns_nothing():
    assert mine([], today=TODAY) == []


# --- handoff -----------------------------------------------------------------

def test_candidates_payload_is_loadable_by_scan():
    from productscout.loader import _candidate
    posts = [post("1", "Does anyone make a cat water fountain"),
             post("2", "Can't find a cat water fountain", community="r/b")]
    payload = to_candidates(mine(posts, today=TODAY))
    assert payload["candidates"], "expected at least one candidate"
    built = _candidate(payload["candidates"][0])
    assert built.term == "cat water fountain"
    assert built.competition.available() == {}  # nothing filled in yet, by design


def test_load_dump_reads_plain_post_lists(tmp_path):
    path = tmp_path / "posts.json"
    path.write_text('[{"id":"1","title":"Does anyone make a cat water fountain",'
                    '"upvotes":10,"comments":2,"created":"2026-09-01","community":"r/cats"}]',
                    encoding="utf-8")
    outcome = load_dump(path)
    assert len(outcome.posts) == 1
    assert outcome.posts[0].community == "r/cats"


def test_load_dump_reads_raw_reddit_listings(tmp_path):
    path = tmp_path / "listing.json"
    path.write_text('{"data":{"children":[{"data":{"id":"x","title":"Does anyone make a cat '
                    'water fountain","score":12,"num_comments":3,"subreddit":"cats",'
                    '"permalink":"/r/cats/x"}}]}}', encoding="utf-8")
    outcome = load_dump(path)
    assert outcome.posts[0].community == "r/cats"
    assert outcome.posts[0].upvotes == 12


def test_load_dump_missing_file_reports_reason(tmp_path):
    outcome = load_dump(tmp_path / "nope.json")
    assert outcome.posts == [] and outcome.errors
