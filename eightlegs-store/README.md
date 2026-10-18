# Eightlegs: one-jacket store

Dawn-based one-page theme for a single faux-leather spider-web jacket. Built from the Softpun theme
(`sp-*` sections) and restyled after the jacket: near-black like the faux leather, bone white like the
spider patch, dashed lines like the white topstitched web, and a faint web drawn in the page corner.

- Home = the product page (story | photos | choices), then "Caught in every detail" (close-ups taken from
  the product's own photos by number) and an FAQ.
- 1 / 2 jacket picker priced from a real automatic discount ("Twin up: 2 jackets for $179.99"), Shop Pay
  installments, real delivery dates by the button, 3 doubts answered (fit, faux leather, returns), size
  guide table, mystery-discount pop-up (code `EIGHTLEGS10`), cart with the 2-jacket nudge.

    python3 build_theme.py /path/to/dawn          # -> dist/eightlegs-theme.zip
    cd preview && npm install liquidjs && node build.mjs   # preview/index.html, cart.html

Before going live:
1. Product photos and logo: the imported AliExpress listing uses another brand's photos, and the jacket in
   them carries that brand's logo and label. Use a supplier version without third-party branding and your
   own photos or UGC before selling.
2. Shopify (already set): price $99.99, automatic discount "Twin up" ($19.99 off 2 of this jacket), code
   `EIGHTLEGS10`. Shipping is $0 from $50, so every jacket order ships free.
3. Theme editor → Home → "Product details": point each block at the right photo number once your own photos
   are uploaded.
4. Store name (Settings → General) is what shows as the logo text.
