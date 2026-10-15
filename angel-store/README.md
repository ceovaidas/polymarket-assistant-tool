# Halo Lane: one-product store (Angel Blessing Starfall wall light)

Reuses the one-product landing sections from `kinbell-store/theme`; this folder only holds the store's
templates (copy, bundles), `kb-brand.css` (Christmas palette, Playfair headings) and header/footer text.

    python3 build_theme.py /path/to/dawn        # -> dist/halo-lane-theme.zip
    cd ../kinbell-store/preview && STORE_DIR=../../angel-store node build.mjs   # preview

Before going live:
1. Order a sample and replace the photos with real ones. The supplier image is a render, and the same
   product is sold in very different sizes (22 cm to 85 cm). Update "Size & details", the FAQ and the
   "Good to know" block with the size you actually receive.
2. Add the power source (battery / USB / plug) and any timer or remote to the specs.
3. Price $39.99; bundles $64.99 (2) and $84.99 (3): create automatic discounts of $14.99 (min qty 2)
   and $34.98 (min qty 3).
4. The Christmas cut-off (Dec 3) assumes 7–14 business days delivery. Change it if shipping differs.
