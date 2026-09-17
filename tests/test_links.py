"""Tests for research link construction.

URLs are built, not fetched, so these pin the encoding and the geo handling -
the two things that silently produce a link that opens the wrong search.
"""
from __future__ import annotations

import urllib.parse

import pytest

from productscout.links import AMAZON_DOMAIN, for_term, render


def channels(term="cat water fountain", geo="LT"):
    return {l.channel: l for l in for_term(term, geo)}


def test_every_link_is_a_well_formed_https_url():
    for link in for_term("cat water fountain"):
        parsed = urllib.parse.urlparse(link.url)
        assert parsed.scheme == "https", link.channel
        assert parsed.netloc, link.channel


def test_multiword_terms_are_encoded_not_broken():
    url = channels()["Amazon"].url
    assert " " not in url
    assert "cat+water+fountain" in url


def test_terms_with_punctuation_are_escaped():
    for link in for_term("dog bowl & mat, non-slip"):
        assert " " not in link.url
        assert "&mat" not in link.url  # the literal ampersand must not split params


def test_shopify_search_quotes_the_phrase():
    """Without quotes the site: search returns every store, not matching ones."""
    url = channels()["Shopify parduotuvės"].url
    assert urllib.parse.quote('"') in url or "%22" in url
    assert "site%3Amyshopify.com" in url


def test_aliexpress_uses_a_slug_not_a_query():
    assert channels()["AliExpress"].url.endswith("wholesale-cat-water-fountain.html")


def test_lithuania_maps_to_the_german_amazon():
    """LT has no local marketplace; .de is the one LT buyers actually use."""
    assert "amazon.de" in channels(geo="LT")["Amazon"].url
    assert "amazon.com" in channels(geo="US")["Amazon"].url
    assert "amazon.co.uk" in channels(geo="GB")["Amazon"].url


def test_unknown_geo_falls_back_to_a_sane_default():
    assert "amazon.de" in channels(geo="ZZ")["Amazon"].url
    assert "amazon.de" in channels(geo="")["Amazon"].url


def test_geo_reaches_ad_library_and_trends():
    for channel in ("Meta Ad Library", "Google Trends"):
        assert "US" in channels(geo="US")[channel].url


def test_every_competition_field_has_a_link_that_fills_it():
    """The manual step is only two minutes if each number has a source."""
    filled = {l.fills for l in for_term("x") if l.fills}
    assert filled == {"aliexpress_listings", "amazon_results",
                      "shopify_stores", "active_ads"}


def test_demand_links_claim_no_field():
    ebay = channels()["eBay parduota"]
    assert ebay.fills == ""
    assert "LH_Sold=1" in ebay.url  # sold listings, not active ones


def test_markdown_render_is_a_table_with_clickable_links():
    out = render("cat water fountain", markdown=True)
    assert out.startswith("### cat water fountain")
    assert "| Kanalas |" in out
    assert "](https://" in out


def test_text_render_lists_every_channel():
    out = render("cat water fountain")
    assert len(for_term("cat water fountain")) == out.count("https://")


@pytest.mark.parametrize("term", ["a", "very long multi word product term here", "ąžuolas"])
def test_odd_terms_do_not_crash(term):
    assert len(for_term(term)) == 9
