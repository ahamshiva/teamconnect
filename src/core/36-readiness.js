/* src/core/36-readiness.js
   Pre-session readiness check. Every item returns a level:
     ok      - nothing to do
     warn    - the facilitator may override and start anyway
     blocker - starting would fail or embarrass someone; must be fixed
   Nothing here changes the session; it only reports. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const R = TCL.Readiness = {};

  R.ack = function (key, on) {
    const s = TCL.session(); if (!s) return;
    s.ready = s.ready || {};
    s.ready[key] = on !== false;
    TCL.Session.touch();
  };
  R.acked = function (key) { const s = TCL.session(); return !!(s && s.ready && s.ready[key]); };

  /* One check helper so every row has the same shape. */
  function row(id, label, level, detail, fix) { return { id, label, level, detail: detail || "", fix: fix || null }; }

  R.check = function (session) {
    const s = session || TCL.session();
    if (!s) return [];
    const out = [];
    const present = TCL.Teams.present(s);

    /* 1. Participants */
    if (!present.length) out.push(row("participants", "Participants confirmed", "blocker", "Nobody is marked present.", "participants"));
    else if (present.length < 2) out.push(row("participants", "Participants confirmed", "warn", "Only one person is present. Most activities need at least two.", "participants"));
    else if (!R.acked("participantsConfirmed")) out.push(row("participants", "Participants confirmed", "warn", `${present.length} present, ${s.participants.length - present.length} marked away. Tick this once you have checked the list against who actually joined.`, "participants"));
    else out.push(row("participants", "Participants confirmed", "ok", `${present.length} present.`));

    /* 2. Teams balanced */
    if (s.teamMode === "individual") out.push(row("teams", "Teams balanced", "ok", "Individual mode: no teams needed."));
    else if (!s.teams.length) out.push(row("teams", "Teams balanced", "blocker", "No teams exist. Build teams or switch to individual mode.", "participants"));
    else {
      const sizes = s.teams.map(t => TCL.Teams.presentMembers(t, s).length);
      const empty = s.teams.filter((t, i) => sizes[i] === 0);
      const spread = Math.max.apply(null, sizes) - Math.min.apply(null, sizes);
      if (empty.length) out.push(row("teams", "Teams balanced", "blocker", `${empty.map(t => t.name).join(", ")} ${empty.length === 1 ? "has" : "have"} nobody present.`, "participants"));
      else if (spread > 1) out.push(row("teams", "Teams balanced", "warn", `Team sizes are ${sizes.join(" / ")}. Rebalance for a fairer game.`, "participants"));
      else out.push(row("teams", "Teams balanced", "ok", `${s.teams.length} teams of ${sizes.join(" / ")}.`));
    }

    /* 3. Games configured */
    if (!s.runSheet.length) out.push(row("runsheet", "Activities configured", "blocker", "The run sheet is empty.", "builder"));
    else {
      const errs = [], warns = [];
      s.runSheet.filter(a => a.kind === "game" && a.status === "pending").forEach(a => {
        TCL.Runner.validate(a).forEach(p => { (p.level === "error" ? errs : warns).push(`${a.title}: ${p.message}`); });
      });
      if (errs.length) out.push(row("runsheet", "Activities configured", "blocker", errs.join(" · "), "builder"));
      else if (warns.length) out.push(row("runsheet", "Activities configured", "warn", warns.slice(0, 3).join(" · ") + (warns.length > 3 ? ` (+${warns.length - 3} more)` : ""), "builder"));
      else out.push(row("runsheet", "Activities configured", "ok", `${U.plural(s.runSheet.length, "activity", "activities")}, no problems found.`));
    }

    /* 4. Content available */
    const short = [];
    s.runSheet.filter(a => a.kind === "game").forEach(a => {
      const g = TCL.Games.get(a.gameId); if (!g || !g.contentGame) return;
      const st = TCL.Runner.settingsOf(a);
      const want = Number(st.count || st.rounds || st.turns || st.items || 0);
      if (!want) return;
      const sel = TCL.Content.select({ game: g.contentGame, count: want, categories: st.categories, difficultyMin: st.difficultyMin, difficultyMax: st.difficultyMax });
      if (sel.pool < want) short.push(`${a.title}: ${sel.pool} of ${want} items match the filters`);
    });
    if (short.length) out.push(row("content", "Content available", "warn", short.join(" · "), "content"));
    else out.push(row("content", "Content available", "ok", "Every activity has enough content for its settings."));

    /* 5. Fits the target */
    const d = TCL.Duration.runSheet(s);
    if (d.over > 2) out.push(row("fit", `Session fits within ${U.fmtMin(d.target)}`, "warn", `Estimated ${U.fmtMin(d.total)}: ${U.fmtMin(d.over)} over. Use Auto-fit, or plan to use Running late during the session.`, "builder"));
    else if (d.spare > 12) out.push(row("fit", `Session fits within ${U.fmtMin(d.target)}`, "warn", `Estimated ${U.fmtMin(d.total)}: ${U.fmtMin(d.spare)} spare. Add an activity or shorten the target.`, "builder"));
    else out.push(row("fit", `Session fits within ${U.fmtMin(d.target)}`, "ok", `Estimated ${U.fmtMin(d.total)}.`));

    /* 6 & 7. Presentation window and pop-ups */
    const ps = TCL.Presenter.status;
    if (ps === "connected") out.push(row("presentation", "Presentation window connected", "ok", "Share that window in Zoom, not this one."));
    else if (ps === "blocked") out.push(row("presentation", "Presentation window connected", "warn", "The browser blocked the pop-up. Allow pop-ups for this page, or open the file in a second tab and add #presentation to the address.", "presentation"));
    else out.push(row("presentation", "Presentation window connected", "warn", "Not open yet. Open it before you start sharing your screen.", "presentation"));
    out.push(ps === "blocked"
      ? row("popups", "Pop-ups allowed", "warn", "Pop-ups are blocked for this page.", "presentation")
      : row("popups", "Pop-ups allowed", "ok", ps === "connected" ? "The presentation window opened normally." : "No pop-up block detected yet."));

    /* 8. Sound */
    const st8 = TCL.state.settings;
    if (st8.silent) out.push(row("sound", "Sound tested", "ok", "Silent mode is on, so no cues will play."));
    else if (st8.soundTested) out.push(row("sound", "Sound tested", "ok", "Ding and buzzer played."));
    else out.push(row("sound", "Sound tested", "warn", "Play the test cue once so the browser unlocks audio before the meeting.", "sound"));

    /* 9. Zoom instructions acknowledged */
    const breakouts = R.breakoutActivities(s);
    out.push(R.acked("zoomAck")
      ? row("zoom", "Zoom screen-sharing steps acknowledged", "ok", breakouts.length ? `${breakouts.length} activities need breakout rooms.` : "No breakout rooms needed.")
      : row("zoom", "Zoom screen-sharing steps acknowledged", "warn", `Share the presentation window only, tick "Share sound", and keep this console on your own screen.${breakouts.length ? ` ${breakouts.length} activities need breakout rooms: ${breakouts.map(a => a.title).join(", ")}.` : ""}`, "zoom"));

    /* 10. Backup */
    const last = TCL.state.settings.lastBackupAt;
    if (!TCL.Store.available) out.push(row("backup", "Backup saved", "warn", "Browser storage is unavailable, so nothing is being saved. Export a backup if you need a record.", "backup"));
    else if (last) out.push(row("backup", "Backup saved", "ok", "Last export " + U.fmtDate(new Date(last).toISOString()) + "."));
    else out.push(row("backup", "Backup saved", "warn", "No backup exported yet. One click saves a JSON copy of everything.", "backup"));

    return out;
  };

  /* Activities that need Zoom breakout rooms with the settings they currently hold. */
  R.breakoutActivities = function (session) {
    const s = session || TCL.session(); if (!s) return [];
    return s.runSheet.filter(a => {
      if (a.kind !== "game") return false;
      const g = TCL.Games.get(a.gameId); if (!g || !g.needsBreakout) return false;
      if (g.needsBreakout === true) return true;
      try { return !!g.needsBreakout(TCL.Runner.settingsOf(a)); } catch (e) { return false; }
    });
  };
  /* Does one game definition ever use breakout rooms? "always" | "sometimes" | null */
  R.breakoutKind = function (g, settings) {
    if (!g || !g.needsBreakout) return null;
    if (g.needsBreakout === true) return "always";
    if (settings) { try { return g.needsBreakout(settings) ? "always" : null; } catch (e) { return "sometimes"; } }
    return "sometimes";
  };

  R.verdict = function (rows) {
    rows = rows || R.check();
    const blockers = rows.filter(r => r.level === "blocker");
    const warnings = rows.filter(r => r.level === "warn");
    return { rows, blockers, warnings, canStart: blockers.length === 0, clean: !blockers.length && !warnings.length };
  };

  /* Breakout room plan: one row per team with its present members, plus a broadcast message. */
  R.breakoutPlan = function (activity, session) {
    const s = session || TCL.session(); if (!s) return { rooms: [], text: "" };
    const rooms = s.teams.map((t, i) => ({ room: i + 1, name: t.name, members: TCL.Teams.presentMembers(t, s).map(p => p.displayName || p.name) })).filter(r => r.members.length);
    const title = activity ? activity.title : "Breakout";
    const mins = activity && activity.settings ? (activity.settings.breakoutMinutes || activity.settings.minutes || activity.settings.seconds / 60) : null;
    const text = [`${title.toUpperCase()}${mins ? ` · ${Math.round(mins)} minutes in your breakout room` : ""}`, "",
      ...rooms.map(r => `Room ${r.room} · ${r.name}: ${r.members.join(", ")}`),
      "", "Come back to the main room when the timer ends."].join("\n");
    return { rooms, text };
  };
})();
