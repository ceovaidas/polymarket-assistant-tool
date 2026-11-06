# pov.ofanimal: one-product store (POV Pet Collar Camera)

A thumb-sized camera that clips under a dog's or cat's chin and films from their eye level. Same "clean
premium" layout as `toetally-store` (shared sections from `kinbell-store/theme`): white page, soft grey cards,
charcoal tiles, black pill buttons, Poppins headings, the `pov.ofanimal` wordmark with an orange dot, and
sunset orange (#FF7A1A, from the logo) only as the accent. Layout reference: the user's nasal-strips
screenshot; competitor checked: thepawview.com (Nov 2026). Copy, photos and offers are our own.

    python3 build_theme.py /path/to/dawn        # -> dist/povofanimal-theme.zip
    cd ../kinbell-store/preview && STORE_DIR=../../povofanimal-store node build.mjs   # preview (photos in preview/img, not committed)

## Product and pricing (proposal, not yet in Shopify)
| Set | Price | Automatic discount to create |
|---|---|---|
| 1 camera (`pet-pov-collar-camera`) | $54.99 | none |
| 2 cameras | $99.99 | "Camera: 2 sets" $9.99 off, min 2 |
| 3 cameras | $139.99 | "Camera: 3 sets" $24.98 off, min 3 |
Variant option "Pet": Dog / Cat (same camera, different collar size if the supplier has it).
If a price changes, change the discount and the tier amounts in the theme editor.

## Check against the sample before launch
- Battery time, video resolution, water rating, how videos reach the phone (app / Wi-Fi / cable) and whether a
  microSD card is needed: none of these numbers are on the page yet on purpose. Add them only from the real
  sample and the supplier sheet.
- Weight: confirm it is light enough for cats before keeping "for cats" in the copy.
- Delivery 7–14 business days, shipping in 1–3: match the real supplier.
- Photos: real product photos + real POV footage before ads (no AI proof of what the camera films).

## Keep it true (competitor vs pov.ofanimal)
| thepawview.com | pov.ofanimal |
|---|---|
| "BLACK FRIDAY 45% OFF" bar, every day | Real shipping and returns in the bar; a dated offer only when there is one |
| "Dhs 375" struck "was" price, "-44%" | Struck price only on sets = real sum of single cameras |
| "(1131 Reviews)", "#1 selling pet POV camera" | No rating or ranking until real reviews/sales exist |
| Shipping protection pre-ticked add-on | No pre-ticked add-ons |

## Set up in Shopify
1. Store / domain, product `pet-pov-collar-camera` (variants Dog, Cat) with photos: 1 collar on a dog,
   2 the duct-tape fail, 3 product close-up, 4 dog POV frame, 5 cat POV frame.
2. Create the two automatic discounts above.
3. Upload `dist/povofanimal-theme.zip` (Online Store → Themes → Add theme → Upload zip) and publish it.
4. Pages: refund (30 days), shipping and privacy policies, contact email.
