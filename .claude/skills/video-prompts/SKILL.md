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
