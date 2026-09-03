/* src/core/50-games.js
   Game registry + Runner (activity lifecycle, ctx, actions, exits, timers). */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Games = TCL.Games = {};
  const registry = [];
  const REQUIRED = ["id", "name", "description", "defaultSettings", "settingsSchema", "estimateMinutes", "init", "console", "presentation", "actions", "isComplete"];

  Games.register = function (def) {
    const missing = REQUIRED.filter(k => def[k] == null);
    if (missing.length) { console.error("[TCL] game", def.id, "missing", missing.join(", ")); return; }
    def.modes = def.modes || ["teams", "individual"];
    def.validate = def.validate || (() => []);
    def.category = def.category || "Quiz";
    def.needsBreakout = def.needsBreakout || false;   // true, or fn(settings) for "only with these settings"
    registry.push(def);
  };
  Games.get = id => registry.find(g => g.id === id) || null;
  Games.list = () => registry.slice();
  /* A game's defaults, with the facilitator's own overrides from Settings folded in.
     Overrides apply to activities added from now on; existing ones keep their own settings. */
  Games.defaults = function (id) {
    const g = typeof id === "string" ? Games.get(id) : id;
    if (!g) return {};
    const over = (TCL.state && TCL.state.settings && TCL.state.settings.gameDefaults) || {};
    return Games.sanitise(g, Object.assign({}, g.defaultSettings, over[g.id] || {}));
  };
  Games.hasOverrides = function (id) {
    const over = (TCL.state && TCL.state.settings && TCL.state.settings.gameDefaults) || {};
    const o = over[typeof id === "string" ? id : id.id];
    return !!(o && Object.keys(o).length);
  };
  Games.setDefaults = function (id, patch) {
    const g = Games.get(id); if (!g) return;
    const over = TCL.state.settings.gameDefaults = TCL.state.settings.gameDefaults || {};
    const diff = {};
    Object.keys(patch || {}).forEach(k => { if (JSON.stringify(patch[k]) !== JSON.stringify(g.defaultSettings[k])) diff[k] = patch[k]; });
    if (Object.keys(diff).length) over[g.id] = diff; else delete over[g.id];
    TCL.persist();
  };
  Games.clearDefaults = function (id) {
    const over = TCL.state.settings.gameDefaults || {};
    if (id) delete over[id]; else TCL.state.settings.gameDefaults = {};
    TCL.persist();
  };

  /* ---------- Runner ---------- */
  const Runner = TCL.Runner = {};
  Runner.current = function () { const s = TCL.session(); return s && s.currentActivityId ? U.byId(s.runSheet, s.currentActivityId) : null; };
  /* Every numeric setting a game declares is coerced here, once, using that game's own
     default and its schema's bounds. Settings reach an activity from imported presets and
     restored backups without passing through the settings form, and a NaN does not throw:
     it silently turns `count * seconds` into NaN and poisons estimates, clocks and score
     maths downstream. Sanitising at this boundary means no game has to think about it. */
  Games.sanitise = function (gameOrId, raw) {
    const g = typeof gameOrId === "string" ? Games.get(gameOrId) : gameOrId;
    if (!g) return Object.assign({}, raw || {});
    const out = Object.assign({}, g.defaultSettings, raw || {});
    (g.settingsSchema || []).forEach(f => {
      if (f.type !== "range" && f.type !== "number") return;
      out[f.key] = U.num(out[f.key], U.num(g.defaultSettings[f.key], f.min != null ? f.min : 0), f.min, f.max);
    });
    return out;
  };
  Runner.settingsOf = function (a) { return Games.sanitise(TCL.Games.get(a.gameId), a.settings); };

  /* Build the context handed to every game function. */
  Runner.ctx = function (activity) {
    const s = TCL.session();
    activity = activity || Runner.current();
    if (!s || !activity) return null;
    const game = activity.kind === "game" ? TCL.Games.get(activity.gameId) : null;
    const settings = game ? Runner.settingsOf(activity) : activity.settings;
    const teamMode = s.teamMode === "individual" || (settings && settings.mode === "individual") ? "individual" : "teams";
    const present = TCL.Teams.present(s);
    const targets = teamMode === "individual"
      ? present.map(p => ({ id: p.id, name: p.displayName || p.name, color: "var(--gold)", kind: "participant", memberIds: [p.id] }))
      : s.teams.map(t => ({ id: t.id, name: t.name, color: t.color, kind: "team", memberIds: t.memberIds, team: t }));
    const ctx = {
      session: s, activity, game, settings, state: activity.state, teamMode, targets, participants: present, allParticipants: s.participants,
      scoringEnabled: TCL.Scoring.enabledFor(activity),
      name: pid => TCL.Teams.displayName(pid, s),
      teamOf: pid => TCL.Teams.teamOf(pid, s),
      targetOf: pid => teamMode === "individual" ? targets.find(t => t.id === pid) || null : (function () { const t = TCL.Teams.teamOf(pid, s); return t ? targets.find(x => x.id === t.id) || null : null; })(),
      score: function (targetId, points, reason, round) {
        if (!ctx.scoringEnabled) return null;
        const isTeam = s.teams.some(t => t.id === targetId);
        const ev = TCL.Scoring.award({ activityId: activity.id, teamId: isTeam ? targetId : null, participantId: isTeam ? null : targetId, points, reason, round });
        if (ev) { TCL.Audio.ding(); TCL.emit("ui:pulse", targetId); }
        return ev;
      },
      scored: (targetId, reason, round) => TCL.Scoring.alreadyScored(activity.id, round, targetId, reason),
      events: () => TCL.Scoring.eventsFor(activity.id).filter(e => !e.undone),
      timer: timerApi("round"),
      breakout: timerApi("breakout"),
      content: (q) => TCL.Content.select(Object.assign({ game: game && game.contentGame }, q)),
      log: label => TCL.History.log(label),
      rotate: (key, advance) => TCL.Teams.nextParticipant(key, advance),
      rotateTeam: (team, key, advance) => TCL.Teams.nextMember(team, key, advance),
    };
    return ctx;
  };
  function timerApi(name) {
    const T = TCL.Timers;
    return {
      name,
      start: (ms, label, warnAtMs) => T.start(name, { durationMs: ms, label, warnAtMs }),
      pause: () => T.pause(name), resume: () => T.resume(name), toggle: () => T.toggle(name),
      stop: () => T.stop(name), reset: () => T.reset(name), adjust: ms => T.adjust(name, ms),
      remaining: () => T.remaining(name), status: () => (T.get(name) || {}).status || "idle",
      running: () => (T.get(name) || {}).status === "running", done: () => (T.get(name) || {}).status === "done",
      idle: () => { const st = (T.get(name) || {}).status; return !st || st === "idle"; },
    };
  }

  /* Start or resume an activity. Returns false with a reason when it cannot run. */
  Runner.start = function (activityId) {
    const s = TCL.session(); const a = U.byId(s.runSheet, activityId);
    if (!a) return { ok: false, reason: "Activity not found." };
    const cur = Runner.current();
    if (cur && cur.id !== a.id && cur.status === "active") return { ok: false, reason: `"${cur.title}" is still active. Pause or end it first.` };
    if (a.kind === "game") {
      const g = TCL.Games.get(a.gameId);
      if (!g) return { ok: false, reason: "Unknown game." };
      const problems = Runner.validate(a).filter(p => p.level === "error");
      if (problems.length && !a.forceStart) return { ok: false, reason: problems.map(p => p.message).join(" "), problems };
    }
    TCL.History.record(`Start ${a.title}`, { safeRedo: false });
    s.status = "live";
    s.currentActivityId = a.id;
    if (!a.state) {
      a.startedAt = new Date().toISOString();
      ["round", "breakout", "break"].forEach(n => { const t = TCL.Timers.get(n); TCL.Timers.stop(n); t.label = ""; t.durationMs = 0; t.remainingMs = 0; });
      if (a.kind === "game") {
        const ctx = Runner.ctx(a);
        a.state = TCL.Games.get(a.gameId).init(ctx) || {};
        if (a.state.contentIds) TCL.Content.markUsed(a.state.contentIds);
      } else {
        a.state = { started: true };
        TCL.Timers.start(a.kind === "break" ? "break" : "round", { durationMs: Math.max(1, U.num(a.settings.minutes, 5, 1, 240)) * 60000, label: a.title });
      }
    } else {
      /* resuming: resume paused timers that belong to this activity */
      ["round", "breakout", "break"].forEach(n => { const t = TCL.Timers.get(n); if (t && t.status === "paused" && a.pausedTimers && a.pausedTimers.includes(n)) TCL.Timers.resume(n); });
      a.pausedTimers = null;
    }
    a.status = "active";
    const st = TCL.Timers.get("session");
    if (st.status === "idle") TCL.Timers.start("session", { durationMs: (s.targetMinutes || 60) * 60000, direction: "up", label: "Session" });
    else if (st.status === "paused") TCL.Timers.resume("session");
    const at = TCL.Timers.get("activity");
    if (at.status === "paused" && a.activityTimerOwned) TCL.Timers.resume("activity");
    else { TCL.Timers.start("activity", { durationMs: TCL.Duration.activity(a, s) * 60000, direction: "up", label: a.title }); a.activityTimerOwned = true; }
    TCL.Session.touch();
    TCL.emit("runner:changed");
    return { ok: true };
  };

  Runner.validate = function (a) {
    const s = TCL.session();
    const g = TCL.Games.get(a.gameId); if (!g) return [{ level: "error", message: "Unknown game" }];
    const settings = Runner.settingsOf(a);
    const ctx = { participants: TCL.Teams.present(s), teams: s.teams, teamMode: s.teamMode, session: s, settings, content: q => TCL.Content.select(Object.assign({ game: g.contentGame }, q)) };
    const out = [];
    const mode = s.teamMode === "individual" ? "individual" : (settings.mode || "teams");
    if (!g.modes.includes(mode) && !(mode === "teams" && g.modes.includes("teams"))) out.push({ level: "warn", message: `${g.name} does not support ${mode} mode; it will run with everyone as one group.` });
    if (ctx.participants.length === 0) out.push({ level: "error", message: "Nobody is marked present." });
    if (s.teamMode === "teams" && s.teams.length && s.teams.every(t => !TCL.Teams.presentMembers(t, s).length)) out.push({ level: "error", message: "Every team is empty." });
    try { out.push(...(g.validate(settings, ctx) || [])); } catch (e) { out.push({ level: "warn", message: "Validation failed: " + e.message }); }
    return out;
  };

  /* Dispatch a game action. Records undo automatically unless the game marks it noUndo. */
  Runner.act = function (name, arg) {
    const a = Runner.current(); if (!a) return;
    if (a.kind !== "game") return Runner.simpleAct(a, name, arg);
    const g = TCL.Games.get(a.gameId);
    const fn = g.actions[name];
    if (!fn) { console.warn("unknown action", name); return; }
    const label = (g.actionLabels && g.actionLabels[name]) || U.titleCase(name.replace(/([A-Z])/g, " $1"));
    const noUndo = g.noUndo && g.noUndo.includes(name);
    if (!noUndo) TCL.History.record(`${g.name}: ${label}`);
    const ctx = Runner.ctx(a);
    try { fn(ctx, arg); } catch (e) { console.error("[TCL] action failed", name, e); TCL.emit("ui:toast", { text: "That action failed: " + e.message, kind: "error" }); }
    a.state = ctx.state;
    Runner.afterChange();
  };
  Runner.simpleAct = function (a, name, arg) {
    const timerName = a.kind === "break" ? "break" : "round";
    if (name === "toggleTimer") TCL.Timers.toggle(timerName);
    if (name === "addTime") TCL.Timers.adjust(timerName, Number(arg) || 30000);
    if (name === "restartTimer") TCL.Timers.start(timerName, { durationMs: Math.max(1, U.num(a.settings.minutes, 5, 1, 240)) * 60000, label: a.title });
    Runner.afterChange();
  };
  Runner.afterChange = function () {
    const a = Runner.current();
    if (a && a.kind === "game") {
      const g = TCL.Games.get(a.gameId);
      try { if (g.isComplete(Runner.ctx(a))) a.state.completeReady = true; } catch (e) { /* ignore */ }
    }
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };

  /* Universal timer controls for the round timer of the current activity */
  Runner.timer = function (op, arg) {
    const a = Runner.current(); if (!a) return;
    const name = a.kind === "break" ? "break" : (arg && arg.timer) || "round";
    const T = TCL.Timers;
    if (op === "toggle") T.toggle(name);
    if (op === "add") T.adjust(name, 30000);
    if (op === "sub") T.adjust(name, -30000);
    if (op === "restart") { const t = T.get(name); T.start(name, { durationMs: t.durationMs, label: t.label, warnAtMs: t.warnAtMs }); }
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };

  /* Exits */
  Runner.pause = function () {
    const a = Runner.current(); if (!a) return;
    a.pausedTimers = ["round", "breakout", "break"].filter(n => (TCL.Timers.get(n) || {}).status === "running");
    TCL.Timers.pauseAll();
    a.status = "paused";
    TCL.History.log(`Paused ${a.title}`);
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };
  Runner.complete = function () {
    const a = Runner.current(); if (!a) return;
    TCL.History.record(`Complete ${a.title}`, { safeRedo: false });
    ["round", "breakout", "break"].forEach(n => TCL.Timers.stop(n));
    TCL.Timers.pause("activity");
    a.status = "complete"; a.endedAt = new Date().toISOString();
    if (a.kind === "game") { const g = TCL.Games.get(a.gameId); if (g.onComplete) { try { g.onComplete(Runner.ctx(a)); } catch (e) { /* ignore */ } } }
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };
  Runner.completeAndDiscard = function () {
    const a = Runner.current(); if (!a) return;
    TCL.History.record(`End ${a.title} and discard its scores`, { safeRedo: false });
    const n = TCL.Scoring.discardActivity(a.id);
    ["round", "breakout", "break"].forEach(n2 => TCL.Timers.stop(n2));
    TCL.Timers.pause("activity");
    a.status = "complete"; a.endedAt = new Date().toISOString(); a.scoresDiscarded = true;
    TCL.Session.touch();
    TCL.emit("runner:changed");
    return n;
  };
  Runner.skip = function (activityId) {
    const s = TCL.session(); const a = U.byId(s.runSheet, activityId || s.currentActivityId); if (!a) return;
    TCL.History.record(`Skip ${a.title}`);
    if (a.id === s.currentActivityId) { ["round", "breakout", "break"].forEach(n => TCL.Timers.stop(n)); TCL.Timers.pause("activity"); }
    a.status = "skipped";
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };
  Runner.resetActivity = function (activityId, keepScores) {
    const s = TCL.session(); const a = U.byId(s.runSheet, activityId); if (!a) return;
    TCL.History.record(`Reset ${a.title}`, { safeRedo: false });
    if (!keepScores) TCL.Scoring.discardActivity(a.id);
    a.state = null; a.status = "pending"; a.startedAt = a.endedAt = null; a.scoresDiscarded = false;
    if (s.currentActivityId === a.id) { ["round", "breakout", "break"].forEach(n => TCL.Timers.stop(n)); }
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };
  Runner.reopen = function (activityId) {
    const s = TCL.session(); const a = U.byId(s.runSheet, activityId); if (!a) return;
    TCL.History.record(`Reopen ${a.title}`);
    a.status = "paused"; a.endedAt = null;
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };
  Runner.endSession = function () {
    const s = TCL.session(); if (!s) return;
    TCL.Timers.pauseAll();
    s.runSheet.forEach(a => { if (a.status === "active" || a.status === "paused") { a.status = "complete"; a.endedAt = new Date().toISOString(); } });
    s.status = "complete"; s.currentActivityId = null;
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };

  /* Round timer completion -> game hook */
  TCL.on("timer:done", function (name) {
    const a = Runner.current(); if (!a) return;
    if (name === "round" || name === "breakout" || name === "break") {
      TCL.Audio.buzzer();
      if (a.kind === "game") {
        const g = TCL.Games.get(a.gameId);
        if (g.onTimerDone) { const ctx = Runner.ctx(a); try { g.onTimerDone(ctx, name); a.state = ctx.state; } catch (e) { console.error(e); } }
      }
      TCL.Session.touch();
      TCL.emit("runner:changed");
    }
  });
})();
