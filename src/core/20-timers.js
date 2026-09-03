/* src/core/20-timers.js
   Timestamp-based timers. Remaining time is derived from wall-clock timestamps,
   so background-tab throttling and laptop sleep cannot drift the count.
   Timer records live in session.timers so a refresh restores them exactly. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Timers = TCL.Timers = {};
  const NAMES = Timers.NAMES = ["session", "activity", "round", "break", "breakout"];

  Timers.blank = function (direction) {
    return { status: "idle", direction: direction || "down", durationMs: 0, remainingMs: 0, elapsedMs: 0, startedAt: null, label: "", warnAtMs: 10000 };
  };
  Timers.blankSet = function () {
    return { session: Timers.blank("up"), activity: Timers.blank("up"), round: Timers.blank("down"), break: Timers.blank("down"), breakout: Timers.blank("down") };
  };

  function bag() {
    const s = TCL.session && TCL.session();
    if (!s) return null;
    if (!s.timers) s.timers = Timers.blankSet();
    NAMES.forEach(n => { if (!s.timers[n]) s.timers[n] = Timers.blank(n === "session" || n === "activity" ? "up" : "down"); });
    return s.timers;
  }
  Timers.get = function (name) { const b = bag(); return b ? b[name] : null; };

  /* Derived values, always from timestamps. */
  Timers.remaining = function (name) {
    const t = Timers.get(name);
    if (!t) return 0;
    if (t.direction === "up") return Math.max(0, t.durationMs - Timers.elapsed(name));
    if (t.status === "running") return Math.max(0, t.remainingMs - (Date.now() - t.startedAt));
    return Math.max(0, t.remainingMs);
  };
  Timers.elapsed = function (name) {
    const t = Timers.get(name);
    if (!t) return 0;
    if (t.direction === "up") {
      return t.status === "running" ? t.elapsedMs + (Date.now() - t.startedAt) : t.elapsedMs;
    }
    return Math.max(0, t.durationMs - Timers.remaining(name));
  };
  Timers.fraction = function (name) {
    const t = Timers.get(name);
    if (!t || !t.durationMs) return 0;
    return U.clamp(Timers.remaining(name) / t.durationMs, 0, 1);
  };

  /* Start (or restart) a countdown. opts: { durationMs, label, warnAtMs } */
  Timers.start = function (name, opts) {
    const t = Timers.get(name); if (!t) return;
    opts = opts || {};
    t.direction = opts.direction || (name === "session" || name === "activity" ? "up" : "down");
    let ms = opts.durationMs != null ? opts.durationMs : t.durationMs;
    /* Rehearsal runs on compressed clocks so a practice round takes seconds, not minutes.
       The session and activity clocks count up and stay honest. */
    if (t.direction === "down" && TCL.Rehearsal && TCL.Rehearsal.active()) ms = TCL.Rehearsal.scale(ms);
    t.durationMs = Math.max(0, ms);
    t.remainingMs = t.durationMs;
    t.elapsedMs = 0;
    t.startedAt = Date.now();
    t.status = "running";
    t.label = opts.label || t.label || "";
    if (opts.warnAtMs != null) t.warnAtMs = opts.warnAtMs;
    doneFired[name] = false;
    TCL.emit("timer:change", name);
  };
  Timers.pause = function (name) {
    const t = Timers.get(name); if (!t || t.status !== "running") return;
    if (t.direction === "up") t.elapsedMs += Date.now() - t.startedAt;
    else t.remainingMs = Math.max(0, t.remainingMs - (Date.now() - t.startedAt));
    t.startedAt = null;
    t.status = "paused";
    TCL.emit("timer:change", name);
  };
  Timers.resume = function (name) {
    const t = Timers.get(name); if (!t) return;
    if (t.status !== "paused" && t.status !== "idle") return;
    if (t.direction === "down" && t.remainingMs <= 0 && t.status === "paused") return;
    t.startedAt = Date.now();
    t.status = "running";
    TCL.emit("timer:change", name);
  };
  Timers.toggle = function (name) {
    const t = Timers.get(name); if (!t) return;
    if (t.status === "running") Timers.pause(name); else Timers.resume(name);
  };
  Timers.stop = function (name) {
    const t = Timers.get(name); if (!t) return;
    Timers.pause(name);
    t.status = "idle";
    t.startedAt = null;
    TCL.emit("timer:change", name);
  };
  Timers.reset = function (name) {
    const t = Timers.get(name); if (!t) return;
    t.status = "idle"; t.startedAt = null; t.remainingMs = t.durationMs; t.elapsedMs = 0;
    doneFired[name] = false;
    TCL.emit("timer:change", name);
  };
  /* Add or remove time. Countdown: adjusts remaining. Count-up: adjusts the target. Never below zero. */
  Timers.adjust = function (name, deltaMs) {
    const t = Timers.get(name); if (!t) return;
    if (t.direction === "up") { t.durationMs = Math.max(0, t.durationMs + deltaMs); }
    else {
      const wasRunning = t.status === "running", wasDone = t.status === "done";
      if (wasRunning) Timers.pause(name);
      t.remainingMs = Math.max(0, t.remainingMs + deltaMs);
      if (t.remainingMs > 0 && t.status === "done") t.status = "paused";
      if (deltaMs > 0) doneFired[name] = false;
      if ((wasRunning || wasDone) && t.remainingMs > 0) Timers.resume(name);   /* extending a finished timer keeps it going */
      else if (wasRunning && t.remainingMs === 0) { t.status = "done"; }
    }
    TCL.emit("timer:change", name);
  };
  Timers.pauseAll = function () { NAMES.forEach(n => { const t = Timers.get(n); if (t && t.status === "running") Timers.pause(n); }); };
  Timers.stopAllExcept = function (keep) { NAMES.forEach(n => { if (!keep.includes(n)) Timers.stop(n); }); };

  /* Snapshot for the presentation window: it derives the display locally. */
  Timers.describe = function (name) {
    const t = Timers.get(name);
    if (!t) return null;
    return {
      name, status: t.status, direction: t.direction, durationMs: t.durationMs, label: t.label, warnAtMs: t.warnAtMs,
      remainingMs: Timers.remaining(name), elapsedMs: Timers.elapsed(name), sentAt: Date.now(),
    };
  };
  Timers.fmt = function (name) {
    const t = Timers.get(name); if (!t) return "00:00";
    return t.direction === "up" ? U.fmtMs(Timers.elapsed(name)) : U.fmtMs(Timers.remaining(name));
  };

  /* Tick loop: emits "tick" for display updates and "timer:done" once per completion. */
  const doneFired = {};
  let tickHandle = null;
  Timers.tick = function () {
    const b = bag(); if (!b) return;
    NAMES.forEach(n => {
      const t = b[n];
      if (t.direction === "down" && t.status === "running" && Timers.remaining(n) <= 0) {
        t.remainingMs = 0; t.startedAt = null; t.status = "done";
        if (!doneFired[n]) { doneFired[n] = true; TCL.emit("timer:done", n); }
      }
    });
    TCL.emit("tick");
  };
  Timers.startLoop = function () {
    if (tickHandle) return;
    tickHandle = setInterval(Timers.tick, 250);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) Timers.tick(); });
  };
  Timers.stopLoop = function () { clearInterval(tickHandle); tickHandle = null; };
})();
