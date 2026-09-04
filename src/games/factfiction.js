/* src/games/factfiction.js  Fact or Fiction: teams vote true or false, then hear the real story. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("factfiction", { secondsKey: "seconds", timerLabel: "Vote", onEnter: ctx => { ctx.state.votes = {}; ctx.state.revealed = false; if (ctx.settings.autoStart) ctx.timer.start(ctx.settings.seconds * 1000, "Vote", 5000); else ctx.timer.stop(); } });
  function isTrue(it) { return it.truth === true || String(it.truth).toLowerCase() === "true"; }
  TCL.Games.register({
    id: "factfiction", name: "Fact or Fiction", tagline: "Vote true or false. Then hear the real story.", category: "Quiz",
    description: "A statement appears: wombats produce cube-shaped droppings, the Great Wall is visible from the Moon. Teams commit to true or false, then the facilitator reads the real story. Streaks earn a bonus.",
    icon: UI.icons.info, contentGame: "factfiction", flexKey: "count",
    defaultSettings: { count: 10, seconds: 25, categories: [], difficultyMin: 2, difficultyMax: 3, order: "random", points: 10, streakBonus: 5, streakLength: 3, autoStart: true, autoReveal: false, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of statements", 1, 40), f.seconds("seconds", "Time to commit", 10, 90), f.categories("factfiction"), f.diffMin(), f.diffMax(), f.order(), f.number("points", "Points for a correct call", 0, 50), f.number("streakBonus", "Streak bonus", 0, 50), f.count("streakLength", "Correct calls in a row for the bonus", 2, 6), f.toggle("autoStart", "Start the clock automatically"), f.reveal(), f.unused()].concat(K.common()),
    summary(s) { return `${s.count} statements × ${s.seconds}s + the real story`; },
    estimateMinutes(s) { return K.est(s.count, s.seconds + 25, 10); },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} statements match; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "factfiction", ctx.settings.count); st.votes = {}; st.streak = {}; if (ctx.settings.autoStart && st.items.length) ctx.timer.start(ctx.settings.seconds * 1000, "Vote", 5000); return st; },
    actions: Object.assign({}, deck, {
      vote(ctx, arg) { const a = K.arg(arg); if (ctx.state.revealed) return; ctx.state.votes[a.id] = a.v === true || a.v === "true"; },
      reveal(ctx) {
        const st = ctx.state, s = ctx.settings, it = K.current(st);
        if (st.revealed) return;
        st.revealed = true; ctx.timer.pause();
        const truth = isTrue(it);
        ctx.targets.forEach(t => {
          if (!(t.id in st.votes)) { st.streak[t.id] = 0; return; }
          if (st.votes[t.id] === truth) {
            ctx.score(t.id, s.points, "correct call", st.index);
            st.streak[t.id] = (st.streak[t.id] || 0) + 1;
            if (s.streakBonus && s.streakLength && st.streak[t.id] % s.streakLength === 0) ctx.score(t.id, s.streakBonus, `streak of ${s.streakLength}`, st.index);
          } else st.streak[t.id] = 0;
        });
      },
    }),
    actionLabels: { vote: "Record vote", reveal: "Reveal and score" },
    hotkeys: { r: "reveal", n: "next" },
    onTimerDone(ctx) { if (ctx.settings.autoReveal) this.actions.reveal(ctx); },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it && !ctx.state.revealed ? (isTrue(it) ? "TRUE" : "FALSE") + " · " + esc(it.explain) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "No more statements.");
      const truth = isTrue(it);
      return `<div class="stage">${K.head(ctx, `Fact or Fiction · ${it.category} · ${K.stars(it.difficulty)}`)}
        <div class="prompt">${esc(it.text)}</div>
        <div class="row" style="margin-top:6px">${UI.ring("round")}<div class="stack" style="gap:6px"><div class="private"><span class="eyebrow">Private · verdict</span><div class="ans">${truth ? "TRUE" : "FALSE"}</div><div class="small" style="margin-top:4px">${esc(String(it.explain).replace(/^(True|False)\.\s*/, ""))}</div></div>${st.revealed ? `<div class="answer-box">Revealed and scored</div>` : ""}</div></div>
        <div class="eyebrow" style="margin-top:12px">Each team's call (ask them to commit before the clock dies)</div>
        <div class="grid cols-3" style="margin-top:8px">${ctx.targets.map(t => { const v = st.votes[t.id]; const right = st.revealed && v != null && v === truth; const wrong = st.revealed && v != null && v !== truth; return `<div class="card" style="padding:12px;border-top:3px solid ${t.color}"><div class="row between"><b>${esc(t.name)}</b>${st.streak[t.id] >= 2 ? `<span class="chip gold">🔥 ${st.streak[t.id]}</span>` : ""}</div><div class="btn-row" style="margin-top:8px"><button class="btn sm ${v === true ? "green" : "ghost"}" data-act="vote" data-arg='${JSON.stringify({ id: t.id, v: true })}' ${st.revealed ? "disabled" : ""}>True</button><button class="btn sm ${v === false ? "danger" : "ghost"}" data-act="vote" data-arg='${JSON.stringify({ id: t.id, v: false })}' ${st.revealed ? "disabled" : ""}>False</button>${right ? '<span class="chip ok"><span class="dot"></span>correct</span>' : wrong ? '<span class="chip bad"><span class="dot"></span>wrong</span>' : ""}</div></div>`; }).join("")}</div>
        ${K.nav(ctx)}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Fact or Fiction" }, { type: "title", text: "That is all the facts. And fictions." }];
      const b = [{ type: "eyebrow", text: `Fact or Fiction · ${st.index + 1} of ${st.items.length} · ${it.category}` }, { type: "prompt", text: it.text }];
      if (st.revealed) b.push({ type: "answer", text: isTrue(it) ? "TRUE" : "FALSE" }, { type: "text", text: String(it.explain).replace(/^(True|False)\.\s*/, "") });
      else { const voted = ctx.targets.filter(t => t.id in st.votes).map(t => t.name); b.push({ type: "text", text: "True or false? Teams, commit before the clock dies." + (voted.length ? ` Locked in: ${voted.join(", ")}.` : "") }); }
      b.push(K.pTimer());
      return b;
    },
  });
})();
