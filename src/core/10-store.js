/* src/core/10-store.js
   Versioned localStorage persistence with graceful failure. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Store = TCL.Store = {};
  let memoryFallback = null;      // used when localStorage is unavailable
  Store.available = true;
  Store.lastSavedAt = null;
  Store.lastError = null;

  let probed = null;
  function storage() {
    if (probed !== null) return probed ? window.localStorage : null;
    try {
      const t = "__tcl_probe__";
      window.localStorage.setItem(t, "1");
      window.localStorage.removeItem(t);
      probed = true;
      return window.localStorage;
    } catch (e) {
      probed = false;
      Store.available = false;
      return null;
    }
  }

  Store.defaults = function () {
    return {
      v: TCL.SCHEMA_VERSION,
      settings: {
        sound: true, volume: 0.6, silent: false,
        scoringEnabled: true, showScoresLive: true, hideScoresUntilFinale: false, scoreModel: "balanced",
        largeText: false, presentationScale: 1,
        confirmRoutine: true,
        consoleMode: "simple", soundTested: false, lastBackupAt: null,
        gameDefaults: {},
      },
      content: { custom: [], disabled: [], usage: {}, packs: [], overrides: {} },
      presets: [],
      sessions: [],
      currentSessionId: null,
      seenIntro: false,
    };
  };

  /* Deep-merge defaults into loaded data so new fields never come back undefined. */
  function withDefaults(data) {
    const d = Store.defaults();
    const out = Object.assign({}, d, data || {});
    out.settings = Object.assign({}, d.settings, (data && data.settings) || {});
    if (!out.settings.gameDefaults || typeof out.settings.gameDefaults !== "object") out.settings.gameDefaults = {};
    /* confirmDestructive became confirmRoutine when destructive confirmations stopped being
       skippable at all. Carry the old preference over; it meant the same "stop asking me". */
    if (Object.prototype.hasOwnProperty.call(out.settings, "confirmDestructive")) {
      if (data && data.settings && !Object.prototype.hasOwnProperty.call(data.settings, "confirmRoutine")) out.settings.confirmRoutine = out.settings.confirmDestructive !== false;
      delete out.settings.confirmDestructive;
    }
    out.content = Object.assign({}, d.content, (data && data.content) || {});
    ["custom", "disabled", "packs"].forEach(k => { if (!Array.isArray(out.content[k])) out.content[k] = []; });
    if (!out.content.usage || typeof out.content.usage !== "object") out.content.usage = {};
    if (!out.content.overrides || typeof out.content.overrides !== "object") out.content.overrides = {};
    if (!Array.isArray(out.presets)) out.presets = [];
    if (!Array.isArray(out.sessions)) out.sessions = [];
    return out;
  }

  /* Migrations run in order from data.v to the current schema. */
  const migrations = {
    /* 0 -> 1 : nothing yet. Placeholder shows the pattern for future versions. */
  };
  function migrate(data) {
    let v = Number(data.v || 0);
    while (v < TCL.SCHEMA_VERSION) {
      const fn = migrations[v];
      if (fn) data = fn(data);
      v += 1;
      data.v = v;
    }
    return data;
  }

  Store.load = function () {
    const ls = storage();
    let raw = null;
    try { raw = ls ? ls.getItem(TCL.STORE_KEY) : memoryFallback; } catch (e) { raw = null; }
    if (!raw) return { data: withDefaults(null), status: "fresh" };
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("not an object");
      if (Number(parsed.v || 0) > TCL.SCHEMA_VERSION) {
        return { data: withDefaults(null), status: "newer", raw };
      }
      return { data: withDefaults(migrate(parsed)), status: "ok" };
    } catch (e) {
      /* Corrupted: keep a copy so nothing is lost, start clean. */
      try { if (ls) ls.setItem(TCL.STORE_KEY + "_corrupt_" + Date.now(), raw); } catch (e2) { /* ignore */ }
      return { data: withDefaults(null), status: "corrupt", error: String(e) };
    }
  };

  Store.save = function (data) {
    const ls = storage();
    const json = JSON.stringify(data);
    try {
      if (ls) ls.setItem(TCL.STORE_KEY, json); else memoryFallback = json;
      Store.lastSavedAt = Date.now();
      Store.lastError = null;
      TCL.emit("store:saved");
      return true;
    } catch (e) {
      Store.lastError = /quota/i.test(String(e)) ? "Storage is full. Export your session or delete old sessions." : String(e);
      TCL.emit("store:error", Store.lastError);
      return false;
    }
  };

  Store.clear = function () {
    const ls = storage();
    try { if (ls) ls.removeItem(TCL.STORE_KEY); } catch (e) { /* ignore */ }
    memoryFallback = null;
  };

  /* Legacy PRIME TIME save (teamGames50min_v7) */
  Store.readLegacy = function () {
    const ls = storage();
    if (!ls) return null;
    try {
      const raw = ls.getItem(TCL.LEGACY_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !Array.isArray(s.teams)) return null;
      return {
        roster: Array.isArray(s.roster) ? s.roster : [],
        absent: Array.isArray(s.absent) ? s.absent : [],
        teams: s.teams.map(t => ({
          name: String(t.name || ""),
          players: Array.isArray(t.players) ? t.players : [],
          scores: t.scores || {},
        })),
        played: s.played || {},
      };
    } catch (e) { return null; }
  };

  Store.estimateSize = function () {
    try { return JSON.stringify(TCL.state || {}).length; } catch (e) { return 0; }
  };
})();
