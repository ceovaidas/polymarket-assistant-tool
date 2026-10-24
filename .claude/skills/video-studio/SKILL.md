---
name: video-studio
description: Make a whole short video for the user in Higgsfield, step by step with their approval - product reference photo, plan, Nano Banana 2.1 images with feedback and regeneration, Kling 4.0 clips after explicit permission, then a final render with cuts and timed on-screen text, plus a running credit counter. Also the templates menu (save a winning video as a template, reuse it) and product/person swaps on the user's OWN videos. Use when the user says "sugeneruok", "padaryk video", "generuok", "šablonai", "template", or asks to create, regenerate or render a video.
---

# Video studio (Higgsfield): plan → images → clips → render

Reply in Lithuanian. Prompts, on-screen texts, captions and hashtags in English.
Follow `.claude/skills/video-prompts/SKILL.md` (every lesson and the numbered step format),
`.claude/skills/video-prompts/templates/` (proven formats, idea library) and `CLAUDE.md` (honest offers).

## Models (checked Oct 2026, re-check with `models_explore` if a call fails)
- Images: `nano_banana_2_1`, `aspect_ratio: "9:16"`, `resolution: "2k"`, references in `medias` with role
  `image_references` (product photo first, then the anchor/character image). ≈2 credits each.
- Clips: `kling4_0`, `mode: "image-to-video"`, `aspect_ratio: "9:16"`, `resolution: "1080p"`,
  `duration` 3-30 whole seconds (use the shortest that covers the shot + 0.5-1 s to trim),
  `medias`: `start_image` (+ `end_image` for reveals). ≈5 credits for 5 s 1080p. Kling has no negative field:
  put the "Avoid: ..." list at the end of the prompt.
- Always preflight with `get_cost: true` and show the number before any paid call.
- Never pass `use_unlim` unless the user asks; never resubmit after a timeout until the job outcome is known.

## Gates (never skip)
1. **Product reference photo first.** No generation without it. Upload it (`media_upload` → curl PUT →
   `media_confirm`) and describe exactly what it shows: colour, print, material, shape, size. If it contains
   a pet or person, prompts say "Ignore the pet in reference 1".
2. **Plan approval.** Show the numbered plan (shots, timings, texts, music) and the credit estimate
   (images + clips + 30% re-rolls) and the current `balance`. Generate only after "taip / generuok".
3. **Images.** Anchor shot first (person + pet + product), show it, wait for OK; then the rest in one
   `generate_image_batch`, then `show_generation_by_ids`. Present each image numbered with your own
   check (consistency, product colour and size, pose physics, NSFW-risk words). The user answers per image:
   "OK" or what to change. Rewrite only that prompt (say what changed) and regenerate only that image.
4. **Clips only after explicit permission** ("generuok video"). One clip per shot, start frame = approved
   image. Show each clip with a contact sheet check (sandbox ffmpeg) for morphing, colour drift, extra
   pets, camera drift, product going back into a box. Regenerate on request with a fixed prompt.
5. **Render** when all clips are approved (see below), then send the MP4 with `SendUserFile`.

## Credit counter (show it after every paid step)
Keep a ledger in the conversation: start balance, each job (what, model, credits), re-rolls, total.
Format: `💳 Kreditai: šis žingsnis X · iš viso šiam video Y · likutis Z (buvo B)`.
Read `balance` at the start and at the end; the final line states the true difference.

## Render (Higgsfield sandbox)
1. Download every approved clip into `/home/user/render/<video>/` (job results / `media` URLs with curl).
2. Fonts: `TikTokSans.ttf` (SIL OFL) from
   `https://github.com/google/fonts/raw/main/ofl/tiktoksans/TikTokSans%5Bopsz,slnt,wdth,wght%5D.ttf`;
   colour emoji font: Noto Color Emoji (OFL). Apple's iOS emoji font is licensed only for Apple devices, so it
   is not used in renders; if the user wants the exact iOS emoji, render the text without emoji or
   deliver a no-text version and they add the text in Instagram/TikTok on iPhone.
3. Copy `clipwright/render/render.py` into the sandbox (heredoc) and write `spec.json`: clips with in/out
   trims from the plan, texts with start/end, `y` 0.15-0.25 (top third), size 60-70 for 1080 wide,
   white bold with black outline, emoji included. Music burned in: only recordings we may publish. The studio
   library has Can-Can (public-domain Wikimedia recording, famous theme from ~90.5 s) and Kevin MacLeod tracks
   from incompetech.com under CC BY 4.0 (Fluffing a Duck, Monkeys Spinning Monkeys, Sneaky Snitch, Jingle
   Bells; the credit line must stay in the caption). Commercial songs (Free Bird, Boombastic, Mambo No. 5)
   are never burned in: render without music and add them in the app.
4. Run it, check a contact sheet of the result, then upload/send the final MP4 to the user.

## Templates menu ("šablonai")
- When the user says a video worked, save it as `.claude/skills/video-prompts/templates/<slug>.md`:
  structure table, slots ({PRODUCT}, {PERSON}, {PET}, {VENUE}), every final image and video prompt, texts with
  timings, music, durations, trims and the real credit total. Add a row to `templates/README.md`. Commit.
- "šablonai" → list the README table (name, best for, cost, last result). Reusing one: ask for the product
  photo and the new world, fill the slots, show the plan, then the same gates.

## Variants of a winner ("variantai")

When a video gets many views, remake it with minimal changes instead of a new video (the clip-bank lesson
from the 80-reel study). Cheapest first: new hook text and/or music on the same approved clips (0 credits,
re-render only); then redo ONE shot, usually the hook shot, with one change (identity, season, the product's
other colour), which costs one image and one clip and still passes the approval gates. Each variant is a
new project; the original stays. The studio's "Sugalvok variantus" button does exactly this.

## Swapping product or people in an existing video
- Allowed on the user's own or licensed videos only (their generated clips, their filmed footage): use
  `hf_mult_replace_object` (swap product/garment/character from reference images) or `kling4_0` with
  `mode: "video-edit"`. Ask "ar šis video tavo?" when unclear.
- A downloaded third-party video is never edited, mirrored or re-uploaded. Rebuild it instead: analyse it
  (reel-pack / Lab), keep the hook and structure 1:1, and generate every shot new with the swapped product,
  people and clothes.
