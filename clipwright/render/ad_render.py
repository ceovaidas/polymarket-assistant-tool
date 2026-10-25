"""Clipwright ad render: a voiced product ad in the style of premium short business ads (brand-colour graphics, serif
headlines, real product packshot and logo, animated cards, word-by-word captions, progress bar, end card).

    python3 ad_render.py spec.json

spec.json:
{
  "out": "final.mp4", "width": 1080, "height": 1920, "fps": 30,
  "fonts": {"head": "Playfair.ttf", "head_italic": "PlayfairItalic.ttf", "body": "Manrope.ttf"},   # optional
  "bg": "#1E2A14", "accent": "#D9A441", "brand": "ADUKO ŪKIS",
  "logo": "logo.png",                       # optional, transparent PNG; shown top-left and on the end card
  "product": "product.png",                 # real packshot; a white background is cut out automatically
  "vo": "vo.mp3",
  "shots": [                                # in order; each shot lasts while its words are spoken
    # vo: caption text for this shot (digits allowed); tts_words: how many words the voice says for it
    {"kind": "clip", "src": "s1.mp4", "vo": "Ar tavo aliejus tikrai tikras?", "tts_words": 5,
     "card": {"type": "headline", "kicker": "PIRMO ŠALTO SPAUDIMO", "top": "AR TAVO ALIEJUS", "accent": "tikrai tikras?"}},
    {"kind": "product", "src": "s2.png", "vo": "...", "tts_words": 8, "card": {"type": "checks", "items": ["...", "..."]}},
    {"kind": "still", "src": "s4.png", "vo": "...", "tts_words": 6, "card": {"type": "number", "value": "0,13", "unit": "%", "label": "RŪGŠTINGUMAS"}},
    {"kind": "clip", "src": "s3.mp4", "vo": "...", "tts_words": 8, "card": {"type": "pills", "items": ["...", "..."], "stars": false}},
    {"kind": "product", "src": "s2.png", "vo": "...", "tts_words": 4, "card": {"type": "end", "title": "ADUKO ŪKIS", "accent": "AOVE · 2 L", "cta": "adukoukis.lt", "note": "37,99 €"}}
  ],
  "footnote": "", "small": "",
  "music": {"src": "music.mp3", "start": 0, "volume": 0.18},   # optional bed, ducked under the voice
  "tail": 1.0
}
Card types: headline {kicker, top, accent}, number {value, unit, label} (counts up, decimals kept), pills {items, stars},
checks {items}, end {title, accent, cta, note}. Shot kinds: clip (video), still (image, slow push-in), product (backdrop
image with the packshot placed on it). Word timings come from faster-whisper.
"""
import json
import math
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

FALLBACK = "/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf"


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
    im = Image.open(src).convert("RGBA")
    if im.getextrema()[3][0] < 250:  # already transparent
        im.crop(im.getbbox()).save(dst); return
    rgbim = im.convert("RGB")
    corners = [rgbim.getpixel(p) for p in ((1, 1), (im.width - 2, 1), (1, im.height - 2), (im.width - 2, im.height - 2))]
    if all(min(c) > 235 for c in corners):
        cmd = ["convert", str(src), "-alpha", "set", "-fuzz", "4%", "-fill", "none"]
        for x, y in ((0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)):
            cmd += ["-draw", f"color {x},{y} floodfill"]
        run(cmd + ["-trim", "+repage", str(dst)])
    else:
        r = max(12, im.width // 18)
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=r, fill=255)
        im.putalpha(mask); im.save(dst)


