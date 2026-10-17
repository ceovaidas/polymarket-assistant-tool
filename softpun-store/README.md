# Softpun: funny t-shirt store

Dawn-based one-page theme in streetwear black (black, white, one red), sections `sp-*`. The home page is
a full product page for the tee you pick in the theme editor; under it "More memes" shows the other tees,
and each opens the same one-page layout. The product page has real delivery dates by the button, the 3
biggest doubts answered, stars only from a reviews app, a UGC video slot, fit meter, size guide and a
two-tee "buddy deal". The cart has a progress bar to "$0 shipping, on us", add-ons under $10 and delivery
date + returns by checkout; the pick-a-box pop-up reveals a mystery discount. `sp-home` (hero, "who are
we roasting?" chooser, grid, perks, FAQ) is still there to add from the theme editor if you want a classic
home page.

    python3 build_theme.py /path/to/dawn          # -> dist/softpun-theme.zip
    cd preview && npm install liquidjs && node build.mjs   # preview/index.html, p0–p7.html, cart.html

Before going live:
0. Theme editor → Home page → "Tee product" → pick your bestseller.
1. Discounts → create the pop-up code (default `SOFTPUN10`) and an automatic "Amount off products" discount
   of $9.99 with minimum quantity 2 for the buddy deal (or change the amounts in the theme editor).
2. Header → countdown: only set an end date for a real offer that actually ends then; empty hides it.
3. Products: Size option (S–XXL) so the size buttons and fit meter work; add a front and a back photo.
4. Cart → set "$0 shipping from" to your real free-shipping rate, pick an add-ons collection (stickers,
   socks under $10) and the delivery window your print partner really hits. The same window is on the
   product page settings.
5. Install a reviews app that writes the standard `reviews.rating` metafields; stars show only then. Add
   the real order/review numbers to the home "proof line" once you have them.
6. Upload a real UGC try-on video to each product; it plays in the gallery.
7. Check the brand name and domain are free before you commit to "Softpun".
