/* src/core/60-sync.js
   Presentation window sync. Primary channel: direct postMessage over the window handle
   (works on file:// in every browser). Secondary: BroadcastChannel. Tertiary: localStorage event.
   Only public payloads ever cross this boundary. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util;
  const Presenter = TCL.Presenter = {};
  const CH = "tcl-presentation";
  let win = null, bc = null, lastPing = 0, lastPayload = null, pollHandle = null;
  Presenter.status = "closed";      // closed | connecting | connected | disconnected | blocked
  Presenter.listeners = [];

  function setStatus(s) { if (Presenter.status !== s) { Presenter.status = s; TCL.emit("presenter:status", s); } }
  function url() {
    const base = location.href.split("#")[0];
    return base + "#presentation";
  }
  Presenter.open = function () {
    try {
      if (win && !win.closed) { win.focus(); Presenter.push(true); return true; }
      win = window.open(url(), "tcl_presentation", "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no");
      if (!win) { setStatus("blocked"); return false; }
      setStatus("connecting");
      lastPing = 0;
      Presenter.push(true);
      return true;
    } catch (e) { setStatus("blocked"); return false; }
  };
  Presenter.close = function () { try { if (win && !win.closed) win.close(); } catch (e) { /* ignore */ } win = null; setStatus("closed"); };
  Presenter.isOpen = () => !!(win && !win.closed);

  function send(msg) {
    const json = JSON.stringify(msg);
    if (win && !win.closed) { try { win.postMessage(msg, "*"); } catch (e) { /* ignore */ } }
    if (bc) { try { bc.postMessage(msg); } catch (e) { /* ignore */ } }
    try { localStorage.setItem(CH, json); } catch (e) { /* ignore */ }
  }
  /* Push the current public payload. force=true resends even if unchanged. */
  Presenter.push = function (force) {
    const payload = Presenter.buildPayload();
    const json = JSON.stringify(payload);
    if (!force && json === lastPayload) return;
    lastPayload = json;
    send({ type: "payload", ts: Date.now(), payload });
  };
  Presenter.buildPayload = function () {
    const s = TCL.session();
    const settings = TCL.state.settings;
    const base = { brand: "TEAM CONNECT LIVE", tagline: "One team. Any location. Real connections.", scale: settings.presentationScale || 1, largeText: !!settings.largeText,
      sessionName: s ? s.name : "", screen: "idle", blocks: [], timers: {}, standings: null, rehearsal: !!(s && s.rehearsal) };
    if (!s) return base;
    const a = TCL.Runner.current();
    const showScores = s.scoringEnabled !== false && s.showScores !== false && !settings.hideScoresUntilFinale;
    /* A holding screen covers everything else. The activity underneath keeps running. */
    if (s.holding) {
      base.screen = "holding";
      base.blocks = [{ type: "title", text: s.holding.title }];
      if (s.holding.sub) base.blocks.push({ type: "text", text: s.holding.sub });
      if (s.holding.kind === "custom" && s.holding.message) base.blocks = [{ type: "title", text: s.holding.message }];
      return base;
    }
    if (showScores) base.standings = TCL.Scoring.standings().map(r => ({ name: r.name, total: r.total, color: r.color, rank: r.rank }));
    base.teams = s.teamMode === "individual" ? [] : s.teams.map(t => ({ name: t.name, color: t.color, members: TCL.Teams.presentMembers(t, s).map(p => p.displayName || p.name) }));
    if (s.status === "complete" || TCL.route && TCL.route.screen === "results" && TCL.route.params && TCL.route.params.present) {
      base.screen = "final";
      const shared = s.finaleMode === "shared" || s.scoringEnabled === false;
      base.standings = shared ? null : TCL.Scoring.standings().map(r => ({ name: r.name, total: r.total, color: r.color, rank: r.rank, tied: r.tied }));
      if (shared) {
        const rows = TCL.Scoring.standings();
        base.shared = {
          points: U.sum(rows.map(r => r.raw)),
          activities: s.runSheet.filter(a => a.status === "complete").length,
          people: TCL.Teams.present(s).length,
          teams: rows.map(r => ({ name: r.name, color: r.color, total: r.raw })),
          showPoints: s.scoringEnabled !== false,
        };
        base.blocks = [{ type: "eyebrow", text: "Grand finale" }, { type: "title", text: "What we did together" }];
      } else {
        base.blocks = [{ type: "eyebrow", text: "Grand finale" }, { type: "title", text: "Final standings" }];
      }
      return base;
    }
    if (!a || a.status !== "active" && a.status !== "paused") {
      base.screen = "lobby";
      const next = TCL.Session.nextPending();
      base.blocks = [{ type: "eyebrow", text: s.name }, { type: "title", text: next ? "Up next: " + next.title : "Welcome" }, { type: "text", text: next ? "Get comfortable. We start shortly." : "Grab a drink and settle in." }];
      /* Who is on my team is the first question in a fifteen-person call, and the lobby is the
         screen people look at longest. It shows again between activities, because that is the
         other moment the question comes back. Individual mode has no teams to show. */
      if (base.teams.length) base.blocks.push({ type: "teams" });
      return base;
    }
    base.screen = "activity";
    base.activityTitle = a.title;
    base.paused = a.status === "paused";
    ["round", "breakout", "break"].forEach(n => { const t = TCL.Timers.get(n); if (t && t.status !== "idle") base.timers[n] = TCL.Timers.describe(n); });
    if (a.kind === "game") {
      const g = TCL.Games.get(a.gameId);
      try { base.blocks = g.presentation(TCL.Runner.ctx(a)) || []; } catch (e) { base.blocks = [{ type: "title", text: a.title }]; }
      base.icon = g.icon;
      base.blocks = dropRulesOncePlaying(base.blocks);
    } else {
      base.blocks = [{ type: "eyebrow", text: a.kind === "break" ? "Break" : "Activity" }, { type: "title", text: a.title }, { type: "text", text: a.settings.message || "" }, { type: "timer", name: a.kind === "break" ? "break" : "round" }];
      if (a.settings.instructions) base.blocks.push({ type: "instructions", items: String(a.settings.instructions).split("\n").filter(Boolean) });
      base.blocks = dropRulesOncePlaying(base.blocks);
    }
    return base;
  };

  /* Rules belong on screen while you explain them, not for the whole round. Once a clock
     is running the instruction list comes off so the prompt and timer own the screen. */
  function playing() {
    return ["round", "breakout", "break"].some(n => (TCL.Timers.get(n) || {}).status === "running");
  }
  function dropRulesOncePlaying(blocks) {
    if (!playing()) return blocks;
    return (blocks || []).filter(b => b && b.type !== "instructions");
  }

  function onMessage(msg, source) {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "hello" || msg.type === "ping") {
      lastPing = Date.now();
      if (source && (!win || win.closed)) win = source;
      setStatus("connected");
      if (msg.type === "hello") Presenter.push(true);
    }
  }
  Presenter.initFacilitator = function () {
    window.addEventListener("message", e => { if (e.data && e.data.channel === CH) onMessage(e.data, e.source); });
    try { bc = new BroadcastChannel(CH); bc.onmessage = e => onMessage(e.data); } catch (e) { bc = null; }
    window.addEventListener("storage", e => { if (e.key === CH + "-ping") { try { onMessage(JSON.parse(e.newValue)); } catch (e2) { /* ignore */ } } });
    pollHandle = setInterval(() => {
      if (Presenter.status === "closed" || Presenter.status === "blocked") return;
      if (win && win.closed) { win = null; setStatus("disconnected"); return; }
      if (lastPing && Date.now() - lastPing > 4000) setStatus("disconnected");
    }, 1000);
    TCL.on("runner:changed", () => Presenter.push());
    TCL.on("session:changed", () => Presenter.push());
    TCL.on("score:changed", () => Presenter.push());
    TCL.on("timer:change", () => Presenter.push(true));
    TCL.on("route:changed", () => Presenter.push());
  };

  /* ---------- presentation side ---------- */
  Presenter.initPresentation = function (onPayload) {
    const reply = msg => {
      msg.channel = CH;
      try { if (window.opener && !window.opener.closed) window.opener.postMessage(msg, "*"); } catch (e) { /* ignore */ }
      try { if (bc) bc.postMessage(msg); } catch (e) { /* ignore */ }
      try { localStorage.setItem(CH + "-ping", JSON.stringify(Object.assign({ ts: Date.now() }, msg))); } catch (e) { /* ignore */ }
    };
    const handle = data => { if (data && data.type === "payload" && data.payload) onPayload(data.payload); };
    window.addEventListener("message", e => {
      /* Accept only from the opener (same file) or via the named channels */
      if (window.opener && e.source !== window.opener) return;
      handle(e.data);
    });
    try { bc = new BroadcastChannel(CH); bc.onmessage = e => handle(e.data); } catch (e) { bc = null; }
    window.addEventListener("storage", e => { if (e.key === CH) { try { handle(JSON.parse(e.newValue)); } catch (e2) { /* ignore */ } } });
    try { const cached = localStorage.getItem(CH); if (cached) handle(JSON.parse(cached)); } catch (e) { /* ignore */ }
    reply({ type: "hello" });
    setInterval(() => reply({ type: "ping" }), 1500);
  };
})();