class Ad:
    def __init__(self, spec, base):
        self.s, self.base = spec, base
        self.W, self.H, self.fps = spec.get("width", 1080), spec.get("height", 1920), spec.get("fps", 30)
        self.BG, self.ACC, self.WHITE = rgb(spec.get("bg", "#0B1F3A")), rgb(spec.get("accent", "#F5B700")), (255, 255, 255)
        f = spec.get("fonts") or {}
        self.fonts = {k: str(base / f[k]) if f.get(k) else FALLBACK for k in ("head", "head_italic", "body")}
        self.work = base / "ad_work"; self.work.mkdir(exist_ok=True)
        self._fc = {}

    def font(self, px, kind="body", weight=800):
        key = (px, kind, weight)
        if key not in self._fc:
            ft = ImageFont.truetype(self.fonts[kind], px)
            try:
                ft.set_variation_by_axes([max(a["minimum"], min(a["maximum"], weight)) if a.get("name") in (b"Weight", "Weight") else a.get("default", a["minimum"]) for a in ft.get_variation_axes()])
            except Exception:
                pass
            self._fc[key] = ft
        return self._fc[key]

    def p(self, name):
        return self.base / name

    # ---------- timing ----------
    def timeline(self):
        """Shot spans and caption word times. The voice reads numbers spelled out, so each shot's share of the spoken
        words is its `tts_words`; its caption words (`vo`, with digits) are spread over that share."""
        ws = word_times(self.p(self.s["vo"])); nw = len(ws)
        shots = self.s["shots"]
        disp = [str(sh.get("vo") or "").split() for sh in shots]
        tts = [int(sh.get("tts_words") or len(d) or 1) for sh, d in zip(shots, disp)]
        total_tts, cum, starts, self.caps = sum(tts), 0, [], []
        for d, t in zip(disp, tts):
            a = min(nw - 1, int(cum * nw / total_tts)); b = max(a + 1, min(nw, round((cum + t) * nw / total_tts)))
            starts.append(0.0 if not starts else max(starts[-1] + 0.8, ws[a][0] - 0.12))
            for j, tok in enumerate(d):
                w = ws[a + min(b - a - 1, int(j * (b - a) / len(d)))]
                self.caps.append((tok, w[0], w[1]))
            cum += t
        for j in range(len(self.caps) - 1):  # a word stays until the next one starts
            tok, s, e = self.caps[j]; self.caps[j] = (tok, s, max(e, min(self.caps[j + 1][1], s + 1.2)))
        self.total = ws[-1][1] + float(self.s.get("tail", 1.0))
        self.spans = [(starts[i], starts[i + 1] if i + 1 < len(starts) else self.total) for i in range(len(shots))]

    # ---------- backgrounds ----------
    def frame_still(self, src):
        bg = Image.open(self.p(src)).convert("RGB")
        k = max(self.W / bg.width, self.H / bg.height)
        bg = bg.resize((math.ceil(bg.width * k), math.ceil(bg.height * k)), Image.LANCZOS)
        x, y = (bg.width - self.W) // 2, (bg.height - self.H) // 2
        return bg.crop((x, y, x + self.W, y + self.H)).convert("RGBA")

    def with_product(self, src, end):
        bg = self.frame_still(src)
        prod = Image.open(self.work / "product.png").convert("RGBA")
        maxh = self.H * (0.38 if end else 0.50)
        h = int(maxh); w = int(h * prod.width / prod.height)
        if w > self.W * 0.8:
            w = int(self.W * 0.8); h = int(w * prod.height / prod.width)
        prod = prod.resize((w, h), Image.LANCZOS)
        x, y = (self.W - w) // 2, int(self.H * (0.84 if end else 0.82)) - h
        fx = Image.new("RGBA", bg.size, (0, 0, 0, 0)); d = ImageDraw.Draw(fx)
        d.ellipse((x - 160, y - 100, x + w + 160, y + h + 80), fill=self.ACC + (60,))
        bg = Image.alpha_composite(bg, fx.filter(ImageFilter.GaussianBlur(110)))
        sh = Image.new("RGBA", bg.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse((x - 30, y + h - 50, x + w + 30, y + h + 36), fill=(0, 0, 0, 190))
        bg = Image.alpha_composite(bg, sh.filter(ImageFilter.GaussianBlur(26)))
        bg.alpha_composite(prod, (x, y))
        return bg

    def segment(self, i, sh, dur):
        out = self.work / f"seg{i}.mp4"
        fit = f"scale={self.W}:{self.H}:force_original_aspect_ratio=increase,crop={self.W}:{self.H},setsar=1"
        punch = f"zoompan=z='max(1\\,1.07-0.17*it)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={self.W}x{self.H}:fps={self.fps}"
        grade = "eq=contrast=1.06:saturation=1.08,vignette=PI/5"
        if sh["kind"] == "clip":
            src = self.p(sh["src"]); start = float(sh.get("in", 0.2))
            have = duration(src) - start
            pad = f",tpad=stop_mode=clone:stop_duration={dur - have + 0.1:.2f}" if dur > have else ""
            run(["ffmpeg", "-y", "-v", "error", "-ss", f"{start:.2f}", "-i", str(src), "-an", "-t", f"{dur:.3f}",
                 "-vf", f"{fit},fps={self.fps}{pad},{punch},{grade}", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", str(out)])
        else:
            img = self.with_product(sh["src"], sh.get("card", {}).get("type") == "end") if sh["kind"] == "product" else self.frame_still(sh["src"])
            still = self.work / f"still{i}.jpg"; img.convert("RGB").save(still, quality=95)
            n = max(1, int(dur * self.fps))
            run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", str(still), "-t", f"{dur:.3f}", "-vf",
                 f"scale={self.W * 2}:{self.H * 2},zoompan=z='1.0+0.06*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={self.W}x{self.H}:fps={self.fps},setsar=1,{grade}",
                 "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", str(out)])
        return out

    # ---------- drawing helpers ----------
    def canvas(self):
        return Image.new("RGBA", (self.W, self.H), (0, 0, 0, 0))

    def fit(self, text, px, kind, weight, maxw):
        f = self.font(px, kind, weight)
        while f.getlength(text) > maxw and px > 28:
            px -= 4; f = self.font(px, kind, weight)
        return f, px

    def shadowed(self, draw_fn):
        img, sh = self.canvas(), self.canvas()
        draw_fn(ImageDraw.Draw(img), ImageDraw.Draw(sh))
        return Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)), img)

    def line(self, text, y, px, kind="head", weight=900, col=None, spacing=0):
        """One centred line on its own canvas (so lines can animate one after another)."""
        col = col or self.WHITE
        f, px = self.fit(text, px, kind, weight, self.W * 0.88)
        def draw(d, ds):
            if spacing:
                w = sum(f.getlength(ch) for ch in text) + spacing * (len(text) - 1); x = (self.W - w) / 2
                for ch in text:
                    ds.text((x + 3, y + 5), ch, font=f, fill=(0, 0, 0, 170)); d.text((x, y), ch, font=f, fill=col); x += f.getlength(ch) + spacing
            else:
                w = f.getlength(text)
                ds.text(((self.W - w) / 2 + 3, y + 6), text, font=f, fill=(0, 0, 0, 190)); d.text(((self.W - w) / 2, y), text, font=f, fill=col)
        return self.shadowed(draw), y + int(px * 1.08)

    def star(self, d, cx, cy, r, col):
        pts = [(cx + (r if k % 2 == 0 else r * 0.45) * math.sin(k * math.pi / 5), cy - (r if k % 2 == 0 else r * 0.45) * math.cos(k * math.pi / 5)) for k in range(10)]
        d.polygon(pts, fill=col)

    def chip(self, text, y, px=46, stars=0, check=False, solid=False):
        """Rounded glass chip: dark translucent panel, thin light border, accent icon."""
        f = self.font(px, "body", 800)
        icon = stars * int(px * 0.9) + (int(px * 1.15) if check else 0)
        w, h = int(f.getlength(text)) + icon + 84 + (18 if icon else 0), int(px * 2.0)
        img = self.canvas(); d = ImageDraw.Draw(img); x0 = (self.W - w) // 2
        sh = self.canvas(); ImageDraw.Draw(sh).rounded_rectangle((x0, y + 8, x0 + w, y + h + 8), radius=h // 2, fill=(0, 0, 0, 140))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(12))); d = ImageDraw.Draw(img)
        if solid:
            d.rounded_rectangle((x0, y, x0 + w, y + h), radius=h // 2, fill=self.ACC + (255,))
        else:
            d.rounded_rectangle((x0, y, x0 + w, y + h), radius=h // 2, fill=self.BG + (205,), outline=(255, 255, 255, 70), width=2)
        x = x0 + 42
        for _ in range(stars):
            self.star(d, x + px * 0.4, y + h / 2, px * 0.4, self.ACC); x += int(px * 0.9)
        if check:
            r = px * 0.48; cy = y + h / 2
            d.ellipse((x, cy - r, x + 2 * r, cy + r), fill=self.ACC)
            d.line((x + r * 0.52, cy + r * 0.02, x + r * 0.88, cy + r * 0.38, x + r * 1.48, cy - r * 0.42), fill=self.BG, width=max(4, px // 9), joint="curve")
            x += int(px * 1.15)
        if icon: x += 18
        d.text((x, y + h / 2), text, font=f, fill=self.BG if solid else self.WHITE, anchor="lm")
        return img, y + h

    # ---------- cards ----------
    def overlays(self, i, card, s, e):
        """[(png, start, end, animate)] for one shot's card; lines and items enter one after another."""
        t = card.get("type"); out = []; Y = int(self.H * 0.115)
        def add(img, k, a, end=None, anim=True):
            path = str(self.work / f"c{i}_{k}.png"); img.save(path); out.append((path, a, end or e, anim))
        a0 = s + 0.12
        if t == "headline":
            y = Y; k = 0
            if card.get("kicker"):
                img, y = self.line(card["kicker"].upper(), y, 34, "body", 800, self.ACC, spacing=6); add(img, k, a0); k += 1; y += 14
            img, y = self.line(card.get("top", ""), y, 108, "head", 900); add(img, k, a0 + 0.12 * k); k += 1
            img, y = self.line(card.get("accent", ""), y, 118, "head_italic", 800, self.ACC); add(img, k, a0 + 0.12 * k)
        elif t == "number":
            raw = str(card.get("value", "")); m = re.match(r"(\d+)(?:[.,](\d+))?", raw)
            dec = len(m.group(2)) if m and m.group(2) else 0
            target = float(f"{m.group(1)}.{m.group(2) or 0}") if m else None
            sep = "," if "," in raw else "."
            steps = 14 if target else 1
            for k in range(steps):
                v = raw if k == steps - 1 or target is None else f"{target * (k + 1) / steps:.{dec}f}".replace(".", sep)
                img = self.canvas()
                fnum = self.font(230, "head", 900); fun = self.font(90, "head", 800)
                unit = card.get("unit", ""); wn, wu = fnum.getlength(v), (fun.getlength(" " + unit) if unit else 0)
                x = (self.W - wn - wu) / 2; yb = Y + 220
                def draw(d, ds, x=x, v=v, unit=unit, wn=wn):
                    ds.text((x + 4, yb + 7), v, font=fnum, fill=(0, 0, 0, 190), anchor="ls"); d.text((x, yb), v, font=fnum, fill=self.ACC, anchor="ls")
                    if unit:
                        ds.text((x + wn + 4, yb + 7), " " + unit, font=fun, fill=(0, 0, 0, 190), anchor="ls"); d.text((x + wn, yb), " " + unit, font=fun, fill=self.WHITE, anchor="ls")
                    d.line(((self.W - 120) / 2, yb + 34, (self.W + 120) / 2, yb + 34), fill=self.ACC, width=4)
                img = self.shadowed(draw)
                lab, _ = self.line(card.get("label", "").upper(), yb + 60, 40, "body", 800, self.WHITE, spacing=5)
                img = Image.alpha_composite(img, lab)
                a = a0 + k * 0.045
                add(img, f"n{k}", a, None if k == steps - 1 else a + 0.045, k == 0)
        elif t in ("pills", "checks"):
            y = Y + 10
            for k, item in enumerate(card.get("items", [])[:4]):
                img, y2 = self.chip(item, int(y), stars=5 if (t == "pills" and card.get("stars") and k == 0) else 0, check=t == "checks")
                add(img, f"p{k}", a0 + k * 0.3); y = y2 + 20
        elif t == "end":
            y = int(self.H * 0.06)
            logo = self.logo_img(int(self.W * 0.30))
            if logo:
                img = self.canvas(); img.alpha_composite(logo, ((self.W - logo.width) // 2, y)); add(img, "logo", a0); y += logo.height + 18
            else:
                img, y = self.line(card.get("title", ""), y, 104, "head", 900); add(img, "t", a0)
            img, y = self.line(card.get("accent", ""), y, 72, "head_italic", 800, self.ACC); add(img, "a", a0 + 0.12)
            row = y + 18
            if card.get("note"):
                img, _ = self.chip(card["note"], row, px=50); add(img, "note", a0 + 0.25); row += int(50 * 2.0) + 16
            if card.get("cta"):
                img, _ = self.chip(card["cta"], row, px=50, solid=True); add(img, "cta", a0 + 0.38)
        return out

    def logo_img(self, width):
        if not self.s.get("logo") or not self.p(self.s["logo"]).exists():
            return None
        lg = Image.open(self.p(self.s["logo"])).convert("RGBA")
        lg = lg.crop(lg.getbbox() or (0, 0, lg.width, lg.height))
        return lg.resize((width, int(width * lg.height / lg.width)), Image.LANCZOS)

    def brand_tag(self):
        img = self.canvas(); logo = self.logo_img(120)
        if logo:
            img.alpha_composite(logo, (36, 64))
        elif self.s.get("brand"):
            f = self.font(32, "body", 800); t = self.s["brand"]; w = int(f.getlength(t)) + 44; d = ImageDraw.Draw(img)
            d.rounded_rectangle((40, 70, 40 + w, 132), radius=31, fill=self.BG + (210,), outline=(255, 255, 255, 70), width=2)
            d.text((40 + w / 2, 101), t, font=f, fill=self.WHITE, anchor="mm")
        else:
            return None
        path = str(self.work / "brand.png"); img.save(path); return path

    def small_line(self, text, key):
        f = self.font(26, "body", 600); img = self.canvas(); d = ImageDraw.Draw(img)
        d.multiline_text((self.W / 2, self.H * 0.955), text, font=f, fill=(255, 255, 255, 215), anchor="mm", align="center", spacing=8)
        path = str(self.work / f"small_{key}.png"); img.save(path); return path

    def gradient(self):
        img = self.canvas(); d = ImageDraw.Draw(img); top, bot = int(self.H * 0.50), int(self.H * 0.64)
        c = tuple(int(v * 0.35) for v in self.BG)
        for y in range(top):
            d.line((0, y, self.W, y), fill=c + (int(215 * (1 - y / top) ** 1.3),))
        for y in range(bot, self.H):
            d.line((0, y, self.W, y), fill=c + (int(175 * ((y - bot) / (self.H - bot)) ** 1.5),))
        path = str(self.work / "grad.png"); img.save(path); return path

    def captions(self):
        """One PNG per spoken word: the sentence in white, the current word on an accent highlight."""
        f = self.font(56, "body", 800); out = []; sentences, cur = [], []
        for c in self.caps:
            cur.append(c)
            if c[0][-1] in ".?!": sentences.append(cur); cur = []
        if cur: sentences.append(cur)
        space = f.getlength(" ")
        for ph in sentences:
            toks = [c[0] for c in ph]; lines, line = [], []
            for k in range(len(toks)):
                if line and f.getlength(" ".join(toks[j] for j in line + [k])) > self.W * 0.82: lines.append(line); line = []
                line.append(k)
            lines.append(line)
            for k, c in enumerate(ph):
                img = self.canvas(); d = ImageDraw.Draw(img); y = self.H * 0.785
                for ln in lines:
                    x = (self.W - f.getlength(" ".join(toks[j] for j in ln))) / 2
                    for j in ln:
                        w = f.getlength(toks[j])
                        if j == k:
                            d.rounded_rectangle((x - 12, y - 6, x + w + 12, y + 70), radius=14, fill=self.ACC + (255,))
                            d.text((x, y), toks[j], font=f, fill=self.BG)
                        else:
                            d.text((x, y), toks[j], font=f, fill=self.WHITE, stroke_width=5, stroke_fill=(0, 0, 0, 220))
                        x += w + space
                    y += 80
                path = str(self.work / f"cap{len(out)}.png"); img.save(path)
                end = ph[k + 1][1] if k + 1 < len(ph) else c[2] + 0.3
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
                chain.append(f"[{n}:v]format=rgba,fade=t=in:st={a:.2f}:d=0.28:alpha=1[f{n}]")
                chain.append(f"[{last}][f{n}]overlay=x=0:y='46*pow(max(0\\,1-(t-{a:.2f})/0.32)\\,2)':enable='between(t,{a:.2f},{b:.2f})'[v{n}]")
            else:
                inputs += ["-i", path]
                chain.append(f"[{last}][{n}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[v{n}]")
            last = f"v{n}"; n += 1
        if self.s.get("progress", True):  # thin progress line at the very top
            chain.append(f"[{last}]drawbox=x=0:y=0:w='iw*t/{T:.2f}':h=8:color=0x{''.join(f'{v:02x}' for v in self.ACC)}@0.95:t=fill[vp]")
            last = "vp"
        music = self.s.get("music")
        if music:
            inputs += ["-ss", f"{float(music.get('start', 0)):.2f}", "-i", str(self.p(music["src"]))]
            chain.append(f"[1:a]apad,atrim=0:{T:.2f},asplit=2[vo][key]")
            chain.append(f"[{n}:a]volume={float(music.get('volume', 0.18))},atrim=0:{T:.2f},afade=t=in:d=0.4,afade=t=out:st={T - 1.2:.2f}:d=1.2[m0]")
            chain.append("[m0][key]sidechaincompress=threshold=0.02:ratio=6:attack=20:release=350[m]")
            chain.append(f"[vo][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,atrim=0:{T:.2f},loudnorm=I=-14:TP=-1.5:LRA=11[a]")
        else:
            chain.append(f"[1:a]apad,atrim=0:{T:.2f},afade=t=out:st={T - 0.3:.2f}:d=0.3,loudnorm=I=-14:TP=-1.5:LRA=11[a]")  # social loudness
        out = self.p(self.s.get("out", "final.mp4"))
        run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(chain), "-map", f"[{last}]", "-map", "[a]",
             "-t", f"{T:.2f}", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out)])
        return out


if __name__ == "__main__":
    spec_path = Path(sys.argv[1]).resolve()
    print(Ad(json.loads(spec_path.read_text()), spec_path.parent).render())
