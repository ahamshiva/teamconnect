/* src/games/twotruths.js  Two Truths and a Lie. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  TCL.Games.register({
    id: "twotruths", name: "Two Truths and a Lie", tagline: "Three stories. One is a lie.", category: "Bonding",
    description: "A spotlight participant tells three short statements about themselves. Teams confer and vote on the lie. Catch it for points; fool everyone for a bonus.",
    icon: UI.icons.eye, contentGame: "truths", flexKey: "count", needsZoom: "Teams vote by chat, reactions or a spokesperson",
    defaultSettings: { count: 6, seconds: 90, discussionSeconds: 45, selection: "random", topicPrompts: true, pointsCatch: 10, pointsFool: 15, multipleWinners: true, voting: "chat", scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of spotlight participants", 1, 30), f.seconds("seconds", "Spotlight time (telling the stories)", 30, 180, 15), f.seconds("discussionSeconds", "Discussion and voting time", 15, 120, 15), f.select("selection", "Participant selection", [{ value: "random", label: "Random order, everyone present" }, { value: "manual", label: "Facilitator picks each spotlight" }]), f.toggle("topicPrompts", "Show topic prompts to help people think of stories"),
      f.number("pointsCatch", "Points for catching the lie", 0, 50), f.number("pointsFool", "Points for fooling everyone", 0, 50), f.toggle("multipleWinners", "Several teams can catch the lie"), f.select("voting", "Voting method", [{ value: "chat", label: "Type 1, 2 or 3 in chat" }, { value: "reactions", label: "Zoom reactions" }, { value: "spokesperson", label: "Spokesperson says it aloud" }, { value: "fingers", label: "Fingers on camera" }])].concat(K.common()),
    summary(s) { return `${s.count} spotlights × (${s.seconds}s + ${s.discussionSeconds}s vote)`; },
    estimateMinutes(s) { return K.est(s.count, s.seconds + s.discussionSeconds, 20); },
    validate(s, ctx) { return ctx.participants.length < s.count ? [{ level: "info", message: `${ctx.participants.length} people present; ${s.count} spotlights requested. Extra rounds will loop.` }] : []; },
    init(ctx) {
      const s = ctx.settings;
      const order = s.selection === "random" ? K.spotlightOrder(ctx, s.count) : [];
      const topics = ctx.content({ game: "truths", count: s.count, unusedOnly: true }).items.map(i => i.text);
      return { order, topics, index: 0, phase: "tell", finished: false, manualPid: null, revealed: false, lieIndex: null, contentIds: [] };
    },
    actions: {
      startTell(ctx) { ctx.state.phase = "tell"; ctx.timer.start(ctx.settings.seconds * 1000, "Spotlight", 10000); },
      startVote(ctx) { ctx.state.phase = "vote"; ctx.timer.start(ctx.settings.discussionSeconds * 1000, "Voting", 10000); },
      reveal(ctx) { ctx.state.revealed = true; ctx.state.phase = "reveal"; ctx.timer.pause(); },
      setLie(ctx, n) { ctx.state.lieIndex = Number(n); },
      catchLie(ctx, id) { const st = ctx.state, s = ctx.settings; if (!s.multipleWinners && ctx.events().some(e => e.round === st.index && e.reason === "caught the lie")) { TCL.emit("ui:toast", { text: "Only one team can catch the lie in this round.", kind: "warn" }); return; } ctx.score(id, s.pointsCatch, "caught the lie", st.index); },
      fooled(ctx) { const st = ctx.state; const pid = currentPid(ctx); const t = pid ? ctx.targetOf(pid) : null; if (t) ctx.score(t.id, ctx.settings.pointsFool, "fooled everyone", st.index); },
      next(ctx) { const st = ctx.state; if (st.index >= ctx.settings.count - 1) { st.finished = true; ctx.timer.stop(); return; } st.index += 1; st.phase = "tell"; st.revealed = false; st.lieIndex = null; st.manualPid = null; ctx.timer.stop(); },
      prev(ctx) { const st = ctx.state; if (st.index > 0) { st.index -= 1; st.phase = "tell"; st.revealed = false; st.finished = false; } },
      skip(ctx) { this.next(ctx); },
      swapPerson(ctx) { const st = ctx.state; const used = new Set(st.order); const cand = ctx.participants.map(p => p.id).filter(id => !used.has(id)); const pool = cand.length ? cand : ctx.participants.map(p => p.id); st.order[st.index] = U.pick(pool); },
      setPerson(ctx, pid) { ctx.state.manualPid = pid; },
      reopen(ctx) { ctx.state.finished = false; },
    },
    noUndo: ["setLie", "setPerson"],
    actionLabels: { catchLie: "Caught the lie", fooled: "Fooled everyone", next: "Next spotlight" },
    hotkeys: { n: "next", r: "reveal", v: "startVote", t: "startTell" },
    isComplete: ctx => !!ctx.state.finished,
    console(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.finished) return K.finished(ctx, "Everyone has had the spotlight.");
      const pid = currentPid(ctx);
      const t = pid ? ctx.targetOf(pid) : null;
      const topic = s.topicPrompts ? st.topics[st.index % Math.max(1, st.topics.length)] : "";
      return `<div class="stage"><div class="row between"><span class="eyebrow gold">Two Truths and a Lie · spotlight ${st.index + 1} of ${s.count} · ${st.phase}</span></div>
        ${s.selection === "manual" ? `<div class="row"><span class="small muted">Spotlight</span><select class="input sm" data-act-change="setPerson" style="width:220px"><option value="">Choose a person…</option>${ctx.participants.map(p => `<option value="${p.id}" ${st.manualPid === p.id ? "selected" : ""}>${esc(p.displayName || p.name)}</option>`).join("")}</select></div>` : K.banner([{ text: "Spotlight:" }, { text: ctx.name(pid), strong: true }, { text: t ? "· " + t.name : "" }], t && t.color) + `<button class="btn xs ghost" data-act="swapPerson" style="margin-left:8px">Swap person</button>`}
        ${topic ? `<div class="small muted" style="margin-top:8px">Topic idea: <b>${esc(topic)}</b></div>` : ""}
        <div class="row" style="margin-top:8px">${UI.ring("round")}<div class="ctl-row"><button class="btn ${st.phase === "tell" ? "" : "ghost"}" data-act="startTell">${UI.icon("play")} Tell stories ${s.seconds}s <span class="kbd">T</span></button><button class="btn ${st.phase === "vote" ? "blue" : "ghost"}" data-act="startVote">${UI.icon("clock")} Vote ${s.discussionSeconds}s <span class="kbd">V</span></button><button class="btn green" data-act="reveal" ${st.revealed ? "disabled" : ""}>${UI.icon("eye")} Reveal the lie <span class="kbd">R</span></button></div></div>
        <div class="row" style="margin-top:8px;gap:8px"><span class="small muted">Which statement was the lie?</span>${[1, 2, 3].map(n => `<button class="btn xs ${st.lieIndex === n ? "" : "ghost"}" data-act="setLie" data-arg="${n}">#${n}</button>`).join("")}<span class="dim small">Voting: ${esc(({ chat: "type 1, 2 or 3 in chat", reactions: "Zoom reactions", spokesperson: "spokesperson says it", fingers: "fingers on camera" })[s.voting])}</span></div>
        ${ctx.scoringEnabled ? K.awardRow(ctx, "catchLie", s.pointsCatch, { label: "Teams that caught the lie", reason: "caught the lie", exclude: t ? [t.id] : [] }) + `<div style="margin-top:8px"><button class="btn team" style="--tc:${t ? t.color : "var(--gold)"}" data-act="fooled" ${!t || ctx.scored(t.id, "fooled everyone", st.index) ? "disabled" : ""}>🎭 Fooled everyone: ${t ? esc(t.name) : "no team"} +${s.pointsFool}</button></div>` : ""}
        <div class="ctl-row" style="margin-top:14px"><button class="btn ghost" data-act="prev" ${st.index === 0 ? "disabled" : ""}>${UI.icon("prev")} Previous</button><button class="btn" data-act="next">${st.index >= s.count - 1 ? "Finish" : "Next spotlight"} ${UI.icon("next")} <span class="kbd">N</span></button><button class="btn subtle" data-act="skip">Skip</button></div></div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.finished) return [{ type: "eyebrow", text: "Two Truths and a Lie" }, { type: "title", text: "Well lied, everyone." }];
      const pid = currentPid(ctx); const t = pid ? ctx.targetOf(pid) : null;
      const topic = s.topicPrompts ? st.topics[st.index % Math.max(1, st.topics.length)] : "";
      const b = [{ type: "eyebrow", text: `Two Truths and a Lie · ${st.index + 1} of ${s.count}` }, K.pBanner([{ text: "Spotlight:" }, { text: ctx.name(pid), strong: true }], t && t.color)];
      if (st.phase === "tell") b.push({ type: "title", text: "Three statements. One is a lie." }, { type: "text", text: topic ? "Topic idea: " + topic : "" });
      if (st.phase === "vote") b.push({ type: "title", text: "Which one is the lie?" }, { type: "text", text: ({ chat: "Type 1, 2 or 3 in chat.", reactions: "Use a Zoom reaction: 👍 = 1, ❤️ = 2, 🎉 = 3.", spokesperson: "Spokesperson, say your team's answer.", fingers: "Hold up 1, 2 or 3 fingers on camera." })[s.voting] });
      if (st.phase === "reveal") b.push({ type: "answer", text: st.lieIndex ? `The lie was #${st.lieIndex}` : "The lie is revealed" });
      b.push(K.pTimer());
      return b;
    },
  });
  function currentPid(ctx) { const st = ctx.state; if (ctx.settings.selection === "manual") return st.manualPid; return st.order.length ? st.order[st.index % st.order.length] : (ctx.participants[0] || {}).id; }
})();
