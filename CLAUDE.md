# Working with this user

- Always reply in Lithuanian. Code, commit messages and AI generation prompts stay in English.
- Projects here: `jolly-haul-store/` (Shopify theme for Jolly Haul, viral Christmas gifts) and
  `clipwright/` (video-remix tool for organic dropshippers: prototype `index.html`, real app in `app/`).
- The repository is public: never commit API keys, and never commit third-party reference videos or
  their frames.

## Standing requests

- **Theme zip:** after every theme change, rebuild the store's `dist/*-theme.zip` and send it to the user
  as a file (SendUserFile), not just a path.
- **Buyer psychology:** before writing hooks, product copy, ads or offers, and whenever the user asks
  whether a product will sell, follow `.claude/skills/buyer-psychology/SKILL.md`.
- **Reel link → full pack:** when the user sends a reel link or video to remake, follow
  `.claude/skills/reel-pack/SKILL.md` and reply with the whole pack (breakdown, music, hooks, prompts,
  caption, hashtags, edit notes, cost) in one message.
- **Generate in Higgsfield:** when the user asks to generate, render or reuse a template, follow
  `.claude/skills/video-studio/SKILL.md` (product photo first, approval gates, credit counter, render).
- **Hooks:** before writing any hook or opening shot, read `.claude/skills/video-prompts/templates/hooks.md`,
  work the hook shot first until it passes its checklist, and log every hook tried (and its result) there.
  Save every format the user likes as a template in that folder.
- **Video → prompts:** when the user uploads a video and asks for prompts, follow
  `.claude/skills/video-prompts/SKILL.md` exactly: scene breakdown, then a full self-contained image
  prompt and a motion prompt for every scene, then the cost table.

- **Product research:** for product hunting (and the daily 9:00 Vilnius scheduled run) follow
  `.claude/skills/product-research/SKILL.md`; reports go to `product-research/YYYY-MM-DD.md`.

## Offer wording (store copy, video hooks, captions, CTAs, pop-ups, emails)

Frame every offer as something the customer gets, never as a cut or a freebie:

| Don't say | Say instead |
|---|---|
| $10 off | $10 to spend |
| 10% off | mystery discount |
| free gift | $29 worth gift (name the real value) |
| free shipping | $0 shipping, on us |
| buy one get one free | 99% off the second one |

Apply this to everything written for Jolly Haul and any future store. When editing existing copy that breaks it, point it out.

## Sales psychology (use hard, but only with true claims)

Use these in store copy, product pages, cart, pop-ups, emails and video hooks:

- **Anchoring:** show the real "worth" first (bundle value, gift value), then the price. Price ends in .99.
- **Framing as a gain:** see "Offer wording" above. Talk about what they get, not what they save.
- **Real scarcity and urgency:** shipping cut-off dates ("Order by Dec 10 for Christmas"), stock counts
  and countdowns only when they come from real data or a real deadline that actually ends.
- **Social proof:** real order counts, real reviews, UGC, "most gifted this week" from real sales.
- **Loss aversion:** "Don't be the one who gives socks again", "Christmas is in 14 days".
- **Identity and belonging:** "for the grandpa who has everything", "for the funniest one in the family".
- **Reciprocity and curiosity:** spin wheel, mystery discount, "$29 worth gift" with a real value.
- **Decoy and bundles:** a middle option that makes the 2-pack the obvious pick; "99% off the second one".
- **Commitment ladder:** small yes first (spin the wheel, quiz, add one item), then the bigger offer.
- **Cart:** progress bar to $0 shipping, one-click add-ons, reassurance (returns, delivery date) next to
  the button.

Never (illegal under EU consumer law and FTC rules, gets ads and the Shopify store banned, and drives
chargebacks): fake countdowns that reset, invented "only 2 left" or "23 people viewing", fake or bought
reviews, fake "was" prices, hidden fees or pre-ticked add-ons, subscriptions that are hard to cancel,
confirmshaming ("No thanks, I hate saving money"), fake celebrity endorsements, false health or safety
claims. If asked for one of these, offer the honest version that gets the same effect.

## Building any new store (Jolly Haul or the next one)

These rules are part of the build, not an afterthought. Before designing, run the buyer-psychology
analysis for the niche and its main products, then build every part around it. For one-product stores use the clean premium layout in
`.claude/skills/premium-product-page/SKILL.md` (start from `toetally-store/`):

- **Home page:** hero = the end result / moment (rule 6), one clear "who it's for" line, real social
  proof above the fold, real delivery deadline bar, gift finder or quiz (commitment ladder).
- **Product page:** pain → end result headline, short vivid description in the buyer's own words, real
  UGC video, transparency block (real photos, sizing, delivery dates, returns), the 3 biggest objections
  answered next to the buy button, bundle / 2-pack decoy, gain-framed offer wording.
- **Cart:** progress bar to "$0 shipping, on us", one-click add-ons under $10, delivery date and returns
  reassurance by the checkout button.
- **Pop-ups and wheel:** gain framing ("$10 to spend", "mystery discount"), neutral "Maybe later",
  no confirmshaming.
- **Emails / SMS:** abandoned cart = cost of inaction + real deadline; post-delivery = ask for a review
  and UGC.
- **Voice:** confident, short, funny, like a friend (rules 5 and 7).
- Everything true: no fake timers, stock, reviews or "was" prices (see the Never list above).
