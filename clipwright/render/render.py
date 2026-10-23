"""Clipwright render: trims generated clips, joins them into one 9:16 video and burns in timed on-screen text.

Text style matches TikTok/Reels captions: bold white letters with a black outline, emoji in colour.

    python3 render.py spec.json

spec.json:
{
  "out": "final.mp4",
  "width": 1080, "height": 1920, "fps": 30,
  "font": "fonts/TikTokSans.ttf",          # bold sans; a variable font is set to weight 800
  "emoji_font": "fonts/NotoColorEmoji.ttf", # any colour-emoji font file you are licensed to use
  "clips": [{"src": "shot1.mp4", "in": 0.0, "out": 3.0}, ...],
  "texts": [{"start": 0, "end": 5, "text": "DON'T show this to\\na Texas cat dad 😂😂😂", "y": 0.17, "size": 66}],
  "audio": {"src": "music.mp3", "volume": 1.0, "clip_volume": 0.15}   # optional
}
`y` is the vertical centre of the text block as a fraction of the height (keep 0.12-0.30: top third, away
from the app buttons). Clip sound is kept unless `audio` is given, then it is mixed under the music.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

EMOJI_RE = re.compile(
    "(?:[\U0001F1E6-\U0001F1FF]{2})"                     # flags
    "|(?:[#*0-9]️?⃣)"                            # keycaps
    "|(?:[☀-➿\U0001F000-\U0001FAFF]"             # pictographs
    "[️\U0001F3FB-\U0001F3FF]*"                       # variation selector, skin tone
    "(?:‍[☀-➿\U0001F000-\U0001FAFF][️\U0001F3FB-\U0001F3FF]*)*)"  # ZWJ sequences
)


def run(cmd: list[str]) -> None:
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"{cmd[0]} failed: {res.stderr[-800:]}")


def has_audio(src: str) -> bool:
    res = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                          "-of", "csv=p=0", src], capture_output=True, text=True)
    return bool(res.stdout.strip())


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    font = ImageFont.truetype(path, size)
    try:  # variable fonts: heavy weight like the in-app caption style
        axes = font.get_variation_axes()
        values = [800 if a.get("name") in (b"Weight", "Weight") else a.get("default", a["minimum"]) for a in axes]
        font.set_variation_by_axes(values)
    except Exception:
        pass
    return font


class Emoji:
    """Colour emoji are bitmap fonts with fixed sizes (Noto: 109 px); render big and scale down."""

    def __init__(self, path: str):
        self.font = None
        for size in (109, 137, 160, 96, 64):
            try:
                self.font = ImageFont.truetype(path, size)
                self.native = size
                break
            except OSError:
                continue

    def image(self, char: str, height: int) -> Image.Image | None:
        if not self.font:
            return None
        side = self.native * 2
        img = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        ImageDraw.Draw(img).text((side // 4, side // 4), char, font=self.font, embedded_color=True)
        box = img.getbbox()
        if not box:
            return None
        img = img.crop(box)
        scale = height / img.height
        return img.resize((max(1, round(img.width * scale)), height), Image.LANCZOS)


def text_png(text: str, width: int, size: int, font_path: str, emoji: Emoji, dest: Path) -> tuple[int, int]:
    font = load_font(font_path, size)
    stroke = max(3, round(size * 0.11))
    line_h = round(size * 1.18)
    emoji_h = round(size * 1.0)
    space = font.getlength(" ")
    lines = []
    for raw in text.split("\n"):
        parts, pos = [], 0
        for m in EMOJI_RE.finditer(raw):
            if m.start() > pos:
                parts.append(("t", raw[pos:m.start()]))
            parts.append(("e", m.group()))
            pos = m.end()
        if pos < len(raw):
            parts.append(("t", raw[pos:]))
        lines.append(parts)

    def measure(parts):
        return sum(font.getlength(v) if k == "t" else emoji_h * 1.04 for k, v in parts)

    canvas_w = min(width - 2 * round(width * 0.06), max(int(max(measure(p) for p in lines)) + 2 * stroke + 8, 10))
    img = Image.new("RGBA", (canvas_w, line_h * len(lines) + 2 * stroke + 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for i, parts in enumerate(lines):
        x = (canvas_w - measure(parts)) / 2
        y = stroke + 4 + i * line_h
        for kind, value in parts:
            if kind == "t":
                draw.text((x, y), value, font=font, fill="white", stroke_width=stroke, stroke_fill="black")
                x += font.getlength(value)
            else:
                em = emoji.image(value, emoji_h)
                if em:
                    img.alpha_composite(em, (round(x), round(y + (line_h - emoji_h) / 2 - size * 0.06)))
                    x += emoji_h * 1.04
                else:
                    x += space
    img.save(dest)
    return img.size


def render(spec: dict, base: Path) -> Path:
    W, H, fps = spec.get("width", 1080), spec.get("height", 1920), spec.get("fps", 30)
    work = Path(tempfile.mkdtemp(prefix="render-"))
    segs = []
    for i, c in enumerate(spec["clips"]):
        src = str(base / c["src"])
        seg = work / f"seg{i}.mp4"
        start, end = float(c.get("in", 0)), c.get("out")
        cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{start:.3f}"]
        if end is not None:
            cmd += ["-t", f"{float(end) - start:.3f}"]
        cmd += ["-i", src]
        if not has_audio(src):
            cmd += ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
        cmd += ["-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={fps},setsar=1",
                "-map", "0:v:0", "-map", "0:a:0" if has_audio(src) else "1:a:0", "-shortest",
                "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-ar", "48000", "-ac", "2", str(seg)]
        run(cmd)
        segs.append(seg)
    listing = work / "list.txt"
    listing.write_text("".join(f"file '{s}'\n" for s in segs))
    joined = work / "joined.mp4"
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
         "-c", "copy", str(joined)])

    emoji = Emoji(str(base / spec.get("emoji_font", "fonts/NotoColorEmoji.ttf")))
    inputs, chain, last = ["-i", str(joined)], [], "0:v"
    for i, t in enumerate(spec.get("texts", [])):
        png = work / f"text{i}.png"
        w, h = text_png(t["text"], W, int(t.get("size", 64)), str(base / spec["font"]), emoji, png)
        inputs += ["-i", str(png)]
        x, y = (W - w) // 2, round(H * float(t.get("y", 0.18)) - h / 2)
        out = f"v{i}"
        chain.append(f"[{last}][{i + 1}:v]overlay={x}:{y}:enable='between(t,{float(t['start']):.3f},{float(t['end']):.3f})'[{out}]")
        last = out
    audio = spec.get("audio")
    if audio:
        inputs += ["-i", str(base / audio["src"])]
        a = len(spec.get("texts", [])) + 1
        chain.append(f"[0:a]volume={audio.get('clip_volume', 0.15)}[ca];[{a}:a]volume={audio.get('volume', 1.0)}[ma];"
                     f"[ca][ma]amix=inputs=2:duration=first:dropout_transition=0[aout]")
    out_path = base / spec.get("out", "final.mp4")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs]
    if chain:
        cmd += ["-filter_complex", ";".join(chain)]
    cmd += ["-map", f"[{last}]" if chain and last != "0:v" else "0:v",
            "-map", "[aout]" if audio else "0:a",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out_path)]
    run(cmd)
    return out_path


if __name__ == "__main__":
    spec_path = Path(sys.argv[1]).resolve()
    print(render(json.loads(spec_path.read_text()), spec_path.parent))
