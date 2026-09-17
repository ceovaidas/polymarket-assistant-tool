"""Build research URLs for a product term.

These are search queries assembled from a template, not product pages someone
verified. They exist to collapse the manual competition-filling step into a row
of clicks: each link says which `competition` field it answers.
"""
from __future__ import annotations

import urllib.parse
from dataclasses import dataclass

# Lithuania has no local Amazon marketplace; .de is the one LT buyers actually use.
AMAZON_DOMAIN = {
    "LT": "de", "LV": "de", "EE": "de", "PL": "pl", "DE": "de", "FR": "fr",
    "ES": "es", "IT": "it", "NL": "nl", "SE": "se", "GB": "co.uk", "UK": "co.uk",
    "US": "com", "CA": "ca", "AU": "com.au",
}


@dataclass(frozen=True)
class Link:
    channel: str
    url: str
    purpose: str
    fills: str = ""   # which competition field this answers, if any


def _q(term: str) -> str:
    return urllib.parse.quote_plus(term)


def _slug(term: str) -> str:
    return urllib.parse.quote("-".join(term.lower().split()))


def for_term(term: str, geo: str = "LT") -> list[Link]:
    geo = (geo or "LT").upper()
    amazon = AMAZON_DOMAIN.get(geo, "de")
    quoted = _q(f'"{term}"')

    return [
        # --- supply side: these fill the competition numbers ------------------
        Link("AliExpress",
             f"https://www.aliexpress.com/w/wholesale-{_slug(term)}.html",
             "kiek tiekėjų ir kokia savikaina", "aliexpress_listings"),
        Link("Amazon",
             f"https://www.amazon.{amazon}/s?k={_q(term)}",
             "kiek rezultatų ir kokios kainos", "amazon_results"),
        Link("Shopify parduotuvės",
             f"https://www.google.com/search?q={quoted}+site%3Amyshopify.com",
             "kiek parduotuvių jau pardavinėja", "shopify_stores"),
        Link("Meta Ad Library",
             "https://www.facebook.com/ads/library/?active_status=active"
             f"&ad_type=all&country={geo}&q={_q(term)}&media_type=all",
             "kiek aktyvių skelbimų sukasi dabar", "active_ads"),
        Link("TikTok Creative Center",
             "https://ads.tiktok.com/business/creativecenter/keyword-insights/pc/en"
             f"?keyword={_q(term)}",
             "ar terminas kyla TikTok reklamose", "active_ads"),
        # --- demand side: proof people actually want it ----------------------
        Link("eBay parduota",
             f"https://www.ebay.com/sch/i.html?_nkw={_q(term)}&LH_Sold=1&LH_Complete=1",
             "REALIAI parduoti vienetai, ne paieškos", ""),
        Link("Google Trends",
             f"https://trends.google.com/trends/explore?date=today%2012-m"
             f"&geo={geo}&q={_q(term)}",
             "ar paklausa kyla ar krenta", ""),
        Link("Reddit",
             f"https://www.reddit.com/search/?q={_q(term)}&sort=new",
             "ką žmonės sako, ko trūksta", ""),
        Link("Kickstarter",
             f"https://www.kickstarter.com/discover/advanced?term={_q(term)}"
             "&sort=end_date",
             "ar buvo įrodyta paklausa prieš klonus", ""),
    ]


def render(term: str, geo: str = "LT", markdown: bool = False) -> str:
    links = for_term(term, geo)
    if markdown:
        out = [f"### {term}", "", "| Kanalas | Kam | Užpildo | Nuoroda |",
               "|---|---|---|---|"]
        out += [f"| {l.channel} | {l.purpose} | `{l.fills or '-'}` | [atidaryti]({l.url}) |"
                for l in links]
        return "\n".join(out)

    out = [f"{term}"]
    for l in links:
        field = f"  -> {l.fills}" if l.fills else ""
        out.append(f"  {l.channel:<24} {l.purpose}{field}\n    {l.url}")
    return "\n".join(out)
