"""Build the Softpun theme (funny tees): Dawn + the sp-* sections.

Usage:
    git clone --depth 1 https://github.com/Shopify/dawn.git /path/to/dawn
    python3 build_theme.py /path/to/dawn   ->  dist/softpun-theme.zip
"""
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
COLORS = {
    "scheme-1": {"background": "#F7F0E5", "text": "#3A2A21", "button": "#D8643C", "button_label": "#FFFFFF", "secondary_button_label": "#3A2A21", "shadow": "#3A2A21"},
    "scheme-2": {"background": "#FFFAF2", "text": "#3A2A21", "button": "#8AA58C", "button_label": "#FFFFFF", "secondary_button_label": "#3A2A21", "shadow": "#3A2A21"},
    "scheme-3": {"background": "#3A2A21", "text": "#F7F0E5", "button": "#F4CD6A", "button_label": "#3A2A21", "secondary_button_label": "#F7F0E5", "shadow": "#000000"},
}
GLOBAL = {"buttons_radius": 40, "inputs_radius": 14, "variant_pills_radius": 14, "card_corner_radius": 18,
          "media_radius": 18, "popup_corner_radius": 24, "badge_corner_radius": 40, "card_color_scheme": "scheme-2",
          "cart_type": "page", "page_width": 1280}


def load_json(p):
    return json.loads(re.sub(r"/\*.*?\*/", "", p.read_text(encoding="utf-8"), flags=re.S))


def dump_json(p, d):
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main(dawn_dir):
    dawn = Path(dawn_dir)
    with tempfile.TemporaryDirectory() as tmp:
        build = Path(tmp) / "theme"
        shutil.copytree(dawn, build, ignore=shutil.ignore_patterns(".git", ".github", "*.md", ".*"))
        shutil.copy(dawn / "LICENSE.md", build / "LICENSE.md")
        for folder in ("assets", "sections", "snippets", "templates"):
            for f in (HERE / "theme" / folder).iterdir():
                shutil.copy(f, build / folder / f.name)
        dump_json(build / "sections" / "header-group.json", {"name": "t:sections.header.name", "type": "header",
                  "sections": {"header": {"type": "sp-header", "settings": {}}}, "order": ["header"]})
        dump_json(build / "sections" / "footer-group.json", {"name": "t:sections.footer.name", "type": "footer",
                  "sections": {"footer": {"type": "sp-footer", "settings": {}}, "popup": {"type": "sp-popup", "settings": {}}},
                  "order": ["footer", "popup"]})
        data = load_json(build / "config" / "settings_data.json")
        preset = data["presets"]["Dawn"]
        for k, v in COLORS.items():
            preset["color_schemes"][k]["settings"].update(v)
        preset.update(GLOBAL)
        dump_json(build / "config" / "settings_data.json", data)
        schema = load_json(build / "config" / "settings_schema.json")
        schema[0]["theme_name"] = "Softpun"
        schema[0]["theme_author"] = "Softpun (based on Shopify Dawn)"
        dump_json(build / "config" / "settings_schema.json", schema)
        (HERE / "dist").mkdir(exist_ok=True)
        print("wrote", shutil.make_archive(str(HERE / "dist" / "softpun-theme"), "zip", build))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
