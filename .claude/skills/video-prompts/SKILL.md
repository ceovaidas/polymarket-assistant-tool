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
- **Fixed camera angles** (top-down, security cam, POV): describe where the camera is physically
  mounted ("mounted on the pergola beam directly above, looking straight down") and repeat the same
  sentence in every scene so the angle matches across cuts.

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
