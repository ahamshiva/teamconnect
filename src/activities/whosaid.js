/* src/activities/whosaid.js  Who Said That? Anonymous facts, teams guess the person. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("whosaid", { secondsKey: "seconds", timerLabel: "Guess" });
  TCL.Games.register({
    id: "whosaid", name: "Who Said That?", tagline: "Anonymous facts. Guess the colleague.", category: "Bonding",
    description: "Facts submitted by participants appear one at a time. Teams guess who it is about, then the person tells the story.",
    icon: UI.icons.people, contentGame: "whosaid", flexKey: "count", modes: ["teams", "individual"], needsZoom: "Collect facts before the session (chat DM or a form) and add them in Participants",
    defaultSettings: { count: 8, seconds: 45, storySeconds: 45, mode: "teams", selection: "random", includeAbsent: false, blockOwnTeam: true, points: 10, speedBonus: false, speedBonusPoints: 5, multipleWinners: true, autoReveal: false, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of facts", 1, 30), f.seconds("seconds", "Time per fact", 15, 120), f.seconds("storySeconds", "Story time after reveal", 0, 120, 15), f.mode(),
      f.select("selection", "Fact selection", [{ value: "random", label: "Random facts" }, { value: "all", label: "Every submitted fact, in random order" }]), f.toggle("includeAbsent", "Include facts from absent participants"),
      f.toggle("blockOwnTeam", "Prevent the subject's own team from answering"), f.number("points", "Points for a correct guess", 0, 100), f.toggle("speedBonus", "Speed bonus (guess in the first half of the timer)"), f.number("speedBonusPoints", "Speed bonus points", 0, 50),
      f.toggle("multipleWinners", "Allow multiple winning teams"), f.reveal(), f.unused()].concat(K.common()),
    summary(s, ctx) { return `${s.count} facts × ${s.seconds}s + ${s.storySeconds}s story`; },
    estimateMinutes(s) { return K.est(s.count, s.seconds + s.storySeconds, 12); },
    validate(s, ctx) {
      const facts = ctx.participants.filter(p => (p.fact || "").trim()).length;
      const out = [];
      if (!facts) out.push({ level: "warn", message: "No participant facts have been entered. Backup prompts will be used so the round still works. Add facts in Participants (edit a person)." });
      else if (facts < s.count) out.push({ level: "info", message: `${facts} facts are available; ${s.count - facts} rounds will use backup prompts.` });
      return out;
    },
    init(ctx) {
      const s = ctx.settings;
      const pool = (s.includeAbsent ? ctx.allParticipants : ctx.participants).filter(p => (p.fact || "").trim());
      let facts = U.shuffle(pool).map(p => ({ id: "fact_" + p.id, pid: p.id, text: p.fact.trim(), backup: false }));
      if (s.selection === "random") facts = facts.slice(0, s.count);
      const need = Math.max(0, s.count - facts.length);
      let backups = [];
      if (need) { const sel = ctx.content({ game: "whosaid", count: need, unusedOnly: true }); backups = sel.items.map(it => ({ id: it.id, pid: null, text: it.text, backup: true })); }
      const spot = K.spotlightOrder(ctx, need);
      backups.forEach((b, i) => { b.pid = spot[i % Math.max(1, spot.length)] || null; });
      const items = facts.concat(backups);
      return { items, contentIds: backups.map(b => b.id), shortfall: Math.max(0, s.count - items.length), index: 0, revealed: false, finished: false, results: {}, skipped: [], replaced: 0, guessAt: null };
    },
    actions: Object.assign({}, deck, {
      reveal(ctx) { ctx.state.revealed = true; if (ctx.settings.storySeconds) ctx.timer.start(ctx.settings.storySeconds * 1000, "Story time", 10000); else ctx.timer.stop(); },
      award(ctx, targetId) {
        const st = ctx.state, s = ctx.settings;
        if (!s.multipleWinners && ctx.events().some(e => e.round === st.index && e.reason === "correct")) { TCL.emit("ui:toast", { text: "Only one winner allowed for this fact.", kind: "warn" }); return; }
        const fast = s.speedBonus && ctx.timer.remaining() > (s.seconds * 1000) / 2 && !st.revealed;
        ctx.score(targetId, s.points, "correct", st.index);
        if (fast) ctx.score(targetId, s.speedBonusPoints, "speed bonus", st.index);
        st.results[st.index] = st.results[st.index] || []; st.results[st.index].push(targetId);
      },
      replace(ctx) {
        const st = ctx.state;
        const used = new Set(st.items.map(i => i.pid));
        const cand = ctx.participants.filter(p => (p.fact || "").trim() && !used.has(p.id));
        if (cand.length) { const p = cand[0]; st.items[st.index] = { id: "fact_" + p.id, pid: p.id, text: p.fact.trim(), backup: false }; st.revealed = false; return; }
        deck.replace.call(this, ctx);
      },
      skipSensitive(ctx) { const st = ctx.state; st.items.splice(st.index, 1); if (!st.items.length) { st.finished = true; return; } if (st.index >= st.items.length) st.index = st.items.length - 1; st.revealed = false; ctx.log("Removed a sensitive fact"); },
      correctIdentity(ctx, pid) { const it = K.current(ctx.state); if (it && pid) { it.pid = pid; ctx.log("Corrected fact owner"); } },
    }),
    actionLabels: { award: "Award correct guess", skipSensitive: "Skip sensitive fact", correctIdentity: "Correct identity" },
    hotkeys: { r: "reveal", n: "next" },
    onTimerDone(ctx) { if (ctx.settings.autoReveal && !ctx.state.revealed) this.actions.reveal(ctx); },
    isComplete: K.deckComplete,
    privateNote(ctx) { const it = K.current(ctx.state); return it && !ctx.state.revealed ? "It is about: " + esc(ctx.name(it.pid)) : ""; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "All facts done.");
      const owner = ctx.targetOf(it.pid);
      return `<div class="stage">${K.head(ctx, "Who said that?", it.backup ? '<span class="chip warn"><span class="dot"></span>Backup prompt</span>' : "")}
        <div class="prompt ${it.backup ? "sm" : ""}">${esc(it.text)}</div>
        ${it.backup ? `<div class="turn-banner"><span>Spotlight:</span><b>${esc(ctx.name(it.pid))}</b></div>` : ""}
        <div class="row" style="margin-top:8px">${UI.ring("round")}<div class="stack" style="gap:6px"><div class="private"><span class="eyebrow">Private</span><div class="ans">${esc(ctx.name(it.pid))}${owner ? ` <span class="small muted">(${esc(owner.name)})</span>` : ""}</div></div>${st.revealed ? `<div class="answer-box">Revealed: ${esc(ctx.name(it.pid))}. Story time.</div>` : ""}</div></div>
        ${K.awardRow(ctx, "award", s.points, { label: "Who guessed it?", reason: "correct", exclude: s.blockOwnTeam && owner ? [owner.id] : [], allowRepeat: false })}
        ${K.nav(ctx, { extra: `<button class="btn subtle" data-act="skipSensitive" title="Remove this fact from the round entirely">${UI.icon("flag")} Sensitive, remove</button>` })}
        <div class="row" style="margin-top:10px"><label class="small muted" for="ws-fix">Wrong person attached?</label><select class="input sm" id="ws-fix" data-act-change="correctIdentity" style="width:220px"><option value="">Correct identity…</option>${ctx.allParticipants.map(p => `<option value="${p.id}">${esc(p.displayName || p.name)}</option>`).join("")}</select></div>
      </div>`;
    },
    presentation(ctx) {
      const st = ctx.state, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Who Said That?" }, { type: "title", text: "That is everyone. Nicely guessed." }];
      const blocks = [{ type: "eyebrow", text: `Who said that? · ${st.index + 1} of ${st.items.length}` }, { type: "prompt", text: it.backup ? it.text.replace(/^Backup:\s*/, "") : `"${it.text}"` }];
      if (it.backup) blocks.push(K.pBanner([{ text: "Spotlight:" }, { text: ctx.name(it.pid), strong: true }]));
      if (st.revealed) blocks.push({ type: "answer", text: "It was " + ctx.name(it.pid) }, { type: "text", text: "Tell us the story." });
      else blocks.push({ type: "text", text: "Teams: who is this about? Shout it out or post in chat." });
      blocks.push(K.pTimer());
      return blocks;
    },
  });
})();
