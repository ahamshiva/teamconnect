/* src/core/33-teams.js
   Participants and teams. All functions operate on the current session. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Teams = TCL.Teams = {};
  Teams.COLORS = ["#ff4d6d", "#23d5ab", "#ffb454", "#5e8bff", "#c77dff", "#4dd0e1"];
  Teams.NAMES = ["Thunder Llamas", "Chai Champions", "Ctrl+Alt+Defeat", "Mute Button Mafia", "The Spreadsheeters", "Bandwidth Bandits"];
  /* Demo names only, deliberately spread across the cultures this app is used by.
     Real rosters are typed in or imported on the day and never live in the source. */
  Teams.SAMPLE_ROSTER = ["Ana", "Bao", "Chen", "Deepa", "Ellie", "Farid", "Grace", "Hari", "Ivy", "Jomar", "Kiran", "Lian", "Mei", "Nikhil", "Omar"];

  /* The single definition of a team's shape. Anything added here is part of the plan and
     survives a duplicate; run state (like a rotation pointer) is added elsewhere at run
     time and listed in Session.TEAM_RUN_KEYS so it gets cleared. */
  Teams.newTeam = function (name, color, extra) {
    return Object.assign({ id: U.uid("t"), name: String(name == null ? Teams.NAMES[0] : name).trim().slice(0, 40), color: color || Teams.COLORS[0], memberIds: [] }, extra || {});
  };
  Teams.newParticipant = function (name, extra) {
    return Object.assign({ id: U.uid("p"), name: String(name).trim().slice(0, 60), location: "", present: true, fact: "" }, extra || {});
  };
  Teams.present = function (s) { s = s || TCL.session(); return s ? s.participants.filter(p => p.present) : []; };
  Teams.refreshNames = function (s) { s = s || TCL.session(); if (s) U.dedupeNames(s.participants); };
  Teams.displayName = function (pid, s) { s = s || TCL.session(); const p = s && U.byId(s.participants, pid); return p ? (p.displayName || p.name) : "?"; };
  Teams.teamOf = function (pid, s) { s = s || TCL.session(); return s ? s.teams.find(t => t.memberIds.includes(pid)) || null : null; };
  Teams.members = function (team, s) { s = s || TCL.session(); return team.memberIds.map(id => U.byId(s.participants, id)).filter(Boolean); };
  Teams.presentMembers = function (team, s) { return Teams.members(team, s).filter(p => p.present); };

  /* Parse pasted names: commas or new lines; "Name, Location" pairs allowed when a pair contains a colon or tab. */
  Teams.parseNames = function (text) {
    return String(text || "").split(/[\n,;]+/).map(x => x.trim()).filter(Boolean).slice(0, 200);
  };
  Teams.add = function (names, extra) {
    const s = TCL.session(); if (!s) return [];
    const added = (Array.isArray(names) ? names : [names]).map(n => Teams.newParticipant(n, extra)).filter(p => p.name);
    s.participants.push(...added);
    Teams.refreshNames(s);
    return added;
  };
  Teams.remove = function (pid) {
    const s = TCL.session(); if (!s) return;
    s.participants = s.participants.filter(p => p.id !== pid);
    s.teams.forEach(t => { t.memberIds = t.memberIds.filter(id => id !== pid); });
    Teams.refreshNames(s);
  };
  Teams.setPresent = function (pid, on) {
    const s = TCL.session(); const p = s && U.byId(s.participants, pid);
    if (p) p.present = !!on;
  };

  /* Create n teams and deal present participants round-robin; unassigned absentees stay off-team.
     Location-aware: when locations exist, deal per location group so each team mixes cities. */
  Teams.build = function (n, opts) {
    const s = TCL.session(); if (!s) return;
    opts = opts || {};
    n = U.clamp(Number(n) || 3, 1, 6);
    const keepNames = s.teams.map(t => t.name);
    s.teams = Array.from({ length: n }, (_, i) => Teams.newTeam(keepNames[i] || Teams.NAMES[i], Teams.COLORS[i]));
    const pool = Teams.present(s);
    const groups = {};
    pool.forEach(p => { const k = opts.mixLocations === false ? "" : (p.location || "").trim().toLowerCase(); (groups[k] = groups[k] || []).push(p); });
    let cursor = 0;
    Object.keys(groups).sort().forEach(k => {
      U.shuffle(groups[k]).forEach(p => { s.teams[cursor % n].memberIds.push(p.id); cursor++; });
    });
    /* Rebalance sizes in case group dealing left a gap larger than 1 */
    Teams.rebalance();
    s.teamsLocked = false;
  };
  Teams.rebalance = function () {
    const s = TCL.session(); if (!s || !s.teams.length) return;
    const present = new Set(Teams.present(s).map(p => p.id));
    /* Unassigned present people join the smallest team */
    const assigned = new Set(s.teams.flatMap(t => t.memberIds));
    Teams.present(s).forEach(p => { if (!assigned.has(p.id)) smallest(s).memberIds.push(p.id); });
    let guard = 0;
    while (guard++ < 100) {
      const sizes = s.teams.map(t => t.memberIds.filter(id => present.has(id)).length);
      const max = Math.max(...sizes), min = Math.min(...sizes);
      if (max - min <= 1) break;
      const from = s.teams[sizes.indexOf(max)], to = s.teams[sizes.indexOf(min)];
      const movable = from.memberIds.filter(id => present.has(id));
      const pid = movable[movable.length - 1];
      from.memberIds = from.memberIds.filter(id => id !== pid);
      to.memberIds.push(pid);
    }
  };
  function smallest(s) { return U.sortBy(s.teams, t => Teams.presentMembers(t, s).length)[0]; }
  Teams.move = function (pid, teamId) {
    const s = TCL.session(); if (!s) return;
    s.teams.forEach(t => { t.memberIds = t.memberIds.filter(id => id !== pid); });
    const t = U.byId(s.teams, teamId);
    if (t) t.memberIds.push(pid);
  };
  Teams.rename = function (teamId, name) { const s = TCL.session(); const t = s && U.byId(s.teams, teamId); if (t) t.name = String(name).trim().slice(0, 40) || t.name; };
  Teams.assignLate = function (pid) { const s = TCL.session(); if (!s || !s.teams.length) return; if (!Teams.teamOf(pid, s)) smallest(s).memberIds.push(pid); };

  /* Fair rotation pointer per team: next present member in order, remembered in team.rotPtr[key] */
  Teams.nextMember = function (team, key, advance) {
    const s = TCL.session();
    const all = Teams.presentMembers(team, s);
    const members = all.filter(p => !Teams.deferred(s).includes(p.id)).length ? all.filter(p => !Teams.deferred(s).includes(p.id)) : all;
    if (!members.length) return null;
    team.rot = team.rot || {};
    const ptr = team.rot[key] || 0;
    const p = members[ptr % members.length];
    if (advance) { team.rot[key] = (ptr + 1) % members.length; if (TCL.Participation) TCL.Participation.record(p.id, key, s); }
    return p;
  };
  /* Someone who has dropped off Zoom or asked to sit one out. They stay on the roster and
     stay eligible later; they are only taken out of the rotation for now. */
  Teams.deferred = function (s) { s = s || TCL.session(); return (s && s.deferred) || []; };
  Teams.defer = function (pid, on, s) {
    s = s || TCL.session(); if (!s) return;
    s.deferred = (s.deferred || []).filter(id => id !== pid);
    if (on !== false) s.deferred.push(pid);
    TCL.Session.touch();
  };
  Teams.clearDeferred = function (s) { s = s || TCL.session(); if (s) { s.deferred = []; TCL.Session.touch(); } };
  Teams.eligible = function (s) {
    s = s || TCL.session();
    const out = Teams.present(s).filter(p => !Teams.deferred(s).includes(p.id));
    return out.length ? out : Teams.present(s);   // never rotate to nobody
  };
  /* Put one person at the front of the queue for the next turn of this rotation key. */
  Teams.setNext = function (key, pid, s) {
    s = s || TCL.session(); if (!s) return;
    s.rotNext = s.rotNext || {};
    s.rotNext[key] = pid;
    TCL.Session.touch();
  };
  Teams.peekParticipant = function (key, s) {
    s = s || TCL.session(); const list = Teams.eligible(s);
    if (!list.length) return null;
    const forced = s.rotNext && s.rotNext[key];
    if (forced) { const p = U.byId(list, forced); if (p) return p; }
    return list[(s.rot && s.rot[key] || 0) % list.length];
  };
  /* Rotation across all eligible participants: session-level pointer */
  Teams.nextParticipant = function (key, advance) {
    const s = TCL.session(); const list = Teams.eligible(s);
    if (!list.length) return null;
    s.rot = s.rot || {};
    s.rotNext = s.rotNext || {};
    let p = null;
    if (s.rotNext[key]) { p = U.byId(list, s.rotNext[key]); if (advance) delete s.rotNext[key]; }
    const ptr = s.rot[key] || 0;
    if (!p) p = list[ptr % list.length];
    if (advance) { s.rot[key] = (ptr + 1) % list.length; if (TCL.Participation) TCL.Participation.record(p.id, key, s); }
    return p;
  };

  /* Problems for the session/team setup: [{level, message}] */
  Teams.problems = function () {
    const s = TCL.session(); if (!s) return [];
    const out = [];
    const n = Teams.present(s).length;
    if (n === 0) out.push({ level: "error", message: "No participants are marked present." });
    else if (n === 1) out.push({ level: "warn", message: "Only one participant is present. Most games need at least two." });
    if (s.teamMode === "teams") {
      if (!s.teams.length) out.push({ level: "warn", message: "No teams yet. Create teams or switch to individual mode." });
      s.teams.forEach(t => { if (!Teams.presentMembers(t, s).length) out.push({ level: "warn", message: `Team "${t.name}" has nobody present.` }); });
      if (s.teams.length > n && n > 0) out.push({ level: "warn", message: "More teams than present participants." });
    }
    const dupes = {};
    s.participants.forEach(p => { const k = p.name.trim().toLowerCase(); dupes[k] = (dupes[k] || 0) + 1; });
    Object.keys(dupes).filter(k => dupes[k] > 1).forEach(k => out.push({ level: "info", message: `Duplicate name "${k}" is shown with a number so nobody gets mixed up.` }));
    return out;
  };
})();
