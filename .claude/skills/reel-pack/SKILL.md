---
name: reel-pack
description: One-stop "reel pack". The user sends an Instagram/TikTok reel link (or an uploaded video) plus their product, and gets everything in one reply - breakdown, original music, hook texts, full image + motion prompts per scene, caption/description, hashtags, pinned comment, CTA and cost. Use whenever the user sends a reel link or video and wants to remake it, or says "/reel", "reel pack", "viską vienoje vietoje".
---

# Reel pack: everything for one video in one reply

Reply in Lithuanian; prompts, captions and hashtags in English (the audience is English-speaking).
Follow `CLAUDE.md` (offer wording, honest claims), `.claude/skills/video-prompts/SKILL.md` (prompt format
and "Lessons from real generations") and check `.claude/skills/video-prompts/templates/` first.

## Inputs
- Reel link or uploaded video (required).
- Product: which product and its reference photo (ask only if unclear; default to the user's current product).
- Optional: changes the user wants (setting, people, angle, extra shots).

## Steps (do them, don't describe them)

1. **Download + metadata** in the Higgsfield sandbox (it has internet; local proxy blocks Instagram):
   `HOME=/home/user python3 -m yt_dlp -q -o "%(id)s.%(ext)s" -f "mp4/best" --write-info-json <url>`
   Read uploader, likes, caption from the info JSON.
2. **Cuts + contact sheet**: `ffmpeg ... select='gt(scene,0.2)'` and an 8x3 tile sheet, then look at it.
3. **Speech**: faster-whisper `small` on the audio (`ffmpeg -ar 16000 -ac 1`), only keep real speech.
4. **Music**: Shazam via a clean venv (the sandbox breaks pip unless the env is clean):
   ```
   env -i HOME=/home/user PATH=/usr/local/bin:/usr/bin:/bin python3 -m venv /home/user/venv
   env -i HOME=/home/user PATH=/usr/local/bin:/usr/bin:/bin /home/user/venv/bin/pip install -q --no-cache-dir shazamio
   ```
   Recognise 7 s segments at 0/4/8 s (`ffmpeg -ac 1 -ar 44100`), report the title and artist.
5. **Write the pack** (format below). Never commit downloaded videos or frames.

## Output format (always these sections, in this order)

### 1. Originalas
Table: time · what happens · on-screen text. Plus: likes, music, why it works (hook / build-up / payoff),
and any risks (brand logos, fake claims, animal or person safety, product used in a way it isn't made for).

### 2. Kas pakeista
Table original → our version (setting, people, angle, product, text), so it is not a 1:1 copy.

### 2b. Kiti kampai (remix ideas)
Same structure and hook mechanic, moved to new worlds that fit the product and its buyer. Give 4-5
options in a table: **setting** · **one-line concept** (what happens in each beat) · **why it fits the
buyer** · **hook text**. Mix:
- **Unexpected place:** a home video moved to a stadium, airport, subway, gym, concert, beach or road trip.
- **Identity niche:** the scene where the target buyer lives (cat moms: cafés, cozy apartments, vet,
  road trips; streetwear: motorcycle meets, rooftops, concerts, night city).
- **Scale-up:** one person becomes a crowd, a couple or a whole team.
- **Season or moment:** holiday, first snow, Halloween, Black Friday shipping cut-off (real dates only).
Pick the strongest one as the default for section 5, and say the others can be written on request.
Realism check: the product must make sense there (a cat bed at a stadium works as a portable comfort
bed; never show it used in a way it isn't made for, never real team or brand logos).

### 3. Muzika
Original track (Shazam). Organic: add from the in-app library. Paid ads: a similar track from the
Meta Sound Collection / TikTok Commercial Music Library. Where the beat drop should land (second).

### 4. Hook'ai
Read `../video-prompts/templates/hooks.md` first (checklist, proven skeletons, log) and add the new hooks to its log.
3-5 on-screen hook options (top one marked), each built on hook → payoff. Plus the end-screen CTA text.

### 5. Promptai
Characters + product sentence (identical in every shot). Then per scene:
`### Scene N · start–end s · "on-screen text"`, a full self-contained **Image prompt**, and a **Motion
prompt** labelled with which image it belongs to, starting with the lock line. Also give a single
multi-shot prompt when the video is ≤15 s.

### 6. Caption (description)
2-3 caption options (≤150 characters for the first line, then 1-2 short lines), gain-framed offer wording,
no fake scarcity, plus the **pinned comment** text and **5-10 hashtags** (niche + broad, no brand or IP tags).

### 7. Montažas
Text timings, where to cut, beat drop, aspect 9:16, safe zones for text (top third, away from UI).

### 8. Kaina
Credits table (images + clips, +30% re-rolls) and the cheaper multi-shot option.

Finish with one line offering the next step (generate shot 1 / save as a template if it works).
