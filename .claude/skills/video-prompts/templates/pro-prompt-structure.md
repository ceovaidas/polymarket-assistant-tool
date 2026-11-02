# Pro video prompt structure (learned from 4 strong prompts the user shared, 2026-11-02)

Use this structure for every motion prompt that has to look real, hold one take, or carry dialogue.
It fixes the problems we keep hitting: models inserting cuts, products/props morphing, plastic faces,
calm "performed" acting, a slow warm-up at the start, and stiff hair.

## The 12 blocks (in this order)

1. **Format line first, in caps:** `ONE UNBROKEN 12-SECOND TAKE, 9:16, no cuts — ONE camera, ONE location,
   ONE continuous movement from the first frame to the last.` Saying it three ways is deliberate.
2. **Reference map:** `@Image 1 = the location: ...`, `@Image 2 = the person: ... Exactly this face and look.`,
   `@Image 3 = the product: ...`. Describe each reference in full even though it is attached.
3. **Add-one-object line** when the product is not in the location photo: `INTO THIS ROOM, ADD ONE OBJECT: ...`
   with its colour chosen to contrast the set (white treadmill vs red walls) and where it faces.
4. **The setup** (one sentence): who does what, facing where.
5. **Energy from frame 0:** `She is ALREADY <state> FROM THE VERY FIRST FRAME AND NEVER <eases off / stops>.`
   Models otherwise spend the first seconds warming up. Name what must NOT happen (no warm-up, no slow part).
6. **The one camera movement:** start framing → end framing, one verb (pull back / push in / follow / turn the
   phone), plus `That is the only camera motion: no pan, no tilt, no orbit, no reframing, no cuts.` Add lens
   and focus (`anamorphic wide open, razor-thin focus on her eyes at the start` or `iPhone front camera,
   slight handheld shake`).
7. **The arc with exact seconds and shot size:** `0.0–3.5s — EXTREME CLOSE-UP: ...`, `3.5–7.5s — CHEST-UP: ...`.
   Each beat: what the body does, what the camera sees, one physical detail.
8. **One key secondary element in caps:** `THE HAIR IS A KEY ELEMENT: ...` (or the product's motion, the
   water, the fabric). Say how it reacts to every movement and that it is never stiff.
9. **Dialogue (only for talking clips):** exact lines in quotes, each with its tone and where it lands in
   time; `accurate English lip sync, small pauses, soft breathing`. Needs an audio model (Artlist: Veo 3.1
   with audio, Kling O3/2.6 audio, Sora 2, Seedance 2.5 R2V audio).
10. **Natural sound:** list the real sounds; `No music.` (music is added in the app).
11. **Realism + face:** one named light source and how it bounces; `natural colour, no grading, no presets`;
    real physics; `real skin texture — pores, peach fuzz, sweat/moisture, individual lashes — no smoothing,
    no beauty filter, no plastic skin`; `correct anatomy, two arms, five fingers per hand, same outfit
    throughout`.
12. **NEGATIVE list tailored to this clip's failure modes:** start from the generic list, then add the
    specific ways THIS shot can go wrong (`no treadmill turned sideways`, `no running away from the camera`,
    `no product changing colour`, `no phone turning into a tablet`).

Generic negative to start from:
`no cuts, no second camera movement, no change of location, no slow motion, no speed ramps, no second
person, no logos or lettering, no captions, no watermark, no beauty filter, no smoothing, no morphing face,
no extra fingers, no warped hands, no stiff or frozen hair, no floating or weightless movement, no
exaggerated theatrical acting, no colour grading, no glitch, no black frames`

## UGC tricks from the same set

- **Phone-turn reveal in one take:** the person talks to a boyfriend/friend on a video call, then turns the
  wrist so the phone camera swings to the "thing you have to see" (the product), holds it, swings back to
  their face for the last line. Write it as one continuous handheld take with motion blur and exposure
  adjusting. Great for gifts: "Babe, look what I found. Forget the buildings, look at THIS."
- **Interruption hook:** a friend walks into frame, gets pushed out ("Hey — no, get out!"), she laughs and
  carries on "like nothing happened". A pattern interrupt in the first 3 s that feels unscripted.
- **3-part talking ad with camera flips (11 s):** selfie hook (0–3 s, "bro, listen" energy) → flip to the
  screen/product (3–8 s, the explanation in plain words) → flip back to the payoff in a new place
  (8–11 s, the result + CTA with an action, then they turn away). Repeat the full outfit in every part.
- **Name the person** (e.g. "a young man named Erik") and repeat the identity line in every beat.
- `No text overlays, no TikTok UI, raw footage` — on-screen text is added in the edit.

## How it changes our defaults

- Keep our anti-AI realism kit, product truth lock and story-first rule; this structure is the container.
- Wan 3.0 stays the default for realistic people (user-confirmed); this structure makes it hold one take.
- Long single takes cost more seconds: plan 5 s clips by default and use 10–15 s only for a hero take.
