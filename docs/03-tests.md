# Test results (2026-09-03)

Runner: `tests/run.js` (Playwright 1.62, Chromium headless, 1280×800 plus 320/768 sweeps).
Commands: `node tests/run.js` and `node tests/edge.js` (the runner finds Playwright itself: plain `require` first, then the gstack install, then a local `node_modules`).

**Result: 402 assertions passed, 0 failed** in `tests/run.js`, plus **58 in `tests/edge.js`** (re-run 2026-09-03 after the facilitator-overload pass and the UI simplification pass: Simple mode, readiness check, rehearsal mode, running-late controls, share banner, breakout labels, participation tracking and the shared finale; 17 games, 618 content items, 6 presets). Raw output in `tests/artifacts/results.json`.

| Suite | Covers |
|---|---|
| boot | no runtime errors, 17 games, 618 content items, 6 built-in presets |
| funny-and-clever games | fact voting scores only correct calls, no double scoring on second reveal; definitions board has one real entry with language tag stripped, answer hidden while writing, +10 truth / +5 per fool; wrong answers funniest +10, runner-up +5, real answer revealed |
| wizard | preset load, sample roster, teams built, duration plausible |
| builder | configure modal with live summary, apply, duplicate, reorder, remove with confirmation, Auto-fit, save/load/rename/duplicate/delete preset, preview |
| participants | paste with locations, comma split, duplicate names disambiguated, long and special-character names, balanced teams, absent + rebalance, lock, late arrival joins smallest team, problems reported |
| edge cases | zero, one and two participants, more teams than people, empty team, safe fallback |
| every game | all 17 start, every action invoked, completion reached, presentation payload serialisable, status complete, no errors |
| quiz via UI | award, disabled repeat, scoring guard, reveal, undo/redo of points, N key, undo after next, answer hidden before reveal |
| timers | floor at zero, +30/−30, extend after time-up resumes, pause/resume, timestamp survival across reload, sleep beyond duration ends at 0 |
| recovery | unfinished session banner with five options, resume lands on the active activity |
| exit paths | pause, save, end keep, end discard (with second confirmation), reset, reopen, end session |
| presentation window | opens, connects, shows question, hides answer and private panels, reveal propagates, disconnect detected, reconnect without restarting |
| content manager | JSON/CSV import validation with row errors, invalid JSON, exact selection uniqueness, random uniqueness, shortfall reporting, disable/override/restore, CSV export |
| storage | corrupt JSON, newer schema, broken session objects, quota error surfaced |
| legacy | PRIME TIME v7 save imported (roster, attendance, teams, score totals) |
| scoring | no points message, shared first place with tie-breaker suggestion, ranks with ties, hide-until-finale |
| responsive | no horizontal overflow at 320, 768 and 1280 on eight screens |
| keyboard | Tab reaches nav, Enter activates, focus moves into modal, Escape closes |
| timers between activities | round timer reset, plural labels |
| duration model | overhead above count × timer, breaks and transitions add time |
| simple mode | Simple keeps start, undo and the mode toggle and hides configure, skip, score editing, notes and the Content nav; Advanced restores them and the choice persists |
| readiness check | ten rows; empty session reports participants and run-sheet blockers; a seeded session has none and warns about presentation, sound and backup; the console Start button opens the gate instead of the activity; acknowledging and starting sets `ready.checkedAt` |
| running late | over-target detected, all six options offered and ranked least disruptive first, one recommended, dry run reports real minutes, the running activity is never modified, shortening cuts the projection, dropping the break skips it, extend raises the target |
| rehearsal | six sample people, every game on the sheet, jump straight to a named game, round timer compressed, payload carries the flag, no content marked used, scoring works inside it, ending deletes it and returns to the real session with its scores untouched |
| share safety | banner red with no presentation, green once connected; the participant window contains zero buttons and zero nav elements |
| breakout rooms | Common Ground always labelled, quiz never, Rank It only when configured for breakouts; every present person lands in a room; broadcast message names rooms and the return instruction; the dialog opens from the run sheet |
| participation | turns recorded at the rotation helpers with role names, ordered least-picked first, not-yet list correct, absent from both the presentation payload and the exported summary |
| scoring secondary | Common Ground, Time Capsule and Appreciation Wall unscored by default while quiz and gibberish still score; an unscored activity awards nothing; shared finale sends no standings to the presentation and the results screen shows no podium |
| http://localhost | the built file boots over `http://127.0.0.1`, and the presentation window connects there as well as on `file://` |
| one primary action | exactly one gold button at every stage, and it moves: start timer → reveal → next → finish activity → mark complete |
| controls in menus | leave, restart, notes, history, score editing and turn taking all live inside overflow menus; the header carries one action plus the menu, the control row at most three buttons, the rail at most five; choosing an item closes the menu |
| plan versus play | the planning sidebar (Builder, Participants, Library) is replaced during a live session by Now playing / Run sheet / Scores / If something breaks; the run sheet is reachable without stopping the activity and participants keep seeing the activity; the recovery menu covers six situations |
| activity picker | no game cards sit permanently beside the run sheet; the picker holds all 17 and filters by search and by category; picking adds and closes |
| tiered settings | at most eight everyday fields visible, sixteen advanced ones collapsed, and a folded-away setting still applies when changed |
| presentation rules | the instruction list is on screen while you explain, comes off once a clock is running, and returns when you pause |
| live app settings | the scoring and score-visibility defaults seed the next session made and leave existing ones alone; no setting is stored that nothing reads; an old `confirmDestructive` preference carries over to `confirmRoutine` |
| duplicating a session | no run-state field survives the copy, checked field by field against a brand new session: no covered presentation, nobody still sitting out, no turn history, readiness tick, scores, discarded-scores flag or validation override; activities get fresh ids; per-team rotation pointers are cleared on the copy and kept on the original; no key survives on any team or participant that a freshly built one does not have, the baseline derived from `Teams.newTeam` / `Teams.newParticipant` rather than a hardcoded list; the plan (name, model, finale, score visibility, settings, notes, people, teams) carries over and the source session is undisturbed |
| turn order | a miss hands the question to the next team; a passed-on question is worth half; the team it lands on scores the reduced value; the team going first rotates with each question; once every team has tried it reveals instead of looping; the room is told whose turn it is; open floor puts nobody on the spot |
| speed bonus | full, then half, then nothing as the clock runs down; the bonus is its own score event so it can be undone separately; no bonus once a question has been passed on; the older flat half-clock mode still works |
| holding screen | one click covers the participant view; no prompt, answer, option, score or timer leaks through; the activity underneath keeps running; four presets plus a custom message; uncovering returns to exactly where the room was |
| scoring models | raw lets a 200-point quiz decide everything; balanced makes winning a short game worth as much as winning a long one; placement rewards consistency over one big haul; one activity scales to its own best score; raw events are never rewritten and stay readable alongside; manual corrections pass through in every model |
| between-activities screen | names the activity that finished, shows standings with the model that produced them, names and flags the next one, lists what to set up, makes starting it the primary action, offers the room plan and the cover-screen button, and reports unanswered items honestly |
| turn fairness | the suggestion is someone with no turns yet; put-next works once then clears; sitting out skips the rotation while keeping the person on the roster and out of suggestions; bringing them back restores them; the rotation never returns nobody even if everyone is marked out; none of it reaches the presentation payload |
| outcomes | nobody answered reveals without scoring and records why; a technical problem swaps the item and returns the question to the bank unused; skip-without-using-up leaves the question available; grace time adds ten seconds and keeps the clock going; time running out offers choices instead of forcing a transition |
| confirmations | a destructive confirmation always reaches the dialog, with the toggle off and even when a call site mistakenly also marks it routine; advisory confirmations go straight through when the toggle is off and return when it is on |
| settings hub | all nine sections present; the map jumps to Participants, Builder and Content; session name and length are editable from Settings; per-game defaults save only the changed keys, apply to newly added activities, leave existing ones alone, survive a reload and reset cleanly |

