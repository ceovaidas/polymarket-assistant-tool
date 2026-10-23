# Clipwright Lab worker

Small Python service the Lab calls to read a video: scene cuts, one key frame per scene, speech (faster-whisper)
and music (Shazam). It also mirrors and blurs text areas on the user's **own** clips.

Videos are kept only in a temp folder for one request and deleted afterwards. `/clean` accepts only uploads the
user confirmed they own or are licensed to edit; it never takes a link.

| Endpoint | Body | Returns |
|---|---|---|
| `GET /health` | – | `{ok: true}` |
| `POST /analyze` | `{link}` (reel/TikTok/Short) or `{video_url}` (signed upload URL) | `{duration, meta, scenes[{n,start,end,frame(base64 jpg)}], transcript, music}` |
| `POST /clean` | `{video_url, upload_url, confirm_rights: true, mirror, boxes[{x,y,w,h} as 0-1 fractions]}` | `{ok}`; the result is PUT to `upload_url` |

Every request needs `Authorization: Bearer <WORKER_TOKEN>`.

## Deploy on Railway (about 10 minutes)

1. railway.app → New Project → Deploy from GitHub repo → pick this repo, set **Root Directory** to `clipwright/worker`.
   Railway finds the `Dockerfile`.
2. Variables: `WORKER_TOKEN` = any long random string (the same value goes into the app as `LAB_WORKER_TOKEN`).
3. Settings → Networking → Generate Domain. Put that URL into the app as `LAB_WORKER_URL`.
4. Check `https://YOUR-WORKER.up.railway.app/health`.

The image downloads the Whisper `small` model at build time. Plan for about 1 GB of RAM.

## Local run

```
pip install -r requirements.txt   # needs ffmpeg on PATH
WORKER_TOKEN=dev uvicorn main:app --port 8080
```
