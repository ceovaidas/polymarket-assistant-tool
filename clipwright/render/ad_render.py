"""Clipwright ad render: a voiced product ad in the style of short business ads (dark brand background, accent colour,
animated cards, word-by-word captions, real product packshot, end card).

    python3 ad_render.py spec.json

spec.json:
{
  "out": "final.mp4", "width": 1080, "height": 1920, "fps": 30,
  "font": "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf",
  "bg": "#0B1F3A", "accent": "#F5B700", "brand": "FJØRD",
  "product": "product.png",                 # real packshot; a white background is cut out automatically
  "vo": "vo.mp3", "vo_text": "Apversk savo žuvų taukus. ...",   # display words for the captions
  "shots": [                                # in order; each shot lasts while its words are spoken
    {"kind": "clip", "src": "s1.mp4", "words": 8, "card": {"type": "headline", "top": "APVERSK SAVO", "accent": "ŽUVŲ TAUKUS"}},
    {"kind": "product", "src": "s2.png", "words": 6, "card": {"type": "number", "value": "700", "unit": "mg", "label": "OMEGA-3 · 1 KAPSULĖJE"}},
    {"kind": "still", "src": "s3.png", "words": 7, "card": {"type": "pills", "items": ["IFOS žaliava", "Laukinės žuvys"], "stars": true}},
    {"kind": "clip", "src": "s4.mp4", "words": 7, "card": {"type": "checks", "items": ["350 mg EPR", "250 mg DHR"]}, "footnote": true},
    {"kind": "product", "src": "s2.png", "words": 2, "card": {"type": "end", "title": "FJØRD STRONG", "accent": "OMEGA-3", "cta": "Eurovaistine.lt"}}
  ],
  "footnote": "*Teigiamas poveikis vartojant 250 mg EPR ir DHR per parą.", "small": "Maisto papildas.",
  "music": {"src": "music.mp3", "start": 0, "volume": 0.12},   # optional bed under the voice
  "tail": 0.9                                # seconds the end card stays after the last word
}
Card types: headline {top, accent}, number {value, unit, label} (counts up), pills {items, stars}, checks {items},
end {title, accent, cta, note}. Shot kinds: clip (video file), still (image, slow push-in), product (backdrop image with
the packshot placed on it). Word timings come from faster-whisper; caption words are spread over them in order.
"""
import json
import math
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"{cmd[0]} failed: {r.stderr[-1500:]}")
    return r.stdout


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]).strip())


def word_times(vo):
    from faster_whisper import WhisperModel
    segs, _ = WhisperModel("small", compute_type="int8").transcribe(str(vo), language="lt", word_timestamps=True)
    return [(w.start, w.end) for s in segs for w in s.words]


def cutout(src, dst):
    """White-background packshots get a transparent background; anything else is kept as a rounded card."""
    im = Image.open(src).convert("RGB")
    corners = [im.getpixel(p) for p in ((1, 1), (im.width - 2, 1), (1, im.height - 2), (im.width - 2, im.height - 2))]
    if all(min(c) > 235 for c in corners):
        cmd = ["convert", str(src), "-alpha", "set", "-fuzz", "4%", "-fill", "none"]
        for x, y in ((0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)):
            cmd += ["-draw", f"color {x},{y} floodfill"]
        run(cmd + ["-trim", "+repage", str(dst)])
    else:
        r = max(12, im.width // 18)
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=r, fill=255)
        out = im.convert("RGBA"); out.putalpha(mask); out.save(dst)


