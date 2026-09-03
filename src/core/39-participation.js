/* src/core/39-participation.js
   Private participation tracking. Records who has taken a turn in which role so the
   facilitator can spread opportunities. Never leaves the console: it is not in the
   presentation payload, the results screen or the exported summary. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Part = TCL.Participation = {};

  /* Human labels for the rotation keys games use. */
  const ROLES = Part.ROLES = {
    spotlight: "In the spotlight", describer: "Described", drawer: "Drew", actor: "Acted",
    guesser: "Guessed", spokesperson: "Presented", reader: "Read aloud", holder: "Held a clue", turn: "Took a turn",
  };
  Part.roleLabel = key => ROLES[key] || U.titleCase(String(key || "turn").replace(/[-_]/g, " "));

  Part.record = function (pid, roleKey, session) {
    const s = session || TCL.session();
    if (!s || !pid) return;
    s.participation = s.participation || {};
    const rec = s.participation[pid] = s.participation[pid] || { turns: 0, roles: {}, lastAt: null };
    rec.turns += 1;
    const k = roleKey || "turn";
    rec.roles[k] = (rec.roles[k] || 0) + 1;
    rec.lastAt = Date.now();
  };

  /* Rows for the private panel: everyone present, most-neglected first. */
  Part.rows = function (session) {
    const s = session || TCL.session(); if (!s) return [];
    const p = s.participation || {};
    const rows = TCL.Teams.present(s).map(x => {
      const rec = p[x.id] || { turns: 0, roles: {}, lastAt: null };
      const team = TCL.Teams.teamOf(x.id, s);
      return { id: x.id, name: x.displayName || x.name, turns: rec.turns, roles: rec.roles, lastAt: rec.lastAt,
        teamName: team ? team.name : "", color: team ? team.color : "var(--gold)",
        roleText: Object.keys(rec.roles).map(k => `${Part.roleLabel(k)}${rec.roles[k] > 1 ? " ×" + rec.roles[k] : ""}`).join(", ") };
    });
    /* fewest turns first; among equals, the person waiting longest since their last turn */
    return U.sortBy(rows, r => r.turns * 1e13 + (r.lastAt || 0));
  };
  Part.notYet = function (session) { return Part.rows(session).filter(r => r.turns === 0); };

  /* How often each team has been awarded points, as a rough "who is answering" signal. */
  Part.teamActivity = function (session) {
    const s = session || TCL.session(); if (!s) return [];
    const counts = {};
    (s.scoreEvents || []).forEach(e => { if (e.undone || !e.teamId) return; counts[e.teamId] = (counts[e.teamId] || 0) + 1; });
    return U.sortBy(s.teams.map(t => ({ id: t.id, name: t.name, color: t.color, answers: counts[t.id] || 0 })), r => r.answers, true);
  };

  /* Who should go next on fairness alone: fewest turns, then longest since their last one,
     ignoring anyone currently sitting out. */
  Part.suggest = function (session) {
    const s = session || TCL.session(); if (!s) return null;
    const out = TCL.Teams.deferred(s);
    const rows = Part.rows(s).filter(r => !out.includes(r.id));
    return rows.length ? rows[0] : null;
  };
  Part.reset = function (session) { const s = session || TCL.session(); if (s) { s.participation = {}; TCL.Session.touch(); } };
})();
