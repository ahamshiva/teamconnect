/* src/games/quiz.js  Rapid-Fire Quiz. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("quiz", { secondsKey: "seconds", timerLabel: "Answer", onEnter: ctx => { ctx.state.wrong = []; ctx.state.attempts = 0; K.turnStart(ctx); if (ctx.settings.autoStart) ctx.timer.start(ctx.settings.seconds * 1000, "Answer", 10000); else ctx.timer.stop(); } });
  TCL.Games.register({
    id: "quiz", name: "Rapid-Fire Quiz", tagline: "Fast questions, shout the answer.", category: "Quiz",
    description: "Questions on a shot clock. Multiple choice or open answer. Teams take turns by default and a miss passes the question on for fewer points; quick answers earn a bonus.",
    icon: UI.icons.flag, contentGame: "quiz", flexKey: "count",
    defaultSettings: { count: 10, seconds: 30, categories: [], difficultyMin: 2, difficultyMax: 3, order: "random", format: "mc", pointsByDifficulty: false, points: 10, pointsEasy: 10, pointsMedium: 15, pointsHard: 20, answerOrder: "turns", passPercent: 50, passLimit: 2, speedBonus: true, speedBonusPoints: 5, speedBonusMode: "tiered", negative: false, negativePoints: 5, stealing: true, attempts: "one", autoReveal: false, autoStart: true, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of questions", 1, 50), f.seconds("seconds", "Time per question", 10, 120), f.categories("quiz"), f.diffMin(), f.diffMax(), f.order(), f.select("format", "Format", [{ value: "mc", label: "Multiple choice" }, { value: "open", label: "Open answer" }]),
      f.answerOrder(), f.passPercent(), f.passLimit(), f.toggle("pointsByDifficulty", "Points by difficulty"), f.number("points", "Fixed points", 0, 100), f.number("pointsEasy", "★ points", 0, 100), f.number("pointsMedium", "★★ points", 0, 100), f.number("pointsHard", "★★★ points", 0, 100), f.toggle("speedBonus", "Bonus points for answering quickly"), f.number("speedBonusPoints", "Speed bonus points", 0, 50), f.speedBonusMode(),
      f.toggle("negative", "Negative marking for wrong answers"), f.number("negativePoints", "Points deducted", 0, 50), f.toggle("stealing", "Allow stealing after a wrong answer"), f.select("attempts", "Attempts per team", [{ value: "one", label: "One attempt" }, { value: "many", label: "Multiple attempts" }]), f.toggle("autoStart", "Start the clock automatically on each question"), f.reveal(), f.unused()].concat(K.common()),
    summary(s) { return `${s.count} questions × ${s.seconds}s, ${s.format === "mc" ? "multiple choice" : "open answer"}`; },
    estimateMinutes(s) { return K.est(s.count, s.seconds, 15); },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} questions match the filters; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "quiz", ctx.settings.count); st.wrong = []; st.attempts = 0; ctx.state = st; K.turnStart(ctx); if (ctx.settings.autoStart && st.items.length) ctx.timer.start(ctx.settings.seconds * 1000, "Answer", 10000); return st; },
    actions: Object.assign({}, deck, {
      correct(ctx, id) {
        const st = ctx.state, s = ctx.settings, it = K.current(st);
        const pts = K.turnValue(ctx, K.pointsFor(s, it));
        ctx.score(id, pts, "correct", st.index);
        if (!st.passed) K.awardSpeedBonus(ctx, id, st.index);
        st.revealed = true; ctx.timer.pause();
      },
      wrong(ctx, id) {
        const st = ctx.state, s = ctx.settings;
        st.wrong.push(id);
        if (s.negative && s.negativePoints) ctx.score(id, -s.negativePoints, "wrong answer", st.index);
        if (K.turnsOn(s)) { const nextTeam = K.turnPass(ctx); if (!nextTeam) { st.revealed = true; ctx.timer.pause(); } return; }
        if (!s.stealing) { st.revealed = true; ctx.timer.pause(); }
      },
      /* Nobody on the spot answered: pass it along without marking them wrong. */
      pass(ctx) { const st = ctx.state; const nextTeam = K.turnPass(ctx); if (!nextTeam) { st.revealed = true; ctx.timer.pause(); } },
    }),
    actionLabels: { correct: "Correct answer", wrong: "Wrong answer", pass: "Passed to the next team" },
    hotkeys: { r: "reveal", n: "next", p: "pass", "1": { action: "correct", arg: 0 }, "2": { action: "correct", arg: 1 }, "3": { action: "correct", arg: 2 }, "4": { action: "correct", arg: 3 } },
    onTimerDone(ctx) { if (ctx.settings.autoReveal) ctx.state.revealed = true; },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it && !ctx.state.revealed ? esc(it.answer) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "Quiz over.");
      const pts = K.pointsFor(s, it);
      const mc = s.format === "mc" && Array.isArray(it.options) && it.options.length;
      const targets = ctx.targets.map((t, i) => Object.assign({}, t, { hot: i }));
      const doneTeams = ctx.targets.filter(t => ctx.scored(t.id, "correct", st.index)).map(t => t.id);
      const excluded = s.attempts === "one" ? st.wrong.filter(id => !doneTeams.includes(id)) : [];
      const only = K.turnOnly(ctx);
      const worth = K.turnValue(ctx, pts);
      return `<div class="stage">${K.head(ctx, `${it.category || "Quiz"} · ${K.stars(it.difficulty)} · worth ${worth}`, K.speedChip(ctx))}
        ${K.turnBanner(ctx, worth)}
        <div class="prompt ${it.text.length > 90 ? "sm" : ""}">${esc(it.text)}</div>
        ${mc ? `<div class="options">${it.options.map((o, i) => `<div class="opt ${st.revealed && i === it.correctIndex ? "correct" : ""}"><b>${String.fromCharCode(65 + i)}</b> · ${esc(o)}</div>`).join("")}</div>` : ""}
        <div class="row">${UI.ring("round")}<div class="stack" style="gap:6px"><div class="private"><span class="eyebrow">Private · answer</span><div class="ans">${esc(it.answer)}${mc ? ` (${String.fromCharCode(65 + (it.correctIndex || 0))})` : ""}</div>${it.note ? `<div class="small muted" style="margin-top:4px">${esc(it.note)}</div>` : ""}</div>${st.revealed ? `<div class="answer-box">Revealed to participants</div>` : ""}</div></div>
        ${ctx.scoringEnabled ? (only
          ? `<div style="margin-top:10px"><div class="eyebrow" style="margin-bottom:6px">${esc(only.name)} answers</div>
              <div class="award-grid">${UI.awardButtons([only], "correct", worth, { done: id => ctx.scored(id, "correct", st.index) })}</div>
              <div class="btn-row" style="margin-top:8px"><button class="btn ghost" data-act="pass">${UI.icon("next")} No answer, pass it on <span class="kbd">P</span></button><button class="btn ghost" data-act="wrong" data-arg="${only.id}">Wrong${s.negative ? ` (−${s.negativePoints})` : ""}, pass it on</button></div></div>`
          : `<div style="margin-top:10px"><div class="eyebrow" style="margin-bottom:6px">Correct answer from… (keys 1 to ${Math.min(4, ctx.targets.length)})</div>${UI.awardButtons(ctx.targets, "correct", worth, { exclude: excluded, done: id => ctx.scored(id, "correct", st.index) })}</div>
        <div style="margin-top:8px"><div class="eyebrow" style="margin-bottom:6px">Wrong answer${s.negative ? ` (−${s.negativePoints})` : ""}${s.stealing ? " · others may steal" : ""}</div><div class="award-grid">${ctx.targets.map(t => `<button class="btn ghost sm" data-act="wrong" data-arg="${t.id}" ${st.wrong.includes(t.id) && s.attempts === "one" ? "disabled" : ""}>${st.wrong.includes(t.id) ? "✗ " : ""}${esc(t.name)}</button>`).join("")}</div></div>`) : ""}
        ${K.nav(ctx)}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Rapid-Fire Quiz" }, { type: "title", text: "Quiz over. Pens down." }];
      const mc = s.format === "mc" && Array.isArray(it.options) && it.options.length;
      const worth = K.turnValue(ctx, K.pointsFor(s, it));
      const bonus = K.speedBonus(ctx);
      const b = [{ type: "eyebrow", text: `${it.category || "Quiz"} · question ${st.index + 1} of ${st.items.length} · ${K.stars(it.difficulty)} · ${worth} pts` }];
      const turn = K.turnPresentation(ctx, worth);
      if (turn) b.push(turn);
      b.push({ type: "prompt", text: it.text });
      if (!st.revealed && bonus.points > 0 && !st.passed) b.push({ type: "text", text: `Answer in the next ${Math.max(1, Math.ceil(bonus.nextAt / 1000))} seconds for +${bonus.points}` });
      if (mc) b.push({ type: "options", items: it.options, correct: st.revealed ? it.correctIndex : -1 });
      if (st.revealed) b.push({ type: "answer", text: it.answer });
      b.push(K.pTimer());
      return b;
    },
  });
  /* Map hotkeys 1..4 (team index) to team ids */
  const orig = TCL.Runner.act;
  TCL.Runner.act = function (name, arg) { if (name === "correct" && typeof arg === "number") { const a = TCL.Runner.current(); const ctx = a && TCL.Runner.ctx(a); if (!ctx || !ctx.targets[arg]) return; arg = ctx.targets[arg].id; } return orig.call(this, name, arg); };
})();
