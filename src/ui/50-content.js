/* src/ui/50-content.js  Content Manager + exact-item picker. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, C = TCL.Content;
  const filt = { game: "", q: "", cat: "", diff: "", state: "all" };

  function gameLabel(id) { const g = TCL.Games.list().find(x => x.contentGame === id); return g ? g.name : id; }
  function preview(it) {
    const spec = C.spec(it.game);
    const primary = spec[0].key;
    let text = it[primary];
    if (Array.isArray(text)) text = text.join(" / ");
    if (it.game === "images" && it.svg) text = it.title || "Image";
    return esc(String(text || "").slice(0, 120));
  }
  function secondary(it) {
    const spec = C.spec(it.game);
    return spec.slice(1).filter(f => it[f.key] != null && it[f.key] !== "" && f.type !== "svg").map(f => `<b>${esc(f.label)}:</b> ${esc(Array.isArray(it[f.key]) ? it[f.key].join(" · ") : String(it[f.key])).slice(0, 160)}`).join(" &nbsp; ");
  }
  function filtered() {
    let items = C.all(filt.game || null);
    if (filt.cat) items = items.filter(i => (i.category || "General") === filt.cat);
    if (filt.diff) items = items.filter(i => String(i.difficulty || 2) === filt.diff);
    if (filt.state === "enabled") items = items.filter(i => i.enabled);
    if (filt.state === "disabled") items = items.filter(i => !i.enabled);
    if (filt.state === "used") items = items.filter(i => C.usageOf(i.id));
    if (filt.state === "unused") items = items.filter(i => !C.usageOf(i.id));
    if (filt.state === "custom") items = items.filter(i => !i.builtIn);
    if (filt.q) { const q = filt.q.toLowerCase(); items = items.filter(i => JSON.stringify(i).toLowerCase().includes(q)); }
    return items;
  }

  UI.registerScreen("content", {
    title: "Content",
    render(params) {
      if (params && params.id && C.gamesWithContent().includes(params.id)) { filt.game = params.id; params.id = null; }
      const games = C.gamesWithContent();
      const items = filtered();
      const cats = C.categories(filt.game || null);
      const packs = C.packs(filt.game || null);
      return UI.shell(`<div class="content">
        <div class="page-head"><div><span class="eyebrow gold">${C.all().length} items · ${TCL.state.content.custom.length} custom</span><h1>Content Manager</h1><p>Search, edit, disable or extend the question banks. Built-in items can be edited or disabled but never deleted; "Restore built-in" undoes those changes.</p></div>
          <div class="btn-row"><button class="btn" data-add>${UI.icon("plus")} Add item</button><button class="btn ghost" data-import>${UI.icon("import")} Import</button><button class="btn ghost" data-export="json">${UI.icon("export")} Export JSON</button><button class="btn ghost" data-export="csv">Export CSV</button></div></div>
        <div class="panel tight"><div class="row" style="gap:10px">
          <select class="input sm" data-f="game" style="width:220px"><option value="">All activities</option>${games.map(g => `<option value="${g}" ${filt.game === g ? "selected" : ""}>${esc(gameLabel(g))} (${C.all(g).length})</option>`).join("")}</select>
          <input class="input sm" data-f="q" placeholder="Search…" value="${esc(filt.q)}" style="width:220px" aria-label="Search content">
          <select class="input sm" data-f="cat" style="width:180px"><option value="">All categories</option>${cats.map(c => `<option value="${esc(c)}" ${filt.cat === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
          <select class="input sm" data-f="diff" style="width:140px"><option value="">Any difficulty</option><option value="1" ${filt.diff === "1" ? "selected" : ""}>★ Easy</option><option value="2" ${filt.diff === "2" ? "selected" : ""}>★★ Medium</option><option value="3" ${filt.diff === "3" ? "selected" : ""}>★★★ Hard</option></select>
          <select class="input sm" data-f="state" style="width:150px">${[["all", "All"], ["enabled", "Enabled"], ["disabled", "Disabled"], ["used", "Used"], ["unused", "Unused"], ["custom", "Custom only"]].map(o => `<option value="${o[0]}" ${filt.state === o[0] ? "selected" : ""}>${o[1]}</option>`).join("")}</select>
          <span class="dim small">${items.length} shown</span></div>
          <div class="btn-row" style="margin-top:10px"><button class="btn xs ghost" data-reset-usage>Reset usage history${filt.game ? " for " + esc(gameLabel(filt.game)) : ""}</button><button class="btn xs ghost" data-restore>Restore built-in${filt.game ? " for " + esc(gameLabel(filt.game)) : ""}</button><button class="btn xs ghost" data-pack ${filt.game ? "" : "disabled"}>Save filtered as pack</button>${packs.map(p => `<span class="chip">${esc(p.name)} (${p.itemIds.length}) <button class="icon-btn" style="width:22px;height:22px" data-delpack="${p.id}" aria-label="Delete pack">${UI.icons.x}</button></span>`).join("")}</div></div>
        <div class="table-wrap" style="margin-top:14px"><table class="tbl"><thead><tr><th>Item</th><th>Activity</th><th>Category</th><th>Diff.</th><th>Used</th><th>Status</th><th></th></tr></thead><tbody>
          ${items.slice(0, 400).map(it => { const u = C.usageOf(it.id); return `<tr class="${it.enabled ? "" : "dim"}"><td><div style="${it.enabled ? "" : "text-decoration:line-through"}">${preview(it)}</div><div class="dim tiny">${secondary(it)}</div></td><td class="small">${esc(gameLabel(it.game))}</td><td class="small">${esc(it.category || "General")}</td><td class="small">${"★".repeat(it.difficulty || 2)}</td><td class="small">${u ? `${u.count}×` : "—"}</td><td><span class="badge ${it.enabled ? "active" : "skipped"}">${it.enabled ? (it.builtIn ? "built in" : "custom") : "disabled"}</span></td>
            <td><div class="btn-row" style="flex-wrap:nowrap"><button class="icon-btn" data-edit="${it.id}" title="Edit" aria-label="Edit">${UI.icons.edit}</button><button class="icon-btn" data-dupi="${it.id}" title="Duplicate" aria-label="Duplicate">${UI.icons.copy}</button><button class="icon-btn" data-toggle="${it.id}" title="${it.enabled ? "Disable" : "Enable"}" aria-label="${it.enabled ? "Disable" : "Enable"}">${UI.icons[it.enabled ? "x" : "check"]}</button><button class="icon-btn" data-used="${it.id}" title="${u ? "Mark unused" : "Mark used"}" aria-label="${u ? "Mark unused" : "Mark used"}">${UI.icons.flag}</button>${it.builtIn ? "" : `<button class="icon-btn danger" data-del="${it.id}" title="Delete" aria-label="Delete">${UI.icons.trash}</button>`}</div></td></tr>`; }).join("") || `<tr><td colspan="7"><div class="empty">Nothing matches these filters.</div></td></tr>`}
          ${items.length > 400 ? `<tr><td colspan="7" class="dim small">Showing the first 400. Narrow the filters to see more.</td></tr>` : ""}</tbody></table></div>
      </div>`, { title: "Content" });
    },
    mount(root) {
      root.addEventListener("change", e => { const f = e.target.dataset.f; if (f) { filt[f] = e.target.value; if (f === "game") filt.cat = ""; UI.render(); } });
      root.addEventListener("input", U.debounce(e => { if (e.target.dataset.f === "q") { filt.q = e.target.value; const pos = e.target.selectionStart; UI.render(); const inp = document.querySelector('[data-f="q"]'); if (inp) { inp.focus(); inp.setSelectionRange(pos, pos); } } }, 250));
      root.addEventListener("click", async e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-add")) { UI.editContent(null, filt.game || C.gamesWithContent()[0]); return; }
        if (b.dataset.edit) { UI.editContent(b.dataset.edit); return; }
        if (b.dataset.dupi) { C.duplicate(b.dataset.dupi); TCL.persist(); UI.toast("Duplicated as a custom item", "ok"); UI.render(); return; }
        if (b.dataset.toggle) { const it = C.get(b.dataset.toggle); C.setEnabled(it.id, !it.enabled); TCL.persist(); UI.render(); return; }
        if (b.dataset.used) { const it = C.get(b.dataset.used); if (C.usageOf(it.id)) C.markUnused([it.id]); else C.markUsed([it.id]); TCL.persist(); UI.render(); return; }
        if (b.dataset.del) { if (await UI.confirm("Delete custom item?", "This custom item will be removed permanently.", { danger: true, okLabel: "Delete" })) { C.remove(b.dataset.del); TCL.persist(); UI.render(); } return; }
        if (b.hasAttribute("data-reset-usage")) { if (await UI.confirm("Reset usage history?", `Usage marks ${filt.game ? "for " + esc(gameLabel(filt.game)) : "for all activities"} will be cleared, so "previously unused only" treats every item as fresh.`, { okLabel: "Reset" })) { C.resetUsage(filt.game || null); TCL.persist(); UI.render(); } return; }
        if (b.hasAttribute("data-restore")) { if (await UI.confirm("Restore built-in content?", "Edits and disabled flags on built-in items will be undone. Custom items are kept.", { okLabel: "Restore" })) { C.restoreBuiltIn(filt.game || null); TCL.persist(); UI.render(); } return; }
        if (b.hasAttribute("data-pack")) { const name = await UI.prompt("Save pack", `${filtered().length} filtered items will be saved as a named pack for ${esc(gameLabel(filt.game))}.`, "", { label: "Pack name" }); if (name) { C.savePack(name, filt.game, filtered().map(i => i.id)); TCL.persist(); UI.render(); } return; }
        if (b.dataset.delpack) { C.deletePack(b.dataset.delpack); TCL.persist(); UI.render(); return; }
        if (b.dataset.export) { const text = b.dataset.export === "json" ? C.exportJSON(filt.game || null) : C.exportCSV(filt.game || C.gamesWithContent()[0]); if (!U.download(`team-connect-content${filt.game ? "-" + filt.game : ""}.${b.dataset.export}`, text, b.dataset.export === "json" ? "application/json" : "text/csv")) UI.modal({ title: "Export", form: `<textarea class="input" rows="12" readonly>${esc(text)}</textarea>`, buttons: [{ label: "Close" }] }); return; }
        if (b.hasAttribute("data-import")) { UI.importContent(); return; }
      });
    },
  });

  UI.editContent = async function (id, game) {
    const existing = id ? C.get(id) : null;
    game = existing ? existing.game : game;
    const spec = C.spec(game);
    const fields = [{ key: "game", label: "Activity", type: "select", options: C.gamesWithContent().map(g => ({ value: g, label: gameLabel(g) })) }, { key: "category", label: "Category", type: "text" }, { key: "difficulty", label: "Difficulty", type: "select", options: [{ value: 1, label: "★ Easy" }, { value: 2, label: "★★ Medium" }, { value: 3, label: "★★★ Hard" }] }]
      .concat(spec.map(f => ({ key: f.key, label: f.label + (f.required ? "" : " (optional)"), type: f.type === "list" ? "textarea" : f.type === "number" ? "number" : f.type === "svg" ? "textarea" : f.type === "textarea" ? "textarea" : "text", help: f.type === "list" ? "One per line" : f.type === "svg" ? "Paste SVG markup (<svg …>…</svg>)" : f.help })));
    const values = Object.assign({ game, category: "General", difficulty: 2 }, existing || {});
    spec.forEach(f => { if (f.type === "list" && Array.isArray(values[f.key])) values[f.key] = values[f.key].join("\n"); });
    const v = await UI.modal({ title: existing ? "Edit item" : "Add item", wide: true, body: existing && existing.builtIn ? "Editing a built-in item saves an override. Use \"Restore built-in\" to undo." : "",
      form: `<div id="ci">${UI.form(fields, values)}</div>`, buttons: [{ label: "Cancel", value: null }, { label: "Save", primary: true, value: el => UI.readForm(el.querySelector("#ci"), fields, {}) }],
      onOpen: el => { UI.bindFormLive(el); el.querySelector('[name="game"]').addEventListener("change", ev => { UI.closeModal(); UI.editContent(null, ev.target.value); }); } });
    if (!v) return;
    const item = { game: v.game, category: v.category || "General", difficulty: Number(v.difficulty) || 2 };
    for (const f of spec) { let val = v[f.key]; if (f.type === "list") val = String(val || "").split("\n").map(x => x.trim()).filter(Boolean); if (f.type === "number") val = val === "" ? null : Number(val); if (f.required && (val == null || val === "" || (Array.isArray(val) && !val.length))) { UI.toast(`"${f.label}" is required`, "error"); return; } if (f.type === "svg" && val && !/^\s*<svg[\s>]/i.test(val)) { UI.toast("Image must be SVG markup", "error"); return; } item[f.key] = val; }
    if (existing) C.update(existing.id, item); else C.add(item);
    TCL.persist(); UI.toast("Saved", "ok"); UI.render();
  };

  UI.importContent = async function () {
    const games = C.gamesWithContent();
    const v = await UI.modal({ title: "Import content", wide: true, body: `Paste JSON (an array of items or an export file) or CSV with a header row. Required columns per game: ${games.map(g => `<b>${esc(gameLabel(g))}</b>: game=${g}, ${C.spec(g).filter(f => f.required).map(f => f.key).join(", ")}`).join("; ")}.`,
      form: `<div class="form-grid"><div class="field"><label for="imp-fmt">Format</label><select class="input" id="imp-fmt"><option value="json">JSON</option><option value="csv">CSV</option></select></div><div class="field"><label for="imp-game">Default activity for CSV rows without an activity column</label><select class="input" id="imp-game">${games.map(g => `<option value="${g}">${esc(gameLabel(g))}</option>`).join("")}</select></div><div class="field span2"><label for="imp-text">Data</label><textarea class="input" id="imp-text" rows="10"></textarea></div></div>`,
      buttons: [{ label: "Cancel", value: null }, { label: "Validate and import", primary: true, value: el => ({ fmt: el.querySelector("#imp-fmt").value, game: el.querySelector("#imp-game").value, text: el.querySelector("#imp-text").value }) }] });
    if (!v || !v.text.trim()) return;
    const res = v.fmt === "json" ? C.importJSON(v.text) : C.importCSV(v.text, v.game);
    TCL.persist();
    UI.modal({ title: "Import result", body: `<p><b>${res.added}</b> items imported.${res.errors.length ? ` <b>${res.errors.length}</b> rows were rejected:` : ""}</p>${res.errors.length ? `<ul>${res.errors.slice(0, 30).map(e => `<li>Row ${e.row}: ${esc(e.message)}</li>`).join("")}</ul>` : ""}`, buttons: [{ label: "Close", value: null }] }).then(() => UI.render());
  };

  /* Exact picker for a game's settings. Returns array of ids or null. */
  UI.contentPicker = function (game, selectedIds, settings) {
    const all = C.all(game).filter(i => i.enabled);
    let sel = new Set(selectedIds || []);
    let q = "";
    const packs = C.packs(game);
    const render = () => `<div class="row" style="margin-bottom:10px"><input class="input sm" id="pk-q" placeholder="Search…" value="${esc(q)}" style="width:240px"><span class="dim small" id="pk-count">${sel.size} selected</span>${packs.length ? `<select class="input sm" id="pk-pack" style="width:200px"><option value="">Load a pack…</option>${packs.map(p => `<option value="${p.id}">${esc(p.name)} (${p.itemIds.length})</option>`).join("")}</select>` : ""}<button type="button" class="btn xs ghost" id="pk-clear">Clear</button></div>
      <div style="max-height:50vh;overflow:auto" class="stack" id="pk-list">${all.filter(i => !q || JSON.stringify(i).toLowerCase().includes(q.toLowerCase())).map(i => `<label class="check-chip ${sel.has(i.id) ? "on" : ""}" style="border-radius:10px;justify-content:flex-start"><input type="checkbox" value="${i.id}" ${sel.has(i.id) ? "checked" : ""}><span>${preview(i)} <span class="dim tiny">· ${esc(i.category || "General")} · ${"★".repeat(i.difficulty || 2)}${C.usageOf(i.id) ? " · used" : ""}</span></span></label>`).join("")}</div>`;
    return UI.modal({ title: "Choose exact items", wide: true, form: `<div id="pk">${render()}</div>`, buttons: [{ label: "Cancel", value: null }, { label: "Use selected", primary: true, value: () => Array.from(sel) }],
      onOpen: el => {
        const pk = el.querySelector("#pk");
        pk.addEventListener("change", e => { if (e.target.type === "checkbox") { if (e.target.checked) sel.add(e.target.value); else sel.delete(e.target.value); e.target.closest(".check-chip").classList.toggle("on", e.target.checked); pk.querySelector("#pk-count").textContent = `${sel.size} selected`; } if (e.target.id === "pk-pack" && e.target.value) { const p = U.byId(packs, e.target.value); sel = new Set(p.itemIds); pk.innerHTML = render(); } });
        pk.addEventListener("input", U.debounce(e => { if (e.target.id === "pk-q") { q = e.target.value; pk.innerHTML = render(); pk.querySelector("#pk-q").focus(); } }, 200));
        pk.addEventListener("click", e => { if (e.target.id === "pk-clear") { sel = new Set(); pk.innerHTML = render(); } });
      } });
  };
})();
