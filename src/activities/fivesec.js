/* src/activities/fivesec.js  Five-Second Frenzy. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  function hotSeat(ctx) {
    const st = ctx.state;
    if (st.hot) return { pid: st.hot.pid, target: ctx.targets.find(t => t.id === st.hot.tid) || ctx.targetOf(st.hot.pid) };
    return { pid: null, target: null };
  }
  function pickHot(ctx) {
    const st = ctx.state;
    if (ctx.teamMode === "individual") { const p = ctx.rotate("fivesec", true); return p ? { pid: p.id, tid: p.id } : null; }
    const teams = ctx.targets; if (!teams.length) return null;
    for (let i = 0; i < teams.length; i++) { const t = teams[(st.teamPtr + i) % teams.length]; const p = t.team ? ctx.rotateTeam(t.team, "fivesec", true) : null; if (p) { st.teamPtr = (st.teamPtr + i + 1) % teams.length; return { pid: p.id, tid: t.id }; } }
    return null;
  }
  const deck = K.deckActions("fivesec", { secondsKey: "seconds", timerLabel: "Go", onEnter: ctx => { ctx.state.phase = "ready"; ctx.state.hot = pickHot(ctx); ctx.state.retried = false; ctx.timer.stop(); } });
  TCL.Games.register({
    id: "fivesec", name: "Five-Second Frenzy", tagline: "Name three things. Fast.", category: "Energy",
    description: "\"Name 3 pizza toppings!\" The person on the spot must shout three valid answers before the ring dies. Rotates through everyone.",
    icon: UI.icons.clock, contentGame: "fivesec", flexKey: "count",
    defaultSettings: { count: 12, answers: 3, seconds: 8, categories: [], difficultyMin: 2, difficultyMax: 3, mode: "teams", teamHelp: false, points: 5, partial: true, partialPoints: 2, retry: false, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of prompts", 1, 60), f.count("answers", "Answers required", 1, 5), f.select("seconds", "Response time", [{ value: 5, label: "5 seconds (savage)" }, { value: 8, label: "8 seconds (remote-friendly)" }, { value: 10, label: "10 seconds (chill)" }, { value: 15, label: "15 seconds (custom, relaxed)" }]), f.categories("fivesec"), f.diffMin(), f.diffMax(), f.mode(), f.toggle("teamHelp", "Team may help"), f.number("points", "Points for success", 0, 50), f.toggle("partial", "Partial points for 2 of 3"), f.number("partialPoints", "Partial points", 0, 50), f.toggle("retry", "Allow one retry with a new prompt"), f.unused()].concat(K.common()),
    summary(s) { return `${s.count} prompts, ${s.answers} answers in ${s.seconds}s`; },
    estimateMinutes(s) { return K.est(K.num(s.count, 8, 1, 200), K.num(s.seconds, 8, 1, 600), 18); },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} prompts match; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "fivesec", ctx.settings.count); st.teamPtr = 0; st.phase = "ready"; ctx.state = st; st.hot = pickHot(ctx); st.retried = false; return st; },
    actions: Object.assign({}, deck, {
      go(ctx) { const st = ctx.state; st.phase = "live"; ctx.timer.start(K.num(ctx.settings.seconds, 8, 1, 600) * 1000, "Go", 2000); },
      hit(ctx) { const st = ctx.state; const h = hotSeat(ctx); if (h.target) ctx.score(h.target.id, ctx.settings.points, "nailed it", st.index); st.phase = "judged"; st.results[st.index] = "hit"; ctx.timer.stop(); },
      partial(ctx) { const st = ctx.state; const h = hotSeat(ctx); if (h.target) ctx.score(h.target.id, ctx.settings.partialPoints, "partial", st.index); st.phase = "judged"; st.results[st.index] = "partial"; ctx.timer.stop(); },
      miss(ctx) { const st = ctx.state; st.phase = "judged"; st.results[st.index] = "miss"; ctx.timer.stop(); },
      retry(ctx) { const st = ctx.state; if (st.retried) return; const it = K.freshItem(ctx, "fivesec"); if (it) { st.items[st.index] = it; st.retried = true; st.phase = "ready"; ctx.timer.stop(); } },
      changePerson(ctx) { ctx.state.hot = pickHot(ctx); },
    }),
    actionLabels: { hit: "Nailed it", partial: "Partial", miss: "Missed", go: "Go" },
    hotkeys: { g: "go", " ": "go", h: "hit", m: "miss", n: "next" },
    onTimerDone(ctx) { if (ctx.state.phase === "live") ctx.state.phase = "judge"; },
    isComplete: K.deckComplete,
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "Everyone survived the hot seat.");
      const h = hotSeat(ctx);
      return `<div class="stage">${K.head(ctx, `Five-Second Frenzy · ${it.category}`)}
        ${K.banner([{ text: "On the spot:" }, { text: ctx.name(h.pid), strong: true }, { text: h.target ? "· " + h.target.name : "" }], h.target && h.target.color)}<button class="btn xs ghost" data-act="changePerson" style="margin-left:8px">Someone else</button>
        <div class="prompt">${st.phase === "ready" ? `<span class="muted">Press GO to reveal:</span> <span class="dim">${esc(it.text)}</span>` : esc(it.text) + "!"}</div>
        <div class="row">${UI.ring("round")}<div class="ctl-row">${st.phase === "ready" ? `<button class="btn big" data-act="go">🚨 GO <span class="kbd">G</span></button>` : ""}${st.phase === "live" || st.phase === "judge" ? `<button class="btn green big" data-act="hit">${UI.icon("check")} Nailed it +${s.points} <span class="kbd">H</span></button>${s.partial ? `<button class="btn ghost big" data-act="partial">Partial +${s.partialPoints}</button>` : ""}<button class="btn ghost big" data-act="miss">✗ Missed <span class="kbd">M</span></button>` : ""}${st.phase === "judged" ? `<span class="chip ${st.results[st.index] === "miss" ? "bad" : "ok"}"><span class="dot"></span>${st.results[st.index]}</span>` : ""}${s.retry && !st.retried && st.phase !== "ready" ? `<button class="btn subtle" data-act="retry">↻ Retry with a new prompt</button>` : ""}</div></div>
        <div class="small muted" style="margin-top:8px">${s.answers} valid answers in ${s.seconds} seconds. ${s.teamHelp ? "The team may shout help." : "No help from the team."}</div>
        ${K.nav(ctx, { timer: false, reveal: false })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Five-Second Frenzy" }, { type: "title", text: "Hot seat closed. Breathe." }];
      const h = hotSeat(ctx);
      const b = [{ type: "eyebrow", text: `Five-Second Frenzy · ${st.index + 1} of ${st.items.length}` }, K.pBanner([{ text: "On the spot:" }, { text: ctx.name(h.pid), strong: true }], h.target && h.target.color)];
      if (st.phase === "ready") b.push({ type: "title", text: "Get ready…" }, { type: "text", text: `Name ${s.answers} things in ${s.seconds} seconds.${s.teamHelp ? " Team may help." : ""}` });
      else b.push({ type: "prompt", text: it.text + "!" });
      if (st.phase === "judged") b.push({ type: "answer", text: ({ hit: "Nailed it!", partial: "Close enough", miss: "Not this time" })[st.results[st.index]] || "" });
      b.push(K.pTimer());
      return b;
    },
  });
})();
