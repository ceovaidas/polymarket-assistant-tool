# toetally.extra: one-product store (toe charms for clogs)

Black + lemon-yellow "sticker" design on the shared one-product landing sections from
`kinbell-store/theme`. This folder holds the store's templates (copy, bundles), `kb-brand.css`,
the logo files and its own header, footer and icon snippet (logo from the theme assets, extra icons).

    python3 build_theme.py /path/to/dawn        # -> dist/toetally-theme.zip
    cd ../kinbell-store/preview && STORE_DIR=../../toetally-store node build.mjs   # preview

## Set up in Shopify
1. Upload `dist/toetally-theme.zip` (Online Store → Themes → Add theme → Upload zip) and publish it.
2. Create the product "Toe Charms for Clogs (10-Pack)" with option **Style**: `Non-hairy`, `Hairy`.
   Price **$22.99** each. No compare-at price unless it is a real earlier selling price.
3. Theme editor → Home page → One-product landing → pick the product.
4. Bundles shown on the page: 2 sets **$39.99**, 3 sets **$53.99**. Create two automatic discounts so the
   checkout matches: $5.99 off the order at min quantity 2, $14.98 off at min quantity 3 (this product only).
5. Photos (order matters, the feature blocks use photos 2–4): 1 hero on feet, 2 close-up of the toes
   on clogs, 3 gift / the box, 4 the two styles side by side, then lifestyle shots.
6. Reviews: only real ones (Judge.me / Loox app block, or "Review" blocks copied word for word).
7. Pages: refund (30 days), shipping (7–14 business days) and privacy policies, contact email.

## Keep it true
- The Christmas cut-off (Dec 3) assumes 7–14 business days delivery. Change it if shipping differs.
- "Snaps in" and "fits standard clogs" must match the sample you receive; check the fit on a real clog
  and on a cheaper off-brand clog before running ads, and keep the "Good to know" block honest.
- Small parts warning stays (not for children under 3).
- Never write "Crocs" in the store, ads or product title: it is a third-party trademark. Say "clogs".
