# HANDOVER — team_games

## Where We Are (2026-09-04 session, part 18 · team rosters on the participant screen)
Venkat: the presentation window should name each team's members, otherwise people get confused.
Agreed, and it turned out the machinery was already built and unused. `90-presentation.js` has a full
`teams` block (name, colour bar, members) and `buildPayload` has always carried `base.teams`, but only
Common Ground's breakout brief ever emitted the block. So the answer to the first question in a
fifteen-person call was nowhere on the shared screen.

The roster now shows on the **lobby** screen, which is where people look longest and had the most empty
space, and it shows again between activities because that is the other moment the question comes back.
Individual mode shows none. Verified on a real 720p window at 3 and 6 teams: no overflow, card colours
match the scores sidebar so people can connect the two.

**Showing it immediately exposed a real bug.** Rebalancing 6 teams into 3 left the participant window
displaying all six, including three that no longer existed. `Session.touch()` persisted but never pushed,
so every participant and team edit was invisible to the shared screen; the window only caught up by
accident when something else changed the route. A stale roster is worse than no roster. `touch()` now
pushes. Deliberately not via `emit("session:changed")`, which would also re-render the console on top of
the live inputs on the participants form; `push()` no-ops when the public payload is unchanged, so it is
cheap. Verified live: 6 to 3 propagates with no navigation, a late joiner appears on their team.

Suite: 406 -> **412**. Both new assertions were checked against reverted code and fail without their
fixes. `edge.js` 58, unchanged. No console errors anywhere.

**Exact Next Step: still the real Zoom call with two or three colleagues.** Now with one more thing to
watch: whether the roster cards are readable once Zoom compresses the share. Contrast is fine on paper
(`#9aa0bd` on near-black is about 8:1) but compression is the untested variable, and the member names are
exactly the text people need most.

**Considered and not built:** session progress ("Activity 2 of 5") and a line of context for late
joiners. Both still worth doing. Argued against a session countdown clock on the shared screen: it turns
a warm hour into a deadline, and the facilitator already has the pacing tools.

**Files this part:** `src/core/{60-sync,40-session}.js`, `tests/run.js`, rebuilt `team-connect.html` +
`dev.html`.
**What is blocked:** nothing.
**Session cost:** roughly $4-6 USD.

## Where We Are (2026-09-04 session, part 17 · the rehearsal finally happened)
Drove the app end to end as a facilitator in a real browser: fresh profile, empty storage, first-run
screen onward. Two sessions played. The built-in **Rehearse** (17 activities, 5x timers) and a real
45-minute "Funny and Clever" session with 15 people and 3 teams, through to the podium.

**It holds up.** Zero console errors across the entire run. Private answers never crossed to the
participant window on any of the three games checked. The cover screen covers completely. Undo works.
The finish-early guard asks first. Breakout rooms produce a copyable Zoom broadcast. The finale handles
a tie as joint first with no phantom second place. Two things I did not expect to be as good as they
were: **a reload mid-activity recovers everything** (same activity, same item, same reveal state, same
scores, session clock still counting off its timestamp), and **closing the presentation window flips the
console straight back to the red do-not-share banner**.

**One defect found and fixed.** Running late offered "Shorten the remaining activities" and "One less
question in each remaining activity" as two options **both saving 23 min**, adjacent, same disruption
level. That dialog opens when you are already behind with the team watching, so two identical-looking
options is a decision under pressure with nothing to decide. Fixed in `src/core/37-pacing.js`, re-verified
on the live app, regression test added that fails without the fix. Suite 402 -> **406**.

**Four things looked like bugs and were not**, each confirmed before touching anything: the green
"connected" banner with no visible second tab (real, the popup just is not enumerable by the test
browser), a whole session vanishing after reload (the test browser restarted with an empty profile,
`localStorage.length` was 0), Fact or Fiction scoring nothing (votes are correctly refused after reveal
and the buttons are `disabled`, my scripted click bypassed that), and missing presets/uncover button
(accessibility-tree truncation in the tool, the DOM is correct).

**Exact Next Step: the part only people can do.** Two or three colleagues on a real Zoom. Watch three
things specifically: does **Balanced scoring** sound fair read aloud (after one question, teams on 10 and
5 raw points both showed **100**, which is exactly what Balanced promises but sounds wrong out loud, and
totals can fall as an activity progresses); does the presentation survive **Zoom's compression** (verified
at true 720p, but Zoom re-encodes the share and thin text smears in ways headless never shows); and is the
cover screen reachable fast enough when someone needs a minute.

**Full report:** `.gstack/qa-reports/qa-report-team-connect-2026-09-04.md` (18 screenshots).
**Deferred, low:** results panels go lopsided above ~10 activities (rehearsal only; a real 5-activity
session measured balanced at 559 vs 543px). The results score table scrolls rather than clips, but the
macOS scrollbar is invisible until touched.

