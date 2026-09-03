# Running the app on the day

Two ways to open `team-connect.html`. Both work; one is more predictable.

| | Double-click the file (`file://`) | Local server (`http://localhost`) |
|---|---|---|
| Setup | none | one terminal command |
| Presentation pop-up | usually fine, occasionally blocked with no visible error | consistent across Chrome, Edge, Safari, Firefox |
| Cross-window sync | direct `postMessage` works; `BroadcastChannel` is unreliable on `file://` | all three sync channels work |
| localStorage | shared across every `file://` page in some browsers, blocked in others | scoped to `localhost:PORT` |
| Offline | yes | yes (nothing is fetched) |

Both paths are covered by the test suite: the whole suite runs over `file://`, and a
dedicated test boots the built file over `http://127.0.0.1` and checks the presentation
window connects there too.

## Local server

```bash
cd /path/to/team_games
./serve.sh            # or: python3 -m http.server 8080 --bind 127.0.0.1
```

Then open:

```
http://localhost:8080/team-connect.html
```

Leave the terminal window open for the whole session. Ctrl+C stops it.

`--bind 127.0.0.1` keeps the server on this machine only; nothing is exposed to the network.

## If the presentation window will not open

1. Look for the "pop-up blocked" icon in the address bar and allow pop-ups for this page.
2. Press Retry in the dialog the app shows.
3. Or open the same file in a second tab and add `#presentation` to the address. It connects on its own.
4. Or switch to the local server above, which is the most reliable of the four.

## What to share in Zoom

Share the window titled **TEAM CONNECT LIVE · Presentation**, never the console.
The banner across the top of the console says which state you are in:

- **Green** — the presentation window is connected. Share that window.
- **Amber** — it is opening or has disconnected. Participants see nothing right now.
- **Red** — no presentation window. This screen holds answers and private notes; do not share it.

Tick "Share sound" in the Zoom share dialog so the ding and buzzer reach the room.
