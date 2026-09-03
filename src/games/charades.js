/* src/games/charades.js  Reverse Charades: the guesser looks away, the team acts. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  function turnInfo(ctx) {
    const st = ctx.state; const team = ctx.targets[st.turn % ctx.targets.length];
    return { team, guesser: st.guesser ? ctx.name(st.guesser) : "anyone" };
  }
  TCL.Games.register({
    id: "charades", name: "Reverse Charades", tagline: "One guesser looks away. The whole team acts.", category: "Energy",
    description: "Each turn one team member is the guesser and looks away while the word shows for a few seconds. The rest of the team acts it out on camera together.",
    icon: UI.icons.play, contentGame: "charades", flexKey: "turns", modes: ["teams"],
    defaultSettings: { turns: 6, seconds: 75, peekSeconds: 4, categories: [], difficultyMin: 1, difficultyMax: 3, passLimit: 3, passPenalty: false, passPenaltyPoints: 2, points: 5, hideAfterPeek: true, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("turns", "Number of turns", 1, 30), f.seconds("seconds", "Turn duration", 30, 180, 15), f.seconds("peekSeconds", "Word peek duration", 2, 10, 1), f.categories("charades"), f.diffMin(), f.diffMax(), f.count("passLimit", "Pass limit per turn (0 = unlimited)", 0, 10), f.toggle("passPenalty", "Penalty for passing"), f.number("passPenaltyPoints", "Points lost per pass", 0, 20), f.number("points", "Points per correct word", 0, 50), f.toggle("hideAfterPeek", "Hide the word after the peek (shared-screen mode)"), f.unused()].concat(K.common()),
    summary(s, ctx) { return `${s.turns} turns × ${s.seconds}s, ${s.points} pts per word`; },
    estimateMinutes(s) { return K.est(s.turns, s.seconds, 25); },
    validate(s, ctx) { const out = []; if (ctx.teams.length && ctx.teams.every(t => t.memberIds.filter(id => ctx.participants.some(p => p.id === id)).length < 2)) out.push({ level: "warn", message: "Teams need at least 2 present members (a guesser and someone to act)." }); return out; },
    init(ctx) {
      const s = ctx.settings;
      const st = K.deckInit(ctx, "charades", Math.max(20, s.turns * 6));
      st.turn = 0; st.phase = "idle"; st.passes = 0; st.wordIdx = 0; st.peekUntil = 0; st.guesser = null; st.correctThisTurn = 0;
      return st;
    },
    actions: {
      startTurn(ctx) { const st = ctx.state, s = ctx.settings; const team = ctx.targets[st.turn % ctx.targets.length]; const g = team.team ? ctx.rotateTeam(team.team, "guesser", true) : null; st.guesser = g ? g.id : null; st.phase = "play"; st.passes = 0; st.correctThisTurn = 0; st.peekUntil = Date.now() + s.peekSeconds * 1000; ctx.timer.start(s.seconds * 1000, "Turn", 15000); },
      correct(ctx) { const st = ctx.state, s = ctx.settings; if (st.phase !== "play") return; const team = ctx.targets[st.turn % ctx.targets.length]; ctx.score(team.id, s.points, "word", st.turn * 1000 + st.wordIdx); st.correctThisTurn += 1; st.wordIdx += 1; st.peekUntil = Date.now() + s.peekSeconds * 1000; if (st.wordIdx >= st.items.length) { const it = K.freshItem(ctx, "charades"); if (it) st.items.push(it); else st.wordIdx = 0; } },
      pass(ctx) { const st = ctx.state, s = ctx.settings; if (st.phase !== "play") return; if (s.passLimit && st.passes >= s.passLimit) { TCL.emit("ui:toast", { text: "Pass limit reached for this turn.", kind: "warn" }); return; } st.passes += 1; if (s.passPenalty && s.passPenaltyPoints) { const team = ctx.targets[st.turn % ctx.targets.length]; ctx.score(team.id, -s.passPenaltyPoints, "pass", st.turn * 1000 + st.wordIdx); } st.wordIdx += 1; st.peekUntil = Date.now() + s.peekSeconds * 1000; if (st.wordIdx >= st.items.length) { const it = K.freshItem(ctx, "charades"); if (it) st.items.push(it); else st.wordIdx = 0; } },
      peekAgain(ctx) { ctx.state.peekUntil = Date.now() + ctx.settings.peekSeconds * 1000; },
      endTurn(ctx) { const st = ctx.state; ctx.timer.stop(); st.phase = "idle"; st.turn += 1; if (st.turn >= ctx.settings.turns) st.finished = true; },
      reopen(ctx) { ctx.state.finished = false; },
      restartTurn(ctx) { const st = ctx.state; st.phase = "idle"; ctx.timer.stop(); },
      replace(ctx) { const st = ctx.state; const it = K.freshItem(ctx, "charades"); if (it) { st.items[st.wordIdx] = it; st.peekUntil = Date.now() + ctx.settings.peekSeconds * 1000; } },
    },
    actionLabels: { correct: "Word guessed", pass: "Pass", startTurn: "Start turn", endTurn: "End turn" },
    hotkeys: { c: "correct", p: "pass", s: "startTurn" },
    onTimerDone(ctx) { this.actions.endTurn(ctx); },
    isComplete: ctx => !!ctx.state.finished,
    privateNote(ctx) { const st = ctx.state; const it = st.items[st.wordIdx]; return st.phase === "play" && it ? esc(it.text) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.finished) return K.finished(ctx, "All turns played.");
      const { team, guesser } = turnInfo(ctx);
      const it = st.items[st.wordIdx];
      const peeking = Date.now() < st.peekUntil;
      return `<div class="stage"><div class="row between"><span class="eyebrow gold">Reverse Charades · turn ${st.turn + 1} of ${s.turns}</span><span class="chip mono">${U.plural(st.correctThisTurn, "word")} this turn · ${st.passes}/${s.passLimit || "∞"} passes</span></div>
        ${K.banner([{ text: "Team:" }, { text: team.name, strong: true }, { text: "· guesser (looks away):" }, { text: st.phase === "play" ? guesser : "chosen at start", strong: true }], team.color)}
        ${st.phase === "play" && it ? `<div class="prompt">${esc(it.text)}</div><div class="small muted">${esc(it.category)} · ${U.plural(U.words(it.text).length, "word")} · ${peeking ? "showing on the presentation" : s.hideAfterPeek ? "hidden on the presentation" : "visible on the presentation"}</div>` : `<div class="prompt sm muted">Press Start turn. The first word appears for ${s.peekSeconds} seconds, then hides.</div>`}
        <div class="row" style="margin-top:8px">${UI.ring("round")}<div class="ctl-row">${st.phase === "play" ? `<button class="btn green big" data-act="correct">${UI.icon("check")} Got it +${s.points} <span class="kbd">C</span></button><button class="btn ghost big" data-act="pass">↷ Pass <span class="kbd">P</span></button><button class="btn ghost" data-act="peekAgain">${UI.icon("eye")} Peek again</button><button class="btn subtle" data-act="replace">${UI.icon("shuffle")} Replace word</button><button class="btn subtle" data-act="endTurn">End turn early</button>` : `<button class="btn big" data-act="startTurn">${UI.icon("play")} Start turn (${s.seconds}s) <span class="kbd">S</span></button>`}</div></div>
        <div class="small muted" style="margin-top:10px">Rules: the guesser is the only one who looks away. The rest of the team acts together on camera: no words, no sounds, no typing in chat. ${s.passLimit ? `Up to ${s.passLimit} passes per turn.` : "Unlimited passes."}${s.passPenalty ? ` Each pass costs ${s.passPenaltyPoints}.` : ""}</div></div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.finished) return [{ type: "eyebrow", text: "Reverse Charades" }, { type: "title", text: "Curtain down. Take a bow." }];
      const { team, guesser } = turnInfo(ctx);
      const it = st.items[st.wordIdx];
      const b = [{ type: "eyebrow", text: `Reverse Charades · turn ${st.turn + 1} of ${s.turns}` }, K.pBanner([{ text: "Team:" }, { text: team.name, strong: true }, { text: "· Guesser looks away:" }, { text: st.phase === "play" ? guesser : "…", strong: true }], team.color)];
      if (st.phase === "play" && it) {
        const show = !s.hideAfterPeek || Date.now() < st.peekUntil;
        if (show) b.push({ type: "prompt", text: it.text }, { type: "text", text: `${it.category} · memorise it, then act it out together` });
        else b.push({ type: "mask", text: "🙈 ".repeat(Math.min(6, U.words(it.text).length)).trim() }, { type: "text", text: `${U.words(it.text).length} ${U.words(it.text).length === 1 ? "word" : "words"} · ${it.category}` });
      } else b.push({ type: "title", text: "Get ready" }, { type: "text", text: `${s.seconds} seconds per turn, ${s.points} points per word. Guesser, look away when the word appears.` });
      b.push(K.pTimer());
      return b;
    },
  });
  /* The peek expiry must re-push the presentation even without a state change */
  setInterval(() => { const a = TCL.Runner && TCL.Runner.current && TCL.Runner.current(); if (a && a.gameId === "charades" && a.status === "active" && a.state && a.state.phase === "play") { const dt = a.state.peekUntil - Date.now(); if (dt > -600 && dt < 300) { TCL.Presenter.push(true); TCL.UI.rerender(); } } }, 250);
})();
