"""Build an uploadable Shopify theme: Dawn + the Jolly Haul sections, pre-configured.

Usage:
    git clone --depth 1 https://github.com/Shopify/dawn.git /path/to/dawn
    python3 build_theme.py /path/to/dawn
    -> dist/jolly-haul-theme.zip  (Shopify admin → Online Store → Themes → Add theme → Upload zip file)
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

# Collection handles created from the titles in the launch guide (Shopify lowercases + hyphenates).
CATEGORY_LINKS = {
    "Funny masks": "shopify://collections/funny-masks",
    "Star projectors": "shopify://collections/star-projectors",
    "Baby & kids": "shopify://collections/baby-kids",
    "Ugly sweaters": "shopify://collections/ugly-sweaters",
    "Lights & decor": "shopify://collections/lights-decor",
    "Stocking stuffers": "shopify://collections/stocking-stuffers",
}

COLOR_SCHEMES = {
    # 1: default — white page, cranberry buttons
    "scheme-1": {"background": "#FFFFFF", "text": "#1B2420", "button": "#E0313F", "button_label": "#FFFFFF", "secondary_button_label": "#1B2420", "shadow": "#1B2420"},
    # 2: cream sections and cards
    "scheme-2": {"background": "#FBF5EC", "text": "#1B2420", "button": "#1F6B4E", "button_label": "#FFFFFF", "secondary_button_label": "#1B2420", "shadow": "#1B2420"},
    # 3: deep pine (footer, dark bands)
    "scheme-3": {"background": "#12291F", "text": "#FFFFFF", "button": "#F2B33D", "button_label": "#12291F", "secondary_button_label": "#FFFFFF", "shadow": "#000000"},
    # 4: cranberry (sale badges)
    "scheme-4": {"background": "#E0313F", "text": "#FFFFFF", "button": "#FFFFFF", "button_label": "#E0313F", "secondary_button_label": "#FFFFFF", "shadow": "#000000"},
    # 5: pine green
    "scheme-5": {"background": "#1F6B4E", "text": "#FFFFFF", "button": "#FFFFFF", "button_label": "#1F6B4E", "secondary_button_label": "#FFFFFF", "shadow": "#000000"},
}

GLOBAL_SETTINGS = {
    "buttons_radius": 14,
    "inputs_radius": 12,
    "variant_pills_radius": 40,
    "card_corner_radius": 16,
    "collection_card_corner_radius": 16,
    "media_radius": 16,
    "popup_corner_radius": 16,
    "badge_corner_radius": 40,
    "card_color_scheme": "scheme-2",
    "collection_card_color_scheme": "scheme-2",
    "sale_badge_color_scheme": "scheme-4",
    "cart_type": "page",          # Jolly forms post straight to /cart
    "show_cart_note": True,       # "Add a gift note" promise on the home page
    "page_width": 1200,
}


def load_json(path):
    text = path.read_text(encoding="utf-8")
    return json.loads(re.sub(r"/\*.*?\*/", "", text, flags=re.S))


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
        # Dawn's product template is replaced by ours (templates/product.json), so drop nothing else.

        # Home: point settings at the collections/products created from the import files.
        index = load_json(build / "templates" / "index.json")
        home = index["sections"]["home"]
        home["settings"].update({
            "trending_collection": "trending",
            "hero_cta_link": "shopify://collections/all",
        })
        for block in home["blocks"].values():
            if block["type"] == "category" and block["settings"]["title"] in CATEGORY_LINKS:
                # Point the tile at its collection: it links there and hides itself while empty.
                block["settings"]["collection"] = CATEGORY_LINKS[block["settings"]["title"]].split("/")[-1]
        # Gift finder stays off until the catalogue spans several price points.
        for bid in [k for k, v in home["blocks"].items() if v["type"] == "price"]:
            del home["blocks"][bid]
            home["block_order"].remove(bid)
        home["settings"].update({
            "spotlight_product": "realistic-old-man-ski-mask",
            "spotlight_text": "The ski mask that makes the whole lift line look twice. Realistic printed face, stretchy one-size fit, thermal styles for colder days.",
            "spotlight_bullets": "Eight realistic looks\nThermal styles available\nTwo masks ship free",
            "hero_cta2": "Funny masks",
            "hero_cta2_link": "shopify://collections/funny-masks",
            "hero_labels": "|",
        })
        dump_json(build / "templates" / "index.json", index)

        # Header group: Jolly header replaces Dawn's announcement bar + header.
        dump_json(build / "sections" / "header-group.json", {
            "name": "t:sections.header.name",
            "type": "header",
            "sections": {"header": {"type": "jolly-header", "settings": {"menu": "main-menu", "logo_width": 140, "show_account": False}}},
            "order": ["header"],
        })

        footer = load_json(build / "sections" / "footer-group.json")
        footer["sections"]["footer"]["settings"]["color_scheme"] = "scheme-3"
        # Prize wheel lives in the footer group so it is available on every page.
        footer["sections"]["jolly-wheel"] = json.loads((HERE / "theme-config" / "footer-wheel.json").read_text())
        footer["order"].append("jolly-wheel")
        dump_json(build / "sections" / "footer-group.json", footer)

        data = load_json(build / "config" / "settings_data.json")
        preset = data["presets"]["Dawn"]
        for key, values in COLOR_SCHEMES.items():
            preset["color_schemes"][key]["settings"].update(values)
        preset.update(GLOBAL_SETTINGS)
        dump_json(build / "config" / "settings_data.json", data)

        schema = load_json(build / "config" / "settings_schema.json")
        schema[0]["theme_name"] = "Jolly Haul"
        schema[0]["theme_author"] = "Jolly Haul (based on Shopify Dawn)"
        dump_json(build / "config" / "settings_schema.json", schema)

        DIST.mkdir(exist_ok=True)
        out = shutil.make_archive(str(DIST / "jolly-haul-theme"), "zip", build)
        print("wrote", out)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
