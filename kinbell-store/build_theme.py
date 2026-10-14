"""Build an uploadable Shopify theme: Dawn + the one-product landing sections.

Usage:
    git clone --depth 1 https://github.com/Shopify/dawn.git /path/to/dawn
    python3 build_theme.py /path/to/dawn
    -> dist/kinbell-theme.zip  (Shopify admin → Online Store → Themes → Add theme → Upload zip file)
"""
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
OURS = HERE / "theme"
DIST = HERE / "dist"

COLOR_SCHEMES = {
    "scheme-1": {"background": "#FAF7F2", "text": "#15202D", "button": "#D6402C", "button_label": "#FFFFFF", "secondary_button_label": "#15202D", "shadow": "#15202D"},
    "scheme-2": {"background": "#F2EDE4", "text": "#15202D", "button": "#2B7368", "button_label": "#FFFFFF", "secondary_button_label": "#15202D", "shadow": "#15202D"},
    "scheme-3": {"background": "#15202D", "text": "#FFFFFF", "button": "#E2A23A", "button_label": "#15202D", "secondary_button_label": "#FFFFFF", "shadow": "#000000"},
}
GLOBAL_SETTINGS = {
    "buttons_radius": 40, "inputs_radius": 12, "variant_pills_radius": 40, "card_corner_radius": 16,
    "media_radius": 16, "popup_corner_radius": 16, "badge_corner_radius": 40,
    "card_color_scheme": "scheme-2", "cart_type": "page", "page_width": 1200,
}


def load_json(path):
    return json.loads(re.sub(r"/\*.*?\*/", "", path.read_text(encoding="utf-8"), flags=re.S))


def dump_json(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main(dawn_dir):
    dawn = Path(dawn_dir)
    if not (dawn / "layout" / "theme.liquid").exists():
        sys.exit(f"{dawn} does not look like a Dawn checkout")
    with tempfile.TemporaryDirectory() as tmp:
        build = Path(tmp) / "theme"
        shutil.copytree(dawn, build, ignore=shutil.ignore_patterns(".git", ".github", "*.md", ".*"))
        shutil.copy(dawn / "LICENSE.md", build / "LICENSE.md")
        for folder in ("assets", "sections", "snippets", "templates"):
            for f in (OURS / folder).iterdir():
                shutil.copy(f, build / folder / f.name)

        # Our header and footer replace Dawn's on every page (cart, policies, 404 keep Dawn's own sections).
        dump_json(build / "sections" / "header-group.json", {
            "name": "t:sections.header.name", "type": "header",
            "sections": {"header": {"type": "kb-header", "settings": {}}}, "order": ["header"]})
        dump_json(build / "sections" / "footer-group.json", {
            "name": "t:sections.footer.name", "type": "footer",
            "sections": {"footer": {"type": "kb-footer", "settings": {}}}, "order": ["footer"]})

        data = load_json(build / "config" / "settings_data.json")
        preset = data["presets"]["Dawn"]
        for key, values in COLOR_SCHEMES.items():
            preset["color_schemes"][key]["settings"].update(values)
        preset.update(GLOBAL_SETTINGS)
        dump_json(build / "config" / "settings_data.json", data)

        schema = load_json(build / "config" / "settings_schema.json")
        schema[0]["theme_name"] = "Kinbell"
        schema[0]["theme_author"] = "Kinbell (based on Shopify Dawn)"
        dump_json(build / "config" / "settings_schema.json", schema)

        DIST.mkdir(exist_ok=True)
        print("wrote", shutil.make_archive(str(DIST / "kinbell-theme"), "zip", build))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