**Files this part:** `src/core/37-pacing.js`, `tests/run.js`, rebuilt `team-connect.html` + `dev.html`.
**Suites:** `run.js` **406** · `edge.js` 58 · both pass.
**What is blocked:** nothing.
**Session cost:** roughly $6-9 USD.

## Where We Are (2026-09-04 session, part 16 · version control and a public repo)
Asked for further recommendations; ranked seven and said plainly that none of them beat the rehearsal,
which has been the next step for eight sessions. Top of the list was the structural risk: **8,779 lines of
source and no version control**, with a July copy as the only restore point. Fixed that.

`git init`, a real `.gitignore` (local tooling, 15MB of test screenshots, and the superseded PRIME TIME
copies stay on disk but out of the repo), and an initial commit of **78 files / 18,589 lines**, pushed to
**https://github.com/ahamshiva/teamconnect** (public, `main`).

A pre-push scan found the thing that mattered: `Teams.SAMPLE_ROSTER` shipped **15 real colleague first
names**, compiled into `team-connect.html` and quoted in `DECISIONS.md`. On a public repo that is the
team's roster published permanently. Venkat chose to swap them for generic demo names spread across the
cultures the app is used by (Ana, Bao, Chen, Deepa, Ellie, Farid, Grace, Hari, Ivy, Jomar, Kiran, Lian,
Mei, Nikhil, Omar), and the DECISIONS line was redacted. Rebuilt, both suites re-run, then verified the
**published** file over the GitHub API rather than trusting the local copy. No secrets, emails or absolute
paths anywhere in the tracked tree.

Also removed eight stale `fail-*.png` from `tests/artifacts/` that sat beside a passing `results.json` and
would have misled the next reader.

**Exact Next Step: the rehearsal. Still.** `./serve.sh`, **Rehearse**, then two or three colleagues on real
Zoom. Nothing left in the backlog outranks it.

**Recommended after that, in order:** fact-audit the ~260 claim-bearing content items (quiz 84,
factfiction 60, balderdash 48, wronganswers 44, rankit 16, missions 8 — no `verified` or `source` field
exists on any of them, and they get read aloud); a `@media print` run sheet so a dead laptop does not end
the session; a Zoom-compression contrast pass on the presentation, which only a real screen share can
judge; auto-backup when a session ends. A LICENSE file is missing and the repo is public.

**Files this part:** `.gitignore` (new), `src/core/33-teams.js`, `DECISIONS.md`, rebuilt
`team-connect.html` + `dev.html`.
**Suites:** `run.js` 402 · `edge.js` 58 · both pass, before and after the change.
**What is blocked:** nothing.
**Session cost:** roughly $2-4 USD.

## Where We Are (2026-09-03 session, part 15 · boundary sanitisation and a UI fit pass)
The numeric sweep really was incomplete: grepping for `Number(` cannot find bare arithmetic like
`s.count * s.seconds`. An exhaustive probe (eight kinds of junk into every numeric setting of every game)
reported **292 failures**. Rather than patch 17 games, the coercion moved to the boundary —
`Games.sanitise()` cleans every numeric field a game's schema declares, and `Runner.settingsOf`,
`Duration.activity` and `Games.defaults` all route through it. 292 → 0.

Then the UI issues Venkat reported. The **timer genuinely did not fit its circle**: measured a 34px
overflow on the console ring and 77px on the presentation. Digits are now sized from the hole and the
character count, so mm:ss and h:mm:ss both fit. Replaced ad-hoc margins with one vertical rhythm for stage,
rail and panel children. Made the participant window a **fixed frame** (`height: 100vh`, footer pinned,
`vh`-aware text sizes) so a long question can no longer push the clock or the footer off a 720p share —
verified at 40, 90 and 150 characters. An automated overlap scan across the console reports zero
overlapping pairs.

**Exact Next Step:** the rehearsal. `./serve.sh`, **Rehearse**, then two or three colleagues on real Zoom.
Look at the presentation window on the actual event laptop: the fit work was verified at 720p headless,
but a real screen share is the thing that has never been tested.

**Known limit:** at ~150-character questions the ring's decorative "ANSWER" label clips. The digits stay
visible at every length.

**Files this part:** `src/core/{50-games,34-duration}.js`, `src/ui/{00-kit,90-presentation}.js`,
`src/styles/{app,presentation}.css`, `tests/edge.js`, `docs/03-tests.md`.
**Suites:** `run.js` 402 · `edge.js` 58 · both pass.

