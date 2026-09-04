# How to run a session

Everything you need on the day, in the order you need it. Nothing here requires the internet, an
account, or a server you do not control. The whole app is one file.

If you only read one line: **share the presentation window, never the console.** The console shows
answers.

---

## The short version

```bash
cd team_connect
./serve.sh
```

Open <http://localhost:8080/team-connect.html>, click **New session**, click **Open presentation**,
share that window in Zoom, and press Start.

---

## A week before

Nothing to install. Optionally open the app and click **Rehearse**: it opens a throwaway practice run
with six sample people and every activity available, timers running five times faster, and it touches
no real scores and uses up no real questions. Ending it deletes it.

If you want people's own facts for **Who Said That?** or **Two Truths and a Lie**, collect them now by
chat or a form. There is nowhere for participants to type during the session; you enter what you have
in **Participants** beforehand.

## The day before

1. Start the app and click **New session**.
2. Name it, pick a length, pick a preset. The presets are complete run sheets, not suggestions:
   *Funny and Clever* (45 min) and *Full Team Connect* (60 min) are the safest starting points.
3. Paste your roster, one name per line. Teams are built automatically and you can rebalance later.
4. Work through the **readiness check**. It will tell you about things you cannot see, including
   whether a bank has run low on fresh questions and would start repeating.
5. Click **Export full backup**. It saves a JSON file. You will almost certainly not need it.

## Ten minutes before

1. `./serve.sh`, open the app, open your session.
2. Click **Open presentation**. A second window opens titled
   **TEAM CONNECT LIVE · Presentation**.
3. In Zoom, choose **Share Screen**, pick that window by name, and tick **Share sound** so the chimes
   and buzzer reach the room.
4. Check the banner across the top of the console:

   | Banner | Meaning |
   |---|---|
   | **Green** | The presentation window is connected. Safe to share. |
   | **Amber** | Opening, or briefly disconnected. Participants see nothing right now. |
   | **Red** | No presentation window. **This screen has the answers on it. Do not share it.** |

5. Play the sound test once from Settings. Browsers block audio until you interact with the page, and
   this is the interaction.

## During the session

You drive everything from the console. The participant window follows on its own.

- **Start** an activity from the run sheet, then use the big buttons. `R` reveals, `N` moves on.
- **Award points** with the team buttons. Every award is undoable: `Cmd+Z`, or More → Undo.
- **Someone needs a minute?** Hit **Cover screen**. The participant view is covered instantly and
  whatever is underneath keeps running. Click **uncover** to come back.
- **Running late?** More → *Running late* projects your finish time and offers ranked ways to fix it,
  from trimming questions to skipping the next activity. It never touches the activity you are in.
- **Something went wrong?** The left sidebar has **If something breaks**. Every route out of trouble is
  there, and nothing on it loses scores.
- **Someone joins or drops out?** Participants → mark them present or away. Teams rebalance and the
  participant screen updates immediately.

## When it ends

The results screen has the podium, the score breakdown, and a **session summary** you can copy or
download as a text file. Post it in the team channel. **Duplicate for next time** clones the run sheet
without the scores.

---

## If something goes wrong

**The presentation window will not open.** Look for the pop-up blocked icon in the address bar and
allow pop-ups for this page. If that fails, open a second browser tab and add `#presentation` to the
address: it connects on its own.

**You accidentally shared the console.** Stop sharing. The red banner exists to catch this before it
happens, which is why the console is deliberately ugly about it.

**The browser crashed or you reloaded.** Nothing is lost. Reopen the app and the session comes back
exactly where it was: same activity, same question, same scores, clock still running. It saves
continuously.

**Points went to the wrong team.** `Cmd+Z`. Or If something breaks → *Edit scores*, which lists every
scoring event and lets you undo any one of them individually.

**Your laptop dies.** This is the one failure the app cannot survive on its own, because everything
lives in that browser. If the session matters, export a backup beforehand and know that a second
machine can restore it in one paste.

---

## Things worth knowing

- **It works offline.** Nothing is fetched. Aeroplane mode changes nothing.
- **Your data never leaves the browser.** No account, no server, no analytics. That also means clearing
  your browser data deletes your sessions, and another machine cannot see them unless you export a
  backup and restore it there.
- **Use the local server, not a double-click.** `file://` mostly works, but pop-ups and cross-window
  messaging are more reliable over `http://localhost`.
- **The participant window is a fixed frame.** Long questions cannot push the clock or the footer off a
  shared 720p screen.
- **Questions rotate by team.** The quiz and gibberish give each team its turn in order, a miss passes
  the question on for half points, and a quick answer earns a bonus. This is deliberate: over Zoom,
  audio lag means whoever *sounds* first often was not, and turns remove that argument entirely.
- **Scoring is secondary.** Balanced scoring is on by default so a long quiz cannot decide the whole
  session. You can turn scoring off completely in Settings and the activities still work.

## Keyboard

| Key | Does |
|---|---|
| `R` | Reveal |
| `N` | Next |
| `P` | Pass the question on |
| `Cmd/Ctrl + Z` | Undo the last action |
| `Esc` | Close a dialog or menu |

---

## For developers

`team-connect.html` is generated. Edit the files in `src/`, then:

```bash
node build/build.js     # rebuilds team-connect.html and dev.html from src/
node tests/run.js       # 440 assertions, end to end in a real browser
node tests/edge.js      # 58 adversarial assertions
```

Both suites need Playwright and nothing else. `dev.html` loads the same source files separately, which
is easier to debug than the bundle. More detail in `docs/`.
