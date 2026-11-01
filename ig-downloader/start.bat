@echo off
REM Windows: double-click to start Reel Grabber
cd /d "%~dp0"
if not exist .venv (
  py -3 -m venv .venv || (echo Install Python 3 from https://www.python.org/downloads/ first & pause & exit /b 1)
  .venv\Scripts\pip install -q -r requirements.txt
)
start "" http://127.0.0.1:5077
.venv\Scripts\python app.py %*
