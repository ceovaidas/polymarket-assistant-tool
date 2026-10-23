"""Clipwright Lab worker: turns a video into scenes, key frames, speech and music for the Lab.

Runs next to the Next.js app (Railway, Docker). Every request needs `Authorization: Bearer <WORKER_TOKEN>`.
Downloaded videos live only in a temp folder for the length of one request and are deleted afterwards.
"""
import asyncio
import base64
import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, HttpUrl

MAX_SCENES = 12
MAX_SECONDS = 90
MAX_BYTES = 200 * 1024 * 1024

app = FastAPI(title="Clipwright Lab worker")


def check_token(authorization: str | None) -> None:
    token = os.environ.get("WORKER_TOKEN", "")
    if not token or authorization != f"Bearer {token}":
        raise HTTPException(status_code=401, detail="unauthorized")


def run(cmd: list[str], timeout: int = 120) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


async def fetch_direct(url: str, dest: Path) -> None:
    """Download a file from a direct URL (e.g. a Supabase signed upload)."""
    async with httpx.AsyncClient(follow_redirects=True, timeout=120) as client:
        async with client.stream("GET", url) as r:
            if r.status_code != 200:
                raise HTTPException(status_code=400, detail=f"download failed ({r.status_code})")
            size = 0
            with dest.open("wb") as f:
                async for chunk in r.aiter_bytes():
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise HTTPException(status_code=413, detail="video too large")
                    f.write(chunk)


def fetch_link(link: str, workdir: Path) -> tuple[Path, dict]:
    """Download a reel/TikTok/Short with yt-dlp and return the file plus public metadata."""
    out = workdir / "src.%(ext)s"
    res = run([
        "yt-dlp", "-q", "--no-playlist", "--impersonate", "chrome", "-f", "mp4/best",
        "--max-filesize", str(MAX_BYTES), "--write-info-json", "-o", str(out), link,
    ], timeout=180)
    files = [p for p in workdir.glob("src.*") if p.suffix != ".json"]
    if res.returncode != 0 or not files:
        raise HTTPException(status_code=400, detail="could not download this link")
    meta: dict = {}
    info = workdir / "src.info.json"
    if info.exists():
        raw = json.loads(info.read_text())
        meta = {k: raw.get(k) for k in (
            "uploader", "channel", "title", "description", "duration", "view_count",
            "like_count", "comment_count", "repost_count", "upload_date", "track", "artist", "webpage_url")}
    return files[0], meta


def duration_of(video: Path) -> float:
    res = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)])
    try:
        return float(res.stdout.strip())
    except ValueError:
        raise HTTPException(status_code=400, detail="not a readable video")


def scene_cuts(video: Path, duration: float) -> list[float]:
    res = run(["ffmpeg", "-hide_banner", "-i", str(video), "-vf", "select='gt(scene,0.25)',showinfo",
               "-an", "-f", "null", "-"], timeout=180)
    cuts = sorted({round(float(t), 2) for t in re.findall(r"pts_time:([0-9.]+)", res.stderr)})
    cuts = [c for c in cuts if 0.4 < c < duration - 0.4]
    bounds = [0.0] + cuts + [duration]
    # Merge scenes shorter than 0.5 s into the previous one.
    merged = [bounds[0]]
    for b in bounds[1:]:
        if b - merged[-1] >= 0.5 or b == duration:
            merged.append(b)
    if len(merged) - 1 > MAX_SCENES:  # keep the longest scenes, in time order
        pairs = sorted(zip(merged, merged[1:]), key=lambda p: p[1] - p[0], reverse=True)[:MAX_SCENES]
        pairs.sort()
        merged = [pairs[0][0]] + [p[1] for p in pairs]
    return merged


def frame_b64(video: Path, t: float, dest: Path) -> str:
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.2f}", "-i", str(video),
         "-frames:v", "1", "-vf", "scale=512:-2", "-q:v", "4", str(dest)])
    return base64.b64encode(dest.read_bytes()).decode() if dest.exists() else ""


def transcribe(video: Path, workdir: Path) -> str:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return ""
    wav = workdir / "speech.wav"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video), "-ar", "16000", "-ac", "1", str(wav)])
    if not wav.exists():
        return ""
    model = WhisperModel(os.environ.get("WHISPER_MODEL", "small"), compute_type="int8")
    segments, _ = model.transcribe(str(wav), vad_filter=True)
    return " ".join(s.text.strip() for s in segments if s.no_speech_prob < 0.6).strip()


