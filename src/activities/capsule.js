/* src/activities/capsule.js  Team Time Capsule. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  TCL.Games.register({
    id: "capsule", name: "Team Time Capsule", tagline: "Write to your future selves.", category: "Reflection",
    description: "Teams write predictions, hopes or messages to be opened later. Responses are saved with the session and can be exported.",
    icon: UI.icons.clock, contentGame: "capsule", modes: ["teams", "individual"], needsBreakout: true, needsZoom: "Breakout rooms for team writing, then share in chat",
    defaultSettings: { items: 3, future: "one year", breakoutMinutes: 6, tone: "imaginative", everyoneContributes: true, presentSeconds: 60, voting: false, votePoints: 10, customPrompt: "", scoringEnabled: false, sound: true },
    settingsSchema: [f.count("items", "Items per team", 1, 6), f.select("future", "Future period", [{ value: "six months", label: "Six months" }, { value: "one year", label: "One year" }, { value: "five years", label: "Five years" }]), f.minutes("breakoutMinutes", "Writing time (breakout)", 3, 15), f.select("tone", "Mode", [{ value: "serious", label: "Serious" }, { value: "imaginative", label: "Imaginative" }, { value: "humorous", label: "Humorous" }]), f.toggle("everyoneContributes", "Every person contributes one line"), f.seconds("presentSeconds", "Presentation time per team", 30, 180, 15), f.toggle("voting", "Vote for the best capsule"), f.number("votePoints", "Points for the winning capsule", 0, 50), f.textarea("customPrompt", "Custom prompt (optional)")].concat(K.common()),
    summary(s, ctx) { return `${s.breakoutMinutes} min writing + ${ctx.teams} × ${s.presentSeconds}s sharing`; },
    estimateMinutes(s, ctx) { return 1.5 + s.breakoutMinutes + (ctx.teams * (s.presentSeconds + 10)) / 60 + 0.5; },
    validate() { return []; },
    init(ctx) {
      const s = ctx.settings;
      const cat = ({ serious: "Serious", imaginative: "Imaginative", humorous: "Humorous" })[s.tone];
      const prompt = s.customPrompt || (ctx.content({ game: "capsule", count: 1, categories: [cat] }).items[0] || ctx.content({ game: "capsule", count: 1 }).items[0] || {}).text || "Write a message to the team to be opened later.";
      return { prompt, phase: "write", responses: {}, presentIdx: 0, finished: false, contentIds: [] };
    },
    actions: {
      startWriting(ctx) { ctx.state.phase = "write"; ctx.breakout.start(ctx.settings.breakoutMinutes * 60000, "Writing", 60000); },
      share(ctx) { ctx.state.phase = "share"; ctx.state.presentIdx = 0; ctx.breakout.stop(); },
      startPresent(ctx) { ctx.timer.start(ctx.settings.presentSeconds * 1000, "Sharing", 10000); },
      nextTeam(ctx) { const st = ctx.state; if (st.presentIdx >= ctx.targets.length - 1) { st.phase = "done"; st.finished = true; ctx.timer.stop(); } else st.presentIdx += 1; },
      prevTeam(ctx) { const st = ctx.state; if (st.presentIdx > 0) st.presentIdx -= 1; st.finished = false; st.phase = "share"; },
      setResponse(ctx, arg) { const a = K.arg(arg); ctx.state.responses[a.id] = a.text; },
      voteWin(ctx, id) { ctx.score(id, ctx.settings.votePoints, "best capsule", 0); },
      reopen(ctx) { ctx.state.finished = false; ctx.state.phase = "share"; },
    },
    noUndo: ["setResponse"],
    isComplete: ctx => !!ctx.state.finished,
    exportText(a) { const st = a.state; const s = TCL.session(); return `TIME CAPSULE (${a.settings.future || "one year"}): ${st.prompt}\n` + Object.keys(st.responses || {}).map(id => { const t = U.byId(s.teams, id) || U.byId(s.participants, id); return `  ${t ? t.name : id}: ${st.responses[id]}`; }).join("\n"); },
    summaryView(ctx) { const st = ctx.state; return `<h3>Time capsule contents</h3><p class="muted small">${esc(st.prompt)}</p><div class="stack" style="margin-top:8px">${ctx.targets.map(t => `<div class="msg-card"><div><b style="color:${t.color}">${esc(t.name)}</b><div class="small" style="white-space:pre-wrap">${esc(st.responses[t.id] || "(nothing entered)")}</div></div></div>`).join("")}</div>`; },
    console(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.phase === "done") return K.finished(ctx, "Capsule sealed. Responses are saved with the session and appear in the summary export.");
      const t = ctx.targets[st.presentIdx];
      return `<div class="stage"><div class="row between"><span class="eyebrow gold">Time Capsule · ${st.phase === "write" ? "writing" : "sharing " + (st.presentIdx + 1) + " of " + ctx.targets.length}</span><span class="chip">${esc(s.future)} · ${esc(s.tone)}</span></div>
        <div class="prompt sm">${esc(st.prompt)}</div>
        <div class="small muted">${s.items} items per team.${s.everyoneContributes ? " Everyone contributes at least one line." : ""} Teams post their capsule in chat when they return; paste it below so it is saved.</div>
        ${st.phase === "write" ? `<div class="row" style="margin-top:8px">${UI.ring("breakout")}<div class="ctl-row"><button class="btn" data-act="startWriting">${UI.icon("play")} Start writing timer (${s.breakoutMinutes} min)</button><button class="btn ghost" data-act="share">Everyone is back: share ${UI.icon("next")}</button></div></div>${K.copyBox("tc-msg", `TIME CAPSULE · ${s.breakoutMinutes} minutes\n${st.prompt}\n${s.items} items per team. Post your capsule in the chat when you are back.\n\nTeams:\n${K.rosterText(ctx)}`, "Zoom broadcast message")}` :
        `${K.banner([{ text: "Sharing:" }, { text: t.name, strong: true }], t.color)}<div class="row" style="margin-top:8px">${UI.ring("round")}<div class="ctl-row"><button class="btn ghost" data-act="startPresent">${UI.icon("clock")} ${s.presentSeconds}s</button><button class="btn ghost" data-act="prevTeam" ${st.presentIdx === 0 ? "disabled" : ""}>${UI.icon("prev")}</button><button class="btn" data-act="nextTeam">${st.presentIdx >= ctx.targets.length - 1 ? "Seal the capsule" : "Next team"} ${UI.icon("next")}</button></div></div>`}
        <div class="grid cols-2" style="margin-top:12px">${ctx.targets.map(x => `<div class="field"><label for="tc-${x.id}" style="color:${x.color}">${esc(x.name)}</label><textarea class="input sm" id="tc-${x.id}" rows="4" data-capsule-team="${x.id}" placeholder="Paste the team's capsule…">${esc(st.responses[x.id] || "")}</textarea></div>`).join("")}</div>
        ${s.voting && ctx.scoringEnabled ? K.awardRow(ctx, "voteWin", s.votePoints, { label: "Best capsule by vote", reason: "best capsule", round: 0 }) : ""}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.phase === "done") return [{ type: "eyebrow", text: "Team Time Capsule" }, { type: "title", text: `Sealed until ${s.future} from now.` }];
      if (st.phase === "write") return [{ type: "eyebrow", text: "Team Time Capsule" }, { type: "prompt", text: st.prompt }, K.pInstr([`${s.items} items per team`, s.everyoneContributes ? "Everyone adds at least one line" : "Any team member can write", `Tone: ${s.tone}`, "Post your capsule in chat when you return"]), K.pTimer("breakout")];
      const t = ctx.targets[st.presentIdx];
      return [{ type: "eyebrow", text: "Team Time Capsule · sharing" }, K.pBanner([{ text: "Now sharing:" }, { text: t.name, strong: true }], t.color), st.responses[t.id] ? { type: "messages", items: [{ text: st.responses[t.id], from: t.name }] } : { type: "text", text: "Read your capsule aloud." }, K.pTimer("round")];
    },
  });
  document.addEventListener("change", e => { const el = e.target; if (el.dataset.capsuleTeam) TCL.Runner.act("setResponse", JSON.stringify({ id: el.dataset.capsuleTeam, text: el.value })); });
})();
