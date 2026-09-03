/* src/core/38-rehearsal.js
   Rehearsal mode: a throwaway session with sample people, compressed timers and no
   side effects on real content usage or real scores. Ends by deleting itself. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Rehearsal = TCL.Rehearsal = {};

  Rehearsal.SPEED = 5;            // timers run this many times faster
  Rehearsal.MIN_MS = 6000;        // but never shorter than this
  Rehearsal.PEOPLE = ["Sample Priya", "Sample Tom", "Sample Mei-Ling", "Sample Arjun", "Sample Grace", "Sample Ben"];

  Rehearsal.active = function (session) {
    const s = session === undefined ? TCL.session() : session;
    return !!(s && s.rehearsal);
  };
  /* Compress a duration for rehearsal. Called by the timer module. */
  Rehearsal.scale = function (ms) {
    if (!Rehearsal.active() || !ms) return ms;
    return Math.max(Rehearsal.MIN_MS, Math.round(ms / Rehearsal.SPEED));
  };

  Rehearsal.existing = function () { return TCL.state.sessions.find(s => s.rehearsal) || null; };

  /* Start a rehearsal. Every game is on the run sheet so any of them can be jumped to. */
  Rehearsal.start = function (opts) {
    opts = opts || {};
    const prev = Rehearsal.existing();
    if (prev) TCL.Session.remove(prev.id);
    TCL.state.rehearsalReturnTo = TCL.state.currentSessionId && !Rehearsal.active(U.byId(TCL.state.sessions, TCL.state.currentSessionId)) ? TCL.state.currentSessionId : (TCL.state.rehearsalReturnTo || null);
    const s = TCL.Session.create({ name: "Rehearsal (practice run)", targetMinutes: 60, participants: Rehearsal.PEOPLE });
    s.rehearsal = true;
    s.participants.forEach((p, i) => { p.location = i % 2 ? "Gurugram" : "Sydney"; p.fact = "Sample fact number " + (i + 1); });
    TCL.Teams.build(2);
    const ids = opts.games || TCL.Games.list().map(g => g.id);
    ids.forEach(id => {
      const a = TCL.Session.addActivity("game", id);
      /* Small counts so a rehearsal round finishes in a few clicks. */
      ["count", "rounds", "turns", "items"].forEach(k => { if (a.settings[k] != null) a.settings[k] = Math.min(2, a.settings[k]); });
      if (a.settings.breakoutMinutes != null) a.settings.breakoutMinutes = 3;
      if (a.settings.collectMinutes != null) a.settings.collectMinutes = 1;
    });
    s.status = "live";
    TCL.Session.touch();
    TCL.emit("session:changed");
    return s;
  };

  /* Jump straight to any game: close whatever is running, reset the target, start it. */
  Rehearsal.jumpTo = function (gameId) {
    const s = TCL.session(); if (!s || !s.rehearsal) return { ok: false, reason: "Not in a rehearsal." };
    const cur = TCL.Runner.current();
    if (cur && (cur.status === "active" || cur.status === "paused")) { TCL.Runner.resetActivity(cur.id, false); s.currentActivityId = null; }
    let a = s.runSheet.find(x => x.gameId === gameId);
    if (!a) a = TCL.Session.addActivity("game", gameId);
    if (a.status !== "pending") TCL.Runner.resetActivity(a.id, false);
    a.forceStart = true;
    const r = TCL.Runner.start(a.id);
    return r;
  };

  /* End and clean up. Returns the id of the session to go back to, if any. */
  Rehearsal.end = function () {
    const s = TCL.session();
    const back = TCL.state.rehearsalReturnTo;
    if (s && s.rehearsal) TCL.Session.remove(s.id);
    TCL.state.sessions.filter(x => x.rehearsal).forEach(x => TCL.Session.remove(x.id));
    TCL.state.rehearsalReturnTo = null;
    if (back && U.byId(TCL.state.sessions, back)) TCL.state.currentSessionId = back;
    else TCL.state.currentSessionId = null;
    TCL.persist(true);
    TCL.emit("session:changed");
    return TCL.state.currentSessionId;
  };
})();
