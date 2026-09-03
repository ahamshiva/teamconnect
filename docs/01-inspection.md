# Phase 1: Inspection of the existing implementation (2026-09-03)

Source: `_archive/prime-time-v7/team-connect.html` (1947 lines, single file).

## What it is
Single-screen event runner. The facilitator shares the whole browser window, so every
game screen doubles as the audience view. Five games, 15 hardcoded players, three
teams, 15 minutes per game, localStorage key `teamGames50min_v7`.

## Reused in the rebuild
| Asset | Reuse |
|---|---|
| Gibberish bank (32 puzzles, tiered) | Reviewed, deduped, moved to `src/content/gibberish.js` |
| Trivia bank (50) | Reviewed for accuracy, given multiple-choice options, moved to `src/content/quiz.js` |
| Charades words (66) | Moved to `src/content/charades.js` with difficulty tags |
| Truth topic hints (12) | Expanded in `src/content/truths.js` |
| 5-Second prompts (68) | Moved to `src/content/fivesec.js` |
| Round-robin team dealing | Rewritten in `src/core/teams.js` (n teams, manual moves, locking) |
| Visual identity (gold on ink, three fonts, conic clocks, score pop) | Carried into `src/styles/` |
| WebAudio ding/buzzer | `src/core/audio.js` with silent mode |

## Not carried forward
- Interval-count timers (drift on sleep, no pause state) -> timestamp timers.
- Single shared screen -> console + presentation window.
- Hardcoded roster -> participant manager (old names offered as a sample roster).
- Team-level scores only -> score event log with undo.
- Fixed 3 x 15 min -> run sheet with duration model.

## Save migration
`teamGames50min_v7` shape: `{ roster[], absent[], teams[{name, players[], scores{}, corrects{}}], played{}, decks{}, deckPos{}, gameTimeLeft{}, ... }`.
Importable safely: roster, absent, team names, team membership, per-game score totals.
Not importable: decks and positions (content ids changed), timers.
