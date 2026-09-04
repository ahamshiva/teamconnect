/* src/core/37-pacing.js
   "Running late" model. Projects the finish time from the real session clock and the
   remaining run sheet, then offers ranked adjustments. The activity that is currently
   running is never touched. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const P = TCL.Pacing = {};

  P.BEHIND_MIN = 3;          // minutes over target before the warning appears
  P.SETTLE_FRACTION = 0.12;  // and not until this much of the session has actually run

  function remainingActivities(s) {
    return s.runSheet.filter(a => a.status === "pending" || a.status === "paused");
  }
  /* Minutes still to spend on the activity that is running right now. */
  function currentRemaining(s) {
    const a = TCL.Runner.current();
    if (!a || a.status !== "active") return 0;
    const est = TCL.Duration.activity(a, s);
    const spent = TCL.Timers.elapsed("activity") / 60000;
    return Math.max(0, est - spent);
  }
  P.status = function (session) {
    const s = session || TCL.session();
    if (!s) return { behind: false, elapsed: 0, projected: 0, target: 0, over: 0, remaining: 0 };
    const elapsed = TCL.Timers.elapsed("session") / 60000;
    const rest = remainingActivities(s);
    const restMin = U.sum(rest.map(a => TCL.Duration.activity(a, s)));
    const transitions = Math.max(0, rest.length) * TCL.Duration.TRANSITION_MIN;
    const remaining = currentRemaining(s) + restMin + transitions;
    const target = Number(s.targetMinutes) || 0;
    const projected = elapsed + remaining;
    const over = projected - target;
    /* An estimate that is a few minutes long before anything has happened is a planning
       problem, not a pacing one. Wait until the session has actually run a while, or an
       activity has finished, before calling it late. */
    const settled = elapsed > Math.min(8, target * P.SETTLE_FRACTION) || s.runSheet.some(a => a.status === "complete" || a.status === "skipped");
    return { behind: settled && over > P.BEHIND_MIN, settled, elapsed, remaining, projected, target, over: Math.max(0, over), under: Math.max(0, -over), count: rest.length };
  };

  /* Flexible pending activities we are allowed to shrink (never the running one). */
  function flexPending(s) {
    return remainingActivities(s).filter(a => a.id !== s.currentActivityId && TCL.Duration.isFlexible(a));
  }
  function flexStep(a, s, down) {
    const g = TCL.Games.get(a.gameId);
    const key = g.flexKey, spec = (g.settingsSchema || []).find(x => x.key === key) || { min: 1, max: 30 };
    const cur = U.num(a.settings[key], U.num(g.defaultSettings[key], 1), spec.min || 1, spec.max || 60);
    const next = down ? cur - 1 : cur + 1;
    if (next < (spec.min || 1) || next > (spec.max || 60)) return null;
    const trial = Object.assign({}, a, { settings: Object.assign({}, a.settings, { [key]: next }) });
    return { key, cur, next, delta: TCL.Duration.activity(a, s) - TCL.Duration.activity(trial, s) };
  }

  /* --- the individual adjustments. Each returns minutes actually saved. --- */
  const ACTIONS = {
    /* Trim flexible games evenly until the projection fits, or nothing can shrink further. */
    shorten(s, needMin) {
      let saved = 0, guard = 0;
      const need = needMin == null ? Infinity : needMin;
      while (saved < need && guard++ < 60) {
        let best = null;
        flexPending(s).forEach(a => {
          const st = flexStep(a, s, true); if (!st || st.delta <= 0) return;
          if (!best || st.delta > best.st.delta) best = { a, st };
        });
        if (!best) break;
        best.a.settings[best.st.key] = best.st.next;
        saved += best.st.delta;
      }
      return saved;
    },
    /* One item off every remaining flexible activity: predictable, spreads the pain. */
    fewer(s) {
      let saved = 0;
      flexPending(s).forEach(a => { const st = flexStep(a, s, true); if (st && st.delta > 0) { a.settings[st.key] = st.next; saved += st.delta; } });
      return saved;
    },
    skipNext(s) {
      const next = remainingActivities(s).filter(a => a.id !== s.currentActivityId)[0];
      if (!next) return 0;
      const saved = TCL.Duration.activity(next, s) + TCL.Duration.TRANSITION_MIN;
      next.status = "skipped";
      return saved;
    },
    dropBreak(s) {
      const breaks = remainingActivities(s).filter(a => a.kind === "break" && a.id !== s.currentActivityId);
      let saved = 0;
      breaks.forEach(a => { saved += TCL.Duration.activity(a, s) + TCL.Duration.TRANSITION_MIN; a.status = "skipped"; });
      return saved;
    },
    extend(s, minutes) {
      const add = Math.ceil(minutes || P.status(s).over || 5);
      s.targetMinutes = U.clamp((Number(s.targetMinutes) || 60) + add, 10, 240);
      return -add;
    },
    /* Least disruptive first: drop breaks, trim flexible games, then skip an activity. */
    autoFinish(s) {
      let saved = 0;
      const need = () => Math.max(0, P.status(s).over);
      if (need() > 0) saved += ACTIONS.dropBreak(s);
      if (need() > 0) saved += ACTIONS.shorten(s, need());
      let guard = 0;
      while (need() > 0 && guard++ < 10) {
        const before = need();
        const n = ACTIONS.skipNext(s);
        if (!n) break;
        saved += n;
        if (need() >= before) break;
      }
      return saved;
    },
  };

  /* Ranked options with an honest estimate of what each one saves. disruption 1 = mildest. */
  P.options = function (session) {
    const s = session || TCL.session(); if (!s) return [];
    const st = P.status(s);
    const flex = flexPending(s);
    const next = remainingActivities(s).filter(a => a.id !== s.currentActivityId)[0];
    const breaks = remainingActivities(s).filter(a => a.kind === "break" && a.id !== s.currentActivityId);
    const out = [];

    const breakMin = U.sum(breaks.map(a => TCL.Duration.activity(a, s) + TCL.Duration.TRANSITION_MIN));
    if (breaks.length) out.push({ id: "dropBreak", disruption: 1, label: "Remove the scheduled break", detail: `${U.plural(breaks.length, "break")} still to come.`, saves: breakMin });

    if (flex.length) {
      const trim = P.dryRun(s, "shorten", st.over);
      if (trim > 0.4) out.push({ id: "shorten", disruption: 2, label: "Shorten the remaining activities", detail: `Trims question and round counts across ${U.plural(flex.length, "activity", "activities")} until the session fits.`, saves: trim });
      const one = P.dryRun(s, "fewer");
      /* Trimming to fit and taking one item off each often land on the same number. Two options
         that save the same minutes and read almost alike are a decision to make under pressure
         with nothing to decide, so offer only the fit-targeted one when they converge. */
      const sameAsTrim = trim > 0.4 && Math.round(one) === Math.round(trim);
      if (one > 0.4 && !sameAsTrim) out.push({ id: "fewer", disruption: 2, label: "One less question in each remaining activity", detail: `Takes a single item off ${U.plural(flex.length, "activity", "activities")}.`, saves: one });
    }
    if (next) out.push({ id: "skipNext", disruption: 4, label: `Skip the next activity (${next.title})`, detail: "It stays in the run sheet as skipped and can be reset later.", saves: TCL.Duration.activity(next, s) + TCL.Duration.TRANSITION_MIN });
    if (st.over > 0) out.push({ id: "autoFinish", disruption: 5, label: "Finish on time automatically", detail: "Drops breaks, then trims activities, then skips as a last resort. Never changes the activity that is running.", saves: st.over });
    out.push({ id: "extend", disruption: 3, label: `Extend the session by ${Math.max(5, Math.ceil(st.over || 5))} minutes`, detail: "Nothing is cut. Only do this if the meeting can actually run longer.", saves: -Math.max(5, Math.ceil(st.over || 5)) });

    /* Recommend the mildest option that closes the gap on its own. */
    const closes = out.filter(o => o.saves >= st.over - 0.5 && o.id !== "extend" && o.id !== "autoFinish");
    const rec = U.sortBy(closes, o => o.disruption)[0] || out.find(o => o.id === "autoFinish") || out[0];
    out.forEach(o => { o.recommended = rec && o.id === rec.id; });
    return U.sortBy(out, o => o.disruption);
  };

  /* Estimate an action without keeping the change: snapshot, run, restore. */
  P.dryRun = function (session, id, needMin) {
    const s = session || TCL.session(); if (!s) return 0;
    const fn = ACTIONS[id]; if (!fn) return 0;
    const snapshot = JSON.stringify(s.runSheet.map(a => ({ settings: a.settings, status: a.status })));
    const target = s.targetMinutes;
    let saved = 0;
    try { saved = fn(s, needMin) || 0; } catch (e) { saved = 0; }
    const before = JSON.parse(snapshot);
    s.runSheet.forEach((a, i) => { a.settings = before[i].settings; a.status = before[i].status; });
    s.targetMinutes = target;
    return saved;
  };

  P.apply = function (id, session) {
    const s = session || TCL.session(); if (!s) return { ok: false };
    const fn = ACTIONS[id]; if (!fn) return { ok: false };
    const labels = { shorten: "Shortened remaining activities", fewer: "One less item per remaining activity", skipNext: "Skipped the next activity", dropBreak: "Removed the scheduled break", extend: "Extended the session", autoFinish: "Auto-adjusted to finish on time" };
    TCL.History.record("Running late: " + (labels[id] || id), { safeRedo: false });
    const saved = fn(s) || 0;
    TCL.History.log((labels[id] || id) + (saved > 0 ? ` (saved ${U.fmtMin(saved)})` : ""));
    TCL.Session.touch();
    TCL.emit("runner:changed");
    return { ok: true, saved };
  };
})();
