"""Reel Grabber: a small local web app to browse an Instagram profile's posts and reels with their
public numbers, pick some or all, and download them as one zip.

Runs on your own computer (Instagram blocks this kind of request from cloud servers).
Start: python app.py   then open http://127.0.0.1:5077
Demo without Instagram: python app.py --demo
"""
import io
import json
import os
import re
import sys
import threading
import time
import zipfile
from datetime import timezone
from urllib.parse import urlparse

import requests
from flask import Flask, Response, abort, jsonify, request, send_file

try:
    import instaloader
except ImportError:  # demo mode still works without it
    instaloader = None

HERE = os.path.dirname(os.path.abspath(__file__))
SESSION_DIR = os.path.join(HERE, "sessions")
DEMO = "--demo" in sys.argv
PORT = int(os.environ.get("PORT", "5077"))
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/130.0 Safari/537.36")
ALLOWED_MEDIA_HOSTS = ("cdninstagram.com", "fbcdn.net", "picsum.photos", "commondatastorage.googleapis.com")

app = Flask(__name__)
STATE = {"loader": None, "login_user": None, "items": {}}
LOCK = threading.Lock()


# ---------- Instagram access ----------

def loader():
    if STATE["loader"] is None:
        L = instaloader.Instaloader(quiet=True, download_pictures=False, download_videos=False,
                                    download_video_thumbnails=False, save_metadata=False,
                                    compress_json=False, user_agent=UA, max_connection_attempts=2)
        STATE["loader"] = L
        # reuse a saved session if there is one
        if os.path.isdir(SESSION_DIR):
            for f in os.listdir(SESSION_DIR):
                try:
                    L.load_session_from_file(f, os.path.join(SESSION_DIR, f))
                    STATE["login_user"] = f
                    break
                except Exception:
                    pass
    return STATE["loader"]


def item_from_post(post, kind):
    media = []
    if post.typename == "GraphSidecar":
        for i, node in enumerate(post.get_sidecar_nodes()):
            media.append({"url": node.video_url if node.is_video else node.display_url,
                          "video": bool(node.is_video), "name": f"{post.shortcode}_{i + 1}"})
    else:
        media.append({"url": post.video_url if post.is_video else post.url,
                      "video": bool(post.is_video), "name": post.shortcode})
    views = None
    if post.is_video:
        views = getattr(post, "video_play_count", None) or post.video_view_count
    caption = post.caption or ""
    return {
        "id": post.shortcode,
        "kind": kind,  # reel | post
        "type": "carousel" if post.typename == "GraphSidecar" else ("video" if post.is_video else "photo"),
        "thumb": post.url,
        "views": views,
        "likes": post.likes if post.likes and post.likes > 0 else None,  # hidden likes come back as 0/-1
        "comments": post.comments,
        "date": post.date_utc.replace(tzinfo=timezone.utc).strftime("%Y-%m-%d"),
        "duration": round(post.video_duration, 1) if post.is_video and post.video_duration else None,
        "caption": caption[:300],
        "link": f"https://www.instagram.com/p/{post.shortcode}/",
        "media": media,
    }


IG_APP_ID = "936619743392459"  # the public id instagram.com's own web app sends


