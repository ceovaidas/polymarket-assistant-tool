# Reel Grabber

Local web app: load an Instagram profile, see each reel/post with its public numbers (views, likes,
comments, date, length, caption), tick some or all, and download them as one zip with `stats.csv`.

It runs on your own computer, because Instagram blocks these requests from cloud servers.

## Start
- Mac: double-click `start.command` (first run installs what it needs; needs Python 3).
- Windows: double-click `start.bat`.
- Or: `pip install -r requirements.txt && python app.py`, then open http://127.0.0.1:5077
- Try it without Instagram: `python app.py --demo`

## Notes
- Saves are private on Instagram (only the owner sees them), so they cannot be shown.
- Likes show "—" when the owner hid them.
- If Instagram asks for a login or rate-limits, log in inside the app with a spare account (not your
  growth account) and load fewer items at a time. Only the session cookie is saved, in `sessions/`.
- Use downloads for research, references and your own backups. Re-uploading someone else's video as
  your own breaks Instagram's rules and copyright and gets reach cut or the account removed.
