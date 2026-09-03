/* src/core/40-session.js
   Session lifecycle, run sheet editing, persistence wiring. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Session = TCL.Session = {};

  TCL.state = null;
  TCL.session = function () {
    const st = TCL.state; if (!st || !st.currentSessionId) return null;
    return U.byId(st.sessions, st.currentSessionId);
  };

  Session.blank = function (name, targetMinutes) {
    /* App-level defaults seed a new session; the session then owns its own copy so
       changing the default later never rewrites a session you already built. */
    const app = (TCL.state && TCL.state.settings) || {};
    return {
      id: U.uid("s"), name: name || ("Team Connect " + U.today()), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      status: "draft", targetMinutes: targetMinutes || 60,
      participants: [], teamMode: "teams", teams: [], teamsLocked: false,
      runSheet: [], currentActivityId: null, scoreEvents: [], timers: TCL.Timers.blankSet(),
      log: [], undo: { stack: [], redo: [] }, scoringEnabled: app.scoringEnabled !== false, showScores: app.showScoresLive !== false, rot: {}, notes: "",
      finaleMode: "podium", ready: {}, participation: {}, rehearsal: false, holding: null, deferred: [], rotNext: {},
      scoreModel: app.scoreModel || "balanced",
    };
  };
  Session.create = function (opts) {
    opts = opts || {};
    const s = Session.blank(opts.name, opts.targetMinutes);
    if (opts.participants) s.participants = opts.participants.map(n => typeof n === "string" ? TCL.Teams.newParticipant(n) : n);
    TCL.state.sessions.push(s);
    TCL.state.currentSessionId = s.id;
    if (opts.preset) Session.applyPreset(opts.preset);
    TCL.Teams.refreshNames(s);
    Session.touch();
    return s;
  };
  /* Holding screen: covers the presentation without touching the activity underneath.
     kind is one of the presets below, or "custom" with a message. */
  Session.HOLDING = [
    { id: "return", title: "Please return to the main room", sub: "We start again as soon as everyone is back." },
    { id: "setup", title: "Setting up the next activity", sub: "One moment. Stretch, refill your cup." },
    { id: "pause", title: "Technical pause", sub: "Hold tight. We will be right back." },
    { id: "results", title: "Results coming up", sub: "Totting up the scores." },
  ];
  Session.hold = function (kind, message) {
    const s = TCL.session(); if (!s) return;
    const preset = Session.HOLDING.find(h => h.id === kind);
    s.holding = kind ? { kind, title: preset ? preset.title : (message || "One moment"), sub: preset ? preset.sub : "", message: message || "" } : null;
    TCL.History.log(kind ? "Holding screen: " + (preset ? preset.title : "custom") : "Holding screen off");
    TCL.Session.touch();
    TCL.emit("runner:changed");
  };
  Session.holding = function () { const s = TCL.session(); return s ? s.holding : null; };

  Session.setCurrent = function (id) { TCL.state.currentSessionId = id; TCL.emit("session:changed"); };
  Session.list = function () { return U.sortBy(TCL.state.sessions, s => s.updatedAt || "", true); };
  Session.remove = function (id) {
    TCL.state.sessions = TCL.state.sessions.filter(s => s.id !== id);
    if (TCL.state.currentSessionId === id) TCL.state.currentSessionId = null;
    TCL.persist();
  };
  /* What belongs to the plan rather than to one run of it. Everything else in a session is
     run state and is reset by resetRunState, so a duplicate cannot inherit a covered
     presentation, someone who was sitting out that day, or scores from last time.
     Adding a field to blank() and forgetting it here is caught by a test. */
  Session.PLAN_KEYS = ["id", "name", "createdAt", "updatedAt", "status", "targetMinutes",
    "participants", "teamMode", "teams", "teamsLocked", "runSheet",
    "scoringEnabled", "showScores", "scoreModel", "finaleMode", "notes"];
  /* Per-activity fields that describe one run, not the plan. `notes` survives on purpose:
     "explain the rules twice" is worth keeping for next time. */
  Session.ACTIVITY_RUN_KEYS = ["status", "state", "startedAt", "endedAt", "scoresDiscarded",
    "pausedTimers", "activityTimerOwned", "forceStart"];
  /* Run state can also hide inside objects that are otherwise plan: a team is part of the
     plan, but its rotation pointer is where that team got to last time. */
  Session.TEAM_RUN_KEYS = ["rot"];
  Session.PARTICIPANT_RUN_KEYS = [];

  Session.resetRunState = function (session) {
    const fresh = Session.blank(session.name, session.targetMinutes);
    Object.keys(fresh).forEach(k => { if (Session.PLAN_KEYS.indexOf(k) < 0) session[k] = fresh[k]; });
    session.timers = TCL.Timers.blankSet();
    session.status = "draft";
    session.currentActivityId = null;
    (session.runSheet || []).forEach(a => {
      Session.ACTIVITY_RUN_KEYS.forEach(k => { delete a[k]; });
      a.status = "pending";
      a.state = null;
      a.startedAt = a.endedAt = null;
    });
    (session.teams || []).forEach(t => { Session.TEAM_RUN_KEYS.forEach(k => { delete t[k]; }); });
    (session.participants || []).forEach(p => { Session.PARTICIPANT_RUN_KEYS.forEach(k => { delete p[k]; }); });
    return session;
  };

  Session.duplicate = function (id) {
    const src = U.byId(TCL.state.sessions, id); if (!src) return null;
    const copy = U.clone(src);
    copy.id = U.uid("s"); copy.name = src.name + " (copy)";
    copy.createdAt = copy.updatedAt = new Date().toISOString();
    Session.resetRunState(copy);
    copy.runSheet.forEach(a => { a.id = U.uid("a"); });
    TCL.state.sessions.push(copy);
    TCL.state.currentSessionId = copy.id;
    TCL.persist();
    return copy;
  };
  Session.touch = function () { const s = TCL.session(); if (s) s.updatedAt = new Date().toISOString(); TCL.persist(); };
  Session.unfinished = function () { return TCL.state.sessions.filter(s => s.status === "live"); };

  /* ---------- run sheet ---------- */
  Session.newActivity = function (kind, gameId) {
    if (kind === "game") {
      const g = TCL.Games.get(gameId);
      return { id: U.uid("a"), kind: "game", gameId, title: g ? g.name : gameId, settings: U.clone(g ? TCL.Games.defaults(g) : {}), status: "pending", state: null, notes: "", startedAt: null, endedAt: null };
    }
    if (kind === "break") return { id: U.uid("a"), kind: "break", title: "Break", settings: { minutes: 5, message: "Stretch, refill your cup. Back in 5 minutes." }, status: "pending", state: null, notes: "" };
    return { id: U.uid("a"), kind: "custom", title: "Welcome and warm-up", settings: { minutes: 5, message: "Welcome! Wave on camera, then send one emoji reaction that matches your mood today.", instructions: "" }, status: "pending", state: null, notes: "" };
  };
  Session.addActivity = function (kind, gameId, index) {
    const s = TCL.session(); if (!s) return null;
    const a = Session.newActivity(kind, gameId);
    if (index == null || index >= s.runSheet.length) s.runSheet.push(a); else s.runSheet.splice(index, 0, a);
    Session.touch();
    return a;
  };
  Session.activity = function (id) { const s = TCL.session(); return s ? U.byId(s.runSheet, id) : null; };
  Session.removeActivity = function (id) {
    const s = TCL.session(); if (!s) return;
    s.runSheet = s.runSheet.filter(a => a.id !== id);
    TCL.Scoring.removeActivity(id);
    if (s.currentActivityId === id) s.currentActivityId = null;
    Session.touch();
  };
  Session.duplicateActivity = function (id) {
    const s = TCL.session(); const a = Session.activity(id); if (!s || !a) return null;
    const copy = U.clone(a); copy.id = U.uid("a"); copy.status = "pending"; copy.state = null; copy.startedAt = copy.endedAt = null;
    s.runSheet.splice(s.runSheet.indexOf(a) + 1, 0, copy);
    Session.touch();
    return copy;
  };
  Session.moveActivity = function (id, toIndex) {
    const s = TCL.session(); if (!s) return;
    const from = s.runSheet.findIndex(a => a.id === id); if (from < 0) return;
    const [a] = s.runSheet.splice(from, 1);
    s.runSheet.splice(U.clamp(toIndex, 0, s.runSheet.length), 0, a);
    Session.touch();
  };
  Session.canEditActivity = function (a) { return a && (a.status === "pending" || a.status === "skipped"); };
  Session.updateSettings = function (id, patch) {
    const a = Session.activity(id); if (!a) return;
    a.settings = Object.assign({}, a.settings, patch);
    if (a.kind !== "game" && patch.title) a.title = patch.title;
    Session.touch();
  };
  Session.nextPending = function (afterId) {
    const s = TCL.session(); if (!s) return null;
    const i = afterId ? s.runSheet.findIndex(a => a.id === afterId) : -1;
    return s.runSheet.slice(i + 1).find(a => a.status === "pending" || a.status === "paused") || s.runSheet.find(a => a.status === "pending" || a.status === "paused") || null;
  };

  /* ---------- presets ---------- */
  Session.applyPreset = function (preset) {
    const s = TCL.session(); if (!s || !preset) return;
    s.targetMinutes = preset.targetMinutes || s.targetMinutes;
    s.runSheet = (preset.runSheet || []).map(item => {
      const a = Session.newActivity(item.kind || "game", item.gameId);
      if (item.title) a.title = item.title;
      a.settings = Object.assign({}, a.settings, item.settings || {});
      return a;
    });
    Session.touch();
  };
  Session.savePreset = function (name) {
    const s = TCL.session(); if (!s) return null;
    const p = { id: U.uid("preset"), name: name || (s.name + " preset"), builtIn: false, targetMinutes: s.targetMinutes,
      runSheet: s.runSheet.map(a => ({ kind: a.kind, gameId: a.gameId, title: a.title, settings: U.clone(a.settings) })), createdAt: new Date().toISOString() };
    TCL.state.presets.push(p);
    TCL.persist();
    return p;
  };
  Session.presets = function () { return (TCL.Presets ? TCL.Presets.builtIn() : []).concat(TCL.state.presets); };
  Session.preset = id => Session.presets().find(p => p.id === id) || null;
  Session.renamePreset = function (id, name) { const p = U.byId(TCL.state.presets, id); if (p) { p.name = name; TCL.persist(); } };
  Session.deletePreset = function (id) { TCL.state.presets = TCL.state.presets.filter(p => p.id !== id); TCL.persist(); };
  Session.duplicatePreset = function (id) {
    const p = Session.preset(id); if (!p) return null;
    const c = U.clone(p); c.id = U.uid("preset"); c.builtIn = false; c.name = p.name + " (copy)";
    TCL.state.presets.push(c); TCL.persist(); return c;
  };

  /* ---------- results export ---------- */
  Session.summaryText = function () {
    const s = TCL.session(); if (!s) return "";
    const rows = TCL.Scoring.standings();
    const medals = ["🥇", "🥈", "🥉"];
    const per = TCL.Scoring.perActivity();
    const lines = [`TEAM CONNECT LIVE · ${s.name}`, `${U.fmtDate(s.updatedAt)} · ${TCL.Teams.present(s).length} participants`, ""];
    if (rows.length && s.scoringEnabled !== false) {
      lines.push("Final standings:");
      rows.forEach(r => {
        const t = U.byId(s.teams, r.id);
        const names = t ? TCL.Teams.members(t, s).map(p => p.displayName || p.name).join(", ") : "";
        lines.push(`${medals[r.rank - 1] || "•"} ${r.name}: ${r.total} pts${r.tied ? " (tied)" : ""}${names ? " · " + names : ""}`);
      });
      lines.push("");
    }
    lines.push("Run sheet:");
    s.runSheet.forEach((a, i) => {
      const bits = rows.map(r => `${r.name} ${per[a.id] && per[a.id][r.id] || 0}`).join(" · ");
      lines.push(`${i + 1}. ${a.title} [${a.status}]${a.kind === "game" && s.scoringEnabled !== false ? " · " + bits : ""}`);
    });
    const extras = TCL.Games.list().map(g => g.exportText && s.runSheet.filter(a => a.gameId === g.id && a.state).map(a => g.exportText(a)).join("\n")).filter(Boolean);
    if (extras.length) { lines.push(""); lines.push(...extras); }
    lines.push("", "\"Alone we can do so little; together we can do so much.\" (Helen Keller)");
    return lines.join("\n");
  };

  /* ---------- persistence ---------- */
  const persistNow = function () {
    if (!TCL.state) return;
    const copy = Object.assign({}, TCL.state);
    copy.sessions = TCL.state.sessions.map(s => Object.assign({}, s, { undo: TCL.History.forPersist(s) }));
    TCL.Store.save(copy);
  };
  const persistSoon = U.debounce(persistNow, 150);
  TCL.persist = function (immediate) { if (immediate) persistNow(); else persistSoon(); };
  TCL.persistNow = persistNow;
  window.addEventListener("beforeunload", () => { try { persistNow(); } catch (e) { /* ignore */ } });
})();
