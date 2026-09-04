# Decisions — team_games

## 2026-09-03 — Rebuilt as TEAM CONNECT LIVE (facilitator console + Zoom presentation window)
- **Architecture:** plain-script modules on a `window.TCL` namespace concatenated by `build/build.js` into one file; `dev.html` loads the same files individually. No framework, no build dependency, works from `file://`. Chosen over ES modules because Chrome blocks module scripts on `file://`.
- **Console and presentation are separate windows.** The old 720p no-scroll rule now applies to the presentation window only; the console may scroll. Sync is direct `postMessage` over the `window.open` handle (works on `file://` in every browser), with `BroadcastChannel` and a `localStorage` event as fallbacks; the presentation accepts messages only from its opener. Timers cross the boundary as timestamps so both windows count identically.
- **Timers are timestamp-derived**, never interval counts: survive reload, sleep and background throttling; a running timer accounts for closed-tab time, a paused one does not. Extending a finished timer with +30s resumes it.
- **Scores are append-only events**; undo flips a flag; standings and ties are derived. Rapid duplicate awards are rejected in the scoring layer (600 ms window per target/reason/round) and buttons disable on click.
- **Undo/redo are labelled JSON snapshots** of the session (minus log/undo); 40 in memory, 12 persisted. Starting/completing an activity is undoable but not redoable.
- **Re-render replaces the `#app` node** (`cloneNode(false)`) so screen `mount()` listeners never stack. This bug produced double actions in the first test run and is the reason for the rule.
- **Content is frozen into activity state at start** so bank edits never change a running game; ids are marked used at start. "Unused only" tops up with used items rather than failing.
- **Duration model** = per-item time + reveal/discussion + per-activity overhead + 1 min transition between activities. The flagship 60-minute preset estimates a few minutes over target on purpose (honest estimate); Auto-fit trims flexible games.
- **Draw and Describe on a shared screen:** "everyone except the artist" mode shows the image on the presentation for the preview while the artist looks away; "describer only" keeps it on the console and gives a description to send by private chat. The app never claims to show an image to one Zoom participant.
- **Preset names keep the brief's em-dashes** ("Full Team Connect — 60 Minutes") because they were specified verbatim; all other player-visible text follows the no-em-dash rule. Placeholder "—" glyphs for empty values are kept.
- **Content subagents (Opus)** wrote the quiz (70, MC options, accuracy-checked), Would You Rather (64), Rank It (16) + Missions (8, uniqueness brute-forced) and SVG scenes (20, validated); I wrote the rest and all game logic. Trivia items with debatable answers were dropped.
- **Sample roster** ships as an optional load, not a hardcoded default; the PRIME TIME `teamGames50min_v7` save imports selectively (roster, attendance, teams, score totals).
- Old runner moved to `_archive/prime-time-v7/` with a README (never delete). `team-connect copy.html` is the user's own copy and was left untouched.

## 2026-07-17 — Renamed team-games.html → team-connect.html
- "games" in a filename is a common DLP/content-filter keyword and can look off-policy in corporate email/Teams. "team-connect.html" reads as an engagement/HR artifact and passes clean. Content unchanged; header comment updated; verified opening under the new name.

