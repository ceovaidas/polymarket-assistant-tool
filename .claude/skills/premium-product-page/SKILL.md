---
name: premium-product-page
description: Build a one-product Shopify page in the "clean premium" DTC style the user loves (bento hero with benefit tiles, social line, price row, 2x2 benefit chips, black pill button, value row of real items, product anatomy block), with every claim kept true. Use when the user asks for a professional / premium / "like this" product page or store design, sends a screenshot of a modern DTC product page, or starts a new one-product store.
---

# Clean premium product page

Reply in Lithuanian. Reference the user approved (Oct 2026): a DTC nasal-strips page with a white canvas, soft
grey rounded cards, charcoal benefit tiles beside the photo, Poppins headings and a black pill CTA. First built
for toetally.extra: `toetally-store/theme` (`sections/kb-landing.liquid`, `assets/kb-brand.css`,
`assets/te-combo.js`) on top of the shared one-product sections in `kinbell-store/theme`. Copy that store as
the starting point for the next one.

## Layout (top to bottom)
1. **Header:** white, logo left, 3 text links, black pill button, cart. Thin black announcement bar above
   with a real deadline and offer ("Order by Dec 3 for Christmas · $0 shipping, on us · 30-day returns").
2. **Hero, left:** big photo card (3:4, soft grey, radius 22) with a small black label top-left; a column of
   3 charcoal tiles to its right (icon + 2-3 words each). On phones the tiles become a row of 3 under the photo.
   Thumbnails below.
3. **Hero, right (buy box):** social line (3 small round avatars + one sentence), product title, price row
   (big total, struck full price, yellow gain badge, small "what you get" note), one short description line,
   2x2 benefit chips (grey pills, black round check), then the steps:
   "1 What do you need?" (two big option cards when there is a combo), "2 Style", "3 Choose" (bundle cards:
   grey, selected = white with black border and soft shadow, badge on top), black pill CTA with the live
   total, then the value row, delivery dates, 3 reassurances, tabs.
4. **Value row** (instead of "free gifts"): dashed cards with each real item, its real price tag and photo,
   title "Combo: worth $X, yours for $Y", and a small outline button that switches to the combo.
5. Below the hero: black marquee strip, 4 soft-grey icon cards, "how it works" 3 white cards,
   **product anatomy** (grey card, photo on white in the middle, 4 callouts left/right on desktop and stacked
   on phones), 2 feature rows, what's in the box, comparison table, "good to know", reviews, FAQ, black
   guarantee strip, black final CTA card with a brand-colour button, light footer.

## Style tokens
White page; cards #f3f3f3, radius 16-28; tiles #3d3e42 with white icons; ink #0f0f0f; Poppins 600/700
headings, Inter body; black pill buttons; the brand colour only as an accent (badges, gain chips, final CTA
button). No rotations, no hard offset shadows: soft shadow only on the selected card. 16 px side gutter on
phones, no horizontal scroll, bundle price rows wrap under the name.

## Keep it true (the reference's tricks, and what we use instead)
| Reference | Our version |
|---|---|
| "Used by 500K+ people" | A true one-liner ("Made for the clown of every friend group"), or the real review rating once reviews exist |
| "$40.00" was-price, "SAVE 30%" | The real sum of the item prices struck through, and "$X to spend" from a real automatic discount |
| "Free gifts worth $79" | The value row of the real combo items at their real prices |
| "40% more oxygen" style numbers | Only measured, true specs (pack size, material, fit) |
| "Over 30M views on Instagram" | Only once true, with the real number |
| "BEST SELLER" label | "NEW", the season ("Gag gift 2026") or a real fact |
Every bundle price on the page must match an automatic discount in Shopify (create them, see the store README).

## Shopify gotchas learned
- **One `product` setting per section.** A second product picker makes Shopify silently reject the section
  on upload; the templates that use it disappear and the page answers 404. Pick a second product by handle
  (`text` setting + `all_products[handle]`).
- Check a theme upload with `theme.files(filenames: [...])`: a missing file means it was rejected.
- Theme files cannot be written to the live theme through the API: upsert them (`body.type: URL`, raw GitHub
  link of the pushed commit) into an unpublished copy, rename it "... - publish this", and ask the user to
  press Publish. Always also send the rebuilt zip.
- Preview with real data: `https://<domain>/?preview_theme_id=<id>` in Playwright; remove
  `#PBarNextFrameWrapper` before clicking.
