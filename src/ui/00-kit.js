/* src/ui/00-kit.js
   Router, render loop, modal/confirm, toasts, icons, form renderer, shared widgets. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc;
  const UI = TCL.UI = {};
  const screens = {};
  TCL.route = { screen: "home", params: {} };

  UI.registerScreen = function (name, def) { screens[name] = def; };
  TCL.go = function (screen, params) {
    if (!screens[screen]) { console.warn("no screen", screen); return; }
    TCL.route = { screen, params: params || {} };
    try { sessionStorage.setItem("tcl-route", JSON.stringify(TCL.route)); } catch (e) { /* ignore */ }
    window.scrollTo(0, 0);
    UI.render();
    TCL.emit("route:changed", TCL.route);
  };
  TCL.restoreRoute = function () {
    try { const r = JSON.parse(sessionStorage.getItem("tcl-route") || "null"); if (r && screens[r.screen]) TCL.route = r; } catch (e) { /* ignore */ }
  };

  /* ---------- icons (inline SVG, stroke-based) ---------- */
  const I = UI.icons = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>',
    builder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h10M4 18h13"/><circle cx="18" cy="12" r="2"/></svg>',
    people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15 14.5a5 5 0 0 1 6.5 4.8"/></svg>',
    library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="7" height="7" rx="1.5"/><rect x="14" y="4" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    content: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M8 12h8M8 16h5"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    console: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M7 9l3 2-3 2M13 13h4"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-2"/></svg>',
    redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h2"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20h4l10.5-10.5a2 2 0 0 0-4-4L4 16z"/><path d="M13 6l4 4"/></svg>',
    drag: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4L19 6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    unlock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>',
    sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 21V4h11l-1.5 4L16 12H5"/></svg>',
    skip: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14l9-7zM16 5h3v14h-3z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8z"/></svg>',
    export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
    import: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M7 10l5 5 5-5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4a3 3 0 0 0 3 4h1M16 6h4a3 3 0 0 1-3 4h-1M12 13v4M8 21h8M9 17h6"/></svg>',
  };
  UI.icon = (name, cls) => `<span class="ic ${cls || ""}" aria-hidden="true" style="display:inline-flex;width:1.1em;height:1.1em;vertical-align:-.15em">${I[name] || ""}</span>`;

  /* ---------- toast ---------- */
  UI.toast = function (text, kind, ms) {
    let wrap = document.querySelector(".toasts");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; wrap.setAttribute("role", "status"); wrap.setAttribute("aria-live", "polite"); document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.textContent = text;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 320); }, ms || 3200);
  };
  TCL.on("ui:toast", o => UI.toast(o.text, o.kind));

  /* ---------- modal (promise-based; replaces window.confirm/prompt) ---------- */
  let modalEl = null, lastFocus = null;
  UI.closeModal = function () { if (modalEl) { modalEl.remove(); modalEl = null; } if (lastFocus && lastFocus.focus) lastFocus.focus(); };
  /* opts: { title, body(html), buttons:[{label, value, kind, primary}], wide, form(html), onOpen(el) } -> Promise(value|null) */
  UI.modal = function (opts) {
    UI.closeModal();
    lastFocus = document.activeElement;
    return new Promise(resolve => {
      modalEl = document.createElement("div");
      modalEl.className = "modal-back";
      modalEl.innerHTML = `<div class="modal ${opts.wide ? "wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">${esc(opts.title || "")}</h2>
        ${opts.body ? `<div class="body">${opts.body}</div>` : ""}
        ${opts.form || ""}
        <div class="btn-row right" style="margin-top:16px">${(opts.buttons || [{ label: "OK", value: true, primary: true }]).map((b, i) =>
          `<button type="button" class="btn ${b.primary ? "" : (b.kind || "ghost")}" data-mval="${i}">${esc(b.label)}</button>`).join("")}</div>
      </div>`;
      document.body.appendChild(modalEl);
      const buttons = opts.buttons || [{ label: "OK", value: true, primary: true }];
      const finish = v => { UI.closeModal(); resolve(v); };
      modalEl.addEventListener("click", e => {
        const b = e.target.closest("[data-mval]");
        if (b) { const def = buttons[Number(b.dataset.mval)]; finish(typeof def.value === "function" ? def.value(modalEl) : def.value); }
        else if (e.target === modalEl && opts.dismissable !== false) finish(null);
      });
      modalEl.addEventListener("keydown", e => {
        if (e.key === "Escape" && opts.dismissable !== false) finish(null);
        if (e.key === "Tab") {
          const f = Array.from(modalEl.querySelectorAll("button,input,select,textarea,[tabindex]")).filter(x => !x.disabled);
          if (!f.length) return;
          const first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
      if (opts.onOpen) opts.onOpen(modalEl);
      const focusTarget = modalEl.querySelector("input,select,textarea") || modalEl.querySelector(".btn:not(.ghost)") || modalEl.querySelector(".btn");
      if (focusTarget) focusTarget.focus();
    });
  };
  /* Destructive confirmations are never skippable. An audit of every `danger` call site found
     nine of ten destroy something no undo brings back (a session, a preset, a custom question,
     an activity's score events, a hand-built run sheet) and the tenth ends the session in front
     of the room. A per-call opt-out would have to be remembered every time a new one is added,
     and forgetting it would fail unsafely, so there is no opt-out.
     `routine: true` marks an advisory speed bump instead ("finish early?", "start anyway?").
     Those are what the Settings toggle silences, and they destroy nothing. */
  UI.confirm = function (title, body, opts) {
    opts = opts || {};
    const asking = TCL.state && TCL.state.settings ? TCL.state.settings.confirmRoutine !== false : true;
    if (opts.routine && !opts.danger && !asking) return Promise.resolve(true);
    return UI.modal({ title, body, buttons: [{ label: opts.cancelLabel || "Cancel", value: false }, { label: opts.okLabel || "Confirm", value: true, primary: !opts.danger, kind: opts.danger ? "danger" : "" }] }).then(v => !!v);
  };
  UI.prompt = function (title, body, defaultValue, opts) {
    opts = opts || {};
    return UI.modal({ title, body, form: `<div class="field"><label for="modal-input">${esc(opts.label || "")}</label>${opts.multiline ? `<textarea class="input" id="modal-input">${esc(defaultValue || "")}</textarea>` : `<input class="input" id="modal-input" value="${esc(defaultValue || "")}" maxlength="${opts.maxlength || 200}">`}</div>`,
      buttons: [{ label: "Cancel", value: null }, { label: opts.okLabel || "Save", value: el => el.querySelector("#modal-input").value, primary: true }],
      onOpen: el => { const inp = el.querySelector("#modal-input"); if (!opts.multiline) inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); el.querySelector("[data-mval='1']").click(); } }); } });
  };

  /* ---------- settings form renderer ----------
     schema: [{key, label, type: range|number|select|toggle|text|textarea|checks|content, min, max, step, unit, options:[{value,label}], help, showIf: fn(values)}] */
  UI.formField = function (f, value, values) {
    const id = "f_" + f.key;
    const help = f.help ? `<div class="help">${esc(f.help)}</div>` : "";
    if (f.showIf && !f.showIf(values)) return "";
    if (f.type === "range") {
      return `<div class="field" data-key="${f.key}"><label for="${id}">${esc(f.label)}</label><div class="range-wrap"><input type="range" id="${id}" name="${f.key}" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${esc(value)}"><span class="val" data-val-for="${f.key}">${esc(value)}${f.unit ? " " + f.unit : ""}</span></div>${help}</div>`;
    }
    if (f.type === "number") {
      return `<div class="field" data-key="${f.key}"><label for="${id}">${esc(f.label)}</label><input class="input num" type="number" id="${id}" name="${f.key}" min="${f.min != null ? f.min : ""}" max="${f.max != null ? f.max : ""}" step="${f.step || 1}" value="${esc(value)}">${help}</div>`;
    }
    if (f.type === "select") {
      return `<div class="field" data-key="${f.key}"><label for="${id}">${esc(f.label)}</label><select class="input" id="${id}" name="${f.key}">${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(value) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>${help}</div>`;
    }
    if (f.type === "toggle") {
      return `<div class="field" data-key="${f.key}"><span class="lbl">${esc(f.label)}</span><label class="switch"><input type="checkbox" id="${id}" name="${f.key}" ${value ? "checked" : ""}><span class="track"></span><span class="txt">${value ? "On" : "Off"}</span></label>${help}</div>`;
    }
    if (f.type === "textarea") {
      return `<div class="field span2" data-key="${f.key}"><label for="${id}">${esc(f.label)}</label><textarea class="input" id="${id}" name="${f.key}" rows="${f.rows || 3}">${esc(value || "")}</textarea>${help}</div>`;
    }
    if (f.type === "checks") {
      const set = new Set(value || []);
      const opts = typeof f.options === "function" ? f.options() : f.options;
      return `<div class="field span2" data-key="${f.key}"><span class="lbl">${esc(f.label)}</span><div class="checks">${opts.map(o => `<label class="check-chip ${set.has(o.value) ? "on" : ""}"><input type="checkbox" name="${f.key}" value="${esc(o.value)}" ${set.has(o.value) ? "checked" : ""}>${esc(o.label)}</label>`).join("") || '<span class="dim">No options available</span>'}</div>${help || '<div class="help">Leave all unticked to allow every category.</div>'}</div>`;
    }
    return `<div class="field" data-key="${f.key}"><label for="${id}">${esc(f.label)}</label><input class="input" type="text" id="${id}" name="${f.key}" value="${esc(value || "")}" maxlength="${f.maxlength || 200}">${help}</div>`;
  };
  UI.form = function (schema, values) {
    return `<div class="form-grid">${schema.map(f => UI.formField(f, values[f.key], values)).join("")}</div>`;
  };
  /* The settings most facilitators actually change. Everything else is progressive
     disclosure: still there, still applied, just folded away by default. */
  UI.BASIC_KEYS = ["count", "rounds", "turns", "items", "seconds", "minutes", "breakoutMinutes", "collectMinutes",
    "presentSeconds", "discussionSeconds", "storySeconds", "categories", "difficultyMin", "difficultyMax",
    "mode", "format", "room", "scoringEnabled"];
  UI.isBasic = f => f.basic === true || (f.advanced !== true && UI.BASIC_KEYS.includes(f.key));
  /* Basic fields, then a collapsed <details> holding the rest. */
  UI.formTiered = function (schema, values, opts) {
    opts = opts || {};
    const basic = schema.filter(UI.isBasic), adv = schema.filter(f => !UI.isBasic(f));
    if (!adv.length) return `<div class="form-grid">${basic.map(f => UI.formField(f, values[f.key], values)).join("")}</div>`;
    return `<div class="form-grid">${basic.map(f => UI.formField(f, values[f.key], values)).join("")}</div>
      <details class="adv-block" ${opts.open ? "open" : ""}><summary>${UI.icon("settings")} Advanced settings <span class="dim small">(${adv.length})</span></summary>
        <div class="form-grid">${adv.map(f => UI.formField(f, values[f.key], values)).join("")}</div></details>`;
  };
  /* Read values back from a container using the schema. */
  UI.readForm = function (container, schema, base) {
    const out = Object.assign({}, base || {});
    schema.forEach(f => {
      if (f.showIf && !f.showIf(out)) return;
      if (f.type === "checks") { out[f.key] = Array.from(container.querySelectorAll(`input[name="${f.key}"]:checked`)).map(i => i.value); return; }
      const el = container.querySelector(`[name="${f.key}"]`);
      if (!el) return;
      if (f.type === "toggle") out[f.key] = el.checked;
      else if (f.type === "range" || f.type === "number") { let n = Number(el.value); if (isNaN(n)) n = f.min || 0; if (f.min != null) n = Math.max(f.min, n); if (f.max != null) n = Math.min(f.max, n); out[f.key] = n; }
      else out[f.key] = el.value;
    });
    return out;
  };
  /* Live-update range labels and toggle text inside any container */
  UI.bindFormLive = function (container, onChange) {
    container.addEventListener("input", e => {
      const t = e.target;
      if (t.type === "range") { const v = container.querySelector(`[data-val-for="${t.name}"]`); if (v) { const unit = v.textContent.replace(/^[\d.\-]+\s?/, ""); v.textContent = t.value + (unit ? " " + unit : ""); } }
      if (t.type === "checkbox" && t.closest(".switch")) { const txt = t.closest(".switch").querySelector(".txt"); if (txt) txt.textContent = t.checked ? "On" : "Off"; }
      if (t.type === "checkbox" && t.closest(".check-chip")) t.closest(".check-chip").classList.toggle("on", t.checked);
      if (onChange) onChange(t);
    });
  };

  /* ---------- widgets ---------- */
  UI.timerChip = function (name) {
    const T = TCL.Timers, t = T.get(name); if (!t) return "";
    return `<span class="chip mono ${t.status === "running" ? "ok" : t.status === "paused" ? "warn" : ""}" data-timer="${name}"><span class="dot"></span>${esc(t.label || name)} ${T.fmt(name)}</span>`;
  };
  UI.timerBig = function (name, label) {
    const T = TCL.Timers, t = T.get(name); if (!t) return "";
    const rem = T.remaining(name), low = t.direction === "down" && t.status !== "idle" && rem <= (t.warnAtMs || 10000);
    const state = t.status === "running" ? "running" : t.status;
    return `<div class="timer-big ${state} ${low ? "low" : ""}" data-timer-big="${name}"><div><div class="timer-state ${state}">${esc(label || t.label || name)} · ${state}</div><div class="t" aria-live="off">${T.fmt(name)}</div></div></div>`;
  };
  UI.ring = function (name) {
    const T = TCL.Timers, t = T.get(name); if (!t) return "";
    const rem = T.remaining(name), low = t.status !== "idle" && rem <= (t.warnAtMs || 10000);
    const txt = U.fmtMs(rem);
    return `<div class="ring ${low ? "low" : ""} ${t.status}" data-ring="${name}" style="--frac:${T.fraction(name)};--len:${txt.length}"><span class="t">${esc(txt)}</span></div>`;
  };
  UI.scoreList = function (rows, opts) {
    rows = rows || TCL.Scoring.standings();
    if (!rows.length) return '<div class="dim small">No teams yet.</div>';
    return `<div class="scorelist">${rows.map(r => `<div class="scorerow" data-target="${r.id}" style="--tc:${r.color}"><span class="nm">${r.rank === 1 && r.total > 0 ? "👑 " : ""}${esc(r.name)}</span><span class="pts">${r.total}</span></div>`).join("")}</div>`;
  };
  /* Overflow menu. Native <details> so it needs no open/close script and stays keyboard
     accessible. items: [{label, icon, attr, danger, sep}] where attr is the data-* the
     existing delegated handlers already listen for. */
  UI.menu = function (items, opts) {
    opts = opts || {};
    const list = items.filter(Boolean);
    if (!list.length) return "";
    return `<details class="menu ${opts.align === "left" ? "left" : ""}"><summary class="btn ${opts.kind || "ghost"} ${opts.size || "sm"}" title="${esc(opts.title || "More actions")}" role="button">${opts.label ? esc(opts.label) + " " : ""}${UI.icon("more")}</summary>
      <div class="menu-pop" role="menu">${list.map(i => i.sep ? '<div class="menu-sep"></div>' : `<button type="button" class="menu-item ${i.danger ? "danger" : ""}" ${i.attr || ""} role="menuitem">${i.icon ? UI.icon(i.icon) : ""}<span>${esc(i.label)}</span>${i.hint ? `<span class="hint">${esc(i.hint)}</span>` : ""}</button>`).join("")}</div></details>`;
  };
  /* Close the menu after any choice, and on Escape or an outside click. */
  document.addEventListener("click", e => {
    const item = e.target.closest(".menu-pop .menu-item");
    const open = Array.from(document.querySelectorAll("details.menu[open]"));
    if (item) { const d = item.closest("details.menu"); if (d) d.open = false; return; }
    open.forEach(d => { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll("details.menu[open]").forEach(d => { d.open = false; }); });

  UI.callout = (kind, html) => `<div class="callout ${kind}">${UI.icon(kind === "error" || kind === "warn" ? "warn" : "info")}<div>${html}</div></div>`;
  UI.problems = list => list.map(p => UI.callout(p.level === "error" ? "error" : p.level === "warn" ? "warn" : "info", esc(p.message))).join("");
  /* Team award buttons. targets from ctx; done(targetId) marks already-awarded */
  UI.awardButtons = function (targets, action, points, opts) {
    opts = opts || {};
    return `<div class="award-grid">${targets.filter(t => !opts.exclude || !opts.exclude.includes(t.id)).map(t => {
      const done = opts.done && opts.done(t.id);
      return `<button type="button" class="btn team ${done ? "done" : ""}" style="--tc:${t.color}" data-act="${action}" data-arg="${esc(t.id)}" ${done && !opts.allowRepeat ? "disabled" : ""} title="${esc(t.name)}">${done ? UI.icon("check") + " " : ""}${esc(t.name)}${points != null ? ` <span class="kbd">+${points}</span>` : ""}</button>`;
    }).join("")}</div>`;
  };

  /* Update timer displays without a full re-render */
  TCL.on("tick", function () {
    const T = TCL.Timers;
    document.querySelectorAll("[data-timer]").forEach(el => {
      const n = el.dataset.timer; const t = T.get(n); if (!t) return;
      el.textContent = ""; el.innerHTML = `<span class="dot"></span>${esc(t.label || n)} ${T.fmt(n)}`;
      el.className = `chip mono ${t.status === "running" ? "ok" : t.status === "paused" ? "warn" : ""}`;
    });
    document.querySelectorAll("[data-timer-big]").forEach(el => {
      const n = el.dataset.timerBig; const t = T.get(n); if (!t) return;
      const rem = T.remaining(n), low = t.direction === "down" && t.status !== "idle" && rem <= (t.warnAtMs || 10000);
      el.className = `timer-big ${t.status} ${low ? "low" : ""}`;
      const tt = el.querySelector(".t"); if (tt) tt.textContent = T.fmt(n);
      const st = el.querySelector(".timer-state"); if (st) { st.className = "timer-state " + t.status; st.textContent = `${t.label || n} · ${t.status}`; }
    });
    document.querySelectorAll("[data-ring]").forEach(el => {
      const n = el.dataset.ring; const t = T.get(n); if (!t) return;
      const rem = T.remaining(n), low = t.status !== "idle" && rem <= (t.warnAtMs || 10000);
      el.style.setProperty("--frac", T.fraction(n));
      el.className = `ring ${low ? "low" : ""} ${t.status}`;
      const txt = U.fmtMs(rem);
      el.style.setProperty("--len", txt.length);
      const tt = el.querySelector(".t"); if (tt) tt.textContent = txt;
    });
    const save = document.querySelector("[data-save-status]");
    if (save) save.textContent = TCL.Store.lastError ? "Save failed" : (TCL.Store.lastSavedAt ? "Saved " + new Date(TCL.Store.lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Not saved yet");
  });
  TCL.on("ui:pulse", id => { document.querySelectorAll(`[data-target="${id}"]`).forEach(el => { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }); });

  /* ---------- render loop ---------- */
  let rendering = false, pending = false;
  UI.render = function () {
    if (rendering) { pending = true; return; }
    rendering = true;
    try {
      const def = screens[TCL.route.screen] || screens.home;
      const old = document.getElementById("app");
      const root = old.cloneNode(false);          /* fresh node: listeners added by mount() never stack */
      old.parentNode.replaceChild(root, old);
      const html = def.render(TCL.route.params || {});
      root.innerHTML = html;
      if (def.mount) def.mount(root, TCL.route.params || {});
      document.title = "TEAM CONNECT LIVE" + (def.title ? " · " + def.title : "");
    } catch (e) {
      console.error("[TCL] render failed", e);
      document.getElementById("app").innerHTML = `<div class="content narrow"><div class="callout error">${UI.icon("warn")}<div><b>Something went wrong while drawing this screen.</b><br>${esc(e.message)}<br><button class="btn sm ghost" style="margin-top:10px" onclick="TCL.go('home')">Go to Home</button></div></div></div>`;
    }
    rendering = false;
    if (pending) { pending = false; UI.render(); }
  };
  UI.rerender = U.debounce(() => UI.render(), 16);
  TCL.on("runner:changed", () => UI.rerender());
  TCL.on("history:changed", () => UI.rerender());
  TCL.on("session:changed", () => UI.rerender());
  TCL.on("presenter:status", () => UI.rerender());
})();
