# TEAM CONNECT LIVE

*One team. Any location. Real connections.*

A facilitator's control centre and presentation screen for virtual team-bonding sessions run over Zoom.
One person facilitates from `team-connect.html`; participants join through Zoom for video, audio, chat,
reactions and breakout rooms. The app never controls Zoom; it tells the facilitator what to do and shows
participants a clean, answer-free screen.

## Run it

1. Copy `team-connect.html` anywhere (USB, email, another laptop). It is one self-contained file with no dependencies.
2. Open it, either way:
   - Double-click it. It opens in Chrome, Edge or Safari from `file://` and works fully offline.
   - Or serve it locally, which is more predictable for pop-ups and window sync: `./serve.sh` then open
     `http://localhost:8080/team-connect.html`. See `docs/04-running.md`.
3. Click **New session**, pick a preset and paste participant names. Or click **Rehearse** to practise first.
4. Run the **readiness check**, then on the console click **Open presentation window** and share **that** window
   in Zoom (with "share sound" on). The banner across the top of the console says whether it is safe to share.

The console opens in **Simple mode**: timer, reveal, score, next, undo and exit only. Switch to **Advanced**
from the top bar when you need settings, manual score edits, activity resets and the full action log.

**The screen only ever asks you three things.** What is happening now (the prompt and the clock), what to
click next (exactly one gold button, and it moves as the round moves: start timer, then reveal, then next),
and how to recover (the **More** menu on the header, and **If something breaks** in the sidebar during play).
Everything else is one click away rather than on screen: planning tools disappear while a session is live,
the game library sits behind **Add activity**, and each game's advanced settings are folded away until asked for.

Everything is saved in the browser's localStorage after every change. Refresh, close and reopen: the Home
screen offers to resume an unfinished session exactly where it stopped, timers included.

## What is in the box

| Area | What it does |
|---|---|
| Home | Saved sessions, recovery of unfinished sessions, PRIME TIME save import |
| New Session wizard | Name, 30/45/60/custom minutes, preset, participants |
| Participants | Add, paste, CSV import/export, present/absent, guests, locations, balanced or manual teams, lock |
| Session Builder | One-column run sheet with drag reorder, live duration model and Auto-fit. The 17-activity library opens from **Add activity** with search and category filters rather than sitting on screen |
| Per-game settings | Two tiers per instance: the everyday ones (count, time, categories, difficulty, format, scoring) are visible; the other dozen or so fold away under **Advanced settings** and still apply |
| Game Library | 17 configurable activities (list below) |
| Content Manager | Search, filter, add, edit, duplicate, disable, usage history, packs, JSON/CSV import with validation, export, restore built-in |
| Facilitator Console | One primary action at a time; prompt, clock and award buttons in the centre; session clock, round clock, private answer, scores and what is next in a narrow rail; everything else in a More menu |
| Plan versus play | Before the session: Home, Builder, Participants, Library, Content, Settings. During it the sidebar becomes Now playing, Run sheet, Scores and a recovery menu. The run sheet is reachable without stopping the activity |
| Readiness check | Ten pre-flight checks (people, teams, activities, content, fit, presentation, pop-ups, sound, Zoom steps, backup). Warnings can be overridden; blockers cannot |
| Rehearsal mode | A throwaway practice session: sample people, 5x faster timers, jump to any game, no real scores, no questions used up, deletes itself when you end it |
| Running late | Live projection of the finish time and ranked fixes: drop the break, shorten activities, one less question each, skip the next activity, finish on time automatically, or extend. Never touches the activity that is running |
| Share safety | A persistent green/amber/red banner on every facilitator screen saying whether it is safe to share |
| Breakout rooms | Activities that need them are labelled everywhere, with room-by-room assignments and a copyable Zoom broadcast message |
| Turn taking | Private list of who has and has not been picked, least-picked first. Never shown to participants or exported |
| Presentation window | Participant-facing view synced from the console; shows only public content, and the rules come off the screen once a clock starts so the prompt and timer own it |
| Round summary and Results | Per-activity points, podium, awards, tie handling, copy/download summary, session JSON |
| Settings | Console mode, sound, silent mode, scoring defaults, finale style, large-text presentation, how to serve locally, backups |

## Built-in games

