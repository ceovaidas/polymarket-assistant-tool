---
name: product-research
description: Find dropshipping products that are rising right now (TikTok Shop US first) and score them for the user's organic-video stores. Use when the user asks for product research, "ieškok produktų", "kas dabar parduodasi", winning products, or when the daily scheduled research run fires.
---

# Daily product research

Reply in Lithuanian; the report file is in English. Goal: 10 products a day the user could sell with
organic AI videos (Higgsfield) on a one-product Shopify store, each with real signals behind it.

## Filters (agreed with the user on 2026-10-31)
- Sale price $15-40 (ends in .99); supplier cost at most 30% of the sale price.
- Light, unbreakable, no batteries/liquids if possible (cheap shipping, few returns).
- "Wow" visible in the first 3 seconds of a video without sound.
- Works as a gift; humour / gag gifts get priority, but all niches are allowed.
- No brands or trademarks (not "NeeDoh", "Crocs", "Dyson"...): only the generic version.
- Skip: health or medical claims, skincare actives, kids' toys with small parts as the main use,
  weapons, anything needing certificates, glass, big furniture.

## Freshness (the user rejected old products on 2026-10-31)
- Only products with a sales signal from the last 14 days AND that were not a known viral product
  before this year. Sunset lamps, scalp brushes, label printers, LED strips, pixel speakers, portable
  blenders, magnetic mounts, cloud mirrors and similar evergreen "viral" items are OLD: never list them.
- "Viral list" blog posts and AliExpress roundups are not a signal on their own: they recycle old items.
  Use them only if a dated sales number (units/GMV in a named week) backs the product.
- Best fresh source: FastMoss new-products ranking (`https://www.fastmoss.com/e-commerce/newProducts`,
  products listed in the last days, with 3-day units and GMV). It loads in a headless browser without a
  login once; repeated hits get blocked (`MSG_SAFE_0001`), so open it once per run.
- If fewer than 3 fresh products pass, say so plainly instead of filling the list with old ones.

## Where to look (in this order; what works from the cloud session)
1. FastMoss blog + public pages: `https://www.fastmoss.com/blog/` (weekly US growth ranking, new
   products ranking with units and GMV). Real numbers, cite them.
2. WebSearch (mode "extended" for the first search): "TikTok Shop trending products <month> <year>",
   "TikTok made me buy it <week>", "viral gift <season> TikTok", Kalodata / FastMoss / Sell The Trend
   weekly posts, AliExpress "TikTok viral products <month>".
3. If the Higgsfield sandbox is available: `curl` / Playwright for pages the local network blocks
   (local network blocks many shop domains). TikTok Creative Center product pages need a login; Amazon
   Movers & Shakers returns empty to bots: do not rely on them.
4. AliExpress / CJ for supplier cost: search the generic name, take a seller with 1000+ orders.
Paid tools (Kalodata, FastMoss, TurboUGC Research) need the user's own login: never ask for passwords;
if the user sends a CSV export or screenshots, analyse those.

## Signals that count (write the number and the source)
- Units sold or GMV growth week over week from a base of 1,000+ units/week.
- Many creators selling it (growth across many accounts beats one shop's ads or one LIVE).
- Spike warning: one huge day then near zero = LIVE event, mark "spike, wait".
- Seasonal deadline: with 7-14 business days delivery, Christmas orders must be placed by ~Dec 3,
  so a Christmas-only product needs to be live by ~Nov 15.

## Score each product 1-5 (from buyer-psychology): total /30
moment or problem · "I know who this is for" in 2 s · visual in 3 s · impulse price · shareable/taggable
· delivery fits the date. Under 18 → drop it or say what would fix it.

## Report (save as `product-research/YYYY-MM-DD.md`, newest first in `product-research/README.md`)
Per product: generic name · why now (signal + source link) · supplier cost (estimate if not checked,
say so) · sale price and margin · score /30 · who buys it for whom · 1 hook line (follow
`.claude/skills/video-prompts/templates/hooks.md` skeletons) · risks. Then: "Top pick today" with one
sentence why, and products dropped and why. Do not repeat a product from the last 14 reports unless its
numbers changed a lot (say what changed).

## Honesty
Never invent units, GMV, growth or costs. If a number is an estimate, write "est.". Offer wording and
the Never list in `CLAUDE.md` apply to hooks.
