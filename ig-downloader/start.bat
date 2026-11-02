@echo off
REM Windows: double-click to start Reel Grabber. Keep this window open while you use the page.
cd /d "%~dp0"
set PY=py -3
%PY% --version >nul 2>&1 || set PY=python
%PY% --version >nul 2>&1 || (echo Python 3 is not installed. Get it from https://www.python.org/downloads/ and tick "Add Python to PATH". & pause & exit /b 1)
if not exist .venv\Scripts\python.exe (
  echo First start: installing, about 1 minute...
  %PY% -m venv .venv || (echo Could not create the environment. & pause & exit /b 1)
)
.venv\Scripts\python -m pip install -q -r requirements.txt || (echo Could not install packages. & pause & exit /b 1)
start "" http://127.0.0.1:5077
.venv\Scripts\python app.py %*
echo.
echo The app stopped. If you see an error above, send a screenshot.
pause
