/* src/core/32-content.js
   Content registry: built-in banks + custom items + overrides + disabled + usage.
   Items: { id, game, category, difficulty(1-3), enabled, builtIn, ...fields } */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Content = TCL.Content = {};
  const builtIn = [];              // registered by src/content/*.js
  const fieldSpecs = {};           // game -> [{key,label,type,required}]
  Content.categoriesByGame = {};

  Content.registerBank = function (game, items, spec) {
    items.forEach((it, i) => {
      const id = it.id || `${game}_${String(i + 1).padStart(3, "0")}`;
      builtIn.push(Object.assign({ enabled: true, difficulty: 2, category: "General" }, it, { id, game, builtIn: true }));
    });
    if (spec) fieldSpecs[game] = spec;
  };
  Content.spec = game => fieldSpecs[game] || [{ key: "text", label: "Text", type: "textarea", required: true }];
  Content.gamesWithContent = () => Object.keys(fieldSpecs);

  function store() { return TCL.state.content; }

  /* Effective list: built-in (with overrides) + custom, applying disabled flags. */
  Content.all = function (game) {
    const c = store();
    const disabled = new Set(c.disabled);
    const out = [];
    builtIn.forEach(it => {
      if (game && it.game !== game) return;
      const merged = Object.assign({}, it, c.overrides[it.id] || {});
      merged.enabled = !disabled.has(it.id);
      out.push(merged);
    });
    c.custom.forEach(it => {
      if (game && it.game !== game) return;
      out.push(Object.assign({}, it, { enabled: !disabled.has(it.id), builtIn: false }));
    });
    return out;
  };
  Content.get = function (id) { return Content.all().find(x => x.id === id) || null; };
  Content.categories = function (game) {
    const set = new Set(Content.all(game).map(x => x.category || "General"));
    return Array.from(set).sort();
  };
  Content.usageOf = id => store().usage[id] || null;
  Content.markUsed = function (ids) {
    /* A rehearsal must not burn real questions: usage history stays untouched. */
    if (TCL.Rehearsal && TCL.Rehearsal.active()) return;
    const u = store().usage;
    (ids || []).forEach(id => { const cur = u[id] || { count: 0 }; cur.count += 1; cur.lastUsed = Date.now(); u[id] = cur; });
  };
  Content.markUnused = function (ids) { const u = store().usage; (ids || []).forEach(id => { delete u[id]; }); };
  Content.resetUsage = function (game) {
    const u = store().usage;
    if (!game) { store().usage = {}; return; }
    Content.all(game).forEach(it => { delete u[it.id]; });
  };
  Content.setEnabled = function (id, on) {
    const d = store().disabled;
    const i = d.indexOf(id);
    if (on && i >= 0) d.splice(i, 1);
    if (!on && i < 0) d.push(id);
  };
  Content.add = function (item) {
    const it = Object.assign({ enabled: true, difficulty: 2, category: "General" }, item, { id: item.id || U.uid("c"), builtIn: false, custom: true });
    store().custom.push(it);
    return it;
  };
  Content.update = function (id, patch) {
    const c = store();
    const custom = U.byId(c.custom, id);
    if (custom) { Object.assign(custom, patch); return custom; }
    const b = builtIn.find(x => x.id === id);
    if (b) { c.overrides[id] = Object.assign({}, c.overrides[id] || {}, patch); return Content.get(id); }
    return null;
  };
  Content.duplicate = function (id) {
    const src = Content.get(id); if (!src) return null;
    const copy = Object.assign({}, src);
    delete copy.id; delete copy.builtIn; delete copy.enabled;
    copy.category = src.category;
    if (copy.text) copy.text = copy.text + " (copy)";
    return Content.add(copy);
  };
  Content.remove = function (id) {
    const c = store();
    const i = c.custom.findIndex(x => x.id === id);
    if (i >= 0) { c.custom.splice(i, 1); return true; }
    return false;   // built-in items are disabled, not deleted
  };
  Content.restoreBuiltIn = function (game) {
    const c = store();
    Object.keys(c.overrides).forEach(id => { const b = builtIn.find(x => x.id === id); if (b && (!game || b.game === game)) delete c.overrides[id]; });
    c.disabled = c.disabled.filter(id => { const b = builtIn.find(x => x.id === id); return !(b && (!game || b.game === game)); });
  };

  /* Selection. q: { game, count, categories:[], difficultyMin, difficultyMax, mode:'random'|'exact', exactIds:[], unusedOnly, order:'random'|'progressive'|'given', excludeIds:[] }
     Returns { items, shortfall, available } and never throws. */
  Content.select = function (q) {
    q = q || {};
    let pool = Content.all(q.game).filter(x => x.enabled);
    if (q.excludeIds && q.excludeIds.length) { const ex = new Set(q.excludeIds); pool = pool.filter(x => !ex.has(x.id)); }
    if (q.mode === "exact" && Array.isArray(q.exactIds) && q.exactIds.length) {
      const wanted = q.exactIds.map(id => pool.find(x => x.id === id)).filter(Boolean);
      return { items: wanted, shortfall: Math.max(0, q.exactIds.length - wanted.length), available: wanted.length, pool: pool.length };
    }
    if (q.categories && q.categories.length) { const cs = new Set(q.categories); pool = pool.filter(x => cs.has(x.category || "General")); }
    const dmin = q.difficultyMin || 1, dmax = q.difficultyMax || 3;
    pool = pool.filter(x => (x.difficulty || 2) >= dmin && (x.difficulty || 2) <= dmax);
    const available = pool.length;
    let unused = pool;
    if (q.unusedOnly) unused = pool.filter(x => !store().usage[x.id]);
    const count = Math.max(0, Number(q.count) || 0);
    let chosen = U.shuffle(unused).slice(0, count);
    /* Not enough unused: top up with used ones rather than failing silently. */
    if (chosen.length < count) {
      const ids = new Set(chosen.map(x => x.id));
      chosen = chosen.concat(U.shuffle(pool.filter(x => !ids.has(x.id))).slice(0, count - chosen.length));
    }
    if (q.order === "progressive") chosen = U.sortBy(chosen, x => x.difficulty || 2);
    /* fresh: how many never-used items still match. The readiness check reports it, because a team
       that plays every month starts seeing repeats long before anything looks broken. */
    return { items: chosen, shortfall: Math.max(0, count - chosen.length), available, pool: pool.length,
      fresh: q.unusedOnly ? unused.length : available, toppedUp: q.unusedOnly && unused.length < count };
  };

  /* Import / export */
  Content.exportJSON = function (game) {
    const items = Content.all(game).map(it => { const o = Object.assign({}, it); delete o.enabled; return o; });
    return JSON.stringify({ app: "TEAM CONNECT LIVE", version: TCL.VERSION, exportedAt: new Date().toISOString(), items }, null, 2);
  };
  Content.exportCSV = function (game) {
    const spec = Content.spec(game);
    const cols = ["id", "game", "category", "difficulty"].concat(spec.map(s => s.key));
    const rows = [cols].concat(Content.all(game).map(it => cols.map(c => Array.isArray(it[c]) ? it[c].join("|") : (it[c] == null ? "" : it[c]))));
    return U.toCSV(rows);
  };
  /* validate(items) -> { valid:[], errors:[{row, message}] } */
  Content.validate = function (items) {
    const valid = [], errors = [];
    const known = new Set(Object.keys(fieldSpecs));
    (items || []).forEach((raw, i) => {
      const row = i + 1;
      if (!raw || typeof raw !== "object") { errors.push({ row, message: "Not an object" }); return; }
      const game = String(raw.game || "").trim();
      if (!known.has(game)) { errors.push({ row, message: `Unknown activity "${game || "(blank)"}". Known: ${Array.from(known).join(", ")}` }); return; }
      const spec = fieldSpecs[game];
      const item = { game, category: String(raw.category || "General").trim() || "General", difficulty: U.clamp(Number(raw.difficulty) || 2, 1, 3) };
      let ok = true;
      spec.forEach(f => {
        let v = raw[f.key];
        if (f.type === "list" && typeof v === "string") v = v.split("|").map(s => s.trim()).filter(Boolean);
        if (f.type === "number") v = v === "" || v == null ? null : Number(v);
        if (f.required && (v == null || v === "" || (Array.isArray(v) && !v.length))) { errors.push({ row, message: `Missing required field "${f.key}" for ${game}` }); ok = false; }
        if (v != null) item[f.key] = v;
      });
      if (raw.id && typeof raw.id === "string") item.sourceId = raw.id;
      if (ok) valid.push(item);
    });
    return { valid, errors };
  };
  Content.importJSON = function (text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { return { added: 0, errors: [{ row: 0, message: "File is not valid JSON: " + e.message }] }; }
    const items = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : null);
    if (!items) return { added: 0, errors: [{ row: 0, message: "Expected an array of items or an object with an \"items\" array" }] };
    return Content.importItems(items);
  };
  Content.importCSV = function (text, game) {
    const rows = U.parseCSV(text);
    if (rows.length < 2) return { added: 0, errors: [{ row: 0, message: "CSV needs a header row and at least one data row" }] };
    const header = rows[0].map(h => h.trim());
    /* The column is named "game" in every CSV this app has ever exported, so that keeps working.
       "activity" is accepted as an alias because that is the word the interface now uses. */
    const items = rows.slice(1).map(r => { const o = {}; header.forEach((h, i) => { o[h] = r[i] == null ? "" : r[i]; }); if (!o.game && o.activity) o.game = o.activity; if (game && !o.game) o.game = game; return o; });
    return Content.importItems(items);
  };
  Content.importItems = function (items) {
    const { valid, errors } = Content.validate(items);
    valid.forEach(v => { delete v.sourceId; Content.add(v); });
    return { added: valid.length, errors };
  };

  /* Named packs: { id, name, game, itemIds[] } */
  Content.packs = game => store().packs.filter(p => !game || p.game === game);
  Content.savePack = function (name, game, itemIds) { const p = { id: U.uid("pack"), name, game, itemIds: itemIds.slice() }; store().packs.push(p); return p; };
  Content.deletePack = function (id) { const p = store().packs; const i = p.findIndex(x => x.id === id); if (i >= 0) p.splice(i, 1); };
  Content.builtInCount = game => builtIn.filter(x => !game || x.game === game).length;
})();