## Edge sweep (`tests/edge.js`, 58 assertions)

Where `run.js` proves the documented behaviour, this one tries to break it. Sections: hostile text
(a participant, team or session named `<img onerror=…>` is escaped, executes nothing and creates no
element); empty and tiny rooms (no people, one person over three teams, everyone absent); every game at
both ends of every numeric setting; content starvation (filters that match nothing); scoring models under
stress (all zero, three-way tie, negative-only activity, the ±100 bound, model switching never rewriting
events); turn-order edges (one team, 0% and 100% pass value, switching mode mid-activity); clocks
(pushed below zero, zero-length, absurd length); presentation leakage (every game checked for an
unrevealed answer outside its options block, plus an open-answer question that must not appear at all,
and notes / sitting-out / turn history never travelling); storage corruption and wrong-typed settings;
holding-screen and finale edges; and duplicate-of-a-duplicate plus duplicate-of-a-rehearsal.

It also covers malformed settings arriving from an imported preset or a restored backup: `passLimit: "two"`,
`passPercent: "fifty"`, `seconds: "quick"`, `speedBonusPoints: {}` and `minutes: []` must all fall back to
their defaults rather than becoming NaN.

It also feeds eight kinds of junk (`"abc"`, `{}`, `[]`, `null`, `undefined`, `""`, `NaN`, `"12abc"`) into
**every one of the 96 numeric settings across all 17 games**, and asserts each still estimates, renders
both screens, runs every action, drives its clocks and scores. That sweep found 292 failures on its first
run and now reports none.

Defects it found and that are now fixed: a full speed bonus awarded when the clock had never been started;
balanced scoring unbounded below, letting one activity subtract 300 championship points; turn order walking
a single question around all fifteen people in individual mode; and a dead `ctx.timerKey` lookup that
happened to work only because both games call their setting `seconds`.

Two reported failures turned out to be wrong assertions rather than bugs, and were verified before being
changed: a multiple-choice question shows every option including the right one by design (what is withheld
is `correct: -1`, the highlight), and a one-person session *is* blocked, by the readiness check rather than
by `Runner.validate`.

Visual QA: `tests/shots.js` captured every screen and seven game consoles with their presentation views
(`tests/artifacts/*.png`); reviewed for alignment, overflow, contrast and spacing. Issues found and fixed during review:
listener stacking on re-render (actions firing twice), round timer label leaking between activities,
"1 words" plural, truncated results table headers, 320px overflow on four screens, `<code>` overflow at 320px,
a "running late" warning firing in the opening minute of a session, and two gold buttons on the live run-sheet view.

Manual checks still recommended before the first live run: open the presentation window in Safari and Edge,
share it in a real Zoom call with "share sound" on, and run one full preset with the team. Rehearsal mode
now covers most of that solo: it is the same code path with sample people and fast timers.
