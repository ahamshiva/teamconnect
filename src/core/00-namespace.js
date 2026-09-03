/* src/core/00-namespace.js
   TEAM CONNECT LIVE: global namespace, event bus and small utilities.
   Every module attaches to window.TCL so the final file needs no module loader. */
(function () {
  "use strict";
  const TCL = window.TCL = window.TCL || {};
  TCL.VERSION = "1.0.0";
  window.__tclErrors = window.__tclErrors || [];
  window.addEventListener("error", e => { window.__tclErrors.push(String(e.message || e)); });
  window.addEventListener("unhandledrejection", e => { window.__tclErrors.push("unhandled: " + String(e.reason)); });
  TCL.SCHEMA_VERSION = 1;
  TCL.STORE_KEY = "teamConnectLive_v1";
  TCL.LEGACY_KEY = "teamGames50min_v7";

  /* ---------- event bus ---------- */
  const listeners = {};
  TCL.on = function (evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return () => TCL.off(evt, fn);
  };
  TCL.off = function (evt, fn) {
    if (!listeners[evt]) return;
    listeners[evt] = listeners[evt].filter(f => f !== fn);
  };
  TCL.emit = function (evt, payload) {
    (listeners[evt] || []).slice().forEach(fn => {
      try { fn(payload); } catch (e) { console.error("[TCL] listener error on", evt, e); }
    });
  };

  /* ---------- utilities ---------- */
  const U = TCL.util = {};
  let seq = 0;
  U.uid = function (prefix) {
    seq += 1;
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + (seq).toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  };
  U.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  };
  U.clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  /* Settings can arrive from an imported preset, a restored backup or hand-edited storage,
     none of which pass through the settings form's coercion. A NaN from one of those does
     not throw: every comparison against it is false, so a limit silently stops applying and
     a calculation silently becomes zero. Read every numeric setting through this. */
  U.num = function (value, fallback, min, max) {
    let n = typeof value === "number" ? value : parseFloat(value);
    if (!isFinite(n)) n = isFinite(fallback) ? fallback : 0;
    if (min != null) n = Math.max(min, n);
    if (max != null) n = Math.min(max, n);
    return n;
  };
  U.clone = obj => JSON.parse(JSON.stringify(obj));
  U.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.sum = arr => arr.reduce((s, n) => s + (Number(n) || 0), 0);
  U.pad2 = n => String(n).padStart(2, "0");
  /* mm:ss or h:mm:ss, never negative */
  U.fmtMs = function (ms) {
    const total = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return h ? `${h}:${U.pad2(m)}:${U.pad2(s)}` : `${U.pad2(m)}:${U.pad2(s)}`;
  };
  U.fmtMin = function (minutes) {
    const m = Math.round(minutes);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  };
  U.plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + "s")}`;
  U.debounce = function (fn, ms) {
    let t = null;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  };
  U.byId = (arr, id) => arr.find(x => x.id === id) || null;
  U.words = s => String(s || "").trim().split(/\s+/).filter(Boolean);
  U.titleCase = s => String(s || "").replace(/\b\w/g, c => c.toUpperCase());
  U.today = () => new Date().toISOString().slice(0, 10);
  U.fmtDate = function (iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) + " " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };
  /* Stable sort helper */
  U.sortBy = (arr, fn, desc) => arr.map((x, i) => ({ x, i, k: fn(x) }))
    .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : a.i - b.i) * (desc ? -1 : 1))
    .map(o => o.x);
  /* CSV: parse and serialise (RFC 4180 subset with quotes) */
  U.parseCSV = function (text) {
    const rows = []; let row = [], field = "", inQ = false;
    const src = String(text || "").replace(/\r\n?/g, "\n");
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inQ) {
        if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(f => f.trim() !== ""));
  };
  U.toCSV = function (rows) {
    const q = v => { const s = String(v == null ? "" : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return rows.map(r => r.map(q).join(",")).join("\n");
  };
  U.download = function (filename, text, mime) {
    try {
      const blob = new Blob([text], { type: mime || "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
      return true;
    } catch (e) { return false; }
  };
  U.copyText = async function (text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand && document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (e) { return false; }
  };
  /* Disambiguate duplicate names: "Sam", "Sam (2)", "Sam (3)" */
  U.dedupeNames = function (people) {
    const seen = {};
    people.forEach(p => {
      const base = p.name.replace(/\s\(\d+\)$/, "");
      seen[base.toLowerCase()] = (seen[base.toLowerCase()] || 0) + 1;
      p.displayName = seen[base.toLowerCase()] > 1 ? `${base} (${seen[base.toLowerCase()]})` : base;
    });
    return people;
  };
})();