| Game | Type | Zoom usage |
|---|---|---|
| Who Said That? | Bonding | Facts pre-submitted; teams guess |
| Would You Rather? | Energy | Reactions or chat to vote |
| Common Ground | Bonding | Breakout rooms, broadcast message provided |
| Draw and Describe | Creative | Paper to camera (default), shared drawing app, or Zoom Whiteboard if enabled |
| Rapid-Fire Quiz | Quiz | Teams take turns by default; a miss passes it on. Open-floor shouting is a setting |
| Guess the Gibberish | Energy | Shout (open floor by default; turn order available) |
| Reverse Charades | Energy | Camera acting, guesser looks away |
| Two Truths and a Lie | Bonding | Chat, reactions, fingers or spokesperson vote |
| Five-Second Frenzy | Energy | Shout |
| Caption This | Creative | Captions by private chat, votes by chat |
| Rank It Together | Quiz | Main room or breakout rooms |
| Team Mission | Bonding | Clues by private chat or read aloud |
| Team Time Capsule | Reflection | Breakout rooms, responses saved |
| Appreciation Wall | Reflection | Messages by chat, moderated, revealed at once; never scored |
| Fact or Fiction | Quiz | Teams commit true or false, then hear the real story; streak bonus |
| Fake Definitions | Creative | Balderdash: invent a definition by chat, vote for the real one, learn a word |
| Wrong Answers Only | Creative | Funniest wrong answer by vote, then the real answer and a fun fact |

Built-in content: 70 quiz questions, 64 dilemmas, 48 gibberish puzzles, 90 charades words, 90 five-second prompts,
24 story topics, 16 ranking scenarios, 8 missions, 21 SVG scenes, plus prompts for the reflective games.
All content is workplace-safe and written for an international team.

## Adding custom questions

**In the app:** Content, then **Add item**. Pick the game, category, difficulty and fill the fields.
Built-in items can be edited (saved as an override) or disabled; custom items can be deleted.
"Restore built-in" undoes overrides and disables for a game.

**Import JSON:** an array of items or an export file. Each item needs `game` plus the game's required fields:

```json
[
  { "game": "quiz", "text": "Which planet spins clockwise?", "answer": "Venus",
    "options": ["Mars", "Venus", "Jupiter", "Mercury"], "correctIndex": 1, "category": "Science", "difficulty": 2 },
  { "game": "gibberish", "text": "CAW FEE BRAKE", "answer": "Coffee break", "category": "Office Life", "difficulty": 1 },
  { "game": "fivesec", "text": "Name 3 pizza toppings", "category": "Food" },
  { "game": "wyr", "text": "Would you rather A or B?", "a": "A", "b": "B", "category": "Funny" },
  { "game": "rankit", "text": "Rank these by size", "items": ["Moon", "Earth", "Sun"], "answer": ["Sun", "Earth", "Moon"], "mode": "objective" },
  { "game": "images", "title": "A boat", "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 300\">...</svg>", "use": ["draw"] }
]
```

**Import CSV:** header row with `game,text,answer,category,difficulty,...`. List fields (options, items, answer for
rankit, clues, hints, use) are `|`-separated. Rows without a `game` column use the game selected in the import dialog.
Invalid rows are rejected with a row number and reason; valid rows still import.

Game keys: `quiz`, `wyr`, `gibberish`, `charades`, `fivesec`, `truths`, `rankit`, `missions`, `images`, `factfiction`, `balderdash`, `wronganswers`,
`whosaid` (backup prompts), `commonground`, `capsule`, `appreciation`, `captions`.

Selecting exact items for a run-sheet activity: Session Builder, Configure, **Choose exact items**.

## One place for settings

**Settings** is the answer to "what can I change?". Everything global lives there. Two kinds of setting
deliberately stay where they apply and are linked from Settings instead:

- **Per-activity settings** (Session Builder → Configure). A run sheet can hold the same game twice with
  different settings, which is a feature, so these cannot be global without losing it.
- **Participants, teams and team names** (Participants), because they change during the session.

To stop reconfiguring the same game every time, use **Settings → Activity defaults**: set Rapid-Fire Quiz to
8 questions at 25 seconds once, and every quiz you add from then on starts that way. Only the keys you
changed are stored, existing run-sheet activities are untouched, and one tick applies the change to any
activity of that game still waiting in the current session. Games with your own defaults are badged in the
library and the activity picker.

