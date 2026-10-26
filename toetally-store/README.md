# toetally.extra: one-product store (toe charms for clogs)

Black + lemon-yellow "sticker" design on the shared one-product landing sections from
`kinbell-store/theme`. This folder holds the store's templates (copy, bundles), `kb-brand.css`,
the logo files, its own header, footer and icon snippet, and its own copy of `kb-landing.liquid`
with an optional "Add clogs" add-on (`te-combo.js` adds both products to the cart in one request).

    python3 build_theme.py /path/to/dawn        # -> dist/toetally-theme.zip
    cd ../kinbell-store/preview && STORE_DIR=../../toetally-store node build.mjs   # preview

## Products and pricing (set up through the Admin API on 2026-10-25)
| Product (handle) | Variants | Price | Supplier cost |
|---|---|---|---|
| Toe Charms for Clogs (5-Pack) (`toe-charms`) | Style: Non-hairy / Hairy / Mix | $19.99 per pack | ≈ $10.50 per 5 toes |
| Classic Clogs (`classic-clogs`) | Color Black/White × EU 36-45 (US sizes in the names) | $9.99 (optional add-on) | ≈ $4.40–4.95 |

Page bundles and the automatic discounts that make checkout match them (already created):
- 2 packs (10 toes) $34.99: "Toes: 2 packs" $4.99 off, min 2 packs.
- 4 packs (20 toes) $64.99: "Toes: 4 packs" $14.97 off, min 4 packs (Shopify applies the better one).
- Clogs are an optional add-on under the bundles ("Add clogs": colour, size, pairs) at a flat $9.99 a pair.
  No clog discount: Shopify gives a cart line only one product discount, and a Buy X get Y on the clogs
  blocked the toe bundle discount (cart total was higher than the page). The old BXGY is deactivated.
If you change a price, change the matching discount and the bundle amounts in the theme editor.

## DSers mapping (do this before the first order)
The supplier sells single toes and pairs, so each Shopify 5-pack is a bundle:
- Non-hairy pack → 2 × "C3-2pcs" + 1 × "C1-1pcs"
- Hairy pack → 2 × "C4-2pcs" + 1 × "C2-1pcs"
- Mix pack → 2 × "C5-2pcs" + 1 × "C1-1pcs"
In DSers: Products → the toe product → Mapping → Bundle mapping, add those supplier variants and quantities.
Clogs: standard mapping by colour and size.

## Set up in Shopify
1. Upload `dist/toetally-theme.zip` (Online Store → Themes → Add theme → Upload zip) and publish it.
   The home page already points at `toe-charms` and the combo at `classic-clogs`.
2. Photos are on the product in this order: 1 clogs on yellow, 2 styles, 3 gift, 4–5 charm close-ups;
   the feature blocks use photos 4, 3 and 2.
3. Reviews: only real ones (Judge.me / Loox app block, or "Review" blocks copied word for word).
4. Pages: refund (30 days), shipping (7–14 business days) and privacy policies, contact email.

## Keep it true
- The Christmas cut-off (Dec 3) assumes 7–14 business days delivery. Change it if shipping differs.
- "Snaps in" and "fits standard clogs" must match the sample you receive; check the fit on a real clog
  and on a cheaper off-brand clog before running ads, and keep the "Good to know" block honest.
- Small parts warning stays (not for children under 3).
- Never write "Crocs" in the store, ads or product title: it is a third-party trademark. Say "clogs".
