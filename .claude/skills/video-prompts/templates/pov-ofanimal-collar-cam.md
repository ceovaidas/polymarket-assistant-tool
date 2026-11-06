# Template: pet collar camera "The Concept → VS → The Result" (pov.ofanimal)

User-approved format (2026-11-05). One video = 2 new frames + 2 new clips; the POV clips are reused.

## Structure (~16 s, captions only)
| Beat | Caption | Clip |
|---|---|---|
| 0-4 s | "The Concept 🤢" | NEW: first-person hands try a silly way to mount a camera on the pet (duct tape on the head, oversized bike helmet with a camera...) → it falls off, pet stares offended |
| 4-6.5 s | "VS..." | NEW: same hands buckle the real collar camera (black collar, white module under the chin; supplier photos as refs) |
| 6.5-13 s | "The Result 📸" | REUSED collar-POV clips, **shuffled in random order every time** (hydrant, retriever nose, ball run, squirrel...) |
| last 3 s | "Comment \"DOG\" if you want one 🐶" | the last POV clip of the shuffle |

## Rules from the user
- Look: ordinary iPhone snapshot, flat overcast window light, cool tones; no glow or dramatic light.
- Always an **American** home and street, but **change the home interior every new video** (different
  sofa, flooring, layout, season decor) while keeping the same idea.
- POV from the collar: only a thin soft sliver of chin at the top edge and paw tips at the bottom; never
  the full head. Legs must read as short furry dog legs, never human arms.
- New pet breed per variant; if reusing POV clips, pick a breed whose paws match them (fawn short fur).
- Captions Montserrat ExtraBold white with outline; AI label on; DM automation for the comment keyword.
- Every POV frame in the raw look: flat overcast light, cool muted colours, a little noise, "unedited GoPro".
- Wan drifts out of POV after ~2 s on action prompts (another dog runs into frame, the dog is shown from outside). Check each clip and trim to the POV part; add "the camera stays on the collar the whole time, never shows the dog from outside" to the motion prompt.

## Genjutsu animal swap (user result 2026-11-06, "the perfect version")
- Higgsfield Genjutsu / Genjutsu Lite (`hf_mult_motion_control_flash`, Wan 3.0, 720p): a real source video +
  one photo of the new animal → the same video with the animal replaced. Motion, hands, camera shake, room
  light and POV paws all stay real, so it looks far more real than image→video generation.
- Prompt that worked: "Replace the cat in the video with the cat from @Image 1. Keep the exact face, fur
  color, pattern, eye color and body size of the cat from @Image 1. Copy the original cat's motion, head
  turns, expressions and timing exactly. Keep the same room, lighting, camera movement, hands and duct
  tape. Realistic fur, natural lighting match, no blur, no extra animals."
- The POV paws in the result are swapped too (fur pattern follows the new animal), so the whole video stays
  consistent.
- ONLY use source videos we own: the user's own phone footage (any pet, even a plush toy as a stand-in) or
  our generated clips. Swapping the animal in a competitor's reel is still their video (same room, hands,
  shots, captions): duplicate-content and copyright risk, never post that.
- Best pipeline: film 3-4 short raw clips once (hands + tape fail, hands buckle the collar, a few collar POV
  walks) → Genjutsu swap per breed → new captions. Free generations first.
- GoPro look that worked (user: "much better"): "Screenshot from real GoPro footage, GoPro HERO wide fisheye, ~150 degree FOV, strong barrel distortion, curved edges, everything in sharp deep focus, no bokeh, no cinematic lighting, flat washed-out action-cam colors, compression + noise; camera on the collar at chest height ~25 cm above the floor pointing forward". Words like cozy / warm glow / cinematic pull it back to a movie look.
- POV lock that fixed the drift: "Locked first-person POV: the camera never leaves the collar, the dog is never seen from outside, no third-person shots, no cuts" + 4 s duration instead of 5.
