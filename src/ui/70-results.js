/* src/ui/70-results.js  Final results: podium, breakdown, awards, export. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI;

  UI.registerScreen("results", {
    title: "Results",
    render(params) {
      const s = TCL.session(); if (!s) return UI.shell('<div class="content"><div class="empty"><h3>No session open</h3><button class="btn" data-nav="home">Go to Home</button></div></div>');
      const rows = TCL.Scoring.standings();
      const per = TCL.Scoring.perActivityModel();
      const rawPer = TCL.Scoring.perActivity();
      const model = TCL.Scoring.model(s);
      const scoring = s.scoringEnabled !== false;
      const top = rows[0];
      const tiedTop = top && rows.filter(r => r.total === top.total).length > 1 && top.total > 0;
      const noScores = rows.every(r => r.total === 0);
      const medals = ["🥇", "🥈", "🥉"];
      const order = [rows[1], rows[0], rows[2]].filter(Boolean);
      const games = s.runSheet.filter(a => a.kind === "game");
      const awards = [];
      const shout = [];
      if (games.length) {
        const longest = U.sortBy(games.filter(a => a.startedAt && a.endedAt), a => new Date(a.endedAt) - new Date(a.startedAt), true)[0];
        if (longest) shout.push({ icon: "🕰️", title: "The one nobody wanted to end", who: longest.title, note: "It ran the longest" });
        const played = games.filter(a => a.status === "complete");
        if (played.length) shout.push({ icon: "🎬", title: "Activities we finished", who: String(played.length), note: played.map(a => a.title).join(", ") });
        shout.push({ icon: "🤝", title: "Everyone who showed up", who: U.plural(TCL.Teams.present(s).length, "person", "people"), note: "Across every location" });
      }
      if (scoring && !noScores) {
        const best = { v: -1 }; games.forEach(a => rows.forEach(r => { const v = (per[a.id] || {})[r.id] || 0; if (v > best.v) { best.v = v; best.r = r; best.a = a; } }));
        if (best.r) awards.push({ icon: "🚀", title: "Biggest single-activity haul", who: best.r.name, note: `${best.v} pts in ${best.a.title}` });
        const consistent = U.sortBy(rows, r => games.filter(a => ((per[a.id] || {})[r.id] || 0) > 0).length, true)[0];
        if (consistent) awards.push({ icon: "🎯", title: "Most consistent", who: consistent.name, note: `Scored in ${games.filter(a => ((per[a.id] || {})[consistent.id] || 0) > 0).length} of ${games.length} activities` });
        const comeback = U.sortBy(rows.filter(r => r.rank > 1), r => (games.length ? ((per[games[games.length - 1].id] || {})[r.id] || 0) : 0), true)[0];
        if (comeback && games.length) awards.push({ icon: "🔥", title: "Strong finish", who: comeback.name, note: `${(per[games[games.length - 1].id] || {})[comeback.id] || 0} pts in the last activity` });
      }
      const shared = s.finaleMode === "shared" || !scoring;
      const completed = s.runSheet.filter(a => a.status === "complete").length;
      const totalPoints = U.sum(rows.map(r => r.raw));
      const sharedBlock = shared ? `<div class="shared-wrap">
        <div class="shared-tiles">
          <div class="tile"><span class="n">${completed}</span><span class="k">activities finished together</span></div>
          <div class="tile"><span class="n">${TCL.Teams.present(s).length}</span><span class="k">people in the room</span></div>
          ${scoring ? `<div class="tile"><span class="n">${totalPoints}</span><span class="k">points earned by the whole team</span></div>` : ""}
        </div>
        ${rows.length ? `<div class="grid cols-3" style="margin-top:14px">${rows.map(r => `<div class="card" style="text-align:center;border-color:${r.color}44"><div style="font-weight:700;color:${r.color}">${esc(r.name)}</div><div class="dim small">${scoring ? r.raw + " pts contributed" : "thank you"}</div></div>`).join("")}</div>` : ""}
        <p class="muted" style="margin-top:14px">No ranking, on purpose. The hour was about the conversations, not the scoreboard.</p></div>` : "";
      return UI.shell(`<div class="content">
        <div class="hero" style="padding:16px 0 6px"><span class="eyebrow gold">${esc(s.name)} · grand finale</span><h1>${shared ? "What We <span>Did Together</span>" : "The <span>Podium</span>"}</h1></div>
        <div class="btn-row center" style="margin-bottom:6px"><div class="mode-toggle" role="group" aria-label="Finale style"><button type="button" class="${shared ? "" : "on"}" data-finale="podium" ${scoring ? "" : "disabled"}>Podium</button><button type="button" class="${shared ? "on" : ""}" data-finale="shared">Shared achievement</button></div></div>
        ${sharedBlock}
        ${shared ? "" : !scoring ? `<div class="callout gold" style="max-width:720px;margin:14px auto">${UI.icon("info")}<div>Scoring was off for this session, so there is no winner to declare. Thanks for playing, everyone.</div></div>` : noScores ? `<div class="callout gold" style="max-width:720px;margin:14px auto">${UI.icon("info")}<div>No points were awarded. The podium stays empty and everyone shares the glory.</div></div>` : tiedTop ? `<div class="callout gold" style="max-width:760px;margin:14px auto">${UI.icon("star")}<div><b>Shared first place!</b> ${rows.filter(r => r.total === top.total).map(r => esc(r.name)).join(" and ")} finished level on ${top.total} pts. Declare a shared win, or run a tie-breaker: one Five-Second prompt each, most valid answers wins.</div></div>` : ""}
        ${!shared && scoring && !noScores ? `<div class="podium">${order.map(r => `<div class="spot p${r.rank}" style="--tc:${r.color}"><div class="medal">${medals[r.rank - 1] || "🏅"}</div><div class="block"><div class="tname">${esc(r.name)}</div><div class="tpts">${r.total} pts</div></div></div>`).join("")}</div>` : ""}
        ${!scoring ? "" : `<div class="grid cols-2" style="margin-top:20px">
          <div class="panel"><div class="row between"><h3 style="margin:0">Score breakdown</h3><span class="chip mono">${esc(TCL.Scoring.modelShort(s))}</span></div><div class="table-wrap" style="margin-top:10px"><table class="tbl"><tr><th>Team</th>${games.map(a => `<th class="num">${esc(a.title)}</th>`).join("")}<th class="num">Manual</th><th class="num">Total</th></tr>
            ${rows.map(r => `<tr><td style="color:${r.color};font-weight:700">${esc(r.name)}</td>${games.map(a => `<td class="num">${(per[a.id] || {})[r.id] || 0}</td>`).join("")}<td class="num">${(per.manual || {})[r.id] || 0}</td><td class="num" style="font-weight:700">${r.total}</td></tr>`).join("")}</table></div>${model !== "raw" ? `<p class="dim small" style="margin-top:8px">Raw points awarded by the activities: ${rows.map(r => esc(r.name) + " " + r.raw).join(" · ")}.</p>` : ""}</div>
          <div class="panel"><h3>Points by activity</h3>${games.map(a => { const max = Math.max(1, ...rows.map(r => (per[a.id] || {})[r.id] || 0)); return `<div class="eyebrow" style="margin:10px 0 6px">${esc(a.title)}</div>${rows.map(r => `<div class="row" style="gap:8px;margin-bottom:5px;--tc:${r.color}"><span class="small" style="width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.name)}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${((per[a.id] || {})[r.id] || 0) / max * 100}%"></div></div><span class="mono small" style="width:34px;text-align:right">${(per[a.id] || {})[r.id] || 0}</span></div>`).join("")}`; }).join("") || '<span class="dim">No scored activities.</span>'}</div>
        </div>`}
        ${awards.length && !shared ? `<div class="grid cols-3" style="margin-top:16px">${awards.map(a => `<div class="card" style="text-align:center"><div style="font-size:32px">${a.icon}</div><div class="eyebrow gold" style="margin:8px 0 4px">${esc(a.title)}</div><div style="font-weight:700;font-size:18px">${esc(a.who)}</div><div class="dim small">${esc(a.note)}</div></div>`).join("")}</div>` : ""}
        ${shared && shout.length ? `<div class="grid cols-3" style="margin-top:16px">${shout.map(a => `<div class="card" style="text-align:center"><div style="font-size:32px">${a.icon}</div><div class="eyebrow gold" style="margin:8px 0 4px">${esc(a.title)}</div><div style="font-weight:700;font-size:18px">${esc(a.who)}</div><div class="dim small">${esc(a.note)}</div></div>`).join("")}</div>` : ""}
        <div class="panel" style="margin-top:16px"><h3>Session summary</h3><textarea class="input mono small" rows="10" readonly id="summary-text">${esc(TCL.Session.summaryText())}</textarea>
          <div class="btn-row" style="margin-top:12px"><button class="btn" data-copy>${UI.icon("copy")} Copy summary</button><button class="btn ghost" data-dl="txt">${UI.icon("export")} Download .txt</button><button class="btn ghost" data-dl="json">Download session JSON</button><button class="btn ghost" data-present-final>${UI.icon("screen")} ${params.present ? "Presentation shows final standings" : "Show standings on presentation"}</button></div></div>
        <div class="btn-row center" style="margin:24px 0"><button class="btn ghost" data-nav="console">Back to console</button>${s.status !== "complete" ? `<button class="btn danger" data-end>End session</button>` : `<button class="btn ghost" data-new-from>Duplicate for next time</button>`}</div>
      </div>`, { title: "Results" });
    },
    mount(root, params) {
      const s = TCL.session();
      if (params.present) TCL.Presenter.push(true);
      root.addEventListener("click", async e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.finale) { s.finaleMode = b.dataset.finale; TCL.Session.touch(); TCL.Presenter.push(true); UI.render(); return; }
        if (b.hasAttribute("data-copy")) { const ok = await U.copyText(TCL.Session.summaryText()); UI.toast(ok ? "Copied" : "Clipboard unavailable. Select the text box and copy manually.", ok ? "ok" : "warn"); if (!ok) { const ta = root.querySelector("#summary-text"); ta.focus(); ta.select(); } }
        if (b.dataset.dl === "txt") U.download(`${s.name.replace(/[^\w-]+/g, "_")}-summary.txt`, TCL.Session.summaryText());
        if (b.dataset.dl === "json") U.download(`${s.name.replace(/[^\w-]+/g, "_")}.json`, JSON.stringify(s, null, 2), "application/json");
        if (b.hasAttribute("data-present-final")) { TCL.go("results", { present: true }); if (!TCL.Presenter.isOpen()) UI.openPresentation(); TCL.Audio.fanfare(); }
        if (b.hasAttribute("data-end")) { if (await UI.confirm("End session?", "The session is marked complete. Scores and the summary stay available from Home.", { okLabel: "End session" })) { TCL.Runner.endSession(); TCL.go("results", { present: true }); } }
        if (b.hasAttribute("data-new-from")) { TCL.Session.duplicate(s.id); TCL.go("builder"); }
      });
    },
  });
})();
