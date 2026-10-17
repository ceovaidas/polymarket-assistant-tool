# Softpun: funny t-shirt store

Dawn-based theme with its own sections (`sp-*`): countdown + announcement header, home (hero with an
optional real proof line, marquee, "Who are we roasting?" chooser, product grid, perks, FAQ), three-column
product page (story | tee or UGC video | choices) with real delivery dates by the button, the 3 biggest
doubts answered, stars only from a reviews app, fit meter, size guide and a two-tee "buddy deal", a cart
with a progress bar to "$0 shipping, on us", add-ons under $10 and delivery date + returns by checkout,
and a pick-a-box email pop-up that reveals a mystery discount.

    python3 build_theme.py /path/to/dawn          # -> dist/softpun-theme.zip
    cd preview && npm install liquidjs && node build.mjs   # preview/index.html, product.html, cart.html

Before going live:
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
