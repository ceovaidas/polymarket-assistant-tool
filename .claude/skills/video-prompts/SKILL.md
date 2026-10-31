---
name: video-prompts
description: Turn an uploaded reference video (TikTok, Reel, Short) into scene-by-scene AI generation prompts - one full image prompt (Seedream) and one motion prompt (Seedance/Kling) per scene. Use whenever the user uploads a video and asks for prompts ("parašyk promptus", "promptai", "prompts for this video"), or asks to recreate/remix a video scene by scene.
---

# Video → scene prompts

The user (Jolly Haul / Clipwright) uploads a viral video and wants every scene rebuilt with AI.
Reply in Lithuanian; the prompts themselves stay in English.

## 1. Break the video down

1. Find the cuts: `ffmpeg -i in.mp4 -vf "select='gt(scene,0.2)',showinfo" -an -f null - 2>&1 | grep -o "pts_time:[0-9.]*"`
   (drop to 0.15 if it finds too few). Get the duration with ffprobe.
2. Make a contact sheet and LOOK at it: `ffmpeg -i in.mp4 -vf "fps=16/<dur>,scale=200:-1,tile=8x2" -frames:v 1 sheet.jpg`,
   then pull one larger frame from the middle of each scene (`-ss <t> -frames:v 1 -vf scale=300:-1`) and
   `hstack` 3-4 of them so you can read faces, clothing, props, on-screen text.
3. Note per scene: time range, what happens, camera angle and distance, light, on-screen text, emotion.

## 2. Short analysis first

- Why the video works (format, e.g. problem → solution; what the 0-2 s hook is; where the payoff is).
- Whether it is raw UGC or polished - match that. Raw UGC must not come out as a glossy campaign.
- On-screen text per scene and the caption / "Comment X" CTA.
- Check every remix against the 3-part viral structure: **hook** opens a question the viewer wants
  answered (0-2 s), **build-up** tells a short story that keeps them watching, **payoff** answers the
  question with an emotional beat (reveal, twist, light/beat drop). If the payoff doesn't answer the
  hook, rewrite the hook. When a video wins, double down: same structure, new setting/people/hook.

## 3. Prompts - the format the user approved

Every scene gets its own heading `### Scene N · start–end s · "on-screen text"` and then:

**Image prompt - FULL and SELF-CONTAINED.** Never use placeholders like [MOM] or "same as above":
repeat the full description of the person, product and setting in every prompt so each one can be pasted
on its own. Structure, in this order, as one paragraph:

```
Authentic iPhone 16 Pro UGC frame, premium e-commerce campaign quality captured casually on a phone.
<Shot type and angle>: <person - age, hair, skin, clothes, expression> <action> <product "from the product
reference", described exactly: colour, design, details, texture>. Setting: <place, weather, background
people, props>. Composition: portrait 9:16, <what fills how much of the frame, rule of thirds, leading
lines, product as hero>, slight handheld tilt. Lighting: <direction, quality, bounce, how the product
reads>. Colour: <main colour contrast, accents>, natural iPhone colour science, Smart HDR 5 dynamic
range, high micro-contrast, no film grain. Photorealistic <faces/hands/fabric> with natural texture,
no text, no logos, no watermark.
```

**Motion prompt** (short, under the image prompt): camera move, what moves and how, tempo, how the shot
ends, `Sound:` line. Add the generation length note, e.g. "Seedance 5 s, use 2.1 s".

Rules:
- Write "from the reference" / "from the product reference" wherever an uploaded image must be attached
  (product, saved character). Never copy the original video's brand names or logos.
- Describe the product precisely enough to reproduce (colour, design placement, zips/buttons, texture).
- Keep the same person, outfit and place identical in wording across all scenes for consistency.
- Do not write prompts that rely on bypassing a model's content filter; describe novelty products plainly.

### Delivery format: numbered steps (user-approved, use every time)

Write the prompts as a numbered build order, one generation per step, so the user can follow it top to
bottom without guessing. Never mix scene order and build order.

1. **ŽINGSNIS 0 · Pasiruošimas:** clear old references/elements in the video tool; have the product photo
   and the pet/person reference ready.
2. **Image steps first**, anchor shot first (the one with person + pet + product), then the rest.
3. **A "send to Claude" checkpoint** after the images (consistency, product colour, bed size).
4. **Video steps** in timeline order.
5. **Last step: montage** (order, trims, text, music, caption).

Each step uses this exact block:

