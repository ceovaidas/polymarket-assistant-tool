#!/bin/bash
# Mac: double-click to start Reel Grabber
cd "$(dirname "$0")"
if [ ! -d .venv ]; then
  python3 -m venv .venv || { echo "Install Python 3 from https://www.python.org/downloads/ first"; read; exit 1; }
  .venv/bin/pip install -q -r requirements.txt
fi
(sleep 2; open "http://127.0.0.1:5077") &
.venv/bin/python app.py "$@"
