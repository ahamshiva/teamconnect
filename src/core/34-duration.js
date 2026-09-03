/* src/core/34-duration.js
   Session duration model. Every estimate includes realistic overhead:
   transition between activities, explanation time, reveal and discussion. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Duration = TCL.Duration = {};
  Duration.TRANSITION_MIN = 1;     // between activities: explain rules, settle the room
  Duration.WELCOME_MIN = 0;          // added by presets as a custom activity instead

  /* Minutes for one activity (game, break or custom). */
  Duration.activity = function (act, session) {
    if (!act) return 0;
    if (act.kind === "break" || act.kind === "custom") return Math.max(0, Number(act.settings && act.settings.minutes) || 0);
    const game = TCL.Games.get(act.gameId);
    if (!game) return 0;
    const ctx = Duration.ctx(session);
    try {
      const est = game.estimateMinutes(TCL.Games.sanitise(game, act.settings), ctx);
      return isFinite(est) ? Math.max(0.5, est) : 5;
    } catch (e) { console.warn("estimate failed", act.gameId, e); return 5; }
  };
  Duration.ctx = function (session) {
    session = session || TCL.session();
    const present = session ? session.participants.filter(p => p.present).length : 15;
    const teams = session ? Math.max(1, session.teams.length) : 3;
    return { participants: present || 15, teams: session && session.teamMode === "individual" ? Math.max(1, present) : teams, teamMode: session ? session.teamMode : "teams" };
  };
  /* Whole run sheet: { activities:[{id, minutes}], total, transitions, target, spare, over } */
  Duration.runSheet = function (session) {
    session = session || TCL.session();
    if (!session) return { activities: [], total: 0, transitions: 0, target: 0, spare: 0, over: 0 };
    const acts = session.runSheet.map(a => ({ id: a.id, minutes: Duration.activity(a, session), flexible: Duration.isFlexible(a) }));
    const games = acts.length;
    const transitions = games > 1 ? (games - 1) * Duration.TRANSITION_MIN : 0;
    const total = U.sum(acts.map(a => a.minutes)) + transitions;
    const target = Number(session.targetMinutes) || 0;
    return { activities: acts, total, transitions, target, spare: Math.max(0, target - total), over: Math.max(0, total - target) };
  };
  Duration.isFlexible = function (act) {
    if (act.kind !== "game") return false;
    const g = TCL.Games.get(act.gameId);
    return !!(g && g.flexKey);
  };
  /* Auto-fit: scale the flexible count setting (questions / rounds) of flexible games to hit the target. */
  Duration.autoFit = function (session) {
    session = session || TCL.session();
    const flex = session.runSheet.filter(Duration.isFlexible);
    if (!flex.length) return { changed: false, reason: "No flexible activities in the run sheet." };
    for (let iter = 0; iter < 40; iter++) {
      const d = Duration.runSheet(session);
      const diff = d.target - d.total;
      if (Math.abs(diff) < 1) break;
      /* Adjust the activity whose per-item cost is closest to the gap, one unit at a time. */
      let best = null;
      flex.forEach(a => {
        const g = TCL.Games.get(a.gameId);
        const key = g.flexKey, spec = (g.settingsSchema || []).find(x => x.key === key) || { min: 1, max: 30 };
        const cur = U.num(a.settings[key], U.num(g.defaultSettings[key], 1), spec.min || 1, spec.max || 60);
        const next = diff > 0 ? cur + 1 : cur - 1;
        if (next < (spec.min || 1) || next > (spec.max || 60)) return;
        const trial = Object.assign({}, a, { settings: Object.assign({}, a.settings, { [key]: next }) });
        const delta = Duration.activity(trial, session) - Duration.activity(a, session);
        if (diff > 0 && delta > 0 && delta <= diff + 0.5 && (!best || delta > best.delta)) best = { a, key, next, delta };
        if (diff < 0 && delta < 0 && (!best || delta < best.delta)) best = { a, key, next, delta };
      });
      if (!best) break;
      best.a.settings[best.key] = best.next;
    }
    return { changed: true };
  };
})();