class Ad:
    def __init__(self, spec, base):
        self.s, self.base = spec, base
        self.W, self.H, self.fps = spec.get("width", 1080), spec.get("height", 1920), spec.get("fps", 30)
        self.BG, self.ACC, self.WHITE = rgb(spec.get("bg", "#0B1F3A")), rgb(spec.get("accent", "#F5B700")), (255, 255, 255)
        self.fontp = spec.get("font", "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf")
        self.work = base / "ad_work"; self.work.mkdir(exist_ok=True)

    def font(self, px):
        return ImageFont.truetype(self.fontp, px)

    def p(self, name):
        return self.base / name

    # ---------- timing ----------
    def timeline(self):
        ws = word_times(self.p(self.s["vo"]))
        toks = self.s.get("vo_text", "").split() or ["…"] * len(ws)
        nw, nt = len(ws), len(toks)
        at = lambda i: ws[min(nw - 1, int(i * nw / nt))]
        self.caps = [(toks[i], at(i)[0], at(i)[1]) for i in range(nt)]
        shots, k, starts = self.s["shots"], 0, []
        for sh in shots:
            starts.append(0.0 if not starts else max(starts[-1] + 0.8, self.caps[min(k, nt - 1)][1] - 0.12))
            k += int(sh.get("words", 0))
        self.total = self.caps[-1][2] + float(self.s.get("tail", 0.9))
        self.spans = [(starts[i], starts[i + 1] if i + 1 < len(starts) else self.total) for i in range(len(shots))]

    # ---------- backgrounds ----------
    def frame_still(self, src):
        bg = Image.open(self.p(src)).convert("RGB")
        k = max(self.W / bg.width, self.H / bg.height)
        bg = bg.resize((math.ceil(bg.width * k), math.ceil(bg.height * k)), Image.LANCZOS)
        return bg.crop(((bg.width - self.W) // 2, (bg.height - self.H) // 2, (bg.width - self.W) // 2 + self.W, (bg.height - self.H) // 2 + self.H)).convert("RGBA")

    def with_product(self, src, end):
        bg = self.frame_still(src)
        prod = Image.open(self.work / "product.png").convert("RGBA")
        scale = 0.80 if end else 0.70
        w = int(self.W * scale); h = int(w * prod.height / prod.width)
        if h > self.H * 0.42:
            h = int(self.H * 0.42); w = int(h * prod.width / prod.height)
        prod = prod.resize((w, h), Image.LANCZOS)
        x, y = (self.W - w) // 2, int(self.H * (0.80 if end else 0.79)) - h
        fx = Image.new("RGBA", bg.size, (0, 0, 0, 0)); d = ImageDraw.Draw(fx)
        d.ellipse((x - 120, y - 80, x + w + 120, y + h + 60), fill=self.ACC + (55,))
        bg = Image.alpha_composite(bg, fx.filter(ImageFilter.GaussianBlur(90)))
        sh = Image.new("RGBA", bg.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((x - 50, y + h - 60, x + w + 50, y + h + 40), fill=(0, 0, 0, 170))
        bg = Image.alpha_composite(bg, sh.filter(ImageFilter.GaussianBlur(28)))
        bg.alpha_composite(prod, (x, y))
        return bg

    def segment(self, i, sh, dur):
        out = self.work / f"seg{i}.mp4"
        vf_fit = f"scale={self.W}:{self.H}:force_original_aspect_ratio=increase,crop={self.W}:{self.H},fps={self.fps},setsar=1"
        if sh["kind"] == "clip":
            src = self.p(sh["src"]); start = float(sh.get("in", 0.2))
            have = duration(src) - start
            vf = vf_fit + (f",tpad=stop_mode=clone:stop_duration={dur - have + 0.1:.2f}" if dur > have else "")
            run(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.2f}", "-i", str(src), "-an", "-t", f"{dur:.3f}", "-vf", vf,
                 "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", str(out)])
        else:
            img = self.with_product(sh["src"], sh.get("card", {}).get("type") == "end") if sh["kind"] == "product" else self.frame_still(sh["src"])
            still = self.work / f"still{i}.jpg"; img.convert("RGB").save(still, quality=94)
            n = max(1, int(dur * self.fps))
            run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", str(still), "-t", f"{dur:.3f}", "-vf",
                 f"scale={self.W * 2}:{self.H * 2},zoompan=z='1+0.05*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={self.W}x{self.H}:fps={self.fps},setsar=1",
                 "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", str(out)])
        return out

    # ---------- graphics ----------
    def canvas(self):
        return Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))

    def text_block(self, lines, y, img=None):
        """lines: [(text, px, colour)] centred from y, with a soft shadow; long lines shrink to fit."""
        img = img or self.canvas()
        sh = self.canvas(); d, ds = ImageDraw.Draw(img), ImageDraw.Draw(sh)
        for t, px, col in lines:
            f = self.font(px)
            while f.getlength(t) > self.W * 0.88 and px > 30:
                px -= 4; f = self.font(px)
            w = f.getlength(t)
            ds.text(((self.W - w) / 2 + 4, y + 6), t, font=f, fill=(0, 0, 0, 200))
            d.text(((self.W - w) / 2, y), t, font=f, fill=col)
            y += int(px * 1.12)
        return Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)), img), y

    def star(self, d, cx, cy, r, col):
        pts = [(cx + (r if k % 2 == 0 else r * 0.45) * math.sin(k * math.pi / 5), cy - (r if k % 2 == 0 else r * 0.45) * math.cos(k * math.pi / 5)) for k in range(10)]
        d.polygon(pts, fill=col)

    def pill(self, text, y, px=50, stars=0, check=False, fill=None, fg=None):
        f = self.font(px); fill = fill or self.BG + (235,); fg = fg or self.WHITE
        icon = stars * int(px * 0.95) + (int(px * 1.1) if check else 0)
        w, h = int(f.getlength(text)) + icon + 90 + (20 if icon else 0), int(px * 1.9)
        img = self.canvas(); d = ImageDraw.Draw(img); x0 = (self.W - w) // 2
        d.rounded_rectangle((x0, y, x0 + w, y + h), radius=h // 2, fill=fill, outline=self.ACC, width=4)
        x = x0 + 45
        for _ in range(stars):
            self.star(d, x + px * 0.42, y + h / 2, px * 0.42, self.ACC); x += int(px * 0.95)
        if check:
            r = px * 0.45; d.ellipse((x, y + h / 2 - r, x + 2 * r, y + h / 2 + r), fill=self.ACC)
            d.line((x + r * 0.5, y + h / 2, x + r * 0.9, y + h / 2 + r * 0.4, x + r * 1.5, y + h / 2 - r * 0.45), fill=self.BG, width=max(3, px // 10))
            x += int(px * 1.1)
        if icon: x += 20
        d.text((x, y + h / 2), text, font=f, fill=fg, anchor="lm")
        return img, y + h

    def overlays(self, i, card, s, e):
        """Returns [(png, start, end, animate)] for one shot's card."""
        t = card.get("type"); out = []; Y = self.H * 0.085
        name = lambda k: str(self.work / f"c{i}_{k}.png")
        if t == "headline":
            img, _ = self.text_block([(card.get("top", ""), 104, self.WHITE), (card.get("accent", ""), 124, self.ACC)], Y)
            img.save(name("h")); out.append((name("h"), s + 0.15, e, True))
        elif t == "number":
            m = re.match(r"([\d.,]+)", str(card.get("value", "")))
            target = float(m.group(1).replace(",", ".")) if m else None
            steps = 12 if target else 1
            for k in range(steps):
                v = card.get("value", "") if k == steps - 1 or not target else f"{round(target * (k + 1) / steps):g}"
                img, y = self.text_block([(f"{v} {card.get('unit', '')}".strip(), 210, self.ACC)], Y)
                img, _ = self.text_block([(card.get("label", ""), 62, self.WHITE)], y, img)
                img.save(name(f"n{k}"))
                a = s + 0.2 + k * 0.05
                out.append((name(f"n{k}"), a, e if k == steps - 1 else a + 0.05, k == 0))
        elif t in ("pills", "checks"):
            y = Y + 20
            for k, item in enumerate(card.get("items", [])[:4]):
                img, y2 = self.pill(item, int(y), stars=5 if (t == "pills" and card.get("stars") and k == 0) else 0, check=t == "checks")
                img.save(name(f"p{k}")); out.append((name(f"p{k}"), s + 0.15 + k * 0.35, e, True)); y = y2 + 22
        elif t == "end":
            img, y = self.text_block([(card.get("title", ""), 112, self.WHITE), (card.get("accent", ""), 112, self.ACC)], Y)
            if card.get("cta"):
                p, y = self.pill(card["cta"], int(y + 20), px=58, fill=self.ACC + (255,), fg=self.BG)
                img = Image.alpha_composite(img, p)
            if card.get("note"):
                img, _ = self.text_block([(card["note"], 44, self.WHITE)], y + 16, img)
            img.save(name("e")); out.append((name("e"), s + 0.1, e, True))
        return out

    def brand_tag(self):
        if not self.s.get("brand"):
            return None
        f = self.font(34); t = self.s["brand"]; w = int(f.getlength(t)) + 44
        img = self.canvas(); d = ImageDraw.Draw(img)
        d.rounded_rectangle((40, 70, 40 + w, 70 + 62), radius=31, fill=self.BG + (220,), outline=self.ACC, width=3)
        d.text((40 + w / 2, 70 + 31), t, font=f, fill=self.WHITE, anchor="mm")
        path = str(self.work / "brand.png"); img.save(path); return path

    def small_line(self, text, key):
        f = self.font(26); img = self.canvas(); d = ImageDraw.Draw(img)
        d.multiline_text((self.W / 2, self.H * 0.952), text, font=f, fill=(255, 255, 255, 215), anchor="mm", align="center", spacing=8)
        path = str(self.work / f"small_{key}.png"); img.save(path); return path

    def gradient(self):
        img = self.canvas(); d = ImageDraw.Draw(img); top, bot = int(self.H * 0.42), int(self.H * 0.66)
        for y in range(top):
            d.line((0, y, self.W, y), fill=(4, 12, 26, int(170 * (1 - y / top) ** 1.4)))
        for y in range(bot, self.H):
            d.line((0, y, self.W, y), fill=(4, 12, 26, int(160 * ((y - bot) / (self.H - bot)) ** 1.5)))
        path = str(self.work / "grad.png"); img.save(path); return path

    def captions(self):
        """One PNG per spoken word: the sentence on screen, the current word in the accent colour."""
        f = self.font(60); out = []; phrase = []
        sentences, cur = [], []
        for c in self.caps:
            cur.append(c)
            if c[0][-1] in ".?!": sentences.append(cur); cur = []
        if cur: sentences.append(cur)
        for ph in sentences:
            toks = [c[0] for c in ph]; lines, line = [], []
            for k in range(len(toks)):
                if line and f.getlength(" ".join(toks[j] for j in line + [k])) > self.W * 0.84: lines.append(line); line = []
                line.append(k)
            lines.append(line)
            for k, c in enumerate(ph):
                img = self.canvas(); d = ImageDraw.Draw(img); y = self.H * 0.79
                for ln in lines:
                    x = (self.W - f.getlength(" ".join(toks[j] for j in ln))) / 2
                    for j in ln:
                        d.text((x, y), toks[j], font=f, fill=self.ACC if j == k else self.WHITE, stroke_width=6, stroke_fill=(0, 0, 0))
                        x += f.getlength(toks[j] + " ")
                    y += 76
                path = str(self.work / f"cap{len(out)}.png"); img.save(path)
                end = ph[k + 1][1] if k + 1 < len(ph) else c[2] + 0.25
                out.append((path, c[1], min(end, self.total)))
        return out

    # ---------- compose ----------
    def render(self):
        cutout(self.p(self.s["product"]), self.work / "product.png")
        self.timeline()
        segs = [self.segment(i, sh, e - s) for i, (sh, (s, e)) in enumerate(zip(self.s["shots"], self.spans))]
        (self.work / "list.txt").write_text("".join(f"file '{p}'\n" for p in segs))
        base = self.work / "base.mp4"
        run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(self.work / "list.txt"), "-c", "copy", str(base)])
        T = self.total
        ov = [(self.gradient(), 0, T, False)]
        brand = self.brand_tag()
        for i, (sh, (s, e)) in enumerate(zip(self.s["shots"], self.spans)):
            card = sh.get("card") or {}
            if brand and card.get("type") != "end": ov.append((brand, s, e, False))
            ov += self.overlays(i, card, s, e)
            if sh.get("footnote") and self.s.get("footnote"): ov.append((self.small_line(self.s["footnote"], i), s, e, False))
            elif card.get("type") == "end" and self.s.get("small"): ov.append((self.small_line(self.s["small"], i), s, e, False))
        ov += [(p, a, b, False) for p, a, b in self.captions()]
        inputs, chain, last = ["-i", str(base), "-i", str(self.p(self.s["vo"]))], [], "0:v"
        n = 2
        for path, a, b, anim in ov:
            if anim:
                inputs += ["-loop", "1", "-framerate", str(self.fps), "-t", f"{T:.2f}", "-i", path]
                chain.append(f"[{n}:v]format=rgba,fade=t=in:st={a:.2f}:d=0.25:alpha=1[f{n}]")
                chain.append(f"[{last}][f{n}]overlay=x=0:y='40*max(0\\,1-(t-{a:.2f})/0.25)':enable='between(t,{a:.2f},{b:.2f})'[v{n}]")
            else:
                inputs += ["-i", path]
                chain.append(f"[{last}][{n}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[v{n}]")
            last = f"v{n}"; n += 1
        music = self.s.get("music")
        if music:
            inputs += ["-ss", f"{float(music.get('start', 0)):.2f}", "-i", str(self.p(music["src"]))]
            chain.append(f"[{n}:a]volume={float(music.get('volume', 0.12))},afade=t=out:st={T - 1:.2f}:d=1[m]")
            chain.append(f"[1:a]apad,atrim=0:{T:.2f}[v0a];[v0a][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,atrim=0:{T:.2f}[a]")
        else:
            chain.append(f"[1:a]apad,atrim=0:{T:.2f},afade=t=out:st={T - 0.3:.2f}:d=0.3[a]")
        out = self.p(self.s.get("out", "final.mp4"))
        run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(chain), "-map", f"[{last}]", "-map", "[a]",
             "-t", f"{T:.2f}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)])
        return out


if __name__ == "__main__":
    spec_path = Path(sys.argv[1]).resolve()
    print(Ad(json.loads(spec_path.read_text()), spec_path.parent).render())
