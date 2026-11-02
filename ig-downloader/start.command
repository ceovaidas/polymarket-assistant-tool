#!/bin/bash
# Mac: double-click to start Reel Grabber. Keep this window open while you use the page.
cd "$(dirname "$0")"
command -v python3 >/dev/null || { echo "Install Python 3 from https://www.python.org/downloads/ first"; read; exit 1; }
if [ ! -x .venv/bin/python ]; then echo "First start: installing, about 1 minute..."; python3 -m venv .venv || { read; exit 1; }; fi
.venv/bin/pip install -q -r requirements.txt || { echo "Could not install packages"; read; exit 1; }
(sleep 2; open "http://127.0.0.1:5077") &
.venv/bin/python app.py "$@"
echo "The app stopped. If you see an error above, send a screenshot."; read