def anon_profile(username, limit, what):
    """No-login path: the same public profile endpoint instagram.com uses. Gives the latest ~12 posts
    (with view counts and direct video links). Works from home connections; servers get blocked."""
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "x-ig-app-id": IG_APP_ID, "Accept": "*/*",
                      "Referer": f"https://www.instagram.com/{username}/"})
    r = s.get("https://www.instagram.com/api/v1/users/web_profile_info/",
              params={"username": username}, timeout=20)
    if r.status_code == 404:
        raise RuntimeError(f"Profile @{username} not found.")
    if r.status_code != 200:
        raise RuntimeError(f"Instagram answered {r.status_code} without login.")
    user = (r.json().get("data") or {}).get("user")
    if not user:
        raise RuntimeError(f"Profile @{username} not found or private.")
    if user.get("is_private"):
        raise RuntimeError(f"@{username} is a private profile.")
    edges = [e["node"] for e in (user.get("edge_owner_to_timeline_media") or {}).get("edges", [])]
    edges += [e["node"] for e in (user.get("edge_felix_video_timeline") or {}).get("edges", [])]
    items, seen = [], set()
    for n in edges:
        sc = n.get("shortcode")
        if not sc or sc in seen:
            continue
        seen.add(sc)
        is_video = bool(n.get("is_video"))
        if what == "reels" and not is_video:
            continue
        if what == "posts" and n.get("product_type") == "clips":
            continue
        media = []
        kids = [k["node"] for k in (n.get("edge_sidecar_to_children") or {}).get("edges", [])]
        if kids:
            for i, k in enumerate(kids):
                media.append({"url": k.get("video_url") if k.get("is_video") else k.get("display_url"),
                              "video": bool(k.get("is_video")), "name": f"{sc}_{i + 1}"})
        else:
            media.append({"url": n.get("video_url") if is_video else n.get("display_url"),
                          "video": is_video, "name": sc})
        if any(not m["url"] for m in media):
            continue  # video link missing in this answer
        cap_edges = (n.get("edge_media_to_caption") or {}).get("edges", [])
        caption = cap_edges[0]["node"]["text"] if cap_edges else ""
        likes = (n.get("edge_liked_by") or n.get("edge_media_preview_like") or {}).get("count")
        dur = n.get("video_duration")
        items.append({
            "id": sc, "kind": "reel" if n.get("product_type") == "clips" or is_video else "post",
            "type": "carousel" if kids else ("video" if is_video else "photo"),
            "thumb": n.get("display_url") or n.get("thumbnail_src"),
            "views": n.get("video_view_count") if is_video else None,
            "likes": likes if likes and likes > 0 else None,
            "comments": (n.get("edge_media_to_comment") or {}).get("count"),
            "date": time.strftime("%Y-%m-%d", time.gmtime(n.get("taken_at_timestamp", 0))),
            "duration": round(dur, 1) if dur else None,
            "caption": caption[:300], "link": f"https://www.instagram.com/p/{sc}/", "media": media,
        })
        if len(items) >= limit:
            break
    info = {"username": user.get("username"), "name": user.get("full_name"),
            "followers": (user.get("edge_followed_by") or {}).get("count"),
            "posts": (user.get("edge_owner_to_timeline_media") or {}).get("count"),
            "pic": user.get("profile_pic_url_hd") or user.get("profile_pic_url")}
    return info, items


def fetch_any(username, limit, what):
    """Logged in: full list through instaloader. Not logged in: try the no-login path first."""
    errors = []
    if not STATE["login_user"]:
        try:
            info, items = anon_profile(username, limit, what)
            info["note"] = ("Loaded without login: Instagram shows only the latest posts this way. "
                            "Log in (spare account) to load more.") if limit > len(items) else ""
            return info, items
        except Exception as e:
            errors.append(str(e))
    if instaloader is None:
        raise RuntimeError(" ".join(errors) or "instaloader is not installed.")
    try:
        return fetch_profile(username, limit, what)
    except Exception as e:
        errors.append(str(e))
        raise RuntimeError(" | ".join(errors))


def fetch_profile(username, limit, what):
    L = loader()
    profile = instaloader.Profile.from_username(L.context, username)
    items, seen = [], set()
    sources = []
    if what in ("reels", "all"):
        sources.append(("reel", profile.get_reels() if hasattr(profile, "get_reels") else iter(())))
    if what in ("posts", "all"):
        sources.append(("post", profile.get_posts()))
    for kind, it in sources:
        count = 0
        try:
            for post in it:
                if post.shortcode in seen:
                    continue
                if what == "reels" and not post.is_video:
                    continue
                seen.add(post.shortcode)
                items.append(item_from_post(post, "reel" if post.is_video and kind == "reel" else kind))
                count += 1
                if count >= limit:
                    break
                time.sleep(0.4)  # be gentle: fast scraping gets the IP and account flagged
        except Exception as e:  # keep what we got
            if not items:
                raise
            print("stopped early:", e)
    info = {"username": profile.username, "name": profile.full_name, "followers": profile.followers,
            "posts": profile.mediacount, "pic": profile.profile_pic_url}
    return info, items


def demo_profile(username, limit, what):
    vids = ["https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"]
    items = []
    for i in range(min(limit, 18)):
        is_video = i % 3 != 2
        if what == "reels" and not is_video:
            continue
        sc = f"DEMO{i:03d}"
        items.append({"id": sc, "kind": "reel" if is_video else "post",
                      "type": "video" if is_video else ("carousel" if i % 2 else "photo"),
                      "thumb": f"https://picsum.photos/seed/{sc}/360/640",
                      "views": (i * 7919) % 250000 + 300 if is_video else None,
                      "likes": None if i == 4 else (i * 613) % 9000 + 20,
                      "comments": (i * 37) % 400, "date": f"2026-10-{28 - i % 27:02d}",
                      "duration": 7.5 + i % 9 if is_video else None,
                      "caption": f"Demo caption #{i} The concept vs the design 🤩 #showerhead",
                      "link": "https://www.instagram.com/",
                      "media": [{"url": vids[i % 2] if is_video else f"https://picsum.photos/seed/{sc}/1080/1350",
                                 "video": is_video, "name": sc}]})
    return {"username": username, "name": "Demo profile", "followers": 12345, "posts": 18,
            "pic": f"https://picsum.photos/seed/{username}/120/120"}, items


