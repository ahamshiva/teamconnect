/* src/ui/01-shell.js  App shell: sidebar nav, topbar, share-safety banner, global event delegation. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI;

  const NAV = [
    { id: "home", label: "Home", icon: "home", always: true },
    { id: "builder", label: "Session Builder", icon: "builder" },
    { id: "participants", label: "Participants", icon: "people" },
    { id: "library", label: "Activity Library", icon: "library" },
    { id: "content", label: "Content", icon: "content", always: true, advanced: true },
    { id: "settings", label: "Settings", icon: "settings", always: true },
  ];

  /* ---------- Simple / Advanced mode ---------- */
  UI.simple = function () { return (TCL.state && TCL.state.settings.consoleMode || "simple") !== "advanced"; };
  UI.setMode = function (mode) {
    TCL.state.settings.consoleMode = mode === "advanced" ? "advanced" : "simple";
    TCL.persist();
    UI.toast(UI.simple() ? "Simple mode: only the controls you need while the team is watching" : "Advanced mode: every setting and diagnostic", "ok");
    UI.render();
  };
  UI.modeToggle = function () {
    const simple = UI.simple();
    return `<div class="mode-toggle" role="group" aria-label="Console mode">
      <button type="button" class="${simple ? "on" : ""}" data-mode="simple" aria-pressed="${simple}">Simple</button>
      <button type="button" class="${simple ? "" : "on"}" data-mode="advanced" aria-pressed="${!simple}">Advanced</button></div>`;
  };

  UI.presenterChip = function () {
    const st = TCL.Presenter.status;
    const map = { closed: ["off", "Presentation not open"], connecting: ["warn", "Presentation opening"], connected: ["ok", "Presentation connected"], disconnected: ["bad", "Presentation disconnected"], blocked: ["bad", "Pop-up blocked"] };
    const m = map[st] || map.closed;
    return `<span class="chip ${m[0]}" data-presenter-chip><span class="dot"></span>${m[1]}</span>`;
  };

  /* Persistent traffic-light banner. Green = the presentation window is live, so it is safe
     to share THAT window. Red = this is the private facilitator view. Amber = in between. */
  UI.shareBanner = function () {
    const st = TCL.Presenter.status;
    const s = TCL.session();
    const rehearsal = s && s.rehearsal;
    if (st === "connected") {
      return `<div class="share-banner green" role="status">${UI.icon("check")}<div><b>Safe to share:</b> share the window titled "TEAM CONNECT LIVE · Presentation" in Zoom. This console stays private.${rehearsal ? " Rehearsal is running, so nothing here counts." : ""}</div>
        <button class="btn xs ghost" data-open-presentation>Focus it</button></div>`;
    }
    if (st === "disconnected" || st === "connecting") {
      return `<div class="share-banner amber" role="status">${UI.icon("warn")}<div><b>Presentation ${st === "connecting" ? "opening" : "disconnected"}:</b> participants are not seeing anything right now. Do not share this screen.</div>
        <button class="btn xs ghost" data-open-presentation>${st === "connecting" ? "Focus it" : "Reconnect"}</button></div>`;
    }
    if (st === "blocked") {
      return `<div class="share-banner red" role="status">${UI.icon("warn")}<div><b>Pop-up blocked:</b> the presentation window could not open. Allow pop-ups for this page, then retry. Never share this console.</div>
        <button class="btn xs ghost" data-open-presentation>Retry</button></div>`;
    }
    return `<div class="share-banner red" role="status">${UI.icon("warn")}<div><b>Facilitator view: do not share.</b> Answers and private notes are on this screen. Open the presentation window and share that one instead.</div>
      <button class="btn xs" data-open-presentation>Open presentation window</button></div>`;
  };

  /* One click covers the participant screen; one click uncovers it. The choice of message
     is a menu on the same control, so the common case stays a single press. */
  UI.holdingControl = function (s) {
    const h = s.holding;
    if (h) return `<button type="button" class="btn sm hold-on" data-hold-off>${UI.icon("eye")} Showing: ${esc(h.kind === "custom" ? "your message" : h.title)} · uncover</button>`;
    return `<div class="hold-group">
      <button type="button" class="btn sm ghost" data-hold="setup" title="Cover the participant screen">${UI.icon("screen")} Cover screen</button>
      ${UI.menu(TCL.Session.HOLDING.map(x => ({ label: x.title, icon: "screen", attr: `data-hold="${x.id}"` })).concat([{ sep: true }, { label: "Custom message…", icon: "edit", attr: "data-hold-custom" }]), { title: "What to show while covered" })}</div>`;
  };

  UI.rehearsalBar = function () {
    const s = TCL.session();
    if (!s || !s.rehearsal) return "";
    return `<div class="rehearsal-bar">${UI.icon("play")}<div><b>REHEARSAL</b> · sample people, ${TCL.Rehearsal.SPEED}× faster timers, no real scores and no questions used up.</div>
      <div class="btn-row"><button class="btn xs ghost" data-rehearse-jump>Jump to an activity</button><button class="btn xs" data-rehearse-end>End rehearsal</button></div></div>`;
  };

  /* Planning tools disappear once the session goes live: during play the sidebar answers
     "what is happening", "what is next" and "how do I get out of trouble", nothing else. */
  const LIVE_NAV = [
    { id: "console", label: "Now playing", icon: "console" },
    { id: "runsheet", label: "Run sheet", icon: "builder" },
    { id: "results", label: "Scores", icon: "trophy" },
  ];

  UI.shell = function (bodyHtml, opts) {
    opts = opts || {};
    const s = TCL.session();
    const active = TCL.route.screen;
    const simple = UI.simple();
    const live = !!(s && s.status === "live");
    let nav;
    if (live) {
      const view = (TCL.route.params || {}).view;
      nav = LIVE_NAV.map(n => {
        const on = n.id === "runsheet" ? (active === "console" && view === "runsheet") : (active === n.id && !(n.id === "console" && view === "runsheet"));
        const target = n.id === "runsheet" ? 'data-nav-runsheet' : `data-nav="${n.id}"`;
        return `<button type="button" class="nav-btn ${on ? "active" : ""}" ${target} aria-current="${on ? "page" : "false"}">${UI.icons[n.icon]}<span>${n.label}</span></button>`;
      }).join("") + `<div class="nav-sep"></div><button type="button" class="nav-btn" data-emergency>${UI.icons.warn}<span>If something breaks</span></button>`;
    } else {
      nav = NAV.filter(n => !(simple && n.advanced && active !== n.id)).map(n => {
        const disabled = !n.always && !s;
        return `<button type="button" class="nav-btn ${active === n.id ? "active" : ""}" data-nav="${n.id}" ${disabled ? "disabled" : ""} aria-current="${active === n.id ? "page" : "false"}">${UI.icons[n.icon]}<span>${n.label}</span></button>`;
      }).join("") + (s ? `<div class="nav-sep"></div><button type="button" class="nav-btn ${active === "console" ? "active" : ""}" data-nav="console">${UI.icons.console}<span>Facilitator Console</span></button>
        <button type="button" class="nav-btn ${active === "results" ? "active" : ""}" data-nav="results">${UI.icons.trophy}<span>Results</span></button>` : "");
    }
    return `<div class="shell ${live ? "playing" : "planning"}">
      <nav class="sidebar" aria-label="Main">
        <div class="brand"><div class="name">TEAM CONNECT <span>LIVE</span></div><div class="tag">${live ? esc(s.name) : "One team. Any location. Real connections."}</div></div>
        ${nav}
        <div class="nav-foot">${s && !live ? `<b style="color:var(--muted)">${esc(s.name)}</b><br>` : ""}v${TCL.VERSION} · works offline<br><span data-save-status>${TCL.Store.available ? "Autosave on" : "Storage unavailable: changes will be lost on close"}</span></div>
      </nav>
      <div class="main">
        <header class="topbar">
          <div class="title">${esc(opts.title || "")}</div>
          <div class="spacer"></div>
          ${s ? UI.holdingControl(s) : ""}
          ${UI.modeToggle()}
          ${live ? UI.timerChip("session") : ""}
          ${s ? `<button type="button" class="btn sm ghost" data-open-presentation>${UI.icon("screen")} ${TCL.Presenter.isOpen() ? "Focus presentation" : "Open presentation"}</button>` : ""}
        </header>
        ${s ? UI.rehearsalBar() + UI.shareBanner() : ""}
        ${bodyHtml}
      </div>
    </div>`;
  };

  /* One place to get out of trouble during a live session. */
  UI.emergencyDialog = function () {
    const s = TCL.session();
    return UI.modal({ title: "If something breaks", wide: true,
      body: `<p>Nothing here loses scores. Everything is reversible except ending the session, which asks again.</p>`,
      form: `<div class="stack">
        <div class="msg-card"><div><b>Participants cannot see the screen</b><div class="muted small">Reopen the presentation window and share that one in Zoom.</div></div><button type="button" class="btn sm" data-open-presentation>Open presentation</button></div>
        <div class="msg-card"><div><b>Wrong points awarded</b><div class="muted small">Undo the last action, or edit scores by hand.</div></div><button type="button" class="btn sm ghost" data-emg="scores">Edit scores</button></div>
        <div class="msg-card"><div><b>This activity has gone wrong</b><div class="muted small">Leave it (scores kept or discarded, you choose), or restart it from the beginning.</div></div><button type="button" class="btn sm ghost" data-emg="exit">Leave activity</button></div>
        <div class="msg-card"><div><b>We are behind schedule</b><div class="muted small">See the projected finish and the least disruptive way to fix it.</div></div><button type="button" class="btn sm ghost" data-emg="late">Running late</button></div>
        <div class="msg-card"><div><b>Someone joined or dropped out</b><div class="muted small">Mark them present or away and rebalance the teams.</div></div><button type="button" class="btn sm ghost" data-emg="people">Participants</button></div>
        <div class="msg-card"><div><b>I need to change the plan</b><div class="muted small">Opens the Session Builder. The running activity is not affected.</div></div><button type="button" class="btn sm ghost" data-emg="builder">Session Builder</button></div>
        <div class="msg-card"><div><b>We have to stop now</b><div class="muted small">Closes every remaining activity and opens the results.</div></div><button type="button" class="btn sm danger" data-emg="end">End session</button></div>
      </div>`,
      buttons: [{ label: "Close", value: null }],
      onOpen: el => el.addEventListener("click", async ev => {
        const b = ev.target.closest("[data-emg]"); if (!b) return;
        const what = b.dataset.emg;
        UI.closeModal();
        if (what === "scores") return UI.editScores();
        if (what === "exit") return TCL.Runner.current() ? UI.exitDialog() : UI.toast("No activity is running", "warn");
        if (what === "late") return UI.pacingDialog();
        if (what === "people") return TCL.go("participants");
        if (what === "builder") return TCL.go("builder");
        if (what === "end") { if (await UI.confirm("End the entire session?", "All remaining activities are closed. Scores are kept and the results screen opens.", { okLabel: "End session", danger: true })) { TCL.Runner.endSession(); TCL.go("results"); } }
      }) });
  };

  /* Global delegation for nav and common actions */
  document.addEventListener("click", async e => {
    const mode = e.target.closest("[data-mode]");
    if (mode) { UI.setMode(mode.dataset.mode); return; }
    const runsheet = e.target.closest("[data-nav-runsheet]");
    if (runsheet) { TCL.go("console", { view: "runsheet" }); return; }
    const emg = e.target.closest("[data-emergency]");
    if (emg) { UI.emergencyDialog(); return; }
    const nav = e.target.closest("[data-nav]");
    if (nav && !nav.disabled) { TCL.go(nav.dataset.nav); return; }
    const op = e.target.closest("[data-open-presentation]");
    if (op) { UI.openPresentation(); return; }
    const rj = e.target.closest("[data-rehearse-jump]");
    if (rj) { UI.rehearsalJump(); return; }
    const re = e.target.closest("[data-rehearse-end]");
    if (re) { UI.endRehearsal(); return; }
    const hold = e.target.closest("[data-hold]");
    if (hold) { TCL.Session.hold(hold.dataset.hold); UI.render(); return; }
    if (e.target.closest("[data-hold-off]")) { TCL.Session.hold(null); UI.render(); return; }
    if (e.target.closest("[data-hold-custom]")) {
      const v = await UI.prompt("Custom holding message", "Shown large on the participant screen. Keep it to a few words.", "", { label: "Message", okLabel: "Show it" });
      if (v && v.trim()) { TCL.Session.hold("custom", v.trim()); UI.render(); }
      return;
    }
    const go = e.target.closest("[data-go]");
    if (go) { TCL.go(go.dataset.go, go.dataset.goParam ? { id: go.dataset.goParam } : {}); return; }
  });

  UI.openPresentation = function () {
    const ok = TCL.Presenter.open();
    if (!ok) {
      UI.modal({ title: "The browser blocked the pop-up", body: `<p>Your browser stopped the presentation window from opening.</p><ol class="step-list" style="margin-top:10px"><li>Look for a "pop-up blocked" icon in the address bar and allow pop-ups for this page.</li><li>Then press Retry below.</li><li>Alternative: open this same file in a second tab and add <b>#presentation</b> to the address. It will connect automatically.</li><li>If pop-ups stay blocked, serve the folder over a local address instead: <code>python3 -m http.server 8080</code> then open <code>http://localhost:8080/team-connect.html</code>.</li></ol>`,
        buttons: [{ label: "Close", value: null }, { label: "Retry", value: "retry", primary: true }] }).then(v => { if (v === "retry") UI.openPresentation(); });
    }
  };

  /* ---------- rehearsal entry points ---------- */
  UI.startRehearsal = async function () {
    const ok = await UI.confirm("Start a rehearsal?", "<p>A practice session opens with six sample people, two teams and every game on the run sheet.</p><ul class=\"step-list\" style=\"margin-top:10px\"><li>Timers run " + TCL.Rehearsal.SPEED + "× faster.</li><li>No real scores are touched and no questions are marked as used.</li><li>Ending the rehearsal deletes it and returns you to your session.</li></ul>", { okLabel: "Start rehearsing", routine: true });
    if (!ok) return;
    TCL.Rehearsal.start();
    UI.toast("Rehearsal started. Open the presentation window to test the share.", "ok");
    TCL.go("console");
  };
  UI.endRehearsal = async function () {
    if (!(await UI.confirm("End the rehearsal?", "The practice session and everything in it is deleted. Your real sessions are untouched.", { okLabel: "End rehearsal" }))) return;
    const back = TCL.Rehearsal.end();
    UI.toast("Rehearsal ended and cleaned up", "ok");
    TCL.go(back ? "console" : "home");
  };
  UI.rehearsalJump = async function () {
    const games = TCL.Games.list();
    const v = await UI.modal({ title: "Jump straight to an activity", wide: true, body: "<p>Starts that activity immediately with sample people and short timers. Whatever is running now is reset.</p>",
      form: `<div class="grid cols-3">${games.map(g => `<button type="button" class="card clickable" data-jump="${g.id}" style="text-align:left"><div class="row between"><span class="icon">${g.icon}</span></div><h3 style="margin-top:6px">${esc(g.name)}</h3><p>${esc(g.tagline || g.description)}</p></button>`).join("")}</div>`,
      buttons: [{ label: "Cancel", value: null }],
      onOpen: el => el.addEventListener("click", ev => { const b = ev.target.closest("[data-jump]"); if (b) { UI.closeModal(); const r = TCL.Rehearsal.jumpTo(b.dataset.jump); if (!r.ok) UI.toast(r.reason || "Could not start that activity", "warn"); TCL.go("console"); } }) });
    return v;
  };
})();
