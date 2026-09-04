/* src/ui/60-console.js  Facilitator Console: dashboard, live activity view, exits,
   readiness gate, running-late controls and the private participation tracker.
   Simple mode shows only what you need with the team watching; Advanced shows everything. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, R = TCL.Runner;

  function breakoutBadge(a) {
    if (a.kind !== "game") return "";
    const g = TCL.Games.get(a.gameId);
    const kind = TCL.Readiness.breakoutKind(g, TCL.Runner.settingsOf(a));
    return kind === "always" ? '<span class="badge breakout">Breakout rooms required</span>' : "";
  }

  function pacingChip(s) {
    /* A rehearsal has every game on the sheet, so a projection against the target is noise. */
    if (s.status !== "live" || s.rehearsal) return "";
    const p = TCL.Pacing.status(s);
    if (p.behind) return `<button class="btn sm warn" data-running-late>${UI.icon("clock")} Running late by ${U.fmtMin(p.over)}</button>`;
    if (p.count) return `<button class="btn sm ghost" data-running-late title="Projected finish ${U.fmtMin(p.projected)} of ${U.fmtMin(p.target)}">${UI.icon("clock")} On track · ${U.fmtMin(p.projected)} projected</button>`;
    return "";
  }

  function dashboard(s) {
    const d = TCL.Duration.runSheet(s);
    const cur = R.current();
    const running = cur && cur.status === "active" ? cur : null;
    const next = TCL.Session.nextPending();
    const done = s.runSheet.filter(a => a.status === "complete").length;
    const simple = UI.simple();
    const v = TCL.Readiness.verdict();
    const live = s.status === "live";
    const readyBtn = live ? "" : v.clean
      ? `<button class="btn ghost sm ok" data-readiness>${UI.icon("check")} Ready to start</button>`
      : `<button class="btn ${v.canStart ? "ghost sm warn" : "danger sm"}" data-readiness>${UI.icon("warn")} ${v.blockers.length ? U.plural(v.blockers.length, "blocker") : U.plural(v.warnings.length, "thing") + " to check"}</button>`;
    const rows = s.runSheet.map((a, i) => {
      const rowMenu = simple ? "" : UI.menu([
        a.status === "pending" ? { label: "Configure", icon: "edit", attr: `data-cfg="${a.id}"` } : null,
        a.status === "complete" ? { label: "Reopen", icon: "undo", attr: `data-reopen="${a.id}"` } : null,
        a.status === "pending" ? { label: "Skip this activity", icon: "skip", attr: `data-skip="${a.id}"` } : null,
        a.status === "skipped" || a.status === "complete" || a.status === "paused" ? { label: "Reset to the start", icon: "shuffle", attr: `data-reset="${a.id}"`, danger: true } : null,
      ], { title: "Activity options" });
      const isNext = next && next.id === a.id;
      return `<div class="rs-item ${a.status} ${isNext ? "isnext" : ""}"><span class="num">${String(i + 1).padStart(2, "0")}</span>
        <div><div class="ttl">${esc(a.title)}${a.status === "pending" ? "" : ` <span class="badge ${a.status}">${a.status}</span>`}<span class="chip mono">${U.fmtMin(d.activities[i].minutes)}</span>${breakoutBadge(a)}</div>${a.scoresDiscarded ? '<div class="small dim">Scores discarded</div>' : ""}</div>
        <div class="btn-row actions">${breakoutBadge(a) && a.status !== "complete" ? `<button class="btn ghost sm" data-breakout="${a.id}" title="Room assignments and the Zoom broadcast message">${UI.icon("people")} Rooms</button>` : ""}${a.id === (running || {}).id ? `<button class="btn ghost sm" data-back-to-activity>${UI.icon("play")} Back to it</button>` : (a.status === "pending" || a.status === "paused") && !running ? `<button class="btn ${isNext ? "" : "ghost"} sm" data-start="${a.id}">${UI.icon("play")} ${a.status === "paused" ? "Resume" : "Start"}</button>` : ""}${rowMenu}</div></div>`;
    }).join("");
    return `<div class="console"><div class="console-main">
      <div class="stage lead"><span class="eyebrow gold">${live ? "Session in progress" : s.status === "complete" ? "Session complete" : "Ready to start"}</span>
        <h2>${esc(s.name)}</h2>
        <p class="muted">${done} of ${s.runSheet.length} activities complete · ${TCL.Teams.present(s).length} present · estimated ${U.fmtMin(d.total)} of ${U.fmtMin(d.target)}</p>
        <div class="btn-row" style="margin-top:18px">${running
          ? `<button class="btn big" data-back-to-activity>${UI.icon("play")} Back to ${esc(running.title)}</button>`
          : next ? `<button class="btn big" data-start="${next.id}">${UI.icon("play")} ${next.status === "paused" ? "Resume" : "Start"}: ${esc(next.title)}</button>`
          : s.runSheet.length ? `<button class="btn big" data-go="results">${UI.icon("trophy")} Show final results</button>`
          : `<button class="btn big" data-nav="builder">Add activities in the Session Builder</button>`}
          ${readyBtn}${moreMenu(s, null)}</div>
        ${running ? `<p class="dim small" style="margin-top:10px">${esc(running.title)} is still running and the participants can see it. Finish or leave it before starting another.</p>` : ""}</div>
      <div class="runsheet plain">${rows || '<div class="empty">No activities. Add some in the Session Builder.</div>'}</div>
    </div>${rail(s, null)}</div>`;
  }

  /* Fairness help, private to the console: who is owed a turn, who is sitting out.
     Never reaches the presentation, the results screen or the export. */
  function turnPanel(s) {
    const rows = TCL.Participation.rows(s);
    const suggested = TCL.Participation.suggest(s);
    const out = TCL.Teams.deferred(s);
    const notYet = rows.filter(r => r.turns === 0 && !out.includes(r.id));
    return `<div class="rail-panel tightpad turn-panel"><div class="row between"><h4 style="margin:0">Turn taking</h4><button class="btn xs ghost" data-participation>All</button></div>
      ${suggested ? `<div class="turn-suggest"><span class="k">Suggested next</span><b>${esc(suggested.name)}</b><span class="dim tiny">${suggested.turns === 0 ? "not picked yet" : U.plural(suggested.turns, "turn") + " so far"}</span>
        <div class="btn-row" style="margin-top:6px"><button class="btn xs" data-put-next="${suggested.id}">Put them next</button><button class="btn xs ghost" data-defer="${suggested.id}">Sitting out</button></div></div>` : ""}
      ${notYet.length ? `<div class="dim small" style="margin-top:8px">Not picked yet: ${notYet.slice(0, 6).map(r => esc(r.name)).join(", ")}${notYet.length > 6 ? ` +${notYet.length - 6}` : ""}</div>` : '<div class="dim small" style="margin-top:8px">Everyone has had at least one turn.</div>'}
      ${out.length ? `<div class="small" style="margin-top:8px;color:var(--amber)">Sitting out: ${out.map(id => esc(TCL.Teams.displayName(id, s))).join(", ")} <button class="btn xs ghost" data-undefer-all>Bring back</button></div>` : ""}
    </div>`;
  }

  /* The rail answers "where are we?", not "what can I change?".
     Everything changeable lives in the More menu on the header. */
  function rail(s, a) {
    const T = TCL.Timers;
    const st = TCL.Scoring.standings();
    const next = a ? TCL.Session.nextPending(a.id) : TCL.Session.nextPending();
    const g = a && a.kind === "game" ? TCL.Games.get(a.gameId) : null;
    let priv = "";
    if (g && g.privateNote) { try { priv = g.privateNote(R.ctx(a)); } catch (e) { priv = ""; } }
    const sessionOver = T.get("session").direction === "up" && T.elapsed("session") > T.get("session").durationMs && T.get("session").durationMs > 0;
    const roundName = a && a.kind === "break" ? "break" : "round";
    const roundLive = a && (T.get(roundName) || {}).status !== "idle";
    const breakoutLive = a && T.get("breakout").status !== "idle";
    const pacing = pacingChip(s);
    return `<aside class="console-rail">
      <div class="rail-panel">
        <div class="row between"><div class="stat"><span class="k">Session</span><span class="mono" data-timer-plain="session" style="font-size:22px;${sessionOver ? "color:var(--red)" : ""}">${T.fmt("session")}</span><span class="dim tiny">of ${U.fmtMin(s.targetMinutes)}${sessionOver ? " · over target" : ""}</span></div>
          ${a ? `<div class="stat"><span class="k">This activity</span><span class="mono" data-timer-plain="activity" style="font-size:22px">${T.fmt("activity")}</span><span class="dim tiny">est. ${U.fmtMin(TCL.Duration.activity(a, s))}</span></div>` : ""}</div>
        ${pacing ? `<div style="margin-top:10px">${pacing}</div>` : ""}
      </div>
      ${a ? `<div class="rail-panel tightpad"><div class="row between"><h4 style="margin:0">${roundName === "break" ? "Break clock" : "Round clock"}</h4><span class="mono small ${roundLive ? "" : "dim"}">${T.fmt(roundName)}</span></div>
        <div class="timer-ctl compact"><button class="btn ghost sm" data-timer="toggle" title="Start or pause (Space)">${(T.get(roundName) || {}).status === "running" ? UI.icon("pause") + " Pause" : UI.icon("play") + " Start"}</button><button class="btn ghost sm" data-timer="add">+30s</button><button class="btn ghost sm" data-timer="sub">−30s</button><button class="btn ghost sm" data-timer="restart" title="Restart">↺</button></div>
        ${breakoutLive ? `<div class="row between" style="margin-top:10px"><h4 style="margin:0">Breakout</h4><span class="mono small">${T.fmt("breakout")}</span></div>
          <div class="timer-ctl compact"><button class="btn ghost sm" data-timer="toggle" data-timer-name="breakout">${T.get("breakout").status === "running" ? UI.icon("pause") : UI.icon("play")}</button><button class="btn ghost sm" data-timer="add" data-timer-name="breakout">+30s</button><button class="btn ghost sm" data-timer="sub" data-timer-name="breakout">−30s</button><button class="btn ghost sm" data-timer="restart" data-timer-name="breakout">↺</button></div>` : ""}
      </div>` : ""}
      ${priv ? `<div class="private"><span class="eyebrow">Private · never shown on the presentation</span><div class="ans">${priv}</div></div>` : ""}
      ${s.scoringEnabled !== false ? `<div class="rail-panel"><h4>Scores${s.showScores === false ? " (hidden from participants)" : ""}</h4><div style="margin-top:8px">${UI.scoreList(st)}</div></div>` : ""}
      ${a && a.kind === "game" ? turnPanel(s) : ""}
      <div class="rail-panel tightpad"><div class="row between"><span class="k">Up next</span>${UI.presenterChip()}</div>
        <div style="margin-top:6px">${next ? `<b>${esc(next.title)}</b> <span class="dim small">· ${U.fmtMin(TCL.Duration.activity(next, s))}</span>${breakoutBadge(next)}` : '<span class="dim small">Nothing else scheduled. Results come next.</span>'}</div></div>
    </aside>`;
  }

  /* Secondary actions for whatever is on screen. Simple mode keeps the recoverable ones;
     Advanced adds the destructive and diagnostic entries. */
  function moreMenu(s, a) {
    const simple = UI.simple();
    const bo = a && breakoutBadge(a);
    const items = [];
    if (a) {
      items.push({ label: "Leave this activity", icon: "x", attr: "data-exit" });
      if (bo) items.push({ label: "Breakout room plan", icon: "people", attr: `data-breakout="${a.id}"` });
    }
    if (s.status === "live") items.push({ label: "Running late? Adjust the plan", icon: "clock", attr: "data-running-late" });
    items.push({ label: "Who has had a turn", icon: "people", attr: "data-participation" });
    if (a) items.push({ label: "Show the run sheet", icon: "builder", attr: "data-show-runsheet" });
    items.push({ sep: true });
    items.push({ label: "Undo " + (TCL.History.peekUndo() || "nothing yet"), icon: "undo", attr: "data-undo" + (TCL.History.canUndo() ? "" : " disabled") });
    if (TCL.History.canRedo() || !simple) items.push({ label: "Redo " + (TCL.History.peekRedo() || ""), icon: "redo", attr: "data-redo" + (TCL.History.canRedo() ? "" : " disabled") });
    if (!simple) {
      items.push({ sep: true });
      if (s.scoringEnabled !== false) items.push({ label: "Edit scores by hand", icon: "edit", attr: "data-edit-scores" });
      items.push({ label: "Facilitator notes", icon: "content", attr: "data-notes-modal" });
      items.push({ label: "Action history", icon: "console", attr: "data-history" });
      if (a) { items.push({ sep: true }); items.push({ label: "Restart this activity", icon: "shuffle", attr: `data-reset="${a.id}"`, danger: true }); }
    }
    if (s.status === "live") { items.push({ sep: true }); items.push({ label: "End the entire session", icon: "x", attr: "data-end-session", danger: true }); }
    return UI.menu(items, { label: "More", title: "Other actions" });
  }

  function activityView(s, a) {
    const g = a.kind === "game" ? TCL.Games.get(a.gameId) : null;
    let body = "";
    if (g) { try { body = g.console(R.ctx(a)); } catch (e) { console.error(e); body = UI.callout("error", "This activity view failed to render: " + esc(e.message)); } }
    else body = `<div class="stage"><span class="eyebrow gold">${a.kind === "break" ? "Break" : "Custom activity"}</span><div class="prompt">${esc(a.title)}</div><p class="muted">${esc(a.settings.message || "")}</p>${a.settings.instructions ? `<ol class="step-list" style="margin-top:12px;text-align:left">${String(a.settings.instructions).split("\n").filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}<div class="ctl-row" style="margin-top:16px">${UI.ring(a.kind === "break" ? "break" : "round")}</div></div>`;
    const idx = s.runSheet.indexOf(a);
    let complete = a.kind !== "game";
    if (g) { try { complete = g.isComplete(R.ctx(a)); } catch (e) { complete = !!(a.state && a.state.completeReady); } }
    /* "Mark complete" only goes gold when the activity itself has nothing left to do,
       so there is never a second gold button competing with Reveal or Next. */
    const deckDone = !a.state || a.state.items === undefined || a.state.finished === true;
    const goldComplete = complete && deckDone;
    return `<div class="console"><div class="console-main">
      <div class="activity-head"><div><span class="eyebrow gold">Activity ${idx + 1} of ${s.runSheet.length}${a.status === "paused" ? " · paused" : ""}</span>
        <h2>${g ? `<span class="ghead-icon">${g.icon}</span>` : ""}${esc(a.title)}</h2>${breakoutBadge(a)}</div>
        <div class="btn-row"><button class="btn ${goldComplete ? "big" : "ghost sm"}" data-complete>${UI.icon("check")} Mark complete</button>${moreMenu(s, a)}</div></div>
      ${a.status === "paused" ? UI.callout("warn", "This activity is paused. Timers are frozen. Press Resume to continue.") + `<div class="btn-row"><button class="btn big" data-start="${a.id}">${UI.icon("play")} Resume</button></div>` : ""}
      ${body}
      ${g && g.needsZoom ? `<p class="zoom-note">${UI.icon("info")} <b>Zoom:</b> ${esc(g.needsZoom)}. This app cannot control Zoom; use the Zoom toolbar.</p>` : ""}
    </div>${rail(s, a)}</div>`;
  }

  UI.registerScreen("console", {
    title: "Facilitator Console",
    render(params) {
      const s = TCL.session(); if (!s) return UI.shell('<div class="content"><div class="empty"><h3>No session open</h3><button class="btn" data-nav="home">Go to Home</button></div></div>');
      const a = R.current();
      const showActivity = a && (a.status === "active" || a.status === "paused") && (params || {}).view !== "runsheet";
      const body = showActivity ? activityView(s, a) : dashboard(s);
      const back = !showActivity && a && a.status === "active"
        ? `<div class="backbar">${UI.icon("prev")} <button class="btn ghost sm" data-back-to-activity>Back to ${esc(a.title)}</button><span class="dim small">Still running. Participants can see it.</span></div>` : "";
      return UI.shell(back + body, { title: showActivity ? "Now playing" : (s.status === "live" ? "Run sheet" : "Facilitator Console") });
    },
    mount(root) {
      const s = TCL.session();
      root.addEventListener("click", async e => {
        const actBtn = e.target.closest("[data-act]");
        if (actBtn && !actBtn.disabled) { actBtn.disabled = true; R.act(actBtn.dataset.act, actBtn.dataset.arg != null ? actBtn.dataset.arg : undefined); return; }
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.start) { UI.startActivity(b.dataset.start); return; }
        if (b.dataset.skip) { if (await UI.confirm("Skip this activity?", `<b>${esc(TCL.Session.activity(b.dataset.skip).title)}</b> will be marked skipped. You can reset it later to play it.`, { okLabel: "Skip" })) R.skip(b.dataset.skip); return; }
        if (b.dataset.reopen) { R.reopen(b.dataset.reopen); return; }
        if (b.dataset.reset) { const a = TCL.Session.activity(b.dataset.reset); const n = TCL.Scoring.eventsFor(a.id).filter(x => !x.undone).length; const v = await UI.modal({ title: "Reset activity", body: `<b>${esc(a.title)}</b> will go back to the start.${n ? ` It has <b>${n} score entries</b>.` : ""}`, buttons: [{ label: "Cancel", value: null }, n ? { label: "Reset, keep scores", value: "keep", kind: "ghost" } : null, { label: n ? "Reset and discard scores" : "Reset", value: "discard", kind: "danger" }].filter(Boolean) }); if (v) R.resetActivity(a.id, v === "keep"); return; }
        if (b.dataset.cfg) { UI.configureActivity(b.dataset.cfg); return; }
        if (b.dataset.breakout) { UI.breakoutDialog(b.dataset.breakout); return; }
        if (b.dataset.timer) { R.timer(b.dataset.timer, { timer: b.dataset.timerName }); return; }
        if (b.hasAttribute("data-readiness")) { UI.readinessDialog(); return; }
        if (b.hasAttribute("data-show-runsheet")) { TCL.go("console", { view: "runsheet" }); return; }
        if (b.hasAttribute("data-back-to-activity")) { TCL.go("console"); return; }
        if (b.hasAttribute("data-notes-modal")) { UI.notesDialog(); return; }
        if (b.hasAttribute("data-history")) { UI.historyDialog(); return; }
        if (b.hasAttribute("data-running-late")) { UI.pacingDialog(); return; }
        if (b.hasAttribute("data-participation")) { UI.participationDialog(); return; }
        if (b.dataset.putNext) { const a2 = R.current(); const key = (a2 && a2.state && a2.state.rotKey) || "spotlight"; TCL.Teams.setNext(key, b.dataset.putNext); UI.toast(TCL.Teams.displayName(b.dataset.putNext, s) + " goes next", "ok"); TCL.emit("runner:changed"); return; }
        if (b.dataset.defer) { TCL.Teams.defer(b.dataset.defer, true); UI.toast(TCL.Teams.displayName(b.dataset.defer, s) + " is sitting out for now. They stay on the roster."); TCL.emit("runner:changed"); return; }
        if (b.hasAttribute("data-undefer-all")) { TCL.Teams.clearDeferred(); UI.toast("Everyone is back in the rotation", "ok"); TCL.emit("runner:changed"); return; }
        if (b.hasAttribute("data-undo")) { TCL.History.undo(); TCL.Session.touch(); TCL.emit("runner:changed"); return; }
        if (b.hasAttribute("data-redo")) { TCL.History.redo(); TCL.Session.touch(); TCL.emit("runner:changed"); return; }
        if (b.hasAttribute("data-exit")) { UI.exitDialog(); return; }
        if (b.hasAttribute("data-complete")) { const a = R.current(); const g = a.kind === "game" ? TCL.Games.get(a.gameId) : null; let done = true; try { done = !g || g.isComplete(R.ctx(a)); } catch (err) { done = true; } if (!done && !(await UI.confirm("Finish early?", "This activity still has rounds left. Mark it complete anyway? Scores are kept.", { okLabel: "Mark complete", routine: true }))) return; R.complete(); UI.toast(`${a.title} complete`, "ok"); TCL.go("summary", { id: a.id }); return; }
        if (b.hasAttribute("data-end-session")) { if (await UI.confirm("End the entire session?", "All remaining activities will be closed. Scores are kept and the results screen opens. You can still reopen the session from Home.", { okLabel: "End session", danger: true })) { R.endSession(); TCL.go("results"); } return; }
        if (b.hasAttribute("data-edit-scores")) { UI.editScores(); return; }
      });
      root.addEventListener("change", e => {
        if (e.target.hasAttribute("data-notes")) { const a = R.current(); if (a && (a.status === "active" || a.status === "paused")) a.notes = e.target.value; else s.notes = e.target.value; TCL.Session.touch(); }
        const ch = e.target.closest("[data-act-change]");
        if (ch) R.act(ch.dataset.actChange, ch.value);
      });
      root.addEventListener("input", e => { const ch = e.target.closest("[data-act-input]"); if (ch) { const a = R.current(); if (a && a.state) { a.state[ch.dataset.actInput] = ch.value; TCL.Session.touch(); } } });
    },
  });

  /* Start an activity, running the readiness check the first time a session goes live. */
  UI.startActivity = async function (id) {
    const s = TCL.session(); if (!s) return;
    if (s.status !== "live" && !s.rehearsal && !(s.ready && s.ready.checkedAt)) {
      const go = await UI.readinessDialog({ startId: id });
      if (!go) return;
    }
    const r = R.start(id);
    if (r.ok) return;
    if (r.problems) {
      const go = await UI.confirm("This activity has problems", `<ul>${r.problems.map(p => `<li>${esc(p.message)}</li>`).join("")}</ul><p style="margin-top:8px">Start anyway with a safe fallback?</p>`, { okLabel: "Start anyway", routine: true });
      if (go) { TCL.Session.activity(id).forceStart = true; R.start(id); }
    } else UI.toast(r.reason, "warn");
  };

  UI.notesDialog = async function () {
    const s = TCL.session(); const a = R.current();
    const live = a && (a.status === "active" || a.status === "paused");
    const cur = live ? a.notes || "" : s.notes || "";
    const v = await UI.modal({ title: live ? "Notes for " + a.title : "Notes for this session",
      body: "<p>Private to you. Never shown on the presentation or exported.</p>",
      form: `<div class="field"><textarea class="input" id="notes-box" rows="8" placeholder="What worked, what to change, who to bring in next time…">${esc(cur)}</textarea></div>`,
      buttons: [{ label: "Cancel", value: null }, { label: "Save", primary: true, value: el => el.querySelector("#notes-box").value }] });
    if (v == null) return;
    if (live) a.notes = v; else s.notes = v;
    TCL.Session.touch();
    UI.toast("Notes saved", "ok");
  };
  UI.historyDialog = function () {
    const s = TCL.session();
    return UI.modal({ title: "Action history", wide: true,
      body: `<p>Everything that has happened this session, newest first. Undo is on the More menu.</p>`,
      form: `<div class="log" style="max-height:50vh">${(s.log || []).slice().reverse().map(l => `<div class="li ${l.kind}"><span class="ts">${new Date(l.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span><span>${esc(l.label)}</span></div>`).join("") || '<span class="dim small">No actions yet.</span>'}</div>`,
      buttons: [{ label: "Close", value: null }] });
  };

  /* ---------- readiness check ---------- */
  UI.readinessDialog = async function (opts) {
    opts = opts || {};
    const s = TCL.session(); if (!s) return false;
    const icons = { ok: "check", warn: "warn", blocker: "warn" };
    /* The list and the verdict re-render on every change; the acknowledgement switches
       stay in the DOM so ticking one never steals focus or drops the other. */
    const renderList = () => `<div class="ready-list">${TCL.Readiness.check().map(r => `<div class="ready-row ${r.level}">${UI.icon(icons[r.level])}
        <div><div class="ttl">${esc(r.label)}</div><div class="dim small">${esc(r.detail)}</div></div>
        <div class="btn-row">${r.fix && r.level !== "ok" ? `<button type="button" class="btn xs ghost" data-fix="${r.fix}">Fix</button>` : ""}</div></div>`).join("")}</div>`;
    const renderVerdict = () => { const v = TCL.Readiness.verdict();
      return `<div class="callout ${v.canStart ? (v.clean ? "gold" : "warn") : "error"}">${UI.icon(v.canStart ? "info" : "warn")}<div>${v.canStart ? (v.clean ? "Everything checks out. Have a good session." : `${U.plural(v.warnings.length, "warning")}. You can start anyway.`) : `${U.plural(v.blockers.length, "blocker")} must be fixed before the session can start.`}</div></div>`; };
    let started = false;
    const v0 = TCL.Readiness.verdict();
    const value = await UI.modal({
      title: "Pre-session readiness check", wide: true,
      body: `<p>Ten things worth knowing before the team joins. Warnings can be overridden; blockers cannot.</p>`,
      form: `<div id="ready-body">${renderList()}</div>
        <div class="stack" style="margin-top:12px">
          <label class="switch"><input type="checkbox" data-ack="participantsConfirmed" ${TCL.Readiness.acked("participantsConfirmed") ? "checked" : ""}><span class="track"></span><span class="txt">I have checked the present list against who actually joined</span></label>
          <label class="switch"><input type="checkbox" data-ack="zoomAck" ${TCL.Readiness.acked("zoomAck") ? "checked" : ""}><span class="track"></span><span class="txt">I will share only the presentation window, with "Share sound" ticked</span></label>
        </div>
        <div id="ready-verdict" style="margin-top:12px">${renderVerdict()}</div>`,
      buttons: [{ label: "Close", value: null },
        { label: "Export a backup now", value: "backup", kind: "ghost" },
        { label: v0.canStart ? (opts.startId ? "Start the session" : "Mark as checked") : "Cannot start yet", value: "start", primary: true }],
      onOpen: el => {
        const refresh = () => {
          el.querySelector("#ready-body").innerHTML = renderList();
          el.querySelector("#ready-verdict").innerHTML = renderVerdict();
          const v = TCL.Readiness.verdict(); const btn = el.querySelector("[data-mval='2']");
          btn.disabled = !v.canStart; btn.textContent = v.canStart ? (opts.startId ? "Start the session" : "Mark as checked") : "Cannot start yet";
        };
        refresh();
        el.addEventListener("change", ev => { const a = ev.target.closest("[data-ack]"); if (a) { TCL.Readiness.ack(a.dataset.ack, a.checked); refresh(); } });
        el.addEventListener("click", async ev => {
          const f = ev.target.closest("[data-fix]"); if (!f) return;
          const to = f.dataset.fix;
          if (to === "presentation") { UI.openPresentation(); setTimeout(refresh, 600); return; }
          if (to === "sound") { const ok = TCL.Audio.test(); TCL.state.settings.soundTested = ok; TCL.persist(); UI.toast(ok ? "Ding then buzzer played" : "Audio is blocked. Click the page once, then retry.", ok ? "ok" : "warn"); refresh(); return; }
          if (to === "backup") { U.download(`team-connect-backup-${U.today()}.json`, JSON.stringify(TCL.state, null, 2), "application/json"); TCL.state.settings.lastBackupAt = Date.now(); TCL.persist(); refresh(); return; }
          if (to === "zoom") { TCL.Readiness.ack("zoomAck", true); refresh(); return; }
          UI.closeModal(); TCL.go(to);
        });
      },
    });
    if (value === "backup") { U.download(`team-connect-backup-${U.today()}.json`, JSON.stringify(TCL.state, null, 2), "application/json"); TCL.state.settings.lastBackupAt = Date.now(); TCL.persist(); return UI.readinessDialog(opts); }
    if (value === "start") {
      s.ready = s.ready || {}; s.ready.checkedAt = Date.now();
      TCL.Session.touch();
      started = true;
    }
    return started;
  };

  /* ---------- running late ---------- */
  UI.pacingDialog = async function () {
    const s = TCL.session(); if (!s) return;
    const p = TCL.Pacing.status(s);
    const opts = TCL.Pacing.options(s);
    const cur = TCL.Runner.current();
    const body = `<div class="grid cols-3" style="margin-bottom:6px">
        <div class="stat"><span class="k">Elapsed</span><span class="big-num">${U.fmtMin(p.elapsed)}</span></div>
        <div class="stat"><span class="k">Still to run</span><span class="big-num">${U.fmtMin(p.remaining)}</span></div>
        <div class="stat"><span class="k">Projected finish</span><span class="big-num ${p.over > 0 ? "" : "gold"}" style="${p.over > 0 ? "color:var(--red)" : ""}">${U.fmtMin(p.projected)}</span></div>
      </div>
      <p class="muted">Target is ${U.fmtMin(p.target)}. ${p.over > 0 ? `You are <b>${U.fmtMin(p.over)}</b> over.` : `You have <b>${U.fmtMin(p.under)}</b> in hand.`}${cur && cur.status === "active" ? ` Nothing below touches <b>${esc(cur.title)}</b>, which is running now.` : ""}</p>`;
    const v = await UI.modal({ title: "Running late", wide: true, body,
      form: `<div class="stack">${opts.map(o => `<div class="msg-card ${o.recommended ? "recommended" : ""}"><div><b>${esc(o.label)}</b>${o.recommended ? ' <span class="badge ok">recommended</span>' : ""}<div class="muted small">${esc(o.detail)}</div></div>
        <div class="btn-row"><span class="chip mono ${o.saves >= 0 ? "ok" : "warn"}">${o.saves >= 0 ? "saves " + U.fmtMin(o.saves) : "adds " + U.fmtMin(-o.saves)}</span><button type="button" class="btn sm ${o.recommended ? "" : "ghost"}" data-pace="${o.id}">Apply</button></div></div>`).join("") || '<div class="empty">Nothing left to adjust.</div>'}</div>`,
      buttons: [{ label: "Close", value: null }],
      onOpen: el => el.addEventListener("click", async ev => {
        const b = ev.target.closest("[data-pace]"); if (!b) return;
        const o = opts.find(x => x.id === b.dataset.pace);
        if (o.disruption >= 4 && !(await UI.confirm(o.label + "?", esc(o.detail), { okLabel: "Do it", danger: o.id === "skipNext" }))) return;
        const r = TCL.Pacing.apply(o.id);
        UI.closeModal();
        UI.toast(r.saved > 0 ? `${o.label}: saved ${U.fmtMin(r.saved)}` : o.label, "ok");
        UI.render();
      }) });
    return v;
  };

  /* ---------- breakout plan ---------- */
  UI.breakoutDialog = function (activityId) {
    const s = TCL.session(); const a = TCL.Session.activity(activityId); if (!a) return;
    const plan = TCL.Readiness.breakoutPlan(a, s);
    return UI.modal({ title: "Breakout rooms · " + a.title, wide: true,
      body: `<p>This app cannot open breakout rooms. Create them from the Zoom toolbar and assign people as below, then broadcast the message.</p>`,
      form: `<div class="table-wrap"><table class="tbl"><tr><th>Room</th><th>Team</th><th>Members</th></tr>${plan.rooms.map(r => `<tr><td class="num">${r.room}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.members.join(", "))}</td></tr>`).join("") || '<tr><td colspan="3">No teams with present members.</td></tr>'}</table></div>
        <div class="field span2" style="margin-top:12px"><label for="bo-msg">Zoom broadcast message</label><textarea class="input mono small" id="bo-msg" rows="7" readonly>${esc(plan.text)}</textarea></div>`,
      buttons: [{ label: "Close", value: null }, { label: "Copy message", value: "copy", primary: true }],
      onOpen: el => el.addEventListener("click", async ev => { if (ev.target.closest("[data-mval='1']")) { const ok = await U.copyText(plan.text); UI.toast(ok ? "Copied. Paste into the Zoom broadcast box." : "Clipboard unavailable: select the text and copy manually.", ok ? "ok" : "warn"); } }),
    });
  };

  /* ---------- participation (private) ---------- */
  UI.participationDialog = function () {
    const s = TCL.session(); if (!s) return;
    const rows = TCL.Participation.rows(s);
    const teams = TCL.Participation.teamActivity(s);
    return UI.modal({ title: "Who has had a turn", wide: true,
      body: `<p>Private to you: this never appears on the presentation, in the results screen or in the exported summary. Use it to spread opportunities, not to rank people.</p>`,
      form: `<div class="grid cols-2"><div><h4 style="margin-bottom:8px">People, least picked first</h4><div class="table-wrap"><table class="tbl"><tr><th>Name</th><th>Team</th><th class="num">Turns</th><th>Roles</th></tr>
        ${rows.map(r => `<tr class="${r.turns === 0 ? "muted-row" : ""}"><td><b>${esc(r.name)}</b></td><td style="color:${r.color}">${esc(r.teamName)}</td><td class="num">${r.turns}</td><td class="small dim">${esc(r.roleText || "not picked yet")}</td></tr>`).join("") || '<tr><td colspan="4">Nobody present.</td></tr>'}</table></div></div>
        <div><h4 style="margin-bottom:8px">Team answer count</h4>${teams.length ? teams.map(t => `<div class="row" style="gap:8px;margin-bottom:6px;--tc:${t.color}"><span class="small" style="width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.name)}</span><div class="bar-track" style="flex:1"><div class="bar-fill" style="width:${t.answers / Math.max(1, teams[0].answers) * 100}%"></div></div><span class="mono small" style="width:28px;text-align:right">${t.answers}</span></div>`).join("") : '<span class="dim small">No teams.</span>'}
          <div class="dim small" style="margin-top:12px">Counts scoring events, so it only reflects activities that award points.</div></div></div>`,
      buttons: [{ label: "Close", value: null }, { label: "Reset tracking", value: "reset", kind: "ghost" }],
    }).then(v => { if (v === "reset") { TCL.Participation.reset(s); UI.toast("Turn tracking cleared"); UI.render(); } });
  };

  /* Keyboard shortcuts on the console (never while typing) */
  document.addEventListener("keydown", e => {
    if (TCL.route.screen !== "console") return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || document.querySelector(".modal-back")) return;
    const a = R.current(); if (!a || a.status !== "active") return;
    if (e.code === "Space") { e.preventDefault(); R.timer("toggle"); }
    else if (e.key === "z" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (e.shiftKey) TCL.History.redo(); else TCL.History.undo(); TCL.Session.touch(); TCL.emit("runner:changed"); }
    else if (a.kind === "game") { const g = TCL.Games.get(a.gameId); if (g.hotkeys && g.hotkeys[e.key.toLowerCase()]) { e.preventDefault(); const h = g.hotkeys[e.key.toLowerCase()]; R.act(typeof h === "string" ? h : h.action, typeof h === "string" ? undefined : h.arg); } }
  });
  TCL.on("tick", () => { document.querySelectorAll("[data-timer-plain]").forEach(el => { el.textContent = TCL.Timers.fmt(el.dataset.timerPlain); }); });

  UI.exitDialog = async function () {
    const a = R.current(); if (!a) return;
    const n = TCL.Scoring.eventsFor(a.id).filter(x => !x.undone).length;
    const v = await UI.modal({ title: "Leave " + esc(a.title) + "?", body: `Nothing is discarded unless you choose to. ${n ? `This activity has awarded <b>${n} score entries</b>.` : ""}`,
      buttons: [{ label: "Cancel and continue playing", value: null }, { label: "Pause and return to dashboard", value: "pause", kind: "ghost" }, { label: "Save progress and return", value: "save", kind: "ghost" }, { label: "End activity, keep scores", value: "keep", kind: "ghost" }, { label: "End activity, discard its scores", value: "discard", kind: "danger" }], dismissable: true });
    if (!v) return;
    if (v === "pause" || v === "save") { R.pause(); UI.toast(v === "pause" ? "Paused. Resume any time from the dashboard." : "Progress saved.", "ok"); s2(); }
    if (v === "keep") { R.complete(); UI.toast("Activity ended. Scores kept.", "ok"); TCL.go("summary", { id: a.id }); }
    if (v === "discard") { const ok = await UI.confirm("Discard this activity's scores?", `<b>${n}</b> score entries from <b>${esc(a.title)}</b> will be removed from the totals. Other activities are unaffected.`, { danger: true, okLabel: "Discard scores" }); if (ok) { R.completeAndDiscard(); UI.toast("Activity ended and its scores discarded"); s2(); } }
    function s2() { const s = TCL.session(); s.currentActivityId = null; TCL.Session.touch(); UI.render(); }
  };

  UI.editScores = async function () {
    const s = TCL.session();
    const rows = TCL.Scoring.standings();
    const events = (s.scoreEvents || []).slice(-40).reverse();
    await UI.modal({ title: "Edit scores", wide: true, form: `<div class="grid cols-2"><div><h4 style="margin-bottom:8px">Manual adjustment</h4><div class="stack">${rows.map(r => `<div class="row between"><b style="color:${r.color}">${esc(r.name)}</b><div class="row" style="gap:6px"><input class="input sm num" type="number" value="5" data-adj-val="${r.id}" aria-label="Points"><button class="btn xs" data-adj="${r.id}" data-sign="1">+ Add</button><button class="btn xs ghost" data-adj="${r.id}" data-sign="-1">− Remove</button></div></div>`).join("")}</div></div>
      <div><h4 style="margin-bottom:8px">Score history</h4><div class="log" style="max-height:300px">${events.map(e => { const t = U.byId(s.teams, e.teamId) || U.byId(s.participants, e.participantId); const act = e.activityId === "manual" ? "Manual" : (TCL.Session.activity(e.activityId) || {}).title || "?"; return `<div class="li ${e.undone ? "undo" : ""}"><span class="ts">${new Date(e.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span style="${e.undone ? "text-decoration:line-through" : ""}">${esc(t ? t.name : "?")} ${e.points > 0 ? "+" : ""}${e.points} · ${esc(act)}${e.reason ? " · " + esc(e.reason) : ""}</span><button class="btn xs ghost" data-ev="${e.id}">${e.undone ? "Restore" : "Undo"}</button></div>`; }).join("") || '<span class="dim small">No score events yet.</span>'}</div></div></div>`,
      buttons: [{ label: "Close", value: null }],
      onOpen: el => el.addEventListener("click", e => {
        const adj = e.target.closest("[data-adj]"); if (adj) { const v = Number(el.querySelector(`[data-adj-val="${adj.dataset.adj}"]`).value) || 0; if (!v) return; TCL.History.record("Manual score adjustment"); TCL.Scoring.manualAdjust(adj.dataset.adj, v * Number(adj.dataset.sign), "Manual adjustment"); TCL.Session.touch(); UI.closeModal(); UI.editScores(); TCL.emit("runner:changed"); }
        const ev = e.target.closest("[data-ev]"); if (ev) { const evt = U.byId(s.scoreEvents, ev.dataset.ev); TCL.History.record((evt.undone ? "Restore" : "Undo") + " score entry"); if (evt.undone) TCL.Scoring.restoreEvent(evt.id); else TCL.Scoring.undoEvent(evt.id); TCL.Session.touch(); UI.closeModal(); UI.editScores(); TCL.emit("runner:changed"); }
      }) });
  };

  /* ---------- Transition between activities ----------
     Not a run sheet. It closes the activity that just ended, shows where everyone stands,
     and hands the facilitator exactly what the next one needs before they press Continue. */
  UI.registerScreen("summary", {
    title: "Between activities",
    render(params) {
      const s = TCL.session(); const a = s && TCL.Session.activity(params.id); if (!s || !a) return UI.shell('<div class="content"><div class="empty"><h3>Nothing to summarise</h3><button class="btn" data-nav="console">Back to console</button></div></div>');
      const g = a.kind === "game" ? TCL.Games.get(a.gameId) : null;
      const per = TCL.Scoring.perActivityModel()[a.id] || {};
      const raw = TCL.Scoring.rawFor(a.id);
      const rows = TCL.Scoring.standings();
      const next = TCL.Session.nextPending(a.id);
      const scored = TCL.Scoring.enabledFor(a) && !a.scoresDiscarded && s.scoringEnabled !== false;
      const model = TCL.Scoring.model(s);
      const outcomes = (a.state && a.state.outcomes) || {};
      const noResp = Object.keys(outcomes).filter(k => outcomes[k] === "no response").length;
      const tech = Object.keys(outcomes).filter(k => outcomes[k] === "technical").length;
      let extra = ""; if (g && g.summaryView) { try { extra = g.summaryView(R.ctx(a)); } catch (e) { extra = ""; } }
      const ng = next && next.kind === "game" ? TCL.Games.get(next.gameId) : null;
      const nextBreakout = next ? breakoutBadge(next) : "";
      const prep = [];
      if (next) {
        if (nextBreakout) prep.push("Open Zoom breakout rooms, one per team. The room list and broadcast message are ready on the console.");
        if (ng && ng.needsZoom) prep.push(ng.needsZoom + ".");
        if (ng && ng.contentGame === "images") prep.push("Everyone needs paper and a pen, or a drawing app they can share.");
        if (next.kind === "break") prep.push("Say the time you will be back, and cover the screen so nobody stares at a run sheet.");
        if (!prep.length) prep.push("Nothing to set up. Read the rules from the console and start the clock.");
      }
      return UI.shell(`<div class="content narrow">
        <div class="hero" style="padding:20px 0 6px"><span class="eyebrow gold">${a.status === "complete" ? "Activity complete" : "Activity ended"}</span>
          <h1 style="font-size:38px;text-transform:none">${esc(a.title)}</h1>
          <p>${a.scoresDiscarded ? "Scores for this one were discarded." : scored ? "Nicely done. Here is where that leaves everyone." : "Not scored, which is the point of it. Nicely done."}</p></div>

        ${noResp || tech ? `<p class="dim small" style="text-align:center">${[noResp ? U.plural(noResp, "item") + " went unanswered" : "", tech ? U.plural(tech, "item") + " swapped for a technical problem" : ""].filter(Boolean).join(" · ")}</p>` : ""}

        ${scored && rows.length ? `<div class="panel"><div class="row between"><h3 style="margin:0">Standings</h3><span class="chip mono">${esc(TCL.Scoring.modelShort(s))}</span></div>
          <div class="table-wrap" style="margin-top:10px"><table class="tbl"><tr><th>Team</th><th class="num">This activity</th>${model !== "raw" ? '<th class="num">Raw</th>' : ""}<th class="num">Total</th></tr>
          ${rows.map(r => `<tr><td style="color:${r.color};font-weight:700">${r.rank === 1 && r.total > 0 ? "👑 " : ""}${esc(r.name)}</td><td class="num">${per[r.id] || 0}</td>${model !== "raw" ? `<td class="num dim">${raw[r.id] || 0}</td>` : ""}<td class="num" style="font-weight:700">${r.total}</td></tr>`).join("")}</table></div></div>` : ""}
        ${extra ? `<div class="panel">${extra}</div>` : ""}

        ${next ? `<div class="panel next-up"><span class="eyebrow gold">Up next</span>
          <div class="row between" style="margin-top:6px"><h2 style="margin:0">${ng ? `<span class="ghead-icon">${ng.icon}</span>` : ""}${esc(next.title)}</h2><span class="chip mono">${U.fmtMin(TCL.Duration.activity(next, s))}</span></div>
          ${nextBreakout ? `<div style="margin-top:8px">${nextBreakout}</div>` : ""}
          ${ng ? `<p class="muted" style="margin-top:6px">${esc(ng.tagline || ng.description)}</p>` : ""}
          <div class="eyebrow" style="margin:14px 0 6px">Before you start</div>
          <ol class="step-list">${prep.map(x => `<li>${esc(x)}</li>`).join("")}</ol>
          <div class="btn-row" style="margin-top:16px">
            <button class="btn big" data-start-next="${next.id}">${UI.icon("play")} Start ${esc(next.title)}</button>
            ${nextBreakout ? `<button class="btn ghost" data-breakout="${next.id}">${UI.icon("people")} Room plan and broadcast</button>` : ""}
            <button class="btn ghost" data-hold="setup">${UI.icon("screen")} Cover the screen first</button>
          </div></div>`
        : `<div class="panel next-up"><span class="eyebrow gold">That was the last one</span><h2 style="margin:6px 0">Time for the finale</h2>
          <div class="btn-row" style="margin-top:14px"><button class="btn big" data-go="results">${UI.icon("trophy")} Show the results</button></div></div>`}

        <div class="btn-row center" style="margin:20px 0"><button class="btn ghost" data-nav="console">Back to the run sheet</button></div></div>`, { title: "Between activities" });
    },
    mount(root) {
      root.addEventListener("click", async e => {
        const b = e.target.closest("button"); if (!b) return;
        if (b.dataset.startNext) { const r = R.start(b.dataset.startNext); if (r.ok) { if (TCL.session().holding) TCL.Session.hold(null); TCL.go("console"); } else UI.toast(r.reason, "warn"); return; }
        if (b.dataset.breakout) { UI.breakoutDialog(b.dataset.breakout); return; }
      });
    },
  });
})();
