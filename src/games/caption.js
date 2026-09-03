/* src/games/caption.js  Caption This. */
(function () {
  "use strict";
  const TCL = window.TCL, U = TCL.util, esc = U.esc, UI = TCL.UI, K = TCL.GameKit, f = K.f;
  const deck = K.deckActions("images", { secondsKey: "seconds", timerLabel: "Writing", onEnter: ctx => { ctx.state.phase = "write"; ctx.state.captions = {}; ctx.state.votes = {}; ctx.state.revealed = false; ctx.timer.stop(); } });
  TCL.Games.register({
    id: "caption", name: "Caption This", tagline: "One picture. Funniest caption wins.", category: "Creative",
    description: "Teams write captions for an image and send them in Zoom chat. The facilitator enters them, everyone votes or the facilitator judges.",
    icon: UI.icons.content, contentGame: "images", flexKey: "count", needsZoom: "Teams send captions by chat (private to the facilitator for anonymity)",
    defaultSettings: { count: 3, seconds: 90, captionsPerTeam: 1, anonymous: true, judging: "vote", noSelfVote: true, points1: 10, points2: 6, points3: 3, unusedOnly: true, scoringEnabled: true, sound: true },
    settingsSchema: [f.count("count", "Number of images", 1, 10), f.seconds("seconds", "Writing time", 30, 240, 15), f.count("captionsPerTeam", "Captions per team", 1, 3), f.toggle("anonymous", "Show captions anonymously until results"), f.select("judging", "Judging", [{ value: "vote", label: "Participants vote (enter counts)" }, { value: "facilitator", label: "Facilitator picks 1st, 2nd, 3rd" }]), f.toggle("noSelfVote", "Teams may not vote for their own caption"), f.number("points1", "1st place points", 0, 50), f.number("points2", "2nd place points", 0, 50), f.number("points3", "3rd place points", 0, 50), f.unused()].concat(K.common()),
    summary(s, ctx) { return `${s.count} images × (${s.seconds}s writing + voting)`; },
    estimateMinutes(s, ctx) { return K.est(s.count, s.seconds + 60 + ctx.teams * 8, 20); },
    validate() { return []; },
    init(ctx) {
      const st = K.deckInit(ctx, "images", ctx.settings.count);
      st.items = st.items.filter(i => (i.use || []).includes("caption"));
      if (st.items.length < ctx.settings.count) { const more = ctx.content({ game: "images", count: ctx.settings.count * 3, excludeIds: st.contentIds }).items.filter(i => (i.use || []).includes("caption")).slice(0, ctx.settings.count - st.items.length); st.items.push(...more.map(U.clone)); st.contentIds.push(...more.map(i => i.id)); }
      if (st.items.length < ctx.settings.count) { const txt = ctx.content({ game: "captions", count: ctx.settings.count - st.items.length, unusedOnly: true }).items; st.items.push(...txt.map(t => ({ id: t.id, title: t.text, svg: "", textOnly: true }))); st.contentIds.push(...txt.map(t => t.id)); }
      st.phase = "write"; st.captions = {}; st.votes = {};
      return st;
    },
    actions: Object.assign({}, deck, {
      startWriting(ctx) { ctx.state.phase = "write"; ctx.timer.start(ctx.settings.seconds * 1000, "Writing", 15000); },
      collect(ctx) { ctx.state.phase = "collect"; ctx.timer.pause(); },
      show(ctx) { ctx.state.phase = "show"; ctx.state.revealed = false; },
      results(ctx) { ctx.state.phase = "results"; ctx.state.revealed = true; },
      setCaption(ctx, arg) { const a = K.arg(arg); ctx.state.captions[a.id] = a.text; },
      setVotes(ctx, arg) { const a = K.arg(arg); ctx.state.votes[a.id] = Number(a.n) || 0; },
      awardPlaces(ctx) {
        const st = ctx.state, s = ctx.settings;
        const ranked = U.sortBy(ctx.targets.filter(t => (st.captions[t.id] || "").trim()), t => st.votes[t.id] || 0, true);
        [s.points1, s.points2, s.points3].forEach((pts, i) => { if (ranked[i] && pts && !ctx.scored(ranked[i].id, `place ${i + 1}`, st.index)) ctx.score(ranked[i].id, pts, `place ${i + 1}`, st.index); });
        st.phase = "results"; st.revealed = true;
      },
      place(ctx, arg) { const a = K.arg(arg); const pts = [ctx.settings.points1, ctx.settings.points2, ctx.settings.points3][a.place - 1]; if (pts) ctx.score(a.id, pts, `place ${a.place}`, ctx.state.index); ctx.state.phase = "results"; ctx.state.revealed = true; },
    }),
    noUndo: ["setCaption", "setVotes"],
    hotkeys: { n: "next" },
    isComplete: K.deckComplete,
    console(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return K.finished(ctx, "All captions judged.");
      const entered = ctx.targets.filter(t => (st.captions[t.id] || "").trim());
      return `<div class="stage">${K.head(ctx, `Caption This · ${st.phase}`)}
        <div class="row" style="gap:14px;align-items:flex-start">${it.svg ? `<div class="svg-frame sm">${it.svg}</div>` : `<div class="prompt sm">${esc(it.title)}</div>`}<div class="stack" style="flex:1">
          <div class="ctl-row">${UI.ring("round")}<button class="btn ${st.phase === "write" ? "" : "ghost"}" data-act="startWriting">${UI.icon("play")} Writing ${s.seconds}s</button><button class="btn ${st.phase === "collect" ? "" : "ghost"}" data-act="collect">Collect captions</button><button class="btn ${st.phase === "show" ? "" : "ghost"}" data-act="show" ${entered.length ? "" : "disabled"}>${UI.icon("screen")} Show captions</button></div>
          <div class="small muted">${s.captionsPerTeam} caption${s.captionsPerTeam > 1 ? "s" : ""} per team, sent ${s.anonymous ? "by private chat to you" : "in chat"}. Paste them below.</div></div></div>
        <div class="grid cols-2" style="margin-top:12px">${ctx.targets.map(t => `<div class="field"><label for="cap-${t.id}" style="color:${t.color}">${esc(t.name)}</label><textarea class="input sm" id="cap-${t.id}" rows="2" data-caption-team="${t.id}" placeholder="Paste caption…">${esc(st.captions[t.id] || "")}</textarea>${st.phase === "show" || st.phase === "results" ? (s.judging === "vote" ? `<div class="row" style="gap:6px"><input class="input sm num" type="number" min="0" value="${st.votes[t.id] || ""}" placeholder="votes" data-vote-team="${t.id}" aria-label="Votes for ${esc(t.name)}"></div>` : `<div class="btn-row">${[1, 2, 3].map(pl => `<button class="btn xs ${ctx.scored(t.id, `place ${pl}`, st.index) ? "" : "ghost"}" data-act="place" data-arg='${JSON.stringify({ id: t.id, place: pl })}'>${["1st", "2nd", "3rd"][pl - 1]}</button>`).join("")}</div>`) : ""}</div>`).join("")}</div>
        ${st.phase === "show" && s.judging === "vote" ? `<div class="ctl-row" style="margin-top:10px"><button class="btn green" data-act="awardPlaces">${UI.icon("trophy")} Award 1st/2nd/3rd by votes</button><span class="dim small">${s.noSelfVote ? "Remind teams: no voting for your own caption." : ""}</span></div>` : ""}
        ${K.nav(ctx, { timer: false, reveal: false })}</div>`;
    },
    presentation(ctx) {
      const st = ctx.state, s = ctx.settings, it = K.current(st);
      if (st.finished || !it) return [{ type: "eyebrow", text: "Caption This" }, { type: "title", text: "Comedy hour over. Thank you." }];
      const b = [{ type: "eyebrow", text: `Caption This · ${st.index + 1} of ${st.items.length}` }];
      if (it.svg) b.push({ type: "image", svg: it.svg }); else b.push({ type: "prompt", text: it.title });
      if (st.phase === "write") b.push({ type: "text", text: `Write ${s.captionsPerTeam > 1 ? s.captionsPerTeam + " captions" : "a caption"} and send ${s.anonymous ? "it privately to the facilitator" : "it in chat"}.` }, K.pTimer());
      if (st.phase === "collect") b.push({ type: "text", text: "Collecting captions…" });
      if (st.phase === "show" || st.phase === "results") { const rows = ctx.targets.filter(t => (st.captions[t.id] || "").trim()); const ranked = st.phase === "results" && s.judging === "vote" ? U.sortBy(rows, t => st.votes[t.id] || 0, true) : rows; b.push({ type: "messages", items: ranked.map(t => ({ text: st.captions[t.id], from: st.phase === "results" || !s.anonymous ? t.name + (st.phase === "results" && s.judging === "vote" ? ` · ${st.votes[t.id] || 0} votes` : "") : "" })) }); if (st.phase === "show") b.push({ type: "text", text: s.judging === "vote" ? `Vote for the funniest${s.noSelfVote ? " (not your own)" : ""}: type the caption number in chat.` : "The facilitator is judging…" }); }
      return b;
    },
  });
  document.addEventListener("change", e => { const el = e.target; if (el.dataset.captionTeam) TCL.Runner.act("setCaption", JSON.stringify({ id: el.dataset.captionTeam, text: el.value })); if (el.dataset.voteTeam && TCL.Runner.current() && TCL.Runner.current().gameId === "caption") TCL.Runner.act("setVotes", JSON.stringify({ id: el.dataset.voteTeam, n: el.value })); });
})();
