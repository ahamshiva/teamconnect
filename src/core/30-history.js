/* src/core/30-history.js
   Undo / redo with labelled snapshots of the session, plus a visible action log.
   Snapshots exclude the undo stacks and the log themselves. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const History = TCL.History = {};
  const MAX_STACK = 40, PERSISTED = 12, MAX_LOG = 200;

  function snapshot(session) {
    const copy = {};
    Object.keys(session).forEach(k => { if (k !== "undo" && k !== "log") copy[k] = session[k]; });
    return JSON.stringify(copy);
  }
  function ensure(session) {
    if (!session.undo) session.undo = { stack: [], redo: [] };
    if (!Array.isArray(session.log)) session.log = [];
  }

  /* Call BEFORE mutating state. label appears in the action history and on the Undo button. */
  History.record = function (label, opts) {
    const s = TCL.session(); if (!s) return;
    ensure(s);
    opts = opts || {};
    s.undo.stack.push({ label, snap: snapshot(s), ts: Date.now(), safeRedo: opts.safeRedo !== false });
    if (s.undo.stack.length > MAX_STACK) s.undo.stack.shift();
    s.undo.redo = [];
    History.log(label);
  };
  History.log = function (label, kind) {
    const s = TCL.session(); if (!s) return;
    ensure(s);
    s.log.push({ ts: Date.now(), label, kind: kind || "action" });
    if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
  };
  History.canUndo = function () { const s = TCL.session(); return !!(s && s.undo && s.undo.stack.length); };
  History.canRedo = function () { const s = TCL.session(); return !!(s && s.undo && s.undo.redo.length && s.undo.redo[s.undo.redo.length - 1].safeRedo); };
  History.peekUndo = function () { const s = TCL.session(); return s && s.undo && s.undo.stack.length ? s.undo.stack[s.undo.stack.length - 1].label : ""; };
  History.peekRedo = function () { const s = TCL.session(); return s && s.undo && s.undo.redo.length ? s.undo.redo[s.undo.redo.length - 1].label : ""; };

  function restore(session, snap) {
    const data = JSON.parse(snap);
    Object.keys(session).forEach(k => { if (k !== "undo" && k !== "log") delete session[k]; });
    Object.assign(session, data);
    if (TCL.Timers) TCL.Timers.tick();
  }
  History.undo = function () {
    const s = TCL.session(); if (!s || !History.canUndo()) return false;
    const entry = s.undo.stack.pop();
    s.undo.redo.push({ label: entry.label, snap: snapshot(s), ts: Date.now(), safeRedo: entry.safeRedo });
    restore(s, entry.snap);
    History.log("Undo: " + entry.label, "undo");
    TCL.emit("history:changed");
    return true;
  };
  History.redo = function () {
    const s = TCL.session(); if (!s || !History.canRedo()) return false;
    const entry = s.undo.redo.pop();
    s.undo.stack.push({ label: entry.label, snap: snapshot(s), ts: Date.now(), safeRedo: entry.safeRedo });
    restore(s, entry.snap);
    History.log("Redo: " + entry.label, "redo");
    TCL.emit("history:changed");
    return true;
  };
  History.clear = function () { const s = TCL.session(); if (s) s.undo = { stack: [], redo: [] }; };

  /* Trim the persisted stack so the save stays small; the in-memory stack keeps MAX_STACK. */
  History.forPersist = function (session) {
    const u = session.undo || { stack: [], redo: [] };
    return { stack: u.stack.slice(-PERSISTED), redo: u.redo.slice(-PERSISTED) };
  };
})();
