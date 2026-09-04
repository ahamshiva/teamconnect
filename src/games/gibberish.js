/* src/games/gibberish.js  Guess the Gibberish. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("gibberish", { secondsKey: "seconds", timerLabel: "Decode", onEnter: ctx => { ctx.state.wrong = []; K.turnStart(ctx); if (ctx.settings.autoStart) ctx.timer.start(ctx.settings.seconds * 1000, "Decode", 10000); else ctx.timer.stop(); } });
  TCL.Games.register({
    id: "gibberish", name: "Guess the Gibberish", tagline: "Say the syllables fast until the phrase appears.", category: "Energy",
    description: "Nonsense syllables hide a real phrase. Teams chant them faster and faster until someone hears it. Points scale with difficulty.",
    icon: UI.icons.sound, contentGame: "gibberish", flexKey: "count",
    defaultSettings: { count: 8, seconds: 45, categories: [], difficultyMin: 2, difficultyMax: 3, order: "progressive", pointsByDifficulty: true, pointsEasy: 10, pointsMedium: 15, pointsHard: 20, points: 10, mercy: 5, stealing: true, answerOrder: "turns", passPercent: 50, passLimit: 2, speedBonus: true, speedBonusPoints: 5, speedBonusMode: "tiered", autoReveal: false, autoStart: true, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of puzzles", 1, 40), f.seconds("seconds", "Time per puzzle", 15, 120), f.answerOrder(), f.passPercent(), f.passLimit(), f.toggle("speedBonus", "Bonus points for answering quickly"), f.number("speedBonusPoints", "Speed bonus points", 0, 50), f.speedBonusMode(), f.categories("gibberish"), f.diffMin(), f.diffMax(), f.order(), f.toggle("pointsByDifficulty", "Points by difficulty"), f.number("pointsEasy", "★ points", 0, 100), f.number("pointsMedium", "★★ points", 0, 100), f.number("pointsHard", "★★★ points", 0, 100), f.number("points", "Fixed points (when not by difficulty)", 0, 100), f.number("mercy", "Mercy points for nearly right", 0, 50), f.toggle("stealing", "Allow stealing after a wrong shout"), f.toggle("autoStart", "Start the clock automatically"), f.reveal(), f.unused()].concat(K.common()),
    summary(s) { return `${s.count} puzzles × ${s.seconds}s, ${s.order === "progressive" ? "easy to brutal" : "random order"}`; },
    estimateMinutes(s) { return K.est(s.count, s.seconds, 15); },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, categories: s.categories, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} puzzles match; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "gibberish", ctx.settings.count); st.wrong = []; ctx.state = st; K.turnStart(ctx); if (ctx.settings.autoStart && st.items.length) ctx.timer.start(ctx.settings.seconds * 1000, "Decode", 10000); return st; },
    actions: Object.assign({}, deck, {
      correct(ctx, id) {
        const st = ctx.state;
        ctx.score(id, K.turnValue(ctx, K.pointsFor(ctx.settings, K.current(st))), "correct", st.index);
        if (!st.passed) K.awardSpeedBonus(ctx, id, st.index);
        st.revealed = true; ctx.timer.pause();
      },
      mercy(ctx, id) { ctx.score(id, ctx.settings.mercy, "mercy", ctx.state.index); },
      wrong(ctx, id) {
        const st = ctx.state;
        st.wrong.push(id);
        if (K.turnsOn(ctx.settings)) { if (!K.turnPass(ctx)) { st.revealed = true; ctx.timer.pause(); } return; }
        if (!ctx.settings.stealing) { st.revealed = true; ctx.timer.pause(); }
      },
      pass(ctx) { const st = ctx.state; if (!K.turnPass(ctx)) { st.revealed = true; ctx.timer.pause(); } },
    }),
    actionLabels: { correct: "Correct", mercy: "Mercy points", wrong: "Wrong shout", pass: "Passed to the next team" },
    hotkeys: { r: "reveal", n: "next", p: "pass" },
    onTimerDone(ctx) { if (ctx.settings.autoReveal) ctx.state.revealed = true; },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it && !ctx.state.revealed ? esc(it.answer) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "No more gibberish.");
      const pts = K.pointsFor(s, it);
      const only = K.turnOnly(ctx);
      const worth = K.turnValue(ctx, pts);
      return `<div class="stage">${K.head(ctx, `${it.category} · ${K.stars(it.difficulty)} · worth ${worth}`, K.speedChip(ctx))}
        ${K.turnBanner(ctx, worth)}
        <div class="prompt gib">${esc(it.text)}</div>
        <div class="row">${UI.ring("round")}<div class="stack" style="gap:6px"><div class="private"><span class="eyebrow">Private · answer</span><div class="ans">${esc(it.answer)}</div></div>${st.revealed ? `<div class="answer-box">Revealed</div>` : ""}</div></div>
        ${ctx.scoringEnabled ? (only
          ? `<div style="margin-top:10px"><div class="eyebrow" style="margin-bottom:6px">${esc(only.name)} answers</div><div class="award-grid">${UI.awardButtons([only], "correct", worth, { done: id => ctx.scored(id, "correct", st.index) })}</div>
             <div class="btn-row" style="margin-top:8px"><button class="btn ghost" data-act="pass">${UI.icon("next")} No answer, pass it on <span class="kbd">P</span></button><button class="btn ghost" data-act="wrong" data-arg="${only.id}">Wrong, pass it on</button></div></div>${s.mercy ? K.awardRow(ctx, "mercy", s.mercy, { label: "Nearly right (mercy)", reason: "mercy", allowRepeat: true }) : ""}`
          : `${K.awardRow(ctx, "correct", worth, { label: "Cracked it", reason: "correct", exclude: st.wrong })}${s.mercy ? K.awardRow(ctx, "mercy", s.mercy, { label: "Nearly right (mercy)", reason: "mercy", allowRepeat: true }) : ""}`) : ""}
        ${K.nav(ctx)}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Guess the Gibberish" }, { type: "title", text: "That is all the gibberish for today." }];
      const worth = K.turnValue(ctx, K.pointsFor(s, it));
      const b = [{ type: "eyebrow", text: `Guess the Gibberish · ${st.index + 1} of ${st.items.length} · ${K.stars(it.difficulty)} · ${worth} pts` }];
      const turn = K.turnPresentation(ctx, worth);
      if (turn) b.push(turn);
      b.push({ type: "prompt", text: it.text, cls: "gib" }, { type: "text", text: "Say it out loud, faster and faster." });
      if (st.revealed) b.push({ type: "answer", text: it.answer });
      b.push(K.pTimer());
      return b;
    },
  });
})();
