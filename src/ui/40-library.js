/* src/ui/40-library.js  Game Library browse view + Settings screen. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI;

  UI.registerScreen("library", {
    title: "Game Library",
    render() {
      const s = TCL.session();
      const games = TCL.Games.list();
      const cats = Array.from(new Set(games.map(g => g.category)));
      const ctx = TCL.Duration.ctx(s);
      return UI.shell(`<div class="content">
        <div class="page-head"><div><span class="eyebrow gold">${games.length} activities</span><h1>Game Library</h1><p>Every activity is configurable per instance: rounds, timers, scoring, content and rules. Add any of them to the run sheet, as many times as you like.</p></div></div>
        ${cats.map(c => `<h3 style="margin:22px 0 10px">${esc(c)}</h3><div class="grid cols-3">${games.filter(g => g.category === c).map(g => {
          const n = TCL.Content.all(g.contentGame).filter(x => x.enabled).length;
          return `<div class="card"><div class="row between"><span class="icon">${g.icon}</span><span class="chip mono">~${U.fmtMin(g.estimateMinutes(TCL.Games.defaults(g), ctx))} default</span></div>
            <h3>${esc(g.name)}</h3><p>${esc(g.description)}</p>
            <div class="meta">${g.modes.map(m => `<span class="badge">${m}</span>`).join("")}${g.contentGame ? `<span class="badge">${n} items</span>` : '<span class="badge">no content needed</span>'}${TCL.Games.defaults(g).scoringEnabled === false ? '<span class="badge">not scored</span>' : ""}${TCL.Games.hasOverrides(g.id) ? '<span class="badge ok">your defaults</span>' : ""}${TCL.Readiness.breakoutKind(g) === "always" ? '<span class="badge breakout">Breakout rooms required</span>' : TCL.Readiness.breakoutKind(g) === "sometimes" ? '<span class="badge breakout soft">Breakout rooms optional</span>' : ""}${g.needsZoom ? `<span class="badge">${esc(g.needsZoom)}</span>` : ""}</div>
            <div class="btn-row" style="margin-top:14px"><button class="btn sm" data-add="${g.id}" ${s ? "" : "disabled"}>${UI.icon("plus")} Add to run sheet</button>${g.contentGame ? `<button class="btn sm ghost" data-go="content" data-go-param="${g.contentGame}">Content</button>` : ""}</div></div>`; }).join("")}</div>`).join("")}
      </div>`, { title: "Game Library" });
    },
    mount(root) {
      root.addEventListener("click", e => { const b = e.target.closest("[data-add]"); if (b) { const a = TCL.Session.addActivity("game", b.dataset.add); UI.toast(`Added ${a.title} to the run sheet`, "ok"); UI.render(); } });
    },
  });

  /* Settings is the one place that answers "what can I change?". Everything global lives
     here; everything that belongs to one session or one activity is reachable from here
     with a jump button, because a run sheet can hold the same game twice with different
     settings and those cannot become global without losing that. */
  const SETTINGS_MAP = [
    { what: "Console mode, sound, confirmations", where: "Here · How the console behaves" },
    { what: "Presentation size, scores on screen", where: "Here · The participant screen" },
    { what: "Default settings for each game", where: "Here · Activity defaults", note: "Applies to activities you add from now on" },
    { what: "This session: name, length, scoring, how activities are weighed, finale", where: "Here · This session" },
    { what: "Participants, teams, team names, attendance", where: "Participants", go: "participants" },
    { what: "Which activities run, in what order, for how long", where: "Session Builder", go: "builder" },
    { what: "Settings for one activity in the run sheet", where: "Session Builder · Configure", go: "builder", note: "Per instance, so the same game can run twice with different settings" },
    { what: "Questions, prompts, images and their categories", where: "Content", go: "content" },
    { what: "Reusable run sheets", where: "Here · Presets, and Session Builder · More" },
    { what: "Backups and stored data", where: "Here · Data" },
  ];

  UI.registerScreen("settings", {
    title: "Settings",
    render() {
      const st = TCL.state.settings;
      const s = TCL.session();
      const consoleSchema = [
        { key: "consoleMode", label: "Console mode", type: "select", basic: true, options: [{ value: "simple", label: "Simple: only the live controls" }, { value: "advanced", label: "Advanced: every setting and diagnostic" }], help: "Simple is the safe default while the team is watching. The toggle in the top bar switches at any time." },
        { key: "confirmRoutine", label: "Ask before routine interruptions", type: "toggle", basic: true, help: "Speed bumps only: finishing an activity early, starting one with a warning, opening settings mid-round. Anything that destroys something always asks, whatever this is set to." },
      ];
      const soundSchema = [
        { key: "sound", label: "Sound cues (ding on score, buzzer on time up)", type: "toggle", basic: true },
        { key: "silent", label: "Silent mode (mutes everything, overrides sound)", type: "toggle", basic: true },
        { key: "volume", label: "Volume", type: "range", min: 0.1, max: 1, step: 0.1, basic: true },
      ];
      const presSchema = [
        { key: "largeText", label: "Large-text presentation mode (Zoom-readable)", type: "toggle", basic: true },
        { key: "presentationScale", label: "Presentation text scale", type: "range", min: 0.8, max: 1.6, step: 0.1, basic: true },
        { key: "showScoresLive", label: "Show scores on the presentation, by default", type: "toggle", basic: true, help: "Seeds new sessions. The session you are running now has its own switch under This session." },
        { key: "hideScoresUntilFinale", label: "Hide scores until the finale", type: "toggle", basic: true },
        { key: "scoringEnabled", label: "Scoring on, by default", type: "toggle", basic: true, help: "Seeds new sessions. Individual activities can still be unscored." },
        { key: "scoreModel", label: "How activities are weighed, by default", type: "select", basic: true, options: TCL.Scoring.MODELS.map(m => ({ value: m.id, label: m.label })), help: "Seeds new sessions. Balanced stops one long activity deciding the whole championship." },
      ];
      const sessionSchema = s ? [
        { key: "name", label: "Session name", type: "text", basic: true },
        { key: "targetMinutes", label: "Target length", type: "select", basic: true, options: [{ value: 30, label: "30 minutes" }, { value: 45, label: "45 minutes" }, { value: 60, label: "60 minutes" }, { value: 75, label: "75 minutes" }, { value: 90, label: "90 minutes" }] },
        { key: "scoringEnabled", label: "Scoring for this session", type: "toggle", basic: true },
        { key: "showScores", label: "Show scores to participants during this session", type: "toggle", basic: true },
        { key: "scoreModel", label: "How activities are weighed", type: "select", basic: true, options: TCL.Scoring.MODELS.map(m => ({ value: m.id, label: m.label })), help: "Raw points are always kept underneath; this only changes how they are added up." },
        { key: "finaleMode", label: "How the session ends", type: "select", basic: true, options: [{ value: "podium", label: "Podium: rank the teams" }, { value: "shared", label: "Shared achievement: what we did together, no ranking" }], help: "Connection activities are unscored by default, so a podium can misrepresent the hour." },
        { key: "notes", label: "Facilitator notes for this session", type: "textarea", advanced: true },
      ] : [];
      const games = TCL.Games.list();
      const customised = games.filter(g => TCL.Games.hasOverrides(g.id));
      const size = TCL.Store.estimateSize();
      return UI.shell(`<div class="content narrow">
        <div class="page-head"><div><h1>Settings</h1><p>Everything you can configure, in one place. Things that belong to one session or one activity are linked from here rather than copied, so they stay where they apply.</p></div></div>

        <div class="panel"><h3>How the console behaves</h3><form id="console-settings">${UI.form(consoleSchema, st)}</form></div>

        <div class="panel"><h3>Sound</h3><form id="sound-settings">${UI.form(soundSchema, st)}</form>
          <div class="btn-row" style="margin-top:14px"><button class="btn sm ghost" data-test-sound>${UI.icon("sound")} Test sound</button><span class="dim small">${st.soundTested ? "Tested on this browser." : "Not tested yet."} Turn on "Share sound" in Zoom when you share the presentation window.</span></div></div>

        <div class="panel"><h3>The participant screen</h3><form id="pres-settings">${UI.form(presSchema, st)}</form>
          <div class="btn-row" style="margin-top:14px"><button class="btn sm ghost" data-open-presentation>${UI.icon("screen")} Open the presentation window</button><span class="dim small">Changes here reach it immediately.</span></div></div>

        ${s ? `<div class="panel"><h3>This session</h3><p class="sub">${esc(s.name)} · ${s.participants.filter(p => p.present).length} present · ${U.plural(s.runSheet.length, "activity", "activities")}</p>
          <form id="session-settings">${UI.formTiered(sessionSchema, { name: s.name, targetMinutes: s.targetMinutes, scoringEnabled: s.scoringEnabled !== false, showScores: s.showScores !== false, scoreModel: TCL.Scoring.model(s), finaleMode: s.finaleMode || "podium", notes: s.notes || "" })}</form>
          <div class="btn-row" style="margin-top:14px"><button class="btn sm ghost" data-nav="participants">${UI.icon("people")} Participants and team names</button><button class="btn sm ghost" data-nav="builder">${UI.icon("builder")} Run sheet and per-activity settings</button></div></div>`
        : `<div class="panel"><h3>This session</h3><p class="sub">No session is open. Session settings, participants, teams and the run sheet appear here once one is.</p><div class="btn-row"><button class="btn sm" data-nav="home">Open or create a session</button></div></div>`}

        <div class="panel"><h3>Activity defaults</h3>
          <p class="sub">Set how each game should start out, once, instead of reconfiguring it every time you add it. These apply to activities you add from now on; anything already on a run sheet keeps its own settings.</p>
          ${customised.length ? `<div class="stack" style="margin:12px 0">${customised.map(g => `<div class="msg-card"><div><b>${esc(g.name)}</b><div class="muted small">${esc(Object.keys(TCL.state.settings.gameDefaults[g.id]).map(k => k + " = " + JSON.stringify(TCL.state.settings.gameDefaults[g.id][k])).join(" · ").slice(0, 140))}</div></div>
            <div class="btn-row"><button class="btn sm ghost" data-game-defaults="${g.id}">Edit</button><button class="btn sm ghost" data-clear-defaults="${g.id}">Reset</button></div></div>`).join("")}</div>` : `<p class="dim small" style="margin:10px 0">Nothing customised yet: every game starts from its built-in defaults.</p>`}
          <div class="btn-row"><button class="btn sm" data-pick-defaults>${UI.icon("edit")} Change a game's defaults</button>${customised.length ? `<button class="btn sm ghost" data-clear-defaults="">Reset all ${customised.length}</button>` : ""}</div></div>

        <div class="panel"><h3>Content</h3><p class="sub">${TCL.Content.all().length} items across ${games.filter(g => g.contentGame).length} games: questions, prompts, words, scenarios and images. Add your own, edit or disable the built-ins, and see what has been used.</p>
          <div class="btn-row"><button class="btn sm ghost" data-nav="content">${UI.icon("content")} Open the content manager</button></div></div>

        <div class="panel"><h3>Presets</h3><p class="sub">${TCL.Session.presets().length} presets (${TCL.state.presets.length} of them yours). A preset is a saved run sheet you can load into any session.</p>
          <div class="btn-row"><button class="btn sm ghost" data-export-presets>${UI.icon("export")} Export yours (JSON)</button><button class="btn sm ghost" data-import-presets>${UI.icon("import")} Import presets</button>${s ? `<button class="btn sm ghost" data-nav="builder">Load one into this session</button>` : ""}</div></div>

        <div class="panel"><h3>How to open this file on the day</h3><p class="sub">Double-clicking works, and so does a local address. Serving it locally makes pop-ups, cross-window messaging and storage behave the same in every browser, so it is the safer choice for a live session.</p>
          <ol class="step-list"><li>Open Terminal in the folder that holds <code>team-connect.html</code>.</li><li>Run <code>python3 -m http.server 8080</code> (or <code>./serve.sh</code>).</li><li>Open <code>http://localhost:8080/team-connect.html</code>.</li><li>Leave the terminal window open for the whole session.</li></ol>
          <p class="sub" style="margin-top:8px">Currently running from <code>${esc(location.protocol)}//${esc(location.host || "file")}</code>${location.protocol === "file:" ? " — pop-up blocking varies more here than over http://localhost." : " — good."}</p></div>

        <div class="panel"><h3>Data</h3><p class="sub">Everything is stored in this browser only (${Math.round(size / 1024)} KB used). ${TCL.state.settings.lastBackupAt ? "Last backup exported " + U.fmtDate(new Date(TCL.state.settings.lastBackupAt).toISOString()) + "." : "No backup exported yet."} Export one before switching computers.</p>
          <div class="btn-row"><button class="btn sm ghost" data-backup>${UI.icon("export")} Export full backup</button><button class="btn sm ghost" data-restore>${UI.icon("import")} Restore backup</button><button class="btn sm danger" data-wipe>Delete all app data</button></div></div>

        <div class="panel"><h3>Where everything lives</h3><p class="sub">The full list of what can be configured and where.</p>
          <div class="table-wrap"><table class="tbl"><tr><th>What</th><th>Where</th><th></th></tr>
          ${SETTINGS_MAP.map(r => `<tr><td>${esc(r.what)}${r.note ? `<div class="dim small">${esc(r.note)}</div>` : ""}</td><td class="muted">${esc(r.where)}</td><td class="num">${r.go ? `<button class="btn xs ghost" data-nav="${r.go}">Go</button>` : ""}</td></tr>`).join("")}
          </table></div></div>

        <div class="panel"><h3>About</h3><p class="sub">TEAM CONNECT LIVE v${TCL.VERSION} · schema v${TCL.SCHEMA_VERSION} · runs offline from a single file. Zoom is used for video, audio, chat, reactions and breakout rooms; this app never controls Zoom.</p></div>
      </div>`, { title: "Settings" });
    },
    mount(root) {
      const st = TCL.state.settings; const s = TCL.session();
      UI.bindFormLive(root);
      const save = (formId, schema) => {
        const f = root.querySelector(formId); if (!f) return;
        f.addEventListener("change", () => { Object.assign(st, UI.readForm(f, schema, st)); TCL.persist(); TCL.Presenter.push(true); if (schema.some(x => x.key === "consoleMode")) UI.render(); });
      };
      save("#console-settings", [{ key: "consoleMode", type: "select" }, { key: "confirmRoutine", type: "toggle" }]);
      save("#sound-settings", [{ key: "sound", type: "toggle" }, { key: "silent", type: "toggle" }, { key: "volume", type: "range", min: 0.1, max: 1 }]);
      save("#pres-settings", [{ key: "largeText", type: "toggle" }, { key: "presentationScale", type: "range", min: 0.8, max: 1.6 }, { key: "showScoresLive", type: "toggle" }, { key: "hideScoresUntilFinale", type: "toggle" }, { key: "scoringEnabled", type: "toggle" }, { key: "scoreModel", type: "select" }]);
      const sf = root.querySelector("#session-settings");
      if (sf && s) sf.addEventListener("change", () => {
        const v = UI.readForm(sf, [{ key: "name", type: "text" }, { key: "targetMinutes", type: "select" }, { key: "scoringEnabled", type: "toggle" }, { key: "showScores", type: "toggle" }, { key: "scoreModel", type: "select" }, { key: "finaleMode", type: "select" }, { key: "notes", type: "textarea" }], {});
        s.name = String(v.name || "").trim() || s.name;
        s.targetMinutes = U.clamp(Number(v.targetMinutes) || s.targetMinutes, 10, 240);
        s.scoringEnabled = v.scoringEnabled; s.showScores = v.showScores; s.scoreModel = v.scoreModel; s.finaleMode = v.finaleMode; s.notes = v.notes;
        TCL.Session.touch(); TCL.Presenter.push(true); UI.render();
      });
      root.addEventListener("click", async e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-test-sound")) { const ok = TCL.Audio.test(); TCL.state.settings.soundTested = ok; TCL.persist(); UI.toast(ok ? "Playing ding then buzzer" : "Audio is blocked by the browser. Click anywhere on the page first, then retry.", ok ? "ok" : "warn"); UI.render(); }
        if (b.hasAttribute("data-pick-defaults")) { UI.gameDefaultsPicker(); return; }
        if (b.dataset.gameDefaults) { UI.gameDefaultsEditor(b.dataset.gameDefaults); return; }
        if (b.hasAttribute("data-clear-defaults")) {
          const id = b.dataset.clearDefaults;
          const name = id ? (TCL.Games.get(id) || {}).name : "every game";
          if (await UI.confirm("Reset defaults?", `<b>${esc(name)}</b> will go back to the built-in defaults. Activities already on a run sheet are not affected.`, { okLabel: "Reset" })) { TCL.Games.clearDefaults(id || null); UI.toast("Defaults reset"); UI.render(); }
          return;
        }
        if (b.hasAttribute("data-export-presets")) U.download("team-connect-presets.json", JSON.stringify(TCL.state.presets, null, 2), "application/json");
        if (b.hasAttribute("data-import-presets")) { const v = await UI.prompt("Import presets", "Paste the JSON exported from another computer.", "", { multiline: true, okLabel: "Import" }); if (!v) return; try { const arr = JSON.parse(v); if (!Array.isArray(arr)) throw new Error("Expected an array"); let n = 0; arr.forEach(p => { if (p && p.name && Array.isArray(p.runSheet)) { TCL.state.presets.push(Object.assign({}, p, { id: U.uid("preset"), builtIn: false })); n++; } }); TCL.persist(); UI.toast(`Imported ${n} presets`, "ok"); UI.render(); } catch (err) { UI.toast("Could not import: " + err.message, "error"); } }
        if (b.hasAttribute("data-backup")) { U.download(`team-connect-backup-${U.today()}.json`, JSON.stringify(TCL.state, null, 2), "application/json"); TCL.state.settings.lastBackupAt = Date.now(); TCL.persist(); UI.toast("Backup downloaded", "ok"); UI.render(); }
        if (b.hasAttribute("data-restore")) { const v = await UI.prompt("Restore backup", "Paste a full backup JSON. <b>This replaces all current app data.</b>", "", { multiline: true, okLabel: "Restore" }); if (!v) return; try { const data = JSON.parse(v); if (!data || typeof data !== "object" || !("sessions" in data)) throw new Error("Not a TEAM CONNECT LIVE backup"); TCL.Store.save(data); location.reload(); } catch (err) { UI.toast("Could not restore: " + err.message, "error"); } }
        if (b.hasAttribute("data-wipe")) { if (await UI.confirm("Delete all app data?", "<b>All sessions, presets, custom content, activity defaults and usage history</b> will be removed from this browser. Export a backup first if you might need it.", { danger: true, okLabel: "Delete everything" })) { TCL.Store.clear(); location.reload(); } }
      });
    },
  });

  /* Choose which game's defaults to change. */
  UI.gameDefaultsPicker = function () {
    const games = TCL.Games.list();
    return UI.modal({ title: "Which game?", wide: true,
      form: `<div class="pick-grid">${games.map(g => `<button type="button" class="pick-card" data-def="${g.id}"><span class="icon">${g.icon}</span>
        <span class="body"><b>${esc(g.name)}</b><span class="muted small">${esc(g.tagline || g.description)}</span>
        <span class="meta"><span class="badge">${esc(g.category)}</span>${TCL.Games.hasOverrides(g.id) ? '<span class="badge ok">customised</span>' : ""}</span></span></button>`).join("")}</div>`,
      buttons: [{ label: "Close", value: null }],
      onOpen: el => el.addEventListener("click", ev => { const b = ev.target.closest("[data-def]"); if (b) { UI.closeModal(); UI.gameDefaultsEditor(b.dataset.def); } }) });
  };

  /* Edit one game's defaults. Same tiered form as the per-activity dialog. */
  UI.gameDefaultsEditor = async function (gameId) {
    const g = TCL.Games.get(gameId); if (!g) return;
    const s = TCL.session();
    let values = TCL.Games.defaults(g);
    const ctx = TCL.Duration.ctx(s);
    const summary = v => { try { return esc(g.summary ? g.summary(v, ctx) : "") + ` <b>≈ ${U.fmtMin(g.estimateMinutes(v, ctx))}</b>`; } catch (e) { return ""; } };
    const pending = s ? s.runSheet.filter(a => a.gameId === gameId && a.status === "pending").length : 0;
    const v = await UI.modal({ title: `Defaults for ${g.name}`, wide: true,
      body: `<p>How this game starts out every time you add it. Activities already on a run sheet keep their own settings.</p>`,
      form: `<div id="gd">${UI.formTiered(g.settingsSchema, values)}</div><div class="callout gold" style="margin-top:14px" id="gd-summary">${summary(values)}</div>
        ${pending ? `<label class="switch" style="margin-top:12px"><input type="checkbox" id="gd-apply"><span class="track"></span><span class="txt">Also apply to the ${U.plural(pending, "activity", "activities")} of this game already waiting in this session</span></label>` : ""}`,
      buttons: [{ label: "Cancel", value: null }, { label: "Back to built-in defaults", value: "reset", kind: "ghost" },
        { label: "Save defaults", primary: true, value: el => ({ settings: UI.readForm(el.querySelector("#gd"), g.settingsSchema, values), apply: !!(el.querySelector("#gd-apply") || {}).checked }) }],
      onOpen: el => {
        const form = el.querySelector("#gd");
        const refresh = () => { values = UI.readForm(form, g.settingsSchema, values); el.querySelector("#gd-summary").innerHTML = summary(values);
          if (g.settingsSchema.some(f => f.showIf)) { const open = !!form.querySelector(".adv-block[open]"); const html = UI.formTiered(g.settingsSchema, values, { open }); if (html !== form.innerHTML) form.innerHTML = html; } };
        UI.bindFormLive(el, refresh);
        form.addEventListener("change", refresh);
      } });
    if (!v) return;
    if (v === "reset") { TCL.Games.clearDefaults(gameId); UI.toast(`${g.name} is back to its built-in defaults`); UI.render(); return; }
    TCL.Games.setDefaults(gameId, v.settings);
    if (v.apply && s) { s.runSheet.forEach(a => { if (a.gameId === gameId && a.status === "pending") a.settings = U.clone(TCL.Games.defaults(gameId)); }); TCL.Session.touch(); }
    UI.toast(TCL.Games.hasOverrides(gameId) ? `Saved. New ${g.name} activities will start this way.` : `${g.name} matches its built-in defaults again.`, "ok");
    UI.render();
  };
})();
