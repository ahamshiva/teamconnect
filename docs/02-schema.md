# Data schema and game-plugin interface

Storage key: `teamConnectLive_v1` (localStorage). `v` is the schema version; `Store.load` runs ordered migrations
from `v` to `TCL.SCHEMA_VERSION`, keeps unreadable data under a `_corrupt_<timestamp>` key and never blanks the screen.
Data from a newer schema is left untouched and reported.

```
state
  v                     1
  settings              { sound, silent, volume, scoringEnabled, showScoresLive, hideScoresUntilFinale, largeText, presentationScale, autoAdvance, confirmDestructive }
  content
    custom[]            items added by the facilitator ({ id, game, category, difficulty, ...fields, custom:true })
    disabled[]          ids of built-in or custom items switched off
    overrides{id:patch} edits applied over built-in items
    usage{id:{count,lastUsed}}
    packs[]             { id, name, game, itemIds[] }
  presets[]             custom presets { id, name, targetMinutes, runSheet:[{kind, gameId, title, settings}] }
  sessions[]            full session objects (below)
  currentSessionId

session
  id, name, createdAt, updatedAt, status (draft | live | complete), targetMinutes, notes
  participants[]        { id, name, displayName, location, present, fact, history }
  teamMode              teams | individual
  teams[]               { id, name, color, memberIds[], rot{key:ptr} }
  teamsLocked
  runSheet[]            activity: { id, kind (game|break|custom), gameId, title, settings{}, status (pending|active|paused|complete|skipped),
                                    state (game runtime state, null until started), notes, startedAt, endedAt, scoresDiscarded }
  currentActivityId
  scoreEvents[]         { id, ts, activityId ("manual" for adjustments), teamId | participantId, points, reason, round, undone }
  timers                { session, activity, round, break, breakout } each { status, direction, durationMs, remainingMs, elapsedMs, startedAt, label, warnAtMs }
  log[]                 { ts, label, kind }
  undo                  { stack:[{label, snap, ts, safeRedo}], redo:[] }   (last 12 persisted, 40 in memory)
  rot                   session-level rotation pointers
```

Timers derive remaining time from `startedAt` timestamps, so background throttling or sleep cannot drift them;
a timer that was running when the tab closed accounts for the elapsed time on reload, a paused one does not.

Scores are append-only events; totals, standings and ties are derived. Undo flips `undone`.

## Game plugin interface (`TCL.Games.register`)

```
id, name, tagline, description, category, icon (inline SVG), contentGame (bank key or null), flexKey (setting Auto-fit may scale),
modes ['teams','individual'], needsZoom (short sentence shown on the console)
defaultSettings {}                         every setting with a default
settingsSchema []                          fields rendered by UI.form: range | number | select | toggle | text | textarea | checks
summary(settings, ctx) -> string           one-line description for the run sheet
estimateMinutes(settings, ctx) -> number   realistic estimate including reveal, discussion and transitions
validate(settings, ctx) -> [{level, message}]
init(ctx) -> state                         freezes selected content into state; contentIds are marked used
console(ctx) -> html                       facilitator view; buttons use data-act="action" data-arg="..."
presentation(ctx) -> blocks[]              public payload only: eyebrow | title | prompt | text | answer | options | banner | instructions | list | image | timer | teams | messages | mask
actions { name(ctx, arg) }                 mutate ctx.state; undo snapshot is taken automatically unless listed in noUndo
onTimerDone(ctx, timerName)                round / breakout / break timer reached zero
isComplete(ctx) -> bool
privateNote(ctx) -> html                   shown in the console rail, never sent to the presentation
summaryView(ctx) -> html, exportText(activity) -> string   optional round-summary and export extras
hotkeys { key: action | {action, arg} }, actionLabels {}, noUndo []
```

`ctx` gives the game: `session, activity, settings, state, teamMode, targets (teams or individuals), participants,
score(targetId, points, reason, round), scored(targetId, reason, round), events(), timer, breakout, content(query),
rotate(key), rotateTeam(team, key), name(pid), teamOf(pid), targetOf(pid), log(label)`.

Shared helpers in `src/activities/00-helpers.js` (`TCL.GameKit`): schema field factories, the content deck engine
(next/prev/skip/replace/reveal/hide), award rows with double-click and repeat guards, banners, copy boxes, estimates.