## Where We Are (2026-09-03 session, part 14 · numeric settings failed open)
Stop-review: `turnOffers()` failed open on a malformed `passLimit`. Reproduced — `Number("two")` is NaN,
comparisons against NaN are always false, so the pass cap silently disappeared and a question went round
all fifteen people again. `turnValue` failed the same way and a correct answer quietly scored **zero**.
The route in is real: imported presets and restored backups merge settings that never passed through the
form's coercion. Added `U.num()` in core utils and routed every numeric settings read through it, then
swept for the same class and found two more (`fivesec` seconds poisoning the whole run-sheet estimate;
auto-fit and pacing reading flexible counts unguarded). Regression feeds a whole junk settings object
through a live activity. Suites: `run.js` **402**, `edge.js` **54**, both pass.

**Exact Next Step:** the rehearsal. `./serve.sh`, open `http://localhost:8080/team-connect.html`, click
**Rehearse**, then run a real session with two or three colleagues on Zoom.

**Files this part:** `src/core/{00-namespace,34-duration,37-pacing,50-games}.js`,
`src/games/{00-helpers,fivesec}.js`, `tests/edge.js`, `docs/03-tests.md`.
**What is blocked:** nothing.
**Session cost:** roughly $5-8 USD.

## Where We Are (2026-09-03 session, part 13 · edge sweep and four scoring defects)
Audited the new scoring flow after a stop-review, and ran the repeated section-by-section review Venkat
asked for. Found and fixed **four real defects**: a full speed bonus paid when the clock had never started;
balanced scoring unbounded below, so one activity could subtract 300 championship points; turn order
walking one question around all fifteen people in individual mode; and a dead `ctx.timerKey` lookup. Added
**`tests/edge.js`** (45 assertions), an adversarial sweep covering hostile text, empty rooms, every game at
its numeric limits, content starvation, scoring under stress, clock abuse, presentation leakage, storage
corruption, finale edges and duplicate/rehearsal interactions. Two of its first failures were wrong
assertions rather than bugs and were verified before changing: multiple choice shows all options by design,
and a one-person session is blocked by the readiness check rather than by `Runner.validate`.
Suites: `run.js` **402**, `edge.js` **45**, both pass, both need no environment setup.

**Exact Next Step:** the rehearsal, which is now the only thing left that machines cannot do.
`./serve.sh`, open `http://localhost:8080/team-connect.html`, click **Rehearse**, then run a real session
with two or three colleagues on Zoom.

**Files this part:** `src/games/00-helpers.js`, `src/core/31-scoring.js`, `src/games/{quiz,gibberish}.js`,
`tests/{run,edge}.js`, `README.md`, `docs/03-tests.md`.
**What is blocked:** nothing.
**Session cost:** roughly $8-12 USD.

## Where We Are (2026-09-03 session, part 12 · speed bonus and turn order)
Venkat asked for quick-answer bonus points and turn-based questioning. Both built in the shared game kit.
**Speed bonus** existed but was off, flat and invisible; now tiered (full early, half in the middle, none
at the end), on by default for the quiz, and shown on both screens — a chip on the console and a countdown
line on the participant screen. **Turn order** is new: `answerOrder` defaults to `turns` for the quiz, so
teams answer in rotation, a miss or a silence passes the question on for half the points, the team going
first rotates each question, and the participant screen names whose turn it is. Gibberish keeps the open
floor by default but can be switched. This also removes the "who answered first" dispute the earlier
review raised, without needing answer-order recording. Suite: 385 → **399 assertions, all pass**.

**Exact Next Step:** `./serve.sh`, **Rehearse**, and play one quiz round of each style back to back. Turn
order is calmer and fairer but slower; open floor is faster and louder. Decide which suits this team and
set it in Settings → Activity defaults so every quiz you add starts that way.

**Files this part:** `src/games/{00-helpers,quiz,gibberish}.js`, `src/styles/app.css`, `tests/run.js`,
`README.md`, `docs/03-tests.md`.
**What is blocked:** nothing.
**Session cost:** roughly $6-9 USD.

## Where We Are (2026-09-03 session, part 11 · team factory for a real shape guard)
Stop-review: the team half of the duplication guard hardcoded its key list while the participant half
derived one. True — teams had no factory, being built inline in three places. Added `Teams.newTeam()` as
the single definition of a team's shape, routed `Teams.build`, the PRIME TIME import and the CSV import
through it, and derived the test baseline from it. Then checked the guard both ways: a stray
`lastSpotlightAt` on a team is caught, and a `motto` added to the factory is permitted and survives.
Suite still **385 assertions, all pass**.
**Files:** `src/core/33-teams.js`, `src/ui/{10-home,20-participants}.js`, `tests/run.js`, `docs/03-tests.md`.

