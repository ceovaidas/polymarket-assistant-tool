# Softpun: funny t-shirt store

Dawn-based theme with its own sections (`sp-*`): countdown + announcement header, home (hero, marquee,
product grid, perks, FAQ), three-column product page (story | tee | choices) with fit meter, size guide and
a two-tee "buddy deal", and a pick-a-box email pop-up that reveals a discount code.

    python3 build_theme.py /path/to/dawn          # -> dist/softpun-theme.zip
    cd preview && npm install liquidjs && node build.mjs   # preview/index.html + product.html

Before going live:
1. Discounts → create the pop-up code (default `SOFTPUN10`) and an automatic "Amount off products" discount
   of $9.99 with minimum quantity 2 for the buddy deal (or change the amounts in the theme editor).
2. Header → countdown: only set an end date for a real offer that actually ends then; empty hides it.
3. Products: Size option (S–XXL) so the size buttons and fit meter work; add a front and a back photo.
4. Check the brand name and domain are free before you commit to "Softpun".