```
## ŽINGSNIS N · NUOTRAUKA | VIDEO · Kadras X (laikas, paskirtis)
**Kur:** Seedream / Kling Image | Kling Video (image-to-video)
**Įkelk:** 1) ... 2) ...            (images) | Start frame: ŽINGSNIO N rezultatas, End frame: ... (video)
**Promptas:** one code block, complete and self-contained
**Negative:** one code block (video steps), always with the colour lock words
**Trukmė / kirpk:** 5 s, use a–b s (video steps)
**Patikrink:** 2-3 checkboxes the user verifies before the next step
```
Every video prompt starts with the lock line and the product colour lock; every negative includes
"pink bed, different pattern, different colour, new cat appearing, camera movement, cuts, morphing".

### Template gallery

Check `templates/README.md` first: proven formats with fill-in slots live in `templates/`. When the user
confirms a generated video worked, save its prompts there as a new template (slots for product, person,
venue) and add it to the README table.
Before writing any hook or first shot, read `templates/hooks.md` (hook checklist, skeletons, the
iteration loop and the log of every hook tried); add each new hook and its result to its log.

### Anti-AI realism kit (default for every image and motion prompt, user rule Oct 26 2026)

Viewers comment "AI 🤖" and stop trusting the product when a frame looks generated. The user's verdict:
"video atrodo kaip AI, kas kaltas? promptai". Every prompt now carries these, written out, not implied:

