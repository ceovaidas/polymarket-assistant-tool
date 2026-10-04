# Jolly Haul — viral Christmas finds (Shopify)

- **Preview:** `preview/index.html` (home) and `preview/product.html` (product landing). Both are rendered from the real theme sections: `cd preview && npm install && npm run build`.
- **Install into Shopify:** upload `dist/jolly-haul-theme.zip` (Dawn + Jolly Haul, pre-configured) and import `shopify-import/products.csv` — steps in `docs/LAUNCH_GUIDE_LT.md`, section 4. Rebuild the zip with `python3 build_theme.py <path to Dawn checkout>`, then check it with `ruby tools/check_liquid.rb <unzipped theme>` (catches syntax Shopify's upload rejects).
- **Store copy (EN):** `docs/PRODUCT_COPY_EN.md`.
- **AI photos (kie.ai):** `KIE_API_KEY=... node imagegen/generate.mjs` — the key is read from the environment only.

```
theme/
  assets/jolly.css                # scoped .jh styles (home + product)
  assets/jolly.js                 # gallery, swatches, bundles, sticky ATC, Christmas countdown
  sections/jolly-header.liquid    # header: logo left, menu centred, icons right
  sections/jolly-home.liquid      # home page
  sections/jolly-collection.liquid # collection + shop-all pages
  sections/jolly-cart.liquid      # cart page (replaces Dawn's cart sections)
  sections/jolly-related.liquid   # "You may also like" (product page + cart, Shopify recommendations)
  sections/jolly-page.liquid      # content pages (+ jolly-contact, jolly-404, jolly-search)
  sections/jolly-footer.liquid    # footer (replaces Dawn footer in the footer group)
  snippets/jolly-localization.liquid # country/currency/language picker
  sections/jolly-wheel.liquid     # Christmas prize wheel (footer group)
  sections/cart-icon-bubble.liquid # overrides Dawn's so cart updates keep our icon
  sections/jolly-product.liquid   # product landing page
  snippets/jolly-card.liquid      # product card (badges from tags: viral, new)
  snippets/jolly-art.liquid       # illustrations shown until photos are uploaded
  snippets/jolly-icon.liquid      # line icons
  templates/index.json            # pre-filled home page
  templates/product.json          # default product page (all products)
  templates/collection.json       # collection pages
  templates/cart.json             # cart page
  templates/product.landing.json  # pre-filled product landing (ski masks)
preview/                          # build.mjs -> index, product, projector, collection pages
theme-config/footer-wheel.json    # default wheel prizes added to the footer group by build_theme.py
imagegen/                         # shot list + kie.ai generator
docs/                             # launch guide (LT) + copy (EN)
```
