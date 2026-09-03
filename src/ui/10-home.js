/* src/ui/10-home.js  Home: recovery banner, saved sessions, quick start. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI;

  UI.registerScreen("home", {
    title: "Home",
    render() {
      const all = TCL.Session.list();
      const rehearsal = all.find(x => x.rehearsal) || null;
      const sessions = all.filter(x => !x.rehearsal);
      const unfinished = sessions.filter(s => s.status === "live");
      const legacy = TCL.Store.readLegacy();
      const statusMsg = TCL.bootStatus;
      let banner = "";
      if (statusMsg === "corrupt") banner = UI.callout("warn", "<b>Saved data could not be read</b>, so the app started clean. A copy of the unreadable data was kept in browser storage.");
      if (statusMsg === "newer") banner = UI.callout("warn", "<b>Saved data comes from a newer version</b> of this app and was left untouched. Update the file to read it.");
      if (!TCL.Store.available) banner += UI.callout("error", "<b>Browser storage is unavailable</b> (private window or blocked). The app works, but nothing will be saved after you close the tab.");
      const recovery = unfinished.length ? `<div class="panel" style="border-color:rgba(232,184,75,.5)">
        <span class="eyebrow gold">Recovery</span>
        <h2 style="margin:6px 0 4px">We found an unfinished session.</h2>
        ${unfinished.map(s => {
          const cur = s.currentActivityId ? U.byId(s.runSheet, s.currentActivityId) : null;
          return `<div class="session-card" style="margin-top:12px">
            <div><div class="nm">${esc(s.name)}</div><div class="meta">${cur ? "Stopped during: " + esc(cur.title) : "Between activities"} · ${U.fmtDate(s.updatedAt)} · ${s.runSheet.filter(a => a.status === "complete").length}/${s.runSheet.length} activities complete</div></div>
            <div class="btn-row">
              <button class="btn" data-resume="${s.id}">${UI.icon("play")} Resume where we stopped</button>
              <button class="btn ghost" data-dash="${s.id}">Open session dashboard</button>
              <button class="btn ghost" data-scores="${s.id}">Review saved scores</button>
              <button class="btn ghost" data-dup="${s.id}">Duplicate</button>
              <button class="btn danger" data-del="${s.id}">Delete</button>
            </div></div>`; }).join("")}
        <div class="btn-row" style="margin-top:14px"><button class="btn ghost" data-new>Start a new session instead</button></div>
      </div>` : "";
      const others = sessions.filter(s => s.status !== "live");
      return UI.shell(`<div class="content">
        ${banner}
        <div class="hero" style="padding-top:${unfinished.length ? 10 : 40}px">
          <span class="eyebrow">Facilitator control centre</span>
          <h1>Team Connect <span>Live</span></h1>
          <p>One team. Any location. Real connections.</p>
          <div class="btn-row center" style="margin-top:24px">
            <button class="btn big" data-new>${UI.icon("plus")} New session</button>
            <button class="btn ghost big" data-rehearse>${UI.icon("play")} Rehearse</button>
            <button class="btn ghost big" data-nav="content">Manage content</button>
          </div>
          <p class="dim small" style="margin-top:10px">Rehearsal runs a throwaway practice session: sample people, fast timers, no real scores and no questions used up.</p>
        </div>
        ${rehearsal ? `<div class="panel tight" style="border-color:rgba(93,139,255,.5);margin-top:14px"><div class="row between"><div><b>A rehearsal is still open</b><div class="muted small">Practice sessions are deleted when you end them. Nothing in one affects a real session.</div></div>
          <div class="btn-row"><button class="btn sm" data-resume-rehearsal>Back to the rehearsal</button><button class="btn sm ghost" data-end-rehearsal>End and delete it</button></div></div></div>` : ""}
        ${recovery}
        ${legacy ? `<div class="panel tight" style="margin-top:16px"><div class="row between"><div><b>PRIME TIME save found</b> <span class="muted small">(${legacy.roster.length} players, ${legacy.teams.length} teams)</span><div class="muted small">Import the roster, team names and score totals into a new session.</div></div><button class="btn sm ghost" data-import-legacy>Import from PRIME TIME</button></div></div>` : ""}
        <div class="page-head" style="margin-top:28px"><div><h2>Saved sessions</h2><p>Drafts and completed sessions. Duplicate one to reuse its run sheet.</p></div></div>
        ${others.length ? `<div class="stack">${others.map(s => `<div class="panel tight session-card">
          <div><div class="nm">${esc(s.name)} <span class="badge ${s.status}">${s.status}</span></div><div class="meta">${U.fmtDate(s.updatedAt)} · ${s.participants.length} participants · ${s.runSheet.length} activities · target ${s.targetMinutes} min</div></div>
          <div class="btn-row"><button class="btn sm" data-dash="${s.id}">Open</button>${s.status === "complete" ? `<button class="btn sm ghost" data-scores="${s.id}">Results</button>` : ""}<button class="btn sm ghost" data-dup="${s.id}">Duplicate</button><button class="btn sm danger" data-del="${s.id}">Delete</button></div>
        </div>`).join("")}</div>` : `<div class="empty"><h3>No saved sessions yet</h3>Create a new session to build your first run sheet.</div>`}
      </div>`, { title: "Home" });
    },
    mount(root) {
      root.addEventListener("click", async e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-new")) { TCL.go("wizard"); return; }
        if (b.hasAttribute("data-rehearse")) { UI.startRehearsal(); return; }
        if (b.hasAttribute("data-resume-rehearsal")) { const r = TCL.Session.list().find(x => x.rehearsal); if (r) { TCL.Session.setCurrent(r.id); TCL.go("console"); } return; }
        if (b.hasAttribute("data-end-rehearsal")) { UI.endRehearsal(); return; }
        if (b.dataset.resume) { TCL.Session.setCurrent(b.dataset.resume); TCL.go("console"); return; }
        if (b.dataset.dash) { TCL.Session.setCurrent(b.dataset.dash); TCL.go("builder"); return; }
        if (b.dataset.scores) { TCL.Session.setCurrent(b.dataset.scores); TCL.go("results"); return; }
        if (b.dataset.dup) { TCL.Session.duplicate(b.dataset.dup); UI.toast("Session duplicated", "ok"); TCL.go("builder"); return; }
        if (b.dataset.del) {
          const s = U.byId(TCL.state.sessions, b.dataset.del);
          const ok = await UI.confirm("Delete this session?", `<b>${esc(s.name)}</b> will be removed permanently, including its ${s.participants.length} participants, ${s.runSheet.length} activities and all scores. Content and presets are not affected.`, { danger: true, okLabel: "Delete session" });
          if (ok) { TCL.Session.remove(b.dataset.del); UI.toast("Session deleted"); UI.render(); }
          return;
        }
        if (b.hasAttribute("data-import-legacy")) { UI.importLegacy(); return; }
      });
    },
  });

  UI.importLegacy = async function () {
    const L = TCL.Store.readLegacy(); if (!L) return;
    const v = await UI.modal({ title: "Import from PRIME TIME", body: `<p>Choose what to bring into a new session.</p>`,
      form: `<div class="stack"><label class="switch"><input type="checkbox" id="imp-roster" checked><span class="track"></span><span class="txt">Participants (${L.roster.length}) and attendance</span></label>
        <label class="switch"><input type="checkbox" id="imp-teams" checked><span class="track"></span><span class="txt">Team names and membership</span></label>
        <label class="switch"><input type="checkbox" id="imp-scores"><span class="track"></span><span class="txt">Score totals per team (as manual adjustments)</span></label></div>`,
      buttons: [{ label: "Cancel", value: null }, { label: "Import", primary: true, value: el => ({ roster: el.querySelector("#imp-roster").checked, teams: el.querySelector("#imp-teams").checked, scores: el.querySelector("#imp-scores").checked }) }] });
    if (!v) return;
    const s = TCL.Session.create({ name: "Imported from PRIME TIME" });
    if (v.roster) { TCL.Teams.add(L.roster); s.participants.forEach(p => { if (L.absent.includes(p.name)) p.present = false; }); }
    if (v.teams) {
      s.teams = L.teams.map((t, i) => TCL.Teams.newTeam(t.name || TCL.Teams.NAMES[i], TCL.Teams.COLORS[i]));
      L.teams.forEach((t, i) => { t.players.forEach(n => { const p = s.participants.find(x => x.name === n); if (p) s.teams[i].memberIds.push(p.id); }); });
    }
    if (v.scores && v.teams) {
      L.teams.forEach((t, i) => { const total = U.sum(Object.values(t.scores || {})); if (total) TCL.Scoring.award({ activityId: "manual", teamId: s.teams[i].id, points: total, reason: "Imported from PRIME TIME", force: true }); });
    }
    TCL.Session.touch();
    UI.toast("Imported into a new session", "ok");
    TCL.go("participants");
  };

  /* ---------- New Session wizard ---------- */
  UI.registerScreen("wizard", {
    title: "New session",
    render() {
      const presets = TCL.Session.presets();
      return UI.shell(`<div class="content narrow">
        <div class="page-head"><div><span class="eyebrow gold">New session</span><h1>Set up your session</h1><p>Three quick choices. Everything can be changed later in the Session Builder.</p></div></div>
        <form id="wiz" class="stack">
          <div class="panel"><h3>1. Name and length</h3>
            <div class="form-grid">
              <div class="field"><label for="w-name">Session name</label><input class="input" id="w-name" value="Team Connect ${U.today()}" maxlength="80"></div>
              <div class="field"><label for="w-dur">Target duration</label><select class="input" id="w-dur"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60" selected>60 minutes</option><option value="custom">Custom</option></select></div>
              <div class="field" id="w-custom-wrap" hidden><label for="w-custom">Custom minutes</label><input class="input num" type="number" id="w-custom" min="10" max="240" value="50"></div>
            </div></div>
          <div class="panel"><h3>2. Start from a preset</h3><p class="sub">Presets fill the run sheet. "Blank" starts empty.</p>
            <div class="grid cols-2" id="w-presets">${presets.map((p, i) => `<label class="card clickable ${i === 0 ? "selected" : ""}" style="cursor:pointer"><input type="radio" name="preset" value="${p.id}" class="sr-only" ${i === 0 ? "checked" : ""}><b>${esc(p.name)}</b><p>${esc(p.description || "")} ${p.runSheet.length ? `· ${p.runSheet.length} activities · ${p.targetMinutes} min` : ""}</p></label>`).join("")}</div></div>
          <div class="panel"><h3>3. Participants</h3><p class="sub">Paste names now (one per line or comma-separated) or add them later.</p>
            <textarea class="input" id="w-names" rows="5" placeholder="Priya, Tom, Mei-Ling&#10;Or one name per line"></textarea>
            <div class="btn-row" style="margin-top:10px"><button type="button" class="btn sm ghost" id="w-sample">Use the sample roster (15 names)</button></div></div>
          <div class="btn-row right"><button type="button" class="btn ghost" data-nav="home">Cancel</button><button type="submit" class="btn big">Create session ${UI.icon("next")}</button></div>
        </form></div>`, { title: "New session" });
    },
    mount(root) {
      const dur = root.querySelector("#w-dur"), cw = root.querySelector("#w-custom-wrap");
      dur.addEventListener("change", () => { cw.hidden = dur.value !== "custom"; });
      root.querySelector("#w-presets").addEventListener("change", e => { root.querySelectorAll("#w-presets .card").forEach(c => c.classList.toggle("selected", c.querySelector("input").checked)); });
      root.querySelector("#w-sample").addEventListener("click", () => { root.querySelector("#w-names").value = TCL.Teams.SAMPLE_ROSTER.join("\n"); });
      root.querySelector("#wiz").addEventListener("submit", e => {
        e.preventDefault();
        const name = root.querySelector("#w-name").value.trim() || "Team Connect " + U.today();
        const target = dur.value === "custom" ? U.clamp(Number(root.querySelector("#w-custom").value) || 50, 10, 240) : Number(dur.value);
        const presetId = (root.querySelector("input[name=preset]:checked") || {}).value;
        const names = TCL.Teams.parseNames(root.querySelector("#w-names").value);
        const preset = TCL.Session.preset(presetId);
        const s = TCL.Session.create({ name, targetMinutes: target, participants: names, preset });
        if (preset && preset.targetMinutes && preset.targetMinutes !== target) s.targetMinutes = target;
        if (names.length >= 2) TCL.Teams.build(Math.min(3, Math.max(2, Math.round(names.length / 5))));
        TCL.Session.touch();
        UI.toast("Session created", "ok");
        TCL.go(names.length ? "builder" : "participants");
      });
    },
  });
})();