**People (the #1 tell):** ordinary, non-model people with real proportions and ages; one specific
imperfection each (uneven stubble, a few grey hairs, under-eye bags, acne mark, chipped nail polish,
wrinkled shirt, a lanyard twisted, a stain on a hoodie); natural off-camera expressions, mid-blink or
mid-word, not posing for the lens; never "beautiful", "perfect", "model", "flawless".
**Camera:** "shot on a new iPhone held by a friend", crisp and sharp, slightly crooked horizon,
imperfect candid framing (a head or shoulder cut by the edge, someone partly blocking the view), mild
motion blur only on moving hands. Realism comes from the people, the framing and the place, NOT from bad
quality: the user rejected "older iPhone / noise / compressed" (Oct 26 2026: "kokybė prastėja, norėtųsi
šviesių jaukių vaizdų"). Never "cinematic", "8k", "studio lighting", "bokeh", "masterpiece",
"photorealistic" alone, "ultra detailed".
**Light:** bright, warm and cozy by default (daylight through windows, warm practical lamps, golden
hour), still the place's own light, not a studio: soft natural falloff, no rim light, no glossy skin.
Use harsh or greenish light only when the user asks for a gritty look.
**Places:** lived-in clutter that fits the place (receipts, cables, half-drunk coffee, scuffed floor,
tape on the wall, a trash bin, a hand sanitizer); real background people doing their own thing, some
not looking at the subject, partly out of focus or cut by the frame.
**Motion prompts:** real-time speed, small human hesitations (a glance, a shrug, a half-step back),
background people keep moving, "handheld phone with tiny natural shake" when a person films, sound line
with room tone. Keep each clip one action; trim before the end where models drift.
**Text in frame:** none from the model; texts are added in the edit.

### Product truth lock: toe charms for clogs (toetally.extra)
Describe the REAL product, not a nicer one (from the supplier photos): every charm is the SAME chunky
big-toe shape (no small pinky toes), a bit larger than a real toe, matte-to-slightly-shiny skin-tone
PVC with moulded nail and creases, a small black push-in plug under each one; five of them sit in a row
across the front holes of a fully closed black clog; the clog's own round holes stay visible around them;
the hairy version has a few sparse long dark curly hairs on top. The wearer's real foot is inside the
closed clog: "NOT sandals, NOT real toes". Attach a real product photo (supplier on-feet photo or the
single-charm close-up) as reference 1. A video that shows a nicer or different product than we ship
causes refunds and angry comments.

### Story first, then b-roll
A montage of situations is not a story. Every video gets a "what happens next?" line: a mission
("wearing toe clogs to places until someone notices, day 3"), a bet, a gift being opened, a reaction
we wait for, a reveal promised in the hook and paid off at the end. B-roll = 1-2 s cutaways inside that
story (close-up of the toes stepping, someone's double take, the box, the cart), never the whole video.

### Lessons from real generations (follow these every time)

- **The start frame decides the physics.** Pose the subject in the image so the motion is short and
  obvious: a cat already half inside the bed, a person already holding the jacket, the subject in front
  of the opening. If the subject has to walk around an object, the model takes a shortcut (over it,
  through it). Never fix that in the motion prompt; fix the image.
- **One simple action per clip.** Don't ask for things the model can't see (turning around inside a
  pouch, putting on a hoodie under a jacket). Split into two clips and cut on the action.
- **Start every motion prompt with a lock line:** "Continue exactly from the start image, same
  full-colour footage, same lighting and white balance, static camera, no cuts." Name what must NOT
  change: no night-vision / black-and-white switch, no second cat or person, no object rotating,
  growing or changing shape.
- **Label which image each motion prompt belongs to.** Pasting a motion prompt from another scene
  (e.g. an infrared one) silently breaks the clip.
- **Product lock with negatives.** Describe the product exactly, then list what it is NOT (no hood,
  not an all-over print, only one appliqué on the chest...) and add "if unsure, copy it from the product
  reference". Attach only one clear front photo of the product.
- **Realism cues:** "REAL phone footage, NOT CGI", practical light only with realistic falloff, deep
  focus (zero blur unless asked), subtle low-light noise, small real-life imperfections (wrinkled
  sheets, stray hairs, uneven grass, scuffs, slightly blown-out sky). Too-clean, symmetric, perfectly
  lit scenes read as AI.
- **No phone in frame:** words like "iPhone UGC" or "phone on a tripod" can put a phone in someone's
  hand; add "no phone visible anywhere" when a person's hands are in shot.
- **Animals and people are never hurt:** falls land softly and safely on their feet.
- **No fake camera moves (user feedback):** slow push-ins, dollies and orbits read as CGI and make the
  scene warp (the boat and the man shifted). Default every motion prompt to: "locked-off static
  camera, like a phone resting on the bench: no zoom, no push-in, no orbit, no pan, no parallax";
  allow only tiny natural handheld sway when the shot is clearly handheld. Do zooms in the edit.
- **Consistency lock (user rule):** one video = one cat (same breed and colour), one person (same face,
  hair, beard, clothes) and one setting (same place, light, time of day) in every shot. Write those
  sentences once, paste them identically into every image prompt, and attach shot 1 as a reference.
- **Fewer shots (user feedback):** default to 3-4 shots per video, each one image + one simple action.
  Merge beats instead of adding shots (e.g. the leap happens inside the wide shot, no separate drone
  shot). More shots = more cost, more drift, harder to keep consistent. Offer extra shots only as options.
- **Check consistency before motion:** when the user sends generated frames, compare person and pet
  across them (hair, beard, age, cat breed and colour). If one drifted, give a short edit prompt
  ("replace the cat with the one from reference image 1, keep everything else") before writing motion.
- **Spell out product geometry and scale for "pet in product" poses:** "halfway inside" alone made the
  model drape the cat bed over the cat like a shell, or blow the bed up bigger than the seat. Write: a
  closed pouch lying flat on <surface>, closed end at <side>, opening facing <side>, about <size> (≈1.5x
  the cat's body length, fits on the seat with room to spare); which body parts are inside (a cat-shaped
  bulge under the fabric) and which stick out of the opening; plus negatives "not draped over the cat,
  not worn like a blanket, the cat is not underneath it, not oversized". If a past frame got the pose
  right (fishing shot 3), attach it as an extra pose reference.
- **Accidental slip/fall, not a jump:** an awake cat sitting or lying alert on an edge will walk and jump
  down on purpose. Pose it in the start frame sound asleep, belly-up or on its back, half its body already
  over the edge; in motion say it stays asleep and limp, slides off passively like a sack, "does not stand,
  walk or jump", and lands on something soft right below, only waking after landing.
- **Kling adds its own cuts:** write "single continuous take, no cuts, no close-up insert" or it may
  splice in a close-up at the end.
- **Start + End frame clips can overshoot:** in the Texas unboxing the bed came out, then sank back into
  the box before the end. Always check the last second and give exact trim points; say "ends holding the
  bed up, it never goes back into the box". Soft products held in the air: add "soft floppy fabric,
  sags naturally, not a rigid bucket".
- **Avoid shape-changing product actions:** kicking/unrolling/throwing a soft product made Kling fling it at
  the lens and morph it into a different product (round donut bed). Prefer reveals where the product's
  shape never changes (pull a blanket off, open a box lid) and lock the result with an End frame that
  already shows the correct product.
- **Before any motion, check the start frame shows the product from reference 1** (right colour and
  print). A pink bed appeared because the product photo was not attached; the video can never fix that.
- **Video models recolour the product:** Kling turned the blue bunny bed pink (unicorn print) in 3 of 4
  clips although the start frames were blue, and added a cat to an empty bed. In every motion prompt add a
  colour lock ("the bed stays exactly as in the start frame: cornflower-blue with white bunny faces, never
  pink, no other print") and put "pink, unicorn, different pattern, different colour" in the negative.
  Image-to-video uses only the start (and end) frame: tell the user to remove any other reference/element
  images in the video tool. A video that shows a different product than we sell can't be posted.
- **Ask which product photo the user attaches and describe THAT one.** The user switched to a pink
  rocking-horse variant while prompts still said blue bunnies; the models followed the photo and the
  shots disagreed. If the product photo contains a pet, add "ignore the cat in reference 1, use only
  the cat from reference 2" (a ragdoll from the product photo leaked into a shot).
- **False NSFW flags on harmless shots:** a woman + "bed"/"sleeping-bag bed" + "lounges on a daybed",
  "linen dress", "like carrying a baby" got two images refused. For scenes with a person, call the
  product "the cat pod" or "the cat nest", dress the person fully (long sleeves, trousers), seat them
  upright in a chair, and avoid baby/body/lounging words. Plain wording, not filter tricks.
- **Upload line on every shot (user request):** put a line right above each image prompt and each
  motion prompt, e.g. `📎 Seedream image: reference 1 = product photo, reference 2 = shot 1 image` and
  `📎 Seedance video: start frame = the shot N image you generated (no other uploads)`. Always the same
  order: reference 1 = product photo, reference 2 = the character/pet reference. Shot 1 without a product
  in it gets only the pet/person reference (or nothing).
- **Say what to attach, on every shot:** start each image prompt block (outside the prompt) with
  "Attach: product photo + shot 1 image" from shot 2 onward. In the fishing video the user skipped it
  and the cat turned from orange to a ragdoll and the man got younger: the #1 reason a video reads as AI.
- **Timing:** hook action inside the first 1 s; every middle shot 2-3 s; only the payoff may be longer.
- **Always end on a close-up payoff:** the pet's face in the product, slow blink. A wide final shot
  makes the product too small to sell.
- **Review checklist for the user's finished videos** (look at a contact sheet, then score):
  same pet colour/breed in every shot · same person · same setting/light · static camera, no warping ·
  hook action by 1 s · no shot over 3 s except the payoff · close-up payoff with the product readable ·
  animal safe · on-screen text in the top third. Score each, give the 2-3 cheapest fixes, never promise
  virality (give ranges and say what would raise them).
- **Accessories are part of the consistency lock** (cat bed "think vs actually" video): the cat wore a
  bandana only in the close-ups and lost it mid-clip in the last one. A bandana, collar or hat goes in
  the character sentence and in every shot, or nowhere. Check the end of each clip for morphs and trim
  the clip before them.
- **Edit rules from the same video:** a "think vs actually" or reveal cut is a hard cut, never a
  dissolve (the dissolve showed a ghost box inside the bed). Each text appears on the beat it names
  ("What we actually sell" exactly when the cat goes in, not 3 s later). Max 2 lines on screen; a
  third line is a new text. Captions big (about 70 px at 1080 wide) with a thick outline, emoji never
  alone on a line.
- **Dead time kills it** (second render of the same video, 14.6 s): shot 2 ran 8 s, of which 5 s was
  the woman petting a cat that was already inside. Cut each shot right after its action ends: hook
  shot about 2 s, middle shots 2-3 s, payoff 2-3 s, whole video 7-10 s. Texts change on the cuts, one
  idea each, no filler like "Vs...", and never three captions merged into one block.
- **Fixed camera angles** (top-down, security cam, POV): describe where the camera is physically
  mounted ("mounted on the pergola beam directly above, looking straight down") and repeat the same
  sentence in every scene so the angle matches across cuts.

- **Product scale (toe clogs gym shot):** "low angle from the floor" plus "fills the lower 35% of the
  frame" made the clogs giant clown shoes. Shoot from knee height about 2.5 m away with a "natural 1x
  phone lens, no wide-angle distortion", say "normal realistic adult size, exactly proportional to the
  body, no bigger than regular sneakers", keep the person at 80-85% of the frame height, and add
  "oversized shoes, giant, clown shoes, huge feet, fisheye" to the negative.
- **Wearable gag products turn into real body parts:** fake silicone toes came out as real bare toes in
  open sandals. Say "fully closed clogs, the wearer's real feet hidden inside, NOT sandals, NOT
  open-toe", describe the fake part's size ("small, normal human toe size"), and fix a drifted frame with
  an edit prompt ("Edit reference 2, keep everything else identical, replace only the footwear with the
  exact product from reference 1"). Fake parts are rigid: "the toes never wiggle" (an honest demo).
- **Check the reference thumbnail colour:** the user attached a pink variant while selling black. Ask or
  warn before the next shot.
- **Hidden-product hook:** the start frame must contain no product and no product colour at all, the
  person mid-action with a neutral face (a hand already on the mouth leaves no laugh to build), and the
  frame edge the person points at described as plain background. Kling slides products into an empty
  frame unless the negative says "product appearing, objects sliding in".
- **Kling inserts a hard cut when Start and End frames look like two places.** For a camera turn,
  create the end frame by editing the start frame ("the same moment, camera turned about 60 degrees to
  the right, the display 2 m away now fills 70% of the frame, the person partly visible at the left
  edge") and say "one single continuous handheld take, no cuts, no scene change". This is the only case
  where a camera move is allowed, and only when the user asks for it. Backups: two clips cut on the same
  action, or a wide 16:9 clip with the pan done as a moving 9:16 crop in the edit.
- **Swap a person in a liked frame with an edit, not a re-roll:** "Edit reference 1, keep the scene
  identical, replace only the man with the woman from reference 2, keeping her exactly as she is".
- **Reaction shots:** the wearer does one serious action with a straight face, a witness double-takes
  and laughs. Put the witness's laugh at the end of the clip and keep the wearer's feet still.
- **Body anatomy in feet shots (toe clogs, user rejected two frames):** a "look down at my feet" POV
  came out as someone lying down with legs stretched to the horizon, and "feet up on the dashboard"
  gave legs that belonged to nobody. Write where the body is and how the phone is held: "person
  STANDING, phone at chest height pointing almost straight down, shins foreshortened from the bottom
  edge, no knees visible, soles flat on the ground with contact shadows, their own shadow ahead". For
  feet on furniture, film it as the owner's own POV (legs come from the bottom edge, "legs clearly
  connected to the camera's body"), and add "floating feet, disconnected legs, legs from nowhere" to
  the negative.
- **Never name a third-party brand** (Crocs, Costco) in prompts, packaging, on-screen text or captions,
  and remove their logo badges ("no logo badge anywhere"). Describe the product generically.

## Lessons from same-prompt comparisons (2026-10-31, police scene, 3 clips)
- **Two people of the same sex need two full, different identity lines** (age, hair colour and length,
  build, face shape, clothes). With vague people the model gave the driver and the officer the SAME face
  (AI twins): the first thing viewers notice.
- **Props morph after ~3 s:** the officer's phone turned into a tablet in both good clips. Name the prop
  once with its size ("a small black smartphone, held in one hand the whole time") and cut the clip
  at ~3 s if it still changes.
- **The product must match the start frame:** a clip generated without the product photo turned the
  clogs into open slides with one big toe blob. Always attach the product reference / use a start frame.
- **Toes must read as charms, not real feet:** in close views the toes looked like real toes poking out
  of an open-toe sandal. Keep "chunky rubber toe charms plugged into the top holes, the clog front
  closed" in the product sentence, and check the feet crop before animating.
- **Context makes it real:** the version with the police car's blue lights on and the officer filming
  the shoes read as real phone footage; small true details (lights, radio, sunglasses) beat a clean set.
- **Judge with crops, not the full frame:** check feet, faces and hands crops at 1 s, 3 s and the end.

## Offer wording in hooks, captions and CTAs

Follow the "Offer wording" table in `CLAUDE.md`: "$10 to spend" not "$10 off", "mystery discount" not
"10% off", "$29 worth gift" not "free gift", "$0 shipping, on us" not "free shipping", "99% off the
second one" not "buy one get one free". Applies to on-screen text, captions and the final CTA.

## 4. After the prompts

- Consistency tip: generate scene 1 first and attach that person as a reference to every other scene,
  together with the product photo.
- Seedance renders at least 4-5 s; scenes are usually shorter - generate 5 s and trim.
- Cost table (Higgsfield, user's numbers): Seedream image ≈ 2.75 credits, Seedance 5 s clip ≈ 28 credits,
  15 s multi-shot clip ≈ 67 credits; 1 credit ≈ $0.05 (depends on plan). Show images + clips + total,
  +30% for re-rolls, and the savings options: one multi-shot clip, still scenes as photo + zoom in the
  edit, 4 s clips, or the API route (Kie.ai Seedance ≈ $0.205/s at 720p, Kling 3.0 ≈ $0.07/s).
- Offer a Jolly Haul version of the same template (Christmas sweater, bald grandpa with grey moustache)
  and offer to generate the frames or add the video to Clipwright as a template.