## Scoring is secondary

Connection activities (Common Ground, Team Time Capsule, Appreciation Wall) ship with scoring **off**: the point
of them is the conversation, not the points. Quizzes, gibberish, charades, five-second and the reveal games still
score normally. Any activity's scoring can be switched per instance in its Configure dialog.

The session can end either way, set in Settings or from the toggle on the Results screen:

- **Podium** ranks the teams, with medals, awards and a tie-breaker suggestion.
- **Shared achievement** shows what the whole group did (activities finished, people in the room, points earned
  together) with no ranking at all. This is also what the presentation shows when scoring is off for the session.

The private turn-taking panel exists so opportunities get spread fairly. It is never published: not on the
presentation, not on the results screen, not in the exported summary.

## Using the Zoom presentation window

1. Open the console and click **Open presentation window**. A second browser window opens with `#presentation` in its address.
2. The console shows **Presentation connected**. If the browser blocked the pop-up, allow pop-ups and press Retry,
   or open the same file in a new tab and add `#presentation` to the address: it connects automatically.
3. In Zoom, share **the presentation window only** (Advanced, "Window", pick it) and tick "Share sound".
4. Keep the console on your own screen. A banner sits on every facilitator screen: **green** when the presentation
   is connected and safe to share, **amber** while it is opening or after it drops, **red** when there is no
   presentation window at all. The participant window contains no navigation and no controls of any kind.
5. If the presentation window closes or drops, the console shows **disconnected**; press Reconnect. The game keeps running.

The presentation shows only: branding, activity name, public instructions, prompts, allowed images, public timers,
team names, public scores (if enabled), answers after reveal, breakout instructions, round results and final standings.
It never shows answers before reveal, facilitator notes, solutions, hidden identities or controls.

Sync uses direct `postMessage` over the window handle (works on `file://`), with `BroadcastChannel` and a
`localStorage` event as fallbacks. Timers are sent as timestamps, so both windows count down in step.

## Keyboard

Console: **Space** start/pause the round timer, **Ctrl/Cmd+Z** undo, **Shift+Ctrl/Cmd+Z** redo.
Per game (shown on buttons): **R** reveal, **N** next, **1 to 4** award team, **C** correct, **P** pass, **G** go, **H** hit, **M** miss, **D** discussion or draw, **J** judge.
Shortcuts never fire while typing in a field.

## Development

Source lives in `src/` as plain scripts on a shared `window.TCL` namespace. `src/manifest.json` sets load order.

```bash
node build/build.js     # writes team-connect.html (single file) and dev.html (loads src/ files individually)
./serve.sh [port]       # serves the folder on http://localhost:8080 for a live session
```

Tests (Playwright, Chromium). Playwright is not a dependency of this project; the runner locates an existing install:

```bash
node tests/run.js       # behaviour suite, writes tests/artifacts/results.json
node tests/edge.js      # adversarial sweep: hostile input, extremes, leakage, corruption
node tests/shots.js     # visual QA screenshots into tests/artifacts/
```

The runner borrows Playwright from wherever it is already installed: a plain `require` first (so
`NODE_PATH` still works), then `~/.claude/skills/gstack/node_modules`, then a local `node_modules`.

See `docs/02-schema.md` for the data model and game-plugin interface, `docs/03-tests.md` for the latest results,
`docs/04-running.md` for `file://` versus `http://localhost`.

## Limitations

- Google Fonts are linked as an optional enhancement; offline, the app falls back to system fonts. Everything else is embedded.
- Zoom breakout rooms, reactions and chat are operated in Zoom by the facilitator. The app provides instructions, timers and copyable messages only.
- The presentation window was verified in Chromium (Playwright) over both `file://` and `http://127.0.0.1`. Safari and Edge use the same `postMessage` path but were not machine-tested in this build.
- Draw and Describe on a shared screen cannot show an image to one person only. "Everyone except the artist" mode relies on the artist looking away; "Describer only" mode keeps the image on the console and gives the facilitator a description to send by private chat.
- Storage is per browser. Use Settings, Export full backup, to move sessions between computers. Uploaded SVG images count toward the browser's storage limit (about 5 MB).
- Multi-choice quiz options are shown before reveal by design; the correct option is only highlighted after reveal.
