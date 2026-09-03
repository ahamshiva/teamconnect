/* src/games/mission.js  Team Mission: distributed clues, one shared puzzle. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("missions", { secondsKey: "minutes", timerLabel: "Mission", onEnter: ctx => { const st = ctx.state; st.revealedClues = 0; st.hintsUsed = 0; st.solved = {}; st.revealed = false; st.assign = assign(ctx); ctx.timer.stop(); ctx.breakout.stop(); } });
  function assign(ctx) { const it = K.current(ctx.state); if (!it) return {}; const people = ctx.participants.map(p => p.id); const out = {}; it.clues.forEach((c, i) => { out[i] = people.length ? people.filter((_, j) => j % it.clues.length === i) : []; }); return out; }
  TCL.Games.register({
    id: "mission", name: "Team Mission", tagline: "Everyone holds a piece. Solve it together.", category: "Bonding",
    description: "Each person or subgroup holds one clue. The team must share and combine them to solve the puzzle. Hints cost points; speed earns a bonus.",
    icon: UI.icons.lock, contentGame: "missions", flexKey: "count", needsBreakout: s => s.room === "breakout", needsZoom: "Send each clue to its holder by private chat, or read clues aloud one by one",
    defaultSettings: { count: 1, minutes: 8, difficultyMin: 1, difficultyMax: 3, hints: 2, hintPenalty: 5, clueMode: "progressive", room: "main", pointsSolve: 20, timeBonus: true, timeBonusPoints: 10, participationBonus: 5, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of missions", 1, 5), f.minutes("minutes", "Time limit per mission", 3, 20), f.diffMin(), f.diffMax(), f.count("hints", "Hints available", 0, 3), f.number("hintPenalty", "Points lost per hint", 0, 20), f.select("clueMode", "Clue reveal", [{ value: "simultaneous", label: "All clues at once" }, { value: "progressive", label: "One clue at a time" }, { value: "private", label: "Private: each holder gets their clue by chat, screen shows nothing" }]), f.select("room", "Where teams work", [{ value: "main", label: "Main room, whole group" }, { value: "breakout", label: "Breakout rooms, each team solves it" }]), f.number("pointsSolve", "Points for a correct solution", 0, 100), f.toggle("timeBonus", "Time bonus if solved with time to spare"), f.number("timeBonusPoints", "Time bonus points", 0, 50), f.number("participationBonus", "Participation bonus (every team that submits)", 0, 20), f.unused()].concat(K.common()),
    summary(s) { return `${s.count} mission${s.count > 1 ? "s" : ""} × ${s.minutes} min, ${s.hints} hints`; },
    estimateMinutes(s) { return s.count * (s.minutes + 4) + 1; },
    validate(s, ctx) { const sel = ctx.content({ count: s.count, difficultyMin: s.difficultyMin, difficultyMax: s.difficultyMax }); return sel.pool < s.count ? [{ level: "warn", message: `Only ${sel.pool} missions match; ${s.count} requested.` }] : []; },
    init(ctx) { const st = K.deckInit(ctx, "missions", ctx.settings.count); st.revealedClues = 0; st.hintsUsed = 0; st.solved = {}; ctx.state = st; st.assign = assign(ctx); return st; },
    actions: Object.assign({}, deck, {
      start(ctx) { const s = ctx.settings; const ms = s.minutes * 60000; if (s.room === "breakout") ctx.breakout.start(ms, "Mission", 60000); else ctx.timer.start(ms, "Mission", 60000); if (s.clueMode === "simultaneous") ctx.state.revealedClues = K.current(ctx.state).clues.length; },
      nextClue(ctx) { const st = ctx.state; st.revealedClues = Math.min(K.current(st).clues.length, st.revealedClues + 1); },
      allClues(ctx) { ctx.state.revealedClues = K.current(ctx.state).clues.length; },
      hint(ctx) { const st = ctx.state, s = ctx.settings; if (st.hintsUsed >= s.hints) return; st.hintsUsed += 1; if (s.hintPenalty && ctx.scoringEnabled) ctx.targets.forEach(t => ctx.score(t.id, -s.hintPenalty, `hint ${st.hintsUsed}`, st.index)); },
      solved(ctx, id) { const st = ctx.state, s = ctx.settings; if (st.solved[id]) return; st.solved[id] = true; const timerRem = s.room === "breakout" ? ctx.breakout.remaining() : ctx.timer.remaining(); ctx.score(id, s.pointsSolve, "solved", st.index); if (s.timeBonus && timerRem > (s.minutes * 60000) / 3) ctx.score(id, s.timeBonusPoints, "time bonus", st.index); if (s.participationBonus) ctx.score(id, s.participationBonus, "participation", st.index); },
      attempted(ctx, id) { const st = ctx.state, s = ctx.settings; if (s.participationBonus && !ctx.scored(id, "participation", st.index)) ctx.score(id, s.participationBonus, "participation", st.index); },
      reveal(ctx) { ctx.state.revealed = true; ctx.timer.pause(); ctx.breakout.stop(); },
    }),
    hotkeys: { n: "next", c: "nextClue", r: "reveal" },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it && !ctx.state.revealed ? esc(it.solution) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "Missions complete.");
      const timerName = s.room === "breakout" ? "breakout" : "round";
      const clueText = it.clues.map((c, i) => `Clue ${i + 1} (${(st.assign[i] || []).map(id => ctx.name(id)).join(", ") || "anyone"}): ${c}`).join("\n");
      return `<div class="stage">${K.head(ctx, `Team Mission · ${it.category} · ${K.stars(it.difficulty)}`)}
        <div class="prompt sm">${esc(it.text)}</div><p class="muted">${esc(it.brief)}</p>
        <div class="row" style="margin-top:8px">${UI.ring(timerName)}<div class="ctl-row"><button class="btn" data-act="start">${UI.icon("play")} Start mission (${s.minutes} min)</button>${s.clueMode === "progressive" ? `<button class="btn ghost" data-act="nextClue" ${st.revealedClues >= it.clues.length ? "disabled" : ""}>Reveal clue ${Math.min(it.clues.length, st.revealedClues + 1)} <span class="kbd">C</span></button><button class="btn subtle" data-act="allClues">All clues</button>` : ""}<button class="btn ghost" data-act="hint" ${st.hintsUsed >= s.hints ? "disabled" : ""}>💡 Hint ${st.hintsUsed}/${s.hints}${s.hintPenalty ? ` (−${s.hintPenalty} each team)` : ""}</button><button class="btn green" data-act="reveal" ${st.revealed ? "disabled" : ""}>${UI.icon("eye")} Reveal solution</button></div></div>
        <div class="grid cols-2" style="margin-top:12px"><div><div class="eyebrow">Clues and holders</div><ol class="step-list" style="margin-top:8px">${it.clues.map((c, i) => `<li><div><div>${i < st.revealedClues || s.clueMode === "private" ? esc(c) : `<span class="dim">hidden until revealed</span>`}</div><div class="tiny dim">${(st.assign[i] || []).map(id => esc(ctx.name(id))).join(", ") || "anyone"}</div></div></li>`).join("")}</ol>${K.copyBox("ms-clues", clueText, "Clues with holders (send each line privately, or paste for breakout rooms)")}</div>
          <div><div class="private"><span class="eyebrow">Private · solution</span><div class="ans" style="font-size:16px">${esc(it.solution)}</div></div>${it.hints && it.hints.length ? `<div class="private" style="margin-top:8px"><span class="eyebrow">Hints (read aloud in order)</span><ol style="margin:6px 0 0 18px" class="small">${it.hints.map((h, i) => `<li style="${i < st.hintsUsed ? "" : "opacity:.5"}">${esc(h)}</li>`).join("")}</ol></div>` : ""}
          ${ctx.scoringEnabled ? `<div style="margin-top:10px"><div class="eyebrow" style="margin-bottom:6px">Solved correctly (+${s.pointsSolve}${s.timeBonus ? ", time bonus +" + s.timeBonusPoints : ""})</div>${UI.awardButtons(ctx.targets, "solved", s.pointsSolve, { done: id => !!st.solved[id] })}${s.participationBonus ? `<div class="eyebrow" style="margin:8px 0 6px">Submitted an answer (+${s.participationBonus})</div>${UI.awardButtons(ctx.targets, "attempted", s.participationBonus, { done: id => ctx.scored(id, "participation", st.index) })}` : ""}</div>` : ""}</div></div>
        ${K.nav(ctx, { timer: false, reveal: false })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Team Mission" }, { type: "title", text: "Mission accomplished." }];
      const b = [{ type: "eyebrow", text: `Team Mission · ${st.index + 1} of ${st.items.length}` }, { type: "title", text: it.text }, { type: "text", text: it.brief }];
      if (st.revealed) b.push({ type: "answer", text: it.solution });
      else if (s.clueMode !== "private" && st.revealedClues) b.push({ type: "list", items: it.clues.slice(0, st.revealedClues).map((c, i) => `${(st.assign[i] || []).map(id => ctx.name(id)).join(", ") || "Clue"}: ${c}`), numbered: true });
      else if (s.clueMode === "private") b.push({ type: "text", text: "Check your private chat for your clue. Share it with your team, in your own words." });
      if (st.hintsUsed && !st.revealed) b.push({ type: "text", text: `Hints used: ${st.hintsUsed} of ${s.hints}` });
      b.push(K.pTimer(s.room === "breakout" ? "breakout" : "round"));
      return b;
    },
  });
})();
