/* src/games/wronganswers.js  Wrong Answers Only: funniest wrong answer wins, then the real answer lands. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("wronganswers", { secondsKey: "writeSeconds", timerLabel: "Writing", onEnter: ctx => { const st = ctx.state; st.phase = "write"; st.subs = {}; st.votes = {}; st.order = null; st.revealed = false; ctx.timer.stop(); } });
  TCL.Games.register({
    id: "wronganswers", name: "Wrong Answers Only", tagline: "The funniest wrong answer wins. Then the truth.", category: "Creative",
    description: "A real question appears: why is the keyboard QWERTY? Teams compete for the funniest wrong answer, the room votes, then the facilitator reveals the real answer and a fun fact. A bonus goes to any team that also knew the truth.",
    icon: UI.icons.star, contentGame: "wronganswers", flexKey: "count", modes: ["teams"], needsZoom: "Teams send answers by private chat and vote by chat or reactions",
    defaultSettings: { count: 4, writeSeconds: 75, categories: [], difficultyMin: 2, difficultyMax: 3, order: "random", points1: 10, points2: 5, truthBonus: 5, anonymous: true, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of questions", 1, 15), f.seconds("writeSeconds", "Writing time", 30, 180, 15), f.categories("wronganswers"), f.diffMin(), f.diffMax(), f.order(), f.number("points1", "Funniest answer", 0, 50), f.number("points2", "Runner-up", 0, 50), f.number("truthBonus", "Bonus for also knowing the real answer", 0, 50), f.toggle("anonymous", "Show answers anonymously until the vote is in"), f.unused()].concat(K.common()),
    summary(s, ctx) { return `${s.count} questions × (${s.writeSeconds}s writing + vote + real answer)`; },
    estimateMinutes(s, ctx) { return K.est(s.count, s.writeSeconds + 45 + ctx.teams * 8, 15); },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} questions match; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "wronganswers", ctx.settings.count); st.phase = "write"; st.subs = {}; st.votes = {}; st.order = null; return st; },
    actions: Object.assign({}, deck, {
      startWriting(ctx) { ctx.state.phase = "write"; ctx.timer.start(ctx.settings.writeSeconds * 1000, "Writing", 15000); },
      setSub(ctx, arg) { const a = K.arg(arg); ctx.state.subs[a.id] = a.text; },
      setVotes(ctx, arg) { const a = K.arg(arg); ctx.state.votes[a.id] = Number(a.n) || 0; },
      show(ctx) { const st = ctx.state; st.order = U.shuffle(ctx.targets.filter(t => (st.subs[t.id] || "").trim()).map(t => t.id)); st.phase = "vote"; ctx.timer.pause(); },
      awardFunniest(ctx) {
        const st = ctx.state, s = ctx.settings;
        const ranked = U.sortBy((st.order || []).slice(), id => st.votes[id] || 0, true);
        if (ranked[0] && s.points1 && !ctx.scored(ranked[0], "funniest", st.index)) ctx.score(ranked[0], s.points1, "funniest", st.index);
        if (ranked[1] && s.points2 && !ctx.scored(ranked[1], "runner-up", st.index)) ctx.score(ranked[1], s.points2, "runner-up", st.index);
        st.phase = "reveal"; st.revealed = true; ctx.timer.stop();
      },
      truthBonus(ctx, id) { ctx.score(id, ctx.settings.truthBonus, "knew the truth", ctx.state.index); },
      reveal(ctx) { ctx.state.revealed = true; ctx.state.phase = "reveal"; ctx.timer.stop(); },
    }),
    noUndo: ["setSub", "setVotes"],
    actionLabels: { show: "Show answers", awardFunniest: "Award funniest by votes", truthBonus: "Truth bonus" },
    hotkeys: { n: "next", s: "show", r: "reveal" },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it && !ctx.state.revealed ? esc(it.answer) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "No more questions. Some of those answers were worryingly good.");
      const subs = ctx.targets.filter(t => (st.subs[t.id] || "").trim()).length;
      return `<div class="stage">${K.head(ctx, `Wrong Answers Only · ${it.category} · ${K.stars(it.difficulty)} · ${st.phase}`)}
        <div class="prompt">${esc(it.text)}</div>
        <div class="row" style="gap:14px;align-items:flex-start;margin-top:6px">${UI.ring("round")}<div class="stack" style="flex:1;gap:6px"><div class="private"><span class="eyebrow">Private · real answer</span><div class="ans" style="font-size:16px">${esc(it.answer)}</div>${it.fun ? `<div class="small muted" style="margin-top:4px">${esc(it.fun)}</div>` : ""}</div>
          <div class="ctl-row"><button class="btn ${st.phase === "write" ? "" : "ghost"}" data-act="startWriting">${UI.icon("play")} Writing ${s.writeSeconds}s</button><button class="btn ${st.phase === "write" && subs ? "blue" : "ghost"}" data-act="show" ${subs ? "" : "disabled"}>${UI.icon("screen")} Show answers <span class="kbd">S</span></button><button class="btn green" data-act="awardFunniest" ${st.phase === "vote" ? "" : "disabled"}>${UI.icon("trophy")} Award by votes and reveal</button><button class="btn ghost" data-act="reveal" ${st.revealed ? "disabled" : ""}>${UI.icon("eye")} Reveal only <span class="kbd">R</span></button></div>
          <div class="small muted">Teams send their funniest WRONG answer by private chat. Paste each below, show them, collect votes in chat, then award.</div></div></div>
        <div class="grid cols-2" style="margin-top:10px">${ctx.targets.map(t => `<div class="field"><label for="wa-${t.id}" style="color:${t.color}">${esc(t.name)}</label><textarea class="input sm" id="wa-${t.id}" rows="2" data-wa-team="${t.id}" placeholder="Paste their wrong answer…" ${st.order ? "disabled" : ""}>${esc(st.subs[t.id] || "")}</textarea>${st.order ? `<div class="row" style="gap:6px"><input class="input sm num" type="number" min="0" value="${st.votes[t.id] || ""}" placeholder="votes" data-wa-votes="${t.id}" aria-label="Votes for ${esc(t.name)}">${st.revealed && s.truthBonus ? `<button class="btn xs ghost" data-act="truthBonus" data-arg="${t.id}" ${ctx.scored(t.id, "knew the truth", st.index) ? "disabled" : ""}>Also knew the truth +${s.truthBonus}</button>` : ""}</div>` : ""}</div>`).join("")}</div>
        ${K.nav(ctx, { timer: false, reveal: false })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Wrong Answers Only" }, { type: "title", text: "Correct answers resume tomorrow." }];
      const b = [{ type: "eyebrow", text: `Wrong Answers Only · ${st.index + 1} of ${st.items.length} · ${it.category}` }, { type: "prompt", text: it.text }];
      if (st.phase === "write") b.push({ type: "text", text: "Wrong answers only. The funnier the better. Send yours privately to the facilitator." }, K.pTimer());
      else if (st.order) {
        const ranked = st.revealed ? U.sortBy(st.order.slice(), id => st.votes[id] || 0, true) : st.order;
        b.push({ type: "messages", items: ranked.map((id, i) => { const t = ctx.targets.find(x => x.id === id); return { text: st.subs[id], from: st.revealed || !s.anonymous ? `${t ? t.name : ""}${st.revealed ? " · " + (st.votes[id] || 0) + " votes" : ""}` : `#${i + 1}` }; }) });
        if (st.revealed) b.push({ type: "answer", text: "Real answer: " + it.answer }, it.fun ? { type: "text", text: it.fun } : { type: "text", text: "" });
        else b.push({ type: "text", text: "Vote for the funniest: type its number in chat." });
      }
      return b;
    },
  });
  document.addEventListener("change", e => { const el = e.target; if (el.dataset.waTeam) TCL.Runner.act("setSub", JSON.stringify({ id: el.dataset.waTeam, text: el.value })); if (el.dataset.waVotes) TCL.Runner.act("setVotes", JSON.stringify({ id: el.dataset.waVotes, n: el.value })); });
})();
