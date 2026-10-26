"""Build the toetally.extra theme: Dawn + the shared one-product sections (kinbell-store/theme)
+ this store's templates, brand stylesheet and header/footer texts.

Usage:
    git clone --depth 1 https://github.com/Shopify/dawn.git /path/to/dawn
    python3 build_theme.py /path/to/dawn   ->  dist/toetally-theme.zip
"""
import importlib.util
import json
import shutil
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).parent
SHARED = HERE.parent / "kinbell-store"
spec = importlib.util.spec_from_file_location("kb_build", SHARED / "build_theme.py")
kb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kb)

HEADER = {"bar": "Order by Dec 3 for Christmas · $0 shipping, on us · 30-day returns", "cta": "Get the toes", "logo_width": 150}
FOOTER = {"text": "Ten extra toes for your clogs. Made for the clown of every friend group."}
COLORS = {
    "scheme-1": {"background": "#FFFBEA", "text": "#111111", "button": "#111111", "button_label": "#FFE328", "secondary_button_label": "#111111", "shadow": "#111111"},
    "scheme-2": {"background": "#FFE328", "text": "#111111", "button": "#111111", "button_label": "#FFE328", "secondary_button_label": "#111111", "shadow": "#111111"},
    "scheme-3": {"background": "#111111", "text": "#FFFFFF", "button": "#FFE328", "button_label": "#111111", "secondary_button_label": "#FFFFFF", "shadow": "#000000"},
}


def main(dawn_dir):
    dawn = Path(dawn_dir)
    with tempfile.TemporaryDirectory() as tmp:
        build = Path(tmp) / "theme"
        shutil.copytree(dawn, build, ignore=shutil.ignore_patterns(".git", ".github", "*.md", ".*"))
        shutil.copy(dawn / "LICENSE.md", build / "LICENSE.md")
        for src in (SHARED / "theme", HERE / "theme"):          # shared sections first, this store's files win
            for folder in ("assets", "sections", "snippets", "templates"):
                if (src / folder).exists():
                    for f in (src / folder).iterdir():
                        shutil.copy(f, build / folder / f.name)
        kb.dump_json(build / "sections" / "header-group.json", {
            "name": "t:sections.header.name", "type": "header",
            "sections": {"header": {"type": "kb-header", "settings": HEADER}}, "order": ["header"]})
        kb.dump_json(build / "sections" / "footer-group.json", {
            "name": "t:sections.footer.name", "type": "footer",
            "sections": {"footer": {"type": "kb-footer", "settings": FOOTER}}, "order": ["footer"]})
        data = kb.load_json(build / "config" / "settings_data.json")
        preset = data["presets"]["Dawn"]
        for key, values in COLORS.items():
            preset["color_schemes"][key]["settings"].update(values)
        preset.update(kb.GLOBAL_SETTINGS)
        preset.update({"type_header_font": "poppins_n6", "type_body_font": "inter_n4"})  # cart, policies and other Dawn pages match the landing
        kb.dump_json(build / "config" / "settings_data.json", data)
        schema = kb.load_json(build / "config" / "settings_schema.json")
        schema[0]["theme_name"] = "toetally.extra"
        schema[0]["theme_author"] = "toetally.extra (based on Shopify Dawn)"
        kb.dump_json(build / "config" / "settings_schema.json", schema)
        (HERE / "dist").mkdir(exist_ok=True)
        print("wrote", shutil.make_archive(str(HERE / "dist" / "toetally-theme"), "zip", build))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
