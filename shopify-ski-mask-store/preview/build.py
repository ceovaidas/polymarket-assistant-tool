"""Inline the theme CSS into a single self-contained preview page.

Usage: python3 preview/build.py  ->  writes preview/index.html
"""
from pathlib import Path

here = Path(__file__).parent
css = (here.parent / "theme" / "assets" / "gnarhead-landing.css").read_text()
html = (here / "template.html").read_text().replace("/*CSS*/", css)
(here / "index.html").write_text(html)
print("wrote", here / "index.html")
