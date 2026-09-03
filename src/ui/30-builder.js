/* src/ui/30-builder.js  Session Builder: run sheet, duration model, per-game settings, presets. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI;

  function breakoutBadge(a) {
    if (a.kind !== "game") return "";
    const g = TCL.Games.get(a.gameId);
    return TCL.Readiness.breakoutKind(g, TCL.Runner.settingsOf(a)) === "always" ? '<span class="badge breakout">Breakout rooms required</span>' : "";
  }
  function activitySummary(a, s) {
    if (a.kind !== "game") return `${a.settings.minutes} min · ${esc(a.settings.message || "")}`;
    const g = TCL.Games.get(a.gameId); if (!g) return "Unknown game";
    const st = TCL.Runner.settingsOf(a);
    try { return esc(g.summary ? g.summary(st, TCL.Duration.ctx(s)) : ""); } catch (e) { return ""; }
  }
  UI.durationPanel = function (s) {
    const d = TCL.Duration.runSheet(s);
    const pct = v => d.target ? Math.min(100, v / Math.max(d.target, d.total) * 100) : 0;
    const bars = d.activities.map((a, i) => `<span style="width:${pct(a.minutes)}%;background:${i % 2 ? "var(--gold)" : "#c9992f"}" title="${U.fmtMin(a.minutes)}"></span>`).join("") + `<span style="width:${pct(d.transitions)}%;background:var(--blue)" title="Transitions"></span>` + (d.over ? `<span class="over" style="width:${pct(d.over)}%"></span>` : "");
    const status = d.over > 0.5 ? `<span class="chip bad"><span class="dot"></span>${U.fmtMin(d.over)} over</span>` : d.spare > 0.5 ? `<span class="chip ok"><span class="dot"></span>${U.fmtMin(d.spare)} spare</span>` : `<span class="chip ok"><span class="dot"></span>Fits exactly</span>`;
    return `<div class="panel" id="dur-panel"><div class="row between"><div class="row" style="gap:28px">
        <div class="stat"><span class="k">Estimated</span><span class="big-num ${d.over > 0.5 ? "" : "gold"}" style="${d.over > 0.5 ? "color:var(--red)" : ""}">${U.fmtMin(d.total)}</span></div>
        <div class="stat"><span class="k">Target</span><span class="big-num">${U.fmtMin(d.target)}</span></div>
        <div class="stat"><span class="k">Status</span><span>${status}</span></div></div>
      <div class="btn-row"><label class="field" style="flex-direction:row;align-items:center;gap:8px"><span class="lbl">Target</span><select class="input sm" data-target-select>${[30, 45, 60].map(m => `<option value="${m}" ${s.targetMinutes === m ? "selected" : ""}>${m} min</option>`).join("")}<option value="custom" ${![30, 45, 60].includes(s.targetMinutes) ? "selected" : ""}>Custom${![30, 45, 60].includes(s.targetMinutes) ? " (" + s.targetMinutes + ")" : ""}</option></select></label>
        <button class="btn sm ghost" data-autofit title="Adjust flexible games (question counts) to hit the target">${UI.icon("clock")} Auto-fit</button></div></div>
      <div class="dur-bar" style="margin-top:14px">${bars}</div>
      <div class="dur-legend"><span><i style="background:var(--gold)"></i>Activities</span><span><i style="background:var(--blue)"></i>Transitions (${U.fmtMin(d.transitions)})</span>${d.over ? `<span><i style="background:var(--red)"></i>Over target</span>` : ""}<span class="dim">Estimates include explanation, reveal, discussion and transition time.</span></div></div>`;
  };

  UI.registerScreen("builder", {
    title: "Session Builder",
    render() {
      const s = TCL.session(); if (!s) return UI.shell('<div class="content"><div class="empty"><h3>No session open</h3><button class="btn" data-nav="home">Go to Home</button></div></div>');
      const d = TCL.Duration.runSheet(s);
      const games = TCL.Games.list();
      const cats = Array.from(new Set(games.map(g => g.category)));
      const problems = TCL.Teams.problems().filter(p => p.level !== "info");
      const live = s.status === "live";
      return UI.shell(`<div class="content">
        <div class="page-head"><div><span class="eyebrow gold">${live ? "Session in progress" : "Step 2"}</span><h1><input class="input title-input" value="${esc(s.name)}" data-session-name aria-label="Session name" maxlength="80"></h1><p>${s.participants.filter(p => p.present).length} present · ${s.teamMode === "individual" ? "individual mode" : U.plural(s.teams.length, "team")} · ${U.plural(s.runSheet.length, "activity", "activities")}</p></div>
          <div class="btn-row"><button class="btn big" data-go="console" ${s.runSheet.length ? "" : "disabled"}>${UI.icon("play")} ${live ? "Back to console" : "Start session"}</button>
            ${UI.menu([
              { label: "Readiness check", icon: "check", attr: "data-readiness" },
              { label: "Preview the run sheet", icon: "eye", attr: "data-preview" },
              { sep: true },
              { label: "Load a preset", icon: "import", attr: "data-load-preset" },
              { label: "Save this as a preset", icon: "export", attr: "data-save-preset" },
            ], { label: "More" })}</div></div>
        ${problems.length ? UI.problems(problems) + `<div class="btn-row" style="margin:8px 0 14px"><button class="btn sm ghost" data-nav="participants">Fix in Participants</button></div>` : ""}
        ${UI.durationPanel(s)}
        <div class="builder-single" id="builder-grid">
          <div><div class="row between" style="margin-bottom:10px"><h3>Run sheet</h3><div class="btn-row"><button class="btn sm" data-pick-game>${UI.icon("plus")} Add activity</button>${UI.menu([
              { label: "Add a break", icon: "clock", attr: 'data-add-kind="break"' },
              { label: "Add a custom activity", icon: "plus", attr: 'data-add-kind="custom"' },
            ], { title: "Other things to add" })}</div></div>
            <div class="runsheet" id="runsheet">${s.runSheet.length ? s.runSheet.map((a, i) => {
              const g = a.kind === "game" ? TCL.Games.get(a.gameId) : null;
              const mins = d.activities[i] ? d.activities[i].minutes : 0;
              const editable = TCL.Session.canEditActivity(a);
              const probs = a.kind === "game" ? TCL.Runner.validate(a) : [];
              return `<div class="rs-item ${a.status}" draggable="true" data-aid="${a.id}">
                <span class="handle" title="Drag to reorder" aria-hidden="true">${UI.icons.drag}</span>
                <span class="num">${String(i + 1).padStart(2, "0")}</span>
                <div><div class="ttl">${g ? `<span class="icon" style="width:26px;height:26px;display:inline-flex;color:var(--gold)">${g.icon}</span>` : ""}${esc(a.title)}${a.status === "pending" ? "" : ` <span class="badge ${a.status}">${a.status}</span>`}<span class="chip mono">${U.fmtMin(mins)}</span>${breakoutBadge(a)}${a.kind === "game" && !TCL.Scoring.enabledFor(a) ? '<span class="badge">not scored</span>' : ""}</div>
                  <div class="sum">${activitySummary(a, s)}</div>${probs.length ? `<div class="small" style="color:${probs.some(p => p.level === "error") ? "var(--red)" : "var(--amber)"};margin-top:4px">${UI.icon("warn")} ${esc(probs[0].message)}${probs.length > 1 ? ` (+${probs.length - 1})` : ""}</div>` : ""}</div>
                <div class="btn-row actions"><button class="btn sm ghost" data-configure="${a.id}">${UI.icon("edit")} ${editable ? "Configure" : "View"}</button>${UI.menu([
                  { label: "Move up", icon: "up", attr: `data-move="${a.id}" data-dir="-1"` + (i === 0 ? " disabled" : "") },
                  { label: "Move down", icon: "down", attr: `data-move="${a.id}" data-dir="1"` + (i === s.runSheet.length - 1 ? " disabled" : "") },
                  { sep: true },
                  { label: "Duplicate", icon: "copy", attr: `data-dup="${a.id}"` },
                  { label: "Remove from the run sheet", icon: "trash", attr: `data-remove="${a.id}"`, danger: true },
                ], { title: "Reorder or remove" })}</div></div>`; }).join("") : `<div class="empty"><h3>Run sheet is empty</h3>Press <b>Add activity</b> above, or load a preset from the More menu.</div>`}</div></div>
        </div></div>`, { title: "Session Builder" });
    },
    mount(root) {
      const s = TCL.session();
      root.addEventListener("click", async e => {
        const b0 = e.target.closest("[data-pick-game]");
        if (b0) { UI.gamePicker(); return; }
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.addKind) { TCL.Session.addActivity(b.dataset.addKind); UI.render(); return; }
        if (b.dataset.move) { const i = s.runSheet.findIndex(a => a.id === b.dataset.move); TCL.Session.moveActivity(b.dataset.move, i + Number(b.dataset.dir)); UI.render(); return; }
        if (b.dataset.dup) { TCL.Session.duplicateActivity(b.dataset.dup); UI.render(); return; }
        if (b.dataset.remove) {
          const a = TCL.Session.activity(b.dataset.remove);
          const pts = TCL.Scoring.eventsFor(a.id).filter(x => !x.undone).length;
          if (await UI.confirm("Remove from run sheet?", `<b>${esc(a.title)}</b> will be removed.${a.status === "complete" ? " It has already been played." : ""}${pts ? ` <b>${pts} score entries</b> from this activity will be deleted and totals will change.` : ""}`, { danger: true, okLabel: "Remove" })) { TCL.Session.removeActivity(a.id); UI.render(); }
          return;
        }
        if (b.dataset.configure) { UI.configureActivity(b.dataset.configure); return; }
        if (b.hasAttribute("data-autofit")) { const r = TCL.Duration.autoFit(s); TCL.Session.touch(); UI.toast(r.changed ? "Adjusted flexible games to fit the target" : r.reason, r.changed ? "ok" : "warn"); UI.render(); return; }
        if (b.hasAttribute("data-save-preset")) { const name = await UI.prompt("Save run sheet as preset", "", s.name + " preset", { label: "Preset name" }); if (name) { TCL.Session.savePreset(name); UI.toast("Preset saved", "ok"); } return; }
        if (b.hasAttribute("data-load-preset")) { UI.presetPicker(); return; }
        if (b.hasAttribute("data-preview")) { UI.previewSession(); return; }
        if (b.hasAttribute("data-readiness")) { UI.readinessDialog(); return; }
      });
      root.addEventListener("change", async e => {
        if (e.target.hasAttribute("data-session-name")) { s.name = e.target.value.trim() || s.name; TCL.Session.touch(); UI.render(); }
        if (e.target.hasAttribute("data-target-select")) {
          if (e.target.value === "custom") { const v = await UI.prompt("Custom duration", "", String(s.targetMinutes), { label: "Minutes (10 to 240)" }); if (v) s.targetMinutes = U.clamp(Number(v) || s.targetMinutes, 10, 240); }
          else s.targetMinutes = Number(e.target.value);
          TCL.Session.touch(); UI.render();
        }
      });
      /* drag reorder */
      let dragId = null;
      root.addEventListener("dragstart", e => { const it = e.target.closest(".rs-item"); if (!it) return; dragId = it.dataset.aid; it.classList.add("dragging"); try { e.dataTransfer.setData("text/plain", dragId); } catch (err) { /* ignore */ } });
      root.addEventListener("dragover", e => { const it = e.target.closest(".rs-item"); if (it && dragId && it.dataset.aid !== dragId) { e.preventDefault(); root.querySelectorAll(".rs-item.over").forEach(x => x.classList.remove("over")); it.classList.add("over"); } });
      root.addEventListener("dragend", () => { root.querySelectorAll(".dragging,.over").forEach(x => x.classList.remove("dragging", "over")); dragId = null; });
      root.addEventListener("drop", e => { const it = e.target.closest(".rs-item"); if (!it || !dragId) return; e.preventDefault(); const to = s.runSheet.findIndex(a => a.id === it.dataset.aid); TCL.Session.moveActivity(dragId, to); dragId = null; UI.render(); });
    },
  });

  /* Activity picker. The whole library is one keystroke away but never sits on screen. */
  UI.gamePicker = function () {
    const s = TCL.session();
    const games = TCL.Games.list();
    const ctx = TCL.Duration.ctx(s);
    const card = g => `<button type="button" class="pick-card" data-add-game="${g.id}" data-cat="${esc(g.category)}" data-name="${esc((g.name + " " + (g.tagline || "") + " " + g.description).toLowerCase())}">
      <span class="icon">${g.icon}</span>
      <span class="body"><b>${esc(g.name)}</b><span class="muted small">${esc(g.tagline || g.description)}</span>
        <span class="meta"><span class="chip mono">~${U.fmtMin(g.estimateMinutes(TCL.Games.defaults(g), ctx))}</span><span class="badge">${esc(g.category)}</span>${TCL.Readiness.breakoutKind(g) === "always" ? '<span class="badge breakout">breakout rooms</span>' : ""}${TCL.Games.defaults(g).scoringEnabled === false ? '<span class="badge">not scored</span>' : ""}${TCL.Games.hasOverrides(g.id) ? '<span class="badge ok">your defaults</span>' : ""}</span></span></button>`;
    const cats = ["All"].concat(Array.from(new Set(games.map(g => g.category))));
    return UI.modal({ title: "Add an activity", wide: true,
      form: `<div class="picker">
        <div class="picker-bar"><input class="input" id="pick-search" type="search" placeholder="Search ${games.length} activities…" autocomplete="off">
          <div class="chips">${cats.map((c, i) => `<button type="button" class="chip filter ${i === 0 ? "on" : ""}" data-cat-filter="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>
        <div class="pick-grid" id="pick-grid">${games.map(card).join("")}</div>
        <div class="empty" id="pick-empty" hidden>Nothing matches that search.</div></div>`,
      buttons: [{ label: "Close", value: null }],
      onOpen: el => {
        const grid = el.querySelector("#pick-grid"), empty = el.querySelector("#pick-empty"), search = el.querySelector("#pick-search");
        let cat = "All";
        const apply = () => {
          const q = search.value.trim().toLowerCase();
          let shown = 0;
          grid.querySelectorAll(".pick-card").forEach(c => {
            const hit = (cat === "All" || c.dataset.cat === cat) && (!q || c.dataset.name.includes(q));
            c.hidden = !hit; if (hit) shown++;
          });
          empty.hidden = shown > 0;
        };
        search.addEventListener("input", apply);
        el.addEventListener("click", ev => {
          const f = ev.target.closest("[data-cat-filter]");
          if (f) { cat = f.dataset.catFilter; el.querySelectorAll("[data-cat-filter]").forEach(x => x.classList.toggle("on", x === f)); apply(); return; }
          const g = ev.target.closest("[data-add-game]");
          if (g) { const a = TCL.Session.addActivity("game", g.dataset.addGame); UI.closeModal(); UI.toast(`Added ${a.title}`, "ok"); UI.render(); }
        });
      } });
  };

  /* ---------- per-activity settings modal ---------- */
  UI.configureActivity = async function (id) {
    const s = TCL.session(); const a = TCL.Session.activity(id); if (!a) return;
    const editable = TCL.Session.canEditActivity(a);
    if (!editable && (a.status === "active" || a.status === "paused")) {
      if (!(await UI.confirm("This activity is in progress", "Changing settings now can affect the round that is running. Continue in view-only mode, or reset the activity first from the console.", { okLabel: "View settings", routine: true }))) return;
    }
    if (a.kind !== "game") {
      const schema = [{ key: "title", label: "Title", type: "text" }, { key: "minutes", label: "Minutes", type: "range", min: 1, max: 30, unit: "min" }, { key: "message", label: "Message shown on the presentation screen", type: "textarea" }, { key: "instructions", label: "Instructions (one per line)", type: "textarea" }];
      const v = await UI.modal({ title: a.kind === "break" ? "Break" : "Custom activity", form: `<div id="cfg">${UI.form(schema, Object.assign({ title: a.title }, a.settings))}</div>`, buttons: [{ label: "Cancel", value: null }, { label: "Apply", primary: true, value: el => UI.readForm(el.querySelector("#cfg"), schema, {}) }], onOpen: el => UI.bindFormLive(el) });
      if (v && editable) { a.title = v.title || a.title; delete v.title; TCL.Session.updateSettings(a.id, v); UI.render(); }
      return;
    }
    const g = TCL.Games.get(a.gameId);
    const schema = g.settingsSchema;
    let values = TCL.Runner.settingsOf(a);
    const ctx = TCL.Duration.ctx(s);
    const summary = v => { try { return esc(g.summary ? g.summary(v, ctx) : "") + ` <b>≈ ${U.fmtMin(g.estimateMinutes(v, ctx))}</b>`; } catch (e) { return ""; } };
    const contentPicker = g.contentGame ? `<fieldset class="adv-fieldset" style="margin-top:14px"><legend>Content</legend><div class="row between"><div class="small muted" id="cfg-content-sum">${contentSummary(values, g)}</div><div class="btn-row"><button type="button" class="btn sm ghost" id="cfg-pick">Choose exact items</button><button type="button" class="btn sm ghost" id="cfg-random">Use random selection</button></div></div></fieldset>` : "";
    const v = await UI.modal({ title: `${g.name} settings`, wide: true, body: `<p>${esc(g.description)}</p>`,
      form: `<div id="cfg">${UI.formTiered(schema, values)}</div>${contentPicker}<div class="callout gold" style="margin-top:14px" id="cfg-summary">${summary(values)}</div><div id="cfg-problems"></div>`,
      buttons: [{ label: "Cancel", value: null }, { label: "Restore defaults", value: "defaults", kind: "ghost" }, { label: editable ? "Apply" : "Close", primary: true, value: el => UI.readForm(el.querySelector("#cfg"), schema, values) }],
      onOpen: el => {
        const cfg = el.querySelector("#cfg");
        const refresh = () => { values = UI.readForm(cfg, schema, values); el.querySelector("#cfg-summary").innerHTML = summary(values); const probs = g.validate(values, Object.assign({}, ctx, { participants: TCL.Teams.present(s), teams: s.teams, session: s, content: q => TCL.Content.select(Object.assign({ game: g.contentGame }, q)) })) || []; el.querySelector("#cfg-problems").innerHTML = UI.problems(probs); const cs = el.querySelector("#cfg-content-sum"); if (cs) cs.innerHTML = contentSummary(values, g);
          /* re-render fields whose visibility depends on other values */
          if (schema.some(f => f.showIf)) { const open = !!cfg.querySelector(".adv-block[open]"); const html = UI.formTiered(schema, values, { open }); if (html !== cfg.innerHTML) { cfg.innerHTML = html; } } };
        UI.bindFormLive(el, refresh);
        cfg.addEventListener("change", refresh);
        const pick = el.querySelector("#cfg-pick"); if (pick) pick.addEventListener("click", async () => { const ids = await UI.contentPicker(g.contentGame, values.exactIds || [], values); if (ids) { values.exactIds = ids; values.selectionMode = "exact"; values.count = ids.length; const cnt = cfg.querySelector('[name="count"]'); if (cnt) cnt.value = ids.length; refresh(); } });
        const rnd = el.querySelector("#cfg-random"); if (rnd) rnd.addEventListener("click", () => { values.exactIds = []; values.selectionMode = "random"; refresh(); });
        if (!editable) el.querySelectorAll("#cfg input, #cfg select, #cfg textarea, #cfg-pick, #cfg-random").forEach(x => { x.disabled = true; });
      } });
    if (v === "defaults") { if (editable) { a.settings = U.clone(TCL.Games.defaults(g)); TCL.Session.touch(); UI.toast(TCL.Games.hasOverrides(g.id) ? "Restored to your defaults for this game" : "Defaults restored"); } UI.render(); return; }
    if (v && editable) { TCL.Session.updateSettings(a.id, Object.assign(v, { exactIds: values.exactIds || [], selectionMode: values.selectionMode || "random" })); UI.render(); }
  };
  function contentSummary(values, g) {
    if (values.selectionMode === "exact" && values.exactIds && values.exactIds.length) return `<b>${values.exactIds.length} hand-picked items</b>`;
    const sel = TCL.Content.select({ game: g.contentGame, count: values.count || 0, categories: values.categories, difficultyMin: values.difficultyMin, difficultyMax: values.difficultyMax, unusedOnly: values.unusedOnly });
    return `Random selection · <b>${sel.pool}</b> matching items available${values.unusedOnly ? " (unused preferred)" : ""}${sel.shortfall ? ` · <span style="color:var(--amber)">only ${sel.pool} match, ${sel.shortfall} short</span>` : ""}`;
  }

  UI.presetPicker = async function () {
    const s = TCL.session();
    const presets = TCL.Session.presets();
    const v = await UI.modal({ title: "Load a preset", wide: true, body: s.runSheet.length ? "<b>This replaces the current run sheet.</b> Activities that already ran will be removed from the sheet (scores are kept in the session log)." : "",
      form: `<div class="stack">${presets.map(p => `<div class="msg-card"><div><b>${esc(p.name)}</b> ${p.builtIn ? '<span class="badge">built in</span>' : ""}<div class="muted small">${esc(p.description || "")} · ${p.runSheet.length} activities · ${p.targetMinutes} min</div></div><div class="btn-row"><button class="btn sm" data-load="${p.id}">Load</button>${p.builtIn ? "" : `<button class="btn sm ghost" data-rename="${p.id}">Rename</button>`}<button class="btn sm ghost" data-dupp="${p.id}">Duplicate</button>${p.builtIn ? "" : `<button class="btn sm danger" data-delp="${p.id}">Delete</button>`}</div></div>`).join("")}</div>`,
      buttons: [{ label: "Close", value: null }],
      onOpen: el => el.addEventListener("click", async e => {
        const b = e.target.closest("button[data-load],button[data-rename],button[data-dupp],button[data-delp]"); if (!b) return;
        if (b.dataset.load) { const p = TCL.Session.preset(b.dataset.load); const live = s.runSheet.filter(a => a.status !== "pending").length; if (live && !(await UI.confirm("Replace run sheet?", `${live} activities have already started or finished and will be removed from the run sheet.`, { danger: true, okLabel: "Replace" }))) return; TCL.Session.applyPreset(p); UI.closeModal(); UI.toast("Preset loaded", "ok"); UI.render(); }
        if (b.dataset.rename) { const name = await UI.prompt("Rename preset", "", TCL.Session.preset(b.dataset.rename).name); if (name) { TCL.Session.renamePreset(b.dataset.rename, name); UI.presetPicker(); } }
        if (b.dataset.dupp) { TCL.Session.duplicatePreset(b.dataset.dupp); UI.presetPicker(); }
        if (b.dataset.delp) { if (await UI.confirm("Delete preset?", "This preset will be removed. Sessions built from it are not affected.", { danger: true, okLabel: "Delete" })) { TCL.Session.deletePreset(b.dataset.delp); UI.presetPicker(); } }
      }) });
  };

  UI.previewSession = function () {
    const s = TCL.session(); const d = TCL.Duration.runSheet(s);
    let clock = 0;
    const rows = s.runSheet.map((a, i) => { const m = d.activities[i].minutes; const start = clock; clock += m + (i < s.runSheet.length - 1 ? TCL.Duration.TRANSITION_MIN : 0); return `<tr><td class="num">${U.fmtMs(start * 60000)}</td><td><b>${esc(a.title)}</b>${breakoutBadge(a)}<div class="muted small">${activitySummary(a, s)}</div></td><td class="num">${U.fmtMin(m)}</td></tr>`; });
    UI.modal({ title: "Session preview", wide: true, body: `<p><b>${esc(s.name)}</b> · ${U.fmtMin(d.total)} estimated of ${U.fmtMin(d.target)} target · ${s.participants.filter(p => p.present).length} present · ${s.teamMode === "individual" ? "individual" : U.plural(s.teams.length, "team")}</p>`,
      form: `<div class="table-wrap"><table class="tbl"><tr><th class="num">Starts at</th><th>Activity</th><th class="num">Length</th></tr>${rows.join("")}</table></div>`, buttons: [{ label: "Close", value: null }] });
  };
})();