# ---------- routes ----------

@app.get("/")
def index():
    return send_file(os.path.join(HERE, "index.html"))


@app.get("/api/status")
def status():
    ok = DEMO or instaloader is not None
    if ok and not DEMO:
        loader()
    return jsonify({"demo": DEMO, "ready": ok, "login": STATE["login_user"]})


@app.post("/api/login")
def login():
    if DEMO:
        return jsonify({"ok": True, "login": "demo"})
    data = request.get_json(force=True)
    user, pw, code = data.get("username", "").strip(), data.get("password", ""), data.get("code", "").strip()
    L = loader()
    try:
        if code:
            L.two_factor_login(code)
        else:
            L.login(user, pw)
    except instaloader.exceptions.TwoFactorAuthRequiredException:
        return jsonify({"ok": False, "need_code": True, "error": "Enter the 2FA code from your app."})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)[:300]}), 400
    os.makedirs(SESSION_DIR, exist_ok=True)
    L.save_session_to_file(os.path.join(SESSION_DIR, L.context.username))
    STATE["login_user"] = L.context.username
    return jsonify({"ok": True, "login": STATE["login_user"]})


@app.get("/api/profile")
def profile():
    raw = request.args.get("u", "").strip()
    m = re.search(r"instagram\.com/([A-Za-z0-9._]+)", raw)
    username = m.group(1) if m else re.sub(r"[^A-Za-z0-9._]", "", raw.lstrip("@"))
    if not username:
        return jsonify({"error": "Enter a username or profile link."}), 400
    limit = max(1, min(int(request.args.get("limit", 30)), 300))
    what = request.args.get("what", "reels")
    try:
        info, items = (demo_profile if DEMO else fetch_any)(username, limit, what)
    except Exception as e:
        msg = str(e)
        if "login" in msg.lower() or "401" in msg or "403" in msg or "429" in msg:
            msg = ("Instagram wants a login or is rate-limiting. Log in (use a spare account, not your "
                   "growth account) and wait a few minutes. Details: " + msg[:200])
        return jsonify({"error": msg[:400]}), 400
    with LOCK:
        for it in items:
            STATE["items"][it["id"]] = it
    return jsonify({"profile": info, "items": items})


def allowed(url):
    host = urlparse(url).hostname or ""
    return any(host == h or host.endswith("." + h) for h in ALLOWED_MEDIA_HOSTS)


@app.get("/api/thumb")
def thumb():
    url = request.args.get("url", "")
    if not allowed(url):
        abort(400)
    r = requests.get(url, headers={"User-Agent": UA}, timeout=20)
    return Response(r.content, content_type=r.headers.get("Content-Type", "image/jpeg"),
                    headers={"Cache-Control": "max-age=3600"})


@app.post("/api/zip")
def make_zip():
    ids = request.get_json(force=True).get("ids", [])
    with LOCK:
        chosen = [STATE["items"][i] for i in ids if i in STATE["items"]]
    if not chosen:
        return jsonify({"error": "Nothing selected."}), 400
    buf = io.BytesIO()
    rows = []
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as z:
        for it in chosen:
            for m in it["media"]:
                if not allowed(m["url"]):
                    continue
                try:
                    r = requests.get(m["url"], headers={"User-Agent": UA}, timeout=60)
                    r.raise_for_status()
                except Exception as e:
                    rows.append({"file": m["name"], "error": str(e)[:120]})
                    continue
                ext = ".mp4" if m["video"] else ".jpg"
                z.writestr(f"{it['date']}_{m['name']}{ext}", r.content)
            rows.append({k: it[k] for k in ("id", "kind", "type", "date", "views", "likes", "comments",
                                            "duration", "link", "caption")})
            time.sleep(0.3)
        z.writestr("stats.json", json.dumps(rows, ensure_ascii=False, indent=1))
        csv = ["id,kind,type,date,views,likes,comments,duration,link"]
        for r_ in rows:
            if "id" in r_:
                csv.append(",".join("" if r_.get(k) is None else str(r_.get(k)) for k in
                                    ("id", "kind", "type", "date", "views", "likes", "comments", "duration", "link")))
        z.writestr("stats.csv", "\n".join(csv))
    buf.seek(0)
    return send_file(buf, mimetype="application/zip", as_attachment=True,
                     download_name=f"instagram_{len(chosen)}_items.zip")


if __name__ == "__main__":
    if instaloader is None and not DEMO:
        print("Missing packages. Run:  pip install -r requirements.txt")
        sys.exit(1)
    print(f"Reel Grabber running: open http://127.0.0.1:{PORT}" + ("  (demo mode)" if DEMO else ""))
    app.run(host="127.0.0.1", port=PORT, debug=False, threaded=True)
