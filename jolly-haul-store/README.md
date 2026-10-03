# Jolly Haul — viral Christmas finds (Shopify)

- **Preview:** `preview/index.html` (home) and `preview/product.html` (product landing). Both are rendered from the real theme sections: `cd preview && npm install && npm run build`.
- **Install into Shopify:** `docs/LAUNCH_GUIDE_LT.md`, section 4.
- **Store copy (EN):** `docs/PRODUCT_COPY_EN.md`.
- **AI photos (kie.ai):** `KIE_API_KEY=... node imagegen/generate.mjs` — the key is read from the environment only.

```
theme/
  assets/jolly.css                # scoped .jh styles (home + product)
  assets/jolly.js                 # gallery, swatches, bundles, sticky ATC, Christmas countdown
  sections/jolly-home.liquid      # home page
  sections/jolly-product.liquid   # product landing page
  snippets/jolly-card.liquid      # product card (badges from tags: viral, new)
  snippets/jolly-art.liquid       # illustrations shown until photos are uploaded
  snippets/jolly-icon.liquid      # line icons
  templates/index.json            # pre-filled home page
  templates/product.landing.json  # pre-filled product landing (ski masks)
preview/                          # build.mjs -> index.html + product.html
imagegen/                         # shot list + kie.ai generator
docs/                             # launch guide (LT) + copy (EN)
```
