/* src/activities/rankit.js  Rank It Together. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("rankit", { secondsKey: "seconds", timerLabel: "Discussion", onEnter: ctx => { ctx.state.orders = {}; ctx.state.revealed = false; ctx.state.votes = {}; ctx.timer.stop(); } });
  function scoreOrder(items, answer, order, mode) {
    if (!answer || !order.length) return 0;
    if (mode === "exact") return order.filter((x, i) => answer[i] === x).length;
    /* similarity: n*(n-1)/2 minus sum of position differences, floored at 0 */
    const n = answer.length; const total = order.reduce((s, x, i) => s + Math.abs(answer.indexOf(x) - i), 0);
    return Math.max(0, Math.round(n * 2 - total));
  }
  TCL.Games.register({
    id: "rankit", name: "Rank It Together", tagline: "Agree on an order. Then find out the truth.", category: "Quiz",
    description: "Teams agree on how to rank a list, in breakout rooms or the main room. Objective scenarios are scored against the real order; opinion scenarios are voted on.",
    icon: UI.icons.builder, contentGame: "rankit", flexKey: "count", modes: ["teams"], needsBreakout: s => s.room === "breakout",
    defaultSettings: { count: 3, seconds: 120, room: "main", categories: [], difficultyMin: 1, difficultyMax: 3, scoring: "exact", pointsPerCorrect: 5, votePoints: 10, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of scenarios", 1, 10), f.seconds("seconds", "Discussion time", 30, 600, 30), f.select("room", "Where teams discuss", [{ value: "main", label: "Main room (teams whisper in chat)" }, { value: "breakout", label: "Breakout rooms" }]), f.categories("rankit"), f.diffMin(), f.diffMax(), f.select("scoring", "Scoring", [{ value: "exact", label: "Exact position (points per correct slot)" }, { value: "similarity", label: "Similarity (closer order = more points)" }, { value: "vote", label: "Voting (best argued order)" }, { value: "none", label: "No scoring" }]), f.number("pointsPerCorrect", "Points per correct position", 0, 20), f.number("votePoints", "Points for winning the vote", 0, 50), f.unused()].concat(K.common()),
    summary(s, ctx) { return `${s.count} scenarios × ${U.fmtMin(s.seconds / 60)} discussion + entry and reveal`; },
    estimateMinutes(s, ctx) { return K.est(s.count, s.seconds + ctx.teams * 25 + 40, 20) + (s.room === "breakout" ? s.count * 1.5 : 0); },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} scenarios match; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "rankit", ctx.settings.count); st.orders = {}; st.votes = {}; return st; },
    actions: Object.assign({}, deck, {
      startTimer(ctx) { const s = ctx.settings; if (s.room === "breakout") ctx.breakout.start(s.seconds * 1000, "Breakout", 30000); else ctx.timer.start(s.seconds * 1000, "Discussion", 15000); },
      pickItem(ctx, arg) { const a = K.arg(arg); const st = ctx.state; const o = st.orders[a.id] = st.orders[a.id] || []; if (!o.includes(a.item)) o.push(a.item); },
      clearOrder(ctx, id) { ctx.state.orders[id] = []; },
      reveal(ctx) { ctx.state.revealed = true; ctx.timer.pause(); ctx.breakout.stop(); },
      scoreAll(ctx) {
        const st = ctx.state, s = ctx.settings, it = K.current(st);
        if (!it.answer || (s.scoring !== "exact" && s.scoring !== "similarity")) return;
        ctx.targets.forEach(t => { const o = st.orders[t.id] || []; if (!o.length || ctx.scored(t.id, "ranking", st.index)) return; const raw = scoreOrder(it.items, it.answer, o, s.scoring); const pts = s.scoring === "exact" ? raw * s.pointsPerCorrect : raw; if (pts) ctx.score(t.id, pts, "ranking", st.index); });
        st.revealed = true;
      },
      voteWin(ctx, id) { ctx.score(id, ctx.settings.votePoints, "vote", ctx.state.index); },
    }),
    noUndo: ["pickItem"],
    hotkeys: { n: "next", r: "reveal" },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it && it.answer && !ctx.state.revealed ? it.answer.map((x, i) => `${i + 1}. ${esc(x)}`).join("<br>") : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "All rankings done.");
      const objective = it.mode === "objective" && Array.isArray(it.answer) && it.answer.length;
      return `<div class="stage">${K.head(ctx, `Rank It Together · ${it.category} · ${objective ? "objective" : "opinion"}`)}
        <div class="prompt sm">${esc(it.text)}</div>
        <div class="row" style="margin-top:6px;gap:6px">${it.items.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>
        <div class="row" style="margin-top:8px">${UI.ring(s.room === "breakout" ? "breakout" : "round")}<div class="ctl-row"><button class="btn ghost" data-act="startTimer">${UI.icon("clock")} ${s.room === "breakout" ? "Start breakout timer" : "Start discussion"} (${U.fmtMs(s.seconds * 1000)})</button>${objective ? `<button class="btn green" data-act="reveal" ${st.revealed ? "disabled" : ""}>${UI.icon("eye")} Reveal true order</button>` : ""}</div></div>
        ${s.room === "breakout" ? K.copyBox("rk-msg", `RANK IT · ${U.fmtMs(s.seconds * 1000)} in your breakout room\n${it.text}\nItems: ${it.items.join(", ")}\nAgree on an order as a team and have your spokesperson ready when you return.`, "Zoom broadcast message") : ""}
        <div class="eyebrow" style="margin-top:14px">Enter each team's order (click items in order)</div>
        <div class="grid cols-2" style="margin-top:8px">${ctx.targets.map(t => { const o = st.orders[t.id] || []; return `<div class="card" style="border-top:3px solid ${t.color};padding:12px"><div class="row between"><b>${esc(t.name)}</b><button class="btn xs ghost" data-act="clearOrder" data-arg="${t.id}">Clear</button></div><ol class="list-ranked" style="margin:8px 0">${o.map((x, i) => `<li><span class="n">${i + 1}</span>${esc(x)}${st.revealed && objective ? (it.answer[i] === x ? ' <span class="gold">✓</span>' : "") : ""}</li>`).join("")}</ol><div class="row" style="gap:6px">${it.items.filter(x => !o.includes(x)).map(x => `<button class="btn xs ghost" data-act="pickItem" data-arg='${JSON.stringify({ id: t.id, item: x })}'>${esc(x)}</button>`).join("")}</div>${st.revealed && objective && o.length ? `<div class="small gold" style="margin-top:6px">${s.scoring === "exact" ? scoreOrder(it.items, it.answer, o, "exact") + " correct positions" : s.scoring === "similarity" ? scoreOrder(it.items, it.answer, o, "similarity") + " similarity points" : ""}</div>` : ""}</div>`; }).join("")}</div>
        ${objective && (s.scoring === "exact" || s.scoring === "similarity") && ctx.scoringEnabled ? `<div class="ctl-row" style="margin-top:12px"><button class="btn" data-act="scoreAll">${UI.icon("trophy")} Reveal and score all teams</button></div>` : ""}
        ${s.scoring === "vote" && ctx.scoringEnabled ? K.awardRow(ctx, "voteWin", s.votePoints, { label: "Winning order by vote", reason: "vote" }) : ""}
        ${it.note ? `<div class="private" style="margin-top:10px"><span class="eyebrow">Private note</span><div class="small">${esc(it.note)}</div></div>` : ""}
        ${K.nav(ctx, { timer: false, reveal: false })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Rank It Together" }, { type: "title", text: "All ranked. Well argued." }];
      const b = [{ type: "eyebrow", text: `Rank It Together · ${st.index + 1} of ${st.items.length}` }, { type: "prompt", text: it.text }];
      if (st.revealed && it.answer) b.push({ type: "list", items: it.answer, numbered: true }, { type: "answer", text: "The true order" });
      else b.push({ type: "list", items: it.items }, { type: "text", text: s.room === "breakout" ? "Agree on an order in your breakout room." : "Teams: agree on an order and tell the facilitator." });
      b.push(K.pTimer(s.room === "breakout" ? "breakout" : "round"));
      return b;
    },
  });
})();