async def recognise_music(video: Path, workdir: Path) -> str:
    try:
        from shazamio import Shazam
    except ImportError:
        return ""
    clip = workdir / "music.wav"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", "1", "-t", "8", "-i", str(video),
         "-ac", "1", "-ar", "44100", str(clip)])
    if not clip.exists():
        return ""
    try:
        res = await asyncio.wait_for(Shazam().recognize(str(clip)), timeout=30)
    except Exception:
        return ""
    track = res.get("track") or {}
    return f"{track.get('title')} – {track.get('subtitle')}" if track.get("title") else ""


class AnalyzeBody(BaseModel):
    link: str | None = None          # public reel / TikTok / Short link
    video_url: HttpUrl | None = None  # direct file URL (the app's signed upload URL)
    timeline: bool = False           # also return evenly spaced frames (pacing check)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze")
async def analyze(body: AnalyzeBody, authorization: str | None = Header(default=None)):
    check_token(authorization)
    if not body.link and not body.video_url:
        raise HTTPException(status_code=400, detail="send a link or a video_url")
    workdir = Path(tempfile.mkdtemp(prefix="lab-"))
    try:
        meta: dict = {}
        if body.link:
            video, meta = fetch_link(body.link, workdir)
        else:
            video = workdir / "src.mp4"
            await fetch_direct(str(body.video_url), video)
        duration = duration_of(video)
        if duration > MAX_SECONDS:
            raise HTTPException(status_code=400, detail=f"video longer than {MAX_SECONDS} s")
        bounds = scene_cuts(video, duration)
        scenes = []
        for i, (start, end) in enumerate(zip(bounds, bounds[1:])):
            mid = start + (end - start) / 2
            scenes.append({"n": i + 1, "start": round(start, 2), "end": round(end, 2),
                           "frame": frame_b64(video, mid, workdir / f"f{i}.jpg")})
        timeline = []
        if body.timeline:
            count = min(16, max(4, int(duration)))
            for i in range(count):
                t = duration * (i + 0.5) / count
                timeline.append({"t": round(t, 2), "frame": frame_b64(video, t, workdir / f"t{i}.jpg")})
        transcript = await asyncio.to_thread(transcribe, video, workdir)
        music = await recognise_music(video, workdir)
        return {"duration": round(duration, 2), "meta": meta, "scenes": scenes, "timeline": timeline,
                "transcript": transcript, "music": music}
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


class CleanBody(BaseModel):
    video_url: HttpUrl        # signed URL of the user's own upload
    upload_url: HttpUrl       # signed URL the cleaned file is PUT to
    confirm_rights: bool      # the user owns the video or has a licence to edit it
    mirror: bool = False
    boxes: list[dict] = []    # areas to blur out, as fractions of the frame: {x, y, w, h}


@app.post("/clean")
async def clean(body: CleanBody, authorization: str | None = Header(default=None)):
    """Mirror and/or blur text areas on the user's OWN video. Links are not accepted here on purpose."""
    check_token(authorization)
    if not body.confirm_rights:
        raise HTTPException(status_code=400, detail="only for videos you own or are licensed to edit")
    workdir = Path(tempfile.mkdtemp(prefix="clean-"))
    try:
        src = workdir / "src.mp4"
        await fetch_direct(str(body.video_url), src)
        duration_of(src)
        size = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                    "-of", "csv=p=0", str(src)]).stdout.strip().split(",")
        width, height = int(size[0]), int(size[1])
        # Boxes are drawn on the original frame, so blur first and mirror last.
        filters = []
        for b in body.boxes[:6]:
            x, y, w, h = (max(0.0, min(1.0, float(b.get(k, 0)))) for k in ("x", "y", "w", "h"))
            px, py = max(1, int(width * x)), max(1, int(height * y))
            pw, ph = min(int(width * w), width - px - 1), min(int(height * h), height - py - 1)
            if pw >= 4 and ph >= 4:
                filters.append(f"delogo=x={px}:y={py}:w={pw}:h={ph}")
        if body.mirror:
            filters.append("hflip")
        out = workdir / "clean.mp4"
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(src)]
        if filters:
            cmd += ["-vf", ",".join(filters)]
        cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-c:a", "copy", "-movflags", "+faststart", str(out)]
        res = run(cmd, timeout=300)
        if res.returncode != 0 or not out.exists():
            raise HTTPException(status_code=500, detail="processing failed")
        async with httpx.AsyncClient(timeout=300) as client:
            put = await client.put(str(body.upload_url), content=out.read_bytes(),
                                   headers={"Content-Type": "video/mp4"})
        if put.status_code >= 300:
            raise HTTPException(status_code=502, detail="upload of the result failed")
        return {"ok": True}
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
