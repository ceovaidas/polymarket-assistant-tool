"""Clipwright render: trims generated clips, joins them into one 9:16 video and burns in timed on-screen text.

Text style matches TikTok/Reels captions: bold white letters with a black outline, emoji in colour.

    python3 render.py spec.json

spec.json:
{
  "out": "final.mp4",
  "width": 1080, "height": 1920, "fps": 30,
  "font": "fonts/TikTokSans.ttf",          # bold sans; a variable font is set to weight 900
  "emoji_font": "fonts/NotoColorEmoji.ttf", # any colour-emoji font file you are licensed to use
  "clips": [{"src": "shot1.mp4", "in": 0.0, "out": 3.0}, ...],
  "texts": [{"start": 0, "end": 5, "text": "DON'T show this to a Texas cat dad 😂", "top": 0.16, "size": 72}],
            # `top`: top edge of the caption as a fraction of the height (or `y`: its centre); or a ready-made "png"
  "audio": {"src": "music.mp3", "start": 90.5, "volume": 1.0, "clip_volume": 0.15},  # optional, from `start` s
  "clip_volume": 0,                                                    # optional, without `audio`: 0 mutes clips
  "transition": 0.35                                 # optional default dissolve, s; a clip's own "transition" wins
}
`y` is the vertical centre of the text block as a fraction of the height (keep 0.12-0.30: top third, away
from the app buttons). Clip sound is kept unless `audio` is given, then it is mixed under the music, which
fades out over the last second. Only use music you may publish (public domain or a licence that allows it).
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

EMOJI_RE = re.compile(
    "(?:[\U0001F1E6-\U0001F1FF]{2})"                                     # flags
    "|(?:[#*0-9]\uFE0F?\u20E3)"                                           # keycaps
    "|(?:[\u2600-\u27BF\U0001F000-\U0001FAFF]"                            # pictographs
    "[\uFE0F\U0001F3FB-\U0001F3FF]*"                                       # variation selector, skin tone
    "(?:\u200D[\u2600-\u27BF\U0001F000-\U0001FAFF][\uFE0F\U0001F3FB-\U0001F3FF]*)*)"  # ZWJ sequences
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
        values = [900 if a.get("name") in (b"Weight", "Weight") else a.get("default", a["minimum"]) for a in axes]
        font.set_variation_by_axes(values)
    except Exception:
        pass
    return font


class Emoji:
    """Colour emoji are bitmap fonts with fixed sizes (Noto: 109 px); render big and scale down."""

    # Bitmap (CBDT) colour fonts render in Pillow; COLRv1 builds come out blank, so prefer the system copy.
    CANDIDATES = ["/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf", "/usr/share/fonts/noto/NotoColorEmoji.ttf"]

    def __init__(self, path: str):
        self.font = None
        for candidate in [path, *self.CANDIDATES]:
            for size in (109, 137, 160, 96, 64):
                try:
                    font = ImageFont.truetype(candidate, size)
                    probe = Image.new("RGBA", (size * 2, size * 2))
                    ImageDraw.Draw(probe).text((10, 10), "\U0001F602", font=font, embedded_color=True)
                    if probe.getbbox():
                        self.font, self.native = font, size
                        return
                except (OSError, ValueError):
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
    """Caption PNG in the studio preview's layout: heavy white letters, thick black outline, balanced lines.

    Words wrap to at most 84% of the frame width; a run of emoji stays glued to the word before it so it is
    never alone on a line; lines are balanced to the narrowest width that needs the same number of lines.
    """
    max_w = width * 0.84

    def parts(chunk: str) -> list[tuple[str, str]]:
        """Letters and emoji of one word or line as ("t", text) / ("e", emoji) runs."""
        out, pos = [], 0
        for m in EMOJI_RE.finditer(chunk):
            if m.start() > pos:
                out.append(("t", chunk[pos:m.start()]))
            out.append(("e", m.group()))
            pos = m.end()
        if pos < len(chunk):
            out.append(("t", chunk[pos:]))
        return out

    def units(line: str) -> list[str]:
        out: list[str] = []
        for w in line.split():
            if out and all(k == "e" for k, _ in parts(w)):
                out[-1] += " " + w
            else:
                out.append(w)
        return out

    def wrap(us: list[str], limit: float) -> list[str]:
        lines: list[str] = []
        for u in us:
            if lines and line_w(f"{lines[-1]} {u}") <= limit:
                lines[-1] += " " + u
            else:
                lines.append(u)
        return lines

    while True:
        font = load_font(font_path, size)
        emoji_h = round(size * 0.98)
        line_w = lambda line: sum(font.getlength(v) if k == "t" else emoji_h * 1.08 for k, v in parts(line))
        paras = [units(raw) for raw in text.split("\n")]
        widest = max([line_w(u) for us in paras for u in us] or [0])
        if widest <= max_w or size <= 34:
            break
        size -= 4
    lines: list[str] = []
    for us in paras:
        n = len(wrap(us, max_w))
        lo, hi = widest, max_w
        for _ in range(12 if n > 1 else 0):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if len(wrap(us, mid)) > n else (lo, mid)
        lines += wrap(us, hi if n > 1 else max_w)

    stroke = max(3, round(size * 0.085))
    line_h = round(size * 1.16)
    pad = stroke + 8
    widths = [line_w(l) for l in lines]
    img = Image.new("RGBA", (int(max(widths)) + 2 * pad, line_h * len(lines) + 2 * pad), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for outline in (True, False):  # every outline first, so it never covers a neighbouring letter
        for i, line in enumerate(lines):
            x = (img.width - widths[i]) / 2
            base = pad + i * line_h + size * 0.92
            for kind, value in parts(line):
                if kind == "t":
                    if outline:
                        draw.text((x, base), value, font=font, anchor="ls", fill="black",
                                  stroke_width=stroke, stroke_fill="black")
                    else:
                        draw.text((x, base), value, font=font, anchor="ls", fill="white")
                    x += font.getlength(value)
                else:
                    em = None if outline else emoji.image(value, emoji_h)
                    if em:
                        img.alpha_composite(em, (round(x + emoji_h * 0.04), round(base - size * 0.82)))
                    x += emoji_h * 1.08
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
    joined = work / "joined.mp4"
    # Transition into the next shot: per clip `transition` or the spec default. 0 is a hard cut, done as a blend a
    # bit over one frame long (xfade drops the rest of the video when the duration rounds below one frame).
    cut = 1.2 / fps
    fades = [max(float(c.get("transition", spec.get("transition", 0))), cut) for c in spec["clips"][:-1]]
    if len(segs) > 1 and any(f > cut for f in fades):
        durs = [float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                      str(s)], capture_output=True, text=True).stdout.strip()) for s in segs]
        inputs, vchain, achain, v, a, t = [], [], [], "0:v", "0:a", 0.0
        for s in segs:
            inputs += ["-i", str(s)]
        for i in range(1, len(segs)):
            fade = fades[i - 1]
            t += durs[i - 1] - fade
            vchain.append(f"[{v}][{i}:v]xfade=transition=fade:duration={fade:.3f}:offset={t:.3f}[v{i}]")
            achain.append(f"[{a}][{i}:a]acrossfade=d={fade:.3f}[a{i}]")
            v, a = f"v{i}", f"a{i}"
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(vchain + achain),
             "-map", f"[{v}]", "-map", f"[{a}]", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "48000", "-ac", "2", str(joined)])
    else:
        listing = work / "list.txt"
        listing.write_text("".join(f"file '{s}'\n" for s in segs))
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
             "-c", "copy", str(joined)])

    emoji = Emoji(str(base / spec.get("emoji_font", "fonts/NotoColorEmoji.ttf")))
    inputs, chain, last = ["-i", str(joined)], [], "0:v"
    for i, t in enumerate(spec.get("texts", [])):
        if t.get("png"):  # caption drawn elsewhere (the studio draws it in the browser at 1080 px width)
            png = base / t["png"]
            w, h = Image.open(png).size
        else:
            png = work / f"text{i}.png"
            w, h = text_png(t["text"], W, int(t.get("size", 64)), str(base / spec["font"]), emoji, png)
        inputs += ["-i", str(png)]
        x = (W - w) // 2
        y = round(H * float(t["top"])) if "top" in t else round(H * float(t.get("y", 0.18)) - h / 2)
        out = f"v{i}"
        chain.append(f"[{last}][{i + 1}:v]overlay={x}:{y}:enable='between(t,{float(t['start']):.3f},{float(t['end']):.3f})'[{out}]")
        last = out
    audio = spec.get("audio")
    if audio:
        # Music from `start` s, 1 s fade-out at the end of the video, clip sound mixed underneath.
        total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                                      str(joined)], capture_output=True, text=True).stdout.strip())
        inputs += ["-ss", f"{float(audio.get('start', 0)):.2f}", "-i", str(base / audio["src"])]
        a = len(spec.get("texts", [])) + 1
        fade = max(0.0, total - 1.0)
        chain.append(f"[0:a]volume={audio.get('clip_volume', 0.15)}[ca];"
                     f"[{a}:a]volume={audio.get('volume', 1.0)},afade=t=in:d=0.05,afade=t=out:st={fade:.2f}:d=1[ma];"
                     f"[ca][ma]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,apad,atrim=0:{total:.3f}[aout]")
    elif "clip_volume" in spec:  # no music file: keep, lower or mute the clip sound (music is added in the app)
        chain.append(f"[0:a]volume={float(spec['clip_volume'])}[aout]")
        audio = True
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
