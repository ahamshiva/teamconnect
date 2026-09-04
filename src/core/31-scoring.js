/* src/core/31-scoring.js
   Score events are append-only records; totals are derived. Undo flips a flag. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Scoring = TCL.Scoring = {};
  const recent = {};   // double-click guard keyed by activity+target+reason

  Scoring.enabledFor = function (activity) {
    const s = TCL.session();
    if (!s || s.scoringEnabled === false) return false;
    if (!activity) return true;
    return activity.settings && activity.settings.scoringEnabled !== false;
  };

  /* award({activityId, teamId?, participantId?, points, reason}) -> event or null when guarded */
  Scoring.award = function (o) {
    const s = TCL.session(); if (!s) return null;
    if (!Array.isArray(s.scoreEvents)) s.scoreEvents = [];
    const key = [o.activityId, o.teamId || "", o.participantId || "", o.reason || "", o.round == null ? "" : o.round].join("|");
    const now = Date.now();
    if (recent[key] && now - recent[key] < 600 && !o.force) return null;   // rapid duplicate click
    recent[key] = now;
    const ev = { id: U.uid("sc"), ts: now, activityId: o.activityId, teamId: o.teamId || null, participantId: o.participantId || null,
      points: Number(o.points) || 0, reason: o.reason || "", round: o.round == null ? null : o.round, undone: false };
    s.scoreEvents.push(ev);
    TCL.emit("score:changed", ev);
    return ev;
  };
  /* Has this target already been scored for this activity round with this reason? */
  Scoring.alreadyScored = function (activityId, round, targetId, reason) {
    const s = TCL.session(); if (!s) return false;
    return (s.scoreEvents || []).some(e => !e.undone && e.activityId === activityId && e.round === round &&
      (e.teamId === targetId || e.participantId === targetId) && (reason == null || e.reason === reason));
  };
  Scoring.undoEvent = function (id) {
    const s = TCL.session(); if (!s) return;
    const ev = U.byId(s.scoreEvents || [], id);
    if (ev) { ev.undone = true; TCL.emit("score:changed", ev); }
  };
  Scoring.restoreEvent = function (id) {
    const s = TCL.session(); if (!s) return;
    const ev = U.byId(s.scoreEvents || [], id);
    if (ev) { ev.undone = false; TCL.emit("score:changed", ev); }
  };
  Scoring.eventsFor = function (activityId) {
    const s = TCL.session(); if (!s) return [];
    return (s.scoreEvents || []).filter(e => e.activityId === activityId);
  };
  Scoring.discardActivity = function (activityId) {
    const s = TCL.session(); if (!s) return 0;
    let n = 0;
    (s.scoreEvents || []).forEach(e => { if (e.activityId === activityId && !e.undone) { e.undone = true; n++; } });
    TCL.emit("score:changed");
    return n;
  };
  Scoring.removeActivity = function (activityId) {
    const s = TCL.session(); if (!s) return;
    s.scoreEvents = (s.scoreEvents || []).filter(e => e.activityId !== activityId);
  };
  Scoring.teamTotal = function (teamId, activityId) {
    const s = TCL.session(); if (!s) return 0;
    return U.sum((s.scoreEvents || []).filter(e => !e.undone && e.teamId === teamId && (activityId == null || e.activityId === activityId)).map(e => e.points));
  };
  Scoring.participantTotal = function (pid, activityId) {
    const s = TCL.session(); if (!s) return 0;
    return U.sum((s.scoreEvents || []).filter(e => !e.undone && e.participantId === pid && (activityId == null || e.activityId === activityId)).map(e => e.points));
  };
  /* ---------- scoring models ----------
     Raw points are the append-only truth. A model decides what each activity is worth in
     the championship, because a 12-question quiz and a 5-minute charades round are not
     comparable on raw points and one of them would otherwise decide the whole session. */
  Scoring.MODELS = [
    { id: "balanced", short: "Balanced", label: "Balanced: every scored activity is worth up to 100", help: "Each activity's points are scaled so the best team in it earns 100. A long quiz counts the same as a short game." },
    { id: "placement", short: "Placement", label: "Placement: 30 / 20 / 10 per activity", help: "Only the order within each activity matters. Ties share the higher award." },
    { id: "raw", short: "Raw points", label: "Raw: the points the activities award", help: "Whatever each activity gives. Simple, but a big activity can decide the session." },
  ];
  Scoring.PLACEMENT = [30, 20, 10];
  Scoring.model = function (session) { const s = session || TCL.session(); return (s && s.scoreModel) || "raw"; };
  Scoring.modelLabel = function (session) { const m = Scoring.MODELS.find(x => x.id === Scoring.model(session)); return m ? m.label : "Raw"; };
  /* Short form for chips and badges; the long one is for settings. */
  Scoring.modelShort = function (session) { const m = Scoring.MODELS.find(x => x.id === Scoring.model(session)); return m ? m.short : "Raw points"; };

  /* Raw points per target for one activity. */
  Scoring.rawFor = function (activityId) {
    const s = TCL.session(); if (!s) return {};
    const out = {};
    (s.scoreEvents || []).forEach(e => { if (e.undone || e.activityId !== activityId) return; const id = e.teamId || e.participantId; out[id] = (out[id] || 0) + e.points; });
    return out;
  };
  /* What one activity contributes to the championship under the current model.
     Manual adjustments always pass through raw: they are facilitator corrections. */
  Scoring.contributionFor = function (activityId, session) {
    const raw = Scoring.rawFor(activityId);
    const model = Scoring.model(session);
    if (model === "raw" || activityId === "manual") return raw;
    const ids = Object.keys(raw);
    if (!ids.length) return {};
    if (model === "balanced") {
      const top = Math.max.apply(null, ids.map(id => raw[id]));
      if (top <= 0) return {};
      /* The best team in an activity earns 100. Negative marking can drive a raw total well
         below zero, so the floor is clamped too: one bad round must not be able to subtract
         several activities' worth of championship points. */
      const out = {};
      ids.forEach(id => { out[id] = U.clamp(Math.round((raw[id] / top) * 100), -100, 100); });
      return out;
    }
    /* placement: rank within the activity, ties share the higher award */
    const ordered = U.sortBy(ids.filter(id => raw[id] > 0), id => raw[id], true);
    const out = {};
    let place = 0, prev = null;
    ordered.forEach((id, i) => { if (raw[id] !== prev) { place = i; prev = raw[id]; } out[id] = Scoring.PLACEMENT[place] || 0; });
    return out;
  };
  /* Championship total for one target across every activity. */
  Scoring.modelTotal = function (targetId, session) {
    const s = session || TCL.session(); if (!s) return 0;
    const ids = s.runSheet.filter(a => !a.scoresDiscarded).map(a => a.id).concat(["manual"]);
    return U.sum(ids.map(id => Scoring.contributionFor(id, s)[targetId] || 0));
  };

  /* Standings: [{id, name, color, total, raw, rank, tied}] for teams or individuals.
     `total` is what the model says; `raw` is what the games actually awarded. */
  Scoring.standings = function () {
    const s = TCL.session(); if (!s) return [];
    const model = Scoring.model(s);
    let rows;
    if (s.teamMode === "individual") {
      rows = s.participants.filter(p => p.present).map(p => ({ id: p.id, name: p.displayName || p.name, color: "var(--gold)", raw: Scoring.participantTotal(p.id), kind: "participant" }));
    } else {
      rows = s.teams.map(t => ({ id: t.id, name: t.name, color: t.color, raw: Scoring.teamTotal(t.id), kind: "team" }));
    }
    rows.forEach(r => { r.total = model === "raw" ? r.raw : Scoring.modelTotal(r.id, s); });
    rows = U.sortBy(rows, r => r.total, true);
    let rank = 0, prev = null;
    rows.forEach((r, i) => { if (r.total !== prev) { rank = i + 1; prev = r.total; } r.rank = rank; });
    rows.forEach(r => { r.tied = rows.filter(x => x.total === r.total).length > 1; });
    return rows;
  };
  Scoring.perActivity = function () {
    const s = TCL.session(); if (!s) return {};
    const out = {};
    (s.scoreEvents || []).forEach(e => {
      if (e.undone) return;
      const tid = e.teamId || e.participantId;
      out[e.activityId] = out[e.activityId] || {};
      out[e.activityId][tid] = (out[e.activityId][tid] || 0) + e.points;
    });
    return out;
  };
  /* Per activity, under the current model: { activityId: { targetId: points } } */
  Scoring.perActivityModel = function () {
    const s = TCL.session(); if (!s) return {};
    const out = {};
    s.runSheet.forEach(a => { out[a.id] = Scoring.contributionFor(a.id, s); });
    out.manual = Scoring.contributionFor("manual", s);
    return out;
  };
  Scoring.manualAdjust = function (targetId, points, reason) {
    const s = TCL.session(); if (!s) return null;
    const isTeam = s.teams.some(t => t.id === targetId);
    return Scoring.award({ activityId: "manual", teamId: isTeam ? targetId : null, participantId: isTeam ? null : targetId, points, reason: reason || "Manual adjustment", force: true });
  };
})();