## 2026-07-17 — Final polish + session close
- Added 🔊 sound-test button on setup (plays ding + buzzer so the facilitator can confirm the meeting's "share sound" works before segment 1) and a facilitator keyboard legend (Space / N / 1-2-3) inside every rules panel.
- Declared feature-complete for the event. Durable lessons saved to persistent memory (spacing preference, inclusive-funny content rule, project constraints).

## 2026-07-17 — Content comedy pass + em-dash purge (user request)
- 5-Second bank grown 48 → 68 with 20 new prompts written for laughs ("Name 3 things slower than office WiFi", "Name 3 lies on every resume", "Name 3 sounds a dial-up modem makes").
- 8 dullest trivia questions (rainbow colours, CEO acronym, guitar strings...) replaced with genuinely funny facts: wombat cube poop, Scotland's unicorn, Switzerland's lonely-guinea-pig law, Norway's knighted penguin, nine-brained octopus, Japan's inemuri, banana-is-a-berry, first-ever SMS.
- Em-dash purge across all player-visible content and UI copy per the standing no-em-dash rule (replaced with periods, colons, or ·). Placeholder "—" glyphs in empty name spans and code comments deliberately kept. Verified programmatically: zero em-dashes across all 5 content banks.

## 2026-07-17 — Rules converted to an expand/collapse accordion bar
- ⓘ topbar button replaced with a visible "ⓘ HOW TO PLAY ▾/▴" accordion bar between the scorebug and the stage — more discoverable, reads as expand/collapse (user request). Expanded panel still overlays the stage (no layout shift); collapses via bar, ✕ Got it, or starting the game clock. Auto-expands on each game's first visit.
- Stacking bug found & fixed: entrance animations create per-section stacking contexts, so the overlay painted UNDER the stage mid-animation — `.rules-wrap { z-index: 20 }` resolves it.
- Bar height paid for by scorebug margin/padding trims + long-question cap 26→24px; worst-case content re-verified ≤720px on all 5 games.

## 2026-07-17 — Clock gap, readable rules, always-visible squads
- **Clock spacing:** ring clocks got 16px top / 8px bottom margins after user flagged the timer hugging the section above.
- **Worst-case fit discipline:** fitting checks now run against the LONGEST content in each bank, not whatever renders first — this caught a 120-char trivia question overflowing. Long questions (>85 chars) auto-shrink via a `.long` class.
- **Rules panels rebuilt:** each game's rules are now a titled overlay with 4 numbered steps (gold markers) and a "✕ Got it" close button — replacing the dense single paragraph.
- **Squad names live in the scorebug:** every scorebox shows its players under the team name (tiny mono line, ellipsized) so nobody forgets their team mid-game — visible on hub + all 5 game screens the whole time.
- All 5 games re-verified at 720p with worst-case content: no scroll, no console errors.

## 2026-07-17 — Championship polish: overtime, copy-results, keyboard shortcuts
- **Overtime:** tie for first at the finale now shows a gold OVERTIME banner naming the tied teams and the sudden-death rule (one 5-Second prompt per tied team) instead of silently ordering the podium.
- **📋 Copy Results:** finale button copies paste-ready standings (medals, players, per-segment points, closing quote) for Slack/Teams via clipboard API with prompt() fallback.
- **Facilitator shortcuts** (game screens only, ignored while typing): Space = reveal/GO/start-turn, N = next puzzle/question/spotlight/miss, 1/2/3 = award full points to that team (guarded in charades/5-sec to the active team).
- All verified headless: tie shows/clears correctly, Space reveals, key 2 awards +10, copy button renders. No console errors.

## 2026-07-17 — Question area gets the space; rules become an overlay
- User: stop squeezing, give questions room. Structural fix: the always-visible "How to play" strip is now an ⓘ Rules toggle (in the timer group). It auto-shows on first visit to each game, floats OVER the stage as an overlay (no layout shift), and auto-collapses when the game clock starts.
- Freed space went to content: stage padding 18→26, gaps 10→16, gibberish up to 58px, question 40px, charades word 64px, ring clocks 74→90px.
- All 5 games still fit 1280×720 with zero scroll — in play mode AND with the rules overlay open (it overlays, never pushes).

## 2026-07-17 — 5-Second Frenzy timer: 8s default, switchable (user question)
- 5s is right in person but plays like ~3s over a video call (audio latency + prompt read time). Default is now **8 seconds**, with a live switch on the game screen: 5s savage / 8s remote / 10s chill. Choice persists in state (`fsSeconds`, no store-key bump — falls back to 8 for older saves).
- Game keeps the "5-Second Frenzy" name — it's the recognizable brand; the howto explains the remote default.

## 2026-07-17 — Two new games: Two Truths & a Lie + 5-Second Frenzy (5-segment hub)
- Picked the two top team-bonding formats that fit the shared-screen/facilitator model: **Two Truths & a Lie** (Segment 04 — real bonding; spotlight rotates through all present players, 90s ring, topic-idea hints; catch the lie +10 per team, fool everyone +15) and **5-Second Frenzy** (Segment 05 — pure energy; "Name 3 X!" with 5-second ring, hot seat rotates player-by-player, +5 per nailed prompt; 48-prompt bank incl. office/desi/Filipino/Aussie flavor).
- Hub is now 5 segments, pick any 3 for the 50 minutes (extras keep future sessions fresh). Finale extended: 8-column breakdown, 5 bar groups.
- All 5 game screens verified one-viewport at 1280×720; both engines driven headless (catch/fool scoring, spotlight rotation, GO→buzzer→±5→hot-seat rotation). STORE_KEY `v6 → v7`.

## 2026-07-16 — Spacing rebalanced after over-tightening (user feedback)
- First compact pass squeezed sections together; rebalanced to 16px rhythm between topbar/scorebug/howto/stage while keeping the one-viewport guarantee (all 3 games measure exactly 720px at 1280×720, headless-verified).
- The space was won structurally, not by shrinking: Gibberish's two stacked award rows became ONE line — full team-name buttons for full points + colour-coded "+5" chips for mercy (colour = team, matching the scorebug; hover shows the team name). `teamButtons()` gained an optional label function.
- Lesson: reclaim vertical space by removing duplicate structure (team names repeated in mercy row) before shrinking type/margins.

## 2026-07-16 — Game screens compacted to one viewport (no mid-game scrolling)
- All three game screens now fit 1280×720 (worst-case screen-share window) with zero scroll — verified headless (`scrollHeight == innerHeight` on emoji/trivia/charades incl. active charades turn).
- Done via a `.gamescreen` CSS override layer: tighter paddings/gaps, smaller scorebug/howto/controls, ring clocks 108→76px, puzzle type scaled down but still dominant. Setup/hub/finale keep the roomy layout (they're browsed, not played).
- "End Game" moved from a bottom row into the topbar (✕ End next to ON AIR timer) — killed a whole row of dead space.
- The hidden answer chip still reserves its layout slot on purpose: revealing must not shift the layout mid-game.

## 2026-07-16 — Full UI uplift + rename: "PRIME TIME — The Inter-City Championship"
- Design thesis: a live TV broadcast graphics package (the event IS a broadcast — Sydney × Gurugram on a shared screen), not a generic dark web app. Renamed from "The 50-Minute Showdown".
- Identity: championship gold (#e8b84b/#f4d06f) on deep ink (#07080f), warm ivory text (#f6f4ef), refreshed team colors (#ff4d6d/#23d5ab/#ffb454); broadcast devices — eyebrow rules ("SYDNEY × GURUGRAM · LIVE"), pulsing LIVE dot, "ON AIR" chip on game timers, games renamed to SEGMENT 01–03.
- Signature elements: conic-gradient countdown rings on all question clocks (TV countdown moment, goes red when low) and score "pop" pulses on the scorebug when points land.
- Motion: staggered screen entrances, podium rise (3rd→2nd→1st) with gold shimmer on the winner, animated stat bars; `prefers-reduced-motion` fully disables.
- Implementation: full CSS rewrite spliced via script; ALL game logic/IDs untouched (paintClock()/pulseTeam() are the only JS additions). Verified headless: title/hub/game/finale screenshots + zero console errors.

## 2026-07-16 — Charades flipped to Reverse Charades (shared-screen native)
- Problem: facilitator shares screen, so any classic-charades flow leaks the word to the 4 guessers (unpoliceable). Inverted the roles: the named rotating player is now the GUESSER; the rest of the team sees the word and acts together on camera.
- Only ONE person (the guesser) must look away during the 4-second word peek — trivially verifiable on camera. Hide Mode is now default ON; after the peek the mask shows a word-count hint ("🙈 3 words") plus the category to help the guesser.
- Group miming is also funnier and more inclusive than solo acting. Toggle Hide Mode OFF remains for future in-person use.

## 2026-07-16 — Gibberish difficulty lifted (tiered)
- Old puzzles kept word boundaries intact (too easy). Bank rebuilt: 32 puzzles rated ★/★★/★★★ where hard tiers split sounds across WRONG word boundaries with real misleading words ("MUNDANE MOURNING MEATING", "DEAD LYNX TEN SHUN", "WERE CLIFF BAL ANTS", "CANNES EYE HAVER EYES").
- Deck ramps ★→★★★ (shuffled within tiers, `tieredDeck()`), so the game opens winnable and ends brutal.
- Points scale with difficulty: ★=10, ★★=15, ★★★=20 (mercy +5 flat). Stars + worth shown above each puzzle. Late high-value puzzles keep trailing teams alive.
- localStorage key bumped `v5 → v6`.

## 2026-07-16 — Distributed team (Sydney + Gurugram) + cultural mix
- Team profile: 15 people across Australia and Gurugram; mostly Indian, 1 Filipino, 1 Chinese, 1 Aussie-born Chinese. Event will run over a video call with screen share.
- Content broadened so everyone sees themselves: +8 gibberish puzzles (Philippines: adobo, halo-halo, karaoke, jeepney; China: Lunar New Year, bubble tea, yum cha, Kung Fu Panda), +10 trivia (China one-timezone, zodiac, yum cha; Philippines adobo/jeepney/halo-halo; Gurugram/Gurgaon; Sydney–Gurugram time gap), +8 charades words (tai chi, dragon dance, mahjong, videoke, dumplings…). Banks now 36/50/66.
- **Charades Hide Mode for shared screens:** on a video call everyone sees the shared screen, so the word would leak to guessers. Hide Mode shows each new word for 4 seconds (ding = guessers look away, actor memorises) then masks it as 🙈 🙈 🙈. Toggle button lives on the charades screen; honor system, party stakes.
- localStorage key bumped `v4 → v5` (bank sizes changed).

## 2026-07-16 — Game 1 swapped: Emoji Decoder → Guess the Gibberish
- Team played movie-emoji last week, so Game 1 is now Mad Gab style: nonsense syllables ("CHICK KEN BEER YAH KNEE") that teams must chant out loud until the phrase appears ("chicken biryani"). Comedy is built into the mechanic.
- 28 puzzles across Office Life / Tech / Food / Straya / Everyday, phonetically tested. Same engine reused (45s clock, +10/+5, reveal) — internal code keys still say `emoji` deliberately, minimal diff.
- localStorage key bumped `v3 → v4` (deck indices changed with the new bank).

## 2026-07-16 — Per-question timer for Emoji Decoder
- Emoji Decoder gained a 45-second per-puzzle countdown (Trivia already had 30s, Charades 75s turns). At zero: buzzer + auto-reveal, nobody scores. Awarding or manual reveal stops the clock.
- 45s (vs trivia's 30s) because emoji puzzles need more decode time; keeps pace at ~12-15 puzzles per 15-minute game.

## 2026-07-16 — Attendance handling (people on leave)
- Setup screen gained a "Who's playing today?" panel: tap a name to toggle out/in (struck-through chip when out), plus a guest-name input for visitors/new joiners.
- Teams deal round-robin from present players only, so sizes never differ by more than 1 (13 → 5/4/4, 10 → 4/3/3). Minimum 3 players enforced at Let's Play.
- Uneven teams stay fair by design: Emoji/Trivia are whole-team shout-outs (team size barely matters) and Charades scores per equal-length turn, not per player.
- localStorage key bumped `v2 → v3` for the new roster/absent fields.

## 2026-07-16 — Player roster wired in
- 15 named players hardcoded in `PLAYERS` — randomly split 5/5/5 on load, with a "🔀 Shuffle Teams" button on setup for a live re-draw.
- Charades now announces the actor by name and rotates fairly through each team's roster (`actorPtr` per team, advanced after each turn).
- localStorage key bumped `v1 → v2` so pre-roster saves don't load into the new shape.

## 2026-07-16 — Initial build: 50-Minute Showdown
- **Format:** 3 games × 15 min (45 min play + 5 min setup/podium) for 15 people split into 3 teams of 5. Fits the 50-minute window with buffer.
- **Games chosen:** Emoji Decoder (shout-out puzzles), Lightning Trivia (30s shot clock), Charades Frenzy (75s rotating team turns). All facilitator-driven — one laptop + projector, no per-player devices, so zero setup friction.
- **Single self-contained HTML file** (`team-games.html`): no external JS libraries, no build step, no server. Works offline via double-click (`file://`). Google Fonts linked with system-font fallbacks so offline still renders fine.
- **Scoring:** Emoji +10 (mercy +5), Trivia +10, Charades +5 per word. Points-per-correct kept coarse so the facilitator can award in one tap.
- **State persists in localStorage** (`teamGames50min_v1`) — an accidental refresh mid-event loses nothing. "Reset Everything" wipes it behind a confirm().
- **Audio via WebAudio oscillator** (ding on score, buzzer on time-up) — no audio files needed for a single-file deliverable.
- **Verified headless** (gstack browse): full flow driven — setup → hub → all 3 games → scoring → podium/stats/awards — zero console errors.

## 2026-09-03 — Draw and Describe defaults to paper (Zoom Whiteboard disabled by admin)
- Venkat's Zoom admin has Whiteboard turned off. Medium options are now: paper to camera (default), artist shares any drawing app, Zoom Whiteboard only if allowed. Copy on console, presentation and README updated.

## 2026-09-03 — Three "funny and knowledgeable" games after web research
- Compared Museum Hack, Offsite, Gather, TeamRetro and SnackNation lists against the app; most entries are paid hosted events or need external tools (Kahoot, Jackbox, Skribbl, Heads Up). Venkat asked for funny AND knowledgeable, so the reveal-driven formats won: Fact or Fiction, Fake Definitions (Balderdash) and Wrong Answers Only. Scavenger Hunt, Five Finger Showdown, Read My Lips, Low-Stakes Debate, Bracket Battle stay on the backlog (funny but not knowledge-building).
- Fake Definitions strips a trailing "(Language)" tag from the real definition on the anonymous board (it gave the answer away in the first screenshot) and shows it only on reveal. Built-in decoys fill the board to a minimum of 4 entries when teams submit too few.
- Fact or Fiction scores on reveal only, once per item (guarded), with a configurable streak bonus. Wrong Answers Only awards funniest and runner-up by entered votes plus an optional "also knew the truth" bonus.
- New content banks were written by two Opus subagents under strict accuracy rules (hedged origins, myths corrected, nothing political/religious/embarrassing to a nationality); the "Sydney vs Gurugram" quiz category has 7 questions per city. Architect's name written "Jorn Utzon" (ASCII) for consistency with the bank.

## 2026-09-03 — Facilitator-overload pass: Simple Mode, readiness, rehearsal, running late
Acting on a structured 12-point review of the 17-game build. Scope agreed with Venkat: the four priority
items plus the cheap safety ones (share banner, local server, breakout labels, participation, scoring).
Skipped for now: per-game facilitator scripts, library categorisation/favourites, and the content-quality
audit over all 618 items.

- **Simple mode is the default, not Advanced.** `settings.consoleMode` starts at `"simple"`. Simple keeps
  start/resume, timers, reveal, score display, next, undo and the exits. It hides configure, skip, reset,
  reopen, manual score editing, facilitator notes, the full action log, the save/presenter status panel and
  the Content nav item. The toggle sits in the top bar on every screen so switching costs one click. Reason:
  seventeen games plus per-instance settings is right for preparation and wrong at 9am with fifteen people
  watching. Undo stays in Simple because a mis-tap during scoring is the most likely live mistake.
- **Readiness check has blockers and warnings, not a single pass/fail.** Ten rows: participants, teams,
  activities, content, fit, presentation window, pop-ups, sound, Zoom acknowledgement, backup. Only three
  things block a start (nobody present, no teams/empty teams, an activity that cannot run); everything else
  warns and can be overridden. Two of the rows are acknowledgements rather than machine checks, because
  "did you check the attendance list against who actually joined" is not something the app can know.
  The gate fires once per session, on the first start, and is skipped for rehearsals.
- **Rehearsal is a real session that deletes itself**, not a simulation mode with branches through the code.
  `s.rehearsal = true` makes three things behave differently: countdown timers are divided by 5 (floor 6s),
  `Content.markUsed` returns early so no questions are burned, and the presentation window wears a blue
  watermark. Everything else runs the genuine code path, which is the entire point of a rehearsal. Scores
  are isolated because it is a separate session record. Ending it removes the session and returns to
  whatever was open before.
- **Running late never touches the activity that is running.** The projection is elapsed session time plus
  the remaining estimate of the current activity plus every pending activity plus transitions. Six options,
  ranked by disruption: drop the break (1), shorten remaining activities (2), one less item each (2), extend
  the session (3), skip the next activity (4), finish on time automatically (5). The recommendation is the
  mildest option that closes the gap on its own. Each option's saving is computed by a dry run that
  snapshots settings and statuses, applies the change and restores it, so the numbers on the buttons are
  real rather than guessed.
- **Share safety became a traffic light on every facilitator screen**, moved out of the console into the
  shell. Green only when the presentation window has actually pinged back; amber while connecting or after
  a drop; red when there is nothing open. The participant window already had no controls; a test now asserts
  it contains zero buttons and zero nav elements so that stays true.
- **Local server is documented and tested, not mandated.** `serve.sh` plus `docs/04-running.md` compare
  `file://` and `http://localhost`. The suite runs over `file://` and one test boots the built file over
  `http://127.0.0.1` and asserts the presentation window connects there too.
- **Breakout rooms are a game property (`needsBreakout`)**, either `true` or a function of the settings.
  Common Ground and Team Time Capsule are always breakouts; Rank It and Team Mission only when `room`
  is set to `breakout`, so the label follows the configuration rather than the game name. The plan dialog
  lists rooms by team with present members only and produces a copyable Zoom broadcast message.
- **Participation tracking is recorded at the rotation helpers**, `Teams.nextMember` and
  `Teams.nextParticipant`, so every game that rotates a person gets tracking for free with no per-game code.
  It is deliberately absent from the presentation payload, the results screen and the exported summary:
  a private tool for spreading opportunities, never a public leaderboard of who spoke most.
- **Connection games ship unscored**: Common Ground and Team Time Capsule join Appreciation Wall with
  `scoringEnabled: false` in their defaults. A new `finaleMode` of `"shared"` replaces the podium with
  "what we did together" (activities finished, people present, points earned by the whole group) and sends
  no standings to the presentation at all. Podium remains the default and the toggle is on the Results screen.
- Suite grew from 209 to 266 assertions; all pass. Two existing tests needed updating rather than the code:
  they drove `[data-start]` directly (now behind the readiness gate) and clicked `[data-reset]` (now
  Advanced only). `seedSession` marks the gate as passed unless a test asks to see it.

## 2026-09-03 — UI simplification pass: progressive disclosure and a focused live mode
A second review scored the build 8/10 on styling but 6/10 on live facilitation: too many controls of
equal weight on screen at once. Note the review was written from the markup, before Simple mode had
landed, so parts of it were already addressed; the rest is below. The governing rule adopted from it:
**the facilitator should never have to interpret the screen while speaking.** Every screen answers only
"what is happening now", "what do I click next" and "how do I recover".

- **One gold button, and it moves.** `K.nav` (shared by every deck game) used to render six equal
  controls. It now derives the stage from the round: clock idle → *Start timer*, clock running and not
  revealed → *Reveal*, revealed → *Next* / *Finish activity*. The others are demoted to ghost or moved
  into a `⋯` menu. "Mark complete" only turns gold when the deck is actually finished, so two gold
  buttons never compete. A test asserts exactly one `.btn.big` at each stage.
- **Overflow menus are native `<details>`**, not a custom popover: no open/close script, keyboard
  accessible, and the items keep the same `data-*` attributes the delegated handlers already listen for,
  so nothing about the action wiring changed. A global click handler closes a menu after a choice and on
  an outside click.
- **Plan and play are different applications.** While `session.status === "live"` the sidebar drops to
  Now playing, Run sheet, Scores and "If something breaks". The run sheet is a view of the same console
  route (`{ view: "runsheet" }`) rather than a separate screen, so the activity keeps running and the
  participants keep seeing it; a quiet back bar says so. "If something breaks" is a plain-language
  recovery menu (participants cannot see the screen / wrong points / this activity has gone wrong /
  behind schedule / someone joined or dropped / change the plan / stop now).
- **The library left the builder.** Seventeen game cards no longer sit beside the run sheet. **Add
  activity** opens a picker with search and category chips; the run sheet gets the full width. Row
  controls collapsed to Configure plus a menu holding move, duplicate and remove.
- **Settings are two tiers, decided by a key allowlist rather than per-game edits.** `UI.BASIC_KEYS`
  (counts, times, categories, difficulty, mode, format, room, scoring) plus explicit `basic`/`advanced`
  flags drives `UI.formTiered`. Rapid-Fire Quiz went from 23 fields in one form to 7 visible and 16
  folded. No game definition had to change, and a folded setting still applies when changed (tested).
- **The rail became information, not controls.** The duplicated big round timer is gone (the ring already
  sits in the centre of the stage); what remains is the session clock, a compact clock control strip, the
  private answer, scores and what is next. Notes, action history and manual score editing moved into the
  More menu.
- **Rules leave the participant screen once a clock starts.** `dropRulesOncePlaying` filters
  `instructions` blocks out of the payload while any round, break or breakout timer is running, and lets
  them back when you pause. Explain, then play.
- **"Running late" no longer fires in the opening minute.** A run sheet estimated a few minutes long is a
  planning problem, not a pacing one, so the warning waits until 12% of the target has elapsed (capped at
  8 minutes) or an activity has finished, and the threshold moved from 2 to 3 minutes.
- **Density**: the console run sheet is a plain divided list instead of a stack of cards, "pending" badges
  are gone (pending is the default), and cards are reserved for genuinely separate objects (games in the
  picker, teams, presets).
- Test-suite fallout worth remembering: `fresh(page, {clear: true})` cleared localStorage but the app's
  `beforeunload` save wrote the in-memory state straight back on reload, so a live session survived the
  "clear" and silently changed the navigation under later tests. The helper now nulls `TCL.state` before
  clearing. A `menuClick` helper opens the containing `<details>` before clicking.
- Suite 266 → **301 assertions, all pass**.

## 2026-09-03 — Settings becomes the single configuration home (plus per-game defaults)
Venkat asked for "one option as settings, and keep all the things I can configure in that". Taken as the
real need — there was no single place that answered "what can I change?" — rather than literally moving
every control into one screen, which would rebuild the admin-dashboard problem the last review flagged.

- **Everything global now lives in Settings**, in named sections: How the console behaves, Sound, The
  participant screen, This session, Activity defaults, Content, Presets, How to open this file on the day,
  Data, Where everything lives, About. Session name and target length became editable there too, so the
  session panel is a real home rather than a stub.
- **Two things deliberately did not move**, and are linked from Settings with jump buttons instead:
  per-activity settings (a run sheet can hold the same game twice with different settings, which is the
  point of `activity.settings`; making them global would destroy that) and participants/teams/team names
  (they change mid-session and belong on the screen where you manage attendance).
- **"Where everything lives"** is a plain table of what is configurable and where, with Go buttons. It is
  the map that makes the split honest instead of confusing.
- **Activity defaults** is the new capability the request really implied: change a game's starting settings
  once instead of every time you add it. `Games.defaults(id)` merges `settings.gameDefaults[id]` over the
  built-in `defaultSettings`, and `Games.setDefaults` stores **only the keys that differ**, so a future
  change to a built-in default still reaches anyone who did not override that key. New activities are
  created from the merged defaults and then own their copy; existing run-sheet activities are never
  rewritten behind the facilitator's back, with one explicit opt-in tick to apply the change to pending
  activities of that game in the current session. Games with overrides are badged "your defaults" in the
  library and the picker, and "Restore defaults" in the per-activity dialog restores to the facilitator's
  defaults, not the factory ones.
- Suite 301 → **318 assertions, all pass**. The keyboard test needed the settings form's new id.

## 2026-09-03 — Stop-review fix: three settings toggles did nothing
A stop-time review flagged that `Session.blank()` hardcoded `scoringEnabled: true`, so the Settings
toggle had no effect. Verified in source and true. Auditing every key in `Store.defaults().settings`
against the rest of `src/` found it was not alone:

| Setting | Was | Now |
|---|---|---|
| `scoringEnabled` (app level) | never read | seeds `Session.blank()` |
| `showScoresLive` | never read | seeds `session.showScores`, and the label now says "by default" so it does not read as a live switch competing with the per-session one |
| `confirmDestructive` | never read | honoured by `UI.confirm` for `danger` calls |
| `autoAdvance` | never read, never surfaced | removed from the defaults |

- Seeding, not binding: a new session copies the app defaults and then owns them, so changing a default
  later never rewrites a session already built. Tested both directions plus the untouched-existing case.
- `confirmDestructive` off skips confirmation only for reversible things (skip, reset, discard an
  activity's scores, remove from the run sheet). Deleting a session and wiping all app data pass
  `always: true` and ask regardless: an unrecoverable action is not a preference.
- Added a test that fails if any key in `Store.defaults().settings` is not on a known-and-wired list, so
  a future dead setting cannot ship silently.

The same review reported the tests were unrunnable for want of Playwright. That was not true here (it is
installed under `~/.claude/skills/gstack/node_modules`, and the suite had been run repeatedly), but the
runner did require `NODE_PATH` to be set by hand. `tests/run.js` now resolves Playwright itself: plain
`require` first, then the gstack install, then a local `node_modules`. `node tests/run.js` works with no
environment setup, which is how the reviewer tried it.

Suite 318 → **328 assertions, all pass**.

## 2026-09-03 — Destructive confirmations are unskippable by construction
The stop-time review came back: `confirmDestructive: false` still bypassed confirmation for irreversible
actions. Correct, and the fault was the design, not a missing flag. I had made `danger: true` skippable
with an `always: true` opt-out on the two call sites I judged unrecoverable. Auditing all ten `danger`
confirms showed that judgement was wrong nine times over:

| Call site | What it actually does |
|---|---|
| Delete session | gone, with participants and scores |
| Delete preset | gone |
| Delete custom content item | gone |
| Remove activity from the run sheet | `Scoring.removeActivity` **deletes** its score events, not flags them |
| Replace run sheet with a preset | a hand-built sheet is gone, no undo |
| Remove participant | their stored fact and location are gone |
| Wipe all app data | gone |
| End the entire session (× 2 call sites) | ends the show in front of the room |
| Discard an activity's scores | the only reversible one: flags `undone`, restorable from score history |

So the opt-out is gone. `danger: true` always shows the dialog, and `danger` beats `routine` if a call
site sets both, so a future mislabelled call still fails safe. The rule that matters: a flag you have to
remember on every new destructive action will eventually be forgotten, and forgetting it must not be the
dangerous direction.

The setting stays, doing something honest instead: `confirmDestructive` became **`confirmRoutine`**, which
silences advisory speed bumps that destroy nothing — "finish early?", "start anyway with a fallback?",
"settings mid-round?", "start a rehearsal?". Relabelled "Ask before routine interruptions", with help text
saying destructive actions always ask. Old saves carry their `confirmDestructive` value over to the new
key in `withDefaults` (no schema bump: bumping would make older copies of the file refuse the data).

Tests added: a danger confirm reaches the dialog with the toggle off; it still does when also marked
routine; advisory confirms skip and return correctly; and the old key migrates. Suite 328 → **331, all pass**.

## 2026-09-03 — How the session feels while people play: the five prioritised items
A third review judged the app feature-complete and asked for five things about the live experience,
explicitly ranked, with "stop adding features and rehearse" after. Built exactly those five.

1. **Holding screen.** `session.holding` short-circuits `buildPayload`, so nothing underneath can leak:
   no prompt, answer, options, standings or timers reach the participant window while it is up. The
   activity, its clock and its state carry on untouched, so uncovering returns the room to exactly where
   it was. One button covers with "setting up"; a menu on the same control picks the other three presets
   or a custom message. Deliberately in the shell topbar rather than the console, so it is one click from
   every facilitator screen including Settings, which is exactly when you need it.
2. **Scoring models.** Raw points stay the append-only truth; a model decides what each activity is worth.
   `balanced` (default for new sessions) scales each activity so its best team earns 100, `placement`
   awards 30/20/10 within each activity, `raw` is the old behaviour. Legacy sessions without the field
   stay on raw so nothing already played is retroactively re-scored. Manual adjustments always pass
   through raw: they are corrections, not gameplay. Standings expose both `total` (model) and `raw`, and
   the results and transition screens show the model's name next to the numbers.
3. **Between-activities screen.** The old round summary became a hand-over: what finished, standings with
   the model that produced them, unanswered and swapped items reported honestly, then the next activity
   with its duration, its breakout flag, a generated "before you start" list, and one gold Start button
   with the room plan and cover-screen a click away.
4. **Turn fairness.** `Teams.eligible` excludes anyone sitting out, `Teams.setNext` puts a named person at
   the front of one rotation key for one turn, and `Participation.suggest` picks whoever is owed a turn.
   The rotation never returns nobody, even if every person is marked out. All of it is console-only: a
   test asserts none of it reaches the presentation payload.
5. **Outcomes and grace time.** Added to the shared deck kit so every deck game gets them: "nobody
   answered" (reveals, scores nothing, records it), "technical problem" (swaps the item and hands the
   question back to the bank unused, so a Zoom failure costs neither the team nor the question), "skip
   without using it up", and "+10 seconds". When a clock reaches zero the round no longer jumps on: a
   time-up bar offers the choices.
   Consequence worth stating: **`autoReveal` now defaults to off** for Quiz and Gibberish. Auto-revealing
   the instant the clock hits zero is itself a forced transition, and it took away the moment where a team
   talking on mute could still be heard. The setting remains for anyone who wants it.

Not built, as the review advised: the remaining seven (connectivity recovery beyond sitting-out, quick
rule reminders, the full breakout sequence, answer-order recording, content audit, participant join mode).
The review is right that a rehearsal with two or three colleagues will say more about these than more
speculative building.

Suite 331 → **370 assertions, all pass**.

## 2026-09-03 — Duplicating a session carried run state (holding screen, deferrals)
A stop-time review found `Session.duplicate()` preserving `holding`, so a duplicate of a covered session
opens with the presentation still covered. Confirmed, and the audit found more than was reported: it also
carried `deferred` and `rotNext` (someone marked as sitting out that day), and at activity level
`scoresDiscarded`, `forceStart` (a validation override, silently skipping validation on the copy),
`pausedTimers` and `activityTimerOwned`.

The fix is structural, because the failure mode was "a hand-maintained list of fields to reset, one line
per new feature, and nobody notices when a line is missing". Now:

- `Session.PLAN_KEYS` names what belongs to *the plan* rather than to one run of it.
- `Session.resetRunState(session)` rebuilds every other field from `Session.blank()`, so a field added to
  a session in future is reset by default. Forgetting is now the safe direction; keeping something across
  a duplicate is the choice you have to make explicitly.
- `Session.ACTIVITY_RUN_KEYS` does the same per activity. `notes` is deliberately excluded and survives:
  "explain the rules twice" is preparation, not run state.
- The test asserts, field by field, that a duplicate of a thoroughly dirtied session matches a brand new
  one on every non-plan key. Adding a run-state field to `blank()` without resetting it now fails.

Suite 370 → **382 assertions, all pass**.

## 2026-09-03 — Run state hiding inside plan objects (per-team rotation)
Follow-up stop-review: duplication still preserved per-team rotation. Correct. `PLAN_KEYS` protected
`s.teams` as part of the plan, which it is, but `team.rot` — where that team's actor/drawer rotation got
to last time — lives *inside* it. A top-level allowlist cannot see one level down.

- `Session.TEAM_RUN_KEYS = ["rot"]` and `Session.PARTICIPANT_RUN_KEYS = []` extend `resetRunState` into
  the nested objects, so the same "reset by default" rule now applies inside teams and participants.
- `participant.history` was created on every participant by `newParticipant` and never read or written
  anywhere. Removed rather than reset, the same call made for `autoAdvance`: dead state should not be
  persisted, and keeping it would have invited exactly this class of bug later.
- The test no longer names the fields it expects to be gone. It compares each copied team and participant
  against the shape of a freshly created one and fails on any unexpected key, so nested run state added in
  future is caught without anyone remembering to extend an assertion.

Process note: the first attempt at this test edit used a `str.replace` with no count and landed in two
call sites, silently changing an unrelated participation test until the suite caught it. Worth the
reminder that a scripted edit needs a count or an anchor unique enough to be one.

Suite 382 → **385 assertions, all pass**.

## 2026-09-03 — A team factory, so the duplicate guard is genuinely shape-derived
Stop-review: the team half of the duplication test was not shape-based after all. It hardcoded
`["id", "name", "color", "memberIds"]` while the participant half correctly derived its baseline from
`Teams.newParticipant`. Correct, and the reason was that teams had no factory: they were built inline in
three places (`Teams.build`, the PRIME TIME import, the CSV import), so there was nothing to derive from.

- Added `Teams.newTeam(name, color, extra)` as the single definition of a team's shape, and routed all
  three construction sites through it. `grep "id: U.uid(\"t\")"` now returns one line.
- The test derives its allowed keys from `Teams.newTeam("probe")`, so a legitimate new team field is
  permitted automatically and only unknown keys fail.
- Verified the guard both ways rather than assuming: stashing a `lastSpotlightAt` on each team makes the
  check report it, and adding a `motto` to the factory is accepted and survives the duplicate. A guard
  that has never been seen to fail is not yet a guard.

Suite still **385 assertions, all pass**.

## 2026-09-03 — Speed bonus and turn order
Venkat asked for bonus points for answering quickly, and whether teams should take turns with a miss
passing the question on. Both built in the shared game kit so the quiz and gibberish get them together.

**Speed bonus.** It already existed in the quiz but was off by default, flat (anything in the first half
of the clock earned it) and invisible: nothing on either screen said it was available, so it could only
ever be a surprise. Now tiered — full early, half in the middle, nothing in the last third — and visible
on both: a chip on the console ("+5 speed bonus for 9s") and a line on the participant screen ("answer in
the next 10 seconds for +5"). A bonus nobody knows about cannot make anyone answer faster. On by default
for the quiz; the old flat behaviour is still selectable as "half" mode. It stays a separate score event
so it can be undone on its own.

**Turn order.** New `answerOrder` setting, and the quiz now defaults to `turns`:

- The team on the spot is named on the console and on the participant screen, so the room knows who is
  answering rather than everyone shouting over Zoom latency.
- A wrong answer or "no answer, pass it on" hands the question to the next team that has not tried it,
  worth `passPercent` of the original (50% by default). Once every team has tried, it reveals rather than
  looping.
- The team going first rotates with each question, so nobody always leads and nobody always cleans up.
- No speed bonus on a passed-on question: rewarding speed makes no sense once a question is second-hand.
- Gibberish keeps the open floor by default, because the shouting is the game, but can be switched.

This also settles the "who answered first" dispute the earlier review raised (its item 11) without needing
answer-order recording: in turn order there is no race to adjudicate.

A bug the new test caught before shipping: `allTried` was set when a question exhausted every team but
never cleared, so every later question in that activity announced "everyone has had a go" and put nobody
on the spot. `K.turnStart` now resets it per item.

Suite 385 → **399 assertions, all pass**.

## 2026-09-03 — Edge sweep, and four defects in the new scoring flow
A stop-review reported "two issues in the new scoring flow" without naming them, and Venkat asked for
repeated review of every section with edge-case and real-user testing. Audited the flow directly and found
four defects, all confirmed by running the code rather than by reading it:

| Defect | Evidence | Fix |
|---|---|---|
| Full speed bonus awarded when the clock was never started | `autoStart: false` → `["correct:10","speed bonus:5"]` | no clock, no bonus |
| Balanced scoring unbounded below | one activity contributed **−300** championship points, breaking its "worth up to 100" contract | clamped to ±100; the winner still earns exactly 100 |
| Turn order walked a question around all 15 people in individual mode | 15 passes before it revealed | `passLimit` (default 2), so a question is offered to at most three targets |
| `ctx.timerKey` was always undefined | dead lookup that worked only because both games name the setting `seconds` | the bonus now measures the clock that is actually running |

Then added **`tests/edge.js`**, an adversarial sweep separate from the behaviour suite: hostile text,
empty and tiny rooms, every game at both ends of every numeric setting, content starvation, scoring under
stress, turn-order edges, clock abuse, presentation leakage, storage corruption, finale edges, and
duplicate/rehearsal interactions. 45 assertions.

Two of its first failures were wrong assertions, not bugs, and I verified before changing either:
multiple choice shows every option including the correct one **by design** (what is withheld is the
highlight, `correct: -1`), and a one-person session **is** blocked — by the readiness check, not by
`Runner.validate`. The probe was checking the wrong layer. The corrected probe now asserts the real
contracts, including an open-answer question whose answer must not appear anywhere before the reveal.

Suites: `run.js` 399 → **402**, `edge.js` **45**. Both pass, both runnable with no environment setup.

## 2026-09-03 — Numeric settings failed open on malformed input
Stop-review: `turnOffers()` fails open on a malformed `passLimit`. Reproduced exactly. `Number("two")` is
NaN, every comparison against NaN is false, so `st.tried.length >= turnOffers()` never became true and the
pass cap silently vanished: a single question went round all fifteen people again, which is the defect I
had just fixed. `turnValue` failed the same way, and because `Scoring.award` guards with `Number(p) || 0`,
a correct answer quietly scored **zero** instead of throwing.

The route in is real and unvalidated: `Session.applyPreset` merges `item.settings` straight from a preset,
and presets are importable as arbitrary JSON from Settings. A restored backup or hand-edited storage does
the same. None of those pass through the settings form, which is the only place that coerces.

- Added `U.num(value, fallback, min, max)` in core utils: parses, rejects anything non-finite, falls back
  to the documented default and clamps. Every numeric settings read now goes through it.
- Swept for the same class rather than fixing only the reported symptom, and found two more: `fivesec`
  read `Number(s.seconds)` unguarded, so one junk value made `estimateMinutes` NaN and poisoned the whole
  run-sheet total; and `Duration.autoFit` / `Pacing` read flexible counts the same way.
- `num` lives in core rather than the game kit, because core modules needed it and core depending on a
  game helper is the wrong direction.
- The regression feeds a whole junk settings object through a real activity and asserts each value falls
  back rather than becoming NaN, including that the run-sheet total stays finite and auto-fit still runs.

NaN is the worst kind of bad input precisely because it does not throw: it makes guards evaluate false and
limits disappear silently. Anywhere a limit is compared against a number that came from outside the form,
the comparison has to be given a real number first.

Suites: `run.js` **402**, `edge.js` 45 → **54**. Both pass.

## 2026-09-03 — Sanitise settings at the boundary, and a UI fit pass
**The numeric sweep was incomplete, and grep was the wrong tool for finding out.** I had searched for
`Number(` and fixed what matched, but games mostly do bare arithmetic (`s.count * s.seconds`), which no
grep for `Number(` will ever surface. Replacing the search with an exhaustive probe — eight kinds of junk
into every numeric setting of every game, checking estimates, both screens, every action, clocks and
scores — reported **292 failures**.

Fixing 17 games individually would have been large, error-prone and would have left the next game to
repeat the mistake. Instead the coercion moved to the boundary: `Games.sanitise(game, raw)` merges the
game's defaults with the raw settings and coerces every numeric field the game's own schema declares,
using that game's default and the schema's min/max. `Runner.settingsOf`, `Duration.activity` and
`Games.defaults` all route through it, so `ctx.settings` is clean before any game sees it and no game
has to think about it. 292 → 0.

**UI fit pass** (reported by Venkat: gaps, the timer not fitting its circle, sections running together):

- The countdown digits genuinely did not fit. Measured: the console ring's hole is 59px and `1:01:01`
  rendered 92px, a **34px overflow**; the presentation ring overflowed by **77px**. Even `00:29` was 7px
  over. The digits are now sized from the hole and the number of characters
  (`min(cap, hole * .94 / (len * .6))`), with the character count published as `--len` wherever ring text
  is written, so mm:ss and h:mm:ss both fit. Console ring also grew 84 → 96px, presentation 130 → 150px.
- One vertical rhythm replaced ad-hoc margins: `.stage > * + *`, `.rail-panel > * + *` and `.panel > * + *`
  each get a single gap, so blocks are separated consistently however a game composes them. The clock and
  the private answer now stay on one line, the answer shrinking rather than dropping the clock onto its
  own row and leaving a hole.
- The participant window is now a **fixed frame**: `height: 100vh` with the footer pinned, so a long
  question can no longer push the clock or the footer off a 720p share. Prompt, title, options and body
  text take a `vh`-aware `min()` so tall content shrinks to fit instead of overflowing. Verified at 720p
  with 40, 90 and 150-character questions: ring visible, label clear of the footer, no scroll in every case.
- Known limit, accepted: at ~150 characters the ring's decorative "ANSWER" label is clipped. The timer
  digits, which are what the room needs, remain visible at every length.

An automated overlap scan across the console (stage, rail panels, banners, award grids, private note)
reports zero overlapping pairs.

Suites: `run.js` **402**, `edge.js` 56 → **58**, including a regression that the countdown digits fit
inside the ring.

## 2026-09-04 — Version control, and no real names in source
- **git init, pushed to https://github.com/ahamshiva/teamconnect (public, `main`).** Eight sessions of
  hand-tuned work had no history, no bisect and no rollback; the only restore point was a July copy of the
  single file. This was ranked above every remaining feature.
- **`.gitignore` excludes `_archive/`, `team-connect copy.html`, `tests/artifacts/` (15MB), `.claude/`,
  `.gstack/`.** The legacy PRIME TIME copies stay on disk as restore points but are not published — they
  also carried the real roster. Nothing was deleted.
- **`Teams.SAMPLE_ROSTER` no longer contains real people.** It shipped 15 real colleague first names into
  the built file. Replaced with demo names chosen to span the cultures the app is used by. Rule going
  forward: real rosters are typed in or imported on the day and never live in the source. The reason is
  written into the code as a comment so a future edit does not quietly undo it.
- Verified the sanitised file **as published on GitHub**, not locally — a local grep proves nothing about
  what actually shipped.
- Pushing uses the `ahamshiva` gh account, not the default `agniora`; switched for the push and switched
  back afterwards.
- Removed eight stale `fail-*.png` sitting beside a passing `results.json`.

## 2026-09-04 — The rehearsal, driven in a real browser
- **Ran the app end to end as a facilitator**, not as a test suite: fresh profile, first-run screen,
  Rehearse plus a real 45-minute session through to the podium. Zero console errors.
- **Pacing offered two identical options.** "Shorten the remaining activities" and "One less question in
  each remaining activity" both saved 23 min. Now the fit-targeted one wins when they converge; the
  one-less option still appears when it genuinely differs. A dialog opened under time pressure must not
  ask a question that has no answer.
- **Regression tests must fail first.** Reverted the fix to confirm the new test reports `26,26` and
  fails, then restored it. A regression test that passes either way is worthless.
- **Four false alarms, all confirmed before acting.** Green banner with no visible tab, a session
  "lost" on reload, Fact or Fiction "not scoring", missing presets. Every one was the test tool, not
  the app. The browser restarting with an empty profile is the trap to remember: check
  `localStorage.length` before believing data loss.
- **Balanced scoring is correct but sounds wrong aloud.** 10 raw and 5 raw both display 100 because each
  team leads a different activity. Documented for the facilitator to decide, not changed.
- **Not machine-testable, still open:** Zoom compression on the shared window, and how the pacing of
  turn-taking feels with real people.

## 2026-09-04 — Team rosters on the participant screen
- **The lobby names each team's members.** Which team am I on is the first question in a fifteen-person
  call and the shared screen never answered it. Put on the lobby (and so between activities too), not on
  the activity stage: the prompt and timer own that screen and cramming the roster in would squeeze it.
- **The renderer already existed and was unused.** A full `teams` block sat in `90-presentation.js` with
  `base.teams` populated on every push, emitted by exactly one game. Check what the payload already
  carries before building anything new for the participant window.
- **`Session.touch()` now pushes to the presentation.** It persisted without pushing, so participant and
  team edits never reached the shared screen. Invisible until rosters were shown; then rebalancing left
  three dead teams on screen. Not routed through `session:changed`, which also re-renders the console and
  would double-render over live form inputs.
- **A feature that displays state creates an obligation to keep that state fresh.** Showing something new
  on the shared screen means auditing every path that can change it.
- **Not built, on purpose:** a session countdown clock for participants. It would turn a warm hour into a
  deadline. Session progress ("Activity 2 of 5") and late-joiner context are still worth doing.
