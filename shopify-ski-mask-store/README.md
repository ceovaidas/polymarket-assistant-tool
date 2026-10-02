# GNARHEAD — funny ski mask one-product Shopify store

- **Preview the design:** open `preview/index.html`. It is rendered from the real section code: `cd preview && npm install && npm run build`.
- **Install into Shopify:** see `docs/LAUNCH_GUIDE_LT.md`, section 3.
- **Store copy (EN):** `docs/PRODUCT_COPY_EN.md`.

```
theme/
  assets/gnarhead-landing.css     # scoped .gh styles
  assets/gnarhead-landing.js      # variant picker, bundles, gallery, sticky ATC
  sections/gnarhead-product-landing.liquid
  snippets/gnarhead-icon.liquid   # line icons
  snippets/gnarhead-art.liquid    # face illustrations shown until photos are uploaded
  templates/product.landing.json  # pre-filled crew, spec rows, features, FAQ
preview/                          # build.mjs renders the section with mock data -> index.html
docs/                             # launch guide (LT) + copy (EN)
```
