/* src/games/commonground.js  Common Ground: breakout rooms, find unusual similarities. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  TCL.Games.register({
    id: "commonground", name: "Common Ground", tagline: "Breakout rooms. Find what you share.", category: "Bonding",
    description: "Teams go to Zoom breakout rooms to find unusual things everyone in the team has in common, then present them to the room.",
    icon: UI.icons.people, contentGame: "commonground", modes: ["teams"], needsBreakout: true, needsZoom: "Open breakout rooms from the Zoom toolbar and broadcast the message below",
    defaultSettings: { breakoutMinutes: 6, similarities: 3, differences: 0, allowWork: false, everyoneContributes: true, presentSeconds: 60, pointsPerSimilarity: 5, unusualBonus: 10, spokesperson: "random", customInstructions: "", scoringEnabled: false, sound: true },
    settingsSchema: [f.minutes("breakoutMinutes", "Breakout duration", 3, 20), f.count("similarities", "Similarities required", 1, 6), f.count("differences", "Differences required (one per person)", 0, 3), f.toggle("allowWork", "Allow work-related answers"), f.toggle("everyoneContributes", "Every person must contribute one item"),
      f.seconds("presentSeconds", "Presentation time per team", 30, 180, 15), f.number("pointsPerSimilarity", "Points per valid similarity", 0, 50), f.number("unusualBonus", "Bonus for the most unusual similarity", 0, 50), f.select("spokesperson", "Spokesperson", [{ value: "random", label: "Chosen at random" }, { value: "manual", label: "Team decides" }]), f.textarea("customInstructions", "Custom instructions (optional, replaces the built-in brief)")].concat(K.common()),
    summary(s, ctx) { return `${s.breakoutMinutes} min breakout + ${ctx.teams} × ${s.presentSeconds}s presentations`; },
    estimateMinutes(s, ctx) { return 1.5 + s.breakoutMinutes + 0.5 + (ctx.teams * (s.presentSeconds + 10)) / 60 + 0.5; },
    validate(s, ctx) { return ctx.teams.length < 2 ? [{ level: "warn", message: "Common Ground works best with at least 2 teams." }] : []; },
    init(ctx) {
      const brief = ctx.settings.customInstructions || (ctx.content({ game: "commonground", count: 1 }).items[0] || {}).text || "Find three things everyone in your team has in common that are not about work.";
      const spokes = {}; ctx.targets.forEach(t => { const m = t.memberIds.filter(id => ctx.participants.some(p => p.id === id)); spokes[t.id] = ctx.settings.spokesperson === "random" && m.length ? U.pick(m) : null; });
      return { phase: "brief", brief, spokes, presentIdx: 0, presented: [], counts: {}, finished: false };
    },
    actions: {
      startBreakout(ctx) { ctx.state.phase = "breakout"; ctx.breakout.start(ctx.settings.breakoutMinutes * 60000, "Breakout", 60000); },
      endBreakout(ctx) { ctx.breakout.stop(); ctx.state.phase = "present"; ctx.state.presentIdx = 0; },
      startPresent(ctx) { ctx.timer.start(ctx.settings.presentSeconds * 1000, "Presentation", 10000); },
      nextTeam(ctx) { const st = ctx.state; st.presented.push(st.presentIdx); if (st.presentIdx >= ctx.targets.length - 1) { st.phase = "done"; st.finished = true; ctx.timer.stop(); } else { st.presentIdx += 1; ctx.timer.stop(); } },
      prevTeam(ctx) { const st = ctx.state; if (st.presentIdx > 0) st.presentIdx -= 1; st.finished = false; st.phase = "present"; },
      setCount(ctx, arg) { const a = K.arg(arg); ctx.state.counts[a.id] = Number(a.n) || 0; },
      awardCount(ctx, id) { const n = ctx.state.counts[id] || 0; if (!n) return; ctx.score(id, n * ctx.settings.pointsPerSimilarity, `${n} similarities`, 0); },
      unusual(ctx, id) { ctx.score(id, ctx.settings.unusualBonus, "most unusual", 0); },
      backToBrief(ctx) { ctx.state.phase = "brief"; ctx.state.finished = false; },
      reopen(ctx) { ctx.state.finished = false; ctx.state.phase = "present"; },
    },
    noUndo: ["setCount"],
    isComplete: ctx => !!ctx.state.finished,
    broadcast(ctx) {
      const s = ctx.settings, st = ctx.state;
      return `COMMON GROUND · ${s.breakoutMinutes} minutes in your breakout room\nTask: ${st.brief}\nRules: ${s.similarities} similarities${s.differences ? `, plus ${s.differences} difference(s) each` : ""}. ${s.allowWork ? "Work topics allowed." : "Nothing work-related."} ${s.everyoneContributes ? "Everyone contributes at least one." : ""}\nSpokesperson presents for ${s.presentSeconds} seconds when we return.\nCome back to the main room when the timer ends.\n\nTeams:\n${K.rosterText(ctx)}`;
    },
    console(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.phase === "brief" || st.phase === "breakout") {
        return `<div class="stage"><span class="eyebrow gold">${st.phase === "brief" ? "Brief the room" : "Breakout rooms running"}</span><div class="prompt sm">${esc(st.brief)}</div>
          <ol class="step-list" style="margin:10px 0"><li>Read the task aloud. Rules: <b>${s.similarities}</b> similarities${s.differences ? `, <b>${s.differences}</b> differences each` : ""}, ${s.allowWork ? "work topics allowed" : "nothing about work"}.</li><li>Open breakout rooms in Zoom (one per team, ${s.breakoutMinutes} minutes) and assign people as listed.</li><li>Broadcast the message below to all rooms.</li><li>Start the breakout timer here so the presentation shows it.</li></ol>
          ${K.copyBox("cg-msg", this.broadcast(ctx), "Zoom broadcast message")}
          <div class="row" style="margin-top:8px">${UI.ring("breakout")}<div class="ctl-row">${st.phase === "brief" ? `<button class="btn big" data-act="startBreakout">${UI.icon("play")} Start breakout timer (${s.breakoutMinutes} min)</button>` : `<button class="btn" data-act="endBreakout">Everyone is back: start presentations ${UI.icon("next")}</button>`}</div></div>
          <div class="grid cols-3" style="margin-top:14px">${ctx.targets.map(t => `<div class="card" style="border-top:3px solid ${t.color}"><b>${esc(t.name)}</b><div class="small muted" style="margin-top:4px">${t.memberIds.map(id => esc(ctx.name(id))).join(", ") || "—"}</div>${st.spokes[t.id] ? `<div class="small" style="margin-top:6px">Spokesperson: <b>${esc(ctx.name(st.spokes[t.id]))}</b></div>` : ""}</div>`).join("")}</div></div>`;
      }
      if (st.phase === "done") return K.finished(ctx, "All teams have presented.");
      const t = ctx.targets[st.presentIdx];
      return `<div class="stage"><div class="row between"><span class="eyebrow gold">Presentations · ${st.presentIdx + 1} of ${ctx.targets.length}</span><span class="chip mono">${s.presentSeconds}s each</span></div>
        ${K.banner([{ text: "Presenting:" }, { text: t.name, strong: true }, { text: st.spokes[t.id] ? "· spokesperson " + ctx.name(st.spokes[t.id]) : "" }], t.color)}
        <div class="row" style="margin-top:10px">${UI.ring("round")}<div class="ctl-row"><button class="btn ghost" data-act="startPresent">${UI.icon("clock")} Start ${s.presentSeconds}s</button></div></div>
        ${ctx.scoringEnabled ? `<div class="row" style="margin-top:12px;gap:10px"><label class="small muted" for="cg-n">Valid similarities found</label><input class="input sm num" id="cg-n" type="number" min="0" max="20" value="${st.counts[t.id] || ""}" data-act-change='setCount' data-arg-id="${t.id}"><button class="btn sm" data-act="awardCount" data-arg="${t.id}" ${ctx.scored(t.id, `${st.counts[t.id] || 0} similarities`, 0) ? "disabled" : ""}>Award ${(st.counts[t.id] || 0) * s.pointsPerSimilarity} pts</button></div>
        ${K.awardRow(ctx, "unusual", s.unusualBonus, { label: "Most unusual similarity (bonus, once)", reason: "most unusual", round: 0, allowRepeat: false })}` : ""}
        <div class="ctl-row" style="margin-top:14px"><button class="btn ghost" data-act="prevTeam" ${st.presentIdx === 0 ? "disabled" : ""}>${UI.icon("prev")} Previous team</button><button class="btn" data-act="nextTeam">${st.presentIdx >= ctx.targets.length - 1 ? "Finish" : "Next team"} ${UI.icon("next")}</button><button class="btn subtle" data-act="backToBrief">Back to brief</button></div></div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings;
      if (st.phase === "brief" || st.phase === "breakout") return [{ type: "eyebrow", text: "Common Ground" }, { type: "prompt", text: st.brief }, K.pInstr([`Find ${s.similarities} things everyone shares${s.differences ? ` and ${s.differences} difference(s) each` : ""}`, s.allowWork ? "Work topics are allowed" : "Nothing work-related", s.everyoneContributes ? "Everyone contributes at least one" : "Any team member can contribute", `Spokesperson presents for ${s.presentSeconds} seconds`, "Return to the main room when the timer ends"]), { type: "teams" }, K.pTimer("breakout")];
      if (st.phase === "done") return [{ type: "eyebrow", text: "Common Ground" }, { type: "title", text: "That is every team. What did we learn?" }];
      const t = ctx.targets[st.presentIdx];
      return [{ type: "eyebrow", text: `Common Ground · presentations` }, K.pBanner([{ text: "Now presenting:" }, { text: t.name, strong: true }], t.color), { type: "text", text: st.spokes[t.id] ? `Spokesperson: ${ctx.name(st.spokes[t.id])}` : "" }, K.pTimer("round")];
    },
  });
  /* setCount receives {id,n}: wire the number input to send both */
  document.addEventListener("change", e => { const el = e.target; if (el.id === "cg-n" && el.dataset.argId) { TCL.Runner.act("setCount", JSON.stringify({ id: el.dataset.argId, n: el.value })); } });
})();
