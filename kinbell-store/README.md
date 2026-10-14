# Kinbell: one-product store (SOS call button)

One-page Shopify theme built on Dawn: hero with gallery and bundle picker, how it works, features with
photos, what's in the box, honest comparison, "good to know" limits, reviews, FAQ, guarantee, final CTA,
sticky order bar on phones. Copy follows the rules in `/CLAUDE.md` (no fake scarcity, timers or reviews).

## Build and upload

    git clone --depth 1 https://github.com/Shopify/dawn.git /tmp/dawn
    python3 build_theme.py /tmp/dawn      # -> dist/kinbell-theme.zip
    # Shopify admin → Online Store → Themes → Add theme → Upload zip file → Publish

## After uploading

1. Import the product with DSers (US Plug). On the home page: Customize → One-product landing → pick it.
2. Price: $59.99. Bundles show $99.99 (2 sets) and $134.99 (3 sets). Create two automatic discounts so
   checkout matches: Discounts → Amount off products → this product → fixed amount $19.99 once per order,
   minimum quantity 2; and $44.98, minimum quantity 3.
3. Reviews: add "Review" blocks with real reviews copied from the AliExpress listing, or install
   Judge.me / Loox, import the AliExpress reviews and add its app block. The rating in the header comes
   from the reviews app (`reviews.rating` metafield).
4. Check the delivery days and the specs in the FAQ against the supplier listing before going live.

## Preview

    cd preview && npm install liquidjs && node build.mjs   # photos in preview/img/1.jpg …
