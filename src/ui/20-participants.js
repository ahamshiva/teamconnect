/* src/ui/20-participants.js  Participants and teams. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, Teams = TCL.Teams;

  function personChip(p, opts) {
    opts = opts || {};
    return `<div class="person ${p.present ? "" : "absent"}" draggable="${opts.drag ? "true" : "false"}" data-pid="${p.id}" title="${esc(p.name)}${p.location ? " · " + esc(p.location) : ""}">
      <span class="nm">${esc(p.displayName || p.name)}</span>${p.location ? `<span class="loc">${esc(p.location)}</span>` : ""}
      ${opts.controls ? `<button type="button" class="icon-btn" data-toggle-present="${p.id}" title="${p.present ? "Mark absent" : "Mark present"}" aria-label="${p.present ? "Mark absent" : "Mark present"}">${UI.icons[p.present ? "check" : "x"]}</button>
      <button type="button" class="icon-btn" data-edit-p="${p.id}" title="Edit" aria-label="Edit ${esc(p.name)}">${UI.icons.edit}</button>
      <button type="button" class="icon-btn danger" data-del-p="${p.id}" title="Remove" aria-label="Remove ${esc(p.name)}">${UI.icons.trash}</button>` : ""}
    </div>`;
  }

  UI.registerScreen("participants", {
    title: "Participants",
    render() {
      const s = TCL.session(); if (!s) return UI.shell('<div class="content"><div class="empty"><h3>No session open</h3><button class="btn" data-nav="home">Go to Home</button></div></div>');
      Teams.refreshNames(s);
      const present = Teams.present(s);
      const problems = Teams.problems();
      const locs = Array.from(new Set(s.participants.map(p => (p.location || "").trim()).filter(Boolean)));
      return UI.shell(`<div class="content">
        <div class="page-head"><div><span class="eyebrow gold">Step 1</span><h1>Participants and teams</h1><p>${present.length} present of ${s.participants.length}. ${locs.length > 1 ? "Teams are mixed across " + locs.join(" and ") + "." : ""}</p></div>
          <div class="btn-row"><button class="btn ghost" data-csv-export>${UI.icon("export")} Export CSV</button><button class="btn ghost" data-csv-import>${UI.icon("import")} Import CSV</button><button class="btn" data-nav="builder">Continue to Session Builder ${UI.icon("next")}</button></div></div>
        ${UI.problems(problems)}
        <div class="grid cols-2" style="margin-top:14px">
          <div class="panel"><h3>Add participants</h3><p class="sub">One per line, or separated by commas. Add "· City" after a name to set a location, e.g. <span class="mono">Priya · Sydney</span>.</p>
            <textarea class="input" id="p-names" rows="4" placeholder="Priya · Sydney&#10;Tom · Gurugram&#10;Mei-Ling"></textarea>
            <div class="btn-row" style="margin-top:10px"><button class="btn" data-add-names>${UI.icon("plus")} Add</button><button class="btn ghost sm" data-add-sample>Sample roster</button><span class="dim small">Late arrival? Add them here any time; they join the smallest team.</span></div></div>
          <div class="panel"><h3>Team setup</h3>
            <div class="row" style="gap:16px">
              <div class="field"><label for="t-mode">Mode</label><select class="input sm" id="t-mode"><option value="teams" ${s.teamMode === "teams" ? "selected" : ""}>Teams</option><option value="individual" ${s.teamMode === "individual" ? "selected" : ""}>Individual (no teams)</option></select></div>
              <div class="field"><label for="t-count">Number of teams</label><input class="input sm num" type="number" id="t-count" min="1" max="6" value="${s.teams.length || 3}" ${s.teamMode !== "teams" || s.teamsLocked ? "disabled" : ""}></div>
            </div>
            <div class="btn-row" style="margin-top:12px">
              <button class="btn ghost" data-make-teams ${s.teamMode !== "teams" || s.teamsLocked ? "disabled" : ""}>${UI.icon("shuffle")} ${s.teams.length ? "Reshuffle teams" : "Create teams"}</button>
              <button class="btn ghost" data-rebalance ${s.teamMode !== "teams" || !s.teams.length || s.teamsLocked ? "disabled" : ""}>Rebalance sizes</button>
              <button class="btn ${s.teamsLocked ? "ghost" : ""}" data-lock ${s.teamMode !== "teams" || !s.teams.length ? "disabled" : ""}>${UI.icon(s.teamsLocked ? "unlock" : "lock")} ${s.teamsLocked ? "Unlock teams" : "Confirm and lock teams"}</button>
            </div>
            <p class="dim small" style="margin-top:10px">Locked teams stay fixed when attendance changes; unlock to rebalance. Drag names between teams to adjust manually.</p></div>
        </div>
        <div class="panel" style="margin-top:16px"><div class="row between"><h3 style="margin:0">Everyone (${s.participants.length})</h3><span class="dim small">Tick = present. Click the tick to mark someone absent.</span></div>
          <div class="row" style="margin-top:12px;gap:8px">${s.participants.length ? s.participants.map(p => personChip(p, { controls: true })).join("") : '<span class="dim">No participants yet.</span>'}</div></div>
        ${s.teamMode === "teams" && s.teams.length ? `<div class="grid cols-${Math.min(3, s.teams.length)}" style="margin-top:16px" id="team-grid">${s.teams.map(t => {
          const members = Teams.members(t, s);
          return `<div class="panel team-col" style="--tc:${t.color}" data-team="${t.id}">
            <div class="row between"><input class="input sm" style="font-family:var(--font-display);font-weight:700;font-size:17px;max-width:220px" value="${esc(t.name)}" data-team-name="${t.id}" maxlength="40" aria-label="Team name" ${s.teamsLocked ? "disabled" : ""}><span class="chip">${Teams.presentMembers(t, s).length} present</span></div>
            <div class="drop" data-drop="${t.id}">${members.map(p => personChip(p, { drag: !s.teamsLocked })).join("") || '<span class="dim small">Empty team</span>'}</div></div>`; }).join("")}</div>` : ""}
      </div>`, { title: "Participants" });
    },
    mount(root) {
      const s = TCL.session();
      root.addEventListener("click", async e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-add-names")) {
          const raw = root.querySelector("#p-names").value;
          const entries = Teams.parseNames(raw).map(x => { const m = x.split(/\s[·\-|]\s|\t/); return { name: m[0].trim(), location: (m[1] || "").trim() }; }).filter(x => x.name);
          if (!entries.length) return;
          const added = entries.map(en => Teams.add(en.name, { location: en.location })[0]).filter(Boolean);
          if (s.teams.length) added.forEach(p => Teams.assignLate(p.id));
          TCL.Session.touch(); UI.toast(`Added ${added.length}`, "ok"); UI.render(); return;
        }
        if (b.hasAttribute("data-add-sample")) { const added = Teams.add(Teams.SAMPLE_ROSTER.filter(n => !s.participants.some(p => p.name === n)), { location: "" }); if (s.teams.length) added.forEach(p => Teams.assignLate(p.id)); TCL.Session.touch(); UI.render(); return; }
        if (b.dataset.togglePresent) {
          const p = U.byId(s.participants, b.dataset.togglePresent); Teams.setPresent(p.id, !p.present);
          if (!s.teamsLocked && s.teams.length) Teams.rebalance();
          if (p.present && s.teams.length && !Teams.teamOf(p.id)) Teams.assignLate(p.id);
          TCL.Session.touch(); UI.render(); return;
        }
        if (b.dataset.editP) {
          const p = U.byId(s.participants, b.dataset.editP);
          const v = await UI.modal({ title: "Edit participant", form: `<div class="form-grid"><div class="field"><label for="e-name">Name</label><input class="input" id="e-name" value="${esc(p.name)}" maxlength="60"></div><div class="field"><label for="e-loc">Location (optional)</label><input class="input" id="e-loc" value="${esc(p.location || "")}" maxlength="40"></div><div class="field span2"><label for="e-fact">Anonymous fact for "Who Said That?" (optional)</label><textarea class="input" id="e-fact" rows="2">${esc(p.fact || "")}</textarea></div></div>`,
            buttons: [{ label: "Cancel", value: null }, { label: "Save", primary: true, value: el => ({ name: el.querySelector("#e-name").value.trim(), location: el.querySelector("#e-loc").value.trim(), fact: el.querySelector("#e-fact").value.trim() }) }] });
          if (v && v.name) { Object.assign(p, v); Teams.refreshNames(s); TCL.Session.touch(); UI.render(); }
          return;
        }
        if (b.dataset.delP) {
          const p = U.byId(s.participants, b.dataset.delP);
          if (await UI.confirm("Remove participant?", `<b>${esc(p.name)}</b> will be removed from this session and from their team. Points already awarded to their team stay.`, { danger: true, okLabel: "Remove" })) { Teams.remove(p.id); if (!s.teamsLocked && s.teams.length) Teams.rebalance(); TCL.Session.touch(); UI.render(); }
          return;
        }
        if (b.hasAttribute("data-make-teams")) {
          const n = U.clamp(Number(root.querySelector("#t-count").value) || 3, 1, 6);
          if (s.runSheet.some(a => a.status !== "pending") && s.teams.length) { if (!(await UI.confirm("Reshuffle teams mid-session?", "Some activities have already run. Scores stay with the team names, but members will change.", { okLabel: "Reshuffle" }))) return; }
          Teams.build(n); TCL.Session.touch(); UI.render(); return;
        }
        if (b.hasAttribute("data-rebalance")) { Teams.rebalance(); TCL.Session.touch(); UI.render(); return; }
        if (b.hasAttribute("data-lock")) { s.teamsLocked = !s.teamsLocked; TCL.Session.touch(); UI.toast(s.teamsLocked ? "Teams locked" : "Teams unlocked"); UI.render(); return; }
        if (b.hasAttribute("data-csv-export")) {
          const rows = [["name", "location", "present", "team", "fact"]].concat(s.participants.map(p => { const t = Teams.teamOf(p.id); return [p.name, p.location || "", p.present ? "yes" : "no", t ? t.name : "", p.fact || ""]; }));
          if (!U.download("participants.csv", U.toCSV(rows), "text/csv")) UI.toast("Download blocked; copy from the export box instead", "warn"); return;
        }
        if (b.hasAttribute("data-csv-import")) {
          const v = await UI.modal({ title: "Import participants from CSV", body: "Columns: <b>name</b> (required), <b>location</b>, <b>present</b> (yes/no), <b>team</b>, <b>fact</b>. Paste the CSV text below.", form: `<textarea class="input" id="csv-text" rows="8" placeholder="name,location,present&#10;Priya,Sydney,yes"></textarea>`,
            buttons: [{ label: "Cancel", value: null }, { label: "Import", primary: true, value: el => el.querySelector("#csv-text").value }] });
          if (!v) return;
          const rows = U.parseCSV(v); if (rows.length < 2) { UI.toast("CSV needs a header row and data", "error"); return; }
          const h = rows[0].map(x => x.trim().toLowerCase()); const ni = h.indexOf("name");
          if (ni < 0) { UI.toast('CSV needs a "name" column', "error"); return; }
          let n = 0; const teamNames = {};
          rows.slice(1).forEach(r => { const name = (r[ni] || "").trim(); if (!name) return; const p = Teams.add(name, { location: (r[h.indexOf("location")] || "").trim(), fact: (r[h.indexOf("fact")] || "").trim() })[0]; if (h.includes("present")) p.present = !/^(no|n|false|0|absent)$/i.test((r[h.indexOf("present")] || "yes").trim()); if (h.includes("team") && r[h.indexOf("team")]) teamNames[p.id] = r[h.indexOf("team")].trim(); n++; });
          const tn = Array.from(new Set(Object.values(teamNames)));
          if (tn.length) { s.teams = tn.slice(0, 6).map((name, i) => Teams.newTeam(name, Teams.COLORS[i])); Object.keys(teamNames).forEach(pid => { const t = s.teams.find(x => x.name === teamNames[pid]); if (t) t.memberIds.push(pid); }); }
          else if (s.teams.length) s.participants.forEach(p => { if (!Teams.teamOf(p.id) && p.present) Teams.assignLate(p.id); });
          TCL.Session.touch(); UI.toast(`Imported ${n} participants`, "ok"); UI.render(); return;
        }
      });
      root.addEventListener("change", e => {
        if (e.target.id === "t-mode") { s.teamMode = e.target.value; if (s.teamMode === "teams" && !s.teams.length) Teams.build(Number(root.querySelector("#t-count").value) || 3); TCL.Session.touch(); UI.render(); }
        if (e.target.dataset.teamName) { Teams.rename(e.target.dataset.teamName, e.target.value); TCL.Session.touch(); UI.render(); }
      });
      /* drag and drop between teams */
      let dragId = null;
      root.addEventListener("dragstart", e => { const p = e.target.closest(".person[draggable=true]"); if (!p) return; dragId = p.dataset.pid; p.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", dragId); } catch (err) { /* ignore */ } });
      root.addEventListener("dragend", e => { root.querySelectorAll(".dragging").forEach(x => x.classList.remove("dragging")); root.querySelectorAll(".drop.over").forEach(x => x.classList.remove("over")); });
      root.addEventListener("dragover", e => { const d = e.target.closest(".drop"); if (d && dragId) { e.preventDefault(); d.classList.add("over"); } });
      root.addEventListener("dragleave", e => { const d = e.target.closest(".drop"); if (d) d.classList.remove("over"); });
      root.addEventListener("drop", e => { const d = e.target.closest(".drop"); if (!d || !dragId) return; e.preventDefault(); Teams.move(dragId, d.dataset.drop); dragId = null; TCL.Session.touch(); UI.render(); });
      /* keyboard alternative: click a person in a team then choose a team */
      root.addEventListener("dblclick", async e => {
        const p = e.target.closest("#team-grid .person"); if (!p || s.teamsLocked) return;
        const pid = p.dataset.pid;
        const v = await UI.modal({ title: "Move " + esc(Teams.displayName(pid)), form: `<select class="input" id="mv-team">${s.teams.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select>`, buttons: [{ label: "Cancel", value: null }, { label: "Move", primary: true, value: el => el.querySelector("#mv-team").value }] });
        if (v) { Teams.move(pid, v); TCL.Session.touch(); UI.render(); }
      });
    },
  });
})();