## Where We Are (2026-09-03 session, part 10 · nested run state on duplicate)
Follow-up stop-review: duplication still kept per-team rotation. True — `PLAN_KEYS` protects `s.teams` as
plan, but `team.rot` (where that team's actor rotation got to) lives inside it, and a top-level allowlist
cannot see one level down. Added `Session.TEAM_RUN_KEYS` / `PARTICIPANT_RUN_KEYS` so the reset-by-default
rule reaches nested objects, and removed `participant.history`, which was created on every participant and
never read. The test now compares each copied team and participant against a freshly created one and fails
on any unexpected key, rather than naming fields. Suite: 382 → **385 assertions, all pass**.
**Files:** `src/core/{40-session,33-teams}.js`, `tests/run.js`, `docs/03-tests.md`.

## Where We Are (2026-09-03 session, part 9 · duplicate carried run state)
Stop-review: duplicating a covered session kept `holding`, so the copy opened with the presentation still
covered. True, and the audit found more — `deferred`, `rotNext`, and per activity `scoresDiscarded`,
`forceStart`, `pausedTimers`, `activityTimerOwned`. Replaced the hand-maintained reset list with
`Session.PLAN_KEYS` + `Session.resetRunState()`, which rebuilds every non-plan field from `blank()`, so a
future field is reset by default and keeping something across a duplicate is now the explicit choice.
Activity `notes` deliberately survive (preparation, not run state). A test compares a thoroughly dirtied
duplicate against a brand new session field by field. Suite: 370 → **382 assertions, all pass**.
**Files:** `src/core/40-session.js`, `tests/run.js`, `docs/03-tests.md`.

## Where We Are (2026-09-03 session, part 8 · how the session feels while people play)
A third review called the app feature-complete and ranked five live-experience changes. Built exactly
those five, nothing else. **Holding screen** (one click from any facilitator screen covers the participant
view with one of four presets or a custom message; nothing underneath leaks and the activity keeps
running). **Scoring models** (balanced by default: each scored activity is worth up to 100, so a long quiz
cannot decide the championship; placement 30/20/10 and raw also available; raw points stay the truth
underneath and legacy sessions stay on raw). **Between-activities screen** (what finished, standings, what
is next, how long, breakout flag, what to set up, one Start button). **Turn fairness** (suggest who is
owed a turn, put a named person next, sit someone out without removing them). **Live outcomes** (nobody
answered, technical problem that swaps the item and keeps the question, skip without using it up, +10
seconds, and a time-up bar instead of the round jumping on). Side effect worth knowing: `autoReveal` now
defaults to **off** for Quiz and Gibberish, because auto-revealing at zero is itself a forced transition.
Suite: 331 → **370 assertions, all pass**.

**Exact Next Step — and the review's own advice: stop building and rehearse.** `./serve.sh`, open
`http://localhost:8080/team-connect.html`, then do a full run with two or three colleagues on a real Zoom
call. Watch specifically: does Balanced scoring feel fair when read aloud; is the holding screen reached
fast enough when someone needs a minute; does the between-activities screen give you what you need to
introduce the next game without reading the console.

**Not built (the review's other seven, deliberately deferred):** connectivity recovery beyond sitting-out,
in-game rule reminders, the full nine-step breakout sequence, answer-order recording, the manual content
audit, and participant join mode (which needs hosting and a backend, and is a different project).

**Files this part:** `src/core/{31-scoring,33-teams,39-participation,40-session,60-sync,10-store}.js`,
`src/games/{00-helpers,quiz,gibberish}.js`, `src/ui/{01-shell,60-console,40-library,70-results,90-presentation}.js`,
`src/styles/{app,presentation}.css`, `tests/run.js`, `README.md`, `docs/03-tests.md`.
**What is blocked:** nothing.
**Session cost:** roughly $12-18 USD.

## Where We Are (2026-09-03 session, part 7 · destructive confirmations made unskippable)
Second stop-review round: `confirmDestructive: false` still bypassed irreversible actions. It did, and the
design was wrong rather than a flag being missing. Audited all ten `danger` confirms: nine destroy
something no undo brings back (session, preset, custom question, an activity's score **events**, a
hand-built run sheet, a participant's stored fact) or end the session in front of the room; only
"discard this activity's scores" is restorable. Removed the opt-out entirely: `danger: true` always shows
the dialog, and `danger` beats `routine` so a mislabelled future call site still fails safe. The setting
was renamed `confirmDestructive` → **`confirmRoutine`** and now silences advisory speed bumps only, with
old saves carrying their value across. Suite: 328 → **331 assertions, all pass**.
**Files:** `src/ui/00-kit.js`, `src/core/10-store.js`, `src/ui/{01-shell,10-home,30-builder,40-library,60-console}.js`,
`tests/run.js`, `README.md`, `docs/03-tests.md`.

## Where We Are (2026-09-03 session, part 6 · stop-review fix: dead settings)
A stop-time review found `Session.blank()` hardcoding `scoringEnabled: true`, making the Settings toggle
inert. Confirmed, then audited every key in `Store.defaults().settings`: **three visible toggles did
nothing** (`scoringEnabled`, `showScoresLive`, `confirmDestructive`) and one dead default (`autoAdvance`)
was stored but never surfaced. All four fixed: the first two seed new sessions (copy-on-create, so
existing sessions are never rewritten), `confirmDestructive` is honoured by `UI.confirm` for reversible
destructive actions while deleting a session or wiping data always asks, and `autoAdvance` is gone. A new
test fails if any stored setting is not on the wired list. The runner now finds Playwright itself, so
plain `node tests/run.js` works with no `NODE_PATH`. Suite: 318 → **328 assertions, all pass**.
**Files:** `src/core/{40-session,10-store}.js`, `src/ui/{00-kit,10-home,40-library}.js`, `tests/run.js`,
`README.md`, `docs/03-tests.md`.

## Where We Are (2026-09-03 session, part 5 · Settings as the configuration home)
Venkat asked for one Settings place holding everything configurable. Built it as a hub rather than a dump:
all global settings now live in Settings under named sections (console behaviour, sound, participant screen,
this session, activity defaults, content, presets, local server, data, and a "where everything lives" map
with jump buttons). Session name and target length became editable there. Per-activity settings and
participants/teams stayed where they apply and are linked, because a run sheet can hold the same game twice
with different settings and teams change mid-session. The new capability that the request implied is
**Activity defaults**: set a game's starting settings once (Rapid-Fire Quiz at 8 × 25s), stored as only the
changed keys, applied to activities added from then on, existing ones untouched unless you tick to apply.
Suite: 301 → **318 assertions, all pass**.

**Exact Next Step:** unchanged: `./serve.sh`, open `http://localhost:8080/team-connect.html`, click
**Rehearse**, and run the loop once with the presentation window shared in a real Zoom call, sound on.
Worth doing first: set your own Activity defaults for the three or four games you actually plan to use.

**Not built (still open):** per-game facilitator scripts, library favourites with a recommended default
view, the content-quality audit over 618 items, and the suggested first-session lineup as a preset.

**Files this part:** `src/ui/40-library.js` (Settings rewritten), `src/core/{10-store,50-games,40-session}.js`,
`src/ui/30-builder.js`, `tests/run.js`, `README.md`, `docs/03-tests.md`.
**What is blocked:** nothing.
**Session cost:** roughly $4-6 USD.

## Where We Are (2026-09-03 session, part 4 · UI simplification pass)
A second review scored the app 8/10 on styling but 6/10 on live facilitation: too much on screen at once.
Ran a dedicated simplification pass on the rule that **the facilitator should never have to interpret the
screen while speaking**. Shipped: **one gold button at a time** that moves with the round (start timer →
reveal → next → finish → mark complete); **overflow menus** (native `<details>`) holding leave, restart,
notes, history, score editing and turn taking; **plan versus play** — the planning sidebar is replaced
during a live session by Now playing / Run sheet / Scores / "If something breaks", with the run sheet
viewable without stopping the activity; the **game library moved out of the builder** into an Add-activity
picker with search and category filters; **two-tier game settings** (Rapid-Fire Quiz: 7 visible, 16 folded)
driven by a key allowlist so no game definition changed; a **calmer rail** (information, not controls, with
the duplicated round timer removed); **rules leave the participant screen once a clock starts**; and the
"running late" warning no longer fires in the opening minute. Suite: 266 → **301 assertions, all pass**.

**Exact Next Step:** unchanged and now more worth doing: `./serve.sh`, open
`http://localhost:8080/team-connect.html`, click **Rehearse**, and run the whole loop once with the
presentation window shared in a real Zoom call, sound on. Watch specifically whether the single gold
button is genuinely the thing you want to press next in each game.

**Not built (still open from the two reviews):** per-game facilitator scripts (what to say, what to paste
into Zoom chat), library favourites and a six-game "recommended" default view, and the content-quality
audit over all 618 items. The reviewer's suggested first-session lineup is also not yet a preset.

**Files this part:** `src/ui/{00-kit,01-shell,30-builder,40-library,60-console}.js`,
`src/games/00-helpers.js`, `src/core/{37-pacing,60-sync}.js`, `src/styles/app.css`, `tests/run.js`,
`README.md`, `docs/03-tests.md`.
**What is blocked:** nothing.
**Session cost:** roughly $10-15 USD (one restructure, six headless test runs, three screenshot passes).

## Where We Are (2026-09-03 session, part 3 · facilitator-overload pass)
Acted on a 12-point review of the 17-game build. Venkat chose "priority 4 + safety items", so this session
shipped **Simple Mode** (now the default console: timer, reveal, score, next, undo, exit; Advanced restores
settings, resets, manual scoring and the action log), a **10-point readiness check** with real blockers and
overridable warnings, **rehearsal mode** (throwaway session, sample people, 5x timers, jump to any game,
no questions burned, deletes itself), **running-late controls** (live finish projection plus six ranked
fixes that never touch the running activity), a **green/amber/red share-safety banner** on every facilitator
screen, a **local-server option** (`serve.sh` + `docs/04-running.md`, tested over `http://127.0.0.1`),
**breakout-room labels** with room assignments and a copyable Zoom broadcast, **private turn tracking**
(never published), and **scoring made secondary** (Common Ground, Time Capsule and Appreciation Wall
unscored by default; a shared-achievement finale that ranks nobody). Suite: 209 → **266 assertions, all pass**.

**Not built (explicitly out of scope this session):** per-game facilitator scripts (what to say, what to
paste into chat), game-library categorisation with favourites and a six-game default view, and the
content-quality audit over all 618 items.

**Exact Next Step:** run `./serve.sh`, open `http://localhost:8080/team-connect.html`, click **Rehearse**
and practise the whole loop once with the presentation window shared in a real Zoom call, sound on. Then
build the first real session from the suggested lineup (Would You Rather 5 min, Who Said That 10, Common
Ground 10, Draw and Describe 12, Wrong Answers Only 10, Team Time Capsule 8, Appreciation Wall 5) and run
the readiness check against it.

**Files this part:** new `src/core/{36-readiness,37-pacing,38-rehearsal,39-participation}.js`; rewritten
`src/ui/{01-shell,60-console}.js`; edited `src/core/{10-store,20-timers,32-content,33-teams,40-session,50-games,60-sync}.js`,
`src/ui/{10-home,30-builder,40-library,70-results,90-presentation}.js`, `src/games/{commonground,capsule,rankit,mission}.js`,
`src/styles/{app,presentation}.css`, `src/manifest.json`, `tests/run.js`, `README.md`, `docs/03-tests.md`;
new `serve.sh`, `docs/04-running.md`.
**What is blocked:** nothing.
**Session cost:** roughly $12-18 USD (one build pass, five headless test runs, three screenshot passes).

## Where We Are (2026-09-03 session, part 2 · funny-and-clever games)
Researched current virtual team-building lists, then added three reveal-driven games Venkat asked for ("funny, knowledgeable"): **Fact or Fiction** (60 statements, streak bonus), **Fake Definitions** (Balderdash, 48 words across Aussie/Indian/Filipino/Chinese/English/office/science vocab, decoys, anonymous board), **Wrong Answers Only** (44 questions with real answers and fun facts). Added a "Sydney vs Gurugram" quiz category (14) and a "Funny and Clever — 45 Minutes" preset. Library is now 17 games, 618 content items, 6 presets. Suite: 209 assertions pass. Draw and Describe defaults to paper because the Zoom admin disabled Whiteboard.

**Exact Next Step:** unchanged: dry-run on the event laptop (try the Funny and Clever preset), check the presentation window in Safari and in a real Zoom share with sound on.
**Files this part:** src/games/{factfiction,balderdash,wronganswers}.js, src/content/{factfiction,balderdash,wronganswers}.js, src/content/quiz.js (+14), src/presets.js, src/manifest.json, tests/run.js, tests/shots-clever.js, README.md, docs/03-tests.md.
**Not built (ranked backlog from the research):** Lightning Scavenger Hunt, Five Finger Showdown, Read My Lips, Low-Stakes Debate, Bracket Battle, Ghost in the Zoom, Things.

## Where We Are (2026-09-03 session · TEAM CONNECT LIVE rebuild)
The single-screen PRIME TIME runner was rebuilt from the ground up into **TEAM CONNECT LIVE**, a facilitator platform for Zoom sessions: 14 configurable games, participants and teams, a run sheet with a realistic duration model and Auto-fit, a content manager with usage history and import/export, timestamp timers, undo/redo with an action log, a separate participant-facing presentation window synced by postMessage, five presets, recovery, results export and a Playwright test suite (187 assertions, all passing). The old file is archived at `_archive/prime-time-v7/`.

**Note (2026-09-03):** Zoom Whiteboard is disabled by the admin; Draw and Describe now defaults to paper-to-camera with a shared-drawing-app option.

**Exact Next Step:** open `team-connect.html`, create a session from "Full Team Connect — 60 Minutes", open the presentation window, and dry-run one activity of each type on the event laptop. Then test the presentation window once in Safari and once inside a real Zoom share with sound on (the only two things not machine-verified).

**Files:** `team-connect.html` (built single file), `dev.html` (loads `src/` individually), `src/` (core, ui, games, content, styles, manifest), `build/build.js`, `tests/run.js`, `tests/shots.js`, `tests/artifacts/`, `README.md`, `docs/01-inspection.md`, `docs/02-schema.md`, `docs/03-tests.md`, `_archive/prime-time-v7/`.
**What is blocked:** nothing.
**Session cost:** roughly $25-35 USD (large single-session build, four content subagents, ~8 headless test runs).

## Where We Are (2026-07-17 session, part 9 · FINAL CLOSE)
File renamed team-games.html → **team-connect.html** for compliance-friendly sharing (verified working under the new name; header comment, records, and memory updated). Nothing else changed. The product is complete and staged: open team-connect.html, hit 🔊 Test sound, tap out anyone on leave, run the show.

## Where We Are (2026-07-17 session, part 8 · SESSION CLOSE)
Final touches: 🔊 sound-test button on setup, keyboard legend in all rules panels. PRIME TIME is feature-complete and event-ready: 5 games, 216 content items, live scores/stats/podium, overtime, copy-results, shortcuts, all verified headless at 720p with worst-case content and zero console errors.

**Exact Next Step:** open team-connect.html (renamed from team-games.html for compliance-friendly sharing) on the event laptop, click 🔊 Test sound with the meeting's "share sound" on, tap out anyone on leave, and run the show (suggested lineup: 5-Second Frenzy → Gibberish → Two Truths & a Lie).

**Files:** team-games.html (the entire product), DECISIONS.md, HANDOVER.md, .claudeignore.
**Session cost (both days):** roughly $8-12 USD across build, redesigns, and ~15 headless verification passes.

## Where We Are (2026-07-17 session, part 7)
Comedy pass: 5-Second bank 48→68 prompts, 8 dull trivia swapped for weird-fact bangers, all em-dashes purged from player-visible content and UI copy (verified zero across banks). No console errors. Event-ready.

## Where We Are (2026-07-17 session, part 6)
Rules are now an expand/collapse accordion bar ("ⓘ HOW TO PLAY ▾/▴") between scorebug and stage; panel overlays the stage, auto-opens first visit, collapses on clock start. Fixed a stacking-context bug (panel under stage during entrance animation). Worst-case fits re-verified on all 5 games at 720p, no console errors.

## Where We Are (2026-07-17 session, part 5)
Clock breathing room added (16px above ring), rules rebuilt as titled 4-step numbered overlays with ✕ Got it, squad names now permanently visible under each team in the scorebug on all screens, long trivia questions auto-shrink. Worst-case content fit audit passes on all 5 games at 720p. No console errors.

## Where We Are (2026-07-17 session, part 4)
Championship polish on user's "anything else?": OVERTIME tie banner at finale (sudden-death rule on screen), 📋 Copy Results button (Slack/Teams-ready text), facilitator keyboard shortcuts (Space/N/1-2-3). All headless-verified, no console errors. The file is fully event-ready.

## Where We Are (2026-07-17 session, part 3)
Question area de-squeezed: howto strip converted to ⓘ Rules overlay (auto-open first visit, overlays stage, collapses on clock start), freed space given to bigger puzzle text (58/40/64px) and 90px ring clocks. All 5 games fit 720p in both states, headless-verified, no console errors.

## Where We Are (2026-07-17 session, part 2)
5-Second Frenzy timer made adjustable after user flagged 5s as too tight for remote: default 8s, live 5/8/10s switch chips under the ring, persisted in state. Verified headless (default, switching, countdown, viewport fit), no console errors.

## Where We Are (2026-07-17 session)
Added Segment 04 "Two Truths & a Lie" (spotlight rotation, 90s ring, +10 catch / +15 fool) and Segment 05 "5-Second Frenzy" (48 prompts, 5s ring, GO→judge flow, per-player hot seat). Hub = 5 segments, pick any 3. Finale stats extended to 5 games. All screens fit 720p, both engines headless-verified, no console errors. Store key v7.

## Where We Are (2026-07-16 session, part 12)
Top-section spacing opened further on user feedback (22px rhythm: screen top / topbar / scorebug / howto), paid for inside the stage (clock 80→74px, stage padding 20→18). All 3 games still exactly 720px at 1280×720 — no scroll, verified, no console errors.

## Where We Are (2026-07-16 session, part 11)
Spacing rebalanced after "too squeezed" feedback: 16px section rhythm restored, Gibberish award rows merged to one line (team buttons + colour-coded +5 mercy chips), all 3 game screens still exactly 720px at 1280×720 — no scroll, headless-verified, no console errors. Event-ready.

## Where We Are (2026-07-16 session, part 10)
Game screens compacted to fit one 1280×720 viewport with no scrolling: `.gamescreen` CSS override layer (smaller type/spacing/clocks), End Game moved into the topbar. Verified headless: all three games report scrollHeight == innerHeight at 720p, screenshot confirms everything visible, no console errors. File is event-ready.

## Where We Are (2026-07-16 session, part 9)
Complete UI uplift + rename to "PRIME TIME — The Inter-City Championship": broadcast-TV identity (championship gold on ink, ON AIR timers, LIVE dot, SEGMENT 01–03, eyebrow rules), conic-ring countdown clocks, score-pop pulses, staggered entrances, podium rise + gold shimmer, reduced-motion support. Logic untouched. Verified headless across all screens, no console errors.

## Where We Are (2026-07-16 session, part 8)
Charades reworked as Reverse Charades for the shared-screen meeting: rotating player = guesser (looks away during 4s peek, verifiable on camera), whole team acts together on camera, Hide Mode default ON, mask shows word-count + category hints. Banner, howto, hub card updated. Verified headless: peek → "🙈 3 words" mask cycle works, no console errors.

## Where We Are (2026-07-16 session, part 7)
Gibberish difficulty lifted: 32-puzzle bank in 3 tiers (★ warmup → ★★★ brutal with misleading word boundaries), deck ramps easy→hard, points scale 10/15/20 with stars and worth shown per puzzle. Verified headless: deck strictly tier-ordered, star/points display correct, +20 award lands. Store key `teamGames50min_v6`.

## Where We Are (2026-07-16 session, part 6)
Adapted for the real team: distributed Sydney + Gurugram over video call, culturally mixed (Indian majority, Filipino, Chinese, Aussie-born Chinese). Content banks broadened with Philippines/China/Gurugram material (36 gibberish / 50 trivia / 66 charades) and Charades gained Hide Mode for shared screens (4s auto-peek per new word, then 🙈 mask). All verified headless incl. the full peek→mask→toggle cycle, no console errors. Store key `teamGames50min_v5`.

## Where We Are (2026-07-16 session, part 5)
Game 1 is now "Guess the Gibberish" (Mad Gab) replacing Emoji Decoder — the team did movie-emoji last week. 28 phonetic puzzles (office/tech/food/Aussie/desi), same 45s clock and scoring engine. Hub card, game screen, and final-stats labels all re-skinned. Verified headless render + reveal + timer, no console errors. Store key `teamGames50min_v4`.

## Where We Are (2026-07-16 session, part 4)
Every question is now timed: Emoji Decoder got a 45s per-puzzle countdown (auto-reveal + buzzer at zero, clock stops on award/reveal, resets each puzzle). Trivia (30s) and Charades (75s turns) already had theirs. Verified headless end-to-end, no console errors.

## Where We Are (2026-07-16 session, part 3)
Absentee handling added: attendance panel on setup (tap names out/in, add guests), auto-rebalanced teams from whoever's present (max size difference of 1), min-3-players guard. Verified headless: 13 present → 5/4/4 with absent names excluded, guest add → 5/5/4, re-add → 5/5/5, charades actor works on uneven teams, no console errors. Store key now `teamGames50min_v3`.

## Where We Are (2026-07-16 session, part 2)
Roster integrated: the 15 real team members are in the file, auto-split into 3 random teams of 5 with a Shuffle button, rosters shown as chips on setup, and Charades calls each actor by name in fair rotation. Verified headless — 5/5/5 split, all 15 unique, actor rotation works, no console errors. localStorage key bumped to `teamGames50min_v2`.

## Where We Are (2026-07-16 session, part 1)
`team-games.html` is complete and verified: a single offline HTML file running a 50-minute, 3-game team event for 15 people (3 teams of 5) with live scores, per-game 15-minute timers, stats, final podium, and fun awards.

## What Was Done Last Session
- Built `team-games.html` — setup screen (editable team names), game hub, three games (Emoji Decoder, Lightning Trivia, Charades Frenzy), final standings with podium, score-breakdown table, points-by-game bars, 3 fun awards, confetti.
- Content banks: 31 emoji puzzles, 40 trivia questions, 60 charades words (mixed AU/Indian/office humour).
- localStorage persistence, WebAudio ding/buzzer, responsive layout for projector or laptop.
- Verified end-to-end in headless Chromium (gstack browse): navigation, scoring, timers, turn rotation, final screen — no console errors.
- Added `.claudeignore`, `DECISIONS.md`, this file. Not a git repo (single-file deliverable; init git if the project grows).

## What Is Blocked
Nothing.

## Exact Next Step
Dry-run the event once solo: open `team-games.html`, click through one puzzle per game to learn the facilitator buttons (~3 minutes), then run it live with the team.

## Files Changed This Session
- `team-games.html` (new)
- `.claudeignore` (new)
- `DECISIONS.md` (new)
- `HANDOVER.md` (new)

## Session Cost
~$1.50–2.50 USD estimated (single build + headless verification pass).
