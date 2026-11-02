# Voilaure: one-product store (Lash Shower Shield)

Clear, single-use, peel-and-stick shower shield that keeps the spray off a fresh lash lift, extensions or
mascara. Same "clean premium" layout as `toetally-store` (shared sections from `kinbell-store/theme`) in a
quiet-luxury palette: warm ivory page, sand cards, espresso tiles and buttons, Bodoni Moda headings and the
VOILAURE wordmark, champagne only as the accent. Layout reference: a competitor shield page (Nov 2026);
copy, photos and offers are our own, and its fake parts are left out (see "Keep it true").

    python3 build_theme.py /path/to/dawn        # -> dist/voilaure-theme.zip
    cd ../kinbell-store/preview && STORE_DIR=../../voilaure-store node build.mjs   # preview (photos in preview/img, not committed)

## Product and pricing (planned, set up in Shopify before launch)
| Product (handle) | Pack | Price |
|---|---|---|
| Lash Shower Shield (50 pcs) (`lash-shower-shield`) | 50 single-use shields | $24.99 a pack |

Bundles on the page and the automatic discounts that must exist so checkout matches them:
- 2 packs (100 shields) $39.99: "Shield: 2 packs" $9.99 off, min 2 packs.
- 3 packs (150 shields) $54.99: "Shield: 3 packs" $19.98 off, min 3 packs.
If you change a price, change the matching discount and the bundle amounts in the theme editor.

## Check against the sample before launch
- Pack size (50), single-use adhesive, one size, ~1 cm gap in front of the face: all copied from the
  supplier listing and the competitor page. Confirm on the real sample and fix the copy if anything differs.
- Delivery 7–14 business days, shipping in 1–3: match it to the real supplier/warehouse.
- Photos: the preview uses our AI-generated Mia frames. Before ads, add real photos and a real
  water-on-the-shield clip of the product (no AI proof of the result).

## Keep it true (what the competitor page does and what we use instead)
| Competitor | Voilaure |
|---|---|
| "Fall sale ends in 05:59:44" countdown | No timer; real shipping and returns in the top bar |
| "4.8/5 by 11238 happy customers", placeholder reviews | No rating until real reviews exist; empty reviews block says so |
| Inflated "was" prices (€44.95) | Struck price only on bundles = real sum of single packs |
| "Buy 2 get 1 FREE", "FREE ebook", "FREE priority shipping" | "$X to spend" from a real automatic discount; "$0 shipping, on us" |
| "Most popular" badge | "Stock up" / "Best value" (true by price per shield) |

## Set up in Shopify
1. Create the store / domain (voilaure.com), the product `lash-shower-shield` with photos in this order:
   1 putting it on (hero), 2 the problem (DIY fail / head tilt), 3 close-up with water on the shield,
   4 lash-day lifestyle, 5 mascara-day lifestyle.
2. Create the two automatic discounts above.
3. Upload `dist/voilaure-theme.zip` (Online Store → Themes → Add theme → Upload zip) and publish it.
4. Pages: refund (30 days), shipping and privacy policies, contact email.
