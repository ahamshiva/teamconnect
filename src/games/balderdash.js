/* src/games/balderdash.js  Fake Definitions (Balderdash style). */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("balderdash", { secondsKey: "writeSeconds", timerLabel: "Writing", onEnter: ctx => { const st = ctx.state; st.phase = "write"; st.subs = {}; st.board = null; st.picks = {}; st.revealed = false; ctx.timer.stop(); } });
  /* Build the anonymous numbered board: real definition + team fakes + decoys to reach minDefs. */
  function buildBoard(ctx) {
    const st = ctx.state, s = ctx.settings, it = K.current(st);
    /* Strip a trailing language tag so the real one does not give itself away on the board */
    const boardText = String(it.answer).replace(/\s*\([^()]*\b(?:Mandarin|Cantonese|Chinese|Filipino|Tagalog|Hindi|Marathi|Indian|Australian|English|Latin|Greek|slang)\b[^()]*\)/gi, "").replace(/\s+([.,;])/g, "$1").replace(/\s{2,}/g, " ").trim();
    const entries = [{ text: boardText, real: true, teamId: null }];
    ctx.targets.forEach(t => { const txt = (st.subs[t.id] || "").trim(); if (txt) entries.push({ text: txt, real: false, teamId: t.id }); });
    const decoys = Array.isArray(it.decoys) ? it.decoys.slice() : [];
    while (entries.length < (s.minDefs || 4) && decoys.length) entries.push({ text: decoys.shift(), real: false, teamId: null, decoy: true });
    return U.shuffle(entries);
  }
  TCL.Games.register({
    id: "balderdash", name: "Fake Definitions", tagline: "Invent a meaning. Fool the room. Learn the real one.", category: "Creative",
    description: "An obscure word appears (jugaad, kilig, petrichor, bogan). Each team writes a convincing fake definition. All definitions are shown anonymously with the real one mixed in; teams vote. Points for spotting the truth and for every team you fool.",
    icon: UI.icons.content, contentGame: "balderdash", flexKey: "count", modes: ["teams"], needsZoom: "Teams send their fake definition to the facilitator by private chat, then vote by chat",
    defaultSettings: { count: 4, writeSeconds: 90, voteSeconds: 45, categories: [], difficultyMin: 1, difficultyMax: 3, order: "random", pointsCorrect: 10, pointsPerFool: 5, minDefs: 4, useDecoys: true, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of words", 1, 12), f.seconds("writeSeconds", "Writing time", 30, 240, 15), f.seconds("voteSeconds", "Voting time", 15, 120, 15), f.categories("balderdash"), f.diffMin(), f.diffMax(), f.order(), f.number("pointsCorrect", "Points for picking the real definition", 0, 50), f.number("pointsPerFool", "Points per team fooled by your fake", 0, 50), f.count("minDefs", "Minimum definitions on the board (filled with built-in decoys)", 2, 8), f.toggle("useDecoys", "Use built-in decoys when teams submit too few"), f.unused()].concat(K.common()),
    summary(s, ctx) { return `${s.count} words × (${s.writeSeconds}s writing + vote + reveal)`; },
    estimateMinutes(s, ctx) { return K.est(s.count, s.writeSeconds + s.voteSeconds + 40 + ctx.teams * 10, 15); },
    validate(s, ctx) { const out = []; const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); if (sel.pool < s.count) out.push({ level: "warn", message: `Only ${sel.pool} words match; ${s.count} requested.` }); if (ctx.teams.length < 2) out.push({ level: "warn", message: "Fake Definitions needs at least 2 teams to fool each other." }); return out; },
    init(ctx) { const st = K.deckInit(ctx, "balderdash", ctx.settings.count); st.phase = "write"; st.subs = {}; st.board = null; st.picks = {}; return st; },
    actions: Object.assign({}, deck, {
      startWriting(ctx) { ctx.state.phase = "write"; ctx.timer.start(ctx.settings.writeSeconds * 1000, "Writing", 15000); },
      setSub(ctx, arg) { const a = K.arg(arg); ctx.state.subs[a.id] = a.text; },
      show(ctx) { const st = ctx.state; if (!ctx.settings.useDecoys) { const it = K.current(st); it.decoys = []; } st.board = buildBoard(ctx); st.phase = "vote"; st.picks = {}; ctx.timer.start(ctx.settings.voteSeconds * 1000, "Voting", 10000); },
      pick(ctx, arg) { const a = K.arg(arg); if (ctx.state.revealed) return; ctx.state.picks[a.id] = Number(a.n); },
      reveal(ctx) {
        const st = ctx.state, s = ctx.settings; if (!st.board || st.revealed) return;
        st.revealed = true; st.phase = "reveal"; ctx.timer.pause();
        ctx.targets.forEach(t => {
          const n = st.picks[t.id]; if (n == null) return;
          const e = st.board[n]; if (!e) return;
          if (e.real) ctx.score(t.id, s.pointsCorrect, "spotted the truth", st.index);
          else if (e.teamId && e.teamId !== t.id) ctx.score(e.teamId, s.pointsPerFool, `fooled ${t.name}`, st.index);
        });
      },
      reshow(ctx) { ctx.state.phase = "vote"; },
    }),
    noUndo: ["setSub"],
    actionLabels: { show: "Show definitions", reveal: "Reveal and score", pick: "Record team pick" },
    hotkeys: { n: "next", r: "reveal", s: "show" },
    onTimerDone(ctx) { /* facilitator moves on manually */ },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it ? esc(it.answer) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "Dictionary closed.");
      const subs = ctx.targets.filter(t => (st.subs[t.id] || "").trim()).length;
      return `<div class="stage">${K.head(ctx, `Fake Definitions · ${it.category} · ${K.stars(it.difficulty)} · ${st.phase}`)}
        <div class="prompt gib" style="letter-spacing:.02em">${esc(it.text)}</div>
        <div class="row" style="gap:14px;align-items:flex-start;margin-top:6px">${UI.ring("round")}<div class="stack" style="flex:1;gap:6px"><div class="private"><span class="eyebrow">Private · real definition</span><div class="ans" style="font-size:16px">${esc(it.answer)}</div>${it.hint ? `<div class="small muted" style="margin-top:4px">Hint: ${esc(it.hint)}</div>` : ""}</div>
          <div class="ctl-row"><button class="btn ${st.phase === "write" ? "" : "ghost"}" data-act="startWriting">${UI.icon("play")} Writing ${s.writeSeconds}s</button><button class="btn ${st.phase === "write" && subs ? "blue" : "ghost"}" data-act="show" ${subs || (s.useDecoys && it.decoys && it.decoys.length) ? "" : "disabled"}>${UI.icon("screen")} Show definitions <span class="kbd">S</span></button><button class="btn green" data-act="reveal" ${st.board && !st.revealed ? "" : "disabled"}>${UI.icon("eye")} Reveal and score <span class="kbd">R</span></button></div>
          <div class="small muted">Teams write one convincing fake definition and send it to you by private chat. Paste each below. ${s.useDecoys ? "Built-in decoys fill the board if fewer than " + s.minDefs + " arrive." : ""}</div></div></div>
        <div class="grid cols-2" style="margin-top:10px">${ctx.targets.map(t => `<div class="field"><label for="bd-${t.id}" style="color:${t.color}">${esc(t.name)}'s fake</label><textarea class="input sm" id="bd-${t.id}" rows="2" data-bd-team="${t.id}" placeholder="Paste their definition…" ${st.board ? "disabled" : ""}>${esc(st.subs[t.id] || "")}</textarea></div>`).join("")}</div>
        ${st.board ? `<div class="eyebrow" style="margin-top:12px">Board (shown anonymously) · record each team's pick</div><ol class="list-ranked" style="margin-top:8px">${st.board.map((e, i) => `<li><span class="n">${i + 1}</span><span style="flex:1">${esc(e.text)}${st.revealed ? ` <span class="${e.real ? "gold" : "dim"} small">· ${e.real ? "REAL" : e.decoy ? "decoy" : "by " + esc((ctx.targets.find(t => t.id === e.teamId) || {}).name || "?")}</span>` : ""}</span><span class="btn-row" style="flex-wrap:nowrap">${ctx.targets.filter(t => t.id !== e.teamId).map(t => `<button class="btn xs ${st.picks[t.id] === i ? "team" : "ghost"}" style="--tc:${t.color}" data-act="pick" data-arg='${JSON.stringify({ id: t.id, n: i })}' ${st.revealed ? "disabled" : ""} title="${esc(t.name)} picks #${i + 1}">${esc(t.name.slice(0, 12))}</button>`).join("")}</span></li>`).join("")}</ol>` : ""}
        ${K.nav(ctx, { timer: false, reveal: false })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Fake Definitions" }, { type: "title", text: "Dictionary closed. You all sounded very convincing." }];
      const b = [{ type: "eyebrow", text: `Fake Definitions · ${st.index + 1} of ${st.items.length} · ${it.category}` }, { type: "prompt", text: it.text, cls: "gib" }];
      if (st.phase === "write") b.push({ type: "text", text: "Write the most convincing definition you can invent and send it privately to the facilitator." }, K.pTimer());
      else if (st.board) {
        b.push({ type: "list", items: st.board.map(e => e.text + (st.revealed ? (e.real ? "  ✓ REAL" : e.decoy ? "" : "  (" + ((ctx.targets.find(t => t.id === e.teamId) || {}).name || "") + ")") : "")), numbered: true });
        if (st.revealed) b.push({ type: "answer", text: "Real: " + it.answer });
        else b.push({ type: "text", text: "Which one is real? Teams, send your number." }, K.pTimer());
      }
      return b;
    },
  });
  document.addEventListener("change", e => { const el = e.target; if (el.dataset.bdTeam) TCL.Runner.act("setSub", JSON.stringify({ id: el.dataset.bdTeam, text: el.value })); });
})();
